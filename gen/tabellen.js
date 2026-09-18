/* ============================================================================
   gen/tabellen.js — Tabellen aus dem Aufgabentext werden zu echten Tabellen
   ----------------------------------------------------------------------------
   In den Prüfungs-PDFs stehen Tabellen. Der Auszug hat sie als Text gerettet,
   mit senkrechten Strichen als Spaltentrenner:

       Nr | Kriterium      | Gewichtung | Notebook P/gP | All-in-One P/gP
       1  | Platzbedarf    | 15 %       | 2 / 0,3       | 3 / 0,45
       2  | Ergonomie      | 20 %       | 2 / 0,4       | ? / ?

   Am Bildschirm wurde daraus ein Fließtext, der an beliebiger Stelle umbricht
   — bei sechs Spalten steht die Hälfte einer Zeile unter der anderen, und
   welcher Wert zu welchem Modell gehört, ist nicht mehr zu erkennen. Gedruckt
   ist es dasselbe Elend. Bei einer 16-BE-Aufgabe wie der Nutzwertanalyse aus
   Frühjahr 2023 ist damit die ganze Aufgabe unbrauchbar.

   Diese Datei erkennt solche Blöcke und baut daraus eine richtige <table>:

     · Kopfzeile fett, Spalten bleiben Spalten, Zahlen rechtsbündig.
     · Zellen, die in der Vorlage leer sind oder „?“ enthalten, werden zu
       Eingabefeldern — genau die weißen Felder, die auszufüllen sind.
       Vorher musste man die Werte irgendwie in ein großes Textfeld
       schreiben und selbst dazusagen, welche Zelle gemeint war.
     · Was eingetragen wurde, hängt als lesbarer Text an der Antwort und
       geht damit in Prüfhilfe, Auswertung, Export und Archiv ein.
     · Breite Tabellen rollen in ihrem eigenen Kasten; auf dem Telefon
       wird zusätzlich eine Karten-Ansicht angeboten (eine Karte je Zeile),
       weil sechs Spalten auf 390 px niemand lesen kann.
     · Beim Drucken erscheint die Tabelle als Tabelle, leere Zellen als
       Kästchen zum Ausfüllen mit dem Stift.

   Der Aufgabentext selbst bleibt unangetastet — der Tabellenblock wird nur
   aus der Anzeige herausgenommen und darunter als Tabelle gezeichnet.
   ========================================================================== */
"use strict";

window.GENTAB = (function () {
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  const A = () => (typeof ANSWERS !== "undefined" ? ANSWERS : {});
  const schluessel = (k, r, c) => k + "#tab" + r + "-" + c;

  /* ------------------------------------------------------------- Finden --- */
  /** Eine Zeile gilt als Tabellenzeile, wenn sie mindestens einen Strich hat
   *  und nicht bloß ein Satz mit einem Strich darin ist.                   */
  function zellen(zeile) {
    return zeile.split("|").map(s => s.trim());
  }

  /* Manche Blöcke sind im Auszug angekündigt: „Tabelle (auszufüllen): …“
     oder „Zeilen: …“. Das Wort gehört nicht in die erste Spalte — und es
     sagt uns zugleich, dass die folgenden Zeilen zur Tabelle gehören, auch
     wenn sie gar keinen Strich mehr haben.                               */
  const PRAEFIX = /^\s*(Tabelle[^:]{0,40}|Zeilen|Spalten|Kopfzeile|Tabellenkopf)\s*:\s*/i;

  /* Zahlwörter, um „jeweils zwei mögliche Vorteile“ in zwei Zeilen zu
     übersetzen.                                                         */
  const ZAHLWORT = { ein: 1, eine: 1, einen: 1, zwei: 2, drei: 3, vier: 4,
                     fünf: 5, funf: 5, sechs: 6, sieben: 7, acht: 8 };

  /** Wie viele Zeilen soll eine Tabelle bekommen, die nur aus einer
   *  Kopfzeile besteht? Erst im Text nachsehen („jeweils zwei …“), sonst
   *  aus den Bewertungseinheiten schätzen: ein Punkt je auszufüllender
   *  Zelle ist die übliche IHK-Rechnung.                                */
  function zeilenZahl(text, spalten, be) {
    const t = String(text || "");
    const satz = (t.match(/[^.\n]*\bTabelle\b[^.\n]*/i) || [""])[0];
    const m = satz.match(/\b(\d+|ein|eine|einen|zwei|drei|vier|fünf|funf|sechs|sieben|acht)\b/i);
    if (m) {
      const n = /^\d+$/.test(m[1]) ? Number(m[1]) : ZAHLWORT[m[1].toLowerCase()];
      if (n >= 1 && n <= 10) return n;
    }
    const aus = Number(be) > 0 && spalten > 0 ? Math.round(Number(be) / spalten) : 0;
    return Math.max(2, Math.min(8, aus || 2));
  }

  /** Spaltennamen aus dem Aufgabentext lesen — für „Zeilen: A | B | C“,
   *  wo die Striche die ZEILEN trennen und die Spalten nur im Satz stehen:
   *  „… indem Sie für die genannten Fehler eine mögliche Überprüfung und
   *  eine Fehlerbehebung angeben.“ → Fehler | Überprüfung | Fehlerbehebung */
  function spaltenAusText(text) {
    const t = String(text || "");
    const satz = (t.match(/[^.\n]*\b(?:indem Sie|Geben Sie|Nennen Sie|Tragen Sie|Ergänzen Sie)\b[^.\n]*/) || [""])[0];
    const antw = [];
    const rx = /\b(?:eine|einen|ein|jeweils|je)\s+(?:mögliche[nrs]?\s+|geeignete[nrs]?\s+|passende[nrs]?\s+|sinnvolle[nrs]?\s+)?([A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]{3,})/g;
    let m;
    while ((m = rx.exec(satz))) if (antw.indexOf(m[1]) < 0) antw.push(m[1]);
    const erst = (t.match(/für die genannten\s+([A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]{2,})/) || [])[1];
    return { erste: erst || "Vorgabe", antworten: antw.length ? antw.slice(0, 3) : ["Antwort"] };
  }

  /** Auch eine Beschriftung MIT Strichen kann umgebrochen sein:
   *
   *        | Lastenheft | Pflichtenheft
   *   Zweck        |    |
   *   Beispiel für |    |
   *   möglichen    |    |
   *   Inhalt       |    |
   *
   *  Daraus wurden vier Zeilen statt zwei — und damit acht Eingabefelder
   *  für eine Aufgabe mit vier Antworten. Erkennbar ist der Umbruch daran,
   *  dass die Beschriftung mit einem klein geschriebenen Wort endet („für“,
   *  „möglichen“): im Deutschen endet keine Zeilenbeschriftung so.
   *  Zusammengezogen wird nur, solange beide Zeilen sonst völlig leer sind.
   */
  function zusammenziehen(daten) {
    const raus = [];
    const leerRest = z => z.slice(1).every(x => String(x || "").trim() === "");
    const endetKlein = s => {
      const w = String(s || "").trim().split(/\s+/).pop() || "";
      return /^[a-zäöüß]/.test(w);
    };
    daten.forEach(z => {
      const vor = raus[raus.length - 1];
      if (vor && leerRest(vor) && leerRest(z) &&
          String(vor[0]).length < 60 && endetKlein(vor[0]) && String(z[0]).trim()) {
        vor[0] = (vor[0] + " " + z[0]).trim();
        return;
      }
      raus.push(z);
    });
    return raus;
  }

  /**
   * Im Text Tabellenblöcke suchen.
   * Rückgabe: [{ von, bis, kopf:[…], zeilen:[[…]], alleOffen? }]
   *
   * Drei Formen kommen in den Auszügen vor:
   *   1. Kopfzeile + Datenzeilen, alle mit Strichen — der Normalfall.
   *   2. „Tabelle (auszufüllen): A | B | C“ und darunter Zeilen ganz ohne
   *      Striche (nur die Zeilenbezeichnung). Früher fiel beides durch.
   *   3. Nur eine Kopfzeile, gar keine Datenzeilen: „Vorteile … | Nachteile …“.
   *      Dann werden leere Zeilen zum Ausfüllen erzeugt.
   *   4. „Zeilen: A | B | C“ — hier trennen die Striche die ZEILEN, die
   *      Spalten stehen im Aufgabensatz.
   */
  function finde(text, be) {
    const zeilen = String(text || "").split("\n");
    const bloecke = [];
    let i = 0;
    while (i < zeilen.length) {
      if (zeilen[i].indexOf("|") < 0) { i++; continue; }

      const pm = zeilen[i].match(PRAEFIX);
      const art = pm ? pm[1].toLowerCase().replace(/\s.*/, "") : "";
      const kopfRoh = pm ? zeilen[i].replace(PRAEFIX, "") : zeilen[i];
      const kopf = zellen(kopfRoh);
      if (kopf.length < 2) { i++; continue; }

      /* --- Form 4: die Striche trennen Zeilen, nicht Spalten --------- */
      if (art === "zeilen") {
        const sp = spaltenAusText(text);
        bloecke.push({
          von: i, bis: i,
          kopf: [sp.erste].concat(sp.antworten),
          zeilen: kopf.map(x => [x].concat(sp.antworten.map(() => "")))
        });
        i++;
        continue;
      }

      /* --- Folgezeilen einsammeln ----------------------------------- */
      const daten = [];
      let j = i + 1;
      let haenger = "";     /* Anfang einer umgebrochenen Zeilenbeschriftung */
      while (j < zeilen.length) {
        const z = zeilen[j];
        if (!z.trim()) break;
        if (z.indexOf("|") >= 0) {
          const zl = zellen(z);
          if (haenger) { zl[0] = (haenger + " " + zl[0]).trim(); haenger = ""; }
          daten.push(zl); j++; continue;
        }
        const t = z.trim();
        /* Lange Beschriftungen sind im PDF umgebrochen und stehen deshalb
           ohne Strich über ihrer eigenen Zeile:
               Durchschnittliche Anrufzeit in Minuten
               pro Nachtschicht     | 150 | 100 | 50
           Ohne diesen Fall blieb die halbe Beschriftung als loser Text im
           Aufgabentext stehen und die Tabelle begann mitten im Satz.   */
        const naechste = zeilen[j + 1] || "";
        /* Nur in Blöcken ohne Ankündigung. Steht „Tabelle (auszufüllen):“
           darüber, sind strichlose Zeilen eigene Zeilen der Tabelle —
           sonst verschmölze „01.04.2027 – 31.03.2028“ mit „Summe“.    */
        if (!pm && naechste.indexOf("|") >= 0 && t.length <= 80 && !/[.!?]$/.test(t)) {
          haenger = (haenger ? haenger + " " : "") + t;
          j++; continue;
        }
        /* Sonst gehören Zeilen ohne Strich nur dazu, wenn die Tabelle im
           Text angekündigt war — sonst wäre jeder Satz unter einer
           Tabelle plötzlich eine Tabellenzeile.                        */
        if (!pm || t.length > 80 || /[.!?]$/.test(t)) break;
        daten.push([t]);
        j++;
      }

      const breite = Math.max(kopf.length, ...daten.map(z => z.length), 2);
      kopf.length = breite;
      for (let c = 0; c < breite; c++) if (kopf[c] == null) kopf[c] = "";
      daten.forEach(z => { while (z.length < breite) z.push(""); });

      if (daten.length) {
        bloecke.push({ von: i, bis: j - 1, kopf: kopf, zeilen: zusammenziehen(daten) });
      } else {
        /* --- Form 3: nur eine Kopfzeile ----------------------------- */
        /* Eine einzelne Strichzeile ist nur dann eine Tabelle, wenn der
           Text eine ankündigt. „Typical 5 W | Max. … 13 W“ mitten in einem
           Absatz ist keine.                                            */
        if (!pm && !/\bTabelle\b/i.test(text)) { i = j; continue; }
        if (kopf.some(h => !String(h || "").trim())) { i = j; continue; }
        const n = zeilenZahl(text, breite, be);
        const leer = [];
        for (let r = 0; r < n; r++) leer.push(kopf.map(() => ""));
        bloecke.push({ von: i, bis: i, kopf: kopf, zeilen: leer, alleOffen: true });
      }
      i = j;
    }
    return bloecke;
  }

  /** Zelle, die ausgefüllt werden soll?
   *  Ganz leer, nur Fragezeichen („?“, „? / ?“) — oder teils vorgegeben,
   *  teils offen wie „4 / ?“: dort ist der Punktwert genannt und nur der
   *  gewichtete Wert zu rechnen. Solche Zellen wurden vorher als fester
   *  Text gezeichnet und waren nicht auszufüllen.                       */
  const istLuecke = s => {
    const t = String(s || "").trim();
    if (t === "") return true;
    if (/^[?\s/·—–-]+$/.test(t)) return true;
    return t.indexOf("?") >= 0;
  };
  /** Was von einer teils vorgegebenen Zelle stehen bleibt: „4 / ?“ → „4 / “ */
  const vorgabe = s => {
    const t = String(s || "").trim();
    if (!t || /^[?\s/·—–-]+$/.test(t)) return "";
    return t.replace(/\?/g, "").replace(/\s+/g, " ");
  };
  /** Welche Spalte benennt die Zeile?
   *  Spalte 0 ist oft nur eine laufende Nummer („Nr“). Als Überschrift einer
   *  Karte und als Name im Antworttext taugt „1“ nicht — gesucht wird die
   *  erste Spalte mit echtem Text.                                        */
  function titelSpalte(tab) {
    for (let c = 0; c < tab.kopf.length; c++) {
      const werte = tab.zeilen.map(z => z[c]).filter(x => !istLuecke(x));
      if (werte.length && werte.every(x => !istZahl(x) && String(x).trim().length > 2)) return c;
    }
    return 0;
  }

  /** sieht die Spalte nach Zahlen aus? */
  const istZahl = s => /^[\d.,%\s/+-]+$/.test(String(s || "").trim()) && /\d/.test(String(s || ""));

  /** Welche Zellen darf man ausfüllen?
   *
   *  Spalten ab der zweiten immer — dort steht der Antwortteil. Die erste
   *  Spalte ist normalerweise die Zeilenbeschriftung und bleibt fest; sie
   *  wird aber zum Eingabefeld, wenn
   *    · die Tabelle gar keine Beschriftungen hat („Vorteile | Nachteile“),
   *    · dort überall nur „?“ steht (dann ist auch sie gefragt), oder
   *    · sie Text enthält statt bloßer Nummern — dann sind die leeren
   *      Zellen darunter der gesuchte Text, wie bei „Maßnahmen oder
   *      Verhaltensweisen“ unter dem vorgegebenen Beispiel.
   *  Bei einer reinen Nummernspalte („Nr“) bleibt die Lücke dagegen leer:
   *  eine laufende Nummer ist keine Antwort.
   */
  function offenheit(tab) {
    if (tab.alleOffen) return () => true;
    const nurLuecken = tab.zeilen.every(z => istLuecke(z[0]));
    const text = tab.zeilen.some(z => !istLuecke(z[0]) && !istZahl(z[0]));
    const erste = nurLuecken || text;
    return c => c > 0 || erste;
  }

  /* ---------------------------------------------------------- Zeichnen --- */
  /**
   * Eine Tabelle bauen.
   * k      Schlüssel der Teilaufgabe (für die Antworten)
   * nr     laufende Nummer der Tabelle innerhalb der Aufgabe
   * tab    {kopf, zeilen}
   * aendern(r,c,wert)  wird bei jeder Eingabe gerufen
   */
  function bauen(k, nr, tab, aendern, nurLesen) {
    const wrap = el("div", "tb-wrap");
    /* Bei Tabellen ohne Zeilenbeschriftung ist auch die erste Spalte
       auszufüllen — sonst bliebe „Vorteile | Nachteile“ eine Tabelle, in
       der man nur rechts schreiben darf.                                */
    const offen = offenheit(tab);

    /* Ist in einer Spalte eine Zahl vorgegeben, wird auch die Lücke darin
       eine Zahl — dort genügt ein einzeiliges Feld. Textspalten wie
       „Überprüfung“ oder „Fehlerbehebung“ brauchen dagegen Platz für einen
       ganzen Satz; ein einzeiliges Feld schiebt den Anfang aus dem Bild,
       sobald man weiterschreibt.                                       */
    const zahlSpalte = c => istZahl(tab.zeilen.map(x => x[c]).find(x => !istLuecke(x)) || "");
    const langKopf = tab.kopf.some(h => String(h || "").trim().length > 24);
    const zahlenFelder = tab.kopf.some((_, c) => offen(c) &&
      tab.zeilen.some(z => istLuecke(z[c])) && zahlSpalte(c));
    const stapeln = langKopf || !zahlenFelder;

    /* Dieselbe Zelle steckt zweimal im Dokument: einmal in der Tabelle,
       einmal in der Karte. Sichtbar ist immer nur eine — aber wer am
       Rechner tippt und dann das Fenster schmal zieht, soll seinen Text
       wiederfinden.                                                     */
    const zwillinge = {};

    /** Ein Eingabefeld für eine Zelle. */
    function feld(r, c, wert, z, mitId) {
      const zahl = zahlSpalte(c);
      const e = el(zahl ? "input" : "textarea");
      if (zahl) { e.type = "text"; e.inputMode = "decimal"; }
      else { e.rows = 2; }
      e.className = "tb-feld" + (zahl ? " tb-zahl" : " tb-satz");
      if (mitId) e.id = "tb-" + (typeof safeId === "function" ? safeId(k) : k) +
                        "-" + nr + "-" + r + "-" + c;
      const gespeichert = A()[schluessel(k, r, c)];
      e.value = gespeichert != null ? gespeichert : "";
      const vor = vorgabe(wert);
      if (vor) e.placeholder = vor.trim() + " …";
      e.setAttribute("aria-label",
        (tab.kopf[c] || ("Spalte " + (c + 1))) + " — " + (z[0] || ("Zeile " + (r + 1))) +
        (vor ? " (vorgegeben: " + vor.trim() + ")" : ""));
      /* Mitwachsen, damit im Ausdruck nichts abgeschnitten wird: ein
         textarea druckt nur, was gerade sichtbar ist.                  */
      const hoch = () => {
        if (zahl) return;
        e.style.height = "auto";
        e.style.height = Math.max(38, e.scrollHeight + 2) + "px";
      };
      const paar = r + "-" + c;
      (zwillinge[paar] = zwillinge[paar] || []).push(e);
      e.oninput = () => {
        aendern(r, c, e.value);
        hoch();
        zwillinge[paar].forEach(x => { if (x !== e) x.value = e.value; });
      };
      if (!zahl && e.value) requestAnimationFrame(hoch);
      return e;
    }

    const kasten = el("div", "tb-rollen");
    const t = el("table", "tb");
    /* Zwei oder drei Spalten passen auf jedes Telefon — dort wäre eine
       Mindestbreite von 520 px nur unnötiges Schieben.                 */
    if (tab.kopf.length <= 3) t.classList.add("tb-schmal");
    /* Lange Überschriften dürfen umbrechen. Ohne das schob ein Kopf wie
       „Nachteile von Homeoffice für die Beschäftigten“ die zweite Spalte
       auch auf dem großen Bildschirm aus dem Kasten heraus.            */
    if (tab.kopf.some(h => String(h || "").trim().length > 24)) t.classList.add("tb-umbruch");
    const thead = el("thead"), trk = el("tr");
    tab.kopf.forEach((h, c) => {
      const th = el("th", null, h || "");
      if (!h) th.className = "tb-leerkopf";
      trk.appendChild(th);
    });
    thead.appendChild(trk); t.appendChild(thead);

    const tb = el("tbody");
    tab.zeilen.forEach((z, r) => {
      const tr = el("tr");
      z.forEach((wert, c) => {
        const td = el("td");
        if (istLuecke(wert) && offen(c)) {
          td.className = "tb-luecke";
          if (nurLesen) {
            td.textContent = (A()[schluessel(k, r, c)] || "").trim() || "";
            td.classList.add("tb-gedruckt");
          } else {
            td.appendChild(feld(r, c, wert, z, true));
          }
        } else {
          td.textContent = wert;
          if (c === 0) td.className = "tb-kopfspalte";
          else if (istZahl(wert)) td.className = "tb-zahl";
        }
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    kasten.appendChild(t);
    wrap.appendChild(kasten);

    /* Karten-Ansicht fürs Telefon: eine Karte je Zeile, Spalte für Spalte
       untereinander. Wird per CSS ein- und ausgeblendet, damit beim
       Drehen des Geräts nichts neu gebaut werden muss.                  */
    /* Auch zwei Spalten brauchen die Karten-Ansicht, wenn die Überschriften
       lang sind: „Vorteile von Homeoffice für die Beschäftigten“ ist allein
       breiter als ein Telefon, und die zweite Spalte stand dann außerhalb
       des Bildschirms — man sah nur die Hälfte der Aufgabe.            */
    if (tab.kopf.length >= 3 || langKopf) {
      /* Ohne Zeilenbeschriftung gibt es keine Titelspalte — dann ist jede
         Spalte ein Feld der Karte, und die Karte heißt schlicht „1.“    */
      const tsp = tab.alleOffen ? -1 : titelSpalte(tab);
      const karten = el("div", "tb-karten" + (stapeln ? " tb-lang" : ""));
      tab.zeilen.forEach((z, r) => {
        const kt = el("div", "tb-karte");
        const kopf = el("div", "tb-karte-kopf");
        for (let c = 0; c < tsp; c++) {
          if (String(z[c] || "").trim()) kopf.appendChild(el("span", "tb-karte-nr", z[c]));
        }
        kopf.appendChild(document.createTextNode(
          tab.alleOffen ? "Zeile " + (r + 1) : (z[tsp] || ("Zeile " + (r + 1)))));
        kt.appendChild(kopf);
        z.forEach((wert, c) => {
          if (c <= tsp) return;
          const zeile = el("div", "tb-karte-zeile");
          zeile.appendChild(el("span", "tb-karte-label", tab.kopf[c] || ("Spalte " + (c + 1))));
          if (istLuecke(wert) && offen(c)) {
            if (nurLesen) zeile.appendChild(el("span", "tb-karte-wert", (A()[schluessel(k, r, c)] || "").trim() || "—"));
            else zeile.appendChild(feld(r, c, wert, z, false));
          } else zeile.appendChild(el("span", "tb-karte-wert", wert));
          kt.appendChild(zeile);
        });
        karten.appendChild(kt);
      });
      wrap.appendChild(karten);
    }
    return wrap;
  }

  /* -------------------------------------------------- Antwort als Text --- */
  /** Was in den Lücken steht, als lesbare Zeilen — für Prüfhilfe, Export,
   *  Auswertung und Archiv.                                              */
  function alsText(k, tabellen) {
    const raus = [];
    tabellen.forEach(tab => {
      const tsp = titelSpalte(tab);
      const offen = offenheit(tab);
      tab.zeilen.forEach((z, r) => {
        const teile = [];
        z.forEach((wert, c) => {
          if (!istLuecke(wert) || !offen(c)) return;
          const v = String(A()[schluessel(k, r, c)] || "").trim();
          if (v) teile.push((tab.kopf[c] || ("Spalte " + (c + 1))) + ": " + v);
        });
        if (!teile.length) return;
        /* Ohne Zeilenbeschriftung ist die laufende Nummer der einzige
           Name, den die Zeile hat.                                      */
        const name = tab.alleOffen ? (r + 1) + "." : (z[tsp] || z[0] || ("Zeile " + (r + 1)));
        raus.push(name + " — " + teile.join(" · "));
      });
    });
    return raus.length ? "Tabelle:\n" + raus.join("\n") : "";
  }

  /* --------------------------------------------------- Karten nachrüsten --- */
  const V = () => (typeof VIEW !== "undefined" ? VIEW : null);
  const merk = {};      /* k -> [tabellen] — damit alsText() sie wiederfindet */

  function nachruesten() {
    const view = V();
    if (!view || !view.items) return;
    document.querySelectorAll("#bogenMain .tk").forEach(karte => {
      if (karte.dataset.tabFertig) return;
      const k = karte.dataset.k;
      const it = view.items.find(x => x.k === k);
      if (!it) return;
      const frage = karte.querySelector(".tk-frage");
      if (!frage) return;
      const bloecke = finde(it.prompt || "", it.maxPoints);
      if (!bloecke.length) { karte.dataset.tabFertig = "1"; return; }

      /* Text ohne die Tabellenblöcke neu setzen */
      const zeilen = String(it.prompt || "").split("\n");
      const raus = new Set();
      bloecke.forEach(b => { for (let i = b.von; i <= b.bis; i++) raus.add(i); });
      const ohne = zeilen.filter((_, i) => !raus.has(i)).join("\n").replace(/\n{3,}/g, "\n\n").trim();
      frage.textContent = "";
      if (typeof mitUnsicher === "function") mitUnsicher(frage, ohne || "—");
      else frage.textContent = ohne || "—";

      merk[k] = bloecke;
      const ziel = document.createElement("div");
      ziel.className = "tb-block";
      bloecke.forEach((tab, nr) => {
        ziel.appendChild(bauen(k, nr, tab, (r, c, wert) => {
          A()[schluessel(k, r, c)] = wert;
          karte.classList.toggle("done", typeof hatAntwort === "function" ? hatAntwort(it) : true);
          if (window.debouncedSave) window.debouncedSave();
          else if (window.speichern) window.speichern();
        }, false));
      });
      const hin = el("div", "tb-hinweis",
        "Die weißen Felder sind die auszufüllenden Zellen. Was du einträgst, " +
        "zählt zur Antwort und steht auch im Export.");
      ziel.appendChild(hin);
      frage.parentNode.insertBefore(ziel, frage.nextSibling);
      karte.dataset.tabFertig = "1";
    });
  }

  /* ------------------------------------------------------------ Einhängen */
  function einhaengen() {
    /* Tabelleninhalt an die Antwort hängen */
    const altText = window.antwortText;
    if (typeof altText === "function" && !altText.__tb) {
      const neu = function (it) {
        const basis = altText.apply(null, arguments);
        if (!it || !merk[it.k]) return basis;
        const t = alsText(it.k, merk[it.k]);
        if (!t) return basis;
        return basis ? basis + "\n\n" + t : t;
      };
      neu.__tb = true;
      window.antwortText = neu;
    }

    const altBogen = window.zeigeBogen;
    if (typeof altBogen === "function" && !altBogen.__tb) {
      const neu = function () {
        const r = altBogen.apply(this, arguments);
        try { setTimeout(nachruesten, 0); } catch (e) { console.error("Tabellen:", e); }
        return r;
      };
      neu.__tb = true;
      window.zeigeBogen = neu;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { finde, bauen, alsText, nachruesten, istLuecke };
})();
