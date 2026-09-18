/* ============================================================================
   gen/gantt.js — Gantt-Diagramm bauen, zeichnen und rechnen
   ----------------------------------------------------------------------------
   Nach dem ER-Modell die nächste Zeichnung, die in den Prüfungen wirklich
   vorkommt und für die es noch keine Werkzeuge gab. Herbst 2023 fragt sie
   über drei Teilaufgaben ab (8 BE): erst das Diagramm zeichnen, dann das
   früheste Projektende, dann den größten Puffer.

   Der Trick dabei: alle drei hängen an derselben Vorgangsliste. Wer sie
   einmal richtig aufschreibt — Vorgang, Dauer, Vorgänger — hat den Rest
   gerechnet. Diese Datei macht daraus:

     1. eine Tabelle für die Vorgangsliste (das ist die eigentliche Antwort),
     2. ein Balkendiagramm, das sich beim Tippen mitzeichnet, samt Pfeilen
        für die Abhängigkeiten und rot markiertem kritischem Pfad,
     3. die Rechnung: FAZ, FEZ, SAZ, SEZ, GP und FP je Vorgang, Projektende
        und größter Puffer — dieselbe Funktion, die schon der Netzplan-
        Trainer benutzt (netzRechnen in index.html), damit beide Trainer
        nicht auseinanderlaufen können.

   Das Diagramm zeigt die Rechnung NICHT von selbst: Balken und Pfeile ja,
   Puffer erst auf Knopfdruck. Sonst wäre 4 bc) beantwortet, bevor man sie
   gelesen hat.
   ========================================================================== */
"use strict";

window.GENGANTT = (function () {
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const A = () => (typeof ANSWERS !== "undefined" ? ANSWERS : {});
  const V = () => (typeof VIEW !== "undefined" ? VIEW : null);
  const SVGNS = "http://www.w3.org/2000/svg";

  const putz = s => String(s == null ? "" : s).trim();
  const gross = s => putz(s).toUpperCase();

  /* Vorgängerliste „A, B“ oder „A B“ oder „A;B“ → ["A","B"] */
  const listeVon = s => putz(s).split(/[\s,;/]+/).map(gross).filter(Boolean);

  /* ==================================================== Antwortdaten === */

  const schluessel = k => k + "#gantt";

  function leer(loes) {
    /* Die Vorgangsliste IST die Aufgabe — sie startet leer, nur mit so
       vielen Zeilen, wie die Lösung Vorgänge hat.                      */
    const n = Math.max(4, (loes.vorgaenge || []).length);
    const z = [];
    for (let i = 0; i < n; i++) z.push({ id: "", dauer: "", vor: "" });
    return z;
  }

  function lade(k, loes) {
    const roh = A()[schluessel(k)];
    if (roh) {
      try {
        const o = typeof roh === "string" ? JSON.parse(roh) : roh;
        if (Array.isArray(o) && o.length) return o;
      } catch (e) { }
    }
    return leer(loes);
  }

  function sichere(k, zeilen) {
    A()[schluessel(k)] = JSON.stringify(zeilen);
    if (window.debouncedSave) window.debouncedSave();
    else if (window.speichern) window.speichern();
  }

  function alsText(zeilen) {
    const z = (zeilen || []).filter(v => putz(v.id) && putz(v.dauer));
    if (!z.length) return "";
    return "Gantt — Vorgangsliste:\n" + z.map(v =>
      gross(v.id) + ": " + putz(v.dauer) + " Tage" +
      (listeVon(v.vor).length ? ", nach " + listeVon(v.vor).join(", ") : ", Start")).join("\n");
  }

  /* ======================================================== Rechnen === */

  /** Die eingetragenen Zeilen in das Format von netzRechnen bringen. */
  function alsNetz(zeilen) {
    const gueltig = (zeilen || []).filter(v => putz(v.id) && putz(v.dauer) !== "");
    const ids = gueltig.map(v => gross(v.id));
    return gueltig.map(v => {
      const id = gross(v.id);
      /* netzRechnen erwartet Nachfolger — wir haben Vorgänger. */
      const nachfolger = gueltig.filter(w => listeVon(w.vor).indexOf(id) >= 0).map(w => gross(w.id));
      return { id: id, name: id, dauer: Number(String(v.dauer).replace(",", ".")) || 0,
               nachfolger: nachfolger, vorZahl: listeVon(v.vor).filter(x => ids.indexOf(x) >= 0) };
    });
  }

  /** @returns null, wenn die Liste (noch) nicht rechenbar ist. */
  function rechne(zeilen) {
    const netz = alsNetz(zeilen);
    if (netz.length < 2) return null;
    if (typeof window.netzRechnen !== "function") return null;
    try { return window.netzRechnen(netz); } catch (e) { return { fehler: String(e.message || e) }; }
  }

  /* ======================================================= Zeichnen === */

  function svgEl(name, attrs) {
    const e = document.createElementNS(SVGNS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function text(x, y, s, cls, anker) {
    const t = svgEl("text", { x: x, y: y, "text-anchor": anker || "middle", "dominant-baseline": "middle" });
    if (cls) t.setAttribute("class", cls);
    t.textContent = s;
    return t;
  }

  /**
   * Balkendiagramm zeichnen.
   * @param zeigePuffer  true = Puffer als heller Balken hinter dem Vorgang
   */
  function zeichne(zeilen, zeigePuffer) {
    const r = rechne(zeilen);
    const svg = svgEl("svg", { class: "ga-svg", xmlns: SVGNS });

    if (!r || r.fehler) {
      svg.setAttribute("viewBox", "0 0 420 60");
      svg.appendChild(text(210, 30, r && r.fehler ? "Kreis in den Abhängigkeiten"
        : "Vorgänge und Dauer eintragen", "ga-t-leer"));
      return svg;
    }

    const LINKS = 86;          /* Spalte für die Vorgangsnamen */
    const TAG = 30;            /* Bildpunkte je Tag */
    const ZH = 32;             /* Zeilenhöhe */
    const OBEN = 34;           /* Platz für die Tagesskala */
    const reihe = r.reihenfolge;
    const breite = LINKS + Math.max(1, r.ende) * TAG + 24;
    const hoch = OBEN + reihe.length * ZH + 14;
    svg.setAttribute("viewBox", "0 0 " + breite + " " + hoch);
    svg.setAttribute("preserveAspectRatio", "xMinYMin meet");

    /* --- Tagesraster ---
       Beschriftet werden KALENDERTAGE, und die stehen in der MITTE ihres
       Feldes: der erste Tag ist das Feld zwischen den Zeitpunkten 0 und 1.
       Vorher standen dort die Zeitpunkte 0 … n — dieselbe Zeichnung, aber
       um einen Tag verschoben gelesen, und genau daran scheitert die
       Aufgabe „an welchem Tag beginnt B?“.                              */
    const schritt = r.ende > 24 ? 5 : (r.ende > 12 ? 2 : 1);
    for (let t = 0; t <= r.ende; t++) {
      const x = LINKS + t * TAG;
      svg.appendChild(svgEl("line", { x1: x, y1: OBEN - 8, x2: x, y2: hoch - 10,
        class: "ga-raster" + (t % schritt === 0 ? " ga-raster-stark" : "") }));
    }
    for (let tag = 1; tag <= r.ende; tag++) {
      if (tag !== 1 && tag !== r.ende && tag % schritt !== 0) continue;
      svg.appendChild(text(LINKS + (tag - 0.5) * TAG, OBEN - 18, String(tag), "ga-t-tag"));
    }
    svg.appendChild(text(LINKS - 8, OBEN - 18, "Tag", "ga-t-tag", "end"));

    /* --- Balken --- */
    const mitte = {};
    reihe.forEach((id, i) => {
      const v = r.byId[id];
      const y = OBEN + i * ZH;
      const ym = y + ZH / 2;
      mitte[id] = { y: ym, x1: LINKS + v.faz * TAG, x2: LINKS + v.fez * TAG };

      svg.appendChild(text(LINKS - 12, ym, id + " (" + v.dauer + ")", "ga-t-name", "end"));

      /* Puffer als blasser Balken dahinter — nur auf Wunsch */
      if (zeigePuffer && v.gp > 0) {
        svg.appendChild(svgEl("rect", { x: LINKS + v.fez * TAG, y: ym - 8,
          width: v.gp * TAG, height: 16, class: "ga-puffer", rx: 2 }));
      }
      /* Mindestbreite: ein Vorgang von einem Tag darf nicht zum Strich
         schrumpfen, sonst sieht man ihn im langen Plan gar nicht.      */
      svg.appendChild(svgEl("rect", { x: mitte[id].x1, y: ym - 10,
        width: Math.max(8, v.dauer * TAG), height: 20, rx: 3,
        class: "ga-balken" + (v.gp === 0 ? " ga-kritisch" : "") }));
      if (v.dauer * TAG > 26)
        svg.appendChild(text((mitte[id].x1 + mitte[id].x2) / 2, ym, String(v.dauer), "ga-t-dauer"));
    });

    /* --- Abhängigkeitspfeile: Ende des Vorgängers → Anfang des Nachfolgers */
    const spitze = svgEl("marker", { id: "gaSpitze", viewBox: "0 0 8 8", refX: 7, refY: 4,
      markerWidth: 6, markerHeight: 6, orient: "auto" });
    spitze.appendChild(svgEl("path", { d: "M0,0 L8,4 L0,8 z", class: "ga-spitze" }));
    const defs = svgEl("defs"); defs.appendChild(spitze); svg.appendChild(defs);

    reihe.forEach(id => {
      const v = r.byId[id];
      (v.nach || []).forEach(n => {
        const a = mitte[id], b = mitte[n];
        if (!a || !b) return;
        const x0 = a.x2, y0 = a.y, x1 = b.x1, y1 = b.y;
        const knick = Math.min(x0 + 10, x1 - 8);
        const d = "M" + x0 + "," + y0 + " H" + knick + " V" + y1 + " H" + (x1 - 2);
        svg.appendChild(svgEl("path", { d: d, class: "ga-pfeil", "marker-end": "url(#gaSpitze)" }));
      });
    });

    return svg;
  }

  /* ========================================================= Prüfen === */

  function pruefe(zeilen, loes) {
    const meine = alsNetz(zeilen);
    const soll = loes.vorgaenge || [];
    const zeig = [];
    let dauerDa = 0, vorDa = 0;

    soll.forEach(sv => {
      const m = meine.find(x => x.id === gross(sv.id));
      if (!m) { zeig.push({ ok: false, text: "Vorgang " + sv.id + " fehlt" }); return; }
      if (m.dauer === sv.dauer) dauerDa++;
      else zeig.push({ ok: false, text: "Vorgang " + sv.id + ": Dauer " + (m.dauer || "—") +
        " statt " + sv.dauer + " Tagen" });

      const sollVor = (sv.vor || []).map(gross).sort().join(",");
      const istVor = (m.vorZahl || []).slice().sort().join(",");
      if (sollVor === istVor) vorDa++;
      else zeig.push({ ok: false, text: "Vorgang " + sv.id + ": Vorgänger " +
        (istVor || "keine") + " statt " + (sollVor || "keine") });
    });

    meine.forEach(m => {
      if (!soll.some(sv => gross(sv.id) === m.id))
        zeig.push({ ok: false, text: "Vorgang " + m.id + " steht in der Liste, kommt in der Aufgabe aber nicht vor" });
    });

    const anteil = (da, s) => s ? da / s : 0;
    const max = (loes.punkte || []).reduce((s, p) => s + p.be, 0);
    let punkte = 0;
    (loes.punkte || []).forEach(p => {
      const w = p.was.toLowerCase();
      if (/abhängig|vorgänger|pfeil/.test(w)) punkte += p.be * anteil(vorDa, soll.length);
      else punkte += p.be * anteil(dauerDa, soll.length);
    });
    punkte = Math.round(punkte * 2) / 2;

    if (!zeig.some(z => !z.ok)) zeig.unshift({ ok: true, text: "Vorgänge, Dauern und Abhängigkeiten stimmen." });
    return { punkte: punkte, max: max, zeilen: zeig };
  }

  /* ====================================================== Oberfläche === */

  function baue(karte, it, loes) {
    const k = it.k;
    const zeilen = lade(k, loes);
    let puffer = false;

    const box = el("div", "ga-block");
    const kopf = el("div", "ga-kopf");
    kopf.append(el("span", "ga-titel", "Gantt-Diagramm bauen"),
                el("span", "ga-note", loes.titel || ""));
    box.appendChild(kopf);

    const bild = el("div", "ga-bild");
    const tabWrap = el("div", "ga-tab-wrap");
    const ausgabe = el("div", "ga-ausgabe");

    function neuzeichnen() {
      bild.innerHTML = "";
      bild.appendChild(zeichne(zeilen, puffer));
    }
    function geaendert() { sichere(k, zeilen); neuzeichnen(); }

    /* --- Vorgangstabelle --- */
    function tabelleZeichnen() {
      tabWrap.innerHTML = "";
      const t = el("table", "ga-tab");
      const kz = el("tr");
      ["Vorgang", "Dauer (Tage)", "Vorgänger", ""].forEach(h => kz.appendChild(el("th", null, h)));
      t.appendChild(el("thead")).appendChild(kz);
      const tb = el("tbody"); t.appendChild(tb);

      zeilen.forEach((z, i) => {
        const tr = el("tr");
        [["id", "A"], ["dauer", "3"], ["vor", "A, B"]].forEach(([key, platz]) => {
          const td = el("td");
          const f = el("input");
          f.type = "text";
          f.className = "ga-feld" + (key === "dauer" ? " ga-zahl" : "");
          if (key === "dauer") f.inputMode = "numeric";
          f.placeholder = platz;
          f.value = z[key] || "";
          f.setAttribute("aria-label", ({ id: "Vorgang", dauer: "Dauer in Tagen", vor: "Vorgänger" })[key] +
            ", Zeile " + (i + 1));
          const merken = () => { z[key] = f.value; geaendert(); };
          f.addEventListener("input", merken);
          td.appendChild(f); tr.appendChild(td);
        });
        const weg = el("td", "ga-weg");
        const b = el("button", "ga-weg-knopf", "×");
        b.title = "Zeile löschen";
        b.setAttribute("aria-label", "Zeile " + (i + 1) + " löschen");
        b.onclick = () => { zeilen.splice(i, 1); if (!zeilen.length) zeilen.push({ id: "", dauer: "", vor: "" });
                            tabelleZeichnen(); geaendert(); };
        weg.appendChild(b); tr.appendChild(weg);
        tb.appendChild(tr);
      });
      tabWrap.appendChild(t);
      const plus = el("button", "btn ghost klein", "+ Vorgang");
      plus.onclick = () => { zeilen.push({ id: "", dauer: "", vor: "" }); tabelleZeichnen(); geaendert(); };
      tabWrap.appendChild(plus);
    }
    tabelleZeichnen();

    box.appendChild(el("div", "ga-unter", "Vorgangsliste"));
    box.appendChild(tabWrap);
    box.appendChild(el("div", "ga-unter", "So sieht es aus"));
    box.appendChild(bild);
    /* Die Farben sind die halbe Aussage des Diagramms — ohne Legende rät man. */
    const legende = el("div", "ga-legende");
    legende.innerHTML =
      '<span><i class="lg-kritisch"></i>kritischer Pfad — kein Puffer (GP 0)</span>' +
      '<span><i class="lg-frei"></i>hat Puffer</span>' +
      '<span><i class="lg-puffer"></i>Puffer (nach „Rechnen“)</span>';
    box.appendChild(legende);
    neuzeichnen();

    /* --- Knöpfe --- */
    const knopfe = el("div", "ga-knopfe");

    const rechnen = el("button", "btn", "Rechnen: Ende und Puffer");
    rechnen.onclick = () => {
      const r = rechne(zeilen);
      ausgabe.innerHTML = "";
      if (!r || r.fehler) {
        ausgabe.appendChild(el("div", "ga-warn", r && r.fehler
          ? "Die Abhängigkeiten drehen sich im Kreis — ein Vorgang ist (über Umwege) sein eigener Vorgänger."
          : "Erst Vorgänge mit Dauer eintragen."));
        return;
      }
      puffer = true; neuzeichnen();

      const s = el("div", "ga-erg");
      s.append(el("b", null, "Das Projekt läuft von Tag 1 bis Tag " + r.ende +
                             " (" + r.ende + " Tage)"),
        el("span", "ga-erg-note", " · kritischer Pfad: " + r.kritisch.join(" → ") +
          " · größter Puffer: " + r.maxPufferVorgang.join(", ") + " (" + r.maxGp + " Tage)"));
      ausgabe.appendChild(s);

      /* Zwei Blöcke nebeneinander, weil es zwei Zeitrechnungen sind:
         links die Kalendertage des Balkenplans, rechts die Zeitpunkte des
         Netzplans. Wer das vermischt, ist bei jedem Vorgang um einen Tag
         daneben.                                                        */
      const t = el("table", "ga-tab ga-rechnung");
      const kz = el("tr");
      ["Vorgang", "Dauer", "1. Tag", "letzter Tag", "FAZ", "FEZ", "SAZ", "SEZ", "GP", "FP"]
        .forEach(h => kz.appendChild(el("th", null, h)));
      t.appendChild(el("thead")).appendChild(kz);
      const tb = el("tbody");
      r.reihenfolge.forEach(id => {
        const v = r.byId[id];
        const tr = el("tr");
        if (v.gp === 0) tr.className = "ga-zeile-kritisch";
        [id, v.dauer, v.faz + 1, v.fez, v.faz, v.fez, v.saz, v.sez, v.gp, v.fp]
          .forEach((x, i) => {
            const td = el("td", i === 2 || i === 3 ? "ga-tagspalte" : null, String(x));
            tr.appendChild(td);
          });
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      const roll = el("div", "ga-tab-wrap"); roll.appendChild(t);
      ausgabe.appendChild(roll);

      if (loes.pufferUnsicher) {
        ausgabe.appendChild(el("div", "ga-warn",
          "Achtung: die Musterlösung der IHK nennt bei „größter Puffer“ einen anderen Vorgang. " +
          "Aus der Beschreibung im Aufgabentext folgt das Ergebnis oben. Sieh dir die " +
          "Lösungsseite an — vermutlich fehlt im abgetippten Text eine Abhängigkeit."));
      }
      const erkl = el("div", "ga-schluessel");
      erkl.innerHTML =
        "<b>Kalendertage (Balkenplan):</b> 1. Tag = FAZ + 1 · letzter Tag = FEZ · " +
        "letzter Tag = 1. Tag + Dauer − 1. Ein Vorgang über 3 Tage, der als Erster " +
        "beginnt, belegt die Tage 1–3.<br>" +
        "<b>Zeitpunkte (Netzplan):</b> FAZ = größtes FEZ der Vorgänger · FEZ = FAZ + Dauer · " +
        "SEZ = kleinstes SAZ der Nachfolger · SAZ = SEZ − Dauer · GP = SAZ − FAZ · " +
        "FP = kleinstes FAZ der Nachfolger − FEZ.<br>" +
        "Die Puffer sind in beiden Darstellungen dieselben — sie sind Zeitspannen, " +
        "keine Zeitpunkte, und verschieben sich beim Umrechnen nicht.";
      ausgabe.appendChild(erkl);
    };

    const pruefKnopf = el("button", "btn", "Vorgangsliste prüfen");
    pruefKnopf.onclick = () => {
      const p = pruefe(zeilen, loes);
      ausgabe.innerHTML = "";
      const kopfz = el("div", "ga-erg");
      kopfz.append(el("b", null, p.punkte + " von " + p.max + " BE"),
                   el("span", "ga-erg-note", " — für die Zeichnung selbst"));
      ausgabe.appendChild(kopfz);
      const ul = el("div", "ga-liste");
      p.zeilen.forEach(z => {
        const d = el("div", "ga-zeile " + (z.ok ? "ga-ja" : "ga-nein"));
        d.append(el("span", "ga-zeichen", z.ok ? "✓" : "·"), el("span", null, z.text));
        ul.appendChild(d);
      });
      ausgabe.appendChild(ul);
      if (typeof SCORES !== "undefined") {
        const u = el("button", "btn ghost klein", "als Selbstbewertung übernehmen");
        u.onclick = () => {
          SCORES[k] = Math.round(p.punkte);
          if (window.speichern) window.speichern();
          if (window.refresh) window.refresh();
          if (window.zeigeBogen) window.zeigeBogen();
          if (window.toast) window.toast("Punkte übernommen.");
        };
        ausgabe.appendChild(u);
      }
    };

    const hinweisKnopf = el("button", "btn ghost", "Notation");
    const hinweis = el("div", "ga-hinweis"); hinweis.hidden = true;
    hinweis.innerHTML = "<b>Gantt gegen Netzplan</b>" +
      "<div>· Gantt zeigt die Zeit, der Netzplan die Abhängigkeiten. Beide rechnen dieselben Puffer.</div>" +
      "<div>· Ein Balken beginnt frühestens, wenn ALLE seine Vorgänger fertig sind.</div>" +
      "<div>· <b>Der Balkenplan zählt Tage, der Netzplan Zeitpunkte.</b> Dauer 3 ab " +
      "Projektbeginn heißt im Gantt „Tag 1 bis Tag 3“ und im Netzplan „FAZ 0, FEZ 3“. " +
      "Umrechnung: 1. Tag = FAZ + 1, letzter Tag = FEZ.</div>" +
      (loes.hinweis ? "<div class=\"ga-hinweis-auf\">" + loes.hinweis + "</div>" : "");
    hinweisKnopf.onclick = () => { hinweis.hidden = !hinweis.hidden; };

    knopfe.append(pruefKnopf, rechnen, hinweisKnopf);
    box.append(knopfe, hinweis, ausgabe);
    return box;
  }

  /* ====================================================== Nachrüsten === */

  const merk = {};

  function nachruesten() {
    const view = V();
    if (!view || !view.items) return;
    const L = window.GANTT_LOESUNGEN || {};
    document.querySelectorAll("#bogenMain .tk").forEach(karte => {
      if (karte.dataset.gaFertig) return;
      const k = karte.dataset.k;
      const loes = L[k];
      if (!loes) return;
      const it = view.items.find(x => x.k === k);
      if (!it) return;
      karte.dataset.gaFertig = "1";
      karte.dataset.diaFertig = "1";
      const doppelt = karte.querySelector(".ex-dia");
      if (doppelt) doppelt.remove();

      merk[k] = lade(k, loes);
      const ziel = karte.querySelector(".tk-haupt > textarea");
      const block = baue(karte, it, loes);
      if (ziel) ziel.parentNode.insertBefore(block, ziel);
      else karte.querySelector(".tk-haupt").appendChild(block);
    });
  }

  function druckVorbereiten() {
    document.querySelectorAll(".ga-block .ga-feld").forEach(f => {
      let d = f.nextElementSibling;
      if (!d || !d.classList || !d.classList.contains("ga-druck")) {
        d = document.createElement("div"); d.className = "ga-druck";
        f.parentNode.insertBefore(d, f.nextSibling);
      }
      d.textContent = putz(f.value);
    });
  }
  window.addEventListener("beforeprint", druckVorbereiten);

  function einhaengen() {
    const altText = window.antwortText;
    if (typeof altText === "function" && !altText.__ga) {
      const neu = function (it) {
        const basis = altText.apply(null, arguments);
        if (!it || !merk[it.k]) return basis;
        const t = alsText(merk[it.k]);
        if (!t) return basis;
        return basis ? basis + "\n\n" + t : t;
      };
      neu.__ga = true; window.antwortText = neu;
    }
    const altBogen = window.zeigeBogen;
    if (typeof altBogen === "function" && !altBogen.__ga) {
      const neu = function () {
        const r = altBogen.apply(this, arguments);
        try { setTimeout(nachruesten, 12); } catch (e) { console.error("Gantt:", e); }
        return r;
      };
      neu.__ga = true; window.zeigeBogen = neu;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { zeichne, rechne, pruefe, alsText, nachruesten };
})();
