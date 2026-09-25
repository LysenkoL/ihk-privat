/* ============================================================================
   gen/pruefen.js — „Prüfen lassen“: Textantworten wie ein Prüfer ansehen
   ----------------------------------------------------------------------------
   Die meisten Punkte stecken in Textantworten, und die bewertet man sich
   selbst zu gut oder zu schlecht. Zwei Stufen:

   1. Kurzcheck, sofort und ohne Netz:
      - Welcher Operator steht in der Aufgabe (Nennen, Erläutern, Beurteilen,
        Vergleichen, Berechnen …) und was verlangt er?
      - Wie viele Punkte will die Aufgabe („Nennen Sie drei …“) — wie viele
        stehen in der Antwort?
      - Bei Erläutern/Begründen: steht eine Begründung da (weil, dadurch …)?
      - Welche Stichworte der Musterlösung sind getroffen, welche fehlen?
   2. Mit Claude prüfen: ein fertiger Text mit Aufgabe, Musterlösung,
      Bewertungshinweis und eigener Antwort wird kopiert. Zurück kommen
      Punkte wie beim Prüfer, was fehlt, und die eigene Antwort in kurzen,
      einfachen deutschen Sätzen — Fachbegriffe mit russischer Übersetzung.

      Wohin der Text geht, stellt man ein (je Gerät, `ihk2:pruefen:ui`):
      - „Chat dieser Prüfung“: EIN Claude-Chat je Prüfung. Beim ersten Mal
        öffnet sich ein neuer Chat; dessen Link einmal einfügen — ab dann
        öffnet jede weitere Aufgabe dieser Prüfung genau diesen Chat, immer
        im selben Browser-Tab, und der Text ist kürzer („nächste Aufgabe“).
        Die Links wandern mit dem Abgleich (`ihk2:pruefen:chats`).
      - „Neuer Chat“: wie bisher, jede Aufgabe ein neuer Chat.
      - „Nur kopieren“: nur in die Zwischenablage, kein Fenster (Handy).
      Direkt in einen bestehenden Chat schreiben kann eine Webseite nicht —
      einfügen (Strg+V) und senden bleibt ein Handgriff.

   Eingebaut in: IHK-Bögen (unter der Musterlösung), Azubi-Navigator (nach
   „Lösung zeigen“), Fehler wiederholen (nach dem Aufdecken).
   ========================================================================== */
"use strict";

(function (root) {
  const hatDom = typeof document !== "undefined";
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  /* ======================================================================
     Analyse — reine Funktionen (tests/pruefen.test.js)
     ====================================================================== */
  const norm = s => String(s || "").toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");

  /* Operatoren wie im IHK-Operatorenkatalog — was sie verlangen, in einfachen Worten */
  const OPERATOREN = [
    { key: "berechnen", rx: /\b(berechnen|ermitteln|errechnen|bestimmen)\b/i, name: "Berechnen / Ermitteln",
      will: "Rechenweg Schritt für Schritt, Ergebnis mit Einheit." },
    { key: "vergleichen", rx: /\b(vergleichen|unterscheiden|abgrenzen|gegenueberstellen|gegenüberstellen)\b/i, name: "Vergleichen / Unterscheiden",
      will: "Beide Seiten nennen und den Unterschied ausdrücklich sagen (während …, im Gegensatz zu …)." },
    { key: "beurteilen", rx: /\b(beurteilen|bewerten|stellung nehmen|entscheiden|empfehlen)\b/i, name: "Beurteilen / Bewerten",
      will: "Kriterien nennen, abwägen und am Ende ein klares Urteil oder eine Empfehlung." },
    { key: "begruenden", rx: /\b(begruenden|begründen)\b/i, name: "Begründen",
      will: "Aussage plus Grund: „…, weil …“ oder „…, da …“." },
    { key: "erlaeutern", rx: /\b(erlaeutern|erläutern|erklaeren|erklären)\b/i, name: "Erläutern / Erklären",
      will: "Aussage plus Begründung oder Beispiel, in ganzen Sätzen." },
    { key: "beschreiben", rx: /\b(beschreiben|darstellen|schildern)\b/i, name: "Beschreiben / Darstellen",
      will: "Sachverhalt in ganzen Sätzen, der Reihe nach, ohne Wertung." },
    { key: "nennen", rx: /\b(nennen|angeben|aufzaehlen|aufzählen|benennen)\b|\bgeben sie\b[^.?!]*\ban\b/i, name: "Nennen / Angeben",
      will: "Kurze Stichpunkte reichen — aber genau so viele, wie verlangt." }
  ];
  const ZAHLWORT = { zwei: 2, drei: 3, vier: 4, "fünf": 5, fuenf: 5, sechs: 6, sieben: 7, acht: 8, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6 };

  /** Operator der Aufgabe — der letzte Satz mit Operator zählt (dort steht der Auftrag) */
  function operatorVon(frage) {
    const saetze = String(frage || "").replace(/([.?!:])\s+/g, "$1\n").split(/\n+/).filter(Boolean);
    for (let i = saetze.length - 1; i >= 0; i--) {
      for (const o of OPERATOREN) if (o.rx.test(saetze[i])) return Object.assign({ satz: saetze[i] }, o);
    }
    return null;
  }

  /** „Nennen Sie drei Vorteile …“ → 3 */
  function anzahlVon(satz) {
    const m = String(satz || "").match(/\b(zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|[2-6])\b(?!\s*(%|€|euro|stunden|tage|jahre|minuten|mbit|gb|gib|tb|mb|prozent|x\b))/i);
    return m ? ZAHLWORT[m[1].toLowerCase()] || null : null;
  }

  /** Wie viele Punkte stehen in der Antwort? Zeilen, Aufzählungen, sonst Sätze */
  function punkteIn(antwort) {
    const t = String(antwort || "").trim();
    if (!t) return 0;
    let teile = t.split(/\n+|;|•|·|(?:^|\s)-\s|\s\d[.)]\s/).map(s => s.trim()).filter(s => s.split(/\s+/).length >= 1 && s.length > 2);
    if (teile.length <= 1) teile = t.replace(/([.!?])\s+/g, "$1\n").split("\n").filter(s => s.trim().length > 3);
    return teile.length;
  }

  const STOPP = new Set(["werden", "wurden", "dieser", "diese", "dieses", "einer", "eines", "einem", "einen", "sowie", "damit",
    "dadurch", "sollte", "sollten", "koennen", "können", "muessen", "müssen", "zwischen", "werden", "haben", "hatte", "keine",
    "kein", "mehrere", "anderen", "andere", "weitere", "weiteren", "beispiel", "beispielsweise", "loesung", "lösung", "punkte",
    "punkt", "richtig", "moeglich", "möglich", "beiden", "jeweils", "ihnen", "unternehmen", "antwort", "aufgabe", "insbesondere",
    "bereits", "jedoch", "deshalb", "ausserdem", "außerdem", "wobei", "welche", "welcher", "welches", "hierbei", "gegebenenfalls"]);

  /** Stichworte aus der Musterlösung: Nomen und Fachwörter, längste zuerst */
  function stichworte(loesung, max) {
    const roh = String(loesung || "").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ");
    const seen = new Set(), out = [];
    (roh.match(/[A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]{4,}|[A-Za-z]{2,}-[A-Za-zÄÖÜäöüß-]{2,}|\b[A-Z]{2,6}\b/g) || []).forEach(w => {
      const n = norm(w).replace(/-+$/, "");
      if (n.length < 3 || STOPP.has(n) || seen.has(n)) return;
      seen.add(n); out.push(w.replace(/-+$/, ""));
    });
    return out.sort((a, b) => b.length - a.length).slice(0, max || 10);
  }

  function enthalten(antwortNorm, wort) {
    const n = norm(wort);
    const kern = n.length > 7 ? n.slice(0, n.length - 2) : n;
    return antwortNorm.indexOf(kern) >= 0;
  }

  /**
   * Kurzcheck. `mitLoesung` = false: keine Stichworte verraten (vor dem Aufdecken).
   * Rückgabe: { operator, verlangt, genannt, hinweise:[{art, text}], getroffen, fehlt }
   */
  function analyse(o) {
    const frage = String(o.frage || ""), antwort = String(o.antwort || "");
    const op = operatorVon(frage);
    const verlangt = op ? anzahlVon(op.satz) : anzahlVon(frage);
    const genannt = punkteIn(antwort);
    const an = norm(antwort);
    const worte = antwort.trim() ? antwort.trim().split(/\s+/).length : 0;
    const h = [];
    if (!antwort.trim()) {
      h.push({ art: "warn", text: "Noch keine Antwort — erst schreiben, dann prüfen." });
    } else {
      if (op) h.push({ art: "info", text: "Operator „" + op.name + "“: " + op.will });
      if (verlangt) {
        if (genannt >= verlangt) h.push({ art: "ok", text: genannt + " Punkte genannt — verlangt sind " + verlangt + "." });
        else h.push({ art: "warn", text: "Verlangt sind " + verlangt + ", erkennbar sind nur " + genannt + ". Jeden Punkt in eine eigene Zeile schreiben." });
      }
      if (op && (op.key === "erlaeutern" || op.key === "begruenden" || op.key === "beurteilen")) {
        const grund = /\b(weil|da|denn|dadurch|deshalb|daher|sodass|so dass|damit|somit|folglich|zum beispiel|z\.\s?b\.|beispielsweise)\b/i.test(antwort);
        h.push(grund ? { art: "ok", text: "Begründung erkennbar (weil/dadurch/z. B.)." }
                     : { art: "warn", text: "Keine Begründung erkennbar. Schreib zu jedem Punkt „…, weil …“ oder „…, dadurch …“ — sonst gibt es meist nur halbe Punkte." });
        if (op.key === "beurteilen" && !/\b(empfehl|fazit|daher|deshalb|somit|insgesamt|entscheid|besser|geeignet)/i.test(antwort))
          h.push({ art: "warn", text: "Beim Beurteilen fehlt ein klares Urteil am Ende („Daher empfehle ich …“)." });
      }
      if (op && op.key === "vergleichen" && !/\b(waehrend|während|im gegensatz|hingegen|wohingegen|dagegen|unterschied|beide|gemeinsam|jedoch)\b/i.test(antwort))
        h.push({ art: "warn", text: "Beim Vergleichen den Unterschied ausdrücklich sagen: „A …, während B …“." });
      if (op && op.key === "berechnen") {
        if (!/\d/.test(antwort)) h.push({ art: "warn", text: "Keine Zahl in der Antwort — Ergebnis fehlt." });
        else if (!/[=×x*\/+−-]\s*\d|\d\s*[=×*\/+−-]/.test(antwort)) h.push({ art: "warn", text: "Rechenweg fehlt — er bringt Teilpunkte, auch wenn das Ergebnis falsch ist." });
        if (/\d/.test(antwort) && !/(€|euro|%|[kmgt]i?b\b|byte|bit|stunden?|std|min|tage?|jahre?|stück|seiten|watt|kwh|mbit|gbit|ms|s\b)/i.test(antwort))
          h.push({ art: "warn", text: "Einheit fehlt beim Ergebnis." });
      }
      if (op && (op.key === "erlaeutern" || op.key === "beschreiben" || op.key === "beurteilen") && worte < 12)
        h.push({ art: "warn", text: "Sehr kurz (" + worte + " Wörter) für „" + op.name.split(" ")[0] + "“ — ganze Sätze schreiben." });
    }
    let getroffen = [], fehlt = [];
    if (o.mitLoesung !== false && o.loesung && antwort.trim()) {
      const sw = stichworte(o.loesung, 12);
      getroffen = sw.filter(w => enthalten(an, w));
      fehlt = sw.filter(w => !enthalten(an, w)).slice(0, 6);
    }
    return { operator: op, verlangt, genannt, hinweise: h, getroffen, fehlt };
  }

  /**
   * Der Text für Claude.
   * o.gruppe: Name der Prüfung — dann kündigt der erste Text weitere Aufgaben an.
   * o.folge: true = weitere Aufgabe im selben Chat → kurzer Kopf, gleiche Form.
   */
  function prompt(o) {
    const op = operatorVon(o.frage);
    const teil = o.pruefung || "Abschlussprüfung Teil 1 (AP1)";
    const aufgabe = ["AUFGABE (" + (o.punkte || "?") + " Punkte" + (op ? ", Operator: " + op.name : "") + "):",
      String(o.frage || "").trim(), ""];
    if (o.folge) {
      const z = ["Nächste Aufgabe" + (o.gruppe ? " aus „" + o.gruppe + "“" : "") + ". Bewerte sie wieder so streng wie in der echten Prüfung " +
                 "und antworte in derselben Form wie vorher (Punkte, was fehlt, verbesserte Antwort in einfachen Sätzen " +
                 "mit russischer Übersetzung der Fachbegriffe, ein Satz auf Russisch).", ""].concat(aufgabe);
      if (o.loesung) z.push("MUSTERLÖSUNG:", String(o.loesung).trim(), "");
      if (o.hinweis) z.push("BEWERTUNGSHINWEIS:", String(o.hinweis).trim(), "");
      z.push("MEINE ANTWORT:", String(o.antwort || "").trim() || "(leer)");
      return z.join("\n");
    }
    const zeilen = [
      "Du bist Prüfer der IHK-" + teil + " für Fachinformatiker Anwendungsentwicklung.",
      "Bewerte meine Antwort genau so streng wie in der echten Prüfung."
    ].concat(o.gruppe ? ["Ich schicke dir in diesem Chat nacheinander mehrere Aufgaben aus „" + o.gruppe + "“ — bewerte jede einzeln in der Form unten."] : [])
     .concat([""], aufgabe);
    if (o.loesung) zeilen.push("MUSTERLÖSUNG:", String(o.loesung).trim(), "");
    if (o.hinweis) zeilen.push("BEWERTUNGSHINWEIS:", String(o.hinweis).trim(), "");
    zeilen.push("MEINE ANTWORT:", String(o.antwort || "").trim() || "(leer)", "",
      "Antworte in dieser Form:",
      "1. Punkte: x von " + (o.punkte || "?") + " — mit einem Satz Begründung.",
      "2. Was fehlt oder falsch ist — kurze Stichpunkte.",
      "3. Verbesserte Antwort: meine Antwort so umgeschrieben, dass sie volle Punkte bekommt — in kurzen, einfachen deutschen Sätzen (Niveau B1). Fachbegriffe bleiben deutsch, dahinter in Klammern die russische Übersetzung.",
      "4. Ein Satz auf Russisch: мой главный недочёт и как его избежать.");
    return zeilen.join("\n");
  }

  /* ======================================================================
     Wohin mit dem Text? Einstellung und Chat je Prüfung
     ====================================================================== */
  const SK_UI = "ihk2:pruefen:ui";          /* nur dieses Gerät (Abgleich lässt :ui aus) */
  const SK_CHATS = "ihk2:pruefen:chats";    /* {gruppenId: {url, name, t}} — wandert mit */
  const MODI = [["pruefung", "Chat dieser Prüfung"], ["neu", "Neuer Chat"], ["kopieren", "Nur kopieren"]];
  const lies = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
  const handy = () => { try { return !!(root.matchMedia && root.matchMedia("(pointer: coarse)").matches); } catch (e) { return false; } };

  /** Gespeicherter Modus, sonst: Handy „Nur kopieren“, Computer „Chat dieser Prüfung“ */
  function modus() {
    const u = lies(SK_UI, {}) || {};
    return MODI.some(m => m[0] === u.modus) ? u.modus : (handy() ? "kopieren" : "pruefung");
  }
  function setzeModus(m) {
    if (!MODI.some(x => x[0] === m)) return;
    const u = lies(SK_UI, {}) || {}; u.modus = m; schreib(SK_UI, u);
  }

  /** Nur echte Claude-Chat-Links: https://claude.ai/chat/<id> (auch aus Projekten) */
  function pruefeLink(s) {
    const m = String(s || "").trim().match(/^https:\/\/claude\.ai\/(chat|project)\/[A-Za-z0-9-]{8,}/);
    return m ? m[0] : null;
  }
  function chatVon(id) { const c = lies(SK_CHATS, {}) || {}; return (c[id] && c[id].url) || ""; }
  function setzeChat(id, url, name) {
    const c = lies(SK_CHATS, {}) || {};
    if (url) c[id] = { url, name: name || id, t: Date.now() }; else delete c[id];
    schreib(SK_CHATS, c);
  }

  /** Immer derselbe Tab: so entsteht nicht für jede Aufgabe ein neues Fenster */
  function oeffneTab(url) {
    try { const w = root.open(url, "ihk-claude"); if (w) { try { w.opener = null; } catch (e) { } } } catch (e) { }
  }

  /* ======================================================================
     Oberfläche
     ====================================================================== */
  const text = h => {
    if (!h) return "";
    if (!hatDom) return String(h).replace(/<[^>]+>/g, " ");
    const t = document.createElement("template");
    t.innerHTML = String(h).replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|tr|h\d)>/gi, "\n");
    return (t.content.textContent || "").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
  };

  function kopieren(t, feld) {
    const alt = () => {
      try { feld.hidden = false; feld.focus(); feld.select(); return document.execCommand("copy"); } catch (e) { return false; }
    };
    if (navigator.clipboard && root.isSecureContext) return navigator.clipboard.writeText(t).then(() => true, alt);
    return Promise.resolve(alt());
  }

  /** Der Teil „Mit Claude prüfen“: Modus-Wahl, Knopf, Chat-Link der Prüfung */
  function claudeTeil(o, gruppe) {
    const teil = el("div", "pf-claude-teil");
    const zeichne = () => {
      teil.innerHTML = "";
      const m = modus(), link = chatVon(gruppe.id);
      const folge = m === "pruefung" && !!link;
      /* Text bei jedem Klick neu bauen — so zählt, was gerade im Antwortfeld steht */
      const baue = () => prompt({ frage: o.frage, loesung: o.loesung, hinweis: o.hinweis, punkte: o.punkte, antwort: o.antwort(),
                                  pruefung: o.pruefung, gruppe: m === "pruefung" ? gruppe.name : null, folge });
      const feld = el("textarea", "pf-prompt");
      feld.readOnly = true; feld.value = baue(); feld.hidden = true; feld.rows = 8;

      const cl = el("div", "pf-claude");
      const b1 = el("button", "btn primary klein", m === "kopieren" ? "Für Claude kopieren" : folge ? "In den Prüfungs-Chat" : "Mit Claude prüfen");
      b1.type = "button";
      b1.title = m === "kopieren" ? "Nur kopieren — in einen Claude-Chat deiner Wahl einfügen." :
                 folge ? "Kopiert und öffnet den Chat dieser Prüfung im selben Tab — dort einfügen und senden." :
                 "Kopiert Aufgabe, Musterlösung und deine Antwort und öffnet Claude — dort einfügen und senden.";
      b1.onclick = () => {
        feld.value = baue();
        kopieren(feld.value, feld).then(ok => {
          b1.textContent = ok ? "Kopiert ✓ — einfügen (Strg+V) und senden" : "Text unten markieren und kopieren";
          if (!ok) feld.hidden = false;
          if (m === "neu") { try { root.open("https://claude.ai/new", "_blank", "noopener"); } catch (e) { } }
          else if (m === "pruefung") {
            oeffneTab(link || "https://claude.ai/new");
            if (!link) { const i = teil.querySelector(".pf-link-feld"); if (i) { i.hidden = false; teil.querySelector(".pf-link").classList.add("offen"); } }
          }
        });
      };
      const b2 = el("button", "btn ghost klein", "Text anzeigen");
      b2.type = "button";
      b2.onclick = () => { feld.value = baue(); feld.hidden = !feld.hidden; b2.textContent = feld.hidden ? "Text anzeigen" : "Text ausblenden"; };
      cl.append(b1, b2);
      teil.appendChild(cl);

      /* Modus: drei kleine Schalter */
      const wahl = el("div", "pf-modi");
      wahl.setAttribute("role", "radiogroup");
      wahl.appendChild(el("span", "pf-modi-t", "Senden:"));
      MODI.forEach(([k, name]) => {
        const c = el("button", "pf-modus" + (k === m ? " an" : ""), name);
        c.type = "button";
        c.setAttribute("role", "radio"); c.setAttribute("aria-checked", k === m ? "true" : "false");
        c.onclick = () => { setzeModus(k); zeichne(); };
        wahl.appendChild(c);
      });
      teil.appendChild(wahl);

      if (m === "pruefung") {
        const z = el("div", "pf-link" + (link ? " da" : ""));
        if (link) {
          z.appendChild(el("span", null, "Chat für „" + gruppe.name + "“ ist verknüpft — jede Aufgabe geht dorthin."));
          const aend = el("button", "pf-mini", "Link ändern"); aend.type = "button";
          const los = el("button", "pf-mini", "Neuen Chat beginnen"); los.type = "button";
          los.title = "Verknüpfung lösen — die nächste Aufgabe öffnet wieder einen neuen Chat.";
          los.onclick = () => { setzeChat(gruppe.id, ""); zeichne(); };
          z.append(aend, los);
          const f = linkFeld(gruppe, zeichne); f.hidden = true;
          aend.onclick = () => { f.hidden = !f.hidden; };
          z.appendChild(f);
        } else {
          z.appendChild(el("span", null, "Noch kein Chat für „" + gruppe.name + "“. Beim ersten Mal öffnet sich ein neuer Chat. " +
            "Nach dem Senden den Link aus der Adresszeile kopieren und hier einfügen — ab dann landen alle Aufgaben dieser Prüfung in diesem einen Chat."));
          const f = linkFeld(gruppe, zeichne);
          z.appendChild(f);
        }
        teil.appendChild(z);
      } else {
        teil.appendChild(el("p", "pf-klein", m === "kopieren"
          ? "Nur in die Zwischenablage — kein neues Fenster. Einfügen, wo du willst."
          : "Jede Aufgabe öffnet einen neuen Chat."));
      }
      teil.appendChild(el("p", "pf-klein", "Claude bekommt: Aufgabe, Musterlösung, Bewertungshinweis und deine Antwort — zurück kommen Punkte wie beim Prüfer und deine Antwort in einfachen Sätzen."));
      teil.appendChild(feld);
    };
    zeichne();
    return teil;
  }

  /** Eingabe für den Chat-Link: einfügen oder aus der Zwischenablage holen */
  function linkFeld(gruppe, fertig) {
    const f = el("div", "pf-link-feld");
    const inp = el("input", "pf-link-inp");
    inp.type = "url"; inp.placeholder = "https://claude.ai/chat/…"; inp.autocomplete = "off";
    const meld = el("span", "pf-link-meld");
    const speichern = wert => {
      const url = pruefeLink(wert);
      if (!url) { meld.textContent = "Das ist kein Claude-Chat-Link (https://claude.ai/chat/…)."; return false; }
      setzeChat(gruppe.id, url, gruppe.name);
      fertig();
      return true;
    };
    const ok = el("button", "pf-mini", "Speichern"); ok.type = "button";
    ok.onclick = () => speichern(inp.value);
    inp.addEventListener("keydown", ev => { if (ev.key === "Enter") speichern(inp.value); });
    f.append(inp, ok);
    if (navigator.clipboard && navigator.clipboard.readText && root.isSecureContext) {
      const zw = el("button", "pf-mini", "Aus Zwischenablage"); zw.type = "button";
      zw.onclick = () => navigator.clipboard.readText().then(t => { inp.value = t; speichern(t); },
        () => { meld.textContent = "Zwischenablage gesperrt — Link bitte ins Feld einfügen."; });
      f.appendChild(zw);
    }
    f.appendChild(meld);
    return f;
  }

  /**
   * Das Kästchen. opt: { frage, loesung, hinweis, punkte, antwort (String oder Funktion), mitLoesung, pruefung,
   *                      gruppe: {id, name} — zu welcher Prüfung die Aufgabe gehört (ein Claude-Chat je Gruppe) }
   * Liest die Antwort bei jedem Klick neu — so zählt, was gerade im Feld steht.
   */
  function kasten(opt) {
    const gruppe = opt.gruppe && opt.gruppe.id ? opt.gruppe : { id: "allgemein", name: "Allgemeine Fragen" };
    const box = el("div", "pf-box");
    const knopf = el("button", "pf-los", "Prüfen lassen");
    knopf.type = "button";
    const inhalt = el("div", "pf-inhalt");
    inhalt.hidden = true;
    const antwort = () => (typeof opt.antwort === "function" ? opt.antwort() : opt.antwort) || "";
    const zeichnen = () => {
      inhalt.innerHTML = "";
      const frage = text(opt.frage), loesung = text(opt.loesung), hinweis = text(opt.hinweis);
      const a = analyse({ frage, antwort: antwort(), loesung, mitLoesung: opt.mitLoesung });
      const kopf = el("div", "pf-kopf");
      kopf.appendChild(el("b", null, "Kurzcheck"));
      if (a.operator) kopf.appendChild(el("span", "pf-op", a.operator.name));
      inhalt.appendChild(kopf);
      const ul = el("ul", "pf-liste");
      a.hinweise.forEach(x => ul.appendChild(el("li", "pf-" + x.art, x.text)));
      if (a.getroffen.length || a.fehlt.length) {
        const li = el("li", "pf-info pf-sw");
        li.appendChild(el("span", null, "Stichworte der Musterlösung: "));
        a.getroffen.forEach(w => li.appendChild(el("span", "pf-w ok", w)));
        a.fehlt.forEach(w => li.appendChild(el("span", "pf-w fehlt", w)));
        ul.appendChild(li);
      }
      inhalt.appendChild(ul);
      if (opt.mitLoesung === false) inhalt.appendChild(el("p", "pf-klein", "Stichworte der Musterlösung zeigt der Check erst nach „Lösung zeigen“."));

      inhalt.appendChild(claudeTeil({ frage, loesung, hinweis, punkte: opt.punkte, pruefung: opt.pruefung, antwort }, gruppe));
    };
    knopf.onclick = () => {
      const auf = inhalt.hidden;
      if (auf) zeichnen();
      inhalt.hidden = !auf;
      knopf.textContent = auf ? "Prüfen lassen ▴" : "Prüfen lassen";
    };
    box.append(knopf, inhalt);
    return box;
  }

  /* --------------------------------------- IHK-Bogen: an jede Karte hängen */
  function gruppeIhk(it) {
    const ex = it && it.exam, m = (ex && ex.meta) || {};
    return ex ? { id: "ihk:" + ex.examId, name: "IHK " + (m.season || "") + " " + (m.year || "") } : null;
  }
  function karteUmhuellen() {
    const alt = root.karte;
    if (typeof alt !== "function" || alt.__pf) return;
    const neu = function (it) {
      const card = alt.apply(this, arguments);
      try {
        if (it && it.answerType !== "diagram" && it.solution && it.solution.text && it.maxPoints) {
          const main = card.querySelector(".tk-haupt") || card;
          const k = kasten({
            frage: [it.groupIntro, it.prompt].filter(Boolean).join("\n"),
            loesung: it.solution.text, punkte: it.maxPoints,
            gruppe: gruppeIhk(it),
            antwort: () => {
              if (typeof ANSWERS === "undefined") return "";
              const teile = [ANSWERS[it.k] || ""];
              for (let i = 0; i < 12; i++) if (ANSWERS[it.k + "#" + i]) teile.push(ANSWERS[it.k + "#" + i]);
              return teile.filter(Boolean).join("\n");
            }
          });
          k.classList.add("pf-ihk");
          const det = main.querySelector("details.loesung");
          if (det && det.nextSibling) main.insertBefore(k, det.nextSibling); else main.appendChild(k);
        }
      } catch (e) { console.error("Prüfen lassen:", e); }
      return card;
    };
    neu.__pf = true;
    root.karte = neu;
  }

  function einhaengen() { karteUmhuellen(); }

  const api = { operatorVon, anzahlVon, punkteIn, stichworte, analyse, prompt, kasten, OPERATOREN,
                pruefeLink, modus, setzeModus, chatVon, setzeChat, gruppeIhk, MODI };
  root.GENPRUEFEN = api;
  if (typeof module === "object" && module.exports) module.exports = api;
  if (hatDom) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
    else einhaengen();
  }
})(typeof window !== "undefined" ? window : globalThis);
