/* ============================================================================
   gen/papier.js — Fehler von Papier in die App holen
   ----------------------------------------------------------------------------
   Vieles entsteht auf Papier: gedruckte Prognose-Prüfungen, alte IHK-Bögen,
   Notizen. Die Fehler darin kennt die App nicht — also fehlen sie genau dort,
   wo in den letzten Tagen gearbeitet wird: in „Fehler durchgehen“ und auf
   dem Merkblatt.

   Der Weg:
     1. „Anleitung für Claude kopieren“ — ein fester Auftrag mit Format
     2. in Claude (Handy-App): Fotos der Blätter + Anleitung schicken
     3. Claudes Antwort kopieren (oder als .md speichern) → hier einfügen
     4. „Einlesen“ zeigt, was erkannt wurde → „Übernehmen“

   Format (je Fehler ein Block, Schlüssel am Zeilenanfang, Reihenfolge egal):

     ## FEHLER
     Quelle: Prognose 1 · 2 c)
     Ref: p1-2c
     Thema: Subnetting
     Punkte: 2 / 4
     Aufgabe: …
     Meine Antwort: …
     Richtig: …
     Fehlt: …; …
     Falsch: …; …
     Warum: …
     Merksatz: …
     Vokabeln: Broadcastadresse = широковещательный адрес; …

   Der Leser ist nachsichtig: **fett**, Aufzählungszeichen, Codeblöcke,
   mehrzeilige Werte und ein JSON-Array werden verstanden.

   Speicher: ihk2:papier — { id: Eintrag } (flach, damit der Abgleich
   zwischen Handy und PC je Eintrag zusammenführt). Gelöscht = weg: true.
   ========================================================================== */
"use strict";

(function (root) {
  const hatDom = typeof document !== "undefined" && typeof document.createElement === "function";
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const SK = "ihk2:papier";
  const lies = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };

  /* ------------------------------------------------------------ Format --- */
  const FELDER = [
    ["quelle", /^(quelle|prüfung|pruefung|blatt|herkunft|aufgabennummer|nr)$/],
    ["ref", /^(ref|id|kennung|teilaufgabe)$/],
    ["thema", /^(thema|themen|gebiet|themengebiet)$/],
    ["punkte", /^(punkte|be|bewertung|punktzahl)$/],
    ["aufgabe", /^(aufgabe|frage|aufgabenstellung)$/],
    ["meine", /^(meine antwort|meine lösung|meine loesung|du|deine antwort|antwort|geschrieben)$/],
    ["richtig", /^(richtig|richtige antwort|lösung|loesung|musterlösung|musterloesung|korrekt|so ist es richtig)$/],
    ["fehlt", /^(fehlt|es fehlt|ergänzen|ergaenzen|fehlend)$/],
    ["falsch", /^(falsch|weg damit|zu viel|streichen|fehlerhaft)$/],
    ["warum", /^(warum|grund|fehlergrund|fehlerart|ursache)$/],
    ["merksatz", /^(merksatz|merke|tipp|regel|merken)$/],
    ["vokabeln", /^(vokabeln|begriffe|wörter|woerter|fachbegriffe|übersetzung|uebersetzung)$/]
  ];
  const feldVon = k => {
    const n = String(k || "").toLowerCase().replace(/[*_`]/g, "").replace(/\s+/g, " ").trim();
    const f = FELDER.find(x => x[1].test(n));
    return f ? f[0] : null;
  };

  function hash(s) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  const LEER = /^(-|–|—|keine?s?|nichts|n\/a|entfällt)$/i;
  const liste = v => String(v || "").split(/\s*(?:;|\n|•|·)\s*/).map(x => x.replace(/^[-*]\s*/, "").trim()).filter(x => x && !LEER.test(x));

  function punkte(v) {
    const m = /(\d+(?:[.,]\d+)?)\s*(?:\/|von|of)\s*(\d+(?:[.,]\d+)?)/i.exec(String(v || ""));
    if (!m) return { erreicht: null, max: null };
    const z = x => Number(x.replace(",", "."));
    return { erreicht: z(m[1]), max: z(m[2]) };
  }

  function vokabeln(v) {
    return liste(v).map(x => {
      const m = /^(.+?)\s*(?:=|—|–|:|->|→)\s*(.+)$/.exec(x);
      return m ? { de: m[1].trim(), ru: m[2].trim() } : { de: x, ru: "" };
    }).filter(x => x.de);
  }

  /** Fehlergrund wie im Fehlerjournal (gen/fehlerjournal.js) */
  function grundVon(t) {
    const s = String(t || "").toLowerCase();
    if (!s) return null;
    if (/einheit|rund/.test(s)) return "einheit";
    if (/rechenweg|zwischenschritt|nebenrechnung|rechnung fehlt/.test(s)) return "rechenweg";
    if (/gelesen|übersehen|ueberlesen|überlesen|falsch verstanden|nicht beachtet|vergessen, dass/.test(s)) return "gelesen";
    if (/zeit/.test(s)) return "zeit";
    if (/begründ|begruend|zu knapp|stichwort|ganzen? satz|operator|erläuter|erlaeuter|unvollständig|unvollstaendig/.test(s)) return "formuliert";
    if (/nicht gewusst|wissen|unbekannt|verwechselt|falsches? konzept|nicht verstanden/.test(s)) return "gewusst";
    return null;
  }

  /** Ein Eintrag aus losen Feldern */
  function eintrag(r) {
    const g = x => String(x == null ? "" : x).trim();
    const e = {
      quelle: g(r.quelle), ref: g(r.ref), thema: g(r.thema),
      aufgabe: g(r.aufgabe), meine: g(r.meine), richtig: g(r.richtig),
      fehlt: Array.isArray(r.fehlt) ? r.fehlt.map(g).filter(Boolean) : liste(r.fehlt),
      falsch: Array.isArray(r.falsch) ? r.falsch.map(g).filter(Boolean) : liste(r.falsch),
      warum: g(r.warum), merksatz: g(r.merksatz),
      vokabeln: Array.isArray(r.vokabeln) ? r.vokabeln.filter(x => x && x.de) : vokabeln(r.vokabeln)
    };
    const p = r.erreicht != null || r.max != null ? { erreicht: r.erreicht, max: r.max } : punkte(r.punkte);
    e.erreicht = p.erreicht; e.max = p.max;
    if (/^[-–—]$/.test(e.ref) || /^(keine?|—)$/i.test(e.ref)) e.ref = "";
    e.grund = grundVon(e.warum);
    e.id = "pa" + hash([e.quelle, e.aufgabe, e.meine].join("|").toLowerCase());
    return e;
  }

  /**
   * Text von Claude → { eintraege, hinweise }. Reine Funktion (tests/papier.test.js).
   */
  function lesen(text) {
    const hinweise = [];
    let t = String(text || "").replace(/\r\n?/g, "\n").trim();
    if (!t) return { eintraege: [], hinweise: ["Da steht nichts."] };

    /* JSON geht auch */
    const js = t.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "").trim();
    if (/^[\[{]/.test(js)) {
      try {
        let d = JSON.parse(js);
        if (!Array.isArray(d)) d = d.fehler || d.eintraege || [d];
        const umbenannt = d.map(o => {
          const r = {};
          Object.keys(o || {}).forEach(k => { const f = feldVon(k) || (["erreicht", "max"].indexOf(k) >= 0 ? k : null); if (f) r[f] = o[k]; });
          return r;
        });
        const ein = umbenannt.map(eintrag).filter(e => e.aufgabe || e.richtig);
        return { eintraege: ein, hinweise: ein.length ? [] : ["Im JSON steht kein Fehler mit „Aufgabe“ oder „Richtig“."] };
      } catch (e) { /* dann eben als Text */ }
    }

    /* Codeblock-Zäune weg, Zeilen säubern */
    const zeilen = t.split("\n").filter(z => !/^\s*```/.test(z));
    const bloecke = [];
    let akt = null, feld = null;
    const kopf = /^\s*(?:#{1,6}\s*)?(?:\*\*)?\s*fehler\b\s*(?:nr\.?\s*)?\d*\s*[:.)-]?\s*(?:\*\*)?\s*$/i;
    const hatKopf = zeilen.some(z => kopf.test(z));
    if (!hatKopf) akt = {}, bloecke.push(akt);
    zeilen.forEach(roh => {
      if (kopf.test(roh)) { akt = {}; bloecke.push(akt); feld = null; return; }
      if (!akt) return;
      const z = roh.replace(/^\s*(?:[-*+>]|\d+\.)\s+/, "").replace(/\*\*/g, "").replace(/__/g, "");
      const m = /^\s*([A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß .]{0,28}?)\s*:\s*(.*)$/.exec(z);
      const f = m ? feldVon(m[1]) : null;
      if (f) { feld = f; akt[f] = (akt[f] ? akt[f] + "\n" : "") + m[2].trim(); return; }
      if (/^\s*(---+|===+)\s*$/.test(roh)) { feld = null; return; }
      if (feld && z.trim()) akt[feld] = (akt[feld] ? akt[feld] + "\n" : "") + z.trim();
    });
    const ein = [];
    bloecke.forEach((b, i) => {
      if (!Object.keys(b).length) return;
      const e = eintrag(b);
      if (!e.aufgabe && !e.richtig) { hinweise.push("Block " + (i + 1) + " hat weder „Aufgabe:“ noch „Richtig:“ — übersprungen."); return; }
      ein.push(e);
    });
    if (!ein.length && !hinweise.length) hinweise.push("Kein Fehler erkannt. Jeder Fehler braucht eine Zeile „## FEHLER“ und darunter „Aufgabe:“ und „Richtig:“.");
    return { eintraege: ein, hinweise };
  }

  /* ----------------------------------------------------------- Speicher --- */
  let D = lies(SK, {});
  if (!D || typeof D !== "object" || Array.isArray(D)) D = {};
  const sichern = () => schreib(SK, D);

  function alle() {
    return Object.keys(D).map(k => D[k]).filter(e => e && !e.weg && e.id)
      .sort((a, b) => (a.t || 0) - (b.t || 0) || (a.n || 0) - (b.n || 0));
  }
  function speichern(eintraege) {
    const jetzt = Date.now();
    let neu = 0, alt = 0;
    (eintraege || []).forEach((e, i) => {
      const x = D[e.id];
      if (x && !x.weg) alt++; else neu++;
      D[e.id] = Object.assign({}, e, { t: x && !x.weg ? x.t : jetzt, n: i, geaendert: jetzt });
    });
    sichern();
    return { neu, alt };
  }
  function entfernen(id) {
    if (!D[id]) return false;
    D[id] = { id, weg: true, geaendert: Date.now() };
    sichern();
    return true;
  }
  function neuLaden() { D = lies(SK, {}); if (!D || typeof D !== "object" || Array.isArray(D)) D = {}; }

  /* ------------------------------------------------------ Anleitung ---- */
  function anleitung() {
    return [
      "Ich bereite mich auf die IHK-Abschlussprüfung Teil 1 (Fachinformatikerin Anwendungsentwicklung) am 30.09. vor.",
      "Auf den Fotos sind meine handschriftlichen Lösungen (und, falls dabei, die Aufgaben und die Musterlösung).",
      "",
      "Bitte vergleiche jede meiner Antworten mit der richtigen Lösung. Wenn keine Musterlösung auf dem Foto ist, löse die Aufgabe selbst korrekt.",
      "Schreib NUR die Teilaufgaben auf, bei denen ich Punkte verloren habe (falsch, unvollständig, leer). Was richtig ist, lässt du weg.",
      "",
      "Antworte mit EINEM Codeblock (```text … ```) genau in diesem Format — ein Block „## FEHLER“ je Fehler, Deutsch in einfachen, kurzen Sätzen:",
      "",
      "## FEHLER",
      "Quelle: <Blatt und Nummer, z. B. Prognose 1 · 2 c) oder IHK Frühjahr 2024 · 3 b)>",
      "Ref: <Kennung der Teilaufgabe, wenn sie auf dem Blatt steht, z. B. p1-2c — sonst „-“>",
      "Thema: <z. B. Subnetting, Kostenkalkulation, RAID, Datenschutz>",
      "Punkte: <geschätzt erreicht> / <maximal>",
      "Aufgabe: <die Aufgabe kurz, 1–3 Sätze, mit den nötigen Zahlen>",
      "Meine Antwort: <was ich geschrieben habe, möglichst wörtlich>",
      "Richtig: <die vollständige richtige Antwort, mit Rechenweg und Einheit>",
      "Fehlt: <was in meiner Antwort fehlt; mehrere mit ; trennen>",
      "Falsch: <was falsch oder zu viel ist; mehrere mit ; trennen; sonst „-“>",
      "Warum: <kurz: Einheit/Rundung, falsch gelesen, Rechenweg fehlte, Begründung zu knapp, nicht gewusst oder Zeit>",
      "Merksatz: <eine kurze Regel, damit es beim nächsten Mal sitzt>",
      "Vokabeln: <wichtige Fachbegriffe = russische Übersetzung; mehrere mit ; trennen>",
      "",
      "Keine Einleitung, kein Text außerhalb des Codeblocks."
    ].join("\n");
  }

  /* --------------------------------------------------------- Oberfläche -- */
  function kopieren(t) {
    const P = root.GENPRUEFEN;
    if (P && P.kopierenRoh) return P.kopierenRoh(t);
    try { return navigator.clipboard.writeText(t).then(() => true, () => false); } catch (e) { return Promise.resolve(false); }
  }
  const melde = t => { if (typeof root.toast === "function") root.toast(t); };

  /**
   * Kasten zum Einlesen. fertig(anzahl) wird nach „Übernehmen“ gerufen.
   */
  function kasten(fertig) {
    const box = el("div", "pa-box");
    box.appendChild(el("h3", null, "Fehler von Papier hinzufügen"));
    box.appendChild(el("p", "pa-sub", "Für alles, was du auf Papier gerechnet und geschrieben hast. Claude liest die Fotos und schreibt die Fehler so auf, dass die App sie versteht."));

    const s1 = el("div", "pa-schritt");
    s1.appendChild(el("b", null, "1. Anleitung kopieren"));
    const k1 = el("button", "btn", "Anleitung für Claude kopieren");
    k1.type = "button";
    k1.onclick = () => kopieren(anleitung()).then(ok => melde(ok ? "Anleitung kopiert — in Claude einfügen und die Fotos dazu." : "Kopieren ging nicht — Text unten markieren."));
    s1.appendChild(k1);
    const vorschau = el("details", "pa-vorschau");
    vorschau.appendChild(el("summary", null, "Anleitung ansehen"));
    vorschau.appendChild(el("pre", "pa-pre", anleitung()));
    s1.appendChild(vorschau);
    box.appendChild(s1);

    const s2 = el("div", "pa-schritt");
    s2.appendChild(el("b", null, "2. In Claude: Fotos der Blätter + Anleitung schicken"));
    s2.appendChild(el("p", "pa-sub", "Am besten ein Blatt oder eine Aufgabe je Nachricht, gut lesbar fotografiert. Ein Chat für alle Blätter ist in Ordnung."));
    box.appendChild(s2);

    const s3 = el("div", "pa-schritt");
    s3.appendChild(el("b", null, "3. Claudes Antwort hier einfügen"));
    const ta = el("textarea", "pa-ta");
    ta.rows = 6;
    ta.placeholder = "## FEHLER\nQuelle: …\nAufgabe: …\nMeine Antwort: …\nRichtig: …";
    s3.appendChild(ta);
    const reihe = el("div", "pa-reihe");
    const lesenK = el("button", "btn primary", "Einlesen");
    lesenK.type = "button";
    const datei = el("label", "btn ghost pa-datei");
    datei.appendChild(document.createTextNode("oder Datei (.md, .txt)"));
    const inp = el("input"); inp.type = "file"; inp.accept = ".md,.txt,.json,text/plain,text/markdown,application/json";
    inp.hidden = true;
    datei.appendChild(inp);
    reihe.append(lesenK, datei);
    s3.appendChild(reihe);
    const erg = el("div", "pa-erg");
    s3.appendChild(erg);
    box.appendChild(s3);

    const auswerten = text => {
      erg.innerHTML = "";
      const r = lesen(text);
      r.hinweise.forEach(h => erg.appendChild(el("p", "pa-warn", h)));
      if (!r.eintraege.length) return;
      const vorhanden = new Set(alle().map(e => e.id));
      erg.appendChild(el("p", "pa-ok", r.eintraege.length + (r.eintraege.length === 1 ? " Fehler erkannt" : " Fehler erkannt") +
        (r.eintraege.some(e => vorhanden.has(e.id)) ? " (schon vorhandene werden aktualisiert)" : "") + ":"));
      const ul = el("ul", "pa-liste");
      r.eintraege.forEach(e => {
        const li = el("li");
        li.appendChild(el("b", null, (e.quelle || "ohne Quelle") + (e.max != null ? " · " + String(e.erreicht).replace(".", ",") + "/" + String(e.max).replace(".", ",") + " P." : "")));
        li.appendChild(el("span", null, " " + (e.aufgabe || e.richtig).slice(0, 110)));
        ul.appendChild(li);
      });
      erg.appendChild(ul);
      const ueb = el("button", "btn primary", "Übernehmen");
      ueb.type = "button";
      ueb.onclick = () => {
        const s = speichern(r.eintraege);
        melde(s.neu + " neu" + (s.alt ? ", " + s.alt + " aktualisiert" : "") + " — sie stehen jetzt unter „Papier“.");
        ta.value = "";
        erg.innerHTML = "";
        if (typeof fertig === "function") fertig(r.eintraege.length);
      };
      erg.appendChild(ueb);
    };
    lesenK.onclick = () => auswerten(ta.value);
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { ta.value = String(rd.result || ""); auswerten(ta.value); };
      rd.readAsText(f);
      inp.value = "";
    };
    return box;
  }

  const api = { lesen, eintrag, grundVon, punkte, vokabeln, anleitung, alle, speichern, entfernen, kasten, neuLaden, SK };
  root.GENPAPIER = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
