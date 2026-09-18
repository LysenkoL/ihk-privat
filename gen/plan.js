/* ============================================================================
   gen/plan.js — Lernplan bis zum Prüfungstag
   ----------------------------------------------------------------------------
   „Was mache ich heute?“ ist bei 24 verbleibenden Tagen die teuerste Frage:
   wer sie jeden Abend neu beantwortet, nimmt meistens das Thema, das sich am
   besten anfühlt — und das ist selten das, was Punkte bringt.

   Dieser Plan rechnet stattdessen. Für jedes Thema steht fest, wie viele BE
   es in den zehn echten Prüfungen im Schnitt bringt und wie gut du darin bist.
   Das Produkt aus Gewicht und Lücke ist das Risiko; die Tage werden nach
   Risiko vergeben, absteigend, mit drei festen Regeln:

     • Alle sieben Tage eine Prüfungssimulation über 90 Minuten — und eine
       gleich am Anfang, wenn noch keine gemacht wurde. Nur sie zeigt, ob die
       Zeit reicht.
     • Die letzten drei Tage: nichts Neues mehr. Formulieren, Formeln,
       Fehlerjournal — was jetzt noch nicht sitzt, sitzt auch nicht mehr.
     • Jeden Tag zusätzlich ein kurzer Block: offene Fehler einordnen oder
       Satzbau. Zehn Minuten, die am meisten zurückbringen.

   Der Plan wird bei jedem Öffnen NEU gerechnet — wer heute ein Thema
   hochzieht, sieht es morgen nicht mehr oben. Gespeichert werden nur die
   Minuten pro Tag und welche Tage abgehakt sind.
   ========================================================================== */
"use strict";

window.GENPLAN = (function () {
  const SK = "ihk2:plan";
  const TERMIN = (window.GENSTART && window.GENSTART.TERMIN) || new Date(2026, 8, 30);

  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  let CFG = { minuten: 45, erledigt: {} };
  try { Object.assign(CFG, JSON.parse(localStorage.getItem(SK)) || {}); } catch (e) { }
  function sichern() { try { localStorage.setItem(SK, JSON.stringify(CFG)); } catch (e) { } }

  const tag0 = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const WOCHENTAG = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  function tageBis() {
    return Math.max(0, Math.round((tag0(TERMIN) - tag0(new Date())) / 864e5));
  }

  /* ------------------------------------------------------------- Lage ---- */
  function lage() {
    const L = { themen: [], fehlerOffen: 0, simGemacht: 0, letzteSim: null, tempo: null };
    try {
      const d = window.GENGESAMT.daten();
      (d.zeilen || []).forEach(z => {
        if (!z.gewicht) return;                      /* nur echte Prüfungsthemen */
        const quote = z.quote == null ? null : z.quote;
        L.themen.push({
          key: z.key, label: z.label, gewicht: z.gewicht, quote: quote,
          /* unbekannt zählt wie 50 % — Nichtwissen ist auch ein Risiko */
          risiko: z.gewicht * (1 - (quote == null ? 0.5 : quote))
        });
      });
    } catch (e) { }

    /* ------------------------------------------------------------------
       Was wurde zuletzt wann geübt?

       Ohne diese Frage stand hier fünf Tage lang dasselbe Thema: der Plan
       wird jeden Tag neu gerechnet, und der erste Tag bekam immer das Thema
       mit dem höchsten Risiko. Solange die Quote darin nicht über die der
       anderen steigt — und von 63 % auf über alle anderen steigt sie nicht
       an einem Tag —, gewann es wieder. Das Abhaken half nicht: es wurde
       gespeichert, aber bei der Rechnung nie gelesen.

       Jetzt zählt, wann ein Thema zuletzt dran war. Quelle sind die
       tatsächlich erzeugten Arbeitsblätter (mit Datum und Themenschlüssel)
       und die von Hand abgehakten Tage.
       ------------------------------------------------------------------ */
    L.zuletzt = {};
    const merke = (key, tage, bewertet) => {
      if (!key) return;
      const alt = L.zuletzt[key];
      if (!alt || tage < alt.tage) L.zuletzt[key] = { tage: tage, bewertet: !!bewertet };
      else if (alt && tage === alt.tage && bewertet) alt.bewertet = true;
    };
    const tageHer = datumStr => {
      const m = String(datumStr || "").match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      if (!m) return null;
      const d = tag0(new Date(+m[3], +m[2] - 1, +m[1]));
      return Math.round((tag0(new Date()) - d) / 864e5);
    };
    try {
      const b = JSON.parse(localStorage.getItem("ihk2:gen:blaetter") || "[]");
      b.forEach(x => {
        const t = tageHer(x.erstellt);
        if (t == null || t < 0 || t > 14) return;
        ((x.opt && x.opt.themen) || []).forEach(k => merke(k, t, x.bewertet || x.punkte > 0));
      });
    } catch (e) { }
    /* Von Hand abgehakte Tage: dort steht seit dieser Fassung auch, WELCHES
       Thema der Tag hatte.                                              */
    try {
      Object.keys(CFG.erledigt || {}).forEach(k => {
        const e = CFG.erledigt[k];
        const thema = e && e.thema;
        if (!thema) return;
        const m = k.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (!m) return;
        const t = Math.round((tag0(new Date()) - tag0(new Date(+m[1], +m[2] - 1, +m[3]))) / 864e5);
        if (t >= 0 && t <= 14) merke(thema, t, true);
      });
    } catch (e) { }

    try { L.fehlerOffen = window.GENFEHLER.liste().filter(x => !x.erledigt).length; } catch (e) { }
    try {
      const b = JSON.parse(localStorage.getItem("ihk2:gen:blaetter") || "[]");
      const sims = b.filter(x => x.pruefung);
      L.simGemacht = sims.length;
      L.letzteSim = sims[0] || null;
    } catch (e) { }
    try { L.tempo = window.GENZEIT.daten(); } catch (e) { }

    /* Frisch Geübtes rutscht nach hinten — nicht für immer, nur für ein paar
       Tage. Ein Thema einmal zu bearbeiten heißt nicht, dass es sitzt; es
       fünfmal hintereinander zu bearbeiten, während sechs andere Themen
       unangetastet bleiben, bringt aber sicher weniger.                  */
    const DAEMPFUNG = { 0: 0.15, 1: 0.40, 2: 0.70, 3: 0.85 };
    L.themen.forEach(t => {
      const z = L.zuletzt[t.key];
      t.herTage = z ? z.tage : null;
      t.rohRisiko = t.risiko;
      if (z) {
        const f = DAEMPFUNG[z.tage];
        /* Nur angefangen, nicht bewertet: gilt nur für heute. */
        t.risiko = t.risiko * (f == null ? 1 : (z.bewertet ? f : (z.tage === 0 ? 0.5 : 1)));
      }
    });
    L.themen.sort((a, b) => b.risiko - a.risiko);
    return L;
  }

  /* ------------------------------------------------------------- Plan ---- */
  /* Ein Tag = ein Hauptblock + ein kurzer Zusatzblock. */
  function plan() {
    const n = tageBis();
    const L = lage();
    const tage = [];
    const heute = tag0(new Date());
    const min = CFG.minuten;

    /* Themen als Ring: erst einmal alle der Reihe nach (damit kein Thema
       ganz ausfällt), danach abwechselnd die Top 3 und die Top 6. So kommt
       nie dasselbe Thema an zwei Tagen hintereinander, die riskantesten
       aber deutlich öfter.                                               */
    const ring = [];
    const R = L.themen;
    for (let runde = 0; runde < 8 && R.length; runde++) {
      const wie_viele = runde === 0 ? R.length
                      : (runde % 2 ? Math.min(3, R.length) : Math.min(6, R.length));
      for (let i = 0; i < wie_viele; i++) ring.push(R[i]);
    }

    let ringIdx = 0;
    let simsGeplant = 0;
    const naechstesThema = () => {
      if (!ring.length) return null;
      const t = ring[ringIdx % ring.length]; ringIdx++;
      return t;
    };

    for (let i = 0; i <= n; i++) {
      const d = new Date(heute.getTime() + i * 864e5);
      const rest = n - i;                              /* Tage nach diesem */
      const eintrag = { datum: d, key: iso(d), rest: rest, bloecke: [] };

      if (rest === 0) {
        eintrag.bloecke.push({
          art: "pruefung", titel: "Prüfungstag", minuten: 90,
          text: "Ausweis, Taschenrechner (nicht programmierbar), Stifte. " +
                "Erst alle Aufgaben überfliegen, dann mit der leichtesten anfangen."
        });
        tage.push(eintrag); continue;
      }

      if (rest <= 2) {
        eintrag.bloecke.push({
          art: "satz", titel: "Satzbau-Training", minuten: Math.min(20, min),
          text: "Nichts Neues mehr. Formulieren üben — die Punkte gehen sonst " +
                "an halben Sätzen verloren, nicht am Wissen."
        });
        eintrag.bloecke.push({
          art: "formeln", titel: "Formelblatt durchgehen", minuten: 15,
          text: "Einmal laut durch: Einheiten, Umrechnungen, Wirkungsgrad, IP-Rechnen."
        });
        tage.push(eintrag); continue;
      }

      /* Simulation: sofort, wenn noch keine gemacht — sonst alle 7 Tage */
      const simFaellig = (L.simGemacht + simsGeplant === 0 && i <= 1) ||
                         (i > 0 && i % 7 === 0 && rest >= 4);
      if (simFaellig) {
        simsGeplant++;
        eintrag.bloecke.push({
          art: "simulation", titel: "Prüfungssimulation, 90 Minuten", minuten: 90,
          text: (L.simGemacht + simsGeplant === 1
            ? "Die erste — sie ist der ehrlichste Messwert, den du bekommen kannst."
            : "Unter Zeitdruck, ohne Lösungen. Danach das Fehlerjournal einordnen.")
        });
        tage.push(eintrag); continue;
      }

      const t = naechstesThema();
      if (t) {
        eintrag.bloecke.push({
          art: "thema", thema: t.key, titel: "Arbeitsblatt: " + t.label,
          minuten: Math.max(20, min - 10),
          text: (t.quote == null
            ? "Noch nie bewertet — " + Math.round(t.gewicht) + " BE Prüfungsgewicht. Blindfleck."
            : Math.round(t.quote * 100) + " % bei " + Math.round(t.gewicht) + " BE Gewicht.") +
            (t.herTage == null ? " Noch nicht geübt."
             : t.herTage === 0 ? " Heute schon dran gewesen."
             : t.herTage === 1 ? " Gestern geübt."
             : " Zuletzt vor " + t.herTage + " Tagen geübt.")
        });
      }
      /* kurzer Zusatzblock */
      if (L.fehlerOffen >= 3 && i % 2 === 0) {
        eintrag.bloecke.push({
          art: "journal", titel: "Fehlerjournal einordnen", minuten: 10,
          text: L.fehlerOffen + " offene Einträge. Jeder eingeordnete Fehler zeigt, " +
                "ob Wissen fehlt oder nur die Sorgfalt."
        });
      } else {
        eintrag.bloecke.push({
          art: "satz", titel: "Satzbau-Training", minuten: 10,
          text: "Fünf Karten reichen. Vom Stichwort zum ganzen Satz."
        });
      }
      tage.push(eintrag);
    }
    return { tage, lage: L, minuten: min };
  }

  /* ----------------------------------------------------------- Aktionen -- */
  function starte(b) {
    if (b.art === "simulation" || b.art === "pruefung") {
      if (window.GENSIM && confirm("90 Minuten, rund 100 BE, keine Lösungen bis zur Abgabe.\n\nJetzt starten?"))
        window.GENSIM.starten();
    } else if (b.art === "satz") { if (window.GENSATZ) window.GENSATZ.starten(); }
    else if (b.art === "formeln") { if (window.GENFORMELN) window.GENFORMELN.zeigen(); }
    else if (b.art === "journal") { if (window.GENSTART) window.GENSTART.oeffneBlock("blatt", "fehlerBox"); }
    else if (b.art === "thema") {
      if (!window.GENUI) return;
      window.GENUI.erzeugeBlatt({ themen: [b.thema], anzahl: 8, zeit: 1,
                                  titel: "Plan: " + b.titel.replace(/^Arbeitsblatt: /, "") });
    }
  }

  /* ----------------------------------------------------------- Anzeige --- */
  function box() {
    const s = $("scStart");
    if (!s) return;
    let b = $("planBox");
    if (!b) {
      b = el("div", "abschnitt"); b.id = "planBox";
      const g = $("gesamtBox");
      const nach = g ? (g.closest("details.st-block") || g) : null;
      if (nach && nach.parentNode) nach.parentNode.insertBefore(b, nach.nextSibling);
      else s.appendChild(b);
    }
    b.innerHTML = "";
    const P = plan();
    const n = tageBis();

    b.appendChild(el("h2", null, "Lernplan bis zur Prüfung"));
    const p = el("p", null, "");
    p.innerHTML = n === 0
      ? "Heute ist Prüfungstag."
      : "<b>" + n + " Tage.</b> Der Plan wird jedes Mal neu gerechnet: " +
        "Prüfungsgewicht × deine Lücke. Was du hochziehst, rutscht von selbst nach unten.";
    b.appendChild(p);

    /* Minuten pro Tag */
    const stell = el("div", "pl-stell");
    stell.appendChild(el("span", null, "Zeit pro Tag:"));
    [30, 45, 60, 90].forEach(m => {
      const k = el("button", "pl-min" + (CFG.minuten === m ? " an" : ""), m + " min");
      k.type = "button";
      k.onclick = () => { CFG.minuten = m; sichern(); box(); };
      stell.appendChild(k);
    });
    b.appendChild(stell);

    const liste = el("div", "pl-liste");
    const alle = b.dataset.alle === "1";
    const zeigen = alle ? P.tage : P.tage.slice(0, 7);
    zeigen.forEach((t, i) => liste.appendChild(tagEl(t, i === 0)));
    b.appendChild(liste);

    /* ------------------------------------------------------------------
       „Was ist eigentlich noch offen?“ — die Frage, die der Tagesplan allein
       nicht beantwortet. Hier stehen alle Prüfungsthemen mit Gewicht, Stand
       und dem Tag, an dem sie zuletzt dran waren. Ein Klick startet das
       Thema sofort, auch wenn der Plan heute etwas anderes vorschlägt.
       ------------------------------------------------------------------ */
    if (P.lage.themen.length) {
      const ueb = el("details", "pl-themen");
      ueb.open = b.dataset.themenOffen === "1";
      ueb.addEventListener("toggle", () => { b.dataset.themenOffen = ueb.open ? "1" : "0"; });
      const sum = el("summary");
      const nieGeübt = P.lage.themen.filter(t => t.herTage == null).length;
      sum.append(el("span", null, "Alle Themen — was ist offen?"),
        el("span", "pl-th-zahl", P.lage.themen.length + " Themen" +
          (nieGeübt ? " · " + nieGeübt + " noch nie geübt" : "")));
      ueb.appendChild(sum);

      const tab = el("div", "pl-th-liste");
      P.lage.themen.forEach(t => {
        const r = el("button", "pl-th");
        r.type = "button";
        const links = el("div", "pl-th-txt");
        links.appendChild(el("div", "pl-th-name", t.label));
        const stand = t.quote == null ? "noch nie bewertet" : Math.round(t.quote * 100) + " %";
        const wann = t.herTage == null ? "noch nicht geübt"
                   : t.herTage === 0 ? "heute geübt"
                   : t.herTage === 1 ? "gestern geübt"
                   : "vor " + t.herTage + " Tagen";
        links.appendChild(el("div", "pl-th-meta",
          stand + " · " + Math.round(t.gewicht) + " BE Gewicht · " + wann));
        r.appendChild(links);
        r.appendChild(el("span", "pl-th-los", "üben"));
        if (t.herTage === 0) r.classList.add("frisch");
        if (t.herTage == null) r.classList.add("neu");
        r.onclick = () => starte({ art: "thema", thema: t.key, titel: "Arbeitsblatt: " + t.label });
        tab.appendChild(r);
      });
      ueb.appendChild(tab);
      b.appendChild(ueb);
    }

    if (P.tage.length > 7) {
      const mehr = el("button", "pl-mehr", alle ? "nur die nächste Woche" : "alle " + P.tage.length + " Tage anzeigen");
      mehr.type = "button";
      mehr.onclick = () => { b.dataset.alle = alle ? "0" : "1"; box(); };
      const f = el("div", "pl-fuss"); f.appendChild(mehr);
      b.appendChild(f);
    }
  }

  function tagEl(t, heute) {
    const fertig = !!CFG.erledigt[t.key];
    const z = el("div", "pl-tag" + (heute ? " heute" : "") + (fertig ? " fertig" : ""));

    const kopf = el("div", "pl-kopf");
    const d = t.datum;
    kopf.appendChild(el("span", "pl-datum",
      (heute ? "Heute · " : "") + WOCHENTAG[d.getDay()] + " " +
      String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0")));
    kopf.appendChild(el("span", "pl-rest", t.rest === 0 ? "Prüfung" : "noch " + t.rest + " Tage"));
    const hak = el("button", "pl-hak" + (fertig ? " an" : ""), fertig ? "✓ erledigt" : "abhaken");
    hak.type = "button";
    hak.onclick = () => {
      if (fertig) delete CFG.erledigt[t.key];
      else {
        /* Das Thema mitschreiben — sonst weiß der Plan morgen nicht, was
           heute dran war, und schlägt dasselbe noch einmal vor.        */
        const haupt = t.bloecke.find(x => x.art === "thema");
        CFG.erledigt[t.key] = { thema: haupt ? haupt.thema : null, art: haupt ? "thema" : (t.bloecke[0] || {}).art };
      }
      sichern(); box();
    };
    kopf.appendChild(hak);
    z.appendChild(kopf);

    t.bloecke.forEach(bl => {
      const r = el("div", "pl-block pl-" + bl.art);
      const links = el("div", "pl-btxt");
      links.appendChild(el("div", "pl-btitel", bl.titel + "  ·  " + bl.minuten + " min"));
      links.appendChild(el("div", "pl-bwarum", bl.text));
      r.appendChild(links);
      if (bl.art !== "pruefung") {
        const k = el("button", "btn ghost klein", "los");
        k.type = "button";
        k.onclick = () => starte(bl);
        r.appendChild(k);
      }
      z.appendChild(r);
    });
    return z;
  }

  /* --------------------------------------------------------- Einhängen -- */
  function einhaengen() {
    const alt = window.renderStart;
    if (typeof alt === "function") {
      window.renderStart = function () {
        alt.apply(null, arguments);
        try { setTimeout(box, 0); } catch (e) { console.error("Plan:", e); }
      };
    }
    setTimeout(box, 300);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { plan, lage, box, tageBis, starte };
})();
