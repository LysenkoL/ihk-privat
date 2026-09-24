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

   v29 (23.09.) — „Finden statt Suchen“
   • Die neunzehn Blöcke standen als gleich aussehende Zeilen in
     Großbuchstaben untereinander; man musste jede lesen. Jetzt stehen sie in
     fünf Gruppen (Prüfen · Üben · Nachschlagen · Auswerten · Daten), jede
     Zeile mit Symbol und einer Zeile Erklärung, in normaler Schreibweise.
   • Die Reihenfolge ist fest. Früher hängte jedes Modul seinen Block ein,
     wo es gerade Platz fand — die Rechenaufgaben landeten ganz unten.
     `ordnen()` sortiert nach jedem Umbau wieder nach der Tabelle unten.
   • „Heute“ und der Endspurt-Plan zeigten zwei verschiedene Aufgaben für
     denselben Tag. Solange der Endspurt läuft, gilt jetzt nur er.
   • Ganz oben ein Suchfeld über alles (gen/finder.js).
   ========================================================================== */
"use strict";

window.GENSTART = (function () {
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const ikon = (name, g, k) => window.GENIKON ? window.GENIKON.knoten(name, g, k) : el("span", k);

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
     Gruppen und Blöcke. Die Reihenfolge hier IST die Reihenfolge auf der
     Seite. Erkannt wird ein Block zuerst an der id (die Module setzen sie),
     sonst an der Überschrift. `worte` braucht nur das Suchfeld.
     ------------------------------------------------------------------ */
  const GRUPPEN = [
    { key: "pruefen",      name: "Prüfen & simulieren" },
    { key: "ueben",        name: "Üben" },
    { key: "nachschlagen", name: "Nachschlagen" },
    { key: "auswerten",    name: "Auswerten & planen" },
    { key: "daten",        name: "Daten" }
  ];

  const BLOECKE = [
    { key: "pruefungen", titel: /^Prüfungen$/, gruppe: "pruefen", ikon: "pruefung",
      name: "Alle zehn Prüfungen", info: "Echte AP1-Bögen 2021–2026 mit Uhr und Auswertung",
      worte: "prüfung bogen klausur frühjahr herbst jahrgang starten fortsetzen zurücksetzen offline laden" },
    { key: "azubi", id: "azubiBox", gruppe: "pruefen", ikon: "azubi",
      name: "Azubi-Navigator (u-form)", info: "13 Simulationen aus deinem Konto — speichern, weitermachen, auswerten",
      worte: "azubi navigator u-form uform ausbildung.io simulation prüfungssimulation vertiefende übung weitermachen" },
    { key: "blatt", id: "genStartBox", gruppe: "pruefen", ikon: "blatt",
      name: "Arbeitsblätter & Simulation", info: "Generator mit neuen Zahlen, 90-Minuten-Simulation, Fehlerjournal",
      worte: "generator arbeitsblatt simulation 90 minuten neu würfeln papiermodus fehlerjournal app installieren" },
    { key: "rechnen", id: "rechnenBlock", gruppe: "pruefen", ikon: "rechnen",
      name: "Rechenaufgaben aus allen Prüfungen", info: "Nur die Rechenaufgaben, quer durch alle Jahrgänge",
      worte: "rechnen rechnung kalkulation berechnen einheit prozent" },
    { key: "archiv", id: "archivBox", gruppe: "pruefen", ikon: "archiv",
      name: "Archiv der Durchgänge", info: "Frühere Versuche und ihre Ergebnisse",
      worte: "archiv versuch durchgang ergebnis verlauf vergleich" },
    { key: "tempo", id: "zeitBox", gruppe: "pruefen", ikon: "tempo",
      name: "Tempo — Sekunden je BE", info: "Wie schnell du pro Punkt bist",
      worte: "tempo zeit sekunden geschwindigkeit uhr" },

    { key: "wieder", id: "wiederBox", gruppe: "ueben", ikon: "wieder",
      name: "Fehler wiederholen", info: "Alles, wo du Punkte verloren hast — heute fällig zuerst",
      worte: "fehler wiederholen wiederholung falsch verloren punkte nochmal schlange täglich spaced" },
    { key: "uebung", titel: /^Übungsmodus/, gruppe: "ueben", ikon: "uebung",
      name: "Übungsmodus nach Themen", info: "Aufgaben aus echten Prüfungen, nach Thema gefiltert",
      worte: "übung üben thema themen drill verhauen ungeübt" },
    { key: "diagramm", titel: /^Diagramm-Trainer$/, gruppe: "ueben", ikon: "diagramm",
      name: "Diagramm-Trainer", info: "Netzplan, Gantt, ER-Modell, UML — jedes Mal neu",
      worte: "diagramm netzplan gantt er modell uml aktivitätsdiagramm klassendiagramm puffer vorgang" },
    { key: "er", id: "erUebungBlock", gruppe: "ueben", ikon: "er",
      name: "ER-Modelle — drei Übungsaufgaben", info: "Kardinalitäten, Schlüssel, n:m gezielt üben",
      worte: "er modell entität kardinalität datenbank schlüssel beziehung" },
    { key: "sql", id: "sqlBox", gruppe: "ueben", ikon: "sql",
      name: "SQL-Trainer (AP2)", info: "44 Aufgaben an einer echten Datenbank, mit Prüfung",
      worte: "sql select join group by having insert update delete create table datenbank abfrage ap2 view unterabfrage" },
    { key: "pseudo", id: "pseudoBox", gruppe: "ueben", ikon: "pseudo",
      name: "Pseudocode selbst schreiben", info: "Algorithmen schreiben, prüfen lassen",
      worte: "pseudocode algorithmus schleife programmieren code schreibtischtest" },
    { key: "karten", titel: /^Karteikarten$/, gruppe: "ueben", ikon: "karten",
      name: "Karteikarten", info: "Begriffe und Kurzfragen aus den Musterlösungen",
      worte: "karteikarten karten begriffe fragen anki lernen" },
    { key: "satz", id: "satzBox", gruppe: "ueben", ikon: "satz",
      name: "Satzbau, Formeln, Operatoren", info: "Antworten richtig formulieren, Formelblatt zum Drucken",
      worte: "satzbau formulieren erläutern begründen nennen operator formel formelblatt merkblatt" },

    { key: "katalog", id: "katalogBox", gruppe: "nachschlagen", ikon: "katalog",
      name: "Prüfungskatalog AP1", info: "Das Original der ZPA: 167 Stichworte, Lücken, eigener Stand",
      worte: "katalog pruefungskatalog zpa stichwort themenkreis fragenkomplex luecken ap2 gestrichen notation anhang" },
    { key: "glossar", id: "glossarBox", gruppe: "nachschlagen", ikon: "glossar",
      name: "Fachbegriffe DE → RU", info: "400 Begriffe übersetzt und einfach erklärt, AP1/AP2 markiert",
      worte: "glossar fachbegriffe übersetzung russisch wörterbuch begriffe vokabeln deutsch ap2 перевод" },
    { key: "spick", id: "spickBox", gruppe: "nachschlagen", ikon: "spick",
      name: "Spickzettel", info: "Der ganze Stoff in 20 Kapiteln",
      worte: "spickzettel stoff kapitel nachschlagen zusammenfassung" },
    { key: "komp", id: "kompBox", gruppe: "nachschlagen", ikon: "komp",
      name: "Kompendium", info: "52 FIAE-Themen ausführlich erklärt",
      worte: "kompendium themen notion nachschlagen erklärung" },
    { key: "suche", titel: /^Suche$/, gruppe: "nachschlagen", ikon: "suche",
      name: "Suche in allen Aufgaben", info: "Volltext über Aufgaben und Musterlösungen",
      worte: "suche volltext aufgaben musterlösung finden" },

    { key: "gesamt", id: "gesamtBox", gruppe: "auswerten", ikon: "gesamt",
      name: "Wo stehe ich?", info: "Prognose und Quote je Thema",
      worte: "statistik prognose stand quote gesamt punkte note" },
    { key: "themen", titel: /^Themen:/, gruppe: "auswerten", ikon: "themen",
      name: "Themen: Stärken und Prioritäten", info: "Welches Thema dich die meisten Punkte kostet",
      worte: "themen stärken schwächen priorität gewicht verlust" },
    /* Kurzliste aus dem Podcast — seit v30 ersetzt durch den vollständigen
       Prüfungskatalog (gen/katalog.js). Bleibt im DOM, ist aber verborgen. */
    { key: "luecken", titel: /^Lücken im Katalog$/, gruppe: "auswerten", ikon: "luecken", versteckt: true,
      name: "Lücken im Katalog", info: "Katalogthemen, die in keiner Prüfung vorkommen",
      worte: "lücken katalog prüfungskatalog fehlende themen" },
    { key: "plan", id: "planBox", gruppe: "auswerten", ikon: "plan",
      name: "Lernplan bis zur Prüfung", info: "Rechnet jeden Tag das riskanteste Thema aus",
      worte: "lernplan plan tage thema risiko" },

    { key: "daten", titel: /^(Fortschritt sichern|Geräte abgleichen & sichern)$/, gruppe: "daten", ikon: "daten",
      name: "Geräte abgleichen & sichern", info: "Handy ↔ Computer: Stand senden und holen — ohne Überschreiben",
      worte: "export import sichern backup datei umziehen löschen handy computer abgleichen synchronisieren sync stand senden holen" }
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

    /* -1. Endspurt: ein fester Plan für die letzten Tage. Solange er läuft,
           ist SEIN heutiger Tag die Empfehlung — sonst stünden oben und im
           Plan zwei verschiedene Dinge für denselben Tag.                 */
    try {
      const E = window.GENENDSPURT;
      if (E && E.aktiv()) {
        const liste = E.plan();
        const t = liste[0];
        if (t && !E.erledigt(t.key)) {
          return {
            tag: t, titel: t.titel, warum: t.text, minuten: t.minuten,
            knopf: t.art === "pruefungstag" ? null : "Los",
            tun: () => E.starte(t),
            zusatz: t.zusatz ? { titel: t.zusatz.titel, tun: () => E.starte(t.zusatz) } : null,
            abhaken: () => { E.abhaken(t.key); }
          };
        }
        if (t) {
          const m = liste[1];
          return {
            tag: t, fertig: true, titel: "Heute erledigt",
            warum: m ? "Morgen: " + m.titel + " · " + m.minuten + " min" : "Morgen ist Prüfung.",
            knopf: "5 Min. Satzbau", tun: satzbau, zweitrangig: true,
            abhaken: () => { E.abhaken(t.key); }
          };
        }
      }
    } catch (e) { }

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
          minuten: bl.minuten,
          knopf: "Los",
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

  function blockVon(key) {
    return document.querySelector('#scStart > details.st-block[data-key="' + key + '"]');
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
    schreib([...document.querySelectorAll("details.st-block[open]")].map(d => d.dataset.key).filter(Boolean));
  }

  /* Zusammenfassungszeile: Symbol · Name + eine Zeile Erklärung · Zahl.
     Die Zahl-Zelle bleibt DIESELBE, falls ein Modul sie schon angelegt hat
     (er-uebung.js, rechnen.js schreiben ihren Stand dort hinein).        */
  function dekorieren(d, b) {
    d.dataset.gruppe = b.gruppe;
    if (b.versteckt) d.hidden = true;
    const sum = d.querySelector(":scope > summary");
    if (!sum || sum.dataset.deko === "1") return;
    const zahl = sum.querySelector(".st-zahl") || el("span", "st-zahl");
    sum.textContent = "";
    sum.dataset.deko = "1";
    sum.appendChild(ikon(b.ikon, 18, "st-ico"));
    const t = el("span", "st-text");
    t.appendChild(el("span", "st-name", b.name));
    if (b.info) t.appendChild(el("span", "st-info", b.info));
    sum.appendChild(t);
    sum.appendChild(zahl);
  }

  function aufraeumen() {
    const s = $("scStart");
    if (!s) return;
    const offen = lies();
    let neu = 0;

    BLOECKE.forEach(b => {
      const knoten = abschnittFinden(b);
      if (!knoten) return;
      /* Module, die ihren Block schon selbst als <details> bauen */
      if (knoten.matches("details.st-block")) {
        if (!knoten.dataset.key) {
          knoten.dataset.key = b.key;
          if (offen.indexOf(b.key) >= 0) knoten.open = true;
          knoten.addEventListener("toggle", merkeOffen);
        }
        dekorieren(knoten, b);
        return;
      }
      const huelle = knoten.closest("details.st-block");
      if (huelle) { dekorieren(huelle, b); return; }
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
      dekorieren(d, b);
      neu++;
    });

    kopfBauen();
    zahlenAnBloecke();
    einleitungKuerzen();
    ordnen();
    beobachten();
    return neu;
  }

  /* Lange Einleitungen (Diagramm-Trainer: 600 Zeichen) schieben die Knöpfe
     auf dem Telefon aus dem Bild. Drei Zeilen, ein Tipp zeigt den Rest.  */
  function einleitungKuerzen() {
    document.querySelectorAll("#scStart details.st-block > .abschnitt > p, #scStart details.st-block > div > h2 + p")
      .forEach(p => {
        if (p.dataset.kurz || (p.textContent || "").length < 240) return;
        p.dataset.kurz = "1";
        p.classList.add("st-lang");
        p.title = "antippen für den ganzen Text";
        p.addEventListener("click", () => p.classList.toggle("st-lang"));
      });
  }

  /* ---------------------------------------------------------- Ordnen ---
     Feste Reihenfolge: Suchfeld · Kopf · „weiter, wo ich war“ · Endspurt ·
     dann die Gruppen. Verschoben wird nur, was nicht schon an seinem Platz
     steht — ein zweiter Lauf ändert nichts und löst damit auch den
     MutationObserver nicht erneut aus.                                   */
  function gruppenKopf(g, s, erste) {
    let k = $("stGr-" + g.key);
    if (!k) {
      k = el("div", "st-gruppe"); k.id = "stGr-" + g.key;
      k.dataset.gruppe = g.key;
      k.setAttribute("role", "heading"); k.setAttribute("aria-level", "2");
      k.appendChild(el("span", "st-gname", g.name));
      s.appendChild(k);
    }
    /* „alles aufklappen“ steht an der ersten Gruppenüberschrift */
    let a = k.querySelector(".st-link");
    if (erste && !a) {
      a = el("button", "st-link st-alle", "alle aufklappen");
      a.type = "button";
      a.onclick = () => {
        const bl = [...document.querySelectorAll("#scStart details.st-block")].filter(d => !d.hidden);
        const zu = bl.some(d => !d.open);
        bl.forEach(d => { d.open = zu; });
        merkeOffen();
        a.textContent = zu ? "alle zuklappen" : "alle aufklappen";
      };
      k.appendChild(a);
    }
    return k;
  }

  let ordnetGerade = false;
  function ordnen() {
    const s = $("scStart");
    if (!s || ordnetGerade) return;
    ordnetGerade = true;
    try {
      const soll = [];
      const nimm = n => { if (n && n.parentNode === s && soll.indexOf(n) < 0) soll.push(n); };

      /* Der Endspurt setzt sich beim ersten Bauen gern in den Kopf hinein */
      const es = $("endspurtBox");
      if (es && es.parentNode !== s) s.appendChild(es);

      nimm($("stSuche"));
      nimm($("stKopf"));
      nimm($("hgWeiter"));
      nimm(es);
      GRUPPEN.forEach((g, i) => {
        const kopf = gruppenKopf(g, s, i === 0);
        const bl = BLOECKE.filter(b => b.gruppe === g.key).map(b => blockVon(b.key)).filter(Boolean);
        kopf.hidden = !bl.some(d => !d.hidden);
        nimm(kopf);
        bl.forEach(nimm);
      });
      /* Unbekanntes bleibt erhalten, rutscht aber hinter die Gruppen */
      [...s.children].forEach(c => { if (c.id !== "versionZeile") nimm(c); });
      nimm($("versionZeile"));

      soll.forEach((n, i) => {
        if (s.children[i] !== n) s.insertBefore(n, s.children[i] || null);
      });
    } catch (e) { console.error("Startseite ordnen:", e); }
    ordnetGerade = false;
  }

  let beobachter = null, geplant = false;
  function beobachten() {
    const s = $("scStart");
    if (!s || beobachter || !window.MutationObserver) return;
    beobachter = new MutationObserver(() => {
      if (ordnetGerade || geplant) return;
      geplant = true;
      setTimeout(() => { geplant = false; aufraeumenLeise(); }, 30);
    });
    beobachter.observe(s, { childList: true });
  }
  /* Nach fremden Umbauten: neue Blöcke erkennen und einsortieren, aber
     den Kopf nicht neu zeichnen (sonst flackert „Heute“).                 */
  function aufraeumenLeise() {
    const s = $("scStart");
    if (!s) return;
    const offen = lies();
    BLOECKE.forEach(b => {
      const knoten = abschnittFinden(b);
      if (!knoten) return;
      if (knoten.matches("details.st-block")) {
        if (!knoten.dataset.key) {
          knoten.dataset.key = b.key;
          if (offen.indexOf(b.key) >= 0) knoten.open = true;
          knoten.addEventListener("toggle", merkeOffen);
        }
        dekorieren(knoten, b);
      } else if (!knoten.closest("details.st-block")) {
        aufraeumen();
      }
    });
    ordnen();
  }

  /* Kurzinfo neben jeder Blocküberschrift */
  function zahlenAnBloecke() {
    const z = zahlen();
    const setz = (key, text) => {
      const d = document.querySelector('details.st-block[data-key="' + key + '"] .st-zahl');
      if (d) d.textContent = text || "";
    };
    setz("pruefungen", z.begonnen ? z.begonnen + " von " + z.pruefungen + " begonnen" : z.pruefungen + "");
    setz("gesamt", z.prognose != null ? "Prognose " + z.prognose + " %" : "");
    setz("blatt", z.fehlerOffen ? z.fehlerOffen + " Fehler offen" : z.vorlagen + " Typen");
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
        ? angefasst + "/" + alleThemen + (nochmal ? " · " + nochmal + "× nochmal" : "")
        : alleThemen + "");
    })();
    setz("spick", (window.SPICK_KAPITEL || []).length ? (window.SPICK_KAPITEL || []).length + "" : "");
    setz("karten", (typeof CARDS !== "undefined" && CARDS.length) ? CARDS.length + "" : "");
    setz("themen", z.schwach ? "schwach: " + z.schwach.label : "");
  }

  /* ------------------------------------------------------------ Kopf ---- */
  function kopfBauen() {
    const s = $("scStart");
    if (!s) return;
    if (!$("stKopf")) {
      const k = el("div", "st-kopf"); k.id = "stKopf";
      s.insertBefore(k, s.firstChild);
    } else if (s.firstChild !== $("stKopf") && !$("stSuche")) {
      s.insertBefore($("stKopf"), s.firstChild);
    }
    kopfAktualisieren();
  }

  const WT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const kurzDatum = d => WT[d.getDay()] + " " + String(d.getDate()).padStart(2, "0") + "." +
                         String(d.getMonth() + 1).padStart(2, "0") + ".";

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
      tage === 0 ? "Heute" : tage + (tage === 1 ? " Tag" : " Tage")));
    leiste.appendChild(el("span", "st-bis", tage === 0 ? "ist Prüfung — viel Erfolg!" :
      "bis zur AP1 · " + kurzDatum(TERMIN)));
    if (z.prognose != null) {
      const p = el("span", "st-prog");
      p.appendChild(el("span", null, "Prognose "));
      p.appendChild(el("b", null, z.prognose + " %"));
      leiste.appendChild(p);
    }
    k.appendChild(leiste);

    /* Empfehlung */
    const h = el("div", "st-heute" + (e.fertig ? " fertig" : ""));
    const hk = el("div", "st-hkopf");
    hk.appendChild(el("span", "st-hlabel", "Heute" + (e.tag ? " · " + kurzDatum(new Date(e.tag.key + "T00:00:00")) : "")));
    if (e.minuten) hk.appendChild(el("span", "st-hmin", e.minuten + " min"));
    h.appendChild(hk);
    const links = el("div", "st-htxt");
    const titel = el("div", "st-htitel");
    if (e.fertig) titel.appendChild(ikon("check", 18, "st-hok"));
    titel.appendChild(document.createTextNode(e.titel));
    links.appendChild(titel);
    if (e.warum) {
      const w = el("div", "st-hwarum", e.warum);
      /* lange Begründungen: zwei Zeilen, ein Tipp klappt auf */
      if (e.warum.length > 110) {
        w.classList.add("kurz");
        w.title = "antippen für den ganzen Text";
        w.onclick = () => w.classList.toggle("kurz");
      }
      links.appendChild(w);
    }
    h.appendChild(links);

    const akt = el("div", "st-haktion");
    if (e.knopf) {
      const b = el("button", "btn " + (e.zweitrangig ? "" : "primary ") + "st-hknopf");
      b.type = "button";
      if (!e.zweitrangig) b.appendChild(ikon("play", 14, "st-bico"));
      b.appendChild(document.createTextNode(e.knopf));
      b.onclick = e.tun;
      akt.appendChild(b);
    }
    if (e.zusatz) {
      const b2 = el("button", "btn st-hzusatz", "→ " + e.zusatz.titel);
      b2.type = "button";
      b2.onclick = e.zusatz.tun;
      akt.appendChild(b2);
    }
    if (e.abhaken) {
      const b3 = el("button", "st-hhak" + (e.fertig ? " an" : ""));
      b3.type = "button";
      b3.setAttribute("aria-pressed", e.fertig ? "true" : "false");
      b3.appendChild(ikon("check", 15, "st-bico"));
      b3.appendChild(document.createTextNode(e.fertig ? "erledigt" : "abhaken"));
      b3.title = e.fertig ? "Doch noch nicht erledigt — zurücknehmen" : "Heutigen Block als erledigt markieren";
      b3.onclick = () => {
        e.abhaken();
        kopfAktualisieren();
        try { window.GENENDSPURT && window.GENENDSPURT.box(); } catch (x) { }
      };
      akt.appendChild(b3);
    }
    h.appendChild(akt);
    k.appendChild(h);

    /* Kacheln */
    const g = el("div", "st-kacheln");
    const kachel = (name, unten, ziel, ik, warn) => {
      const t = el("button", "st-kachel" + (warn ? " warn" : ""));
      t.type = "button";
      t.appendChild(ikon(ik, 18, "st-kico"));
      const tx = el("span", "st-ktxt");
      tx.appendChild(el("span", "st-kn", name));
      tx.appendChild(el("span", "st-ku", unten));
      t.appendChild(tx);
      t.onclick = ziel;
      g.appendChild(t);
    };
    kachel("Prüfungen", z.begonnen ? z.begonnen + " von " + z.pruefungen + " begonnen" : z.pruefungen + " echte Prüfungen",
      () => oeffneBlock("pruefungen"), "pruefung");
    kachel("Arbeitsblatt", z.vorlagen + " Aufgabentypen", assistent, "blatt");
    kachel("Simulation", z.letzteSim ? "zuletzt " + datum(z.letzteSim.erstellt) : "90 Minuten · 100 BE", simulation, "sim");
    kachel("Satzbau", z.satzKarten ? z.satzKarten + " Karten · 5 Min." : "5 Minuten", satzbau, "satz");
    kachel("Fehlerjournal", z.fehlerOffen ? z.fehlerOffen + " offen" : "nichts offen", journal, "journal", z.fehlerOffen >= 5);
    kachel("Formeln & Operatoren", "zum Ausdrucken", formeln, "formel");
    k.appendChild(g);
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
    try { setTimeout(aufraeumen, 80); setTimeout(aufraeumen, 400); setTimeout(aufraeumenLeise, 900); } catch (e) { }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { aufraeumen, kopfAktualisieren, oeffneBlock, ordnen, zahlen, tageBis, TERMIN, BLOECKE, GRUPPEN };
})();
