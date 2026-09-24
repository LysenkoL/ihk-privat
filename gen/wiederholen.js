/* ============================================================================
   gen/wiederholen.js — alle Fehler an einem Ort, mit Wiederholung
   ----------------------------------------------------------------------------
   Punkte gehen an fünf Stellen verloren, und jede Stelle merkt es sich für
   sich: die echten Prüfungen (eigene Bewertung unter voller Punktzahl), der
   Azubi-Navigator, der Generator (Fehlerjournal), die Karteikarten („nicht
   gewusst“ öfter als „gewusst“) und der Prüfungskatalog („unsicher“).
   Zurück zu einem Fehler führte bisher nichts.

   Hier landen sie in EINER Schlange. Jeden Tag ist ein Teil davon fällig —
   die teuersten zuerst. Eine Karte: Aufgabe lesen, im Kopf oder kurz
   schriftlich antworten, Lösung aufdecken, ehrlich einordnen:

       nicht gewusst  → morgen wieder, von vorn
       halb           → morgen wieder
       gewusst        → in 2 Tagen wieder; zweimal hintereinander gewusst → raus

   Nichts wird über den Tag vor der Prüfung hinaus verschoben. Wer eine
   Aufgabe im Original später voll bewertet, ist sie hier automatisch los.

   Speicher: ihk2:wieder — wandert mit dem Export auf andere Geräte.
   ========================================================================== */
"use strict";

(function (root) {
  const hatDom = typeof document !== "undefined";
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const ik = (n, g) => root.GENIKON ? root.GENIKON.svg(n, g || 16) : "";

  const SK = "ihk2:wieder";
  const PRO_SITZUNG = 10;
  const lies = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };

  let S = Object.assign({ k: {}, tage: {} }, lies(SK, {}));
  const sichern = () => schreib(SK, S);

  /* ------------------------------------------------------------ Datum --- */
  const tag0 = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const termin = () => (root.GENSTART && root.GENSTART.TERMIN) || new Date(2026, 8, 30);
  const heuteIso = () => iso(new Date());
  /** Heute + n Tage, aber nie später als der Tag vor der Prüfung */
  function plusTage(n, jetzt) {
    const d = tag0(jetzt || new Date());
    d.setDate(d.getDate() + n);
    const t = tag0(termin()); t.setDate(t.getDate() - 1);
    if (tag0(jetzt || new Date()) < t && d > t) return iso(t);
    return iso(d);
  }

  /* ======================================================================
     Einordnen — reine Funktion (tests/wiederholen.test.js)
     ====================================================================== */
  /** neuer Stand nach einer Antwort: wert = "nicht" | "halb" | "gut" */
  function naechster(st, wert, jetzt) {
    const n = Object.assign({ l: 0, n: 0 }, st || {});
    n.n++;
    n.t = (jetzt || new Date()).getTime();
    if (wert === "gut") {
      n.l = (n.l || 0) + 1;
      if (n.l >= 2) { n.raus = 1; delete n.f; }
      else n.f = plusTage(2, jetzt);
    } else if (wert === "halb") {
      n.f = plusTage(1, jetzt);
    } else {
      n.l = 0;
      n.f = plusTage(1, jetzt);
    }
    return n;
  }

  const QUELLEN = {
    ihk: { name: "Prüfung IHK", rang: 0 },
    azubi: { name: "Azubi-Navigator", rang: 1 },
    gen: { name: "Generator", rang: 2 },
    katalog: { name: "Katalog", rang: 3 },
    karte: { name: "Karteikarte", rang: 4 }
  };
  const prio = (a, b) => (b.verlust - a.verlust) || (QUELLEN[a.quelle].rang - QUELLEN[b.quelle].rang) ||
    (a.id < b.id ? -1 : 1);

  /* ======================================================================
     Quellen einsammeln
     ====================================================================== */
  const text = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

  function ihkName(it) {
    const m = (it.exam && it.exam.meta) || {};
    const fl = String(it.fullLabel || it.label || "");
    const nr = /^\d/.test(fl) ? fl : ((it.task && it.task.number) ? it.task.number + " " : "") + fl;
    return (m.season || "") + " " + (m.year || "") + " · " + nr;
  }

  function kandidaten() {
    const out = [];
    /* 1. echte Prüfungen: eigene Bewertung unter der vollen Punktzahl */
    try {
      if (typeof ALLE !== "undefined" && typeof SCORES !== "undefined") {
        ALLE.forEach(it => {
          const s = SCORES[it.k], max = it.maxPoints || 0;
          if (s == null || !max || s >= max) return;
          if ((it.katalog || {}).status === "veraltet") return;
          out.push({ id: "ihk:" + it.k, quelle: "ihk", verlust: max - s, it,
                     titel: String(it.prompt || "").replace(/\s+/g, " ").slice(0, 90), wo: ihkName(it),
                     punkte: s + " / " + max + " P." });
        });
      }
    } catch (e) { console.error("Wiederholen/IHK:", e); }
    /* 2. Azubi-Navigator */
    try {
      const A = root.GENAZUBI, P = A && A.paket();
      if (P) P.module.forEach(m => {
        const z = A.zustand(m.id);
        A.teileVon(m).forEach(t => {
          const p = z.p[t.id];
          if (p == null || p >= (t.punkte || 0)) return;
          out.push({ id: "az:" + m.id + ":" + t.id, quelle: "azubi", verlust: (t.punkte || 0) - p, mid: m.id, tid: t.id,
                     titel: text(t.titel), wo: m.kurz + " · " + t.nr + " " + t.label,
                     punkte: p + " / " + t.punkte + " P.", leer: !A.hatAntwort(t, z.a[t.id]) });
        });
      });
    } catch (e) { console.error("Wiederholen/Azubi:", e); }
    /* 3. Generator (Fehlerjournal) */
    try {
      const F = root.GENFEHLER;
      if (F) F.liste().forEach(e => {
        if (e.quelle !== "gen" || e.erledigt) return;
        out.push({ id: "gen:" + e.schluessel, quelle: "gen", verlust: Math.max(0.5, (e.be || 0) - (e.erreicht || 0)), e,
                   titel: e.titel || "Generator-Aufgabe", wo: "Generator" + (e.thema ? " · " + e.thema : ""),
                   punkte: (e.erreicht || 0) + " / " + (e.be || 0) + " BE" });
      });
    } catch (e) { console.error("Wiederholen/Generator:", e); }
    /* 4. Prüfungskatalog: selbst als „unsicher“ markiert */
    try {
      const K = root.GENKATALOG, d = K && K.daten();
      if (d) d.A.punkte.forEach(p => {
        if (K.standVon(p.id) !== 1) return;
        out.push({ id: "kat:" + p.id, quelle: "katalog", verlust: 1.5, p, kreis: (d.kreisVon[p.kreis] || {}).titel || "",
                   titel: p.text, wo: "Katalog " + p.id, punkte: "unsicher" });
      });
    } catch (e) { console.error("Wiederholen/Katalog:", e); }
    /* 5. Karteikarten: öfter nicht gewusst als gewusst */
    try {
      if (typeof CARDS !== "undefined" && typeof KKSTAT !== "undefined" && typeof root.kkKey === "function") {
        CARDS.forEach(c => {
          const st = KKSTAT[root.kkKey(c)];
          if (!st || (st.falsch || 0) <= (st.richtig || 0)) return;
          out.push({ id: "kk:" + root.kkKey(c), quelle: "karte", verlust: 1, c,
                     titel: String(c.vorne || "").slice(0, 90), wo: "Karteikarte · " + (c.jahr || ""),
                     punkte: st.falsch + "× nicht gewusst" });
        });
      }
    } catch (e) { console.error("Wiederholen/Karten:", e); }
    return out;
  }

  /** Die ganze Schlange (ohne „raus“), mit Fälligkeit */
  function liste() {
    const h = heuteIso();
    return kandidaten().map(x => {
      const st = S.k[x.id] || null;
      x.st = st;
      x.faellig = st && st.f ? st.f : h;
      x.neu = !st;
      return x;
    }).filter(x => !(x.st && x.st.raus)).sort(prio);
  }
  function faellig() { const h = heuteIso(); return liste().filter(x => x.faellig <= h); }
  function heuteGeschafft() { return S.tage[heuteIso()] || 0; }
  function heuteErledigt() { return faellig().length === 0 || heuteGeschafft() >= PRO_SITZUNG; }
  function raus(id) { S.k[id] = Object.assign({}, S.k[id] || {}, { raus: 1, t: Date.now() }); sichern(); }

  /* ======================================================================
     Oberfläche
     ====================================================================== */
  let SITZ = null;          /* { items, i, auf, zaehl: {gut, halb, nicht} } */
  let VIEW = "sitzung";
  let herkunft = "scStart";

  function seite() {
    let s = $("scWieder");
    if (s) return s;
    s = el("div", "seite wd-seite"); s.id = "scWieder"; s.hidden = true;
    const start = $("scStart");
    if (start && start.parentNode) start.parentNode.insertBefore(s, start.nextSibling);
    else document.body.appendChild(s);
    s.addEventListener("click", ev => {
      const img = ev.target.closest && ev.target.closest("img.wd-bild, img.az-bild");
      if (img && typeof root.zeigeLupe === "function") root.zeigeLupe(img.src);
    });
    return s;
  }

  function zeigen() {
    const s = seite();
    const vorher = ["scBogen", "scAuswertung", "scKatalog", "scAzubi"].find(id => $(id) && !$(id).hidden) || "scStart";
    if (vorher !== "scWieder") herkunft = vorher;
    document.querySelectorAll("div.seite[id^='sc'], #scBogen").forEach(e => { if (e.id !== "scWieder") e.hidden = true; });
    s.hidden = false;
    const f = $("fuss"); if (f) f.hidden = true;
    const kt = $("kopfTitel"); if (kt) kt.hidden = false;
    if ($("kTitel")) $("kTitel").textContent = "Fehler wiederholen";
    if ($("kEyebrow")) $("kEyebrow").textContent = "alle Quellen · eine Schlange";
    if (root.GENZURUECK) {
      try { root.GENZURUECK.hoeher && root.GENZURUECK.hoeher("scWieder", "scStart"); } catch (e) { }
      try { root.GENZURUECK.knopfPflegen(); } catch (e) { }
    }
    try {
      if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: herkunft }, "");
      if (history.state.seite !== "scWieder") history.pushState({ ihk: 1, seite: "scWieder" }, "", location.hash || "");
    } catch (e) { }
  }

  /** Einstieg: eine Sitzung mit den heute fälligen (oder einer bestimmten Auswahl) */
  function starten(auswahl) {
    const los = () => {
      const items = auswahl || faellig().slice(0, PRO_SITZUNG);
      SITZ = { items: items.slice(), i: 0, auf: false, zaehl: { gut: 0, halb: 0, nicht: 0 }, nochmal: {} };
      VIEW = "sitzung";
      zeichnen(); zeigen(); root.scrollTo(0, 0);
    };
    const A = root.GENAZUBI;
    if (A && A.laden && !auswahl) A.laden().then(los, los); else los();
  }
  function listeZeigen() {
    const los = () => { VIEW = "liste"; zeichnen(); zeigen(); root.scrollTo(0, 0); };
    const A = root.GENAZUBI;
    if (A && A.laden) A.laden().then(los, los); else los();
  }

  function zeichnen() {
    const s = seite();
    s.innerHTML = "";
    const box = el("div", "wd-wrap");
    s.appendChild(box);
    if (VIEW === "liste") listeZeichnen(box);
    else if (!SITZ || !SITZ.items.length) leerZeichnen(box);
    else if (SITZ.i >= SITZ.items.length) endeZeichnen(box);
    else karteZeichnen(box);
  }

  /* -------------------------------------------------------------- Karte -- */
  function kopfLeiste(box) {
    const l = el("div", "wd-leiste");
    const n = SITZ.items.length;
    l.appendChild(el("b", null, "Fehler wiederholen"));
    l.appendChild(el("span", "wd-zahl", Math.min(SITZ.i + 1, n) + " / " + n));
    const bar = el("span", "wd-bar");
    const i = el("i"); i.style.width = (n ? SITZ.i / n * 100 : 0) + "%";
    bar.appendChild(i);
    l.appendChild(bar);
    box.appendChild(l);
  }

  function frageTeil(x, ziel) {
    const f = el("div", "wd-frage");
    if (x.quelle === "ihk") {
      const it = x.it;
      if (it.groupIntro) f.appendChild(el("p", "wd-intro", it.groupIntro));
      f.appendChild(el("div", "wd-text", it.prompt || ""));
      (it.assets || []).slice(0, 3).forEach(a => {
        if (!a || !a.file) return;
        const img = el("img", "wd-bild"); img.src = a.file; img.alt = ""; img.loading = "lazy";
        f.appendChild(img);
      });
    } else if (x.quelle === "azubi") {
      const v = root.GENAZUBI && root.GENAZUBI.ansicht(x.mid, x.tid);
      if (v) { f.appendChild(v.frage); x._loesung = v.loesung; }
      else f.appendChild(el("p", "wd-text", "Das Azubi-Paket ist auf diesem Gerät nicht geladen."));
    } else if (x.quelle === "gen") {
      const e = x.e;
      f.appendChild(el("p", "wd-text", (e.thema ? e.thema + ": " : "") + (e.titel || "")));
      if (e.feld) f.appendChild(el("p", "wd-sub", "Falsch war: " + e.feld));
      if (e.meine) f.appendChild(el("p", "wd-sub", "Deine Antwort damals: " + e.meine));
      const neu = el("button", "btn klein", "Dieselbe Aufgabe noch einmal rechnen");
      neu.type = "button";
      neu.onclick = () => {
        if (!root.GENUI || !e.vorlageId) return;
        root.GENUI.erzeugeBlatt({ liste: [{ vorlageId: e.vorlageId, saat: e.saat != null ? e.saat : Number(String(e.schluessel).split("|")[2]) }],
                                  titel: "Wiederholen: " + (e.titel || ""), zeit: 1 });
      };
      if (e.vorlageId) f.appendChild(neu);
    } else if (x.quelle === "katalog") {
      f.appendChild(el("p", "wd-text", "Erkläre in zwei, drei einfachen Sätzen: „" + x.p.text + "“"));
      if (x.kreis) f.appendChild(el("p", "wd-sub", "Themenkreis " + x.p.kreis + " · " + x.kreis));
    } else if (x.quelle === "karte") {
      f.appendChild(el("p", "wd-text", x.c.vorne || ""));
    }
    ziel.appendChild(f);
  }

  function loesungTeil(x, ziel) {
    const l = el("div", "wd-loesung");
    l.appendChild(el("h5", null, "Lösung"));
    if (x.quelle === "ihk") {
      const t = ((x.it.solution || {}).text || "").trim();
      l.appendChild(el("div", "wd-text", t || "Zu dieser Aufgabe gibt es keine Musterlösung im Text — im Bogen nachsehen."));
    } else if (x.quelle === "azubi") {
      if (x._loesung) l.appendChild(x._loesung);
    } else if (x.quelle === "gen") {
      const e = x.e;
      if (e.richtig) l.appendChild(el("p", "wd-text", "Richtig: " + e.richtig));
      if (e.hinweis) l.appendChild(el("p", "wd-sub", e.hinweis));
      const g = root.GENFEHLER && e.grund ? (root.GENFEHLER.GRUENDE || []).find(x => x.key === e.grund) : null;
      if (g) l.appendChild(el("p", "wd-sub", "Dein Fehlergrund war „" + g.kurz + "“: " + g.rat));
      if (!e.richtig && !e.hinweis) l.appendChild(el("p", "wd-sub", "Rechne die Aufgabe noch einmal — der Generator prüft sie."));
    } else if (x.quelle === "katalog") {
      l.appendChild(el("p", "wd-text", "Vergleiche mit dem Katalog: dort stehen Aufgaben, Karten und Seiten zum Nachlesen."));
    } else if (x.quelle === "karte") {
      l.appendChild(el("div", "wd-text", x.c.hinten || ""));
    }
    ziel.appendChild(l);
  }

  function originalOeffnen(x) {
    if (x.quelle === "ihk") {
      if (typeof root.oeffnePruefung === "function") {
        root.oeffnePruefung(x.it.exam);
        if (typeof root.springeZu === "function") setTimeout(() => root.springeZu(x.it.k), 80);
      }
    } else if (x.quelle === "azubi") root.GENAZUBI && root.GENAZUBI.oeffnen(x.mid, { ziel: x.tid });
    else if (x.quelle === "katalog") root.GENKATALOG && root.GENKATALOG.oeffnen(x.p.id);
    else if (x.quelle === "gen" && root.GENUI && x.e.vorlageId) {
      root.GENUI.erzeugeBlatt({ liste: [{ vorlageId: x.e.vorlageId, saat: Number(String(x.e.schluessel).split("|")[2]) }], titel: x.e.titel, zeit: 1 });
    }
  }

  function karteZeichnen(box) {
    kopfLeiste(box);
    const x = SITZ.items[SITZ.i];
    const k = el("article", "wd-karte q-" + x.quelle);
    const kopf = el("div", "wd-kopf");
    kopf.appendChild(el("span", "wd-quelle q-" + x.quelle, QUELLEN[x.quelle].name));
    kopf.appendChild(el("span", "wd-wo", x.wo));
    kopf.appendChild(el("span", "wd-verlust", x.quelle === "katalog" || x.quelle === "karte" ? x.punkte : "−" + String(Math.round(x.verlust * 10) / 10).replace(".", ",") + " P."));
    k.appendChild(kopf);
    if (x.quelle === "azubi" || x.quelle === "gen") k.appendChild(el("h3", "wd-titel", x.titel));
    if (x.leer) k.appendChild(el("p", "wd-sub", "Damals leer gelassen."));
    frageTeil(x, k);

    const ta = el("textarea", "wd-antwort");
    ta.rows = 3;
    ta.placeholder = "Antwort kurz aufschreiben (freiwillig, wird nicht gespeichert) — oder im Kopf";
    k.appendChild(ta);

    if (!SITZ.auf) {
      const z = el("button", "btn primary wd-zeig", "Lösung zeigen");
      z.type = "button";
      z.onclick = () => { SITZ.auf = true; SITZ.text = ta.value; zeichnen(); };
      k.appendChild(z);
    } else {
      ta.value = SITZ.text || "";
      loesungTeil(x, k);
      /* Textantwort wie ein Prüfer ansehen lassen (gen/pruefen.js) */
      if (root.GENPRUEFEN && (x.quelle === "ihk" || x.quelle === "azubi")) {
        try {
          let o = null;
          if (x.quelle === "ihk") o = { frage: [x.it.groupIntro, x.it.prompt].filter(Boolean).join("\n"), loesung: (x.it.solution || {}).text, punkte: x.it.maxPoints };
          else { const v = root.GENAZUBI && root.GENAZUBI.ansicht(x.mid, x.tid); if (v) o = { frage: v.t.text, loesung: v.t.loesung, hinweis: v.t.hinweis, punkte: v.t.punkte }; }
          if (o) { o.antwort = () => ta.value; k.appendChild(root.GENPRUEFEN.kasten(o)); }
        } catch (e) { console.error("Wiederholen/Prüfen:", e); }
      }
      const frage = el("p", "wd-frage-satz", "Wie war es?");
      k.appendChild(frage);
      const r = el("div", "wd-bewerten");
      [["nicht", "Nicht gewusst", "morgen wieder"], ["halb", "Halb", "morgen wieder"], ["gut", "Gewusst",
        (x.st && x.st.l >= 1) ? "raus aus der Liste" : "in 2 Tagen"]].forEach(([w, t, u]) => {
        const b = el("button", "wd-b b-" + w);
        b.type = "button";
        b.appendChild(el("b", null, t));
        b.appendChild(el("span", null, u));
        b.onclick = () => bewerten(x, w);
        r.appendChild(b);
      });
      k.appendChild(r);
    }
    const fuss = el("div", "wd-kfuss");
    const orig = el("button", "wd-link", "Im Original öffnen");
    orig.type = "button"; orig.onclick = () => originalOeffnen(x);
    fuss.appendChild(orig);
    const weg = el("button", "wd-link", "Nicht mehr wiederholen");
    weg.type = "button";
    weg.onclick = () => { raus(x.id); SITZ.items.splice(SITZ.i, 1); SITZ.auf = false; zeichnen(); };
    fuss.appendChild(weg);
    const skip = el("button", "wd-link", "Überspringen");
    skip.type = "button";
    skip.onclick = () => { SITZ.i++; SITZ.auf = false; SITZ.text = ""; zeichnen(); root.scrollTo(0, 0); };
    fuss.appendChild(skip);
    k.appendChild(fuss);
    box.appendChild(k);
  }

  function bewerten(x, wert) {
    S.k[x.id] = naechster(S.k[x.id], wert);
    const h = heuteIso();
    S.tage[h] = (S.tage[h] || 0) + 1;
    /* nur die letzten 30 Tage behalten */
    Object.keys(S.tage).sort().slice(0, -30).forEach(k => delete S.tage[k]);
    sichern();
    SITZ.zaehl[wert]++;
    /* Nicht gewusst: am Ende der Sitzung noch einmal — aber nur einmal */
    if (wert === "nicht" && !SITZ.nochmal[x.id]) { SITZ.nochmal[x.id] = 1; SITZ.items.push(x); }
    SITZ.i++; SITZ.auf = false; SITZ.text = "";
    zeichnen();
    root.scrollTo(0, 0);
    blockLeise();
  }

  function leerZeichnen(box) {
    const k = el("div", "wd-karte wd-ende");
    k.appendChild(el("h2", null, "Heute ist nichts fällig"));
    const L = liste();
    k.appendChild(el("p", "wd-sub", L.length ? L.length + " Fehler stehen für die nächsten Tage in der Liste." :
      "Keine offenen Fehler. Sobald du in einer Prüfung, im Azubi-Navigator oder im Generator Punkte verlierst, landen sie hier."));
    const st = el("div", "steuer");
    if (L.length) {
      const b = el("button", "btn", "Trotzdem 10 üben");
      b.type = "button"; b.onclick = () => starten(L.slice(0, PRO_SITZUNG));
      st.appendChild(b);
      const li = el("button", "btn ghost", "Liste ansehen");
      li.type = "button"; li.onclick = listeZeigen;
      st.appendChild(li);
    }
    k.appendChild(st);
    box.appendChild(k);
  }

  function endeZeichnen(box) {
    const z = SITZ.zaehl;
    const k = el("div", "wd-karte wd-ende");
    k.appendChild(el("h2", null, "Geschafft"));
    const r = el("div", "wd-fakten");
    [[z.gut, "gewusst", "gut"], [z.halb, "halb", "halb"], [z.nicht, "nicht gewusst", "nicht"]].forEach(([n, t, c]) => {
      const f = el("div", "wd-fakt " + c); f.appendChild(el("b", null, String(n))); f.appendChild(el("span", null, t)); r.appendChild(f);
    });
    k.appendChild(r);
    const rest = faellig().length;
    k.appendChild(el("p", "wd-sub", rest ? "Heute sind noch " + rest + " fällig." : "Für heute ist alles durch. Die nächsten kommen morgen wieder."));
    const st = el("div", "steuer");
    if (rest) { const b = el("button", "btn primary", "Noch " + Math.min(rest, PRO_SITZUNG)); b.type = "button"; b.onclick = () => starten(); st.appendChild(b); }
    const li = el("button", "btn", "Liste ansehen"); li.type = "button"; li.onclick = listeZeigen; st.appendChild(li);
    const sb = el("button", "btn ghost", "Zur Startseite"); sb.type = "button";
    sb.onclick = () => { if (typeof root.schirm === "function") root.schirm("scStart"); if (typeof root.renderStart === "function") root.renderStart(); };
    st.appendChild(sb);
    k.appendChild(st);
    box.appendChild(k);
  }

  /* -------------------------------------------------------------- Liste -- */
  function listeZeichnen(box) {
    const L = liste();
    const h = heuteIso();
    const kopf = el("div", "wd-karte");
    kopf.appendChild(el("h2", null, "Alle Fehler"));
    kopf.appendChild(el("p", "wd-sub", L.length + " in der Liste · " + L.filter(x => x.faellig <= h).length + " heute fällig · " +
      Object.keys(S.k).filter(k => S.k[k].raus).length + " schon raus. Teuerste zuerst."));
    const st = el("div", "steuer");
    const b = el("button", "btn primary", "Heute wiederholen"); b.type = "button"; b.onclick = () => starten(); st.appendChild(b);
    kopf.appendChild(st);
    box.appendChild(kopf);
    Object.keys(QUELLEN).forEach(q => {
      const teil = L.filter(x => x.quelle === q);
      if (!teil.length) return;
      const sec = el("section", "wd-gruppe");
      const hh = el("h3", null, QUELLEN[q].name);
      hh.appendChild(el("span", "n", String(teil.length)));
      sec.appendChild(hh);
      const ul = el("ul", "wd-liste");
      teil.slice(0, 60).forEach(x => {
        const li = el("li");
        const bt = el("button", "wd-zeile");
        bt.type = "button";
        const t = el("span", "wd-z-t");
        t.appendChild(el("b", null, x.wo));
        t.appendChild(el("span", null, x.titel));
        bt.appendChild(t);
        const rr = el("span", "wd-z-r");
        rr.appendChild(el("span", "wd-verlust", x.quelle === "katalog" || x.quelle === "karte" ? "" : "−" + String(Math.round(x.verlust * 10) / 10).replace(".", ",") + " P."));
        rr.appendChild(el("span", "wd-faellig" + (x.faellig <= h ? " heute" : ""), x.faellig <= h ? "heute" : x.faellig.slice(8, 10) + "." + x.faellig.slice(5, 7) + "."));
        bt.appendChild(rr);
        bt.onclick = () => starten([x]);
        li.appendChild(bt);
        ul.appendChild(li);
      });
      sec.appendChild(ul);
      if (teil.length > 60) sec.appendChild(el("p", "wd-sub", "… und " + (teil.length - 60) + " weitere"));
      box.appendChild(sec);
    });
  }

  /* --------------------------------------------------------- Startseite --- */
  function block() {
    if (!hatDom) return;
    const s = $("scStart");
    if (!s) return;
    let b = $("wiederBox");
    if (!b) { b = el("div", "abschnitt"); b.id = "wiederBox"; s.appendChild(b); }
    b.innerHTML = "";
    b.appendChild(el("h2", null, "Fehler wiederholen"));
    const L = liste();
    const h = heuteIso();
    const due = L.filter(x => x.faellig <= h).length;
    const geschafft = heuteGeschafft();
    b.appendChild(el("p", null, "Alles, wo du Punkte verloren hast — aus Prüfungen, Azubi-Navigator, Generator, Katalog und Karten. " +
      "Gewusst → in 2 Tagen nochmal, zweimal gewusst → raus."));
    const reihe = el("div", "wd-start-reihe");
    const k = (n, t, c) => { const x = el("div", "wd-start-k" + (c ? " " + c : "")); x.appendChild(el("b", null, String(n))); x.appendChild(el("span", null, t)); reihe.appendChild(x); };
    k(due, "heute fällig", due ? "rot" : "");
    k(L.length, "in der Liste");
    k(geschafft, "heute geschafft", geschafft ? "gruen" : "");
    b.appendChild(reihe);
    const st = el("div", "steuer");
    const los = el("button", "btn primary", due ? "Heute wiederholen · ≈ " + Math.max(5, Math.round(Math.min(due, PRO_SITZUNG) * 1.5)) + " Min." : "Liste ansehen");
    los.type = "button"; los.onclick = () => due ? starten() : listeZeigen();
    st.appendChild(los);
    if (due) { const li = el("button", "btn", "Liste"); li.type = "button"; li.onclick = listeZeigen; st.appendChild(li); }
    b.appendChild(st);
    const d = document.querySelector('details.st-block[data-key="wieder"] .st-zahl');
    if (d) d.textContent = due ? due + " fällig" : (L.length ? L.length + " in der Liste" : "");
  }
  let leiseTimer = null;
  function blockLeise() { clearTimeout(leiseTimer); leiseTimer = setTimeout(() => { try { block(); } catch (e) { } }, 50); }

  /* -------------------------------------------------------- Einhängen --- */
  function einhaengen() {
    const altStart = root.renderStart;
    if (typeof altStart === "function" && !altStart.__wd) {
      const neu = function () {
        const r = altStart.apply(this, arguments);
        try { block(); } catch (e) { console.error("Wiederholen:", e); }
        return r;
      };
      neu.__wd = true; root.renderStart = neu;
    }
    const altSchirm = root.schirm;
    if (typeof altSchirm === "function" && !altSchirm.__wd) {
      const neu = function (name) {
        if (name === "scWieder") { zeichnen(); zeigen(); return; }
        const s = $("scWieder"); if (s) s.hidden = true;
        return altSchirm.apply(this, arguments);
      };
      neu.__wd = true; root.schirm = neu;
    }
    if (!root.__wdWache && root.MutationObserver) {
      root.__wdWache = new MutationObserver(muts => {
        const k = $("scWieder");
        if (!k || k.hidden) return;
        for (const m of muts) {
          const z = m.target;
          if (z !== k && z.id && /^sc/.test(z.id) && z.classList &&
              (z.classList.contains("seite") || z.classList.contains("blatt")) && !z.hidden) { k.hidden = true; return; }
        }
      });
      root.__wdWache.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
    }
    try { block(); } catch (e) { console.error("Wiederholen:", e); }
    /* Azubi-Paket und Katalog kommen etwas später dazu */
    setTimeout(() => { try { block(); } catch (e) { } }, 900);
  }

  const api = { starten, listeZeigen, block, liste, faellig, heuteErledigt, heuteGeschafft, naechster, plusTage, kandidaten,
                PRO_SITZUNG, get S() { return S; } };
  root.GENWIEDER = api;
  if (typeof module === "object" && module.exports) module.exports = api;
  if (hatDom) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
    else einhaengen();
  }
})(typeof window !== "undefined" ? window : globalThis);
