/* ============================================================================
   gen/start.js — Startseite aufräumen
   ----------------------------------------------------------------------------
   Über die letzten Wochen sind auf der Startseite elf Abschnitte gewachsen:
   Prüfungen, Gesamtstatistik, Arbeitsblätter, Satzbau, Übungsmodus,
   Diagramm-Trainer, Karteikarten, Suche, Themenprioritäten, Katalog-Lücken,
   Datensicherung.

   Nachgemessen auf dem Handy: 12.372 px — fast fünfzehn Bildschirme, 71
   Knöpfe. Die Prüfungssimulation lag auf Bildschirm 4,5, das Satzbau-Training
   auf 5,3, der Export auf 14,2. Wer jeden Tag lernt, scrollt damit jeden Tag
   an allem vorbei, was er gerade nicht braucht.

   Diese Datei baut die Startseite nicht neu, sondern legt sie zusammen:
   • oben der Countdown und EINE Empfehlung „Heute“
   • darunter sechs Kacheln als Einstieg
   • alle vorhandenen Abschnitte wandern in zuklappbare Blöcke

   Nichts wird gelöscht und nichts umgeschrieben — alles bleibt einen Klick
   weit entfernt und funktioniert unverändert. Welche Blöcke offen bleiben,
   merkt sich der Browser.
   ========================================================================== */
"use strict";

window.GENSTART = (function () {
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  /* Prüfungstermin — hier ändern, wenn ein anderer Termin gilt */
  const TERMIN = new Date(2026, 8, 30);      /* 30. September 2026 */
  const SK_OFFEN = "ihk2:start:offen";       /* welche Blöcke offen bleiben  */

  const lies = () => { try { return JSON.parse(localStorage.getItem(SK_OFFEN)) || []; } catch (e) { return []; } };
  const schreib = a => { try { localStorage.setItem(SK_OFFEN, JSON.stringify(a)); } catch (e) { } };

  function tageBis() {
    const heute = new Date(); heute.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((TERMIN - heute) / 864e5));
  }

  /* ---------------------------------------------------------------------
     Die elf Blöcke der Startseite. Erkannt wird zuerst an der id (die
     Module setzen sie), sonst an der Überschrift.
     ------------------------------------------------------------------ */
  const BLOECKE = [
    { key: "pruefungen", titel: /^Prüfungen$/,               name: "Alle zehn Prüfungen" },
    { key: "gesamt",  id: "gesamtBox",                       name: "Wo stehe ich?" },
    { key: "archiv",  id: "archivBox",                       name: "Archiv der Durchgänge" },
    { key: "spick",   id: "spickBox",                        name: "Spickzettel — der ganze Stoff" },
    { key: "komp",    id: "kompBox",                         name: "Kompendium — 52 FIAE-Themen" },
    { key: "plan",    id: "planBox",                         name: "Lernplan bis zur Prüfung" },
    { key: "tempo",   id: "zeitBox",                         name: "Tempo — Sekunden je BE" },
    { key: "pseudo",  id: "pseudoBox",                       name: "Pseudocode selbst schreiben" },
    { key: "blatt",   id: "genStartBox",                     name: "Arbeitsblätter & Simulation" },
    { key: "satz",    id: "satzBox",                         name: "Satzbau, Formeln, Operatoren" },
    { key: "uebung",     titel: /^Übungsmodus/,              name: "Übungsmodus nach Themen" },
    { key: "diagramm",   titel: /^Diagramm-Trainer$/,        name: "Diagramm-Trainer" },
    { key: "karten",     titel: /^Karteikarten$/,            name: "Karteikarten" },
    { key: "suche",      titel: /^Suche$/,                   name: "Suche in allen Aufgaben" },
    { key: "themen",     titel: /^Themen:/,                  name: "Themen: Stärken und Prioritäten" },
    { key: "luecken",    titel: /^Lücken im Katalog$/,       name: "Lücken im Katalog" },
    { key: "daten",      titel: /^Fortschritt sichern$/,     name: "Fortschritt sichern" }
  ];

  /* ------------------------------------------------------- Kennzahlen --- */
  function zahlen() {
    const z = {
      pruefungen: 0, begonnen: 0, vorlagen: 0, blaetter: 0, fehlerOffen: 0,
      satzKarten: 0, letzteSim: null, prognose: null, schwach: null
    };
    try { z.pruefungen = (typeof IHK_EXAMS !== "undefined" && IHK_EXAMS ? IHK_EXAMS : []).length; } catch (e) { }
    try {
      const s = (typeof SCORES !== "undefined" && SCORES) ? SCORES : {};
      const proExam = {};
      (typeof ALLE !== "undefined" && ALLE ? ALLE : []).forEach(it => {
        if (s[it.k] != null && it.exam) proExam[it.exam.examId] = true;
      });
      z.begonnen = Object.keys(proExam).length;
    } catch (e) { }
    try { z.vorlagen = window.GEN.alleVorlagen().length; } catch (e) { }
    try {
      const b = JSON.parse(localStorage.getItem("ihk2:gen:blaetter") || "[]");
      z.blaetter = b.length;
      z.letzteSim = b.find(x => x.pruefung) || null;   /* Liste ist neueste zuerst */
    } catch (e) { }
    try { z.fehlerOffen = window.GENFEHLER.liste().filter(x => !x.erledigt).length; } catch (e) { }
    try { z.satzKarten = window.GENSATZ ? (window.SATZ_POOL || []).length : 0; } catch (e) { }
    try {
      const d = window.GENGESAMT.daten();
      if (d) {
        if (d.hoch != null && isFinite(d.hoch)) z.prognose = Math.round(d.hoch);
        const mit = (d.zeilen || []).filter(x => x.quote != null && x.gewicht > 0);
        if (mit.length) z.schwach = mit.slice().sort((a, c) => a.quote - c.quote)[0];
      }
    } catch (e) { }
    return z;
  }

  /* --------------------------------------------------------- Empfehlung - */
  function empfehlung(z) {
    const tage = tageBis();

    /* 0. Wenn der Lernplan da ist, gilt sein heutiger Block — er rechnet
          Prüfungsgewicht gegen die eigene Quote und ist damit besser
          begründet als jede feste Regel hier.                          */
    try {
      const P = window.GENPLAN && window.GENPLAN.plan();
      const heuteP = P && P.tage && P.tage[0];
      const erledigt = (() => {
        try { return !!(JSON.parse(localStorage.getItem("ihk2:plan")) || {}).erledigt[heuteP.key]; }
        catch (e) { return false; }
      })();
      if (heuteP && heuteP.bloecke.length && !erledigt && heuteP.rest > 0) {
        const bl = heuteP.bloecke[0];
        return {
          titel: bl.titel,
          warum: bl.text,
          knopf: bl.minuten + " Minuten · los",
          tun: () => window.GENPLAN.starte(bl)
        };
      }
    } catch (e) { }

    /* 1. Noch gar nichts gemacht */
    if (!z.blaetter) {
      return {
        titel: "Ein erstes Arbeitsblatt",
        warum: "Zehn Aufgaben, automatisch geprüft — danach weiß die Statistik, wo du stehst.",
        knopf: "Arbeitsblatt erzeugen", tun: assistent
      };
    }
    /* 2. Noch nie eine Simulation — das ist der wichtigste Einzeltest */
    if (!z.letzteSim && tage >= 3) {
      return {
        titel: "Eine Prüfungssimulation über 90 Minuten",
        warum: "Du hast noch keine gemacht. Sie zeigt als Einzige, ob du in der Zeit bleibst.",
        knopf: "Simulation starten", tun: simulation
      };
    }
    /* 3. Offene Fehler im Journal — die billigsten Punkte */
    if (z.fehlerOffen >= 5) {
      return {
        titel: z.fehlerOffen + " Fehler warten im Journal",
        warum: "Zehn Minuten einordnen zeigt dir, wie viele Punkte gar kein Wissensproblem sind.",
        knopf: "Journal öffnen", tun: journal
      };
    }
    /* 4. Schwächstes Thema mit echtem Prüfungsgewicht */
    if (z.schwach && z.schwach.quote < 0.7) {
      return {
        titel: "Arbeitsblatt zum Thema " + z.schwach.label,
        warum: "Dein schwächstes Thema: " + Math.round(z.schwach.quote * 100) + " % bei " +
               Math.round(z.schwach.gewicht) + " BE Prüfungsgewicht.",
        knopf: "Aufgaben würfeln", tun: assistent
      };
    }
    /* 5. Letzte Woche: kurze Einheiten, Formulieren statt neuem Stoff */
    if (tage <= 7) {
      return {
        titel: "Satzbau-Training, fünf Minuten",
        warum: "In der letzten Woche bringt sauberes Formulieren mehr als neuer Stoff.",
        knopf: "Training starten", tun: satzbau
      };
    }
    return {
      titel: "Weiter mit einem Arbeitsblatt",
      warum: "Themen wählen, Anzahl festlegen — alles wird automatisch geprüft.",
      knopf: "Arbeitsblatt erzeugen", tun: assistent
    };
  }

  /* ------------------------------------------------------------ Ziele --- */
  function assistent() { if (window.GENUI) window.GENUI.assistent(); }
  function satzbau() { if (window.GENSATZ) window.GENSATZ.starten(); }
  function simulation() {
    if (!window.GENSIM) return;
    if (!confirm("Prüfungssimulation: 90 Minuten, rund 100 BE, keine Lösungen bis zur Abgabe.\n\nJetzt starten?")) return;
    window.GENSIM.starten();
  }
  function journal() {
    oeffneBlock("blatt", "fehlerBox");
    if (!$("fehlerBox") || $("fehlerBox").hidden) window.toast && window.toast("Das Journal füllt sich, sobald du ein Arbeitsblatt prüfst.");
  }
  function formeln() { if (window.GENFORMELN) window.GENFORMELN.zeigen(); }

  /* ------------------------------------------------------- Aufräumen ---- */
  function abschnittFinden(b) {
    const s = $("scStart");
    if (!s) return null;
    if (b.id) {
      const n = $(b.id);
      return (n && (n.parentNode === s || n.closest("details.st-block"))) ? n : null;
    }
    const kopf = [...s.querySelectorAll("h2")].find(h => b.titel.test((h.textContent || "").trim()));
    if (!kopf) return null;
    let n = kopf;
    while (n && n.parentNode && n.parentNode !== s) n = n.parentNode;
    return (n && n.parentNode === s) ? n : null;
  }

  function oeffneBlock(key, zielId) {
    const d = document.querySelector('details.st-block[data-key="' + key + '"]');
    if (!d) return false;
    d.open = true;
    merkeOffen();
    const ziel = (zielId && $(zielId) && !$(zielId).hidden) ? $(zielId) : d;
    setTimeout(() => ziel.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
    return true;
  }

  function merkeOffen() {
    schreib([...document.querySelectorAll("details.st-block[open]")].map(d => d.dataset.key));
  }

  function aufraeumen() {
    const s = $("scStart");
    if (!s) return;
    const offen = lies();
    let neu = 0;

    BLOECKE.forEach(b => {
      const knoten = abschnittFinden(b);
      if (!knoten || knoten.closest("details.st-block")) return;
      const d = el("details", "st-block");
      d.dataset.key = b.key;
      if (offen.indexOf(b.key) >= 0) d.open = true;
      const sum = el("summary");
      sum.appendChild(el("span", "st-name", b.name));
      sum.appendChild(el("span", "st-zahl"));
      d.appendChild(sum);
      knoten.parentNode.insertBefore(d, knoten);
      d.appendChild(knoten);
      d.addEventListener("toggle", merkeOffen);
      neu++;
    });

    kopfBauen();
    zahlenAnBloecke();
    return neu;
  }

  /* Kurzinfo neben jeder Blocküberschrift */
  function zahlenAnBloecke() {
    const z = zahlen();
    const setz = (key, text) => {
      const d = document.querySelector('details.st-block[data-key="' + key + '"] .st-zahl');
      if (d) d.textContent = text || "";
    };
    setz("pruefungen", z.pruefungen + " Prüfungen" + (z.begonnen ? " · " + z.begonnen + " begonnen" : ""));
    setz("gesamt", z.prognose != null ? "Prognose " + z.prognose + " %" : "noch keine Daten");
    setz("blatt", z.vorlagen + " Aufgabentypen" + (z.fehlerOffen ? " · " + z.fehlerOffen + " Fehler offen" : ""));
    setz("satz", z.satzKarten ? z.satzKarten + " Karten" : "");
    /* Kompendium: der eigene Lernstand, nicht die Zahl der Seiten — die ändert
       sich nie, der Stand jeden Tag. */
    (function () {
      const alleThemen = (window.KOMP_THEMEN || []).length;
      if (!alleThemen) return;
      let mein = {};
      try { mein = JSON.parse(localStorage.getItem("ihk2:komp:mein") || "{}") || {}; } catch (e) { }
      const zaehl = w => Object.keys(mein).filter(k => mein[k] === w).length;
      const angefasst = Object.keys(mein).length;
      const nochmal = zaehl("wiederholen");
      setz("komp", angefasst
        ? angefasst + " von " + alleThemen + " bearbeitet" + (nochmal ? " · " + nochmal + "× nochmal" : "")
        : alleThemen + " Themen");
    })();
    setz("themen", z.schwach ? "schwächstes: " + z.schwach.label : "");
  }

  /* ------------------------------------------------------------ Kopf ---- */
  function kopfBauen() {
    const s = $("scStart");
    if (!s) return;
    if (!$("stKopf")) {
      const k = el("div", "st-kopf"); k.id = "stKopf";
      s.insertBefore(k, s.firstChild);
    } else if (s.firstChild !== $("stKopf")) {
      s.insertBefore($("stKopf"), s.firstChild);
    }
    kopfAktualisieren();
  }

  function kopfAktualisieren() {
    const k = $("stKopf");
    if (!k) return;
    const z = zahlen();
    const tage = tageBis();
    const e = empfehlung(z);
    k.innerHTML = "";

    /* Countdown */
    const leiste = el("div", "st-count");
    leiste.appendChild(el("span", "st-tage",
      tage === 0 ? "heute" : tage + (tage === 1 ? " Tag" : " Tage")));
    leiste.appendChild(el("span", "st-bis", "bis zur AP1 am " +
      TERMIN.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })));
    if (z.prognose != null) {
      const p = el("span", "st-prog");
      p.appendChild(el("span", null, "Prognose "));
      p.appendChild(el("b", null, z.prognose + " %"));
      leiste.appendChild(p);
    }
    k.appendChild(leiste);

    /* Empfehlung */
    const h = el("div", "st-heute");
    const links = el("div", "st-htxt");
    links.appendChild(el("div", "st-hlabel", "Heute"));
    links.appendChild(el("div", "st-htitel", e.titel));
    links.appendChild(el("div", "st-hwarum", e.warum));
    h.appendChild(links);
    const b = el("button", "btn primary st-hknopf", e.knopf);
    b.type = "button";
    b.onclick = e.tun;
    h.appendChild(b);
    k.appendChild(h);

    /* Kacheln */
    const g = el("div", "st-kacheln");
    const kachel = (name, unten, ziel, warn) => {
      const t = el("button", "st-kachel" + (warn ? " warn" : ""));
      t.type = "button";
      t.appendChild(el("span", "st-kn", name));
      t.appendChild(el("span", "st-ku", unten));
      t.onclick = ziel;
      g.appendChild(t);
    };
    kachel("Prüfungen", z.begonnen ? z.begonnen + " von " + z.pruefungen + " begonnen" : z.pruefungen + " echte Prüfungen",
      () => oeffneBlock("pruefungen"));
    kachel("Arbeitsblatt", z.vorlagen + " Aufgabentypen", assistent);
    kachel("Simulation", z.letzteSim ? "zuletzt " + datum(z.letzteSim.erstellt) : "90 Minuten · 100 BE", simulation);
    kachel("Satzbau", z.satzKarten ? z.satzKarten + " Karten · 5 Min." : "5 Minuten", satzbau);
    kachel("Fehlerjournal", z.fehlerOffen ? z.fehlerOffen + " offen" : "nichts offen", journal, z.fehlerOffen >= 5);
    kachel("Formeln & Operatoren", "zum Ausdrucken", formeln);
    k.appendChild(g);

    /* alles auf-/zuklappen */
    const f = el("div", "st-fuss");
    const a = el("button", "st-link", "alles aufklappen");
    a.type = "button";
    a.onclick = () => {
      const bl = [...document.querySelectorAll("details.st-block")];
      const zu = bl.some(d => !d.open);
      bl.forEach(d => { d.open = zu; });
      merkeOffen();
      a.textContent = zu ? "alles zuklappen" : "alles aufklappen";
    };
    f.appendChild(a);
    k.appendChild(f);
  }

  /* „05.09.2026, 14:32“ -> „05.09.“ */
  function datum(s) {
    const m = /^(\d{2}\.\d{2}\.)/.exec(String(s || ""));
    return m ? m[1] : "schon gemacht";
  }

  /* --------------------------------------------------------- Einhängen -- */
  function einhaengen() {
    const alt = window.renderStart;
    if (typeof alt === "function") {
      window.renderStart = function () {
        alt.apply(null, arguments);
        try { setTimeout(aufraeumen, 0); } catch (e) { console.error("Startseite:", e); }
      };
    }
    try { setTimeout(aufraeumen, 80); setTimeout(aufraeumen, 400); } catch (e) { }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { aufraeumen, kopfAktualisieren, oeffneBlock, zahlen, tageBis, TERMIN, BLOECKE };
})();
