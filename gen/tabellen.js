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

  /**
   * Im Text zusammenhängende Blöcke aus Strich-Zeilen suchen.
   * Rückgabe: [{ von, bis, kopf:[…], zeilen:[[…]] }] — Zeilennummern im Text.
   */
  function finde(text) {
    const zeilen = String(text || "").split("\n");
    const bloecke = [];
    let i = 0;
    while (i < zeilen.length) {
      if (zeilen[i].indexOf("|") < 0) { i++; continue; }
      let j = i;
      while (j < zeilen.length && zeilen[j].indexOf("|") >= 0) j++;
      const roh = zeilen.slice(i, j);
      /* Mindestens zwei Zeilen und mindestens zwei Spalten — sonst ist es
         ein Satz, in dem zufällig ein Strich steht.                      */
      if (roh.length >= 2) {
        const gitter = roh.map(zellen);
        const breite = Math.max(...gitter.map(z => z.length));
        if (breite >= 2) {
          gitter.forEach(z => { while (z.length < breite) z.push(""); });
          bloecke.push({ von: i, bis: j - 1, kopf: gitter[0], zeilen: gitter.slice(1) });
        }
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

    const kasten = el("div", "tb-rollen");
    const t = el("table", "tb");
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
        if (istLuecke(wert) && c > 0) {
          td.className = "tb-luecke";
          const id = "tb-" + (typeof safeId === "function" ? safeId(k) : k) + "-" + nr + "-" + r + "-" + c;
          if (nurLesen) {
            td.textContent = (A()[schluessel(k, r, c)] || "").trim() || "";
            td.classList.add("tb-gedruckt");
          } else {
            const inp = el("input");
            inp.type = "text";
            inp.id = id;
            inp.className = "tb-feld";
            const gespeichert = A()[schluessel(k, r, c)];
            inp.value = gespeichert != null ? gespeichert : "";
            const vor = vorgabe(wert);
            if (vor) inp.placeholder = vor.trim() + " …";
            inp.setAttribute("aria-label",
              (tab.kopf[c] || ("Spalte " + (c + 1))) + " — " + (z[0] || ("Zeile " + (r + 1))) +
              (vor ? " (vorgegeben: " + vor.trim() + ")" : ""));
            if (istZahl(tab.zeilen.map(x => x[c]).find(x => !istLuecke(x)) || "")) {
              inp.inputMode = "decimal";
              inp.classList.add("tb-zahl");
            }
            inp.oninput = () => aendern(r, c, inp.value);
            td.appendChild(inp);
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
    if (tab.kopf.length > 3) {
      const tsp = titelSpalte(tab);
      const karten = el("div", "tb-karten");
      tab.zeilen.forEach((z, r) => {
        const kt = el("div", "tb-karte");
        const kopf = el("div", "tb-karte-kopf");
        for (let c = 0; c < tsp; c++) {
          if (String(z[c] || "").trim()) kopf.appendChild(el("span", "tb-karte-nr", z[c]));
        }
        kopf.appendChild(document.createTextNode(z[tsp] || ("Zeile " + (r + 1))));
        kt.appendChild(kopf);
        z.forEach((wert, c) => {
          if (c <= tsp) return;
          const zeile = el("div", "tb-karte-zeile");
          zeile.appendChild(el("span", "tb-karte-label", tab.kopf[c] || ("Spalte " + (c + 1))));
          if (istLuecke(wert)) {
            if (nurLesen) zeile.appendChild(el("span", "tb-karte-wert", (A()[schluessel(k, r, c)] || "").trim() || "—"));
            else {
              const inp = el("input");
              inp.type = "text"; inp.className = "tb-feld";
              inp.value = A()[schluessel(k, r, c)] || "";
              inp.setAttribute("aria-label", (tab.kopf[c] || "") + " — " + (z[tsp] || ""));
              inp.oninput = () => aendern(r, c, inp.value);
              zeile.appendChild(inp);
            }
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
      tab.zeilen.forEach((z, r) => {
        const teile = [];
        z.forEach((wert, c) => {
          if (!istLuecke(wert) || c === 0) return;
          const v = String(A()[schluessel(k, r, c)] || "").trim();
          if (v) teile.push((tab.kopf[c] || ("Spalte " + (c + 1))) + ": " + v);
        });
        if (teile.length) raus.push((z[tsp] || z[0] || ("Zeile " + (r + 1))) + " — " + teile.join(" · "));
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
      const bloecke = finde(it.prompt || "");
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
