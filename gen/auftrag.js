/* ============================================================================
   gen/auftrag.js — „Was will die Aufgabe eigentlich?“
   ----------------------------------------------------------------------------
   Zwei Fehler kosten in der AP1 mehr Punkte als fehlendes Wissen:

   1. Die Aufgabe verlangt drei Antworten, geschrieben wird eine. „Nennen Sie
      drei Methoden“ ist eine Aufgabe mit drei Punkten, und wer zwei nennt,
      bekommt zwei Drittel — auch wenn beide richtig sind.
   2. Bei Rechenaufgaben fehlt der Schlusssatz. Der Rechenweg stimmt, das
      Ergebnis steht irgendwo in der Zeile, aber ohne Zahl mit Einheit als
      Aussage gibt der Korrektor den letzten Punkt nicht.

   Beides ist maschinell erkennbar, ohne irgendetwas zu verraten: der
   Aufgabentext sagt selbst, wie viele Antworten er will, und die eigene
   Antwort sagt, wie viele geschrieben wurden.

   Über dem Antwortfeld steht deshalb eine schmale Zeile:

       Verlangt: 3 Antworten — 2× Nennen, 1× Begründen        1 geschrieben

   Grau, solange nichts dasteht; gelb, solange es zu wenige sind; grün, wenn
   es passt. Keine Lösung, kein Hinweis auf den Inhalt — nur die Buchführung,
   die man in der Prüfung selbst im Kopf machen müsste.

   Gezählt wird großzügig: jede nicht leere Zeile, jedes ausgefüllte Teilfeld
   und jede ausgefüllte Tabellenzelle ist ein Punkt. Wer drei Gedanken in
   einen Absatz schreibt, wird untergezählt — das ist beabsichtigt. In der
   Prüfung liest ein Mensch mit dem Bewertungsbogen daneben; drei Zeilen
   findet er, drei Nebensätze übersieht er.
   ========================================================================== */
"use strict";

window.GENAUFTRAG = (function () {
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  /* ---------------------------------------------------------- Erkennung --- */

  /* Operatoren, die einen eigenen Auftrag eröffnen. Aus den zehn Prüfungen
     ausgezählt; „Nennen“ 67-mal, „Beschreiben“ 50-mal, dann wird es dünn. */
  const OPERATOREN = ("Nennen|Benennen|Beschreiben|Erläutern|Erklären|Begründen|Berechnen|" +
    "Errechnen|Ermitteln|Bestimmen|Geben|Ergänzen|Erstellen|Tragen|Wählen|Führen|Ordnen|" +
    "Zuordnen|Weisen|Beurteilen|Bewerten|Korrigieren|Berichtigen|Erweitern|Vervollständigen|" +
    "Markieren|Analysieren|Verbinden|Füllen|Kennzeichnen|Konfigurieren|Beantworten|Modellieren|" +
    "Interpretieren|Formulieren|Entscheiden|Vergleichen|Stellen|Identifizieren|Vergeben|" +
    "Vermerken|Schildern|Setzen|Fügen|Unterbreiten|Zeichnen|Skizzieren|Prüfen|Überprüfen|" +
    "Unterscheiden|Definieren|Sortieren|Empfehlen|Umrechnen|Wandeln|Schreiben|Notieren|" +
    "Dokumentieren|Planen|Skizzieren");

  /* Diese sehen aus wie ein Auftrag, sind aber nur eine Nebenbedingung:
     „Runden Sie auf zwei Nachkommastellen“ ist keine vierte Teilfrage.   */
  const KEIN_AUFTRAG = /^(Runden|Berücksichtigen|Verwenden|Beachten|Nutzen|Lesen|Gehen|Bringen|Richten)$/i;

  const ZAHLWORT = { ein: 1, eine: 1, einen: 1, einem: 1, zwei: 2, drei: 3, vier: 4,
                     fünf: 5, funf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10 };

  /* Rechenaufträge — hier wird zusätzlich ein Ergebnis mit Einheit erwartet */
  const RECHNET = /^(Berechnen|Errechnen|Ermitteln|Bestimmen|Umrechnen|Wandeln)$/i;

  /** Text in Sätze zerlegen, ohne an „z. B.“ zu zerbrechen. */
  function saetze(text) {
    return String(text || "")
      .replace(/z\.\s*B\./g, "zB")
      .replace(/u\.\s*a\./g, "ua")
      .replace(/ca\./g, "ca")
      .replace(/ggf\./g, "ggf")
      .split(/(?<=[.!?:])\s+|\n/)
      .map(s => s.replace(//g, ".").trim())
      .filter(Boolean);
  }

  const RX_OP = new RegExp("\\b(" + OPERATOREN + ")\\s+Sie\\b", "i");

  /**
   * Welche Aufträge stecken im Aufgabentext?
   * @returns [{ op, n }] — Operator und verlangte Anzahl
   */
  function teilfragen(prompt) {
    const raus = [];
    saetze(prompt).forEach(s => {
      /* Ein Satz kann zwei Aufträge tragen: „Nennen Sie … und begründen Sie …“ */
      s.split(/\s+und\s+(?=[A-Za-zäöüß]*\s*Sie\b)|\s*;\s*/i).forEach(t => {
        const m = t.match(RX_OP);
        if (!m) return;
        const op = m[1];
        if (KEIN_AUFTRAG.test(op)) return;
        const rest = t.slice(t.indexOf(m[0]) + m[0].length);
        /* Die Zahl muss VOR dem ersten Satzzeichen stehen — „drei Methoden“
           zählt, „auf drei Nachkommastellen“ am Satzende nicht.          */
        const kopf = rest.split(/[,.;:]/)[0] || rest;
        const z = kopf.match(/\b(\d+|ein|eine|einen|einem|zwei|drei|vier|fünf|funf|sechs|sieben|acht|neun|zehn)\b/i);
        let n = 1;
        if (z) {
          const w = z[1].toLowerCase();
          const k = /^\d+$/.test(w) ? Number(w) : ZAHLWORT[w];
          if (k >= 1 && k <= 10) n = k;
        }
        raus.push({ op: op.charAt(0).toUpperCase() + op.slice(1).toLowerCase(), n: n, rechnet: RECHNET.test(op) });
      });
    });
    return raus;
  }

  /** Verlangte Anzahl Antworten insgesamt. */
  const summe = tf => tf.reduce((a, x) => a + x.n, 0);

  /** Kurzfassung für die Zeile: „2× Nennen, 1× Begründen“ */
  function beschriftung(tf) {
    const z = {};
    tf.forEach(x => { z[x.op] = (z[x.op] || 0) + x.n; });
    return Object.keys(z).map(o => z[o] + "× " + o).join(", ");
  }

  /* -------------------------------------------------------- Auszählung --- */

  /* Einheiten, die in AP1-Antworten als Ergebnis vorkommen. Ohne eine davon
     hinter der Zahl fehlt dem Korrektor die Aussage.                     */
  const EINHEIT = /\d[\d.,\s]*\s*(EUR|€|Euro|%|Prozent|GB|MB|TB|KB|KiB|MiB|GiB|TiB|Bit|Byte|bit|B\b|W\b|kW|kWh|Wh|V\b|A\b|Ah|Std|Stunden?|h\b|Min|Minuten?|min\b|Sek|Sekunden?|s\b|Tage?|d\b|Wochen?|Monate?n?|Jahre?n?|Stück|Stk|Mbit|Gbit|MBit|GBit|ms\b|°C|m\b|cm|mm|km)/i;

  /** Wie viele Antwortpunkte stehen schon da? */
  function gezaehlt(karte) {
    let n = 0;
    const haupt = karte.querySelector(".tk-haupt > textarea");
    if (haupt) {
      n += String(haupt.value || "").split("\n")
        .map(z => z.trim()).filter(z => z.length > 1).length;
    }
    karte.querySelectorAll(".feldzeile textarea").forEach(t => {
      if (String(t.value || "").trim().length > 1) n++;
    });
    karte.querySelectorAll(".tb-feld").forEach(t => {
      if (String(t.value || "").trim().length > 0) n++;
    });
    return n;
  }

  /** Steht irgendwo eine Zahl mit Einheit? */
  function hatErgebnis(karte) {
    let txt = "";
    karte.querySelectorAll(".tk-haupt textarea, .tb-feld").forEach(t => { txt += " " + (t.value || ""); });
    return EINHEIT.test(txt);
  }

  /* ----------------------------------------------------------- Anzeige --- */

  function zeile(karte, it, tf) {
    const soll = summe(tf);
    const rechnet = tf.some(x => x.rechnet);

    const box = el("div", "au-zeile");
    const links = el("span", "au-soll");
    links.textContent = "Verlangt: " + soll + (soll === 1 ? " Antwort" : " Antworten") +
      " — " + beschriftung(tf);
    const rechts = el("span", "au-ist");
    box.append(links, rechts);

    const hinweis = el("div", "au-hinweis");
    box.appendChild(hinweis);

    function auffrischen() {
      const ist = gezaehlt(karte);
      rechts.textContent = ist + " geschrieben";
      box.classList.remove("au-leer", "au-wenig", "au-voll");
      const warn = [];
      if (ist === 0) box.classList.add("au-leer");
      else if (ist < soll) { box.classList.add("au-wenig"); warn.push("Noch " + (soll - ist) + " fehlt"); }
      else box.classList.add("au-voll");
      /* Der Schlusssatz mit Einheit — der Punkt, der am häufigsten liegen
         bleibt, obwohl die Rechnung stimmt. Steht von Anfang an da, damit
         man ihn beim Schreiben schon im Blick hat, nicht erst hinterher. */
      if (rechnet && !hatErgebnis(karte))
        warn.push(ist === 0 ? "Zum Schluss: Zahl mit Einheit"
                            : "Ergebnis mit Zahl und Einheit fehlt");
      /* Grün heißt „fertig“. Steht noch ein Hinweis da, ist es nicht fertig —
         sonst widersprechen sich Rahmen und Text.                        */
      if (warn.length && ist > 0) { box.classList.remove("au-voll"); box.classList.add("au-wenig"); }
      hinweis.textContent = warn.join(" · ");
      hinweis.hidden = !warn.length;
    }

    karte.addEventListener("input", auffrischen);
    auffrischen();
    return box;
  }

  /* --------------------------------------------------------- Nachrüsten --- */

  const V = () => (typeof VIEW !== "undefined" ? VIEW : null);
  const merk = {};        /* k → {tf, soll, rechnet} — für den Wächter */

  function nachruesten() {
    const view = V();
    if (!view || !view.items) return;
    document.querySelectorAll("#bogenMain .tk").forEach(karte => {
      if (karte.dataset.auFertig) return;
      karte.dataset.auFertig = "1";
      const it = view.items.find(x => x.k === karte.dataset.k);
      if (!it) return;

      const tf = teilfragen(it.prompt || "");
      if (!tf.length) return;
      const soll = summe(tf);
      const rechnet = tf.some(x => x.rechnet);
      merk[it.k] = { soll: soll, rechnet: rechnet, tf: tf };

      /* Eine einzelne Antwort ohne Rechnung braucht keine Buchführung —
         die Zeile wäre nur Lärm auf einem kleinen Bildschirm.          */
      if (soll < 2 && !rechnet) return;

      /* Die Zeile gehört VOR alles, was ausgefüllt wird — bei Aufgaben mit
         Teilfeldern oder Tabelle ist das freie Textfeld ganz unten nur der
         Nachschlag, dort stünde der Hinweis zu spät.                     */
      const ziel = karte.querySelector(".felder") ||
                   karte.querySelector(".tb-block") ||
                   karte.querySelector(".tk-haupt > textarea");
      if (!ziel) return;
      ziel.parentNode.insertBefore(zeile(karte, it, tf), ziel);
    });
  }

  /* ------------------------------------------------------------ Wächter --- */

  /**
   * Durchsicht vor der Abgabe: was sieht nach verschenkten Punkten aus?
   * @returns [{k, label, grund}]
   */
  function durchsehen() {
    const view = V();
    if (!view || !view.items) return [];
    const raus = [];
    document.querySelectorAll("#bogenMain .tk").forEach(karte => {
      const k = karte.dataset.k;
      const it = view.items.find(x => x.k === k);
      if (!it) return;
      const ist = gezaehlt(karte);
      const m = merk[k] || {};
      const label = "Teilaufgabe " + (it.fullLabel || it.label);
      if (ist === 0) { raus.push({ k: k, label: label, grund: "keine Antwort", schwer: 1 }); return; }
      if (m.soll > 1 && ist < m.soll)
        raus.push({ k: k, label: label, grund: "nur " + ist + " von " + m.soll + " Antworten", schwer: 2 });
      else if (m.rechnet && !hatErgebnis(karte))
        raus.push({ k: k, label: label, grund: "Ergebnis ohne Zahl und Einheit", schwer: 2 });
      else if ((it.maxPoints || 0) >= 4 && ist === 1) {
        const t = karte.querySelector(".tk-haupt > textarea");
        if (t && String(t.value || "").trim().length < 40 && !karte.querySelector(".tb-feld"))
          raus.push({ k: k, label: label, grund: (it.maxPoints) + " BE, aber nur ein kurzer Satz", schwer: 3 });
      }
    });
    return raus.sort((a, b) => a.schwer - b.schwer);
  }

  function zeigeDurchsicht(danach) {
    const liste = durchsehen();
    const alt = document.getElementById("auPruef");
    if (alt) alt.remove();

    const hg = el("div"); hg.id = "auPruef"; hg.className = "au-hg";
    const kasten = el("div", "au-kasten");
    hg.appendChild(kasten);

    if (!liste.length) {
      kasten.appendChild(el("h3", null, "Nichts offensichtlich liegen gelassen"));
      kasten.appendChild(el("p", "au-text",
        "Jede Aufgabe hat eine Antwort, die Anzahl passt und die Rechenergebnisse " +
        "haben eine Einheit. Inhaltlich sagt das nichts — nur, dass nichts vergessen wurde."));
    } else {
      kasten.appendChild(el("h3", null, liste.length + " Stellen zum Nachsehen"));
      kasten.appendChild(el("p", "au-text",
        "Das sind keine Fehler, sondern die Stellen, an denen in den Übungen die " +
        "meisten Punkte liegen geblieben sind. Tippen springt hin."));
      const ul = el("div", "au-liste");
      liste.forEach(x => {
        const b = el("button", "au-treffer");
        b.append(el("span", "au-treffer-nr", x.label), el("span", "au-treffer-grund", x.grund));
        b.onclick = () => {
          hg.remove();
          const z = document.getElementById("sub-" + (typeof safeId === "function" ? safeId(x.k) : x.k));
          if (z) { z.scrollIntoView({ behavior: "smooth", block: "center" }); z.classList.add("au-blitz");
                   setTimeout(() => z.classList.remove("au-blitz"), 1600); }
        };
        ul.appendChild(b);
      });
      kasten.appendChild(ul);
    }

    const knopfe = el("div", "au-knopfe");
    const zurueck = el("button", "btn ghost", "zurück zum Bogen");
    zurueck.onclick = () => hg.remove();
    knopfe.appendChild(zurueck);
    if (danach) {
      const weiter = el("button", "btn primary", "trotzdem abgeben");
      weiter.onclick = () => { hg.remove(); danach(); };
      knopfe.appendChild(weiter);
    }
    kasten.appendChild(knopfe);
    hg.addEventListener("click", ev => { if (ev.target === hg) hg.remove(); });
    document.body.appendChild(hg);
  }

  /* ----------------------------------------------------------- Einhängen --- */

  function einhaengen() {
    const altBogen = window.zeigeBogen;
    if (typeof altBogen === "function" && !altBogen.__au) {
      const neu = function () {
        const r = altBogen.apply(this, arguments);
        try { setTimeout(nachruesten, 20); } catch (e) { console.error("Auftrag:", e); }
        return r;
      };
      neu.__au = true;
      window.zeigeBogen = neu;
    }

    /* Der Knopf „Abgeben & auswerten“ bekommt die Durchsicht davor. Er
       behält seine eigene Behandlung — sie wird nur verzögert.          */
    const btn = document.getElementById("btnAbgeben");
    if (btn && !btn.dataset.au) {
      btn.dataset.au = "1";
      btn.addEventListener("click", ev => {
        if (btn.dataset.auDurch === "1") { btn.dataset.auDurch = ""; return; }
        const liste = durchsehen();
        if (!liste.length) return;               /* nichts zu melden: durchlassen */
        ev.preventDefault();
        ev.stopImmediatePropagation();
        zeigeDurchsicht(() => { btn.dataset.auDurch = "1"; btn.click(); });
      }, true);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { teilfragen, summe, durchsehen, zeigeDurchsicht, nachruesten, gezaehlt };
})();
