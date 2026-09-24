/* ============================================================================
   gen/nachschlagen.js — jedes Wort nachschlagen, auch das nicht unterstrichene
   ----------------------------------------------------------------------------
   Wort (oder kurze Wendung) im Text markieren → unten erscheint
   „Nachschlagen“. Das Kärtchen zeigt:
     · Fachbegriff aus dem Glossar (gen/glossar-daten.js), oder
     · Prüfungsdeutsch (gen/wortschatz-daten.js: Operatoren, „gewährleisten“,
       „hinsichtlich“ …) mit Übersetzung, oder
     · „neu“: eigene Übersetzung eintragen, Google Übersetzer, Claude fragen.
   Dazu immer: WO kommt das Wort in den Prüfungen vor (IHK-Bögen und
   Azubi-Navigator), mit Satz, Sprung zur Aufgabe und „diese Aufgaben üben“.

   „+ Mein Glossar“ speichert das Wort (ihk2:glossar:mein). Es steht dann im
   Glossar unter „Meine Wörter“, wird im Text lila unterstrichen und kommt in
   die Lernkarten — bis „kann ich“.
   ========================================================================== */
"use strict";

(function (root) {
  const hatDom = typeof document !== "undefined";
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const SK_MEIN = "ihk2:glossar:mein";
  const BUCHST = "A-Za-zÄÖÜäöüß";
  const escRx = s => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  const klein = s => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  const slug = s => klein(s).replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  /* ======================================================================
     Formen bilden — reine Funktionen (tests/nachschlagen.test.js)
     ====================================================================== */
  /* „rechnet“, „öffnet“, „arbeitet“ — aber „lernt“, „wohnt“, „nennt“ */
  function mitE(st) {
    if (/[td]$/.test(st)) return true;
    const m = /([a-zäöüß])([a-zäöüß])([mn])$/.exec(st);
    if (!m) return false;
    const [, v2, v1, z] = m;
    if (/[aeiouäöü]/.test(v1) || /[lr]/.test(v1) || v1 === z) return false;
    if (v1 === "h" && /[aeiouäöü]/.test(v2)) return false;
    return true;
  }
  const UNTRENNBAR = /^(be|ge|er|ver|zer|ent|emp|miss|über|unter|wider|hinter|voll)/;
  function verbFormen(roh, extra) {
    const f = new Set();
    const add = x => { if (x) f.add(klein(x)); };
    (extra || []).forEach(add);
    if (/\s/.test(roh)) { add(roh.replace(/\|/g, "")); return Array.from(f); }
    const teile = roh.split("|");
    const praef = teile.slice(0, -1).join("");
    const basis = teile[teile.length - 1];
    add(praef + basis);
    const stamm = /[elr]n$/.test(basis) && /(el|er)n$/.test(basis) ? basis.slice(0, -1) : basis.replace(/en$/, "");
    const et = mitE(stamm) ? "et" : "t";
    const ohneGe = UNTRENNBAR.test(basis) || /ieren$/.test(basis);
    const mit = x => praef + x;
    [stamm + "e", stamm + (et === "et" ? "est" : "st"), stamm + et, stamm + (et === "et" ? "ete" : "te"),
     stamm + (et === "et" ? "eten" : "ten"), stamm + (et === "et" ? "etet" : "tet"), basis].forEach(x => add(mit(x)));
    add(praef + (ohneGe ? "" : "ge") + stamm + et);
    if (praef) add(praef + "zu" + basis); else add("zu " + basis);
    return Array.from(f);
  }
  function nomenFormen(wort, extra) {
    const f = new Set([klein(wort)]);
    (extra || []).forEach(x => { f.add(klein(x)); f.add(klein(x) + "n"); });
    const w = klein(wort);
    ["e", "en", "n", "s", "es", "er", "ern"].forEach(e => f.add(w + e));
    return Array.from(f);
  }
  function adjFormen(wort, extra) {
    const f = new Set([klein(wort)]);
    (extra || []).forEach(x => f.add(klein(x)));
    const w = klein(wort).replace(/…/g, "").replace(/\s+/g, " ").trim();
    if (!/\s/.test(w)) ["e", "en", "er", "es", "em"].forEach(e => f.add(w + e));
    else f.add(w);
    return Array.from(f);
  }

  let WS = null;
  function wortschatz() {
    if (WS) return WS;
    const roh = root.IHK_WORTSCHATZ || (typeof require === "function" ? require("./wortschatz-daten.js") : []);
    const liste = [], formVon = {};
    roh.forEach(([typ, wort, ru, extra]) => {
      const m = /^(der|die|das)\s+(.+)$/.exec(wort);
      const lemma = (m ? m[2] : wort).replace(/\|/g, "");
      const e = { typ, wort: wort.replace(/\|/g, ""), lemma, artikel: m ? m[1] : "", ru, extra: extra || [], id: "w-" + slug(lemma) + (typ === "n" ? "-n" : "") };
      e.formen = typ === "v" ? verbFormen(wort, extra) : typ === "n" ? nomenFormen(lemma, extra) : adjFormen(lemma, extra);
      e.such = klein([lemma, ru].concat(e.formen).join(" "));
      e.formen.forEach(x => { (formVon[x] = formVon[x] || []).push(e); });
      liste.push(e);
    });
    WS = { liste, formVon };
    return WS;
  }
  const TYPNAME = { v: "Verb", n: "Nomen", a: "Adjektiv / Adverb", w: "Verbindungswort" };

  /** Markierten Text säubern: Satzzeichen und Anführungszeichen außen weg */
  function saeubern(t) {
    return String(t || "").replace(/\s+/g, " ").trim()
      .replace(new RegExp("^[^" + BUCHST + "0-9]+"), "")
      .replace(new RegExp("[^" + BUCHST + "0-9.]+$"), "").replace(/(\S{5,})\.$/, "$1").trim();
  }

  /** Grobe Grundformen eines einzelnen Wortes (Endungen weg) */
  function kandidaten(w) {
    const k = klein(w), out = [k];
    ["en", "ern", "em", "er", "es", "e", "n", "s", "st", "t", "et", "te", "ten", "tet"].forEach(e => {
      if (k.length - e.length >= 4 && k.endsWith(e)) out.push(k.slice(0, -e.length));
    });
    return out;
  }

  /** Suche im Wortschatz: exakt, dann über die Grundformen */
  function imWortschatz(text) {
    const W = wortschatz(), k = klein(text);
    if (W.formVon[k]) return W.formVon[k];
    if (/\s/.test(k)) return [];
    for (const c of kandidaten(k)) {
      if (W.formVon[c]) return W.formVon[c];
      for (const e of W.liste) if (e.typ !== "w" && klein(e.lemma) === c) return [e];
    }
    return [];
  }

  /** Was ist das? → { art: "glossar"|"mein"|"wort"|"neu", e?, liste?, text } */
  function nachschlagen(roh) {
    const text = saeubern(roh);
    if (!text) return null;
    const G = root.GENGLOSSAR && root.GENGLOSSAR.daten && root.GENGLOSSAR.daten();
    if (G) {
      const k = klein(text);
      let id = G.formVon[k];
      if (!id) {
        const f = root.GENGLOSSAR.finde ? root.GENGLOSSAR.finde(G, text) : [];
        if (f.length && (f[0].ende - f[0].start) >= text.length * 0.6) id = f[0].id;
      }
      if (!id && !/\s/.test(k)) for (const c of kandidaten(k)) if (G.formVon[c]) { id = G.formVon[c]; break; }
      if (id && G.von[id]) return { art: G.von[id].ap === "mein" ? "mein" : "glossar", e: G.von[id], text };
    }
    const w = imWortschatz(text);
    if (w.length) return { art: "wort", e: w[0], liste: w, text };
    return { art: "neu", text };
  }

  /* ======================================================================
     Vorkommen in den Prüfungen
     ====================================================================== */
  /* Zeilenumbrüche bleiben als Satzgrenze erhalten (Tabellen, Aufzählungen) */
  const ohneHtml = h => String(h || "").replace(/<\/(p|li|div|tr|h\d)>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/[ \t\r]+/g, " ").replace(/ *\n[\n ]*/g, "\n").trim();
  let IDX = null, idxMitAzubi = false;
  function index() {
    const P = root.GENAZUBI && root.GENAZUBI.paket && root.GENAZUBI.paket();
    if (IDX && (idxMitAzubi || !P)) return IDX;
    IDX = [];
    const A = (typeof ALLE !== "undefined" && ALLE) ? ALLE : (root.__ALLE_TEST || []);
    A.forEach(it => {
      const m = (it.exam && it.exam.meta) || {};
      const erster = it.task && it.task.subtasks && it.task.subtasks[0] && it.task.subtasks[0].id === it.id;
      IDX.push({ quelle: "ihk", it, titel: (m.season || "") + " " + (m.year || "") + " · " + (it.fullLabel || it.label || ""),
        frage: ohneHtml((erster && it.task.intro ? it.task.intro + " " : "") + (it.prompt || "")),
        loesung: ohneHtml((it.solution || {}).text) });
    });
    if (P) (P.module || []).forEach(m => (m.aufgaben || []).forEach(a => (a.teile || []).forEach(t => IDX.push({
      quelle: "azubi", m, t, titel: "Azubi " + (m.kurz || "") + " · " + (t.nr || "") + " " + (t.label || ""),
      frage: ohneHtml(t.text), loesung: ohneHtml(t.loesung)
    }))));
    idxMitAzubi = !!P;
    return IDX;
  }

  function suchAusdruck(formen, frei) {
    const f = Array.from(new Set(formen.map(klein).filter(x => x.length >= 2))).sort((a, b) => b.length - a.length);
    if (!f.length) return null;
    const teil = f.map(x => escRx(x).replace(/ /g, "\\s+")).join("|");
    return new RegExp("(^|[^" + BUCHST + "0-9])(" + teil + ")(" + (frei ? "[" + BUCHST + "]{0,4}" : "(?:e|en|n|s|es|er|ern)?") + ")(?=$|[^" + BUCHST + "0-9])", "i");
  }

  function schnipsel(text, m) {
    const start = m.index + m[1].length, ende = start + m[2].length + m[3].length;
    const vorn = text.slice(0, start);
    let a = Math.max(vorn.lastIndexOf(". "), vorn.lastIndexOf("? "), vorn.lastIndexOf("! "), vorn.lastIndexOf("\n"));
    a = a < 0 ? 0 : a + (text[a] === "\n" ? 1 : 2);
    let b = text.slice(ende).search(/[.?!](\s|$)|\n/);
    b = b < 0 ? text.length : ende + b + (text[ende + b] === "\n" ? 0 : 1);
    if (start - a > 90) a = text.lastIndexOf(" ", start - 70) + 1;
    if (b - ende > 90) b = text.indexOf(" ", ende + 70) < 0 ? text.length : text.indexOf(" ", ende + 70);
    const glatt = x => x.replace(/\n/g, " ");
    return { vor: (a > 0 ? "… " : "") + glatt(text.slice(a, start)), treffer: glatt(text.slice(start, ende)),
             nach: glatt(text.slice(ende, b)) + (b < text.length ? " …" : "") };
  }

  /** Fundstellen: [{ eintrag, wo: "Aufgabe"|"Lösung", s: {vor, treffer, nach} }] */
  function vorkommen(formen, frei) {
    const rx = suchAusdruck(formen, frei);
    if (!rx) return [];
    const inFrage = [], inLoesung = [];
    index().forEach(x => {
      let m = rx.exec(x.frage);
      if (m) { inFrage.push({ eintrag: x, wo: "Aufgabe", s: schnipsel(x.frage, m) }); return; }
      m = rx.exec(x.loesung);
      if (m) inLoesung.push({ eintrag: x, wo: "Lösung", s: schnipsel(x.loesung, m) });
    });
    return inFrage.concat(inLoesung);
  }

  function formenFuer(r) {
    if (!r) return { formen: [], frei: false };
    if (r.art === "glossar" || r.art === "mein") return { formen: r.e.formen.slice(), frei: false };
    if (r.art === "wort") return { formen: r.e.formen.slice(), frei: false };
    const k = klein(r.text);
    if (/\s/.test(k)) return { formen: [k], frei: false };
    const st = kandidaten(k).filter(x => x.length >= 4).pop() || k;
    return { formen: [st], frei: true };
  }

  /* ======================================================================
     Meine Wörter
     ====================================================================== */
  const lies = () => { try { const v = JSON.parse(localStorage.getItem(SK_MEIN)); return v && typeof v === "object" ? v : {}; } catch (e) { return {}; } };
  let MEIN = hatDom ? lies() : {};
  const merken = () => { try { localStorage.setItem(SK_MEIN, JSON.stringify(MEIN)); } catch (e) { } };
  const meinId = wort => "m-" + slug(String(wort).replace(/^(der|die|das)\s+/i, ""));

  function speichern(r, ru, kontext, quelle) {
    const wort = r.art === "wort" ? r.e.wort : r.text;
    const id = meinId(wort);
    MEIN[id] = Object.assign(MEIN[id] || {}, {
      wort, ru: (ru != null ? ru : (r.art === "wort" ? r.e.ru : "")) || "",
      formen: r.art === "wort" ? r.e.formen.slice(0, 40) : Array.from(new Set([klein(r.text)].concat(kandidaten(r.text).filter(x => x.length >= 4)))).slice(0, 4),
      typ: r.art === "wort" ? r.e.typ : "", kontext: kontext || "", quelle: quelle || "", t: Date.now()
    });
    merken();
    geaendert();
    return id;
  }
  function loeschen(id) { delete MEIN[id]; merken(); geaendert(); }
  function aendern(id, felder) { if (!MEIN[id]) return; Object.assign(MEIN[id], felder, { t: Date.now() }); merken(); geaendert(); }
  function geaendert() { try { root.GENGLOSSAR && root.GENGLOSSAR.neu && root.GENGLOSSAR.neu(); } catch (e) { } }

  /** Zeilen im Format von IHK_GLOSSAR, damit das Glossar sie wie Fachbegriffe behandelt */
  function zeilen() {
    return Object.keys(MEIN).sort((a, b) => (MEIN[b].t || 0) - (MEIN[a].t || 0)).map(id => {
      const m = MEIN[id];
      const hin = [m.kontext ? "„" + m.kontext + "“" : "", m.quelle ? "(" + m.quelle + ")" : ""].filter(Boolean).join(" ");
      return [m.wort, m.ru || "— noch ohne Übersetzung —", hin || "Von dir gespeichert.", "mein", "mein", m.formen || [], id];
    });
  }
  const meinVonWort = wort => MEIN[meinId(wort)] ? meinId(wort) : null;

  function suchen(q) {
    const w = klein(q).split(" ").filter(Boolean).map(t => t.length >= 6 ? t.slice(0, t.length - 2) : t);
    if (!w.length) return [];
    return wortschatz().liste.filter(e => w.every(x => e.such.indexOf(x) >= 0));
  }

  /* ======================================================================
     Oberfläche
     ====================================================================== */
  function kopieren(t) {
    const alt = () => {
      try {
        const ta = el("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok;
      } catch (e) { return false; }
    };
    if (navigator.clipboard && root.isSecureContext) return navigator.clipboard.writeText(t).then(() => true, alt);
    return Promise.resolve(alt());
  }
  function claudeText(wort, kontext) {
    return "Ich lerne für die IHK-Abschlussprüfung (Fachinformatiker Anwendungsentwicklung, AP1). Meine Muttersprache ist Russisch.\n" +
      "Erkläre mir das Wort „" + wort + "“" + (kontext ? " aus diesem Satz:\n„" + kontext + "“" : "") + "\n\n" +
      "Antworte kurz, in dieser Form:\n" +
      "1. Grundform (bei Nomen mit Artikel und Plural, bei Verben mit Perfekt)\n" +
      "2. Russische Übersetzung — passend zu diesem Satz\n" +
      "3. Erklärung in einem einfachen deutschen Satz (Niveau B1)\n" +
      "4. Zwei kurze Beispielsätze aus der IT-/Prüfungswelt, jeweils mit russischer Übersetzung\n" +
      "5. Falls es ein Operator in Prüfungsaufgaben ist (z. B. „erläutern“): was dann in der Antwort verlangt wird";
  }
  const googleLink = w => "https://translate.google.com/?sl=de&tl=ru&text=" + encodeURIComponent(w) + "&op=translate";

  function operatorFuer(r) {
    const O = root.GENPRUEFEN && root.GENPRUEFEN.OPERATOREN;
    if (!O || !r || r.art !== "wort" || r.e.typ !== "v") return null;
    const l = klein(r.e.lemma);
    return O.find(o => o.rx.test(l)) || null;
  }

  function oeffneFund(f) {
    const b = $("glBlase"); if (b) b.classList.remove("an");
    const x = f.eintrag;
    if (x.quelle === "ihk") {
      if (typeof oeffnePruefung !== "function") return;
      oeffnePruefung(x.it.exam);
      if (typeof springeZu === "function") setTimeout(() => springeZu(x.it.k), 80);
    } else if (x.quelle === "azubi" && root.GENAZUBI) root.GENAZUBI.oeffnen(x.m.id, { ziel: x.t.id });
  }
  function ueben(funde, titel) {
    const items = funde.filter(f => f.eintrag.quelle === "ihk").map(f => f.eintrag.it);
    if (!items.length || typeof VIEW === "undefined") return;
    const b = $("glBlase"); if (b) b.classList.remove("an");
    VIEW = { modus: "uebung", exam: null, items, titel };
    if (typeof SHOW_SOL !== "undefined") SHOW_SOL = false;
    if (typeof zeigeBogen === "function") zeigeBogen();
    if (typeof schirm === "function") schirm("scBogen");
  }

  /** Aufklappbarer Teil „Wo kommt das vor?“ — für jedes Kärtchen und jeden Glossar-Eintrag */
  function vorkommenTeil(r, wortAnzeige) {
    const { formen, frei } = formenFuer(r);
    const box = el("div", "ns-vk");
    let funde = null;
    const knopf = el("button", "ns-vk-knopf", "Wo kommt das in Prüfungen vor?"); knopf.type = "button";
    const inhalt = el("div", "ns-vk-inhalt"); inhalt.hidden = true;
    const zeichneListe = alle => {
      inhalt.innerHTML = "";
      if (!funde.length) { inhalt.appendChild(el("p", "ns-klein", "In den Aufgaben und Musterlösungen nicht gefunden.")); return; }
      const ihk = funde.filter(f => f.eintrag.quelle === "ihk").length, az = funde.length - ihk;
      const nA = funde.filter(f => f.wo === "Aufgabe").length;
      inhalt.appendChild(el("p", "ns-klein", funde.length + " Stellen: " + nA + "× in der Aufgabe, " + (funde.length - nA) + "× nur in der Lösung" +
        " · IHK " + ihk + (az ? " · Azubi " + az : "")));
      const ul = el("ul", "ns-funde");
      funde.slice(0, alle ? 60 : 5).forEach(f => {
        const li = el("li");
        const b = el("button", "ns-fund"); b.type = "button";
        const kopf = el("span", "ns-fund-kopf");
        kopf.appendChild(el("b", null, f.eintrag.titel));
        kopf.appendChild(el("span", "ns-wo " + (f.wo === "Aufgabe" ? "a" : "l"), f.wo));
        b.appendChild(kopf);
        const s = el("span", "ns-satz");
        s.appendChild(document.createTextNode(f.s.vor));
        s.appendChild(el("mark", null, f.s.treffer));
        s.appendChild(document.createTextNode(f.s.nach));
        b.appendChild(s);
        b.onclick = () => oeffneFund(f);
        li.appendChild(b);
        ul.appendChild(li);
      });
      inhalt.appendChild(ul);
      const st = el("div", "ns-knoepfe");
      if (!alle && funde.length > 5) {
        const m = el("button", "ns-link", "alle " + Math.min(funde.length, 60) + " zeigen"); m.type = "button";
        m.onclick = () => zeichneListe(true);
        st.appendChild(m);
      }
      const ihkFunde = funde.filter(f => f.eintrag.quelle === "ihk" && f.wo === "Aufgabe");
      if (ihkFunde.length) {
        const u = el("button", "ns-link", "Diese " + ihkFunde.length + " IHK-Aufgaben üben"); u.type = "button";
        u.onclick = () => ueben(ihkFunde, "Aufgaben mit „" + (wortAnzeige || r.text) + "“");
        st.appendChild(u);
      }
      if (st.childNodes.length) inhalt.appendChild(st);
    };
    knopf.onclick = () => {
      if (!funde) { funde = vorkommen(formen, frei); knopf.textContent = "Wo kommt das vor? · " + funde.length + (funde.length === 1 ? " Stelle" : " Stellen"); zeichneListe(false); }
      inhalt.hidden = !inhalt.hidden;
      knopf.classList.toggle("offen", !inhalt.hidden);
    };
    box.append(knopf, inhalt);
    return box;
  }

  function blaseEl() {
    let b = $("glBlase");
    if (!b) { b = el("div", "gl-blase"); b.id = "glBlase"; b.setAttribute("role", "dialog"); document.body.appendChild(b); }
    return b;
  }
  function kopfZeile(b, titel, artikel, marke, klasse) {
    const kopf = el("div", "gl-b-kopf");
    const t = el("div", "gl-b-t");
    if (artikel) t.appendChild(el("span", "gl-art", artikel + " "));
    t.appendChild(el("b", null, titel));
    kopf.appendChild(t);
    kopf.appendChild(el("span", "gl-ap " + (klasse || ""), marke));
    const zu = el("button", "gl-zu", "×"); zu.type = "button"; zu.setAttribute("aria-label", "schließen");
    zu.onclick = () => b.classList.remove("an");
    kopf.appendChild(zu);
    b.appendChild(kopf);
  }

  /** Kärtchen für ein nachgeschlagenes Wort */
  function karte(roh, kontext, quelle) {
    const r = nachschlagen(roh);
    if (!r) return;
    if ((r.art === "glossar" || r.art === "mein") && root.GENGLOSSAR && root.GENGLOSSAR.blase) { root.GENGLOSSAR.blase(r.e.id); return; }
    const b = blaseEl();
    b.innerHTML = "";
    b.classList.add("ns");
    if (r.art === "wort") {
      const e = r.e;
      kopfZeile(b, e.lemma, e.artikel, "Prüfungsdeutsch", "ns-pd");
      (r.liste || [e]).slice(0, 2).forEach((x, i) => {
        if (i) b.appendChild(el("p", "gl-meta", (x.artikel ? x.artikel + " " : "") + x.lemma + " · " + TYPNAME[x.typ]));
        b.appendChild(el("p", "gl-ru", x.ru));
      });
      b.appendChild(el("p", "gl-meta", TYPNAME[e.typ] + (e.extra.length ? " · " + e.extra.slice(0, 4).join(", ") : "")));
      const op = operatorFuer(r);
      if (op) { const p = el("p", "ns-op"); p.appendChild(el("b", null, "Operator in Aufgaben: ")); p.appendChild(document.createTextNode(op.will)); b.appendChild(p); }
    } else {
      kopfZeile(b, r.text, "", "nicht im Glossar", "ns-neu");
      b.appendChild(el("p", "gl-einfach", "Dieses Wort kennt die App noch nicht. Übersetzung nachsehen und mit deiner Übersetzung speichern — dann ist es beim nächsten Mal da."));
    }
    if (kontext) { const k = el("p", "ns-kontext"); k.textContent = "„" + kontext + "“"; b.appendChild(k); }

    const schon = meinVonWort(r.art === "wort" ? r.e.wort : r.text);
    let inp = null;
    if (r.art === "neu") {
      inp = el("input", "ns-eingabe"); inp.type = "text"; inp.placeholder = "Deine Übersetzung (russisch)";
      inp.value = schon ? (MEIN[schon].ru || "") : "";
      inp.setAttribute("aria-label", "Deine Übersetzung");
      b.appendChild(inp);
    }
    const st = el("div", "gl-b-knoepfe ns-b-knoepfe");
    const sp = el("button", "btn klein" + (schon ? " an" : " primary"), schon ? "✓ in meinem Glossar" : "+ Mein Glossar"); sp.type = "button";
    sp.onclick = () => {
      const id = speichern(r, inp ? inp.value.trim() : null, kontext, quelle);
      sp.textContent = "✓ gespeichert"; sp.classList.remove("primary"); sp.classList.add("an");
      if (root.toast) root.toast("„" + (MEIN[id] || {}).wort + "“ steht jetzt unter „Meine Wörter“ im Glossar.");
    };
    st.appendChild(sp);
    if (r.art === "neu") {
      const g = el("a", "btn ghost klein", "Übersetzen ↗"); g.href = googleLink(r.text); g.target = "_blank"; g.rel = "noopener";
      st.appendChild(g);
    }
    const c = el("button", "btn ghost klein", "Claude fragen"); c.type = "button";
    c.onclick = () => {
      const w = root.open("https://claude.ai/new", "_blank", "noopener");
      kopieren(claudeText(r.art === "wort" ? r.e.lemma : r.text, kontext)).then(ok => {
        if (root.toast) root.toast(ok ? "Frage kopiert — in Claude einfügen." : "Kopieren ging nicht.");
      });
      return w;
    };
    st.appendChild(c);
    b.appendChild(st);
    b.appendChild(vorkommenTeil(r, r.art === "wort" ? r.e.lemma : r.text));
    b.classList.add("an");
    b.scrollTop = 0;
    return r;
  }

  /* ------------------------------------------------ Markieren → Knopf --- */
  const NICHT = "textarea, input, select, [contenteditable], .gl-blase, .ns-pille, pre, code, .sq-editor, svg";
  let AUSWAHL = null, pille = null, auswahlTimer = null;
  function pilleEl() {
    if (pille) return pille;
    pille = el("button", "ns-pille"); pille.type = "button"; pille.hidden = true;
    pille.addEventListener("pointerdown", ev => ev.preventDefault());
    pille.addEventListener("mousedown", ev => ev.preventDefault());
    pille.onclick = () => {
      if (!AUSWAHL) return;
      const a = AUSWAHL;
      pille.hidden = true;
      try { const s = root.getSelection(); if (s) s.removeAllRanges(); } catch (e) { }
      karte(a.text, a.kontext, a.quelle);
    };
    document.body.appendChild(pille);
    return pille;
  }
  function satzUm(knoten, text) {
    const block = knoten && (knoten.nodeType === 1 ? knoten : knoten.parentElement);
    const b = block && block.closest("p, li, td, th, .tk-frage, .az-text, .wd-text, div");
    const ganz = ohneHtml(b ? b.textContent : "");
    const i = ganz.indexOf(text);
    if (i < 0) return "";
    const vorn = ganz.slice(0, i);
    let a = Math.max(vorn.lastIndexOf(". "), vorn.lastIndexOf("? "), vorn.lastIndexOf("! "), vorn.lastIndexOf(": "), vorn.lastIndexOf("\n"));
    a = a < 0 ? 0 : a + (ganz[a] === "\n" ? 1 : 2);
    let e = ganz.slice(i + text.length).search(/[.?!](\s|$)|\n/);
    e = e < 0 ? ganz.length : i + text.length + e + (ganz[i + text.length + e] === "\n" ? 0 : 1);
    const s = ganz.slice(a, e).replace(/\n/g, " ").trim();
    return s.length > 260 ? s.slice(Math.max(0, i - a - 100), i - a + text.length + 100).trim() : s;
  }
  function quelleJetzt(knoten) {
    const elx = knoten && (knoten.nodeType === 1 ? knoten : knoten.parentElement);
    const tk = elx && elx.closest(".tk[data-k]");
    if (tk && typeof ALLE !== "undefined") {
      const it = ALLE.find(x => x.k === tk.dataset.k);
      if (it) { const m = (it.exam && it.exam.meta) || {}; return ((m.season || "") + " " + (m.year || "") + " · " + (it.fullLabel || "")).trim(); }
    }
    const az = elx && elx.closest("#scAzubi");
    const t = (($("kTitel") || {}).textContent || "").trim();
    return (az ? "Azubi · " : "") + t.slice(0, 60);
  }
  function auswahlPruefen() {
    const p = pilleEl();
    let s = null;
    try { s = root.getSelection(); } catch (e) { }
    if (!s || s.isCollapsed || !s.rangeCount) { p.hidden = true; AUSWAHL = null; return; }
    const text = saeubern(s.toString());
    const knoten = s.anchorNode;
    const elx = knoten && (knoten.nodeType === 1 ? knoten : knoten.parentElement);
    if (!text || text.length < 2 || text.length > 60 || text.split(" ").length > 6 || !new RegExp("[" + BUCHST + "]").test(text) ||
        !elx || elx.closest(NICHT) || !elx.closest("body")) { p.hidden = true; AUSWAHL = null; return; }
    AUSWAHL = { text, kontext: satzUm(knoten, s.toString().trim()), quelle: quelleJetzt(knoten) };
    p.textContent = "";
    p.appendChild(el("span", "ns-lupe", "🔍"));
    p.appendChild(el("span", null, "„" + (text.length > 26 ? text.slice(0, 24) + "…" : text) + "“ nachschlagen"));
    p.hidden = false;
  }

  function einhaengen() {
    document.addEventListener("selectionchange", () => {
      clearTimeout(auswahlTimer);
      auswahlTimer = setTimeout(auswahlPruefen, 220);
    });
    document.addEventListener("keydown", ev => { if (ev.key === "Escape" && pille) pille.hidden = true; });
  }

  const api = { verbFormen, nomenFormen, adjFormen, wortschatz, nachschlagen, kandidaten, saeubern, imWortschatz,
    vorkommen, suchAusdruck, formenFuer, vorkommenTeil, karte, speichern, loeschen, aendern, zeilen, suchen, claudeText,
    meinVonWort, get MEIN() { return MEIN; }, _index: () => { IDX = null; return index(); } };
  root.GENWORT = api;
  if (typeof module === "object" && module.exports) module.exports = api;
  if (hatDom) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
    else einhaengen();
  }
})(typeof window !== "undefined" ? window : globalThis);
