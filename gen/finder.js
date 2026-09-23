/* ============================================================================
   gen/finder.js — ein Suchfeld über alles
   ----------------------------------------------------------------------------
   Die Anwendung hat inzwischen zehn Prüfungen, 114 Aufgabentypen, 52
   Kompendium-Themen, 20 Spickzettel-Kapitel, einen Diagramm-Trainer mit
   sieben Knöpfen und neunzehn Blöcke auf der Startseite. Wer „Netzplan“
   üben oder „Skonto“ nachschlagen will, musste wissen, in welchem Block
   das steckt — und ihn dann aufklappen.

   Dieses Feld steht ganz oben und sucht gleichzeitig in:
     • Bereichen der Startseite und Werkzeugen (Knöpfen)
     • Prüfungen (Jahrgang, Betrieb, Schwerpunkte)
     • Kompendium-Themen und Spickzettel-Kapiteln (dort auch im Text)
     • Aufgabentypen des Generators
     • dem Text aller Prüfungsaufgaben und Musterlösungen
   Ein Tipp auf einen Treffer führt direkt hin.

   Umlaute sind egal: „prufung“, „pruefung“ und „Prüfung“ finden dasselbe —
   auf dem Handy mit russischer Tastatur tippt man selten ein ü.
   ========================================================================== */
"use strict";

window.GENFINDER = (function () {
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const ik = (n, g) => window.GENIKON ? window.GENIKON.svg(n, g || 18) : "";

  /* ------------------------------------------------------ Normalisieren */
  /* ä→a, ae→a, ß→ss … auf BEIDEN Seiten gleich, dann passt alles zusammen. */
  function norm(s) {
    return String(s || "").toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/ß/g, "ss")
      .replace(/([aou])e/g, "$1")
      .replace(/[\u2010-\u2014]/g, "-")
      .replace(/\s+/g, " ");
  }
  const text = html => String(html || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ");

  function tokens(q) {
    const t = norm(q).split(/[\s,;]+/).filter(Boolean);
    return t.length > 1 ? t.filter(x => x.length >= 2) : t;
  }

  /* Bewertung eines Eintrags: jedes Wort muss irgendwo vorkommen. Im Titel
     zählt es mehr als in der Unterzeile, dort mehr als im Fließtext.    */
  function bewerte(e, tk) {
    let s = 0;
    for (const t of tk) {
      if (e._t.startsWith(t)) s += 30;
      else if (e._t.indexOf(" " + t) >= 0 || e._t.indexOf("-" + t) >= 0) s += 22;
      else if (e._t.indexOf(t) >= 0) s += 15;
      else if (e._u.indexOf(t) >= 0) s += 8;
      else if (e._w.indexOf(t) >= 0) s += 4;
      else return 0;
    }
    return s + (e.bonus || 0);
  }

  /* Hervorheben: nur, wenn das Wort wörtlich im Titel steht. */
  function markiert(roh, q) {
    const box = el("span");
    const w = String(q || "").trim().split(/\s+/).filter(x => x.length >= 2)
      .sort((a, b) => b.length - a.length)
      .map(x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (!w.length) { box.textContent = roh; return box; }
    const re = new RegExp("(" + w.join("|") + ")", "ig");
    String(roh).split(re).forEach((teil, i) => {
      if (i % 2) box.appendChild(el("mark", "fd-mark", teil));
      else if (teil) box.appendChild(document.createTextNode(teil));
    });
    return box;
  }

  /* Ausschnitt um die Fundstelle im Fließtext */
  function ausschnitt(roh, q) {
    const t = String(roh || "");
    const w = String(q || "").trim().split(/\s+/)[0] || "";
    const i = w ? t.toLowerCase().indexOf(w.toLowerCase()) : -1;
    if (i < 0) return "";
    const a = Math.max(0, i - 40), b = Math.min(t.length, i + w.length + 60);
    return (a ? "… " : "") + t.slice(a, b).trim() + (b < t.length ? " …" : "");
  }

  /* ---------------------------------------------------------- Index --- */
  const klick = id => () => { const b = document.getElementById(id); if (b) b.click(); };
  const G = () => window.GENSTART;

  function werkzeuge() {
    const W = [
      ["Neues Arbeitsblatt erzeugen", "Generator · Themen und Anzahl wählen", "blatt",
        () => window.GENUI && window.GENUI.assistent(), "generator würfeln aufgaben neu blatt"],
      ["Prüfungssimulation starten", "90 Minuten · 100 BE · Lösungen gesperrt", "sim", () => {
        if (!window.GENSIM) return;
        if (confirm("Prüfungssimulation: 90 Minuten, rund 100 BE, keine Lösungen bis zur Abgabe.\n\nJetzt starten?"))
          window.GENSIM.starten();
      }, "simulation 90 minuten zeit uhr"],
      ["Netzplan üben", "Diagramm-Trainer · neue Aufgabe", "diagramm", klick("btnNetzZufall"),
        "netzplan puffer freier gesamtpuffer fp gp faz fez saz sez kritischer pfad vorgang"],
      ["Gantt-Diagramm üben", "Diagramm-Trainer · neue Aufgabe", "diagramm", klick("btnGantt"), "gantt balkendiagramm projektplan"],
      ["ER-Modell zeichnen", "Zeichenfläche · neuer Betrieb", "er", klick("btnErGen"), "er modell entität kardinalität chen datenmodell"],
      ["ER-Modell & UML aus Prüfungen", "feste Aufgaben aus echten Bögen", "er", klick("btnModelle"), "er uml modell prüfung"],
      ["Aktivitätsdiagramm üben", "UML · neue Aufgabe", "diagramm", klick("btnAktivitaet"), "uml aktivität aktivitätsdiagramm"],
      ["Klassendiagramm üben", "UML · neue Aufgabe", "diagramm", klick("btnKlassen"), "uml klasse klassendiagramm"],
      ["Eigene Vorgangsliste", "Netzplan aus eigener Tabelle", "diagramm", klick("btnNetzEigen"), "netzplan eigene vorgänge"],
      ["Karteikarten starten", "Begriffe und Kurzfragen", "karten", klick("btnKK"), "karteikarten karten lernen"],
      ["Satzbau-Training", "5 Minuten · Antworten formulieren", "satz",
        () => window.GENSATZ && window.GENSATZ.starten(), "satzbau formulieren erläutern begründen"],
      ["Formelblatt & Operatoren", "A4 zum Ausdrucken", "formel",
        () => window.GENFORMELN && window.GENFORMELN.zeigen(), "formel formelblatt rechnen drucken"],
      ["Persönliches Merkblatt", "A4 · deine Fehlerarten und Regeln", "formel",
        () => window.GENMERKBLATT && window.GENMERKBLATT.zeigen(), "merkblatt drucken regeln"],
      ["Operatoren-Blatt", "Nennen, Erläutern, Begründen, Beurteilen …", "satz",
        () => window.GENOP && window.GENOP.zeigen(), "operator operatoren nennen erläutern begründen beurteilen beschreiben"],
      ["Rechenaufgaben üben", "alle Rechenaufgaben aus allen Prüfungen", "rechnen", () => {
        if (window.GENRECHNEN) window.GENRECHNEN.starte(window.GENRECHNEN.alle(), "alle Prüfungen");
      }, "rechnen rechenaufgaben kalkulation"],
      ["Fehlerjournal", "Fehler einordnen", "journal", () => {
        G() && G().oeffneBlock("blatt", "fehlerBox");
      }, "fehler journal fehlerjournal"],
      ["Spickzettel öffnen", "Verzeichnis der 20 Kapitel", "spick", () => {
        if (window.GENSPICK) { window.GENSPICK.verzeichnis(); window.GENSPICK.zeigen(); }
      }, "spickzettel"],
      ["Kompendium öffnen", "Verzeichnis der 52 Themen", "komp", () => {
        if (window.GENKOMP) { window.GENKOMP.verzeichnis(); window.GENKOMP.zeigen(); }
      }, "kompendium"],
      ["Prüfungskatalog öffnen", "Original der ZPA · Lücken · eigener Stand", "katalog", () => {
        if (window.GENKATALOG) window.GENKATALOG.oeffnen(null, { filter: "alle" });
      }, "katalog pruefungskatalog zpa themen stichworte"],
      ["Fortschritt exportieren", "Datei zum Sichern oder Umziehen", "daten", klick("btnExport"), "export sichern backup datei"],
      ["Fortschritt importieren", "Datei von einem anderen Gerät", "daten", klick("btnImport"), "import laden datei"],
      ["Hell / Dunkel umschalten", "Farbschema", "werkzeug", klick("btnTheme"), "dunkel hell dark theme nacht"],
      ["Nach Update suchen", "neue Fassung laden", "werkzeug", () => {
        const b = document.querySelector("#versionZeile .ver-knopf"); if (b) b.click();
      }, "update version neu laden aktualisieren"]
    ];
    return W.map(w => ({ typ: "werkzeug", titel: w[0], unter: w[1], ikon: w[2], tun: w[3], worte: w[4], bonus: 6 }));
  }

  function bereiche() {
    const B = (G() && G().BLOECKE) || [];
    return B.filter(b => {
      const d = document.querySelector('#scStart > details.st-block[data-key="' + b.key + '"]');
      return d && !d.hidden;
    }).map(b => ({
      typ: "bereich", titel: b.name, unter: b.info || "", ikon: b.ikon, worte: b.worte || "", bonus: 5,
      tun: () => G() && G().oeffneBlock(b.key)
    }));
  }

  /* Betrieb und Schwerpunkte einer Prüfung stehen in index.html
     (examBetrieb / examSchwerpunkte) — die Prüfungskarten brauchen sie auch. */
  const betrieb = ex => (typeof examBetrieb === "function" ? examBetrieb(ex) : "");
  const schwerpunkte = (ex, n) => (typeof examSchwerpunkte === "function" ? examSchwerpunkte(ex, n) : []);

  function pruefungen() {
    const EX = window.IHK_EXAMS || [];
    return EX.map(ex => {
      const m = ex.meta || {};
      const sp = schwerpunkte(ex, 4);
      const bt = betrieb(ex);
      return {
        typ: "pruefung", titel: (m.season || "") + " " + (m.year || ""),
        unter: [bt].concat(sp.slice(0, 3).map(x => x.label)).filter(Boolean).join(" · "),
        ikon: "pruefung", bonus: 4,
        worte: "prüfung klausur bogen ap1 " + sp.map(x => x.label).join(" ") + " " + ((ex.situation || {}).text || "").slice(0, 600),
        tun: () => { if (typeof oeffnePruefung === "function") oeffnePruefung(ex); }
      };
    });
  }

  function kompendium() {
    return (window.KOMP_THEMEN || []).map(t => ({
      typ: "komp", titel: t.titel, unter: [t.thema, t.unter].filter(Boolean).join(" · "), ikon: "komp",
      worte: [t.ap, t.notiz, (t.worte || []).join(" ")].join(" "),
      tun: () => window.GENKOMP && window.GENKOMP.oeffnen(t.id)
    }));
  }

  function spickzettel() {
    return (window.SPICK_KAPITEL || []).map(k => {
      const roh = text(k.html);
      return {
        typ: "spick", titel: k.titel, unter: k.unter || "", ikon: "spick", roh: roh, worte: roh,
        tun: q => {
          if (!window.GENSPICK) return;
          /* Bei einem Treffer im Text: erst suchen (setzt die Markierung),
             dann das Kapitel öffnen — die Fundstellen sind dort gelb.     */
          if (q && norm(k.titel + " " + (k.unter || "")).indexOf(tokens(q)[0] || "~") < 0) window.GENSPICK.suchseite(q);
          window.GENSPICK.kapitel(k.id);
        }
      };
    });
  }

  function aufgabentypen() {
    let V = [];
    try { V = window.GEN.alleVorlagen(); } catch (e) { return []; }
    const GL = (window.GEN && window.GEN.HAUPT_LABEL) || {};
    return V.map(v => {
      let haupt = "";
      try { haupt = GL[window.GEN.hauptVon(v)] || ""; } catch (e) { }
      return {
        typ: "vorlage", titel: v.titel, unter: [haupt, v.sub].filter(Boolean).join(" · "), ikon: "wuerfel",
        worte: [v.thema, v.merksatz].join(" "),
        tun: () => {
          if (!window.GENUI) return;
          /* drei Varianten desselben Typs — genug, um das Muster zu sehen */
          const liste = [0, 1, 2].map(() => ({ vorlageId: v.id, saat: (Math.random() * 4294967295) >>> 0 }));
          window.GENUI.erzeugeBlatt({ liste: liste, titel: v.titel, zeit: 1 });
        }
      };
    });
  }

  /* Stichworte des Prüfungskatalogs — Tipp öffnet die Stelle im Katalog */
  function katalog() {
    const d = window.GENKATALOG && window.GENKATALOG.daten();
    if (!d) return [];
    return d.A.punkte.map(p => ({
      typ: "katalog", titel: p.text, ikon: "katalog",
      unter: "Katalog " + p.id + " · " + (d.kreisVon[p.kreis] || {}).titel,
      worte: (p.gruppe || "") + " " + p.id,
      tun: () => window.GENKATALOG.oeffnen(p.id)
    }));
  }

  /* Azubi-Navigator: Simulationen und Teilaufgaben — nur mit privatem Paket */
  function azubi() {
    const P = window.GENAZUBI && window.GENAZUBI.paket();
    if (!P) return [];
    const out = [];
    P.module.forEach(m => {
      out.push({
        typ: "azubi", titel: m.kurz + " — " + m.titel, ikon: "azubi", bonus: 3,
        unter: "Azubi-Navigator · " + (m.aufgaben || []).length + " Aufgaben · " + m.punkte + " P.",
        worte: "azubi navigator u-form " + text(m.intro).slice(0, 400),
        tun: () => window.GENAZUBI.oeffnen(m.id)
      });
      (m.aufgaben || []).forEach(a => (a.teile || []).forEach(t => out.push({
        typ: "azubi", titel: text(t.titel), ikon: "azubi",
        unter: m.kurz + " · " + t.nr + " " + t.label + " · " + t.punkte + " P.",
        worte: text(t.text).slice(0, 500),
        tun: () => window.GENAZUBI.oeffnen(m.id, { ziel: t.id })
      })));
    });
    return out;
  }

  let INDEX = null;
  function index() {
    const mitAz = !!(window.GENAZUBI && window.GENAZUBI.paket());
    if (INDEX && INDEX._az === mitAz) return INDEX;
    INDEX = [].concat(bereiche(), werkzeuge(), pruefungen(), katalog(), kompendium(), spickzettel(), aufgabentypen(), azubi());
    INDEX._az = mitAz;
    INDEX.forEach(e => { e._t = norm(e.titel); e._u = norm(e.unter); e._w = norm(e.worte); });
    return INDEX;
  }

  /* Prüfungsaufgaben: eigene Suche, weil es 279 lange Texte sind und das
     Ergebnis anders aussieht (Jahrgang · Nummer · BE + Textausschnitt). */
  let AUFG = null;
  function aufgabenIndex() {
    if (AUFG) return AUFG;
    const A = (typeof ALLE !== "undefined" && ALLE) ? ALLE : [];
    AUFG = A.map(it => {
      const roh = (it.prompt || "") + " " + ((it.solution || {}).text || "");
      return { it: it, roh: roh, n: norm(roh) };
    });
    return AUFG;
  }
  function aufgabenTreffer(q) {
    const tk = tokens(q);
    if (!tk.length || norm(q).length < 3) return [];
    const nurAktiv = typeof aktiv === "function" ? aktiv : () => true;
    return aufgabenIndex().filter(a => nurAktiv(a.it) && tk.every(t => a.n.indexOf(t) >= 0));
  }

  /* ------------------------------------------------------------ Suche --- */
  const GRUPPEN = [
    { typen: ["bereich", "werkzeug"], name: "Bereiche & Werkzeuge", max: 5 },
    { typen: ["pruefung"], name: "Prüfungen", max: 4 },
    { typen: ["azubi"], name: "Azubi-Navigator", max: 4 },
    { typen: ["katalog"], name: "Prüfungskatalog", max: 3 },
    { typen: ["komp"], name: "Kompendium", max: 4 },
    { typen: ["spick"], name: "Spickzettel", max: 4 },
    { typen: ["vorlage"], name: "Aufgabentypen — neu würfeln", max: 4 }
  ];
  const TYPNAME = { bereich: "Bereich", werkzeug: "Werkzeug", pruefung: "Prüfung", azubi: "Azubi-Navigator", katalog: "Katalog", komp: "Kompendium",
                    spick: "Spickzettel", vorlage: "Generator" };

  function suchen(q) {
    const tk = tokens(q);
    if (!tk.length) return { gruppen: [], aufgaben: [], anzahl: 0 };
    const tr = index().map(e => ({ e: e, s: bewerte(e, tk) })).filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s);
    const gruppen = GRUPPEN.map(g => {
      const alle = tr.filter(x => g.typen.indexOf(x.e.typ) >= 0);
      return { name: g.name, alle: alle, max: g.max };
    }).filter(g => g.alle.length);
    const aufgaben = aufgabenTreffer(q);
    return { gruppen, aufgaben, anzahl: tr.length + aufgaben.length };
  }

  /* ---------------------------------------------------------- Anzeige --- */
  let feld = null, box = null, letzte = "";

  function zeile(e, q, mitTyp) {
    const b = el("button", "fd-treffer");
    b.type = "button";
    const ico = el("span", "fd-ico fd-" + e.typ);
    ico.innerHTML = ik(e.ikon, 17);
    b.appendChild(ico);
    const tx = el("span", "fd-txt");
    const t = el("span", "fd-t"); t.appendChild(markiert(e.titel, q));
    tx.appendChild(t);
    const sn = (e.typ === "spick" && e._t.indexOf(tokens(q)[0] || "~") < 0) ? ausschnitt(e.roh, q) : "";
    if (sn) { const u = el("span", "fd-u fd-schnipsel"); u.appendChild(markiert(sn, q)); tx.appendChild(u); }
    else if (e.unter) tx.appendChild(el("span", "fd-u", e.unter));
    b.appendChild(tx);
    if (mitTyp) b.appendChild(el("span", "fd-typ", TYPNAME[e.typ] || ""));
    b.onclick = () => { schliessen(); e.tun(q); };
    return b;
  }

  function zeigen(q) {
    letzte = q;
    box.innerHTML = "";
    const qn = norm(q).trim();
    if (!qn) { box.hidden = true; vorschlaege(true); return; }
    vorschlaege(false);
    box.hidden = false;
    const r = suchen(q);

    if (!r.anzahl) {
      box.appendChild(el("div", "fd-leer", "Nichts gefunden für „" + q.trim() + "“. Ein kürzeres Wort oder eine andere Schreibweise versuchen."));
      return;
    }

    r.gruppen.forEach(g => {
      const sek = el("div", "fd-gruppe");
      const kopf = el("div", "fd-gkopf");
      kopf.appendChild(el("span", null, g.name));
      kopf.appendChild(el("span", "fd-gzahl", String(g.alle.length)));
      sek.appendChild(kopf);
      const liste = el("div", "fd-liste");
      g.alle.slice(0, g.max).forEach(x => liste.appendChild(zeile(x.e, q, g.name.indexOf("&") >= 0)));
      sek.appendChild(liste);
      if (g.alle.length > g.max) {
        const mehr = el("button", "fd-mehr", "alle " + g.alle.length + " zeigen");
        mehr.type = "button";
        mehr.onclick = () => {
          liste.innerHTML = "";
          g.alle.forEach(x => liste.appendChild(zeile(x.e, q, g.name.indexOf("&") >= 0)));
          mehr.remove();
        };
        sek.appendChild(mehr);
      }
      box.appendChild(sek);
    });

    if (r.aufgaben.length) {
      const sek = el("div", "fd-gruppe");
      const kopf = el("div", "fd-gkopf");
      kopf.appendChild(el("span", null, "In Prüfungsaufgaben & Musterlösungen"));
      kopf.appendChild(el("span", "fd-gzahl", String(r.aufgaben.length)));
      sek.appendChild(kopf);
      const liste = el("div", "fd-liste");
      r.aufgaben.slice(0, 4).forEach(a => {
        const it = a.it, m = it.exam.meta || {};
        const b = el("button", "fd-treffer");
        b.type = "button";
        const ico = el("span", "fd-ico fd-aufgabe"); ico.innerHTML = ik("pruefung", 17);
        b.appendChild(ico);
        const tx = el("span", "fd-txt");
        tx.appendChild(el("span", "fd-t", m.season + " " + m.year + " · " + (/^\d/.test(String(it.fullLabel || it.label || "")) ? (it.fullLabel || it.label) : ((it.task && it.task.number) || "") + " " + (it.fullLabel || it.label || "")) +
                                          " · " + (it.maxPoints || 0) + " BE"));
        const sn = ausschnitt(a.roh, q) || (it.prompt || "").slice(0, 110) + " …";
        const u = el("span", "fd-u fd-schnipsel"); u.appendChild(markiert(sn, q));
        tx.appendChild(u);
        b.appendChild(tx);
        b.onclick = () => {
          schliessen();
          if (typeof oeffnePruefung === "function") oeffnePruefung(it.exam);
          if (typeof springeZu === "function") setTimeout(() => springeZu(it.k), 60);
        };
        liste.appendChild(b);
      });
      sek.appendChild(liste);
      if (r.aufgaben.length > 4) {
        const mehr = el("button", "fd-mehr", "alle " + r.aufgaben.length + " Treffer als Liste");
        mehr.type = "button";
        mehr.onclick = () => {
          const f = $("sucheFeld");
          if (f) { f.value = q.trim(); f.dispatchEvent(new Event("input")); }
          schliessen();
          G() && G().oeffneBlock("suche");
        };
        sek.appendChild(mehr);
      }
      box.appendChild(sek);
    }

    /* Kompendium: der Volltext liegt in 52 nachgeladenen Dateien —
       dafür gibt es die eigene Suchseite des Kompendiums.              */
    if (window.GENKOMP && qn.length >= 3) {
      const k = el("button", "fd-mehr fd-voll");
      k.type = "button";
      k.innerHTML = ik("komp", 15) + "<span>Im Text aller 52 Kompendium-Themen suchen</span>";
      k.onclick = () => { schliessen(); window.GENKOMP.suchseite(q.trim()); };
      box.appendChild(k);
    }
  }

  function schliessen() {
    /* Die Trefferliste verschwindet, der Suchbegriff bleibt stehen —
       wer zurückkommt, sieht, wonach er gesucht hat.                   */
    if (box) box.hidden = true;
    if (feld) feld.blur();
  }

  /* Vorschläge unter dem leeren Feld — was man sonst nicht fände. */
  const VORSCHLAG = ["Netzplan", "Subnetz", "Skonto", "DSGVO", "Nutzwertanalyse", "ER-Modell", "Backup", "Erläutern"];
  function vorschlaege(an) {
    const v = $("stSucheVorschlag");
    if (!v) return;
    v.hidden = !an;
  }

  function bauen() {
    const s = $("scStart");
    if (!s || $("stSuche")) return;
    const w = el("div", "st-suche"); w.id = "stSuche";
    w.setAttribute("role", "search");

    const f = el("div", "st-sfeld");
    const lupe = el("span", "st-slupe"); lupe.innerHTML = ik("suche", 18);
    f.appendChild(lupe);
    const lab = el("label", "sr-only", "Alles durchsuchen: Bereiche, Werkzeuge, Prüfungen, Kompendium, Spickzettel, Aufgaben");
    lab.setAttribute("for", "stSucheFeld");
    f.appendChild(lab);
    feld = el("input"); feld.type = "search"; feld.id = "stSucheFeld";
    feld.placeholder = "Suchen: Thema, Prüfung, Werkzeug …";
    feld.autocomplete = "off"; feld.spellcheck = false;
    feld.setAttribute("enterkeyhint", "search");
    feld.setAttribute("aria-controls", "stSucheTreffer");
    f.appendChild(feld);
    const x = el("button", "st-sx"); x.type = "button"; x.hidden = true;
    x.setAttribute("aria-label", "Suche leeren");
    x.innerHTML = ik("zu", 16);
    f.appendChild(x);
    w.appendChild(f);

    const vor = el("div", "st-svor"); vor.id = "stSucheVorschlag";
    VORSCHLAG.forEach(wort => {
      const c = el("button", "st-schip", wort); c.type = "button";
      c.onclick = () => { feld.value = wort; x.hidden = false; zeigen(wort); };
      vor.appendChild(c);
    });
    vor.hidden = true;
    w.appendChild(vor);

    box = el("div", "st-streffer"); box.id = "stSucheTreffer"; box.hidden = true;
    box.setAttribute("aria-live", "polite");
    w.appendChild(box);

    let warte = null;
    feld.addEventListener("input", () => {
      x.hidden = !feld.value;
      clearTimeout(warte);
      warte = setTimeout(() => zeigen(feld.value), 90);
    });
    feld.addEventListener("focus", () => {
      if (feld.value.trim()) zeigen(feld.value);
      else vorschlaege(true);
    });
    feld.addEventListener("keydown", ev => {
      if (ev.key === "Escape") { feld.value = ""; x.hidden = true; zeigen(""); vorschlaege(false); }
      else if (ev.key === "Enter") {
        ev.preventDefault();
        const erst = box.querySelector(".fd-treffer");
        if (erst) erst.click();
      } else if (ev.key === "ArrowDown") {
        const erst = box.querySelector(".fd-treffer, .fd-mehr");
        if (erst) { ev.preventDefault(); erst.focus(); }
      }
    });
    box.addEventListener("keydown", ev => {
      if (ev.key !== "ArrowDown" && ev.key !== "ArrowUp" && ev.key !== "Escape") return;
      ev.preventDefault();
      if (ev.key === "Escape") { feld.focus(); return; }
      const alle = [...box.querySelectorAll(".fd-treffer, .fd-mehr")];
      const i = alle.indexOf(document.activeElement);
      const n = ev.key === "ArrowDown" ? alle[i + 1] : alle[i - 1];
      if (n) n.focus(); else if (ev.key === "ArrowUp") feld.focus();
    });
    x.onclick = () => { feld.value = ""; x.hidden = true; zeigen(""); feld.focus(); };

    /* Tipp außerhalb schließt die Liste (Begriff bleibt stehen) */
    document.addEventListener("pointerdown", ev => {
      if (!w.contains(ev.target)) { box.hidden = true; vorschlaege(false); }
    });

    s.insertBefore(w, s.firstChild);
  }

  /* „/“ springt ins Suchfeld — am Schreibtisch der schnellste Weg */
  document.addEventListener("keydown", ev => {
    if (ev.key !== "/" || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const a = document.activeElement;
    if (a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT" || a.isContentEditable)) return;
    const s = $("scStart");
    if (!s || s.hidden || !feld) return;
    ev.preventDefault();
    feld.focus();
  });

  function einhaengen() {
    bauen();
    const alt = window.renderStart;
    if (typeof alt === "function" && !alt.__fd) {
      const neu = function () {
        const r = alt.apply(this, arguments);
        /* Bereiche können sich ändern (Lernplan ein/aus) — Index neu */
        INDEX = null;
        try { bauen(); } catch (e) { console.error("Finder:", e); }
        return r;
      };
      neu.__fd = true; window.renderStart = neu;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { suchen, norm, tokens, bewerte, schwerpunkte, betrieb, zeigen: q => { if (feld) { feld.value = q; zeigen(q); } } };
})();
