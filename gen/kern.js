/* ============================================================================
   gen/kern.js — Kern des Aufgaben-Generators
   ----------------------------------------------------------------------------
   Erzeugt aus Vorlagen beliebig viele Aufgaben mit anderen Zahlen und Daten,
   prüft die Antworten offline und vergibt Punkte.

   Kein Modul, kein Build: wird per <script src> geladen und hängt sich an
   window.GEN. Läuft aus file:// heraus.
   ========================================================================== */
"use strict";

window.GEN = (function () {

  /* ======================= 1. Zufall mit Saat ============================ */
  /* Gleiche Saat -> gleiche Aufgabe. Damit ist ein Arbeitsblatt teilbar,
     wiederholbar und der "Neu würfeln"-Knopf reproduzierbar.            */

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashText(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function Rng(saat) {
    this.saat = saat >>> 0;
    this._f = mulberry32(this.saat);
  }
  Rng.prototype.f = function () { return this._f(); };
  /** ganze Zahl in [min, max] */
  Rng.prototype.ganz = function (min, max) { return min + Math.floor(this._f() * (max - min + 1)); };
  /** Vielfaches von step in [min, max] */
  Rng.prototype.stufe = function (min, max, step) {
    const n = Math.floor((max - min) / step);
    return +(min + this.ganz(0, n) * step).toFixed(6);
  };
  Rng.prototype.waehle = function (arr) { return arr[Math.floor(this._f() * arr.length)]; };
  Rng.prototype.muenze = function (p) { return this._f() < (p == null ? 0.5 : p); };
  Rng.prototype.mische = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this._f() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  Rng.prototype.waehleN = function (arr, n) { return this.mische(arr).slice(0, Math.min(n, arr.length)); };
  /** Preis mit "echt aussehendem" Ende: 899, 1.249, 2.450 … */
  Rng.prototype.preis = function (min, max) {
    const roh = this.ganz(min, max);
    const enden = [0, 9, 49, 50, 99, 90];
    const stelle = roh >= 1000 ? 100 : 10;
    const basis = Math.floor(roh / stelle) * stelle;
    return Math.max(min, basis + this.waehle(enden));
  };

  /* ======================= 2. Zahlen & Formate ========================== */

  const fmt = {
    /** 1234.5 -> "1.234,50" */
    zahl(n, dez) {
      if (n == null || !isFinite(n)) return "—";
      dez = dez == null ? 2 : dez;
      return n.toLocaleString("de-DE", { minimumFractionDigits: dez, maximumFractionDigits: dez });
    },
    eur(n, dez) { return fmt.zahl(n, dez == null ? 2 : dez) + " €"; },
    proz(n, dez) { return fmt.zahl(n, dez == null ? 1 : dez) + " %"; },
    /** kürzt sinnvoll: 12 -> "12", 12.5 -> "12,5" */
    kurz(n) {
      if (n == null || !isFinite(n)) return "—";
      const g = Math.round(n * 1000) / 1000;
      return Number.isInteger(g) ? String(g).replace(".", ",")
        : g.toLocaleString("de-DE", { maximumFractionDigits: 3 });
    },
    /** Liste als deutscher Text: "A, B und C" */
    liste(a) {
      a = a.filter(Boolean);
      if (a.length <= 1) return a[0] || "";
      return a.slice(0, -1).join(", ") + " und " + a[a.length - 1];
    }
  };

  /** kaufmännisch runden auf n Stellen (Math.round rundet .5 bei negativ falsch) */
  function runde(n, dez) {
    const f = Math.pow(10, dez == null ? 2 : dez);
    return Math.sign(n) * Math.round(Math.abs(n) * f + 1e-9) / f;
  }

  /**
   * Deutsche und englische Zahlschreibweise lesen.
   * "1.234,56 €" -> 1234.56 ; "1,234.56" -> 1234.56 ; "12 %" -> 12
   * Mehrdeutiges "1.234" wird als beide Varianten zurückgegeben.
   * @returns {number[]} alle plausiblen Lesarten (leer = keine Zahl gefunden)
   */
  function leseZahlen(roh) {
    if (roh == null) return [];
    let s = String(roh).trim()
      .replace(/[€$]|eur|euro|%|stück|stk\.?|mbit\/s|gbit\/s|kbit\/s|bit\/s|tage?|jahre?|monate?/gi, "")
      .replace(/\s+/g, "").replace(/^[≈~ca.]+/i, "");
    // Zahl mit Einheitenpräfix am Ende (GB, TB…) abschneiden
    s = s.replace(/[a-zäöüß]+$/i, "");
    if (!s || !/[0-9]/.test(s)) return [];
    const hatK = s.includes(","), hatP = s.includes(".");
    const out = [];
    const zu = x => { const v = parseFloat(x); if (isFinite(v)) out.push(v); };
    if (hatK && hatP) {
      // die letzte der beiden Marken ist das Dezimalzeichen
      if (s.lastIndexOf(",") > s.lastIndexOf(".")) zu(s.replace(/\./g, "").replace(",", "."));
      else zu(s.replace(/,/g, ""));
    } else if (hatK) {
      zu(s.replace(/,/g, "."));                       // 1234,56
      if (/^\d{1,3}(,\d{3})+$/.test(s)) zu(s.replace(/,/g, ""));  // 1,234,567
    } else if (hatP) {
      zu(s);                                          // 1234.56
      if (/^\d{1,3}(\.\d{3})+$/.test(s)) zu(s.replace(/\./g, "")); // 1.234.567
    } else zu(s);
    return out.filter((v, i, a) => a.indexOf(v) === i);
  }

  /* ======================= 3. Textvergleich ============================= */

  const STOPP = new Set(("der die das den dem des ein eine einen einem eines einer und oder aber " +
    "für fuer von vom zu zum zur mit ohne bei im in am an auf als auch ist sind wird werden " +
    "man kann muss soll sowie bzw etc z b bzgl da dass wenn weil um über ueber nach durch " +
    "eines seine ihre dessen jeweils jede jeder jedes alle allen").split(" "));

  function norm(s) {
    return String(s == null ? "" : s).toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9äöüß+./:-]+/g, " ")
      .replace(/\s+/g, " ").trim();
  }
  function worte(s) {
    /* Bindestrich trennt: „Mehr-Faktor-Authentifizierung“ sind drei Begriffe,
       sonst steht das ganze Wort als ein einziger Klotz da und „Zwei-Faktor-
       Authentifizierung“ trifft nichts davon.                              */
    return norm(s).split(/[\s\-/]+/)
      .map(w => w.replace(/^[.:,;-]+/, "").replace(/[.:,;-]+$/, ""))
      .filter(w => w && !STOPP.has(w));
  }
  /** grober Stamm: deutsche Endungen weg, dann kürzen */
  function stamm(w) {
    w = w.replace(/(ungen|ung|keiten|keit|heiten|heit|nisse|nis|enden|ende|erung)$/,"")
         .replace(/(en|er|es|em|et|te|st|s|e|n)$/, "");
    return w.length > 6 ? w.slice(0, 6) : w;
  }
  const stammSatz = s => worte(s).map(stamm);

  /* ------------------------------------------------------------------
     Wörter, die dasselbe meinen. In der Prüfung zählt der Sachverhalt,
     nicht das Wort: wer „Symbole“ statt „Zeichen“ oder „Kennwort“ statt
     „Passwort“ schreibt, hat die Sache verstanden. Die Gruppen werden
     als Stämme abgelegt, damit auch gebeugte Formen passen.
     Bewusst eng gehalten — „Kosten“ ist nicht „Aufwand“, und „Mitarbeiter“
     ist nicht immer „Benutzer“.
     --------------------------------------------------------------- */
  const SYNONYME = [
    ["zeichen", "symbol", "buchstabe"],
    ["passwort", "kennwort", "passphrase"],
    ["rechner", "computer", "pc"],
    ["programm", "software", "anwendung"],
    ["fehler", "störung", "problem", "ausfall"],
    ["netzwerk", "netz"],
    ["datensicherung", "backup"],
    ["verschlüsselung", "chiffrierung"],
    ["benutzer", "nutzer", "anwender"],
    ["speicher", "datenträger"],
    ["gerät", "hardware"],
    ["prüfen", "kontrollieren", "überprüfen"],
    ["ändern", "wechseln"],
    ["angriff", "attacke"],
    ["berechtigung", "zugriffsrecht"],
    ["anmeldung", "login", "authentifizierung"],
    ["schulung", "einweisung", "unterweisung"],
    ["vertrag", "vereinbarung"],
    ["hinweis", "warnung", "meldung"]
  ];
  const SYNGRUPPE = (() => {
    const m = {};
    SYNONYME.forEach((gruppe, i) => gruppe.forEach(w => { m[stamm(norm(w))] = i; }));
    return m;
  })();

  /** Editierabstand, nach oben begrenzt — für Tippfehler, nicht für Ähnlichkeit.
   *  Mit Vertauschung zweier Nachbarn (Damerau): „Redudnanz“ statt
   *  „Redundanz“ ist der mit Abstand häufigste Tippfehler und soll EIN
   *  Fehler sein, nicht zwei. */
  function abstand(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let vorvor = null, vor = [], jetzt = [];
    for (let j = 0; j <= b.length; j++) vor[j] = j;
    for (let i = 1; i <= a.length; i++) {
      jetzt = [i];
      let min = i;
      for (let j = 1; j <= b.length; j++) {
        const kosten = a[i - 1] === b[j - 1] ? 0 : 1;
        let w = Math.min(vor[j] + 1, jetzt[j - 1] + 1, vor[j - 1] + kosten);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
          w = Math.min(w, vorvor[j - 2] + 1);
        jetzt[j] = w;
        if (w < min) min = w;
      }
      if (min > max) return max + 1;      /* kann nur noch schlechter werden */
      vorvor = vor; vor = jetzt;
    }
    return vor[b.length];
  }

  /** Tippfehlertoleranz nach Wortlänge: kurze Wörter dürfen nicht wackeln */
  function tippNah(x, y) {
    const l = Math.max(x.length, y.length);
    if (l < 5) return false;
    const max = l >= 8 ? 2 : 1;
    return abstand(x, y, max) <= max;
  }

  /** Zwei Wortstämme, die dasselbe meinen dürfen. */
  function nahe(x, y) {
    if (x === y) return true;
    /* deutsche Zusammensetzungen: „Sonderzeichen“ enthält „zeichen“,
       „Kleinbuchstaben“ enthält „klein“ und „buchstab“                */
    if (x.length >= 5 && y.indexOf(x) >= 0) return true;
    if (y.length >= 5 && x.indexOf(y) >= 0) return true;
    if (SYNGRUPPE[x] != null && SYNGRUPPE[x] === SYNGRUPPE[y]) return true;
    /* Tippfehler: ein Dreher oder ein Buchstabe zu viel/zu wenig */
    return tippNah(x, y);
  }

  /* Ein Wortpaar gilt als dasselbe, wenn entweder die Stämme zusammenpassen
     oder die vollen Wörter nur einen Tippfehler auseinanderliegen. Der zweite
     Weg ist nötig, weil der Stamm auf sechs Zeichen kürzt: „redundanz“ und
     „redudanz“ werden zu „redund“ und „reduda“ — als Stämme zwei Fehler, als
     ganze Wörter einer.                                                    */
  /* ------------------------------------------------------------------
     Wörter, die im Prüfungsdeutsch dasselbe sagen. Bewusst KEIN großes
     Wörterbuch: hier stehen nur die Gruppen, an denen in den Prüfungen
     tatsächlich richtige Antworten gescheitert sind — allen voran die
     Verneinung. „Kein Gateway“ und „fehlendes Standardgateway“ sind
     dieselbe Diagnose; für den Wortvergleich waren es zwei Welten.

     Fachbegriffe stehen hier NICHT drin. Wer „Router“ statt „Switch“
     schreibt, soll weiterhin daneben liegen.
     --------------------------------------------------------------- */
  /* Nachgemessen am Prüfsatz (test5.js): diese vier Gruppen kosten zusammen
     vier fälschlich anerkannte Antworten von 6370 und retten dafür eine
     ganze Fehlerklasse. Weitere, allgemeinere Gruppen („Rechner/PC/Gerät“,
     „schützen/sichern/verhindern“) wurden wieder entfernt — sie brachten
     keine einzige zusätzliche Erkennung und elf zusätzliche Durchrutscher. */
  const SINN_GRUPPEN = [
    ["kein", "keine", "keinen", "ohne", "fehlt", "fehlen", "fehlend", "nicht", "mangel"],
    ["falsch", "fehlerhaft", "ungueltig", "ungultig", "inkorrekt", "verkehrt", "defekt"],
    ["zuweisen", "zuteilen", "vergeben", "erhalten", "bekommen", "beziehen", "zuordnen"],
    ["erreichbar", "erreichen", "antworten", "reagieren", "verbinden", "verbindung"]
  ];
  /* Stamm → Gruppennummer; über den Stamm, damit die Beugung egal ist. */
  const SINN = (() => {
    const m = {};
    SINN_GRUPPEN.forEach((g, i) => g.forEach(w => { m[stamm(norm(w))] = i; }));
    return m;
  })();
  function sinnGleich(a, b) {
    const x = SINN[a], y = SINN[b];
    return x != null && x === y;
  }

  function paarNah(x, y) {
    return nahe(x.s, y.s) || tippNah(x.w, y.w) ||
           zusammensetzung(x.w, y.w) || sinnGleich(x.s, y.s);
  }

  /* ------------------------------------------------------------------
     Deutsche Komposita. „Standardgateway“ und „Gateway“ sind dieselbe
     Sache; „Festplattenverschlüsselung“ und „Verschlüsselung“ auch. Für
     den Stammvergleich waren das bisher zwei verschiedene Wörter, weil
     der Stamm vorne abschneidet und das Grundwort hinten steht.

     Gezählt wird nur, wenn das kürzere Wort das längere am ANFANG oder
     am ENDE bildet und selbst lang genug ist (ab 5 Zeichen). Sonst
     steckt „Art“ in „Artikel“ und „Ort“ in „Sortierung“.

     Das ist der häufigste falsche Nullpunkt gewesen: die Antwort nennt
     den Fachbegriff, nur in der kurzen oder der langen Form.
     --------------------------------------------------------------- */
  function zusammensetzung(a, b) {
    const x = norm(a), y = norm(b);
    if (!x || !y || x === y) return x === y && !!x;
    const kurz = x.length <= y.length ? x : y;
    const lang = x.length <= y.length ? y : x;
    if (kurz.length < 5 || lang.length - kurz.length < 2) return false;
    if (lang.endsWith(kurz)) return true;                 /* Standard|gateway */
    if (lang.startsWith(kurz)) return true;               /* Gateway|adresse  */
    /* Fugen-s und -n: Festplatten|verschlüsselung, Arbeits|platz */
    return lang.endsWith("s" + kurz) || lang.endsWith("n" + kurz) ||
           lang.startsWith(kurz + "s") || lang.startsWith(kurz + "n");
  }

  /* ------------------------------------------------------------------
     Wörter, die im Erwartungswert nur den Satz tragen, aber nichts
     aussagen: „Datensicherung DURCHFÜHREN“, „Protokoll ERSTELLEN“,
     „Rücksprache HALTEN“. Wer „Backup machen“ schreibt, hat dieselbe
     Sache genannt — soll aber nicht daran scheitern, dass sein Verb
     ein anderes ist. Abgelegt als Stämme, weil die Beugung egal ist.
     Nur auf der Erwartungsseite abgezogen, und nur wenn danach noch
     etwas übrig bleibt.
     --------------------------------------------------------------- */
  const FUELLER = new Set(("mach macht gemach durchf durchg erstel vorneh vorgen " +
    "sorg geb stell setz gesetz lass soll sollt muess koenn hab hat sei " +
    "etwa imm jeweil dabei damit dan noch nur mehr sehr ggf halt nutz verwend " +
    "beacht").split(" "));

  /**
   * Steckt der Fachbegriff in der Antwort?
   *
   * Früher mussten ALLE sinntragenden Wörter vorkommen. Bei einem Fachbegriff
   * aus ein, zwei Wörtern ist das richtig — „Mehr-Faktor-Authentifizierung“
   * ist nun einmal genau das. Bei einer Aufzählung wie „Groß- und
   * Kleinbuchstaben, Ziffern, Sonderzeichen“ ist es unfair: das sind
   * Beispiele, nicht Bedingungen. Deshalb reicht dort eine deutliche Mehrheit.
   */
  function enthaelt(antwort, begriff) {
    const a = norm(antwort), b = norm(begriff);
    /* Ein leerer Erwartungswert („—“, „keine“) verlangt eine leere Antwort. */
    if (!b) return !a;
    if (!a) return false;
    /* Teilstring nur bei aussagekräftigen Begriffen — sonst steckt "Ende"
       in "Fehlende Freigabe" und die Zuordnung wird falsch.               */
    if (a.includes(b) && (b.length >= 6 || b.includes(" "))) return true;
    /* Zahlen bleiben drin, auch wenn sie kurz sind: „RAID 5“ und „RAID 1“
       unterscheiden sich einzig in der Ziffer.                            */
    const traegt = w => w.length >= 3 || /^\d+$/.test(w);
    let bw = worte(begriff).map(w => ({ w, s: stamm(w) })).filter(x => traegt(x.s));
    const kern = bw.filter(x => !FUELLER.has(x.s));
    if (kern.length) bw = kern;              /* nur abziehen, wenn etwas bleibt */
    if (!bw.length) {
      /* Kürzel wie „L“, „S“, „de“, „0“: als Teilstring steckt das „s“ aus
         „S“ in jedem zweiten Satz. Deshalb hier nur ein ganzes Wort.     */
      if (b.length >= 4) return a.includes(b);
      const kurz = w => w.replace(/^[.:,;-]+/, "").replace(/[.:,;-]+$/, "");
      /* „—“ und „-“ verlieren beim Abschneiden alles — dann zählt das rohe Wort. */
      return a.split(" ").some(w => w === b || (kurz(w) && kurz(w) === kurz(b)));
    }
    const aw = worte(antwort).map(w => ({ w, s: stamm(w) }));
    const treffer = bw.filter(x => aw.some(y => paarNah(x, y))).length;
    const noetig = bw.length <= 2 ? bw.length : Math.max(2, Math.ceil(bw.length * 0.6));
    return treffer >= noetig;
  }

  /** eine von mehreren Schreibweisen genügt */
  function enthaeltEines(antwort, synonyme) {
    return (Array.isArray(synonyme) ? synonyme : [synonyme]).some(s => enthaelt(antwort, s));
  }

  /** Antwort in Einzelnennungen zerlegen (Zeilen, Semikolon, Komma, Aufzählungszeichen) */
  function teile(antwort) {
    return String(antwort || "")
      .split(/\r?\n|;|·|•|–\s|\s-\s|,(?![^()]*\))/)
      .map(s => s.replace(/^\s*[-–*\d).\s]+/, "").trim())
      .filter(Boolean);
  }

  /* ======================= 4. Registry ================================== */

  const VORLAGEN = [];
  const THEMEN_LABEL = {
    kalkulation:      "Wirtschaftlichkeit & Kalkulation",
    netzwerk:         "Netzwerke & Kommunikation",
    daten:            "Datenformate & Speicherung",
    itsicherheit:     "IT-Sicherheit",
    datenschutz:      "Datenschutz & Recht",
    projekt:          "Projektmanagement",
    hardware:         "Hardware & Arbeitsplatz",
    software:         "Software & Entwicklung",
    programmierung:   "Programmierung & Algorithmen",
    arbeitsplatz:     "Arbeitsplatz & Support",
    diagramm:         "Diagramme & Modelle"
  };

  /* ---------------------------------------------------------------------
     Hauptthemen für die Auswahl-Oberfläche.
     `thema` bleibt unverändert (daran hängt die Prüfungs-Statistik),
     `haupt` ist die Sicht, in der Lena Aufgaben aussucht.
     ------------------------------------------------------------------ */
  const HAUPT_LABEL = {
    sicherheit:  "IT-Sicherheit",
    netzwerk:    "Netzwerke & Kommunikation",
    projekt:     "Projektmanagement",
    hardware:    "Hardware",
    wirtschaft:  "Wirtschaftlichkeit",
    speicher:    "Datenformate & Speicherung",
    datenbank:   "Datenbanken",
    entwicklung: "Softwareentwicklung",
    recht:       "Recht & Compliance",
    beschaffung: "Beschaffung",
    ki:          "KI & Digitalisierung"
  };
  const HAUPT_REIHE = ["sicherheit", "netzwerk", "projekt", "hardware", "wirtschaft",
                       "speicher", "datenbank", "entwicklung", "recht", "beschaffung", "ki"];

  /* Unterthema -> Hauptthema (schlägt die Zuordnung über `thema`) */
  const SUB_HAUPT = {
    /* Beschaffung */
    "Angebotsvergleich": "beschaffung", "Leasing & Finanzierung": "beschaffung",
    "Nutzwertanalyse": "beschaffung", "Bezugspreiskalkulation": "beschaffung",
    "Make-or-Buy-Entscheidung": "beschaffung",
    /* Projektmanagement */
    "Netzplantechnik": "projekt", "Gantt-Diagramm": "projekt",
    "Projektkosten & Angebotspreis": "projekt", "Übergabe & Einweisung": "projekt",
    "Testprotokoll & Abnahme": "projekt",
    /* Datenbanken */
    "ER-Modell & Kardinalitäten": "datenbank",
    /* Softwareentwicklung */
    "UML-Aktivitätsdiagramm": "entwicklung", "UML Use-Case-Diagramm": "entwicklung",
    "UML-Klassendiagramm": "entwicklung", "Schreibtischtest & Pseudocode": "entwicklung",
    /* Hardware & Arbeitsplatz */
    "Support & Ticketsystem": "hardware", "Virtualisierung & Cloud": "hardware",
    "Barrierefreiheit": "hardware", "Ergonomie & Arbeitsschutz": "hardware",
    "Arbeitsplatz & Geräteauswahl": "hardware",
    /* Netzwerk */
    "Domäne & Verzeichnisdienst": "netzwerk", "Konsolenbefehle": "netzwerk",
    /* Datenformate & Speicherung */
    "Zahlensysteme": "speicher", "Dateisysteme": "speicher", "Verfügbarkeit & SLA": "speicher",
    /* IT-Sicherheit */
    "Authentifizierung": "sicherheit", "Risikomatrix": "sicherheit",
    "Notfall & Schadsoftware": "sicherheit"
  };
  /* Fallback: altes Thema -> Hauptthema */
  const THEMA_HAUPT = {
    kalkulation: "wirtschaft", netzwerk: "netzwerk", daten: "speicher",
    itsicherheit: "sicherheit", datenschutz: "recht", projekt: "projekt",
    hardware: "hardware", software: "entwicklung", programmierung: "entwicklung",
    arbeitsplatz: "hardware", diagramm: "entwicklung",
    /* neue Vorlagen dürfen direkt einen Hauptthemen-Schlüssel benutzen */
    sicherheit: "sicherheit", wirtschaft: "wirtschaft", speicher: "speicher",
    datenbank: "datenbank", entwicklung: "entwicklung", recht: "recht",
    beschaffung: "beschaffung",
    /* Kommunikation läuft in der Prüfung unter Projekt, KI ist ein eigenes Thema */
    ki: "ki", kommunikation: "projekt"
  };
  function hauptVon(v) {
    return v.haupt || SUB_HAUPT[v.sub] || THEMA_HAUPT[v.thema] || v.thema;
  }

  /**
   * Vorlage anmelden.
   * def = { id, thema, sub, titel, stufe, bau(R, ctx) -> aufgabenrumpf }
   */
  function vorlage(def) {
    if (!def || !def.id || typeof def.bau !== "function") throw new Error("Vorlage unvollständig: " + (def && def.id));
    if (VORLAGEN.some(v => v.id === def.id)) throw new Error("Doppelte Vorlagen-ID: " + def.id);
    def.stufe = def.stufe || 2;
    VORLAGEN.push(def);
    return def;
  }

  function alleVorlagen() { return VORLAGEN.slice(); }
  function vorlageVon(id) { return VORLAGEN.find(v => v.id === id) || null; }

  /** Themenbaum für die Auswahl-Oberfläche */
  function themenBaum() {
    const m = new Map();
    VORLAGEN.forEach(v => {
      const hk = hauptVon(v);
      if (!m.has(hk)) m.set(hk, { key: hk, label: HAUPT_LABEL[hk] || THEMEN_LABEL[hk] || hk, subs: new Map(), n: 0 });
      const t = m.get(hk); t.n++;
      const sk = v.sub || "Sonstiges";
      if (!t.subs.has(sk)) t.subs.set(sk, { key: sk, label: sk, n: 0, ids: [] });
      const s = t.subs.get(sk); s.n++; s.ids.push(v.id);
    });
    return [...m.values()]
      .map(t => ({ key: t.key, label: t.label, n: t.n, subs: [...t.subs.values()].sort((a, b) => b.n - a.n || a.label.localeCompare(b.label, "de")) }))
      .sort((a, b) => {
        const ia = HAUPT_REIHE.indexOf(a.key), ib = HAUPT_REIHE.indexOf(b.key);
        if (ia >= 0 && ib >= 0) return b.n - a.n || ia - ib;
        return b.n - a.n;
      });
  }

  /* ======================= 5. Aufgabe erzeugen ========================== */

  const KONTEXT = {
    firmen: ["Weber Medizintechnik GmbH", "Lindner Logistik AG", "Bachmann & Söhne KG", "Nordstern Versicherung AG",
             "Kellermann Präzisionsteile GmbH", "Havelblick Energie AG", "Sturm Bau GmbH", "Alpenland Reisen GmbH",
             "Rothbach Pharma GmbH", "Delta Kunststofftechnik GmbH", "Seeblick Klinik gGmbH", "Merkur Handels AG"],
    abteilungen: ["Vertrieb", "Buchhaltung", "Konstruktion", "Kundenservice", "Personalabteilung", "Einkauf",
                  "Lager und Versand", "Qualitätssicherung", "Marketing", "Außendienst", "Entwicklung"],
    standorte: ["Hauptsitz in Kassel", "Werk in Ingolstadt", "Niederlassung in Rostock", "Standort in Freiburg",
                "Zweigstelle in Erfurt", "Büro in Osnabrück", "Filiale in Cottbus"],
    rollen: ["Frau Ahrens", "Herr Delling", "Frau Kubiak", "Herr Reinhold", "Frau Özdemir", "Herr Wagner",
             "Frau Petrov", "Herr Schuster"],
    geraete: ["Notebook", "Thin Client", "Convertible", "Tablet mit Tastatur-Dock", "Desktop-PC", "Workstation"]
  };

  const GERAET_PLURAL = {
    "Notebook": "Notebooks", "Thin Client": "Thin Clients", "Convertible": "Convertibles",
    "Tablet mit Tastatur-Dock": "Tablets mit Tastatur-Dock", "Desktop-PC": "Desktop-PCs",
    "Workstation": "Workstations"
  };

  function baueKontext(R) {
    const g = R.waehle(KONTEXT.geraete);
    return {
      geraet: g,
      geraetPl: GERAET_PLURAL[g] || (g + "s"),
      firma: R.waehle(KONTEXT.firmen),
      abteilung: R.waehle(KONTEXT.abteilungen),
      standort: R.waehle(KONTEXT.standorte),
      person: R.waehle(KONTEXT.rollen),
      mitarbeiter: R.stufe(8, 240, 4)
    };
  }

  /**
   * Aufgabe bauen.
   * @param {string} id   Vorlagen-ID
   * @param {number} saat Zufallssaat (weglassen = neue Zufallssaat)
   */
  function erzeuge(id, saat) {
    const v = vorlageVon(id);
    if (!v) throw new Error("Unbekannte Vorlage: " + id);
    if (saat == null) saat = (Math.random() * 4294967295) >>> 0;
    const R = new Rng(hashText(id) ^ saat);
    const ctx = baueKontext(R);
    const roh = v.bau(R, ctx) || {};
    const rohFelder = (roh.felder || []).slice();

    /* Rechenweg-Feld automatisch anhängen, wo gerechnet wird.
       0 BE — die Punkte bleiben bei den Ergebnisfeldern, der Rechenweg
       rettet sie über die Folgefehlerregel (siehe pruefeAufgabe).        */
    const rechenFelder = rohFelder.filter(f =>
      f && (f.typ === "zahl" || (f.typ === "raster" && (f.zeilen || [])
        .some(z => (z.zellen || []).some(c => c.eingabe && c.text == null)))));
    if (roh.rechenweg !== false && rechenFelder.length) {
      const soll = zwischenwerte(roh.loesung || "");
      if (soll.length >= 3) {
        rohFelder.push({
          typ: "rechenweg", be: 0, soll, zeilen: Math.min(9, 3 + soll.length),
          label: "Rechenweg / Nebenrechnung",
          hilfe: "Schreib jeden Schritt in eine eigene Zeile, so wie du ihn auf dem " +
                 "Prüfungsbogen notieren würdest — z. B. 1.299 ÷ 36 = 36,08. " +
                 "Stimmt der Rechenweg und nur das Endergebnis nicht, gibt es dafür " +
                 "in der Prüfung trotzdem Punkte."
        });
      }
    }
    const felder = rohFelder.map((f, i) => normFeld(f, i));
    return {
      vorlageId: v.id,
      saat: saat >>> 0,
      thema: v.thema,
      sub: v.sub,
      haupt: hauptVon(v),
      themaLabel: HAUPT_LABEL[hauptVon(v)] || THEMEN_LABEL[v.thema] || v.thema,
      titel: roh.titel || v.titel,
      stufe: roh.stufe || v.stufe,
      situation: roh.situation || "",
      code: roh.code || "",
      prompt: roh.prompt || "",
      tabellen: roh.tabellen || [],
      hinweis: roh.hinweis || "",
      katalog: roh.katalog || v.katalog || null,   // z. B. "veraltet"
      felder,
      loesung: roh.loesung || "",
      merksatz: roh.merksatz || v.merksatz || "",
      maxPoints: runde(felder.reduce((s, f) => s + (f.be || 0), 0), 2)
    };
  }

  function normFeld(f, i) {
    /* Ob die Vorlage die BE selbst gesetzt hat, muss VOR dem Vorbelegen
       festgehalten werden — sonst gewinnt der Vorgabewert 1 und eine
       Richtig/Falsch-Tabelle mit sechs Aussagen wäre so viel wert wie eine
       einzige Zeile „Nennen Sie …“.                                      */
    const beGesetzt = f && f.be != null;
    const g = Object.assign({ typ: "text", be: 1, dez: 2 }, f);
    g.nr = i;
    if (g.typ === "zahl") {
      if (g.tolAbs == null) g.tolAbs = 0.5 * Math.pow(10, -(g.dez == null ? 2 : g.dez)) + 1e-9;
      if (g.tolRel == null) g.tolRel = 0.002;             // 0,2 % — deckt Zwischenrundungen ab
    }
    if (g.typ === "text" || g.typ === "liste") {
      g.erwartet = (g.erwartet || []).map(e => Array.isArray(e) ? e : [e]);
      if (g.noetig == null) g.noetig = g.erwartet.length;
    }
    if (g.typ === "raster") {
      g.be = runde((g.zeilen || []).reduce((s, z) =>
        s + z.zellen.reduce((t, c) => t + (c.eingabe ? (c.be || 0) : 0), 0), 0), 2);
    }
    if (g.typ === "aussagen") {
      /* Die Vorlagen schreiben die Aussage teils als `t`, teils als `text`.
         Hier wird das einmal geradegezogen — sonst bleibt die Spalte
         „Aussage“ im Arbeitsblatt und im Druck leer und die Aufgabe ist
         nicht lösbar.                                                    */
      (g.aussagen || []).forEach(a => {
        if (a && a.text == null) a.text = a.t;
        if (a && a.t == null) a.t = a.text;
      });
      if (!beGesetzt) g.be = runde((g.aussagen || []).length * 0.5, 2);
    }
    if (g.typ === "zuordnung" && !beGesetzt) g.be = runde((g.paare || []).length * 0.5, 2);
    return g;
  }

  /* ================= 5b. Rechenweg: Zwischenwerte ====================== */
  /*
     Auf dem Prüfungsbogen steht fast immer „Geben Sie den Rechenweg an“ —
     und der Rechenweg bringt eigene Punkte, auch wenn das Endergebnis
     daneben liegt (Folgefehlerbewertung). Bisher gab es dafür kein Feld.

     Die Musterlösung jeder Vorlage enthält den kompletten Rechenweg als
     Text. Daraus werden die Zwischenwerte in Lesereihenfolge gezogen; die
     Antwort wird dagegen geprüft. Das braucht keine Änderung an den
     Vorlagen und zeigt genau, ab welcher Zeile es auseinanderläuft.
  */

  const ZAHL_RE = /-?\d{1,3}(?:\.\d{3})+(?:,\d+)?|-?\d+,\d+|-?\d+/g;

  /** Zahlen einer Zeile mit ihrer Rohschreibweise, deutsch gelesen */
  function zahlenAusText(text) {
    const out = [];
    String(text == null ? "" : text).replace(ZAHL_RE, (m, pos) => {
      const w = leseZahlen(m);
      if (w.length) out.push({ roh: m, wert: w[0], pos });
      return m;
    });
    return out;
  }

  /**
   * Zwischenwerte aus einer Musterlösung, in Lesereihenfolge.
   * Herausgefiltert wird, was kein Rechenschritt ist: Aufzählungsziffern
   * am Zeilenanfang, Jahreszahlen, sehr kleine ganze Zahlen (die stehen
   * meist im Fließtext) und Wiederholungen.
   */
  function zwischenwerte(loesung, grenze) {
    const zeilen = String(loesung == null ? "" : loesung).split(/\r?\n/);
    const roh = [];
    zeilen.forEach(z => {
      /* nur echte Rechenzeilen: da steht ein Ergebnis hinter einem = oder → */
      if (!/[=→]/.test(z)) return;
      /* „1. Schritt“, „  2) …“ — Aufzählungsziffer ist kein Rechenschritt */
      let s = z.replace(/^\s*[-•·]?\s*\d{1,2}[.)]\s+/, "  ");
      /* IP-Adressen, Versionen, Datumsangaben rauswerfen — das sind keine Zahlen */
      s = s.replace(/\d{1,3}(?:\.\d{1,3}){2,}/g, " ")
           .replace(/\b\d{1,2}\.\d{1,2}\.(?:\d{2,4})?\b/g, " ");
      zahlenAusText(s).forEach(x => roh.push(x));
    });
    const gesehen = new Set();
    const out = [];
    roh.forEach(x => {
      const v = runde(x.wert, 4);
      if (!isFinite(v)) return;
      if (Number.isInteger(v) && Math.abs(v) < 10) return;          // Fließtext
      if (Number.isInteger(v) && v >= 1900 && v <= 2100) return;    // Jahreszahl
      const k = String(v);
      if (gesehen.has(k)) return;
      gesehen.add(k);
      out.push({ roh: x.roh, wert: v });
    });
    return out.slice(0, grenze || 12);
  }

  /**
   * Rechenweg der Antwort gegen die Zwischenwerte der Musterlösung.
   * @returns {{gesamt, gefunden, quote, ersteLuecke, fehlt:[]}}
   */
  function pruefeRechenweg(antwort, soll) {
    soll = soll || [];
    const meine = zahlenAusText(antwort).map(x => runde(x.wert, 4));
    const trifft = s => meine.some(m =>
      Math.abs(m - s) <= Math.max(0.011, Math.abs(s) * 0.006));

    let gefunden = 0, ersteLuecke = -1;
    const fehlt = [];
    soll.forEach((s, i) => {
      if (trifft(s.wert)) gefunden++;
      else { fehlt.push(s.roh); if (ersteLuecke < 0) ersteLuecke = i; }
    });

    /* Der Anfang der Rechnung zählt mehr als das Ende: hinten in der
       Musterlösung stehen oft noch Übersichten und Hinweise, deren Zahlen
       gar nicht zum Rechenweg gehören. Bewertet wird deshalb der Kern —
       die ersten sechs Zwischenwerte.                                     */
    const kernN = Math.min(6, soll.length);
    let kern = 0;
    for (let i = 0; i < kernN; i++) if (trifft(soll[i].wert)) kern++;

    return {
      gesamt: soll.length, gefunden, fehlt, ersteLuecke,
      kern, kernN,
      quote: soll.length ? gefunden / soll.length : 0,
      /* nachvollziehbar = mindestens drei Schritte und der halbe Kern */
      tragfaehig: gefunden >= 3 && kernN > 0 && kern / kernN >= 0.5
    };
  }

  /* ======================= 6. Prüfen ==================================== */

  /** eine Zahl gegen den Sollwert */
  function zahlOk(soll, ist, f) {
    if (ist == null) return false;
    const tol = Math.max(f.tolAbs || 0, Math.abs(soll) * (f.tolRel || 0));
    return Math.abs(ist - soll) <= tol + 1e-9;
  }

  /**
   * Ein Feld prüfen.
   * @returns {{status:"leer"|"richtig"|"teil"|"falsch", punkte, gefunden:[], fehlt:[], text}}
   */
  function pruefeFeld(f, eingabe) {
    const leer = { status: "leer", punkte: 0, gefunden: [], fehlt: [], text: "" };

    if (f.typ === "zahl") {
      const roh = String(eingabe == null ? "" : eingabe).trim();
      if (!roh) return leer;
      const kandidaten = leseZahlen(roh);
      const ok = kandidaten.some(k => zahlOk(f.loesung, k, f));
      // typischer Fehler: richtige Zahl, falsche Größenordnung
      const faktor = !ok && kandidaten.some(k => k && [1000, 1024, 100, 10, 0.1, 0.01, 0.001, 8, 0.125]
        .some(x => zahlOk(f.loesung, k * x, f)));
      return {
        status: ok ? "richtig" : "falsch", punkte: ok ? f.be : 0, gefunden: [], fehlt: [],
        text: ok ? "" : (faktor ? "Zahl stimmt, Einheit/Größenordnung nicht — noch einmal umrechnen."
          : (kandidaten.length ? "" : "Da steht keine Zahl."))
      };
    }

    if (f.typ === "auswahl") {
      if (eingabe == null || eingabe === "") return leer;
      const ok = String(eingabe) === String(f.loesung);
      return { status: ok ? "richtig" : "falsch", punkte: ok ? f.be : 0, gefunden: [], fehlt: [], text: "" };
    }

    if (f.typ === "mehrfachwahl") {
      const gew = Array.isArray(eingabe) ? eingabe.map(String) : [];
      if (!gew.length) return leer;
      const soll = (f.loesung || []).map(String);
      const treffer = gew.filter(x => soll.includes(x)).length;
      const daneben = gew.length - treffer;
      const quote = Math.max(0, (treffer - daneben) / Math.max(1, soll.length));
      const punkte = runde(f.be * quote, 2);
      return {
        status: quote >= 0.999 ? "richtig" : (punkte > 0 ? "teil" : "falsch"),
        punkte, gefunden: [], fehlt: [],
        text: daneben ? daneben + " falsch angekreuzt" : (treffer < soll.length ? (soll.length - treffer) + " fehlt noch" : "")
      };
    }

    if (f.typ === "aussagen") {
      const gew = eingabe || {};
      const n = (f.aussagen || []).length;
      let ok = 0, beantwortet = 0;
      f.aussagen.forEach((a, i) => {
        const w = gew[i];
        if (w === undefined || w === null || w === "") return;
        beantwortet++;
        if ((w === "w" || w === true) === !!a.wahr) ok++;
      });
      if (!beantwortet) return leer;
      const punkte = runde(f.be * (ok / n), 2);
      return {
        status: ok === n ? "richtig" : (ok ? "teil" : "falsch"), punkte, gefunden: [], fehlt: [],
        text: ok + " von " + n + " richtig"
      };
    }

    if (f.typ === "zuordnung") {
      const gew = eingabe || {};
      const n = (f.paare || []).length;
      let ok = 0, beantwortet = 0;
      f.paare.forEach((p, i) => {
        if (!gew[i]) return;
        beantwortet++;
        if (String(gew[i]) === String(p[1])) ok++;
      });
      if (!beantwortet) return leer;
      const punkte = runde(f.be * (ok / n), 2);
      return { status: ok === n ? "richtig" : (ok ? "teil" : "falsch"), punkte, gefunden: [], fehlt: [], text: ok + " von " + n + " richtig" };
    }

    if (f.typ === "raster") {
      const gew = eingabe || {};
      let be = 0, ok = 0, gesamt = 0, gefuellt = 0;
      const zellen = {};
      (f.zeilen || []).forEach((z, zi) => z.zellen.forEach((c, ci) => {
        if (!c.eingabe) return;
        gesamt++;
        const k = zi + "-" + ci;
        const roh = String(gew[k] == null ? "" : gew[k]).trim();
        if (!roh) { zellen[k] = "leer"; return; }
        gefuellt++;
        let treffer;
        if (c.text != null) treffer = enthaeltEines(roh, Array.isArray(c.text) ? c.text : [c.text]);
        else treffer = leseZahlen(roh).some(v => zahlOk(c.loesung, v, { tolAbs: c.tolAbs != null ? c.tolAbs : 0.5 * Math.pow(10, -(c.dez == null ? 2 : c.dez)) + 1e-9, tolRel: c.tolRel != null ? c.tolRel : 0.002 }));
        zellen[k] = treffer ? "richtig" : "falsch";
        if (treffer) { ok++; be += (c.be || 0); }
      }));
      if (!gefuellt) return leer;
      return {
        status: ok === gesamt ? "richtig" : (ok ? "teil" : "falsch"),
        punkte: runde(be, 2), gefunden: [], fehlt: [], zellen,
        text: ok + " von " + gesamt + " Feldern richtig"
      };
    }

    if (f.typ === "knoten") return pruefeKnoten(f, eingabe);
    if (f.typ === "flussbild") return pruefeFlussbild(f, eingabe);
    if (f.typ === "modell") return pruefeModell(f, eingabe);

    if (f.typ === "rechenweg") {
      const roh = String(eingabe == null ? "" : eingabe).trim();
      if (!roh) return leer;
      const w = pruefeRechenweg(roh, f.soll);
      const genug = w.tragfaehig;
      return {
        status: genug && w.kern === w.kernN ? "richtig" : (w.gefunden ? "teil" : "falsch"),
        punkte: 0,                       /* zählt über die Folgefehlerregel */
        gefunden: [], fehlt: w.fehlt, weg: w,
        text: w.gesamt
          ? w.gefunden + " von " + w.gesamt + " Zwischenwerten der Musterlösung stehen in deinem Rechenweg"
            + (w.ersteLuecke >= 0 && w.ersteLuecke < w.kernN
                ? " · ab „" + f.soll[w.ersteLuecke].roh + "“ weicht es ab — dort noch einmal nachrechnen"
                : " · der Rechenweg trägt")
            + (genug ? "" : " · für Folgefehlerpunkte fehlen noch Zwischenschritte")
          : "Selbst mit der Musterlösung vergleichen."
      };
    }

    /* text / liste */
    const roh = String(eingabe == null ? "" : eingabe).trim();
    if (!roh) return leer;
    const erwartet = f.erwartet || [];
    if (!erwartet.length) return { status: "teil", punkte: 0, gefunden: [], fehlt: [], text: "Selbst bewerten." };

    // jede Nennung darf nur einen Erwartungsblock bedienen
    const stuecke = teile(roh);
    const belegt = new Set();
    const gefunden = [], fehlt = [];
    erwartet.forEach((syn, i) => {
      let hit = false;
      for (let s = 0; s < stuecke.length; s++) {
        if (belegt.has(s)) continue;
        if (enthaeltEines(stuecke[s], syn)) { belegt.add(s); hit = true; break; }
      }
      if (!hit && enthaeltEines(roh, syn)) hit = true;       // Fließtext ohne Trennzeichen
      (hit ? gefunden : fehlt).push(syn[0]);
    });

    const noetig = Math.max(1, f.noetig || erwartet.length);
    const quote = Math.min(1, gefunden.length / noetig);
    let punkte = runde(f.be * quote, 2);
    let text = gefunden.length + " von " + noetig + " erwarteten Punkten erkannt";

    /* Satzbau-Kontrolle: gegen "ein Wort statt einer Erläuterung".
       Greift nur bei Feldern, die ausdrücklich einen Satz verlangen.       */
    if (f.satzbau && punkte > 0) {
      const anzahlWorte = String(roh).trim().split(/\s+/).filter(Boolean).length;
      const proNennung = anzahlWorte / Math.max(1, Math.min(stuecke.length, noetig));
      const konnektor = /(weil|damit|dadurch|so\s?dass|sodass|denn|deshalb|daher|somit|folglich|um\s+\S+\s+zu\s|führt\s+zu|ermöglicht|verhindert|reduziert|erhöht|schützt|spart|senkt)/i.test(roh);
      const zuKurz = proNennung < (f.minWorte || 6);
      if (zuKurz) {
        punkte = runde(punkte * 0.5, 2);
        text += " · zu knapp: das ist eine Nennung, keine Erläuterung — schreibe je Punkt einen vollständigen Satz";
      } else if (!konnektor) {
        punkte = runde(punkte * 0.75, 2);
        text += " · es fehlt die Begründung — ergänze „weil / damit / dadurch …“";
      }
    }

    return {
      status: quote >= 0.999 && punkte >= f.be - 1e-9 ? "richtig" : (punkte > 0 ? "teil" : "falsch"),
      punkte, gefunden, fehlt, text
    };
  }

  /**
   * Beste Zuordnung einer eingegebenen Bezeichnung zu einer Sollzeile.
   * Exakte Treffer schlagen unscharfe; bei unscharfen gewinnt die ähnlichste
   * Länge — sonst schluckt "Expresssendung" die Zeile "Sendung".
   */
  function findeTreffer(name, soll, key, belegt) {
    const na = norm(String(name == null ? "" : name));
    if (!na) return -1;
    let best = -1, bestScore = -Infinity;
    soll.forEach((s, i) => {
      if (belegt && belegt.has(i)) return;
      const ns = norm(String(s[key] == null ? "" : s[key]));
      let sc = null;
      if (ns && na === ns) sc = 1000;
      else if (enthaelt(name, s[key]) || enthaelt(s[key], name)) sc = 100 - Math.abs(ns.length - na.length);
      if (sc != null && sc > bestScore) { bestScore = sc; best = i; }
    });
    return best;
  }

  /* ====================================================================
     Aktivitätsdiagramm als Bild statt als Tabelle
     --------------------------------------------------------------------
     Eine Knotentabelle mit vier Spalten je Zeile ist auf Papier machbar
     und am Telefon unbenutzbar: man sieht den Ablauf nicht, sondern muss
     ihn im Kopf zusammensetzen, und tippt Zielnamen ab. Geprüft wird
     dabei Abtippen, nicht Modellieren.

     Deshalb wird der Ablauf gezeichnet und es werden Lücken hineingelegt
     — genau die Aufgabenform, die in der echten Prüfung unter
     „Vervollständigen Sie das Aktivitätsdiagramm“ steht.

     flussLayout() macht aus dem Graphen einen Baum aus Blöcken, den eine
     Oberfläche stur von oben nach unten zeichnen kann:

       {art:"knoten", i}                       ein Kasten
       {art:"zweige", von, spalten:[{bed, bloecke}]}   Verzweigung/Fork
       {art:"sprung", ziel}                    Rücksprung (Schleife)

     Zusammenführungen werden erkannt: die Zweige hören dort auf, und der
     gemeinsame Knoten wird danach einmal auf der äußeren Ebene gezeichnet.
     ==================================================================== */
  function flussLayout(soll, startName) {
    const nr = {};
    (soll || []).forEach((k, i) => { if (nr[k.name] == null) nr[k.name] = i; });
    const kinder = i => (soll[i].nach || []).map(n => nr[n]).filter(x => x != null);

    /* alles, was von i aus vorwärts erreichbar ist (Zyklen enden von selbst) */
    function erreichbar(i) {
      const m = new Set(), stapel = [i];
      while (stapel.length) {
        const x = stapel.pop();
        kinder(x).forEach(y => { if (!m.has(y)) { m.add(y); stapel.push(y); } });
      }
      return m;
    }
    /* erster Knoten, bei dem alle Zweige wieder zusammenlaufen */
    function treffpunkt(zweige) {
      if (zweige.length < 2) return null;
      const mengen = zweige.map(z => { const m = erreichbar(z); m.add(z); return m; });
      const reihe = [], gesehen = new Set([zweige[0]]), q = [zweige[0]];
      while (q.length) {
        const x = q.shift(); reihe.push(x);
        kinder(x).forEach(y => { if (!gesehen.has(y)) { gesehen.add(y); q.push(y); } });
      }
      for (const kandidat of reihe) {
        if (mengen.every(m => m.has(kandidat))) return kandidat;
      }
      return null;
    }

    const fertig = new Set();
    function kette(i, stopp, tiefe) {
      const raus = [];
      let sicherung = 0;
      while (i != null && i !== stopp && sicherung++ < 200) {
        if (fertig.has(i)) { raus.push({ art: "sprung", ziel: i }); break; }
        fertig.add(i);
        raus.push({ art: "knoten", i: i });
        const k = kinder(i);
        if (!k.length) break;
        if (k.length === 1) { i = k[0]; continue; }
        /* Ein Zweig, der zurückspringt, zählt bei der Suche nach dem
           Treffpunkt nicht mit — sonst „trifft“ sich die Schleife mit
           sich selbst.                                                */
        const vorwaerts = k.filter(z => !fertig.has(z));
        const treff = vorwaerts.length >= 2 ? treffpunkt(vorwaerts) : null;
        const bed = soll[i].bed || [];
        raus.push({
          art: "zweige", von: i,
          spalten: k.map((z, n) => ({ bed: bed[n] || null, ziel: z, bloecke: kette(z, treff, tiefe + 1) }))
        });
        i = treff;
      }
      return raus;
    }

    let start = nr[startName];
    if (start == null) start = (soll || []).findIndex(k => normTyp(k.typ) === "start");
    if (start < 0 || start == null) start = 0;
    const bloecke = kette(start, null, 0);
    /* Knoten, die kein Zweig erreicht hat (defensiv), hinten anhängen */
    (soll || []).forEach((k, i) => { if (!fertig.has(i)) bloecke.push({ art: "knoten", i: i }); });
    return bloecke;
  }

  /* ---------- Lückendiagramm prüfen ------------------------------------ */
  /**
   * f = { typ:"flussbild", soll, start, be,
   *       luecken:[{art:"name"|"typ"|"bed", n:<Knoten>, e:<Kante>, soll:"…"}],
   *       pool:{name:[…], typ:[…], bed:[…]} }
   * eingabe = { "0":"Aktion", "2":"[nein]", … }   Schlüssel = Lückennummer
   */
  function pruefeFlussbild(f, eingabe) {
    const L = f.luecken || [];
    const e = eingabe && typeof eingabe === "object" && !Array.isArray(eingabe) ? eingabe : {};
    const gefuellt = L.filter((_, i) => String(e[i] == null ? "" : e[i]).trim()).length;
    if (!gefuellt) return { status: "leer", punkte: 0, gefunden: [], fehlt: [], text: "", luecken: {} };

    const gleich = (a, b, art) => {
      const x = String(a == null ? "" : a).trim(), y = String(b == null ? "" : b).trim();
      if (!x) return false;
      if (art === "typ") return normTyp(x) === normTyp(y);
      if (art === "bed") return norm(x).replace(/[\[\]]/g, "") === norm(y).replace(/[\[\]]/g, "");
      return norm(x) === norm(y);
    };

    const proLuecke = (f.be || L.length) / Math.max(1, L.length);
    const stand = {}; let ok = 0;
    L.forEach((l, i) => {
      const r = gleich(e[i], l.soll, l.art);
      stand[i] = r ? "richtig" : (String(e[i] == null ? "" : e[i]).trim() ? "falsch" : "offen");
      if (r) ok++;
    });

    return {
      status: ok === L.length ? "richtig" : (ok ? "teil" : "falsch"),
      punkte: runde(ok * proLuecke, 2),
      gefunden: [], fehlt: [], luecken: stand,
      text: ok + " von " + L.length + " Lücken richtig" +
            (gefuellt < L.length ? " · " + (L.length - gefuellt) + " noch offen" : "")
    };
  }

  /* ---------- Knotentabelle (Aktivitäts- und Klassendiagramm) ----------- */
  /**
   * f = { typ:"knoten", spalten, typen, soll:[{name, typ, nach:[], bed:[]}], be }
   * eingabe = [ {name, typ, nach, bed}, … ]  (nach/bed als Freitext)
   * Bewertet Inhalt (welche Knoten, welcher Typ, welche Kanten) und meldet
   * Notationsfehler als Text — ohne die Musterlösung zu verraten.
   */
  function pruefeKnoten(f, eingabe) {
    const zeilen = (eingabe || []).filter(z => z && String(z.name || "").trim());
    if (!zeilen.length) return { status: "leer", punkte: 0, gefunden: [], fehlt: [], text: "", zeilen: {} };

    const soll = f.soll || [];
    const proKnoten = f.be / Math.max(1, soll.length);
    const STRUKTUR = ["start", "ende", "merge", "parallelisierung", "synchronisation"];
    const belegt = new Set();
    const trefferVon = (name, typ) => {
      let best = findeTreffer(name, soll, "name", belegt);
      /* Struktur-Knoten (Start, Ende, Fork, Join, Merge) dürfen anders heißen —
         "Aktivitätsende" statt "Ende" ist kein Fehler. Dann zählt der Typ.   */
      if (best < 0 && typ) {
        const t = normTyp(typ);
        if (STRUKTUR.includes(t)) {
          for (let i = 0; i < soll.length; i++) {
            if (!belegt.has(i) && normTyp(soll[i].typ) === t) { best = i; break; }
          }
        }
      }
      if (best >= 0) belegt.add(best);
      return best;
    };
    const zuordnung = zeilen.map(z => trefferVon(z.name, z.typ));

    const stand = {}, gefunden = [], fehlt = [];
    let punkte = 0;
    soll.forEach((s, i) => {
      const zi = zuordnung.indexOf(i);
      if (zi < 0) { fehlt.push(s.name); return; }
      const z = zeilen[zi];
      let p = proKnoten * 0.5;
      const typOk = normTyp(z.typ) === normTyp(s.typ);
      if (typOk) p += proKnoten * 0.25;
      const meineNach = teile(z.nach || "");
      const sollNach = s.nach || [];
      const nachOk = sollNach.length === 0
        ? meineNach.length === 0
        : (sollNach.every(n => meineNach.some(m => enthaelt(m, n) || enthaelt(n, m)))
          && meineNach.length >= sollNach.length);
      if (nachOk) p += proKnoten * 0.25;
      punkte += p;
      gefunden.push(s.name);
      stand[zi] = { typOk, nachOk, treffer: true };
    });
    zeilen.forEach((z, zi) => { if (zuordnung[zi] < 0) stand[zi] = { treffer: false }; });

    /* Notationsprüfung — kostet keine Punkte, hilft aber beim Zeichnen */
    const meldungen = [];
    const starts = zeilen.filter(z => normTyp(z.typ) === "start").length;
    if (starts !== 1) meldungen.push("genau ein Startknoten ist Pflicht (gefunden: " + starts + ")");
    if (!zeilen.some(z => normTyp(z.typ) === "ende")) meldungen.push("es fehlt ein Endknoten");
    zeilen.forEach(z => {
      const t = normTyp(z.typ), n = teile(z.nach || "");
      if (t === "entscheidung" && n.length < 2) meldungen.push("„" + z.name + "“: eine Entscheidung braucht mindestens zwei Ausgänge");
      if (t === "entscheidung" && teile(z.bed || "").length < 2) meldungen.push("„" + z.name + "“: beide Abzweigungen brauchen eine Bedingung in [eckigen Klammern]");
      if (t === "aktion" && n.length > 1) meldungen.push("„" + z.name + "“: aus einer Aktion führt genau eine Kante — für Verzweigungen Entscheidung oder Fork nutzen");
      if (t === "aktion" && n.length === 0) meldungen.push("„" + z.name + "“: hier endet der Fluss ohne Endknoten");
      if (t === "ende" && n.length) meldungen.push("„" + z.name + "“: aus dem Endknoten führt keine Kante mehr");
      if ((t === "parallelisierung" || t === "fork") && n.length < 2) meldungen.push("„" + z.name + "“: ein Fork teilt in mindestens zwei parallele Flüsse");
    });
    const erfunden = zeilen.filter((z, zi) => zuordnung[zi] < 0).map(z => z.name);

    punkte = runde(Math.min(f.be, punkte), 2);
    const text = [
      gefunden.length + " von " + soll.length + " geforderten Knoten erkannt",
      erfunden.length ? "nicht gefordert: " + erfunden.slice(0, 3).join(", ") : "",
      meldungen.length ? "Notation: " + meldungen.slice(0, 3).join(" · ") : ""
    ].filter(Boolean).join(" · ");

    return {
      status: (gefunden.length === soll.length && !meldungen.length && punkte >= f.be - 1e-9)
        ? "richtig" : (punkte > 0 ? "teil" : "falsch"),
      punkte, gefunden, fehlt, zeilen: stand, meldungen, text
    };
  }

  /* ---------- Modelltabelle (ER, Klassen-, Use-Case-Diagramm) ----------- */
  /**
   * f = {
   *   typ:"modell", art:"er"|"klasse"|"usecase", be,
   *   spalten:[ {key, label, art?:"text"|"menge"|"auswahl", optionen?, gewicht?} ],
   *            die erste Spalte ist der Schlüssel (danach werden Zeilen zugeordnet)
   *   soll:[ {key: Wert | [Werte]} ],
   *   regeln: [string]        Notationshinweise, die geprüft werden sollen
   * }
   * eingabe = [ {key: "Text"} ]
   */
  function pruefeModell(f, eingabe) {
    const spalten = f.spalten || [];
    const schluessel = spalten.length ? spalten[0].key : "name";
    const zeilen = (eingabe || []).filter(z => z && String(z[schluessel] || "").trim());
    if (!zeilen.length) return { status: "leer", punkte: 0, gefunden: [], fehlt: [], text: "", zeilen: {} };

    const soll = f.soll || [];
    const proZeile = f.be / Math.max(1, soll.length);
    const bewertet = spalten.filter(s => s.art);
    const gewSumme = bewertet.reduce((s, x) => s + (x.gewicht || 1), 0) || 1;

    const belegt = new Set();
    const zuordnung = zeilen.map(z => {
      const best = findeTreffer(z[schluessel], soll, schluessel, belegt);
      if (best >= 0) belegt.add(best);
      return best;
    });

    const stand = {}, gefunden = [], fehlt = [];
    let punkte = 0;
    soll.forEach((s, i) => {
      const zi = zuordnung.indexOf(i);
      if (zi < 0) { fehlt.push(String(s[schluessel])); return; }
      const z = zeilen[zi];
      punkte += proZeile * 0.25;               // richtig benannt
      const spaltenStand = {};
      bewertet.forEach(sp => {
        const anteil = proZeile * 0.75 * ((sp.gewicht || 1) / gewSumme);
        const sollWert = s[sp.key];
        const istWert = z[sp.key];
        let quote = 0;
        const istLeer = !norm(String(istWert == null ? "" : istWert));
        if (sp.art === "menge") {
          const liste = Array.isArray(sollWert) ? sollWert : teile(String(sollWert || ""));
          if (!liste.length) quote = istLeer ? 1 : 0;
          else quote = liste.filter(x => enthaelt(istWert || "", x)).length / liste.length;
        } else {
          const leerSoll = sollWert == null ||
            (Array.isArray(sollWert) ? !sollWert.length : !norm(String(sollWert)));
          if (leerSoll) quote = istLeer ? 1 : 0;
          else quote = enthaeltEines(istWert || "", Array.isArray(sollWert) ? sollWert : [sollWert]) ? 1 : 0;
        }
        punkte += anteil * quote;
        spaltenStand[sp.key] = quote >= 0.999 ? "richtig" : (quote > 0 ? "teil" : "falsch");
      });
      gefunden.push(String(s[schluessel]));
      stand[zi] = { treffer: true, spalten: spaltenStand };
    });
    zeilen.forEach((z, zi) => { if (zuordnung[zi] < 0) stand[zi] = { treffer: false, spalten: {} }; });

    const erfunden = zeilen.filter((z, zi) => zuordnung[zi] < 0).map(z => String(z[schluessel]));
    punkte = runde(Math.min(f.be, punkte), 2);
    const text = [
      gefunden.length + " von " + soll.length + " geforderten Einträgen erkannt",
      erfunden.length ? "nicht gefordert: " + erfunden.slice(0, 3).join(", ") : ""
    ].filter(Boolean).join(" · ");

    return {
      status: (gefunden.length === soll.length && punkte >= f.be - 1e-9) ? "richtig"
        : (punkte > 0 ? "teil" : "falsch"),
      punkte, gefunden, fehlt, zeilen: stand, text
    };
  }

  function normTyp(t) {
    const s = norm(t || "");
    if (!s) return "";
    if (s.startsWith("start") || s.startsWith("anfang")) return "start";
    if (/ende$/.test(s) || s.startsWith("end") || s.startsWith("schluss") || s.startsWith("stop")) return "ende";
    if (s.startsWith("entsch") || s.startsWith("verzweig") || s.startsWith("decision") ||
        s.startsWith("raute") || s.startsWith("bedingung")) return "entscheidung";
    if (s.startsWith("zusammen") || s.startsWith("merge") || s.startsWith("vereinig")) return "merge";
    if (s.startsWith("parallel") || s.startsWith("fork") || s.startsWith("aufspalt") ||
        s.startsWith("gabel")) return "parallelisierung";
    if (s.startsWith("synchron") || s.startsWith("join") || s.startsWith("zusammenfuehr")) return "synchronisation";
    if (s.startsWith("akti") || s.startsWith("taetig") || s.startsWith("schritt")) return "aktion";
    return s;
  }

  /** ganze Aufgabe prüfen */
  function pruefeAufgabe(aufgabe, eingaben) {
    eingaben = eingaben || {};
    const felder = aufgabe.felder.map(f => {
      const r = pruefeFeld(f, eingaben[f.nr]);
      r.nr = f.nr; r.be = f.be; r.label = f.label; r.typ = f.typ;
      return r;
    });

    /* --------- Folgefehlerbewertung ---------------------------------- */
    /* So korrigiert die IHK: ist der Rechenweg nachvollziehbar und nur das
       Endergebnis falsch, gibt es die halbe Punktzahl. Umgekehrt kostet ein
       richtiges Ergebnis ohne jeden Rechenweg einen Teil der Punkte, wenn
       die Aufgabe den Rechenweg ausdrücklich verlangt.                    */
    const wegFeld = felder.find(r => r.typ === "rechenweg");
    let folgefehler = 0;
    if (wegFeld && wegFeld.weg && wegFeld.weg.tragfaehig) {
      felder.forEach(r => {
        if (r.typ !== "zahl" || r.status !== "falsch") return;
        const halb = runde((r.be || 0) / 2, 2);
        if (halb <= 0) return;
        r.punkte = halb; r.status = "teil"; folgefehler++;
        r.text = "Folgefehler: der Rechenweg stimmt, nur das Endergebnis nicht — " +
                 "in der Prüfung gibt es dafür die halbe Punktzahl. " + (r.text || "");
      });
    }

    const punkte = runde(felder.reduce((s, r) => s + r.punkte, 0), 2);
    return {
      punkte, max: aufgabe.maxPoints, felder, folgefehler,
      rechenweg: wegFeld ? wegFeld.weg : null,
      quote: aufgabe.maxPoints ? punkte / aufgabe.maxPoints : 0,
      offen: felder.filter(r => r.status === "leer" && r.typ !== "rechenweg").length
    };
  }

  /* ======================= 7. Arbeitsblatt ============================== */

  /**
   * Blatt zusammenstellen.
   * opt = { themen:[key], subs:[subKey], ids:[vorlageId], anzahl, stufen:[1,2,3], saat }
   * Es wird gemischt, gleiche Vorlage kommt erst wieder, wenn alle durch sind.
   */
  function erzeugeBlatt(opt) {
    opt = opt || {};
    const saat = opt.saat == null ? ((Math.random() * 4294967295) >>> 0) : (opt.saat >>> 0);
    const R = new Rng(saat);
    let pool = VORLAGEN.slice();
    if (opt.ids && opt.ids.length)         pool = pool.filter(v => opt.ids.includes(v.id));
    else {
      if (opt.themen && opt.themen.length) pool = pool.filter(v => opt.themen.includes(hauptVon(v)) || opt.themen.includes(v.thema));
      if (opt.subs && opt.subs.length)     pool = pool.filter(v => opt.subs.includes(v.sub));
    }
    if (opt.stufen && opt.stufen.length)   pool = pool.filter(v => opt.stufen.includes(v.stufe));
    if (!pool.length) return { saat, aufgaben: [], fehler: "Zu dieser Auswahl gibt es noch keine Vorlagen." };

    const anzahl = Math.max(1, Math.min(120, opt.anzahl || 10));
    const reihe = [];
    let rest = [];
    for (let i = 0; i < anzahl; i++) {
      if (!rest.length) rest = R.mische(pool);
      reihe.push(rest.shift());
    }
    const aufgaben = reihe.map(v => erzeuge(v.id, R.ganz(0, 2147483647)));
    return { saat, aufgaben, maxPoints: runde(aufgaben.reduce((s, a) => s + a.maxPoints, 0), 2) };
  }

  /* ======================= 7b. Abkürzung für Textaufgaben =============== */
  /**
   * Erzeugt eine "Nennen Sie n …"-Vorlage aus einem Antwortpool.
   * def = {
   *   id, thema, sub, titel, stufe, merksatz,
   *   n: [2,3],                       mögliche Anzahl geforderter Nennungen
   *   situation(R, c) -> string,
   *   frage(n, c) -> string,
   *   pool: [[syn, syn], …],          alle akzeptierten Nennungen
   *   beProNennung: 1,
   *   satzbau: true,                  verlangt ganze Sätze statt Stichworten
   *   zusatz(R, c, n) -> [feld],      optionale weitere Felder
   *   loesung(R, c, n) -> string
   * }
   */
  function nennVorlage(def) {
    return vorlage({
      id: def.id, thema: def.thema, sub: def.sub, titel: def.titel,
      stufe: def.stufe || 2, merksatz: def.merksatz, katalog: def.katalog,
      bau(R, c) {
        const n = R.waehle(def.n || [2, 3]);
        const felder = [{
          typ: "liste", label: def.feldLabel || "Ihre Antwort — eine Nennung je Zeile",
          be: n * (def.beProNennung || 1), zeilen: n + 1, noetig: n,
          satzbau: def.satzbau !== false, minWorte: def.minWorte,
          erwartet: def.pool
        }];
        if (def.zusatz) (def.zusatz(R, c, n) || []).forEach(x => felder.push(x));
        return {
          situation: def.situation ? def.situation(R, c) : "",
          prompt: def.frage(n, c),
          felder,
          loesung: def.loesung(R, c, n)
        };
      }
    });
  }

  /** Zahlwort für die Aufgabenstellung */
  const ZAHLWORT = ["null", "eine", "zwei", "drei", "vier", "fünf", "sechs"];

  /* ======================= 8. Öffentliche API =========================== */

  return {
    Rng, hashText, fmt, runde, leseZahlen, ZAHLWORT, nennVorlage,
    norm, worte, stamm, stammSatz, enthaelt, enthaeltEines, teile, nahe, abstand,
    flussLayout, normTyp,
    vorlage, alleVorlagen, vorlageVon, themenBaum, THEMEN_LABEL, KONTEXT,
    HAUPT_LABEL, HAUPT_REIHE, hauptVon, zwischenwerte, pruefeRechenweg, zahlenAusText,
    erzeuge, erzeugeBlatt, pruefeFeld, pruefeAufgabe
  };
})();
