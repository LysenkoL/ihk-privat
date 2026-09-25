/* ============================================================================
   gen/radar.js — Themen-Radar: was kommt am 30.09.2026 wahrscheinlich dran?
   ----------------------------------------------------------------------------
   Grundlage ist die Themenanalyse (gen/radar-daten.js): für jedes Thema, in
   welcher der zehn AP1-Prüfungen seit Herbst 2021 es vorkam. Daraus wird eine
   einfache, nachvollziehbare Prognose:

       Radar-Wert = Treffer in 10 Prüfungen + Treffer in den letzten 4
                    (die jüngsten Prüfungen zählen also doppelt)

       ≥ 8 sehr wahrscheinlich · ≥ 5 wahrscheinlich · ≥ 3 gut möglich ·
       sonst Außenseiter. SQL und RAID stehen laut Katalog nur noch in Teil 2.

   Dazu kommt der eigene Stand je Thema: Punkte aus den IHK-Prüfungen, dem
   Azubi-Navigator und den Prognose-Prüfungen, deren Text zum Suchmuster des
   Themas passt. Aus „wahrscheinlich“ × „schwach“ ergeben sich die Prioritäten.

   Die drei Prognose-Prüfungen (gen/prognose-daten.js) laufen im Bogen des
   Azubi-Navigators (gen/azubi.js) — mit Uhr, Speichern, Auswertung und
   „Fehler wiederholen“.
   ========================================================================== */
(function (root) {
  "use strict";
  const hatDom = typeof document !== "undefined";
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const ik = (n, g) => root.GENIKON ? root.GENIKON.svg(n, g || 16) : "";
  const RADAR = () => root.IHK_RADAR || { teil1: [], ap2: [], spalten: [], gruppen: {} };
  const PROG = () => (root.IHK_PROGNOSE && root.IHK_PROGNOSE.pruefungen) || [];

  /* ======================================================================
     Rechnen — reine Funktionen (tests/radar.test.js)
     ====================================================================== */
  const treffer = s => (String(s || "").match(/[x2]/g) || []).length;
  const KATEGORIEN = {
    sehr: ["Sehr wahrscheinlich", "In fast jeder der letzten Prüfungen dabei."],
    wahr: ["Wahrscheinlich", "Kam oft oder zuletzt mehrmals dran."],
    moeglich: ["Gut möglich", "Zwei- bis dreimal seit 2021, mindestens einmal in den letzten vier."],
    selten: ["Außenseiter", "Ein- oder zweimal seit 2021 — als Überraschung möglich."],
    ap2: ["Nur noch Teil 2", "Laut Prüfungskatalog nicht mehr in der AP1."],
    weg: ["Seit 2021 nicht mehr dran", "Kam in der alten Prüfungsordnung, in der neuen AP1 nie."]
  };

  function bewerte(t) {
    const neu = String(t.neu || ""), alt = String(t.alt || "");
    const n10 = treffer(neu), n4 = treffer(neu.slice(-4)), nAlt = treffer(alt);
    const wert = n10 + n4;
    let kat;
    if (t.ap2) kat = "ap2";
    else if (wert >= 8) kat = "sehr";
    else if (wert >= 5) kat = "wahr";
    else if (wert >= 3) kat = "moeglich";
    else if (n10 >= 1) kat = "selten";
    else kat = "weg";
    const zuletzt = Math.max(neu.lastIndexOf("x"), neu.lastIndexOf("2"));
    const erst = neu.search(/[x2]/);
    return Object.assign({}, t, {
      n10, n4, nAlt, wert, kat,
      /* oft dran, aber in den letzten beiden Prüfungen nicht: „fällig?“ */
      faellig: !t.ap2 && n10 >= 4 && !/[x2]/.test(neu.slice(-2)),
      /* vor 2021 nie, erstmals in Prüfung Nr. erst */
      neuSeit: nAlt === 0 && erst >= 0 ? erst : -1,
      zuletzt
    });
  }
  const rang = (a, b) => b.wert - a.wert || b.n10 - a.n10 || b.nAlt - a.nAlt || (a.t < b.t ? -1 : 1);
  function prognose(daten) { return (daten || RADAR()).teil1.map(bewerte).sort(rang); }

  /** Je Prüfung der letzten vier: Themen, die dort zum ersten Mal überhaupt kamen */
  function ueberraschungen(daten) {
    const D = daten || RADAR(), L = prognose(D), n = (D.spalten || []).length;
    const out = [];
    for (let i = Math.max(0, n - 4); i < n; i++)
      out.push({ i, name: D.spalten[i], themen: L.filter(t => t.neuSeit === i).map(t => t.t) });
    return out;
  }

  function ap2Liste(daten) {
    return (daten || RADAR()).ap2.map(t => ({
      t: t.t, neu: t.neu, alt: t.alt,
      anzahl: (t.neu.match(/x/g) || []).length + 2 * (t.neu.match(/2/g) || []).length,
      n: treffer(t.neu)
    })).sort((a, b) => b.anzahl - a.anzahl || b.n - a.n || (a.t < b.t ? -1 : 1));
  }

  /** In welchen Prognose-Aufgaben steckt das Thema? [{m, a}] */
  function inPrognose(key) {
    const out = [];
    PROG().forEach(m => m.aufgaben.forEach(a => { if ((a.themen || []).indexOf(key) >= 0) out.push({ m, a }); }));
    return out;
  }

  /* ---------------------------------------------------- eigener Stand --- */
  const ohneHtml = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
  let INDEX = null;
  function index() {
    if (INDEX) return INDEX;
    const ihk = [], az = [], satz = [];
    try {
      if (typeof ALLE !== "undefined" && Array.isArray(ALLE)) ALLE.forEach(it => {
        if ((it.katalog || {}).status === "veraltet") return;
        ihk.push({ it, text: ((it.groupIntro || "") + " " + (it.prompt || "")).toLowerCase() });
      });
    } catch (e) { }
    try {
      const A = root.GENAZUBI, liste = A && A.alleModule ? A.alleModule() : [];
      liste.forEach(m => A.teileVon(m).forEach(t => az.push({ m, t, text: ohneHtml(t.titel + " " + t.text).toLowerCase() })));
    } catch (e) { }
    try {
      (root.SATZ_POOL || []).forEach(k => satz.push({ k, text: (k.frage + " " + (k.stichwort || "") + " " + (k.muster || "")).toLowerCase() }));
    } catch (e) { }
    INDEX = { ihk, az, satz, fertig: ihk.length > 0 };
    return INDEX;
  }
  const muster = t => { try { return t.such ? new RegExp(t.such, "i") : null; } catch (e) { return null; } };

  function stand(t) {
    const re = muster(t);
    const erg = { ihk: [], az: [], satz: [], punkte: 0, max: 0, bewertet: 0, quote: null };
    if (!re) return erg;
    const I = index();
    const S = (typeof SCORES !== "undefined" && SCORES) ? SCORES : {};
    I.ihk.forEach(x => {
      if (!re.test(x.text)) return;
      erg.ihk.push(x.it);
      const s = S[x.it.k];
      if (s != null && x.it.maxPoints) { erg.punkte += s; erg.max += x.it.maxPoints; erg.bewertet++; }
    });
    const A = root.GENAZUBI, zst = {};
    I.az.forEach(x => {
      if (!re.test(x.text)) return;
      erg.az.push(x);
      const z = zst[x.m.id] || (zst[x.m.id] = A.zustand(x.m.id));
      const p = z.p[x.t.id];
      if (p != null && x.t.punkte) { erg.punkte += p; erg.max += x.t.punkte; erg.bewertet++; }
    });
    I.satz.forEach(x => { if (re.test(x.text)) erg.satz.push(x.k.id); });
    if (erg.max) erg.quote = erg.punkte / erg.max;
    return erg;
  }

  /** Prioritäten: wahrscheinlich × schwach (ungeübt zählt wie 55 %) */
  function prioritaeten(liste) {
    return liste.filter(t => (t.kat === "sehr" || t.kat === "wahr") && t.such)
      .map(t => { const s = stand(t); return { t, s, q: s.quote == null ? 0.55 : s.quote }; })
      .filter(x => x.q < 0.8 && (x.s.ihk.length || x.s.az.length))
      .sort((a, b) => (a.q - b.q) || (b.t.wert - a.t.wert))
      .slice(0, 5);
  }

  /* ======================================================================
     Oberfläche
     ====================================================================== */
  const fmtP = q => q == null ? "–" : Math.round(q * 100) + " %";
  const plural = (n, a, b) => n + " " + (n === 1 ? a : b);
  let herkunft = "scStart";

  function seite() {
    let s = $("scRadar");
    if (s) return s;
    s = el("div", "seite rd-seite"); s.id = "scRadar"; s.hidden = true;
    const w = el("div", "rd-wrap"); w.id = "radarInhalt";
    s.appendChild(w);
    const start = $("scStart");
    if (start && start.parentNode) start.parentNode.insertBefore(s, start.nextSibling);
    else document.body.insertBefore(s, $("fuss") || null);
    return s;
  }

  function zeigen() {
    const s = seite();
    const vorher = ["scBogen", "scAuswertung", "scKatalog", "scAzubi", "scWieder", "scGlossar", "scKomp", "scSpick", "scSql", "scSatz"]
      .find(id => $(id) && !$(id).hidden) || "scStart";
    if (vorher !== "scRadar") herkunft = vorher;
    document.querySelectorAll("div.seite[id^='sc'], #scBogen").forEach(e => { if (e.id !== "scRadar") e.hidden = true; });
    s.hidden = false;
    const f = $("fuss"); if (f) f.hidden = true;
    const kt = $("kopfTitel"); if (kt) kt.hidden = false;
    if ($("kEyebrow")) $("kEyebrow").textContent = "Prognose · 30.09.2026";
    if ($("kTitel")) $("kTitel").textContent = "Themen-Radar";
    const sk = $("schalterKatalog"); if (sk) sk.hidden = true;
    if (root.GENZURUECK) {
      try { root.GENZURUECK.hoeher && root.GENZURUECK.hoeher("scRadar", "scStart"); } catch (e) { }
      try { root.GENZURUECK.knopfPflegen(); } catch (e) { }
    }
    try {
      if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: herkunft }, "");
      if (history.state.seite !== "scRadar") history.pushState({ ihk: 1, seite: "scRadar" }, "", location.hash || "");
    } catch (e) { }
  }

  /** Öffentlicher Einstieg */
  function oeffnen(anker) {
    const los = () => {
      INDEX = null;
      zeigen();
      zeichnen();
      if (anker && $(anker)) setTimeout(() => $(anker).scrollIntoView({ behavior: "smooth", block: "start" }), 40);
      else root.scrollTo(0, 0);
    };
    const A = root.GENAZUBI;
    if (A && A.laden) A.laden().then(los, los); else los();
  }

  /* ---------------------------------------------------------- Bausteine --- */
  function streifen(neu, spalten) {
    const s = el("span", "rd-streifen");
    s.setAttribute("aria-label", "In " + treffer(neu) + " von " + neu.length + " Prüfungen");
    String(neu).split("").forEach((c, i) => {
      const k = el("i", (c === "." ? "" : "an") + (c === "2" ? " doppelt" : "") + (i >= neu.length - 4 ? " jung" : ""));
      k.title = (spalten[i] || "") + (c === "." ? ": nicht dran" : c === "2" ? ": in zwei Aufgaben" : ": dran");
      s.appendChild(k);
    });
    return s;
  }

  function uebenIhk(items, titel) {
    if (!items.length || typeof VIEW === "undefined") return;
    const S = (typeof SCORES !== "undefined" && SCORES) ? SCORES : {};
    const q = it => S[it.k] == null ? -1 : S[it.k] / (it.maxPoints || 1);
    const sortiert = items.slice().sort((a, b) => q(a) - q(b));
    VIEW = { modus: "uebung", exam: null, items: sortiert, titel };
    if (typeof SHOW_SOL !== "undefined") SHOW_SOL = false;
    if (typeof zeigeBogen === "function") zeigeBogen();
    if (typeof schirm === "function") schirm("scBogen");
  }

  function kapitel(box, titel, text, id) {
    const h = el("h2", "rd-h", titel);
    if (id) h.id = id;
    box.appendChild(h);
    if (text) box.appendChild(el("p", "rd-info", text));
  }

  /* ------------------------------------------------ Prognose-Prüfungen --- */
  function pruefungsKarte(m) {
    const A = root.GENAZUBI;
    const k = el("article", "rd-pk");
    const kopf = el("div", "rd-pk-kopf");
    kopf.appendChild(el("span", "rd-pk-nr", "P" + m.nr));
    const tt = el("div", "rd-pk-titel");
    tt.appendChild(el("b", null, m.titel));
    tt.appendChild(el("span", null, m.kurzinfo || ""));
    kopf.appendChild(tt);
    k.appendChild(kopf);

    let z = null, s = null;
    try { z = A.zustand(m.id); s = A.auswertung(m, z); } catch (e) { }
    const status = el("p", "rd-pk-status");
    if (!s) status.textContent = "4 Aufgaben · 100 Punkte · 90 Minuten";
    else if (s.fertig) status.textContent = "Fertig: " + s.punkte.toString().replace(".", ",") + " / 100 P. · " + s.note.text;
    else if (s.bearbeitet || s.bewertet) status.textContent = s.bearbeitet + "/" + s.n + " Teilaufgaben bearbeitet" + (z.modus === "pruefung" ? " · Prüfungsmodus" : " · Übung");
    else status.textContent = "Noch nicht begonnen · 100 Punkte · 90 Minuten";
    k.appendChild(status);

    const ul = el("ol", "rd-pk-aufgaben");
    m.aufgaben.forEach((a, i) => {
      const li = el("li");
      const b = el("button", "rd-pk-a");
      b.type = "button";
      b.appendChild(el("span", "rd-pk-an", "A" + a.nr));
      b.appendChild(el("span", "rd-pk-at", a.titel));
      const ja = s && s.jeAufgabe[i];
      b.appendChild(el("span", "rd-pk-ap", ja && ja.bearbeitet ? ja.bearbeitet + "/" + ja.n : "25 P."));
      b.title = "Nur diese Aufgabe üben (ohne Uhr)";
      b.onclick = () => { if (A) A.oeffnen(m.id, { ziel: a.teile[0].id }); };
      li.appendChild(b);
      ul.appendChild(li);
    });
    k.appendChild(ul);

    const st = el("div", "rd-pk-knoepfe");
    const haupt = el("button", "btn primary");
    haupt.type = "button";
    haupt.textContent = !s || (!s.bearbeitet && !s.bewertet && !(z && z.modus)) ? "Starten" : s.fertig ? "Ansehen" : "Weiter";
    haupt.onclick = () => { if (A) A.oeffnen(m.id); };
    st.appendChild(haupt);
    if (s && s.bewertet) {
      const e = el("button", "btn", "Auswertung"); e.type = "button";
      e.onclick = () => A.oeffnen(m.id, { ergebnis: true });
      st.appendChild(e);
    }
    k.appendChild(st);
    return k;
  }

  /* ------------------------------------------------------- Themenzeile --- */
  function themaZeile(t, D) {
    const s = stand(t);
    const z = el("div", "rd-thema kat-" + t.kat);
    const kopf = el("div", "rd-t-kopf");
    kopf.appendChild(el("b", "rd-t-name", t.t));
    const st = el("span", "rd-t-stand" + (s.quote == null ? " leer" : s.quote >= 0.75 ? " gut" : s.quote >= 0.5 ? " mittel" : " schwach"),
      s.quote == null ? (s.ihk.length || s.az.length ? "ungeübt" : "") : fmtP(s.quote));
    if (s.quote != null) st.title = "Dein Stand aus " + plural(s.bewertet, "bewerteter Teilaufgabe", "bewerteten Teilaufgaben");
    kopf.appendChild(st);
    z.appendChild(kopf);

    const mitte = el("div", "rd-t-mitte");
    mitte.appendChild(streifen(t.neu, D.spalten));
    mitte.appendChild(el("span", "rd-t-zahl", t.n10 + "/10 · letzte 4: " + t.n4 + (t.nAlt ? " · vor 2021: " + t.nAlt + "×" : "")));
    z.appendChild(mitte);

    const fuss = el("div", "rd-t-fuss");
    if (t.faellig) fuss.appendChild(el("span", "rd-chip warn", "2× ausgesetzt — fällig?"));
    if (t.neuSeit >= 0) fuss.appendChild(el("span", "rd-chip neu", "neu seit " + D.spalten[t.neuSeit]));
    inPrognose(t.k).forEach(x => {
      const c = el("button", "rd-chip prog", "Prognose " + x.m.nr + " · A" + x.a.nr);
      c.type = "button";
      c.title = x.a.titel;
      c.onclick = () => root.GENAZUBI && root.GENAZUBI.oeffnen(x.m.id, { ziel: x.a.teile[0].id });
      fuss.appendChild(c);
    });
    const knoepfe = el("span", "rd-t-knoepfe");
    if (s.ihk.length) {
      const b = el("button", "btn klein", "IHK-Aufgaben (" + s.ihk.length + ")");
      b.type = "button";
      b.onclick = () => uebenIhk(s.ihk, "Radar: " + t.t);
      knoepfe.appendChild(b);
    } else if (s.az.length) {
      const b = el("button", "btn klein", "Azubi (" + s.az.length + ")");
      b.type = "button";
      const x = s.az.find(y => !y.m.virtuell) || s.az[0];
      b.onclick = () => root.GENAZUBI.oeffnen(x.m.id, { ziel: x.t.id });
      knoepfe.appendChild(b);
    }
    if (s.satz.length && root.GENSATZ) {
      const b = el("button", "btn ghost klein", "Kurzfragen (" + s.satz.length + ")");
      b.type = "button";
      b.onclick = () => root.GENSATZ.starten(s.satz, { anzahl: Math.min(10, s.satz.length) });
      knoepfe.appendChild(b);
    }
    if (knoepfe.childNodes.length) fuss.appendChild(knoepfe);
    if (fuss.childNodes.length) z.appendChild(fuss);
    return z;
  }

  /** Kompakte Zeile für die Prioritäten: Name, warum, ein Knopf */
  function prioZeile(x) {
    const t = x.t, s = x.s;
    const li = el("li", "rd-prio-z");
    const tx = el("div", "rd-prio-t");
    tx.appendChild(el("b", null, t.t));
    tx.appendChild(el("span", null, (s.quote == null ? "noch nicht geübt" : fmtP(s.quote) + " aus " + plural(s.bewertet, "Teilaufgabe", "Teilaufgaben")) +
      " · " + KATEGORIEN[t.kat][0].toLowerCase() + (t.faellig ? " · lange nicht dran" : "")));
    li.appendChild(tx);
    const b = el("button", "btn klein", "Üben");
    b.type = "button";
    if (s.ihk.length) b.onclick = () => uebenIhk(s.ihk, "Radar: " + t.t);
    else { const a = s.az.find(y => !y.m.virtuell) || s.az[0]; b.onclick = () => root.GENAZUBI.oeffnen(a.m.id, { ziel: a.t.id }); }
    li.appendChild(b);
    return li;
  }

  /* ------------------------------------------------------------ Seite --- */
  function zeichnen() {
    seite();
    const box = $("radarInhalt");
    box.innerHTML = "";
    const D = RADAR();
    const L = prognose(D);

    /* Kopf */
    const k = el("section", "rd-karte rd-kopf");
    k.appendChild(el("h2", null, "Was kommt am 30.09.?"));
    k.appendChild(el("p", "rd-info",
      "Grundlage ist deine Themenanalyse: welches Thema in welcher der zehn AP1-Prüfungen seit Herbst 2021 drankam (neu gezählt aus den Kreuzen). " +
      "Radar-Wert = Treffer in 10 Prüfungen + Treffer in den letzten 4 — die jüngsten zählen doppelt."));
    const leg = el("div", "rd-legende");
    const bsp = streifen("..x..xxxxx", D.spalten);
    leg.appendChild(bsp);
    leg.appendChild(el("span", null, "= je Prüfung H21 … F26, farbig = kam dran; die letzten vier sind hervorgehoben"));
    k.appendChild(leg);
    const zahlen = el("div", "rd-fakten");
    [[L.filter(t => t.kat === "sehr").length, "sehr wahrscheinlich"], [L.filter(t => t.kat === "wahr").length, "wahrscheinlich"],
     [L.filter(t => t.kat === "weg").length, "seit 2021 nicht mehr"]].forEach(([n, txt]) => {
      const f = el("div", "rd-fakt"); f.appendChild(el("b", null, String(n))); f.appendChild(el("span", null, txt)); zahlen.appendChild(f);
    });
    k.appendChild(zahlen);
    k.appendChild(el("p", "rd-klein", "Eine Prognose ist Statistik, keine Garantie: Jede der letzten Prüfungen hatte auch Themen, die vorher nie dran waren."));
    box.appendChild(k);

    /* Prognose-Prüfungen */
    kapitel(box, "Drei Prognose-Prüfungen", "Echte Aufgaben aus den IHK-Prüfungen und dem Azubi-Navigator, gemischt nach dieser Prognose — mit anderer Firma, anderen Zahlen und neu formuliert. " +
      "Ganz als Prüfung mit Uhr oder Aufgabe für Aufgabe ohne Uhr (auf eine Aufgabe tippen).", "rdPruefungen");
    const pg = el("div", "rd-pk-gitter");
    PROG().forEach(m => pg.appendChild(pruefungsKarte(m)));
    box.appendChild(pg);

    /* Prioritäten */
    const prio = index().fertig || root.GENAZUBI ? prioritaeten(L) : [];
    if (prio.length) {
      kapitel(box, "Deine Prioritäten", "Wahrscheinliche Themen, bei denen du noch unter 80 % liegst oder die du noch nicht geübt hast — hier bringt jede Minute am meisten.", "rdPrio");
      const pl = el("ol", "rd-prio");
      prio.forEach(x => pl.appendChild(prioZeile(x)));
      box.appendChild(pl);
    }

    /* Prognose nach Kategorien */
    kapitel(box, "Prognose Herbst 2026", null, "rdPrognose");
    ["sehr", "wahr", "moeglich"].forEach(kat => {
      const teil = L.filter(t => t.kat === kat);
      if (!teil.length) return;
      const h = el("h3", "rd-kat kat-" + kat, KATEGORIEN[kat][0]);
      h.appendChild(el("span", "n", String(teil.length)));
      box.appendChild(h);
      box.appendChild(el("p", "rd-info", KATEGORIEN[kat][1]));
      const l = el("div", "rd-liste");
      teil.forEach(t => l.appendChild(themaZeile(t, D)));
      box.appendChild(l);
    });

    /* Überraschungen */
    const ue = ueberraschungen(D).filter(x => x.themen.length);
    if (ue.length) {
      const u = el("section", "rd-karte rd-ueber");
      u.appendChild(el("h3", null, "Überraschungen einplanen"));
      u.appendChild(el("p", "rd-info", "In jeder der letzten Prüfungen kamen Themen, die vorher noch nie dran waren:"));
      const ul = el("ul", "rd-ueber-liste");
      ue.forEach(x => { const li = el("li"); li.appendChild(el("b", null, x.name + ": ")); li.appendChild(document.createTextNode(x.themen.join(", "))); ul.appendChild(li); });
      u.appendChild(ul);
      u.appendChild(el("p", "rd-info", "Rechne am 30.09. mit zwei bis drei solchen Aufgaben. Dagegen hilft kein Auswendiglernen, sondern sauberes Formulieren nach Operator — genau das trainieren die Kurzfragen."));
      if (root.GENSATZ) {
        const b = el("button", "btn", "5 Min. Kurzfragen"); b.type = "button";
        b.onclick = () => root.GENSATZ.starten();
        const st = el("div", "steuer"); st.appendChild(b); u.appendChild(st);
      }
      box.appendChild(u);
    }

    /* Außenseiter, AP2-only, weggefallen */
    [["selten", true], ["ap2", false], ["weg", false]].forEach(([kat]) => {
      const teil = L.filter(t => t.kat === kat);
      if (!teil.length) return;
      const d = el("details", "rd-mehr");
      const sm = el("summary", null, KATEGORIEN[kat][0] + " · " + teil.length);
      d.appendChild(sm);
      d.appendChild(el("p", "rd-info", KATEGORIEN[kat][1] + (kat === "weg" ? " Niedrige Priorität — außer du hast noch Zeit übrig." : "")));
      if (kat === "weg") {
        const tb = el("div", "rd-weg");
        teil.sort((a, b) => b.nAlt - a.nAlt).forEach(t => { const c = el("span", "rd-chip", t.t + " · " + t.nAlt + "×"); tb.appendChild(c); });
        d.appendChild(tb);
      } else {
        const l = el("div", "rd-liste");
        let gebaut = false;
        d.addEventListener("toggle", () => { if (d.open && !gebaut) { gebaut = true; teil.forEach(t => l.appendChild(themaZeile(t, D))); } });
        d.appendChild(l);
      }
      box.appendChild(d);
    });

    /* AP2 FIAE */
    const a2 = ap2Liste(D);
    if (a2.length) {
      const d = el("details", "rd-mehr rd-ap2");
      d.appendChild(el("summary", null, "Ausblick: AP2 Fachinformatik Anwendungsentwicklung"));
      d.appendChild(el("p", "rd-info", "Für später — die neun Prüfungen seit Winter 21/22. Dunkler Balken = in zwei Aufgaben derselben Prüfung. Die Top-Themen sind jedes Mal dabei."));
      const l = el("div", "rd-liste");
      a2.slice(0, 16).forEach(t => {
        const z = el("div", "rd-thema ap2");
        const kopf = el("div", "rd-t-kopf");
        kopf.appendChild(el("b", "rd-t-name", t.t));
        kopf.appendChild(el("span", "rd-t-stand leer", t.anzahl + "×"));
        z.appendChild(kopf);
        const mi = el("div", "rd-t-mitte");
        mi.appendChild(streifen(t.neu, D.ap2Spalten || []));
        mi.appendChild(el("span", "rd-t-zahl", t.n + "/9 Prüfungen"));
        z.appendChild(mi);
        l.appendChild(z);
      });
      d.appendChild(l);
      box.appendChild(d);
    }
    box.appendChild(el("p", "rd-klein rd-quelle", "Quelle: " + (D.quelle || "Themenanalyse") + " · Stand " + String(D.stand || "").split("-").reverse().join(".")));
  }

  /* ------------------------------------------------------- Startseite --- */
  function block() {
    if (!hatDom) return;
    const s = $("scStart");
    if (!s) return;
    let b = $("radarBox");
    if (!b) {
      b = el("div", "abschnitt"); b.id = "radarBox";
      const az = $("azubiBox");
      if (az && az.parentNode) az.parentNode.insertBefore(b, az);
      else s.appendChild(b);
    }
    b.innerHTML = "";
    b.appendChild(el("h2", null, "Themen-Radar & Prognose-Prüfungen"));
    const L = prognose();
    const top = L.filter(t => t.kat === "sehr");
    b.appendChild(el("p", null, "Was am 30.09. am wahrscheinlichsten drankommt — ausgezählt aus zehn AP1-Prüfungen. Dazu drei Prüfungen aus echten IHK- und Azubi-Aufgaben genau zu diesen Themen, neu formuliert."));
    const chips = el("div", "rd-chips");
    top.forEach(t => chips.appendChild(el("span", "rd-chip", t.t)));
    b.appendChild(chips);
    const st = el("div", "steuer");
    let fertig = 0;
    PROG().forEach(m => {
      let txt = "Prognose " + m.nr;
      try {
        const A = root.GENAZUBI, z = A.zustand(m.id), sw = A.auswertung(m, z);
        if (sw.fertig) { fertig++; txt += " ✓"; } else if (sw.bearbeitet) txt += " · " + sw.bearbeitet + "/" + sw.n;
      } catch (e) { }
      const k = el("button", "btn" + (m.nr === 1 ? " primary" : ""), txt); k.type = "button";
      k.onclick = () => root.GENAZUBI && root.GENAZUBI.oeffnen(m.id);
      st.appendChild(k);
    });
    const r = el("button", "btn ghost", "Radar öffnen"); r.type = "button";
    r.onclick = () => oeffnen();
    st.appendChild(r);
    b.appendChild(st);
    const d = document.querySelector('details.st-block[data-key="radar"] .st-zahl');
    if (d) d.textContent = fertig ? fertig + "/3 fertig" : "3 Prüfungen";
  }

  /* -------------------------------------------------------- Einhängen --- */
  function einhaengen() {
    seite();
    const altSchirm = root.schirm;
    if (typeof altSchirm === "function" && !altSchirm.__rd) {
      const neu = function (name) {
        if (name === "scRadar") { oeffnen(); return; }
        const s = $("scRadar"); if (s) s.hidden = true;
        return altSchirm.apply(this, arguments);
      };
      neu.__rd = true; root.schirm = neu;
    }
    const altStart = root.renderStart;
    if (typeof altStart === "function" && !altStart.__rd) {
      const neu = function () {
        const r = altStart.apply(this, arguments);
        try { block(); } catch (e) { console.error("Radar:", e); }
        return r;
      };
      neu.__rd = true; root.renderStart = neu;
    }
    if (root.MutationObserver) {
      new MutationObserver(muts => {
        const k = $("scRadar");
        if (!k || k.hidden) return;
        for (const m of muts) {
          const z = m.target;
          if (z !== k && z.id && /^sc/.test(z.id) && z.classList && (z.classList.contains("seite") || z.classList.contains("blatt")) && !z.hidden) { k.hidden = true; return; }
        }
      }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
    }
    try { block(); } catch (e) { console.error("Radar:", e); }
    /* Stand der Prognose-Prüfungen nachziehen, sobald das Azubi-Paket da ist */
    setTimeout(() => { try { block(); } catch (e) { } }, 600);
  }

  const api = { bewerte, prognose, ueberraschungen, ap2Liste, inPrognose, stand, prioritaeten, oeffnen, block, KATEGORIEN,
                neu() { INDEX = null; } };
  root.GENRADAR = api;
  if (typeof module === "object" && module.exports) module.exports = api;
  if (hatDom) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
    else einhaengen();
  }
})(typeof window !== "undefined" ? window : globalThis);
