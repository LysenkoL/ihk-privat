/* ============================================================================
   gen/gesamt.js — Gesamtbild: echte Prüfungen und Generator in EINER Statistik
   ----------------------------------------------------------------------------
   Die Prüfungen liefern das Gewicht eines Themas (wie viele Punkte es in einer
   Prüfung wert ist), der Generator liefert die Menge (viele geprüfte Antworten
   pro Thema). Zusammen ergibt das eine belastbare Quote und eine Prognose:
   wie viele der 100 Punkte sitzen heute schon.
   ========================================================================== */
"use strict";

window.GENGESAMT = (function () {
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const esc = s => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; };
  const G = () => window.GEN;

  const SK_STAT = "ihk2:gen:stat";
  const SK_BLAETTER = "ihk2:gen:blaetter";
  const lies = (k, alt) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : alt; } catch { return alt; } };

  /* Generator-Unterthemen, die in der Prüfung unter einem anderen Thema laufen */
  const SUB_ZU_EXAM = {
    "Netzplantechnik": "projekt",
    "Gantt-Diagramm": "projekt",
    "ER-Modell & Kardinalitäten": "daten",
    "UML-Aktivitätsdiagramm": "software",
    "UML Use-Case-Diagramm": "software",
    "UML-Klassendiagramm": "software"
  };
  function examThema(v) { return SUB_ZU_EXAM[v.sub] || v.thema; }

  function idsFuer(key) {
    return G().alleVorlagen().filter(v => examThema(v) === key).map(v => v.id);
  }

  /* ---------------------------------------------------------------------
     Wie alt darf ein Ergebnis sein, um noch zu zählen?

     Bisher wurde alles gleich gewichtet: ein Blatt von vor drei Wochen zählte
     wie das von heute. Wer sich in einem Thema von 51 % auf 79 % hochgearbeitet
     hat, sah als Quote den Mittelwert 65 % — eine Zahl, die zu keinem Zeitpunkt
     gestimmt hat und die den Fortschritt unsichtbar macht.

     Jetzt halbiert sich das Gewicht alle 14 Tage. Nach einer Woche zählt ein
     Ergebnis noch zu 70 %, nach einem Monat zu 23 %, nach zwei Monaten zu 5 %.
     Das ist kein Vergessen, sondern die richtige Frage: wie gut bist du HEUTE.
     -------------------------------------------------------------------- */
  const HALBWERT = 14;
  function gewichtFuer(tage) {
    if (tage == null || !isFinite(tage) || tage < 0) return 1;
    return Math.pow(0.5, tage / HALBWERT);
  }
  function tageHer(datumStr) {
    const m = String(datumStr || "").match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (!m) return null;
    const d = new Date(+m[3], +m[2] - 1, +m[1]); d.setHours(0, 0, 0, 0);
    const h = new Date(); h.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((h - d) / 864e5));
  }

  /* ---------------------------------------------------------------- Daten */
  function daten() {
    const analyse = window.themenAnalyse ? window.themenAnalyse() : { liste: [], gesamt: 0 };
    const stat = lies(SK_STAT, {});
    const blaetter = lies(SK_BLAETTER, []);

    /* -------------------------------------------------------------------
       Generator-Punkte je Prüfungsthema — aus den einzelnen BLÄTTERN, nicht
       aus der Summenstatistik. Nur dort steht ein Datum, und nur mit Datum
       lässt sich frisch von alt unterscheiden. Gewichtet wird mit BE, nicht
       mit Prozenten: ein Blatt über 82 BE wiegt schwerer als eines über 28.
       ---------------------------------------------------------------- */
    const gen = {};
    const holen = k => gen[k] || (gen[k] = { punkte: 0, max: 0, rohMax: 0, versuche: 0,
                                             typen: new Set(), blaetter: 0, juengste: null });
    blaetter.forEach(bl => {
      const erg = bl.ergebnisse || {};
      const keys = Object.keys(erg);
      if (!keys.length) return;
      const tage = tageHer(bl.erstellt);
      const w = gewichtFuer(tage);
      const beruehrt = new Set();
      keys.forEach(ki => {
        const e = erg[ki];
        const a = (bl.aufgaben || [])[ki];
        if (!e || !a) return;
        const v = G().vorlageVon(a.vorlageId);
        if (!v) return;
        /* Nur beurteilte BE: leere Felder und noch nicht selbst gewerteter
           Freitext dürfen die Quote nicht drücken.                      */
        const be = e.sicherBe != null ? e.sicherBe : (e.max || 0);
        const p = e.sicherBe != null ? e.sicherPunkte : (e.punkte || 0);
        if (!be) return;
        const k = examThema(v);
        const t = holen(k);
        t.punkte += p * w; t.max += be * w; t.rohMax += be;
        t.versuche++; t.typen.add(v.id);
        if (t.juengste == null || (tage != null && tage < t.juengste)) t.juengste = tage;
        beruehrt.add(k);
      });
      beruehrt.forEach(k => { holen(k).blaetter++; });
    });

    /* Ältere Blätter sind irgendwann aus der Liste gefallen (es werden 40
       aufbewahrt). Für Themen, von denen deshalb gar nichts mehr übrig ist,
       springt die alte Summenstatistik ein — ungewichtet, aber besser als
       eine Lücke.                                                        */
    Object.keys(stat).forEach(id => {
      const v = G().vorlageVon(id);
      if (!v || !stat[id].max) return;
      const k = examThema(v);
      if (gen[k] && gen[k].max > 0) { gen[k].typen.add(id); return; }
      const e = holen(k);
      e.punkte += stat[id].punkte * 0.25;      /* alt: viertel Gewicht */
      e.max += stat[id].max * 0.25;
      e.rohMax += stat[id].max;
      e.versuche += stat[id].versuche;
      e.typen.add(id);
      e.altbestand = true;
    });

    /* verfügbare Aufgabentypen je Thema — auch dort, wo noch nichts geübt wurde */
    const angebot = {};
    G().alleVorlagen().forEach(v => {
      const k = examThema(v);
      angebot[k] = (angebot[k] || 0) + 1;
    });

    const zeilen = analyse.liste.map(e => {
      const g = gen[e.key];
      const genQuote = g && g.max ? g.punkte / g.max : null;
      const gesGetestet = (e.getestet || 0) + (g ? g.max : 0);
      const gesErreicht = (e.erreicht || 0) + (g ? g.punkte : 0);
      const quote = gesGetestet > 0 ? gesErreicht / gesGetestet : null;
      return {
        key: e.key, label: e.label, gewicht: e.gewicht,
        examQuote: e.quote, examBE: e.getestet || 0,
        genQuote, genBE: g ? g.max : 0, genRohBE: g ? g.rohMax : 0,
        genVersuche: g ? g.versuche : 0,
        genBlaetter: g ? g.blaetter : 0, juengste: g ? g.juengste : null,
        quote, risiko: quote === null ? null : e.gewicht * (1 - quote),
        typen: angebot[e.key] || 0
      };
    });

    /* Themen, die es nur im Generator gibt (z. B. Katalog-Lücken) */
    Object.keys(angebot).forEach(k => {
      if (zeilen.some(z => z.key === k)) return;
      const g = gen[k];
      zeilen.push({
        key: k, label: (window.IHK_TOPICS || {})[k] || G().THEMEN_LABEL[k] || k,
        gewicht: 0, examQuote: null, examBE: 0,
        genQuote: g && g.max ? g.punkte / g.max : null, genBE: g ? g.max : 0,
        genVersuche: g ? g.versuche : 0,
        quote: g && g.max ? g.punkte / g.max : null, risiko: 0, typen: angebot[k]
      });
    });

    const bewertet = zeilen.filter(z => z.quote !== null);
    const abgedeckt = bewertet.reduce((s, z) => s + z.gewicht, 0);
    const prognose = bewertet.reduce((s, z) => s + z.gewicht * z.quote, 0);
    /* auf 100 Punkte hochrechnen: was nicht getestet ist, bleibt unbekannt */
    const hoch = abgedeckt > 0 ? prognose / abgedeckt * 100 : null;

    const papier = blaetter.filter(b => b.papierErgebnis);
    return {
      zeilen: zeilen.sort((a, b) => (b.risiko || 0) - (a.risiko || 0)),
      abgedeckt, prognose, hoch,
      examBE: zeilen.reduce((s, z) => s + z.examBE, 0),
      genBE: zeilen.reduce((s, z) => s + z.genBE, 0),
      genRohBE: zeilen.reduce((s, z) => s + (z.genRohBE || 0), 0),
      duenn: zeilen.filter(z => z.gewicht >= 3 && z.quote !== null && (z.genRohBE || 0) < 15).length,
      papier
    };
  }

  /* ------------------------------------------------------------- Anzeige */
  function box() {
    let b = $("gesamtBox");
    if (!b) {
      b = el("div", "abschnitt"); b.id = "gesamtBox";
      const karten = $("examKarten");
      const nachDem = karten ? karten.closest(".abschnitt") : null;
      if (nachDem && nachDem.parentNode) nachDem.parentNode.insertBefore(b, nachDem.nextSibling);
      else $("scStart").appendChild(b);
    }
    b.innerHTML = "";

    const d = daten();
    b.appendChild(el("h2", null, "Wo stehe ich? — Prüfungen und Generator zusammen"));
    b.appendChild(el("p", null,
      "Das Gewicht kommt aus den zehn echten Prüfungen, die Quote aus allem, was du bewertet hast: " +
      "Prüfungsaufgaben und Arbeitsblätter. Frisches zählt mehr — das Gewicht eines Ergebnisses " +
      "halbiert sich alle 14 Tage, damit die Zahl deinen heutigen Stand zeigt und nicht den " +
      "Durchschnitt der letzten Monate. Gerechnet wird über BE, nicht über Blätter: ein Blatt " +
      "über 80 BE wiegt schwerer als eines über 25."));

    if (!d.examBE && !d.genBE) {
      b.appendChild(el("div", "leer-hinweis",
        "Noch nichts bewertet. Löse ein Arbeitsblatt und drücke „Alles prüfen“ — " +
        "danach steht hier deine Prognose."));
      return;
    }

    /* Hero */
    const note = (window.note && d.hoch !== null) ? window.note(Math.round(d.hoch)) : null;
    const hero = el("div", "hero");
    hero.innerHTML =
      '<div><span class="eyebrow">Prognose</span><div class="zahl">' +
        (d.hoch === null ? "—" : Math.round(d.hoch)) + '</div><small>von 100 BE</small></div>' +
      (note ? '<div><span class="eyebrow">IHK-Note</span><div class="zahl">' + note.note + "</div></div>" : "") +
      '<div><span class="eyebrow">Datenbasis</span><div class="neben">' +
        Math.round(d.abgedeckt) + " %</div><small>des Prüfungsstoffs bewertet</small></div>" +
      '<div class="txt">Aus <b>' + G().fmt.kurz(Math.round(d.examBE)) + " BE</b> Prüfungsaufgaben und <b>" +
        G().fmt.kurz(Math.round(d.genRohBE)) + " BE</b> aus Arbeitsblättern" +
        (d.genRohBE > 0 && d.genBE < d.genRohBE * 0.75
          ? " (davon zählt nach Alter noch etwa " + Math.round(d.genBE / d.genRohBE * 100) + " %)"
          : "") + ". " +
      (d.duenn ? "<b>" + (d.duenn === 1 ? "Ein Thema ruht" : d.duenn + " Themen ruhen") +
        "</b> auf weniger als 15 geübten BE — dort ist die Quote eher Stimmung als Messwert. " : "") +
      (d.abgedeckt < 40
        ? "Die Datenbasis ist noch dünn — die Zahl schwankt. Jedes Arbeitsblatt macht sie belastbarer."
        : d.hoch >= 50
          ? "Bestanden ist ab 50. Die Liste unten sagt, wo die nächsten Punkte am billigsten liegen."
          : "Noch unter der Bestehensgrenze von 50. Arbeite die Liste unten von oben nach unten ab.") +
      "</div>";
    b.appendChild(hero);

    /* Tabelle */
    const t = el("table", "prio");
    t.innerHTML =
      "<thead><tr>" +
      "<th>Thema</th><th class='r'>Gewicht</th>" +
      "<th class='r weg'>Prüfungen</th><th class='r weg'>Generator</th>" +
      "<th class='r'>zusammen</th><th class='r'>Verlust</th><th>Priorität</th><th></th>" +
      "</tr></thead>";
    const tb = el("tbody");
    d.zeilen.forEach(z => {
      const tr = el("tr");
      const lage = window.lageVon ? window.lageVon(z.quote) : { klasse: "offen", wort: "—" };
      const prio = window.prioVon ? window.prioVon(z.risiko) : null;
      const proz = q => q === null || q === undefined ? "—" : Math.round(q * 100) + " %";

      /* Wie dick ist die Datenbasis? Ohne diese Angabe sieht eine Quote aus
         einem einzigen Blatt genauso verbindlich aus wie eine aus zehn.  */
      const deckung = z.genRohBE
        ? Math.round(z.genRohBE) + " BE geübt" +
          (z.genBlaetter ? " in " + z.genBlaetter + " Blättern" : "") +
          (z.juengste == null ? "" :
            z.juengste === 0 ? " · zuletzt heute"
          : z.juengste === 1 ? " · zuletzt gestern"
          : " · zuletzt vor " + z.juengste + " Tagen")
        : "noch nicht geübt";
      const td1 = el("td", "prio-thema");
      td1.innerHTML = esc(z.label) +
        "<small>" + z.typen + " Aufgabentypen · " + esc(deckung) +
        (z.genRohBE && z.genRohBE < 15 ? ' · <b class="duenn">dünne Basis</b>' : "") + "</small>";
      tr.appendChild(td1);

      tr.appendChild(el("td", "r zahl-m", z.gewicht ? Math.round(z.gewicht) + " BE" : "—"));
      tr.appendChild(el("td", "r zahl-m weg", proz(z.examQuote)));
      tr.appendChild(el("td", "r zahl-m weg", proz(z.genQuote)));

      const tdQ = el("td", "r");
      tdQ.innerHTML = '<span class="lage ' + lage.klasse + '"><i class="punkt"></i><b>' +
        proz(z.quote) + "</b></span>";
      tr.appendChild(tdQ);

      tr.appendChild(el("td", "r zahl-m",
        z.risiko === null ? "—" : "−" + G().fmt.kurz(Math.round(z.risiko * 10) / 10) + " BE"));

      const tdP = el("td");
      if (prio) tdP.innerHTML = '<span class="prio-marke ' + prio.klasse + '">' + prio.wort + "</span>";
      else tdP.textContent = "—";
      tr.appendChild(tdP);

      const tdB = el("td");
      if (z.typen) {
        const knopf = el("button", "btn ghost klein", "üben");
        knopf.onclick = () => window.GENUI.erzeugeBlatt({
          ids: idsFuer(z.key), anzahl: Math.min(8, z.typen * 2), titel: z.label + " — gezielt"
        });
        tdB.appendChild(knopf);
      }
      tr.appendChild(tdB);
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    b.appendChild(t);

    /* Fazit-Zeile */
    const schwach = d.zeilen.filter(z => z.risiko !== null && z.risiko >= 1.5).slice(0, 3);
    const ungeprueft = d.zeilen.filter(z => z.quote === null && z.gewicht >= 3).slice(0, 3);
    const fazit = el("div", "quelle-zeile");
    fazit.innerHTML =
      (schwach.length
        ? "<b>Zuerst dran:</b> " + schwach.map(z => esc(z.label) + " (−" +
            G().fmt.kurz(Math.round(z.risiko * 10) / 10) + " BE)").join(" · ") + ". "
        : "") +
      (ungeprueft.length
        ? "<b>Noch kein einziger Wert:</b> " + ungeprueft.map(z => esc(z.label)).join(" · ") +
          " — dort weißt du nicht, wie du stehst. "
        : "") +
      "Gewichtung der Themen: siehe Abschnitt „Themen: Stärken, Schwächen, Prioritäten“ weiter unten.";
    b.appendChild(fazit);

    if (d.papier.length) {
      const p = el("p");
      p.style.cssText = "font-size:13.5px;color:var(--muted);margin-top:10px";
      const sek = d.papier.reduce((s, x) => s + x.papierErgebnis.sekunden, 0);
      const be = d.papier.reduce((s, x) => s + x.papierErgebnis.max, 0);
      const hoch = Math.round(sek / 60 / Math.max(1, be) * 100);
      p.innerHTML = "<b>Tempo auf Papier:</b> hochgerechnet " + hoch + " Minuten für 100 BE " +
        (hoch <= 90 ? "— im Rahmen." : "— " + (hoch - 90) + " Minuten zu viel.");
      b.appendChild(p);
    }
  }

  /* ------------------------------------------------------------ Einhängen */
  function einhaengen() {
    const alt = window.renderStart;
    window.renderStart = function () {
      alt.apply(null, arguments);
      try { box(); } catch (e) { console.error("Gesamtbild:", e); }
    };
    try { box(); } catch (e) { console.error("Gesamtbild:", e); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { box, daten, idsFuer, examThema };
})();
