/* ============================================================================
   gen/satzbau.js — Kurzfragen: vom Stichwort zum Satz, in fünf Minuten
   ----------------------------------------------------------------------------
   Die Prüfung gibt Punkte für ausgeführte Antworten, nicht für Stichworte.
   Hier wird genau das geübt, in kleinen Runden, gut am Handy:

   · Schreiben   — Antwort tippen, geprüft wird auf Fachbegriff, Begründung,
                   Länge und ganzen Satz (bis 2 BE), dazu Musterantwort,
                   russische Erklärung und „Prüfen lassen“ (Claude).
   · Auswählen   — „Welche Antwort bekommt volle Punkte?“: Musterantwort,
                   dieselbe Aussage ohne Begründung, nur das Stichwort und eine
                   Antwort zu einer anderen Frage. Ohne Tippen.
   · Aufdecken   — nachdenken, Musterantwort zeigen, selbst einschätzen.
                   Die schnellste Runde (15 Fragen in 5 Minuten).

   Karten: gen/satzbausteine.js (s01–s51) und gen/satzbausteine2.js (s52 ff.).
   Stand je Karte: ihk2:gen:satz = { id: { versuche, bestPunkte, letzte,
   stand: gut|halb|nicht, t, wahlN, wahlOk } }. Wackelige Karten landen auch
   in „Fehler wiederholen“ (gen/wiederholen.js).
   ========================================================================== */
"use strict";

window.GENSATZ = (function () {
  const root = window;
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  const SK = "ihk2:gen:satz";
  const SK_EIN = "ihk2:satz:ein";
  const lies = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };
  let STAT = lies(SK, {}) || {};
  const merken = () => schreib(SK, STAT);
  let EIN = Object.assign({ modus: "schreiben", anzahl: 6, themen: [], folge: "wackelig" }, lies(SK_EIN, {}) || {});
  const einMerken = () => schreib(SK_EIN, EIN);
  let LAUF = null;   /* { modus, karten, i, erg: [] } */
  let ANSICHT = "auswahl";

  const POOL = () => window.SATZ_POOL || [];
  const MUSTER = () => window.SATZ_MUSTER || [];
  const THEMEN = () => Array.from(new Set(POOL().map(x => x.thema)));
  const MODI = {
    schreiben: { name: "Schreiben", ikon: "✍", info: "Antwort tippen — sofort Punkte, Tipps und Musterantwort" },
    auswahl: { name: "Auswählen", ikon: "☑", info: "„Welche Antwort bekommt volle Punkte?“ — antippen statt tippen" },
    aufdecken: { name: "Aufdecken", ikon: "👁", info: "Nachdenken, Musterantwort zeigen, selbst einschätzen — am schnellsten" }
  };

  /* ------------------------------------------------------------ Bewertung */
  /* Begründungssignale — bewusst breit: die Prüfung verlangt einen Zusammenhang,
     nicht ein bestimmtes Wort.                                               */
  const KONNEKTOR = /(weil|damit|dadurch|so\s?dass|sodass|denn|deshalb|daher|somit|folglich|wenn|sobald|sonst|andernfalls|ohne\s|um\s+\S+\s+zu\s|f(ü|u)hrt\s+dazu|bedeutet|hei(ß|ss)t|dient|sorgt|verhindert|erm(ö|o)glicht|sch(ü|u)tzt|senkt|erh(ö|o)ht|spart|vermeidet|reduziert|stellt\s+sicher|macht\s+es)/i;

  function bewerte(item, text) {
    const G = window.GEN;
    const roh = String(text || "").trim();
    const worte = roh ? roh.split(/\s+/).filter(Boolean).length : 0;
    const minW = item.minWorte || 12;
    const begriffe = (item.muss || []).map(g => ({ soll: g[0], ok: G.enthaeltEines(roh, g) }));
    const alleBegriffe = begriffe.length > 0 && begriffe.every(b => b.ok);
    const einBegriff = begriffe.some(b => b.ok);
    /* Zwei Sätze mit ausreichender Länge erklären auch ohne Signalwort */
    const saetze = (roh.match(/[.!?]+/g) || []).length;
    const konnektor = item.ohneBegruendung ? true : (KONNEKTOR.test(roh) || (saetze >= 2 && worte >= minW));
    const langGenug = worte >= minW;
    const ganzerSatz = /^[A-ZÄÖÜ„»]/.test(roh) && /[.!?][“»“]?\s*$/.test(roh);
    let punkte = 0;
    if (alleBegriffe && konnektor && langGenug) punkte = 2;
    else if (alleBegriffe && (konnektor || langGenug)) punkte = 1.5;
    else if (alleBegriffe) punkte = 1;
    else if (einBegriff) punkte = 0.5;
    return { punkte, worte, minW, begriffe, alleBegriffe, konnektor, langGenug, ganzerSatz,
             ohneBegruendung: !!item.ohneBegruendung, leer: !roh };
  }

  /* --------------------------------------------------------- Stand je Karte */
  /** gut | halb | nicht | neu — die letzte Einschätzung zählt */
  function stand(id) {
    const s = STAT[id];
    if (!s) return "neu";
    if (s.stand) return s.stand;
    const p = s.letzte != null ? s.letzte : s.bestPunkte;
    return p >= 2 ? "gut" : p >= 1 ? "halb" : "nicht";
  }
  function eintragen(id, felder) {
    const s = Object.assign({ versuche: 0, bestPunkte: 0 }, STAT[id] || {}, felder, { t: Date.now() });
    STAT[id] = s;
    merken();
  }
  const zahlen = (liste) => {
    const L = liste || POOL(), z = { gut: 0, halb: 0, nicht: 0, neu: 0, gesamt: L.length };
    L.forEach(x => { z[stand(x.id)]++; });
    return z;
  };
  const wackelig = () => POOL().filter(x => ["halb", "nicht"].includes(stand(x.id)));

  /* ---------------------------------------------------------- Auswahl bauen */
  const saetzeVon = t => String(t || "").replace(/([.!?])\s+(?=[A-ZÄÖÜ„])/g, "$1\n").split("\n").map(s => s.trim()).filter(Boolean);
  function zufall(arr) { return arr.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]); }

  /** Antwortmöglichkeiten: volle Punkte, ohne Begründung, nur Stichwort, andere Frage */
  function optionen(item) {
    const o = [{ text: item.muster, be: 2, warum: "Volle Punkte: Fachbegriff, Zusammenhang und Begründung in ganzen Sätzen." }];
    const s = saetzeVon(item.muster);
    if (!item.ohneBegruendung && s.length >= 2 && !KONNEKTOR.test(s[0]))
      o.push({ text: s[0], be: 1, warum: "Etwa die Hälfte: Die Aussage stimmt, aber die Begründung („weil …“, „dadurch …“) fehlt." });
    o.push({ text: item.stichwort + (item.ohneBegruendung ? "" : "."), be: 0.5,
      warum: "Kaum Punkte: nur ein Stichwort. Bei „Erläutern“ und „Begründen“ verlangt der Prüfer ganze Sätze." });
    const andere = POOL().filter(x => x.id !== item.id && x.thema === item.thema);
    const kandidaten = andere.length ? andere : POOL().filter(x => x.id !== item.id);
    const fremd = kandidaten[Math.floor(Math.random() * kandidaten.length)];
    if (fremd) o.push({ text: fremd.muster, be: 0, warum: "Keine Punkte: klingt fachlich, beantwortet aber eine andere Frage („" + fremd.frage.slice(0, 70) + (fremd.frage.length > 70 ? "…" : "") + "“)." });
    return zufall(o);
  }

  /* ---------------------------------------------------------- Runde bauen */
  const RANG = { nicht: 0, halb: 1, neu: 2, gut: 3 };
  function runde(opt) {
    const o = Object.assign({}, EIN, opt || {});
    let pool = POOL();
    if (o.ids && o.ids.length) pool = pool.filter(x => o.ids.includes(x.id));
    else if (o.themen && o.themen.length) pool = pool.filter(x => o.themen.includes(x.thema));
    if (o.folge === "nurWackelig" && !(o.ids && o.ids.length)) {
      const w = pool.filter(x => ["halb", "nicht"].includes(stand(x.id)));
      if (w.length) pool = w;
    }
    let reihe;
    if (o.folge === "zufall") reihe = zufall(pool);
    else reihe = pool.map(x => {
      const s = STAT[x.id];
      return { x, r: RANG[stand(x.id)] + (s && s.t ? Math.min(0.5, (Date.now() - s.t) / 864e5 / 60) * -1 : 0) + Math.random() * 0.6 };
    }).sort((a, b) => a.r - b.r).map(y => y.x);
    return reihe.slice(0, Math.max(1, o.anzahl || 6));
  }

  /* ------------------------------------------------------------- Startbox */
  function startBox() {
    let b = $("satzBox");
    if (!b) {
      b = el("div", "abschnitt"); b.id = "satzBox";
      const ziel = $("genStartBox");
      if (ziel && ziel.parentNode) ziel.parentNode.insertBefore(b, ziel.nextSibling);
      else if ($("scStart")) $("scStart").appendChild(b);
      else return;
    }
    b.innerHTML = "";
    const z = zahlen();
    b.appendChild(el("h2", null, "Kurzfragen — Antworten in ganzen Sätzen"));
    b.appendChild(el("p", null, z.gesamt + " typische Prüfungsfragen zum Ausformulieren, jede mit Musterantwort in einfachem Deutsch und " +
      "Erklärung auf Russisch. Kleine Runden, gut am Handy — statt 90 Minuten am Stück."));
    const leiste = el("div", "sz-balken");
    [["gut", z.gut], ["halb", z.halb], ["nicht", z.nicht]].forEach(([k, n]) => {
      if (!n) return; const s = el("span", "sz-" + k); s.style.width = (n / z.gesamt * 100) + "%"; leiste.appendChild(s);
    });
    b.appendChild(leiste);
    b.appendChild(el("p", "sz-zahlen", z.gut + " sitzen · " + (z.halb + z.nicht) + " wackelig · " + z.neu + " neu"));
    const st = el("div", "gen-knopfzeile sz-start");
    const k1 = el("button", "btn primary", "✍ 6 Fragen schreiben"); k1.type = "button";
    k1.onclick = () => starten(null, { modus: "schreiben", anzahl: 6 });
    const k2 = el("button", "btn", "☑ Auswählen (10)"); k2.type = "button";
    k2.onclick = () => starten(null, { modus: "auswahl", anzahl: 10 });
    const k3 = el("button", "btn", "👁 Aufdecken (15)"); k3.type = "button";
    k3.onclick = () => starten(null, { modus: "aufdecken", anzahl: 15 });
    const k4 = el("button", "btn ghost", "Themen & Einstellungen"); k4.type = "button";
    k4.onclick = () => einstellungen();
    st.append(k1, k2, k3, k4);
    b.appendChild(st);
    const w = z.halb + z.nicht;
    if (w) {
      const z2 = el("div", "gen-knopfzeile");
      const kw = el("button", "btn ghost klein", "nur die wackeligen (" + w + ")"); kw.type = "button";
      kw.onclick = () => starten(wackelig().map(x => x.id));
      z2.appendChild(kw);
      b.appendChild(z2);
    }
    const d = document.querySelector('details.st-block[data-key="satz"] .st-zahl');
    if (d) d.textContent = z.gut + "/" + z.gesamt;
  }

  /* --------------------------------------------------------------- Screen */
  let herkunft = "scStart";
  function seite() {
    let s = $("scSatz");
    if (s) return s;
    s = el("div", "seite sz-seite"); s.id = "scSatz"; s.hidden = true;
    const w = el("div", "sz-wrap"); w.id = "satzInhalt";
    s.appendChild(w);
    const start = $("scStart");
    if (start && start.parentNode) start.parentNode.insertBefore(s, start.nextSibling);
    else document.body.insertBefore(s, $("fuss") || null);
    return s;
  }
  function zeigen() {
    const s = seite();
    const vorher = ["scBogen", "scAuswertung", "scKatalog", "scAzubi", "scWieder", "scGlossar", "scKomp", "scSpick", "scSql"]
      .find(id => $(id) && !$(id).hidden) || "scStart";
    if (vorher !== "scSatz") herkunft = vorher;
    document.querySelectorAll("div.seite[id^='sc'], #scBogen").forEach(e => { if (e.id !== "scSatz") e.hidden = true; });
    s.hidden = false;
    const f = $("fuss"); if (f) f.hidden = true;
    const kt = $("kopfTitel"); if (kt) kt.hidden = false;
    if ($("kEyebrow")) $("kEyebrow").textContent = "Training · 5 Minuten";
    if ($("kTitel")) $("kTitel").textContent = "Kurzfragen";
    const sk = $("schalterKatalog"); if (sk) sk.hidden = true;
    if (root.GENZURUECK) {
      try { root.GENZURUECK.hoeher && root.GENZURUECK.hoeher("scSatz", "scStart"); } catch (e) { }
      try { root.GENZURUECK.knopfPflegen(); } catch (e) { }
    }
    try {
      if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: herkunft }, "");
      if (history.state.seite !== "scSatz") history.pushState({ ihk: 1, seite: "scSatz" }, "", location.hash || "");
    } catch (e) { }
    root.scrollTo(0, 0);
  }
  function zurueck() {
    const s = $("scSatz"); if (s) s.hidden = true;
    root.schirm("scStart");
    if (root.renderStart) root.renderStart();
  }
  const inhalt = () => { seite(); const w = $("satzInhalt"); w.innerHTML = ""; return w; };

  /* ----------------------------------------------------------- Einstellungen */
  function einstellungen() {
    ANSICHT = "auswahl";
    zeigen();
    const w = inhalt();
    const z = zahlen();
    const kopf = el("div", "satz-karte");
    kopf.appendChild(el("h2", null, "Kurzfragen"));
    kopf.appendChild(el("p", "sz-info", z.gesamt + " Fragen aus allen AP1-Themen. Jede Runde dauert etwa fünf Minuten. " +
      "Neue und wackelige Fragen kommen zuerst."));
    const leiste = el("div", "sz-balken");
    [["gut", z.gut], ["halb", z.halb], ["nicht", z.nicht]].forEach(([k, n]) => { if (!n) return; const s = el("span", "sz-" + k); s.style.width = (n / z.gesamt * 100) + "%"; leiste.appendChild(s); });
    kopf.appendChild(leiste);
    kopf.appendChild(el("p", "sz-zahlen", z.gut + " sitzen · " + z.halb + " halb · " + z.nicht + " nicht gewusst · " + z.neu + " neu"));
    w.appendChild(kopf);

    const k = el("div", "satz-karte");
    k.appendChild(el("h3", "sz-h", "Wie üben?"));
    const modi = el("div", "sz-modi");
    Object.keys(MODI).forEach(m => {
      const b = el("button", "sz-modus" + (EIN.modus === m ? " an" : "")); b.type = "button";
      b.appendChild(el("span", "sz-ikon", MODI[m].ikon));
      const t = el("span", "sz-mt"); t.appendChild(el("b", null, MODI[m].name)); t.appendChild(el("span", null, MODI[m].info));
      b.appendChild(t);
      b.onclick = () => { EIN.modus = m; einMerken(); einstellungen(); };
      modi.appendChild(b);
    });
    k.appendChild(modi);

    k.appendChild(el("h3", "sz-h", "Wie viele?"));
    const anz = el("div", "sz-chips");
    [6, 10, 15, 20].forEach(n => {
      const c = el("button", "sz-chip" + (EIN.anzahl === n ? " an" : ""), n + " Fragen"); c.type = "button";
      c.onclick = () => { EIN.anzahl = n; einMerken(); einstellungen(); };
      anz.appendChild(c);
    });
    k.appendChild(anz);

    k.appendChild(el("h3", "sz-h", "Welche Themen?"));
    const th = el("div", "sz-chips");
    const alle = el("button", "sz-chip" + (!EIN.themen.length ? " an" : ""), "alle"); alle.type = "button";
    alle.onclick = () => { EIN.themen = []; einMerken(); einstellungen(); };
    th.appendChild(alle);
    THEMEN().forEach(t => {
      const L = POOL().filter(x => x.thema === t), zt = zahlen(L);
      const c = el("button", "sz-chip" + (EIN.themen.includes(t) ? " an" : "")); c.type = "button";
      c.appendChild(document.createTextNode(t + " "));
      c.appendChild(el("small", null, zt.gut + "/" + zt.gesamt));
      c.onclick = () => {
        const i = EIN.themen.indexOf(t);
        if (i >= 0) EIN.themen.splice(i, 1); else EIN.themen.push(t);
        einMerken(); einstellungen();
      };
      th.appendChild(c);
    });
    k.appendChild(th);

    k.appendChild(el("h3", "sz-h", "Reihenfolge"));
    const fo = el("div", "sz-chips");
    [["wackelig", "Neu & wackelig zuerst"], ["nurWackelig", "nur wackelige (" + (z.halb + z.nicht) + ")"], ["zufall", "zufällig"]].forEach(([key, t]) => {
      const c = el("button", "sz-chip" + (EIN.folge === key ? " an" : ""), t); c.type = "button";
      c.onclick = () => { EIN.folge = key; einMerken(); einstellungen(); };
      fo.appendChild(c);
    });
    k.appendChild(fo);

    const los = el("div", "gen-knopfzeile sz-los");
    const lb = el("button", "btn primary", "Los: " + EIN.anzahl + " Fragen · " + MODI[EIN.modus].name); lb.type = "button";
    lb.onclick = () => starten(null, {});
    const zb = el("button", "btn ghost", "zur Startseite"); zb.type = "button"; zb.onclick = zurueck;
    los.append(lb, zb);
    k.appendChild(los);
    w.appendChild(k);

    /* Themenübersicht */
    const ue = el("div", "satz-karte");
    ue.appendChild(el("h3", "sz-h", "Stand nach Themen"));
    const ul = el("ul", "sz-themen");
    THEMEN().forEach(t => {
      const L = POOL().filter(x => x.thema === t), zt = zahlen(L);
      const li = el("li");
      const b = el("button", "sz-thema-b"); b.type = "button";
      b.appendChild(el("span", "sz-tn", t));
      const bar = el("span", "sz-balken klein");
      [["gut", zt.gut], ["halb", zt.halb], ["nicht", zt.nicht]].forEach(([kk, n]) => { if (!n) return; const s = el("span", "sz-" + kk); s.style.width = (n / zt.gesamt * 100) + "%"; bar.appendChild(s); });
      b.appendChild(bar);
      b.appendChild(el("span", "sz-tz", zt.gut + "/" + zt.gesamt));
      b.onclick = () => starten(null, { themen: [t] });
      li.appendChild(b);
      ul.appendChild(li);
    });
    ue.appendChild(ul);
    ue.appendChild(el("p", "sz-klein", "Thema antippen = eine Runde nur zu diesem Thema mit den aktuellen Einstellungen."));
    const rs = el("button", "btn ghost klein", "Fortschritt zurücksetzen"); rs.type = "button";
    rs.onclick = () => { if (confirm("Stand aller Kurzfragen löschen?")) { STAT = {}; merken(); einstellungen(); } };
    ue.appendChild(rs);
    w.appendChild(ue);
  }

  /* -------------------------------------------------------------- Ablauf */
  function starten(ids, opt) {
    const o = Object.assign({}, EIN, opt || {});
    if (ids && ids.length) o.ids = ids;
    const karten = runde(o);
    if (!karten.length) return;
    LAUF = { modus: o.modus, karten, i: 0, erg: [], opt: o };
    ANSICHT = "lauf";
    zeigen();
    karte();
  }

  function kopfLeiste(w) {
    const item = LAUF.karten[LAUF.i];
    const k = el("div", "sz-leiste");
    k.appendChild(el("span", "eyebrow", "Frage " + (LAUF.i + 1) + " von " + LAUF.karten.length + " · " + MODI[LAUF.modus].name));
    k.appendChild(el("span", "thema", item.thema));
    const bar = el("span", "sz-fort"); const i = el("i"); i.style.width = (LAUF.i / LAUF.karten.length * 100) + "%"; bar.appendChild(i);
    k.appendChild(bar);
    w.appendChild(k);
  }

  function erklaerung(item, ziel, offen) {
    const loes = el("details", "gloesung sz-loesung");
    if (offen) loes.open = true;
    loes.appendChild(el("summary", null, "Musterantwort in einfachem Deutsch"));
    loes.appendChild(el("div", "txt satz-muster", item.muster));
    if (item.ru) { const r = el("p", "sz-ru"); r.appendChild(el("b", null, "По-русски: ")); r.appendChild(document.createTextNode(item.ru)); loes.appendChild(r); }
    if (item.tipp) { const t = el("div", "gmerksatz"); t.appendChild(el("b", null, "Worauf es ankommt")); t.appendChild(document.createTextNode(item.tipp)); loes.appendChild(t); }
    ziel.appendChild(loes);
    return loes;
  }

  function knopfZeile(k, weiterText) {
    const zeile = el("div", "gen-knopfzeile sz-knoepfe");
    const weiter = el("button", "btn primary", weiterText || "weiter →"); weiter.type = "button";
    weiter.onclick = () => { LAUF.i++; karte(); root.scrollTo(0, 0); };
    const raus = el("button", "btn ghost", "beenden"); raus.type = "button";
    raus.onclick = () => (LAUF.erg.length ? abschluss() : einstellungen());
    zeile.append(weiter, el("span", "weit"), raus);
    k.appendChild(zeile);
    return weiter;
  }

  function karte() {
    const w = inhalt();
    if (LAUF.i >= LAUF.karten.length) return abschluss();
    kopfLeiste(w);
    const item = LAUF.karten[LAUF.i];
    const k = el("div", "satz-karte");
    k.appendChild(el("div", "satz-frage", item.frage));
    if (LAUF.modus === "auswahl") karteAuswahl(item, k);
    else if (LAUF.modus === "aufdecken") karteAufdecken(item, k);
    else karteSchreiben(item, k);
    w.appendChild(k);
  }

  /* ---------------------------------------------------------- Schreiben */
  function karteSchreiben(item, k) {
    const stich = el("div", "satz-stich");
    stich.appendChild(el("span", "eyebrow", "So schreibst du es oft"));
    stich.appendChild(el("b", null, "„" + item.stichwort + "“"));
    const a = el("div", "satz-auftrag");
    a.innerHTML = "Mach daraus eine vollständige Antwort. Sag, <b>was</b> gemeint ist und <b>warum</b> das wichtig ist. Zwei bis drei kurze Sätze reichen.";
    stich.appendChild(a);
    k.appendChild(stich);

    const ta = el("textarea", "sz-eingabe");
    ta.rows = 5; ta.id = "satzEingabe";
    ta.placeholder = "Zum Beispiel: Die Festplatte wird verschlüsselt. Dadurch …";
    k.appendChild(ta);

    const chips = el("div", "satz-chips");
    chips.appendChild(el("span", "eyebrow", "Satzmuster einfügen"));
    MUSTER().forEach(m => {
      const c = el("button", "satz-chip", m); c.type = "button";
      c.addEventListener("mousedown", ev => ev.preventDefault());
      c.onclick = () => { const t = ta.value.trim(); ta.value = (t ? t + " " : "") + m.replace(/…/g, "").trim() + " "; ta.focus(); };
      chips.appendChild(c);
    });
    k.appendChild(chips);

    const zeile = el("div", "gen-knopfzeile sz-knoepfe");
    const pruefen = el("button", "btn primary", "Prüfen"); pruefen.type = "button";
    const zeigenL = el("button", "btn ghost", "Musterantwort"); zeigenL.type = "button";
    const raus = el("button", "btn ghost", "beenden"); raus.type = "button";
    raus.onclick = () => (LAUF.erg.length ? abschluss() : einstellungen());
    zeile.append(pruefen, zeigenL, el("span", "weit"), raus);
    k.appendChild(zeile);
    const rueck = el("div"); rueck.id = "satzRueck";
    k.appendChild(rueck);
    const loes = erklaerung(item, k, false);
    zeigenL.onclick = () => { loes.open = true; loes.scrollIntoView({ block: "nearest", behavior: "smooth" }); };

    pruefen.onclick = () => {
      const erg = bewerte(item, ta.value);
      zeigeRueck(item, erg, rueck, ta);
      if (erg.leer) return;
      const s = STAT[item.id] || {};
      eintragen(item.id, { versuche: (s.versuche || 0) + 1, bestPunkte: Math.max(s.bestPunkte || 0, erg.punkte), letzte: erg.punkte,
        stand: erg.punkte >= 2 ? "gut" : erg.punkte >= 1 ? "halb" : "nicht" });
      LAUF.erg[LAUF.i] = { id: item.id, punkte: erg.punkte, max: 2 };
      zeile.hidden = true;
      loes.open = true;
      /* „Prüfen lassen“: Kurzcheck und Claude (gen/pruefen.js) */
      if (root.GENPRUEFEN) {
        try { rueck.appendChild(root.GENPRUEFEN.kasten({ frage: item.frage, loesung: item.muster, hinweis: item.tipp, punkte: 2, antwort: () => ta.value })); } catch (e) { }
      }
      if (erg.punkte < 2) {
        const gl = el("button", "sz-link", "Meine Antwort war inhaltlich gleichwertig → als gewusst zählen"); gl.type = "button";
        gl.onclick = () => {
          eintragen(item.id, { bestPunkte: 2, letzte: 2, stand: "gut" });
          LAUF.erg[LAUF.i].punkte = 2; LAUF.erg[LAUF.i].selbst = true;
          gl.replaceWith(el("p", "sz-klein", "✓ als gewusst gezählt."));
        };
        rueck.appendChild(gl);
      }
      knopfZeile(k, LAUF.i + 1 < LAUF.karten.length ? "weiter →" : "Ergebnis");
      setTimeout(() => { try { rueck.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (e) { } }, 60);
    };
    setTimeout(() => { try { ta.focus({ preventScroll: true }); } catch (e) { } }, 50);
  }

  function zeigeRueck(item, erg, ziel, ta) {
    ziel.innerHTML = "";
    ta.classList.remove("richtig", "falsch", "teil");
    if (erg.leer) { ziel.appendChild(el("div", "grueck")).appendChild(el("span", "mittel", "Da steht noch nichts.")); return; }
    ta.classList.add(erg.punkte >= 2 ? "richtig" : (erg.punkte > 0 ? "teil" : "falsch"));
    const box = el("div", "satz-rueck");
    const kopf = el("div", "satz-punkte");
    kopf.appendChild(el("b", null, window.GEN.fmt.kurz(erg.punkte) + " von 2 BE "));
    kopf.appendChild(el("span", erg.punkte >= 2 ? "gut" : erg.punkte >= 1 ? "mittel" : "schlecht",
      erg.punkte >= 2 ? "— so würde das in der Prüfung zählen." : erg.punkte >= 1 ? "— der Kern stimmt, es fehlt noch etwas." : "— das reicht noch nicht."));
    box.appendChild(kopf);
    const liste = el("ul", "satz-kriterien");
    const zeile = (ok, gut, schlecht) => { liste.appendChild(el("li", ok ? "ja" : "nein", (ok ? "✓ " : "✗ ") + (ok ? gut : schlecht))); };
    erg.begriffe.forEach(b => zeile(b.ok, "Fachbegriff „" + b.soll + "“ steht drin", "Fachbegriff fehlt: „" + b.soll + "“ — ohne ihn gibt es keinen Punkt"));
    if (!item.ohneBegruendung) zeile(erg.konnektor, "Du erklärst den Zusammenhang",
      "Es fehlt die Begründung — ergänze „weil …“, „Dadurch …“ oder einen zweiten Satz, der erklärt");
    zeile(erg.langGenug, "Länge passt (" + erg.worte + " Wörter)", "Zu kurz: " + erg.worte + " Wörter. Für zwei Punkte brauchst du etwa " + erg.minW + ".");
    zeile(erg.ganzerSatz, "Ganzer Satz mit Punkt am Ende", "Schreib einen ganzen Satz: groß anfangen, Punkt am Ende");
    box.appendChild(liste);
    ziel.appendChild(box);
  }

  /* ----------------------------------------------------------- Auswählen */
  function karteAuswahl(item, k) {
    k.appendChild(el("p", "sz-auftrag", "Welche Antwort bekommt in der Prüfung volle Punkte (2 BE)?"));
    const opts = optionen(item);
    const ul = el("div", "sz-optionen");
    let fertig = false;
    opts.forEach((o, i) => {
      const b = el("button", "sz-option"); b.type = "button";
      b.appendChild(el("span", "sz-buchst", "ABCD"[i]));
      b.appendChild(el("span", "sz-otext", o.text));
      b.onclick = () => {
        if (fertig) return;
        fertig = true;
        const richtig = o.be === 2;
        const s = STAT[item.id] || {};
        eintragen(item.id, { wahlN: (s.wahlN || 0) + 1, wahlOk: (s.wahlOk || 0) + (richtig ? 1 : 0),
          stand: richtig ? (stand(item.id) === "nicht" ? "halb" : (stand(item.id) === "neu" ? "halb" : stand(item.id))) : "nicht" });
        LAUF.erg[LAUF.i] = { id: item.id, ok: richtig };
        Array.from(ul.children).forEach((x, j) => {
          const oo = opts[j];
          x.classList.add(oo.be === 2 ? "voll" : oo.be >= 1 ? "halb" : "null");
          if (x === b) x.classList.add("gewaehlt");
          x.disabled = true;
          const w = el("span", "sz-warum");
          w.appendChild(el("b", null, (oo.be === 2 ? "2 BE" : oo.be === 1 ? "≈ 1 BE" : oo.be === 0.5 ? "≈ 0,5 BE" : "0 BE") + " — "));
          w.appendChild(document.createTextNode(oo.warum));
          x.appendChild(w);
        });
        const m = el("p", richtig ? "sz-urteil ok" : "sz-urteil nein", richtig ? "✓ Richtig — das ist die Antwort mit vollen Punkten." : "✗ Nicht ganz — die volle Antwort ist grün markiert.");
        k.insertBefore(m, ul.nextSibling);
        if (item.ru) { const r = el("p", "sz-ru"); r.appendChild(el("b", null, "По-русски: ")); r.appendChild(document.createTextNode(item.ru)); k.appendChild(r); }
        if (item.tipp) { const t = el("div", "gmerksatz"); t.appendChild(el("b", null, "Worauf es ankommt")); t.appendChild(document.createTextNode(item.tipp)); k.appendChild(t); }
        knopfZeile(k, LAUF.i + 1 < LAUF.karten.length ? "weiter →" : "Ergebnis");
      };
      ul.appendChild(b);
    });
    k.appendChild(ul);
    const zeile = el("div", "gen-knopfzeile sz-knoepfe");
    const raus = el("button", "btn ghost", "beenden"); raus.type = "button";
    raus.onclick = () => (LAUF.erg.length ? abschluss() : einstellungen());
    zeile.append(el("span", "weit"), raus);
    k.appendChild(zeile);
  }

  /* ----------------------------------------------------------- Aufdecken */
  function karteAufdecken(item, k) {
    const hin = el("p", "sz-auftrag", "Antworte im Kopf oder laut: Was ist gemeint — und warum ist das wichtig?");
    k.appendChild(hin);
    const zeig = el("button", "btn primary sz-zeig", "Musterantwort zeigen"); zeig.type = "button";
    k.appendChild(zeig);
    const zeile = el("div", "gen-knopfzeile sz-knoepfe");
    const raus = el("button", "btn ghost", "beenden"); raus.type = "button";
    raus.onclick = () => (LAUF.erg.length ? abschluss() : einstellungen());
    zeile.append(el("span", "weit"), raus);
    k.appendChild(zeile);
    zeig.onclick = () => {
      zeig.remove(); hin.remove();
      erklaerung(item, k, true);
      k.insertBefore(k.lastChild, zeile);
      const f = el("p", "sz-auftrag", "Wie war es?");
      k.insertBefore(f, zeile);
      const r = el("div", "wd-bewerten sz-selbst");
      [["nicht", "Nicht gewusst"], ["halb", "Halb"], ["gut", "Gewusst"]].forEach(([wert, t]) => {
        const b = el("button", "wd-b b-" + wert); b.type = "button";
        b.appendChild(el("b", null, t));
        b.onclick = () => {
          const s = STAT[item.id] || {};
          eintragen(item.id, { stand: wert, versuche: s.versuche || 0 });
          LAUF.erg[LAUF.i] = { id: item.id, selbst: wert };
          LAUF.i++; karte(); root.scrollTo(0, 0);
        };
        r.appendChild(b);
      });
      k.insertBefore(r, zeile);
    };
  }

  /* ----------------------------------------------------------- Abschluss */
  function abschluss() {
    ANSICHT = "ende";
    const w = inhalt();
    const E = LAUF.erg.filter(Boolean);
    const k = el("div", "satz-karte");
    k.appendChild(el("h2", null, "Fertig"));
    let proz = 0, zeile2 = "";
    if (LAUF.modus === "schreiben") {
      const p = E.reduce((s, e) => s + (e.punkte || 0), 0), m = E.reduce((s, e) => s + (e.max || 0), 0);
      proz = m ? Math.round(p / m * 100) : 0;
      zeile2 = window.GEN.fmt.kurz(p) + " von " + m + " BE";
    } else if (LAUF.modus === "auswahl") {
      const ok = E.filter(e => e.ok).length; proz = E.length ? Math.round(ok / E.length * 100) : 0;
      zeile2 = ok + " von " + E.length + " richtig erkannt";
    } else {
      const g = E.filter(e => e.selbst === "gut").length, h = E.filter(e => e.selbst === "halb").length;
      proz = E.length ? Math.round((g + h / 2) / E.length * 100) : 0;
      zeile2 = g + " gewusst · " + h + " halb · " + (E.length - g - h) + " nicht gewusst";
    }
    const hero = el("div", "hero");
    const a = el("div"); a.appendChild(el("span", "eyebrow", "Ergebnis")); a.appendChild(el("div", "zahl", proz + " %"));
    const b = el("div"); b.appendChild(el("span", "eyebrow", MODI[LAUF.modus].name)); b.appendChild(el("div", "neben", zeile2));
    hero.append(a, b);
    hero.appendChild(el("div", "txt", proz >= 80
      ? "Das ist Prüfungsniveau. Morgen die nächste Runde — die Formulierungen sollen ohne Nachdenken kommen."
      : proz >= 50
        ? "Der Kern sitzt oft, die Begründung fehlt noch. Merksatz: nach jedem Fachbegriff ein „weil“ oder „dadurch“."
        : "Genau hier liegen viele Punkte. Lies die Musterantworten der roten Fragen und mach die Runde gleich noch einmal."));
    k.appendChild(hero);
    const ul = el("ul", "sz-ergliste");
    LAUF.karten.forEach((x, i) => {
      const e = LAUF.erg[i];
      const st = !e ? "offen" : e.punkte != null ? (e.punkte >= 2 ? "gut" : e.punkte >= 1 ? "halb" : "nicht") : e.ok != null ? (e.ok ? "gut" : "nicht") : e.selbst;
      const li = el("li", "sz-e-" + st);
      li.appendChild(el("span", "sz-e-p", st === "gut" ? "✓" : st === "halb" ? "½" : st === "offen" ? "–" : "✗"));
      li.appendChild(el("span", null, x.frage));
      ul.appendChild(li);
    });
    k.appendChild(ul);
    const falsch = LAUF.karten.filter((x, i) => { const e = LAUF.erg[i]; return e && !(e.punkte >= 2 || e.ok || e.selbst === "gut"); });
    const z = el("div", "gen-knopfzeile");
    const neu = el("button", "btn primary", "Noch eine Runde"); neu.type = "button";
    neu.onclick = () => starten(null, { modus: LAUF.modus, anzahl: LAUF.opt.anzahl, themen: LAUF.opt.themen, folge: LAUF.opt.folge });
    z.appendChild(neu);
    if (falsch.length) {
      const nf = el("button", "btn", "Die " + falsch.length + " nicht sicheren nochmal schreiben"); nf.type = "button";
      nf.onclick = () => starten(falsch.map(x => x.id), { modus: "schreiben", anzahl: falsch.length });
      z.appendChild(nf);
    }
    const ei = el("button", "btn ghost", "Einstellungen"); ei.type = "button"; ei.onclick = einstellungen;
    const zu = el("button", "btn ghost", "zur Startseite"); zu.type = "button"; zu.onclick = zurueck;
    z.append(ei, zu);
    k.appendChild(z);
    w.appendChild(k);
    root.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------ Einhängen */
  function einhaengen() {
    seite();
    const altSchirm = window.schirm;
    if (typeof altSchirm === "function" && !altSchirm.__sz) {
      const neu = function (name) {
        if (name === "scSatz") { if (ANSICHT === "lauf" && LAUF) { zeigen(); karte(); } else einstellungen(); return; }
        const s = $("scSatz"); if (s) s.hidden = true;
        return altSchirm.apply(this, arguments);
      };
      neu.__sz = true; window.schirm = neu;
    }
    const altStart = window.renderStart;
    if (typeof altStart === "function" && !altStart.__sz) {
      const neu = function () {
        const r = altStart.apply(this, arguments);
        try { startBox(); } catch (e) { console.error("Kurzfragen:", e); }
        return r;
      };
      neu.__sz = true; window.renderStart = neu;
    }
    if (root.MutationObserver) {
      new MutationObserver(muts => {
        const k = $("scSatz");
        if (!k || k.hidden) return;
        for (const m of muts) {
          const z = m.target;
          if (z !== k && z.id && /^sc/.test(z.id) && z.classList && (z.classList.contains("seite") || z.classList.contains("blatt")) && !z.hidden) { k.hidden = true; return; }
        }
      }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
    }
    try { startBox(); } catch (e) { console.error("Kurzfragen:", e); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  /** von außen (Fehler wiederholen): gut | halb | nicht */
  function setzeStand(id, wert) { if (["gut", "halb", "nicht"].includes(wert)) eintragen(id, { stand: wert }); }

  return { starten, startBox, bewerte, einstellungen, optionen, runde, stand, zahlen, wackelig, setzeStand,
           get STAT() { return STAT; } };
})();
