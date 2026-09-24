/* ============================================================================
   gen/glossar.js — Fachbegriffe DE → RU, direkt im Aufgabentext
   ----------------------------------------------------------------------------
   Viele Punkte gehen nicht verloren, weil der Stoff fehlt, sondern weil der
   deutsche Fachbegriff in der Frage nicht sofort verstanden wird. Deshalb:

   1. In den Texten (IHK-Bögen, Azubi-Navigator, Fehler wiederholen,
      Kompendium, Spickzettel, Karteikarten) wird jeder bekannte Fachbegriff
      beim ersten Vorkommen dezent unterstrichen. Ein Tipp zeigt:
      Artikel, russische Übersetzung, einfache deutsche Erklärung und ob der
      Begriff eher zu AP1, AP2 oder zu beiden gehört.
   2. Ein eigener Bereich mit Suche (deutsch oder russisch), Filter nach
      AP1 / AP2 / Gebiet und einem Kartenmodus zum Lernen.

   „Kann ich“ merkt sich ihk2:glossar:kann — solche Begriffe werden im Text
   nicht mehr unterstrichen. Daten: gen/glossar-daten.js.
   ========================================================================== */
"use strict";

(function (root) {
  const hatDom = typeof document !== "undefined";
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  const SK_KANN = "ihk2:glossar:kann";
  const SK_UI = "ihk2:glossar:ui";
  const lies = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };

  let KANN = hatDom ? lies(SK_KANN, {}) : {};
  let UI = Object.assign({ an: true, ap: "alle", gebiet: "", suche: "", tab: "liste" }, hatDom ? lies(SK_UI, {}) : {});
  const merkeUI = () => schreib(SK_UI, { an: UI.an, ap: UI.ap, gebiet: UI.gebiet });

  const AP_NAME = { "1": "AP1", "2": "AP2", "1+2": "AP1+2", mein: "Mein Wort" };
  const AP_LANG = { "1": "vor allem AP1", "2": "vor allem AP2", "1+2": "AP1 und AP2", mein: "von dir gespeichert" };

  /* ======================================================================
     Daten aufbereiten — reine Funktionen (tests/glossar.test.js)
     ====================================================================== */
  const norm = s => String(s || "").toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[„“”"'`´]/g, "").replace(/\s+/g, " ").trim();
  const slug = s => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const escRx = s => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  const BUCHST = /[A-Za-zÄÖÜäöüß0-9]/;

  function aufbereiten(roh) {
    const liste = [], von = {}, formVon = {};
    (roh || []).forEach(r => {
      const [de, ru, einfach, ap, gebiet, varianten, festId] = r;
      const m = /^(der|die|das)\s+(.+)$/.exec(de);
      const wort = m ? m[2] : de;
      let id = festId || slug(wort);
      while (von[id]) id += "-x";
      const e = { id, de, wort, artikel: m ? m[1] : "", ru, einfach, ap: AP_NAME[ap] ? ap : "1+2", gebiet, formen: [] };
      [wort].concat(varianten || []).forEach(f => {
        const k = f.toLowerCase();
        if (!f || f.length < 2 || formVon[k]) return;
        formVon[k] = id;
        e.formen.push(f);
      });
      e.such = norm([de, ru, einfach].concat(e.formen).join(" "));
      liste.push(e); von[id] = e;
    });
    /* ein großer Ausdruck, längste Form zuerst — sonst gewinnt „IP“ gegen „IP-Adresse“ */
    const formen = Object.keys(formVon).sort((a, b) => b.length - a.length);
    const rx = formen.length ? new RegExp("(" + formen.map(escRx).join("|") + ")(?:e|en|n|s|es|er|ern)?(?![A-Za-zÄÖÜäöüß0-9])", "gi") : null;
    return { liste, von, formVon, rx };
  }

  /** Fundstellen in einem Text: [{start, ende, id}] — ohne Treffer mitten im Wort */
  function finde(G, text) {
    const out = [];
    if (!G.rx || !text) return out;
    G.rx.lastIndex = 0;
    let m;
    while ((m = G.rx.exec(text))) {
      const vor = m.index > 0 ? text[m.index - 1] : "";
      if (vor && BUCHST.test(vor)) { G.rx.lastIndex = m.index + 1; continue; }
      const id = G.formVon[m[1].toLowerCase()];
      if (id) out.push({ start: m.index, ende: m.index + m[0].length, id });
    }
    return out;
  }

  function suchen(G, q, filter) {
    /* grobe Stammform: „окупаемость“ findet „окупаемости“, „Leasingraten“ findet „Leasingrate“ */
    const w = norm(q).split(" ").filter(Boolean).map(t => t.length >= 6 ? t.slice(0, t.length - 2) : t);
    return G.liste.filter(e =>
      (!filter || !filter.ap || filter.ap === "alle" || (filter.ap === "lernen" ? !filter.kann[e.id] : e.ap === filter.ap)) &&
      (!filter || !filter.gebiet || e.gebiet === filter.gebiet) &&
      w.every(x => e.such.indexOf(x) >= 0));
  }

  /* ======================================================================
     Oberfläche
     ====================================================================== */
  let G = null;
  function daten() {
    if (!G && root.IHK_GLOSSAR) G = aufbereiten((root.GENWORT ? root.GENWORT.zeilen() : []).concat(root.IHK_GLOSSAR));
    return G;
  }
  const GEBIETE = () => Object.assign({ mein: "Meine Wörter" }, root.IHK_GLOSSAR_GEBIETE || {});
  const istMein = e => e && e.ap === "mein";
  const zahlMein = () => { const D = daten(); return D ? D.liste.filter(istMein).length : 0; };

  /** „Meine Wörter“ haben sich geändert: neu aufbauen, neu markieren */
  function neu() {
    G = null;
    if (!daten()) return;
    entmarkieren();
    if (UI.an) allesMarkieren();
    const s = $("scGlossar");
    if (s && !s.hidden && UI.tab === "liste") { const y = root.scrollY; zeichnen(); root.scrollTo(0, y); }
    try { block(); } catch (e) { }
  }

  /* ------------------------------------------------ im Text markieren --- */
  /* Grundwörter, die jeder kennt — im Glossar ja, im Text nicht unterstreichen */
  const NICHT_MARKIEREN = new Set(["projekt", "angebot", "anfrage", "bestellung", "rechnung", "monitor", "server", "bit", "byte",
    "risiko", "anforderung", "praesentation", "marketing", "miete", "kredit", "zins", "update", "kundengespraech", "motivation",
    "homeoffice", "datenbank", "algorithmus", "variable", "funktion", "methode", "klasse", "objekt", "attribut", "index",
    "bedingung", "parameter", "schnittstelle", "ergonomie", "lizenz", "cloud-computing", "vorgang", "port", "ping"]);
  const ZIELE = "#sitTxt, .tk-frage, .tk-gintro, .loesung-txt, .az-text, .az-zeile-text, .az-wahl-text, .az-zuo-text, " +
                ".wd-text, .wd-intro, .kp-inhalt, .sp-inhalt, #kkVorne, #kkHinten, .satz-frage, .satz-muster, .sz-otext";
  const NICHT_IN = "textarea, input, select, button, a, code, pre, script, style, .gl-w, .az-bewerten, svg";

  function markieren(box) {
    const D = daten();
    if (!D || !UI.an || !box || !box.isConnected) return 0;
    /* nur das erste Vorkommen je Aufgabe/Karte — nicht jede Wiederholung unterstreichen */
    const bereich = box.closest(".tk, .az-teil, .az-situation, .wd-karte, .kk-karte, .kp-inhalt, .sp-inhalt, .satz-karte") || box;
    const schon = new Set(Array.from(bereich.querySelectorAll(".gl-w")).map(x => x.dataset.gl));
    const knoten = [];
    const w = document.createTreeWalker(box, NodeFilter.SHOW_TEXT, {
      acceptNode: n => (n.nodeValue && n.nodeValue.trim().length > 1 && !(n.parentElement && n.parentElement.closest(NICHT_IN)))
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    while (w.nextNode()) knoten.push(w.currentNode);
    let n = 0;
    knoten.forEach(t => {
      const text = t.nodeValue;
      const treffer = finde(D, text).filter(f => !schon.has(f.id) && !KANN[f.id] && !NICHT_MARKIEREN.has(f.id));
      if (!treffer.length) return;
      const frag = document.createDocumentFragment();
      let pos = 0;
      treffer.forEach(f => {
        if (schon.has(f.id)) return;         /* nur das erste Vorkommen je Kasten */
        schon.add(f.id);
        if (f.start > pos) frag.appendChild(document.createTextNode(text.slice(pos, f.start)));
        const s = el("span", "gl-w ap" + D.von[f.id].ap.replace("+", ""), text.slice(f.start, f.ende));
        s.dataset.gl = f.id;
        s.setAttribute("role", "button");
        s.tabIndex = 0;
        frag.appendChild(s);
        pos = f.ende; n++;
      });
      if (pos === 0) return;
      if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
      t.parentNode.replaceChild(frag, t);
    });
    return n;
  }

  function allesMarkieren(wurzel) {
    if (!daten() || !UI.an) return;
    const r = wurzel || document;
    const boxen = new Set();
    if (r.matches && r.matches(ZIELE)) boxen.add(r);
    if (r.querySelectorAll) r.querySelectorAll(ZIELE).forEach(b => boxen.add(b));
    if (r.closest) { const b = r.closest(ZIELE); if (b) boxen.add(b); }
    boxen.forEach(b => { try { markieren(b); } catch (e) { } });
  }
  function entmarkieren() {
    document.querySelectorAll(".gl-w").forEach(s => s.replaceWith(document.createTextNode(s.textContent)));
  }

  /* --------------------------------------------------------- Kärtchen --- */
  function blase(id) {
    const D = daten(), e = D && D.von[id];
    if (!e) return;
    let b = $("glBlase");
    if (!b) {
      b = el("div", "gl-blase"); b.id = "glBlase";
      b.setAttribute("role", "dialog");
      document.body.appendChild(b);
    }
    b.innerHTML = "";
    b.classList.remove("ns");
    const kopf = el("div", "gl-b-kopf");
    const t = el("div", "gl-b-t");
    if (e.artikel) t.appendChild(el("span", "gl-art", e.artikel + " "));
    t.appendChild(el("b", null, e.wort));
    kopf.appendChild(t);
    kopf.appendChild(el("span", "gl-ap ap" + e.ap.replace("+", ""), AP_NAME[e.ap]));
    const zu = el("button", "gl-zu", "×");
    zu.type = "button"; zu.setAttribute("aria-label", "schließen");
    zu.onclick = () => b.classList.remove("an");
    kopf.appendChild(zu);
    b.appendChild(kopf);
    b.appendChild(el("p", "gl-ru", e.ru));
    b.appendChild(el("p", istMein(e) ? "ns-kontext" : "gl-einfach", e.einfach));
    b.appendChild(el("p", "gl-meta", AP_LANG[e.ap] + (istMein(e) ? "" : " · " + (GEBIETE()[e.gebiet] || ""))));
    const st = el("div", "gl-b-knoepfe");
    const kann = el("button", "btn klein" + (KANN[e.id] ? " an" : ""), KANN[e.id] ? "✓ kann ich" : "kann ich");
    kann.type = "button";
    kann.onclick = () => { kannSetzen(e.id, !KANN[e.id]); blase(id); };
    const oeff = el("button", "btn ghost klein", "Im Glossar");
    oeff.type = "button";
    oeff.onclick = () => { b.classList.remove("an"); if (istMein(e)) { UI.ap = "mein"; merkeUI(); } oeffnen(e.id); };
    st.append(kann, oeff);
    b.appendChild(st);
    if (root.GENWORT) b.appendChild(root.GENWORT.vorkommenTeil({ art: istMein(e) ? "mein" : "glossar", e, text: e.wort }, e.wort));
    b.classList.add("an");
    b.scrollTop = 0;
  }
  function kannSetzen(id, ja) {
    if (ja) KANN[id] = 1; else delete KANN[id];
    schreib(SK_KANN, KANN);
    if (ja) document.querySelectorAll('.gl-w[data-gl="' + id + '"]').forEach(s => s.replaceWith(document.createTextNode(s.textContent)));
  }

  /* ------------------------------------------------------------ Seite --- */
  let herkunft = "scStart";
  let KARTEN = null;       /* { stapel, i, offen } */

  function seite() {
    let s = $("scGlossar");
    if (s) return s;
    s = el("div", "seite gl-seite"); s.id = "scGlossar"; s.hidden = true;
    const start = $("scStart");
    if (start && start.parentNode) start.parentNode.insertBefore(s, start.nextSibling);
    else document.body.appendChild(s);
    return s;
  }
  function zeigen() {
    const s = seite();
    const vorher = ["scBogen", "scAuswertung", "scKatalog", "scAzubi", "scWieder", "scKomp", "scSpick"].find(id => $(id) && !$(id).hidden) || "scStart";
    if (vorher !== "scGlossar") herkunft = vorher;
    document.querySelectorAll("div.seite[id^='sc'], #scBogen").forEach(e => { if (e.id !== "scGlossar") e.hidden = true; });
    s.hidden = false;
    const f = $("fuss"); if (f) f.hidden = true;
    const kt = $("kopfTitel"); if (kt) kt.hidden = false;
    if ($("kTitel")) $("kTitel").textContent = "Fachbegriffe DE → RU";
    if ($("kEyebrow")) $("kEyebrow").textContent = "Glossar · AP1 und AP2";
    if (root.GENZURUECK) {
      try { root.GENZURUECK.hoeher && root.GENZURUECK.hoeher("scGlossar", "scStart"); } catch (e) { }
      try { root.GENZURUECK.knopfPflegen(); } catch (e) { }
    }
    try {
      if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: herkunft }, "");
      if (history.state.seite !== "scGlossar") history.pushState({ ihk: 1, seite: "scGlossar" }, "", location.hash || "");
    } catch (e) { }
  }

  function oeffnen(id, opt) {
    if (!daten()) return;
    if (opt && opt.karten) { kartenStarten(); return; }
    UI.tab = "liste";
    if (id) { UI.suche = ""; UI.ap = "alle"; UI.gebiet = ""; }
    zeichnen(); zeigen();
    root.scrollTo(0, 0);
    if (id) setTimeout(() => {
      const z = document.querySelector('.gl-e[data-id="' + id + '"]');
      if (!z) return;
      z.scrollIntoView({ block: "center" });
      z.classList.add("gl-blink");
      setTimeout(() => z.classList.remove("gl-blink"), 1600);
    }, 60);
  }

  function zeichnen() {
    const s = seite();
    s.innerHTML = "";
    const box = el("div", "gl-wrap");
    s.appendChild(box);
    if (UI.tab === "karten" && KARTEN) kartenZeichnen(box);
    else listeSeite(box);
  }

  function filter() { return { ap: UI.ap, gebiet: UI.gebiet, kann: KANN }; }

  function listeSeite(box) {
    const D = daten();
    const L = D.liste;
    const kopf = el("div", "gl-karte");
    kopf.appendChild(el("h2", null, "Fachbegriffe DE → RU"));
    kopf.appendChild(el("p", "gl-info", (L.length - zahlMein()) + " Begriffe aus AP1 und AP2: Artikel, Übersetzung, einfache Erklärung. " +
      "Im Aufgabentext ist jeder Begriff beim ersten Vorkommen unterstrichen — antippen zeigt das Kärtchen."));
    const tipp = el("p", "gl-tipp");
    tipp.appendChild(el("b", null, "Unbekanntes Wort, das nicht unterstrichen ist? "));
    tipp.appendChild(document.createTextNode("Im Aufgabentext markieren (lange drücken oder doppelt tippen) → unten „Nachschlagen“. " +
      "Du siehst Übersetzung und alle Stellen in den Prüfungen; „+ Mein Glossar“ speichert es hier unter „Meine Wörter“."));
    kopf.appendChild(tipp);
    const f = el("div", "gl-fakten");
    [["AP1", L.filter(e => e.ap === "1").length, "ap1"], ["AP1+2", L.filter(e => e.ap === "1+2").length, "ap12"],
     ["AP2", L.filter(e => e.ap === "2").length, "ap2"], ["meine", zahlMein(), "apmein"], ["kann ich", Object.keys(KANN).filter(k => D.von[k]).length, "kann"]]
      .forEach(([t, n, c]) => { const x = el("div", "gl-fakt " + c); x.appendChild(el("b", null, String(n))); x.appendChild(el("span", null, t)); f.appendChild(x); });
    kopf.appendChild(f);
    const schalter = el("label", "gl-schalter");
    const cb = el("input"); cb.type = "checkbox"; cb.checked = UI.an;
    cb.onchange = () => { UI.an = cb.checked; merkeUI(); if (UI.an) allesMarkieren(); else entmarkieren(); };
    schalter.append(cb, el("span", null, "Begriffe in Aufgaben unterstreichen"));
    kopf.appendChild(schalter);
    const st = el("div", "steuer");
    const k = el("button", "btn primary", "20 Begriffe üben");
    k.type = "button"; k.onclick = kartenStarten;
    st.appendChild(k);
    kopf.appendChild(st);
    box.appendChild(kopf);

    /* Suche und Filter */
    const leiste = el("div", "gl-leiste");
    const feld = el("div", "gl-sfeld");
    const inp = el("input"); inp.type = "search"; inp.id = "glSuche";
    inp.placeholder = "Suchen: deutsch oder russisch, z. B. Tilgung, gewährleisten, окупаемость";
    inp.value = UI.suche || ""; inp.autocomplete = "off";
    inp.oninput = () => { UI.suche = inp.value; listeZeichnen(); };
    feld.appendChild(inp);
    leiste.appendChild(feld);
    const chips = el("div", "gl-chips");
    [["alle", "alle"], ["mein", "Meine Wörter" + (zahlMein() ? " " + zahlMein() : "")], ["1", "AP1"], ["1+2", "AP1+2"], ["2", "AP2"], ["lernen", "noch lernen"]].forEach(([k2, t]) => {
      const c = el("button", "gl-chip" + (UI.ap === k2 ? " an" : ""), t);
      c.type = "button";
      c.onclick = () => { UI.ap = k2; merkeUI(); chips.querySelectorAll(".gl-chip").forEach(x => x.classList.toggle("an", x === c)); listeZeichnen(); };
      chips.appendChild(c);
    });
    const sel = el("select", "gl-sel");
    const o0 = el("option", null, "alle Gebiete"); o0.value = ""; sel.appendChild(o0);
    Object.keys(GEBIETE()).forEach(g => { const o = el("option", null, GEBIETE()[g]); o.value = g; sel.appendChild(o); });
    sel.value = UI.gebiet || "";
    sel.onchange = () => { UI.gebiet = sel.value; merkeUI(); listeZeichnen(); };
    chips.appendChild(sel);
    leiste.appendChild(chips);
    box.appendChild(leiste);
    const info = el("p", "gl-info"); info.id = "glInfo";
    box.appendChild(info);
    const ul = el("ul", "gl-liste"); ul.id = "glListe";
    box.appendChild(ul);
    listeZeichnen();
  }

  function eintragEl(e) {
    const li = el("li", "gl-e" + (KANN[e.id] ? " kann" : ""));
    li.dataset.id = e.id;
    const k = el("div", "gl-e-kopf");
    const t = el("div", "gl-e-t");
    if (e.artikel) t.appendChild(el("span", "gl-art", e.artikel + " "));
    t.appendChild(el("b", null, e.wort));
    k.appendChild(t);
    k.appendChild(el("span", "gl-ap ap" + e.ap.replace("+", ""), AP_NAME[e.ap]));
    li.appendChild(k);
    const ru = el("p", "gl-ru", e.ru);
    li.appendChild(ru);
    li.appendChild(el("p", istMein(e) ? "ns-kontext" : "gl-einfach", e.einfach));
    const fuss = el("div", "gl-e-fuss");
    fuss.appendChild(el("span", "gl-geb", GEBIETE()[e.gebiet] || ""));
    if (istMein(e) && root.GENWORT) {
      const ae = el("button", "gl-link", "Übersetzung ändern"); ae.type = "button";
      ae.onclick = () => {
        if (li.querySelector(".ns-eingabe")) return;
        const m = root.GENWORT.MEIN[e.id] || {};
        const inp = el("input", "ns-eingabe"); inp.type = "text"; inp.value = m.ru || ""; inp.placeholder = "russisch";
        const ok = el("button", "gl-kann an", "speichern"); ok.type = "button";
        ok.onclick = () => root.GENWORT.aendern(e.id, { ru: inp.value.trim() });
        inp.onkeydown = ev => { if (ev.key === "Enter") ok.click(); };
        const r = el("div", "ns-aendern"); r.append(inp, ok);
        ru.replaceWith(r); inp.focus();
      };
      const weg = el("button", "gl-link", "löschen"); weg.type = "button";
      weg.onclick = () => { if (confirm("„" + e.wort + "“ aus deinen Wörtern löschen?")) root.GENWORT.loeschen(e.id); };
      fuss.append(ae, weg);
    }
    const kb = el("button", "gl-kann" + (KANN[e.id] ? " an" : ""), KANN[e.id] ? "✓ kann ich" : "kann ich");
    kb.type = "button";
    kb.onclick = () => { kannSetzen(e.id, !KANN[e.id]); li.replaceWith(eintragEl(e)); };
    fuss.appendChild(kb);
    li.appendChild(fuss);
    if (root.GENWORT) li.appendChild(root.GENWORT.vorkommenTeil({ art: istMein(e) ? "mein" : "glossar", e, text: e.wort }, e.wort));
    return li;
  }

  /* Prüfungsdeutsch (gen/wortschatz-daten.js) in der Suche mit anzeigen */
  function wortEl(w) {
    const li = el("li", "gl-e gl-wort");
    const k = el("div", "gl-e-kopf");
    const t = el("div", "gl-e-t");
    if (w.artikel) t.appendChild(el("span", "gl-art", w.artikel + " "));
    t.appendChild(el("b", null, w.lemma));
    k.appendChild(t);
    k.appendChild(el("span", "gl-ap ns-pd", "Prüfungsdeutsch"));
    li.appendChild(k);
    li.appendChild(el("p", "gl-ru", w.ru));
    const fuss = el("div", "gl-e-fuss");
    fuss.appendChild(el("span", "gl-geb", w.extra && w.extra.length ? w.extra.slice(0, 3).join(", ") : ""));
    const schon = root.GENWORT.meinVonWort(w.wort);
    const sp = el("button", "gl-kann" + (schon ? " an" : ""), schon ? "✓ in meinen Wörtern" : "+ Mein Glossar"); sp.type = "button";
    sp.onclick = () => { if (!schon) root.GENWORT.speichern({ art: "wort", e: w, text: w.lemma }, null, "", "Glossar-Suche"); };
    fuss.appendChild(sp);
    li.appendChild(fuss);
    li.appendChild(root.GENWORT.vorkommenTeil({ art: "wort", e: w, text: w.lemma }, w.lemma));
    return li;
  }

  function listeZeichnen() {
    const ul = $("glListe"), info = $("glInfo");
    if (!ul) return;
    const L = suchen(daten(), UI.suche, filter());
    ul.innerHTML = "";
    L.slice(0, 450).forEach(e => ul.appendChild(eintragEl(e)));
    info.textContent = L.length + " Begriffe" + (L.length > 450 ? " — die ersten 450 stehen hier" : "") +
      (UI.ap === "2" ? " · AP2: Softwareentwicklung, Datenbanken, WiSo — für die AP1 nur zum Wiedererkennen." : "");
    if (UI.ap === "mein" && !L.length && !(UI.suche || "").trim()) {
      const leer = el("li", "gl-leer");
      leer.appendChild(el("b", null, "Noch keine eigenen Wörter."));
      leer.appendChild(el("p", null, "Markiere in einer Aufgabe ein Wort, das du nicht kennst, und tippe unten auf „Nachschlagen“ → „+ Mein Glossar“."));
      ul.appendChild(leer);
    }
    /* allgemeine Prüfungswörter zusätzlich, wenn gesucht wird */
    if (root.GENWORT && (UI.suche || "").trim().length >= 3 && UI.ap !== "mein") {
      const W = root.GENWORT.suchen(UI.suche).filter(w => !root.GENWORT.meinVonWort(w.wort)).slice(0, 30);
      if (W.length) {
        const h = el("li", "gl-abschnitt", "Prüfungsdeutsch — allgemeine Wörter aus den Aufgaben (" + W.length + ")");
        ul.appendChild(h);
        W.forEach(w => ul.appendChild(wortEl(w)));
        info.textContent += " · dazu " + W.length + " allgemeine Wörter";
      }
    }
  }

  /* ---------------------------------------------------------- Karten --- */
  function kartenStarten() {
    const D = daten();
    if (!D) return;
    let pool = suchen(D, "", { ap: UI.ap === "lernen" ? "alle" : UI.ap, gebiet: UI.gebiet, kann: KANN }).filter(e => !KANN[e.id]);
    if (!pool.length) pool = D.liste.filter(e => !KANN[e.id]);
    const stapel = pool.map(e => [Math.random(), e]).sort((a, b) => a[0] - b[0]).map(x => x[1]).slice(0, 20);
    KARTEN = { stapel, i: 0, offen: false, gut: 0, nochmal: 0 };
    UI.tab = "karten";
    zeichnen(); zeigen(); root.scrollTo(0, 0);
  }

  function kartenZeichnen(box) {
    const K = KARTEN;
    const leiste = el("div", "gl-kleiste");
    leiste.appendChild(el("b", null, "Begriffe üben"));
    leiste.appendChild(el("span", null, Math.min(K.i + 1, K.stapel.length) + " / " + K.stapel.length));
    const zur = el("button", "gl-link", "zur Liste");
    zur.type = "button"; zur.onclick = () => { UI.tab = "liste"; zeichnen(); };
    leiste.appendChild(zur);
    box.appendChild(leiste);
    if (K.i >= K.stapel.length) {
      const k = el("div", "gl-karte gl-ende");
      k.appendChild(el("h2", null, "Fertig"));
      k.appendChild(el("p", "gl-info", K.gut + "× kann ich · " + K.nochmal + "× nochmal"));
      const st = el("div", "steuer");
      const n = el("button", "btn primary", "Noch 20"); n.type = "button"; n.onclick = kartenStarten;
      const l = el("button", "btn", "Zur Liste"); l.type = "button"; l.onclick = () => { UI.tab = "liste"; zeichnen(); };
      st.append(n, l);
      k.appendChild(st);
      box.appendChild(k);
      return;
    }
    const e = K.stapel[K.i];
    const k = el("div", "gl-karte gl-lernkarte");
    k.appendChild(el("span", "gl-ap ap" + e.ap.replace("+", ""), AP_NAME[e.ap]));
    const t = el("div", "gl-lk-t");
    if (e.artikel) t.appendChild(el("span", "gl-art", e.artikel + " "));
    t.appendChild(el("b", null, e.wort));
    k.appendChild(t);
    k.appendChild(el("p", "gl-geb", GEBIETE()[e.gebiet] || ""));
    if (!K.offen) {
      const z = el("button", "btn primary gl-umdrehen", "Übersetzung zeigen");
      z.type = "button"; z.onclick = () => { K.offen = true; zeichnen(); };
      k.appendChild(z);
    } else {
      k.appendChild(el("p", "gl-ru gross", e.ru));
      k.appendChild(el("p", "gl-einfach", e.einfach));
      const r = el("div", "gl-lk-knoepfe");
      const no = el("button", "wd-b b-nicht", "nochmal"); no.type = "button";
      no.onclick = () => { K.nochmal++; if (!K.zurueck) K.zurueck = {}; if (!K.zurueck[e.id]) { K.zurueck[e.id] = 1; K.stapel.push(e); } K.i++; K.offen = false; zeichnen(); };
      const ja = el("button", "wd-b b-gut", "kann ich"); ja.type = "button";
      ja.onclick = () => { K.gut++; kannSetzen(e.id, true); K.i++; K.offen = false; zeichnen(); };
      r.append(no, ja);
      k.appendChild(r);
    }
    box.appendChild(k);
  }

  /* -------------------------------------------------------- Startseite --- */
  function block() {
    const s = $("scStart"), D = daten();
    if (!s || !D) return;
    let b = $("glossarBox");
    if (!b) { b = el("div", "abschnitt"); b.id = "glossarBox"; s.appendChild(b); }
    b.innerHTML = "";
    b.appendChild(el("h2", null, "Fachbegriffe DE → RU"));
    const kann = Object.keys(KANN).filter(k => D.von[k]).length;
    b.appendChild(el("p", null, D.liste.length + " Begriffe mit Artikel, Übersetzung und einfacher Erklärung — markiert, ob eher AP1 oder AP2. " +
      "In allen Aufgaben antippbar."));
    const st = el("div", "steuer");
    const o = el("button", "btn primary", "Glossar öffnen"); o.type = "button"; o.onclick = () => oeffnen();
    const k = el("button", "btn", "20 Begriffe üben"); k.type = "button"; k.onclick = kartenStarten;
    st.append(o, k);
    b.appendChild(st);
    const d = document.querySelector('details.st-block[data-key="glossar"] .st-zahl');
    if (d) d.textContent = kann ? kann + "/" + D.liste.length + " kann ich" : D.liste.length + "";
  }

  /* -------------------------------------------------------- Einhängen --- */
  let beob = null, geplant = null;
  const offen = new Set();
  function einhaengen() {
    const altStart = root.renderStart;
    if (typeof altStart === "function" && !altStart.__gl) {
      const neu = function () {
        const r = altStart.apply(this, arguments);
        try { block(); } catch (e) { console.error("Glossar:", e); }
        return r;
      };
      neu.__gl = true; root.renderStart = neu;
    }
    const altSchirm = root.schirm;
    if (typeof altSchirm === "function" && !altSchirm.__gl) {
      const neu = function (name) {
        if (name === "scGlossar") { zeichnen(); zeigen(); return; }
        const s = $("scGlossar"); if (s) s.hidden = true;
        return altSchirm.apply(this, arguments);
      };
      neu.__gl = true; root.schirm = neu;
    }
    /* Kärtchen öffnen: Tipp oder Enter auf einen markierten Begriff */
    document.addEventListener("click", ev => {
      const w = ev.target.closest && ev.target.closest(".gl-w");
      if (w) { ev.preventDefault(); ev.stopPropagation(); blase(w.dataset.gl); return; }
      const b = $("glBlase");
      if (b && b.classList.contains("an") && !b.contains(ev.target)) b.classList.remove("an");
    }, true);
    document.addEventListener("keydown", ev => {
      const w = ev.target.closest && ev.target.closest(".gl-w");
      if (w && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); blase(w.dataset.gl); }
      if (ev.key === "Escape") { const b = $("glBlase"); if (b && b.classList.contains("an")) { b.classList.remove("an"); ev.stopPropagation(); } }
    }, true);
    /* Andere Bereiche blenden sich selbst ein */
    if (root.MutationObserver) {
      new MutationObserver(muts => {
        const k = $("scGlossar");
        if (!k || k.hidden) return;
        for (const m of muts) {
          const z = m.target;
          if (z !== k && z.id && /^sc/.test(z.id) && z.classList &&
              (z.classList.contains("seite") || z.classList.contains("blatt")) && !z.hidden) { k.hidden = true; return; }
        }
      }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
      /* Neue Texte markieren — gebündelt, und die eigenen Änderungen verwerfen */
      beob = new MutationObserver(muts => {
        if (!UI.an) return;
        muts.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) offen.add(n); else if (n.parentElement) offen.add(n.parentElement); }));
        if (!offen.size || geplant) return;
        geplant = setTimeout(() => {
          geplant = null;
          const liste = Array.from(offen); offen.clear();
          liste.forEach(n => { if (n.isConnected) allesMarkieren(n); });
          beob.takeRecords();
        }, 120);
      });
      beob.observe(document.body, { childList: true, subtree: true });
    }
    try { block(); } catch (e) { console.error("Glossar:", e); }
    setTimeout(() => allesMarkieren(), 600);
  }

  const api = { aufbereiten, finde, suchen, norm, oeffnen, block, markieren, allesMarkieren, blase, daten, neu,
                kartenStarten, get UI() { return UI; } };
  root.GENGLOSSAR = api;
  if (typeof module === "object" && module.exports) module.exports = api;
  if (hatDom) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
    else einhaengen();
  }
})(typeof window !== "undefined" ? window : globalThis);
