/* ============================================================================
   gen/katalog.js — der Prüfungskatalog AP1 als eigener Bereich
   ----------------------------------------------------------------------------
   Der Katalog ist die einzige verbindliche Liste dessen, was in der AP1
   drankommen darf. Bisher stand in der Anwendung nur eine Zusammenfassung aus
   einem Podcast. Jetzt steht er vollständig drin — 7 Fragenkomplexe,
   33 Themenkreise, 167 Stichworte — und zu JEDEM Stichwort steht, was es in
   dieser Anwendung dazu gibt:

     P   Aufgaben aus den zehn echten Prüfungen (und wie viele davon schon
         nach dem neuen Katalog, also ab Frühjahr 2025, gestellt wurden)
     G   Aufgabentypen im Generator (neu würfeln)
     K   Karteikarten
     Ko  Kompendium-Seiten      S  Spickzettel-Kapitel

   Stichworte ohne P, G und K sind „Lücken“: dazu kann man hier nicht üben,
   nur lesen. Jedes Stichwort lässt sich abhaken (offen → unsicher → sitzt);
   der Stand wandert mit dem Export auf andere Geräte (ihk2:katalog:stand).

   Dazu zwei weitere Reiter: „Nicht in AP1“ (was gestrichen oder AP2 ist, mit
   Fundstelle) und „Notationen“ (so zeichnet die ZPA: Netzplan-Knoten,
   Präfixe, UML, Rechnung).

   Umgekehrt bekommt jede Prüfungsaufgabe und jede Karteikarte ein kleines
   Etikett mit ihrer Katalognummer — ein Tipp darauf öffnet die Stelle hier.
   ========================================================================== */
"use strict";

window.GENKATALOG = (function () {
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const ik = (n, g) => window.GENIKON ? window.GENIKON.svg(n, g || 16) : "";
  const K = () => window.IHK_KATALOG_AP1;
  const KERN = () => window.IHKKatalogKern;

  const SK_STAND = "ihk2:katalog:stand";     /* { "03.04.02": 1 | 2 }  */
  const SK_UI = "ihk2:katalog:ui";
  const lies = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };

  let STAND = lies(SK_STAND, {});
  let UI = Object.assign({ tab: "themen", filter: "alle", suche: "", sort: "katalog", komplex: "" }, lies(SK_UI, {}));
  const merkeUI = () => schreib(SK_UI, { tab: UI.tab, filter: UI.filter, sort: UI.sort, komplex: UI.komplex });

  /* „1 eb)“ — bei manchen Bögen fehlt im Label die Aufgabennummer */
  function nrVon(it) {
    const fl = String(it.fullLabel || it.label || "");
    return /^\d/.test(fl) ? fl : ((it.task && it.task.number) ? it.task.number + " " : "") + fl;
  }

  /* ------------------------------------------------------------ Daten --- */
  const strip = h => String(h || "").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ");
  let D = null;       /* berechnete Abdeckung */

  function daten() {
    if (D) return D;
    const Kat = K(), Kern = KERN();
    if (!Kat || !Kern) return null;
    const ab = Kat.neuerKatalogAb || 2025;
    const alle = (typeof ALLE !== "undefined" && ALLE) ? ALLE : [];
    const aufg = alle.filter(it => ((it.katalog || {}).status) !== "veraltet").map(it => ({
      key: it.k, it: it, be: it.maxPoints || 0, jahr: (it.exam.meta || {}).year,
      neu: ((it.exam.meta || {}).year || 0) >= ab,
      text: [it.groupIntro, it.prompt, (it.solution || {}).text].join(" ")
    }));
    const kartenListe = (typeof CARDS !== "undefined" && CARDS) ? CARDS : (window.IHK_CARDS || []);
    const karten = kartenListe.map((c, i) => ({ key: "k" + i, karte: c, text: c.vorne + " " + c.hinten }));
    let vl = [];
    try { vl = window.GEN.alleVorlagen(); } catch (e) { }
    const nichtV = Kat.vorlagenNichtAP1 || {};
    const vorl = vl.filter(v => !nichtV[v.id] && !(v.katalog && v.katalog.status === "veraltet"))
      .map(v => ({ key: v.id, v: v, text: [v.titel, v.sub, v.merksatz].join(" ") }));
    const komp = (window.KOMP_THEMEN || []).map(t => ({ key: t.id, t: t,
      text: [t.titel, t.thema, t.unter, t.notiz, (t.worte || []).join(" ")].join(" ") }));
    const spick = (window.SPICK_KAPITEL || []).map(k => ({ key: k.id, k: k,
      text: k.titel + " " + (k.unter || "") + " " + strip(k.html) }));

    const A = Kern.abdeckung(Kat, { aufg, karten, vorl, komp, spick });
    const kreise = Kern.kreise(Kat);
    const kreisVon = {}; kreise.forEach(k => { kreisVon[k.id] = k; });
    const komplexVon = {}; Kat.komplexe.forEach(k => { komplexVon[k.nr] = k; });

    /* je Stichwort ein paar Kennzahlen */
    A.punkte.forEach(p => {
      const j = A.je[p.id];
      const a = j.aufg || [];
      p.nAufg = a.length;
      p.nNeu = a.filter(x => x.neu).length;
      p.be = a.reduce((s, x) => s + x.be, 0);
      p.nVorl = (j.vorl || []).length;
      p.nKarten = (j.karten || []).length;
      p.nKomp = (j.komp || []).length;
      p.nSpick = (j.spick || []).length;
      p.luecke = !p.nAufg && !p.nVorl && !p.nKarten;
      p.suchtext = Kern.norm(p.text + " " + (p.gruppe || "") + " " + kreisVon[p.kreis].titel + " " + p.id);
    });

    /* Nicht AP1: welche Aufgaben / Typen fallen darunter? */
    const nicht = (Kat.nichtAP1 || []).map(e => ({ e: e, aufg: [], vorl: [] }));
    alle.forEach(it => {
      const t = [it.groupIntro, it.prompt, (it.solution || {}).text].join(" ");
      Kern.nichtAP1(Kat, t).forEach(e => {
        const z = nicht.find(x => x.e.key === e.key);
        if (z) z.aufg.push({ it: it, be: it.maxPoints || 0, neu: ((it.exam.meta || {}).year || 0) >= ab });
      });
    });
    vl.forEach(v => {
      const keys = new Set(Kern.nichtAP1(Kat, [v.titel, v.sub, v.merksatz].join(" ")).map(e => e.key));
      if (nichtV[v.id]) keys.add(nichtV[v.id]);
      keys.forEach(k => { const z = nicht.find(x => x.e.key === k); if (z) z.vorl.push(v); });
    });

    D = { A, kreise, kreisVon, komplexVon, nicht, ab, punktVon: id => A.punkte.find(p => p.id === id) };
    return D;
  }

  /** Katalog-Stichworte zu einer Prüfungsaufgabe / Karte (für Etiketten) */
  function codesFuer(art, key) {
    const d = daten();
    if (!d) return [];
    return d.A.umgekehrt[art + ":" + key] || [];
  }
  /* Aus Stichwort-Ids die Themenkreise, meistgenannte zuerst */
  function kreiseAus(ids) {
    const n = {};
    ids.forEach(id => { const k = id.slice(0, 5); n[k] = (n[k] || 0) + 1; });
    return Object.keys(n).sort((a, b) => n[b] - n[a] || (a < b ? -1 : 1));
  }

  /* ----------------------------------------------------------- Stand --- */
  const STANDNAME = ["offen", "unsicher", "sitzt"];
  function standVon(id) { return STAND[id] || 0; }
  function standSetzen(id, v) {
    if (v) STAND[id] = v; else delete STAND[id];
    schreib(SK_STAND, STAND);
  }

  /* ------------------------------------------------------------ Seite --- */
  function seite() {
    let s = $("scKatalog");
    if (s) return s;
    s = el("div", "seite kt-seite"); s.id = "scKatalog"; s.hidden = true;
    const start = $("scStart");
    start.parentNode.insertBefore(s, start.nextSibling);
    return s;
  }

  let herkunft = "scStart";
  function zeigen() {
    seite();
    const vorher = ["scBogen", "scAuswertung"].find(id => $(id) && !$(id).hidden) || "scStart";
    herkunft = vorher;
    document.querySelectorAll("div.seite[id^='sc'], #scBogen").forEach(e => {
      if (e.id !== "scKatalog") e.hidden = true;
    });
    $("scKatalog").hidden = false;
    const f = $("fuss"); if (f) f.hidden = true;
    const kt = $("kopfTitel"); if (kt) kt.hidden = false;
    if ($("kTitel")) $("kTitel").textContent = "Prüfungskatalog AP1";
    if ($("kEyebrow")) $("kEyebrow").textContent = "ZPA · 2. Auflage 2024";
    if (window.GENZURUECK) {
      try { window.GENZURUECK.hoeher && window.GENZURUECK.hoeher("scKatalog", herkunft); } catch (e) { }
      window.GENZURUECK.knopfPflegen();
    }
    /* Verlaufseintrag, damit Zurück (Knopf, Taste, Geste) dorthin führt,
       woher man kam — auch in den Prüfungsbogen.                        */
    try {
      if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: vorher }, "");
      if (history.state.seite !== "scKatalog") history.pushState({ ihk: 1, seite: "scKatalog" }, "", location.hash || "");
    } catch (e) { }
    window.scrollTo(0, 0);
  }

  /* Öffnen, optional an einer Stelle: "03.04" (Themenkreis) oder "03.04.02" */
  function oeffnen(ziel, opt) {
    if (!daten()) return;
    if (opt && opt.filter) UI.filter = opt.filter;
    UI.tab = "themen";
    if (ziel) { UI.suche = ""; UI.komplex = ""; if (UI.filter !== "alle" && !(opt && opt.filter)) UI.filter = "alle"; }
    zeichnen();
    zeigen();
    if (ziel) {
      setTimeout(() => {
        const z = document.querySelector('[data-kid="' + ziel + '"]');
        if (!z) return;
        if (z.tagName === "LI" && !z.classList.contains("auf")) z.querySelector(".kt-p-kopf").click();
        z.scrollIntoView({ behavior: "smooth", block: "start" });
        z.classList.add("kt-blink");
        setTimeout(() => z.classList.remove("kt-blink"), 1600);
      }, 60);
    }
  }

  /* ---------------------------------------------------------- Zeichnen --- */
  function zeichnen() {
    const s = seite();
    const d = daten();
    s.innerHTML = "";
    if (!d) { s.appendChild(el("p", "hint", "Katalogdaten fehlen.")); return; }
    const w = el("div", "kt-wrap");
    s.appendChild(w);
    w.appendChild(kopf(d));
    w.appendChild(reiter(d));
    const inhalt = el("div", "kt-inhalt"); inhalt.id = "ktInhalt";
    w.appendChild(inhalt);
    inhaltZeichnen();
  }

  function inhaltZeichnen() {
    const box = $("ktInhalt");
    if (!box) return;
    box.innerHTML = "";
    const d = daten();
    document.querySelectorAll(".kt-reiter button").forEach(b =>
      b.setAttribute("aria-selected", b.dataset.tab === UI.tab ? "true" : "false"));
    if (UI.tab === "nicht") box.appendChild(nichtAP1(d));
    else if (UI.tab === "notation") box.appendChild(notationen(d));
    else themen(d, box);
  }

  /* Kopf: Titel, Eckdaten, eigener Stand */
  function kopf(d) {
    const Kat = K();
    const k = el("div", "kt-kopf");
    const t = el("div", "kt-titel");
    t.appendChild(el("h2", null, "Prüfungskatalog AP1"));
    t.appendChild(el("p", "kt-quelle", "Einrichten eines IT-gestützten Arbeitsplatzes · ZPA Nord-West, 2. Auflage 2024 · gilt ab " + Kat.gueltigAb));
    k.appendChild(t);

    const fakten = el("div", "kt-fakten");
    [["90 Min.", "ungebunden"], ["4 Aufgaben", "je 20–30 P."], ["100 Punkte", "20 % der Note"], ["Englisch", "in allen Bereichen"]]
      .forEach(f => { const c = el("div", "kt-fakt"); c.appendChild(el("b", null, f[0])); c.appendChild(el("span", null, f[1])); fakten.appendChild(c); });
    k.appendChild(fakten);

    /* Stand */
    const P = d.A.punkte;
    const sitzt = P.filter(p => standVon(p.id) === 2).length;
    const unsicher = P.filter(p => standVon(p.id) === 1).length;
    const st = el("div", "kt-stand");
    const bar = el("div", "kt-bar");
    const b1 = el("i", "s2"); b1.style.width = (sitzt / P.length * 100) + "%";
    const b2 = el("i", "s1"); b2.style.width = (unsicher / P.length * 100) + "%";
    bar.append(b1, b2);
    st.appendChild(bar);
    st.appendChild(el("div", "kt-standtxt",
      "Mein Stand: " + sitzt + " sitzt · " + unsicher + " unsicher · " + (P.length - sitzt - unsicher) + " offen von " + P.length + " Stichworten"));
    k.appendChild(st);
    return k;
  }

  function reiter(d) {
    const r = el("div", "kt-reiter");
    r.setAttribute("role", "tablist");
    [["themen", "Themen", d.A.punkte.length], ["nicht", "Nicht in AP1", d.nicht.length], ["notation", "Notationen", (K().anhang || []).length]]
      .forEach(([key, name, n]) => {
        const b = el("button");
        b.type = "button"; b.dataset.tab = key; b.setAttribute("role", "tab");
        b.appendChild(document.createTextNode(name + " "));
        b.appendChild(el("span", "n", String(n)));
        b.onclick = () => { UI.tab = key; merkeUI(); inhaltZeichnen(); };
        r.appendChild(b);
      });
    return r;
  }

  /* ------------------------------------------------------------ Themen --- */
  const FILTER = [
    ["alle", "alle"],
    ["luecke", "Lücken"],
    ["neu", "seit 2025 gefragt"],
    ["nie", "nie gefragt"],
    ["offen", "offen"],
    ["unsicher", "unsicher"],
    ["sitzt", "sitzt"]
  ];
  function filterTest(p, f) {
    switch (f || UI.filter) {
      case "luecke": return p.luecke;
      case "neu": return p.nNeu > 0;
      case "nie": return p.nAufg === 0;
      case "offen": return standVon(p.id) === 0;
      case "unsicher": return standVon(p.id) === 1;
      case "sitzt": return standVon(p.id) === 2;
      default: return true;
    }
  }

  function themen(d, box) {
    const Kat = K();

    /* Überblick: die sieben Fragenkomplexe als Kacheln — zugleich Filter */
    const ueb = el("div", "kt-komplexe");
    Kat.komplexe.forEach(k => {
      const P = d.A.punkte.filter(p => p.komplex === k.nr);
      const sitzt = P.filter(p => standVon(p.id) === 2).length;
      const luecken = P.filter(p => p.luecke).length;
      const be = P.reduce((s, p) => s + p.be, 0);
      const b = el("button", "kt-kx" + (UI.komplex === k.nr ? " an" : ""));
      b.type = "button";
      b.setAttribute("aria-pressed", UI.komplex === k.nr ? "true" : "false");
      b.appendChild(el("span", "kt-kxnr", k.nr));
      const tx = el("span", "kt-kxtxt");
      tx.appendChild(el("span", "kt-kxname", k.kurz));
      tx.appendChild(el("span", "kt-kxinfo", P.length + " Stichw. · " + (luecken ? luecken + " Lücken" : "keine Lücke")));
      const bar = el("span", "kt-kxbar"); const i = el("i"); i.style.width = (P.length ? sitzt / P.length * 100 : 0) + "%"; bar.appendChild(i);
      tx.appendChild(bar);
      b.appendChild(tx);
      b.title = k.titel + " — Treffer in Prüfungsaufgaben: " + be + " BE (Stichworte können sich überschneiden)";
      b.onclick = () => { UI.komplex = UI.komplex === k.nr ? "" : k.nr; merkeUI(); inhaltZeichnen(); };
      ueb.appendChild(b);
    });
    box.appendChild(ueb);

    /* Suche + Filter */
    const leiste = el("div", "kt-leiste");
    const sf = el("div", "kt-sfeld");
    const lupe = el("span", "kt-slupe"); lupe.innerHTML = ik("suche", 16);
    const lab = el("label", "sr-only", "Im Katalog suchen"); lab.setAttribute("for", "ktSuche");
    const inp = el("input"); inp.type = "search"; inp.id = "ktSuche"; inp.value = UI.suche;
    inp.placeholder = "Im Katalog suchen, z. B. Skonto, NAS, Scrum …"; inp.autocomplete = "off";
    let warte = null;
    inp.oninput = () => { clearTimeout(warte); warte = setTimeout(() => { UI.suche = inp.value; listeZeichnen(); }, 120); };
    sf.append(lupe, lab, inp);
    leiste.appendChild(sf);
    const chips = el("div", "kt-chips");
    FILTER.forEach(([key, name]) => {
      const n = d.A.punkte.filter(p => (!UI.komplex || p.komplex === UI.komplex) && filterTest(p, key)).length;
      const c = el("button", "kt-chip" + (UI.filter === key ? " an" : ""));
      c.type = "button"; c.dataset.f = key;
      c.setAttribute("aria-pressed", UI.filter === key ? "true" : "false");
      c.appendChild(document.createTextNode(name + " "));
      c.appendChild(el("span", "n", String(n)));
      c.onclick = () => { UI.filter = key; merkeUI(); chips.querySelectorAll(".kt-chip").forEach(x => { x.classList.toggle("an", x.dataset.f === key); x.setAttribute("aria-pressed", x.dataset.f === key ? "true" : "false"); }); listeZeichnen(); };
      chips.appendChild(c);
    });
    const sort = el("select", "kt-sort");
    sort.setAttribute("aria-label", "Reihenfolge");
    [["katalog", "Katalog-Reihenfolge"], ["be", "meiste Prüfungspunkte zuerst"]].forEach(([v, t]) => {
      const o = el("option", null, t); o.value = v; if (UI.sort === v) o.selected = true; sort.appendChild(o);
    });
    sort.onchange = () => { UI.sort = sort.value; merkeUI(); listeZeichnen(); };
    chips.appendChild(sort);
    leiste.appendChild(chips);
    box.appendChild(leiste);

    const info = el("p", "kt-info"); info.id = "ktInfo";
    box.appendChild(info);
    const liste = el("div", "kt-liste"); liste.id = "ktListe";
    box.appendChild(liste);
    listeZeichnen();
  }

  function listeZeichnen() {
    const d = daten(), Kat = K(), Kern = KERN();
    const liste = $("ktListe"), info = $("ktInfo");
    if (!liste) return;
    liste.innerHTML = "";
    const q = Kern.norm(UI.suche || "").trim();
    const woerter = q ? q.split(/\s+/) : [];
    const P = d.A.punkte.filter(p =>
      (!UI.komplex || p.komplex === UI.komplex) && filterTest(p) &&
      woerter.every(w => p.suchtext.indexOf(w) >= 0));

    const luecken = P.filter(p => p.luecke).length;
    info.textContent = P.length + " Stichworte" + (luecken ? " · " + luecken + " ohne Übungsmaterial" : "") +
      (UI.filter === "luecke" ? " — dazu gibt es hier keine Aufgabe, keinen Generator-Typ und keine Karte. Lesen im Kompendium/Spickzettel, dann selbst abhaken." : "") +
      (UI.filter === "neu" ? " — kamen in Frühjahr 2025, Herbst 2025 oder Frühjahr 2026 vor, also schon nach diesem Katalog." : "") +
      (UI.filter === "nie" ? " — in keiner der zehn Prüfungen gefragt. Erlaubt sind sie trotzdem." : "");

    if (!P.length) { liste.appendChild(el("div", "kt-leer", "Nichts gefunden. Filter „alle“ wählen oder anders suchen.")); return; }

    if (UI.sort === "be") {
      const ol = el("ol", "kt-pl kt-flach");
      P.slice().sort((a, b) => b.be - a.be || b.nAufg - a.nAufg).forEach(p => ol.appendChild(punktEl(p, true)));
      liste.appendChild(ol);
      return;
    }

    Kat.komplexe.forEach(k => {
      const Pk = P.filter(p => p.komplex === k.nr);
      if (!Pk.length) return;
      const sek = el("section", "kt-kx-sek");
      const h = el("h3", "kt-kx-titel");
      h.appendChild(el("span", "kt-nr", k.nr));
      h.appendChild(document.createTextNode(k.titel));
      sek.appendChild(h);
      const meta = el("div", "kt-kx-meta", k.lf + " · Katalog S. " + k.seite);
      sek.appendChild(meta);
      if (k.handlungen && k.handlungen.length && !woerter.length && UI.filter === "alle") {
        const hd = el("details", "kt-handl");
        hd.appendChild(el("summary", null, "Beispiele für betriebliche Handlungen (" + k.handlungen.length + ")"));
        const ul = el("ul"); k.handlungen.forEach(x => ul.appendChild(el("li", null, x)));
        hd.appendChild(ul);
        sek.appendChild(hd);
      }
      k.kreise.forEach(kr => {
        const kid = k.nr + "." + kr.nr;
        const Pkr = Pk.filter(p => p.kreis === kid);
        if (!Pkr.length) return;
        const kb = el("div", "kt-kreis"); kb.dataset.kid = kid;
        const kh = el("div", "kt-kreis-kopf");
        kh.appendChild(el("span", "kt-nr", kid));
        const kt = el("div", "kt-kreis-t");
        kt.appendChild(el("span", "kt-kreis-titel", kr.titel));
        const tf = el("span", "kt-tiefe t" + kr.tiefe, Kern.TIEFE[kr.tiefe] || "");
        tf.title = "Operator im Katalog — die verlangte Tiefe";
        kt.appendChild(tf);
        kh.appendChild(kt);
        kb.appendChild(kh);
        kb.appendChild(kreisAktionen(kid));
        const ol = el("ol", "kt-pl");
        let gruppe = null;
        Pkr.forEach(p => {
          if (p.gruppe && p.gruppe !== gruppe) { ol.appendChild(el("li", "kt-gruppe", p.gruppe)); }
          gruppe = p.gruppe;
          ol.appendChild(punktEl(p, false));
        });
        kb.appendChild(ol);
        sek.appendChild(kb);
      });
      liste.appendChild(sek);
    });
  }

  /* Aktionen je Themenkreis: alle Aufgaben / alle Typen üben */
  function kreisAktionen(kid) {
    const d = daten();
    const P = d.A.punkte.filter(p => p.kreis === kid);
    const aufg = eindeutig(P.flatMap(p => d.A.je[p.id].aufg || []), x => x.key);
    const vorl = eindeutig(P.flatMap(p => d.A.je[p.id].vorl || []), x => x.key);
    const karten = eindeutig(P.flatMap(p => d.A.je[p.id].karten || []), x => x.key);
    const box = el("div", "kt-kreis-akt");
    if (aufg.length) box.appendChild(knopf(ik("pruefung", 14) + " " + aufg.length + " Prüfungsaufgaben üben", () => ueben(aufg, "Katalog " + kid)));
    if (vorl.length) box.appendChild(knopf(ik("wuerfel", 14) + " Arbeitsblatt (" + vorl.length + " Typen)", () => blatt(vorl, "Katalog " + kid)));
    if (karten.length) box.appendChild(knopf(ik("karten", 14) + " " + karten.length + " Karten", () => kartenUeben(karten)));
    return box;
  }

  function knopf(html, tun, klasse) {
    const b = el("button", "kt-knopf" + (klasse ? " " + klasse : ""));
    b.type = "button"; b.innerHTML = html; b.onclick = tun;
    return b;
  }
  function eindeutig(a, f) { const s = new Set(); return a.filter(x => { const k = f(x); if (s.has(k)) return false; s.add(k); return true; }); }

  /* Ein Stichwort: Haken · Text · Zähler — aufklappbar mit dem Material */
  function punktEl(p, mitKreis) {
    const d = daten();
    const li = el("li", "kt-p" + (p.luecke ? " luecke" : "")); li.dataset.kid = p.id;
    const st = standVon(p.id);
    const hak = el("button", "kt-hak s" + st);
    hak.type = "button";
    hak.setAttribute("aria-label", "Stand: " + STANDNAME[st] + " — antippen zum Ändern");
    hak.title = "offen → unsicher → sitzt";
    hak.innerHTML = st === 2 ? ik("check", 14) : "";
    hak.onclick = ev => {
      ev.stopPropagation();
      const neu = (standVon(p.id) + 1) % 3;
      standSetzen(p.id, neu);
      hak.className = "kt-hak s" + neu;
      hak.innerHTML = neu === 2 ? ik("check", 14) : "";
      hak.setAttribute("aria-label", "Stand: " + STANDNAME[neu] + " — antippen zum Ändern");
      const k = document.querySelector(".kt-kopf");
      if (k) k.replaceWith(kopf(d));
      standAufStart();
    };
    li.appendChild(hak);

    const kopfZ = el("button", "kt-p-kopf");
    kopfZ.type = "button";
    kopfZ.setAttribute("aria-expanded", "false");
    const t = el("span", "kt-p-t");
    t.appendChild(el("span", "kt-p-id", p.id));
    t.appendChild(document.createTextNode(" " + p.text));
    kopfZ.appendChild(t);
    if (mitKreis) kopfZ.appendChild(el("span", "kt-p-kreis", d.kreisVon[p.kreis].titel));
    const z = el("span", "kt-zaehler");
    const zahl = (n, name, klasse, titel) => {
      if (!n) return;
      const s = el("span", "kt-z " + klasse); s.textContent = name + " " + n; s.title = titel; z.appendChild(s);
    };
    if (p.nAufg) {
      const s = el("span", "kt-z z-p");
      s.textContent = "P " + p.nAufg + " · " + p.be + " BE";
      s.title = p.nAufg + " Prüfungsaufgaben mit zusammen " + p.be + " BE";
      z.appendChild(s);
    }
    if (p.nNeu) { const s = el("span", "kt-z z-neu", "2025+ " + p.nNeu); s.title = p.nNeu + "× in Prüfungen nach dem neuen Katalog"; z.appendChild(s); }
    zahl(p.nVorl, "G", "z-g", "Aufgabentypen im Generator");
    zahl(p.nKarten, "K", "z-k", "Karteikarten");
    zahl(p.nKomp, "Ko", "z-ko", "Kompendium-Seiten");
    zahl(p.nSpick, "S", "z-s", "Spickzettel-Kapitel");
    if (p.luecke) { const s = el("span", "kt-z z-luecke", "Lücke"); s.title = "Keine Prüfungsaufgabe, kein Generator-Typ, keine Karte"; z.appendChild(s); }
    kopfZ.appendChild(z);
    li.appendChild(kopfZ);

    const det = el("div", "kt-det"); det.hidden = true;
    li.appendChild(det);
    kopfZ.onclick = () => {
      const auf = det.hidden;
      if (auf && !det.firstChild) det.appendChild(detail(p));
      det.hidden = !auf;
      li.classList.toggle("auf", auf);
      kopfZ.setAttribute("aria-expanded", auf ? "true" : "false");
    };
    return li;
  }

  function detail(p) {
    const d = daten();
    const j = d.A.je[p.id];
    const box = el("div", "kt-det-in");

    /* Prüfungsaufgaben — neuer Katalog zuerst */
    const aufg = (j.aufg || []).slice().sort((a, b) => (b.jahr || 0) - (a.jahr || 0));
    if (aufg.length) {
      const s = sektion(box, "Prüfungsaufgaben", aufg.length);
      const ul = el("ul", "kt-mat");
      aufg.slice(0, 12).forEach(a => {
        const it = a.it, m = it.exam.meta || {};
        const b = el("button", "kt-m");
        b.type = "button";
        const t = el("span", "kt-m-t", m.season + " " + m.year + " · " + nrVon(it) + " · " + (it.maxPoints || 0) + " BE");
        if (a.neu) t.appendChild(el("span", "kt-m-neu", "neuer Katalog"));
        b.appendChild(t);
        b.appendChild(el("span", "kt-m-u", String(it.prompt || "").replace(/\s+/g, " ").slice(0, 120) + (String(it.prompt || "").length > 120 ? " …" : "")));
        b.onclick = () => aufgabeOeffnen(it);
        const li = el("li"); li.appendChild(b); ul.appendChild(li);
      });
      s.appendChild(ul);
      if (aufg.length > 1) s.appendChild(knopf(ik("uebung", 14) + " Alle " + aufg.length + " als Übung", () => ueben(aufg, "Katalog " + p.id), "voll"));
    }

    const vorl = j.vorl || [];
    if (vorl.length) {
      const s = sektion(box, "Generator — neu würfeln", vorl.length);
      const ul = el("ul", "kt-mat");
      vorl.forEach(v => {
        const b = el("button", "kt-m");
        b.type = "button";
        b.appendChild(el("span", "kt-m-t", v.v.titel));
        b.appendChild(el("span", "kt-m-u", v.v.sub || ""));
        b.onclick = () => blatt([v], v.v.titel);
        const li = el("li"); li.appendChild(b); ul.appendChild(li);
      });
      s.appendChild(ul);
    }

    const karten = j.karten || [];
    if (karten.length) {
      const s = sektion(box, "Karteikarten", karten.length);
      s.appendChild(el("p", "kt-m-u", "„" + karten[0].karte.vorne.slice(0, 110) + "“" + (karten.length > 1 ? " und " + (karten.length - 1) + " weitere" : "")));
      s.appendChild(knopf(ik("karten", 14) + " " + karten.length + " Karten üben", () => kartenUeben(karten), "voll"));
    }

    const lesen = [];
    (j.komp || []).forEach(k => lesen.push({ t: k.t.titel, u: "Kompendium", tun: () => window.GENKOMP && window.GENKOMP.oeffnen(k.t.id) }));
    (j.spick || []).forEach(k => lesen.push({ t: k.k.titel, u: "Spickzettel", tun: () => {
      if (!window.GENSPICK) return;
      const w = suchwort(p.text);
      if (w) window.GENSPICK.suchseite(w);
      window.GENSPICK.kapitel(k.k.id);
    } }));
    if (lesen.length) {
      const s = sektion(box, "Nachlesen", lesen.length);
      const ul = el("ul", "kt-mat kt-lesen");
      lesen.forEach(x => {
        const b = el("button", "kt-m");
        b.type = "button";
        b.appendChild(el("span", "kt-m-t", x.t));
        b.appendChild(el("span", "kt-m-u", x.u));
        b.onclick = x.tun;
        const li = el("li"); li.appendChild(b); ul.appendChild(li);
      });
      s.appendChild(ul);
    }

    if (!aufg.length && !vorl.length && !karten.length) {
      const w = suchwort(p.text);
      const hin = el("div", "kt-luecke-hinweis");
      hin.appendChild(el("p", null, "Dazu gibt es in dieser Anwendung keine Aufgabe. " +
        (p.nKomp || p.nSpick ? "Oben steht, wo du nachlesen kannst — danach selbst abhaken." :
          "Auch in keiner der zehn Prüfungen gefragt — trotzdem erlaubt. Kurz nachlesen reicht meist.")));
      if (w && window.GENKOMP) hin.appendChild(knopf(ik("komp", 14) + " Im Kompendium nach „" + w + "“ suchen", () => window.GENKOMP.suchseite(w)));
      box.appendChild(hin);
    }
    return box;
  }

  function sektion(box, titel, n) {
    const s = el("div", "kt-sek");
    const h = el("div", "kt-sek-t");
    h.appendChild(document.createTextNode(titel));
    h.appendChild(el("span", "n", String(n)));
    s.appendChild(h);
    box.appendChild(s);
    return s;
  }

  /* erstes aussagekräftiges Wort eines Stichworts — für Suchen */
  function suchwort(text) {
    const w = String(text).replace(/\(.*?\)/g, " ").split(/[\s,/;:]+/)
      .filter(x => x.length >= 4 && !/^(z\.|kennen|können|sowie|eines|einer|einem|durch|mithilfe|beurteilen|unterscheiden|insbesondere)$/i.test(x));
    return (w[0] || "").replace(/[^A-Za-zÄÖÜäöüß0-9-]/g, "");
  }

  /* ------------------------------------------------------------ Aktionen */
  function aufgabeOeffnen(it) {
    if (typeof oeffnePruefung !== "function") return;
    oeffnePruefung(it.exam);
    if (typeof springeZu === "function") setTimeout(() => springeZu(it.k), 80);
  }
  function ueben(aufg, titel) {
    if (typeof VIEW === "undefined") return;
    const items = aufg.map(a => a.it).filter(Boolean);
    if (!items.length) return;
    VIEW = { modus: "uebung", exam: null, items: items, titel: titel };
    if (typeof SHOW_SOL !== "undefined") SHOW_SOL = false;
    if (typeof zeigeBogen === "function") zeigeBogen();
    if (typeof schirm === "function") schirm("scBogen");
  }
  function blatt(vorl, titel) {
    if (!window.GENUI) return;
    /* je Typ eine Aufgabe, höchstens zehn; bei einem Typ drei Varianten */
    const typen = vorl.slice(0, 10);
    const liste = (typen.length === 1 ? [0, 1, 2].map(() => typen[0]) : typen)
      .map(v => ({ vorlageId: v.key, saat: (Math.random() * 4294967295) >>> 0 }));
    window.GENUI.erzeugeBlatt({ liste: liste, titel: titel, zeit: 1 });
  }
  function kartenUeben(karten) {
    if (typeof KK === "undefined" || typeof zeigeKarte !== "function") return;
    const stapel = karten.map(k => k.karte).map(c => [Math.random(), c]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    KK = { stapel: stapel, i: 0, offen: false };
    zeigeKarte();
    if (typeof schirm === "function") schirm("scKK");
  }

  /* -------------------------------------------------------- Nicht AP1 --- */
  const ARTNAME = { gestrichen: "gestrichen", ap2: "nur AP2", grenzfall: "Grenzfall", anhang: "nur Anhang" };
  function nichtAP1(d) {
    const box = el("div", "kt-nicht");
    box.appendChild(el("p", "kt-info",
      "Was in AP1 nicht (mehr) geprüft wird — mit Fundstelle im Katalog. Die Zahlen zeigen, wie viel " +
      "Material dieser Anwendung darunter fällt. „Grenzfall“ heißt: kam trotzdem vor oder steht als Notation im Anhang."));
    const reihen = { gestrichen: 0, grenzfall: 1, ap2: 2, anhang: 3 };
    d.nicht.slice().sort((a, b) => reihen[a.e.art] - reihen[b.e.art] || b.aufg.length - a.aufg.length).forEach(z => {
      const e = z.e;
      const c = el("div", "kt-nk a-" + e.art);
      const h = el("div", "kt-nk-kopf");
      h.appendChild(el("span", "kt-art a-" + e.art, ARTNAME[e.art] || e.art));
      h.appendChild(el("b", null, e.label));
      c.appendChild(h);
      c.appendChild(el("p", "kt-nk-wo", e.wo));
      if (e.hinweis) c.appendChild(el("p", "kt-nk-hin", e.hinweis));
      if (e.beleg) c.appendChild(el("p", "kt-nk-hin", e.beleg));
      const be = z.aufg.reduce((s, a) => s + a.be, 0);
      const neu = z.aufg.filter(a => a.neu);
      const zeile = [];
      if (z.aufg.length) zeile.push(z.aufg.length + " Prüfungsaufgaben (" + be + " BE)");
      if (z.vorl.length) zeile.push(z.vorl.length + " Generator-Typ" + (z.vorl.length > 1 ? "en" : ""));
      c.appendChild(el("p", "kt-nk-zahl", zeile.length ? "In dieser Anwendung: " + zeile.join(" · ") : "In dieser Anwendung: nichts"));
      if (neu.length) {
        const w = el("p", "kt-nk-neu");
        w.textContent = "Trotzdem nach dem neuen Katalog vorgekommen: " +
          neu.map(a => (a.it.exam.meta.season + " " + a.it.exam.meta.year + " " + nrVon(a.it))).join(", ");
        c.appendChild(w);
      }
      if (z.aufg.length) {
        const dd = el("details", "kt-nk-det");
        dd.appendChild(el("summary", null, "Aufgaben ansehen"));
        const ul = el("ul", "kt-mat");
        z.aufg.forEach(a => {
          const b = el("button", "kt-m"); b.type = "button";
          const m = a.it.exam.meta;
          b.appendChild(el("span", "kt-m-t", m.season + " " + m.year + " · " + nrVon(a.it) + " · " + a.be + " BE"));
          b.appendChild(el("span", "kt-m-u", String(a.it.prompt || "").replace(/\s+/g, " ").slice(0, 110)));
          b.onclick = () => aufgabeOeffnen(a.it);
          const li = el("li"); li.appendChild(b); ul.appendChild(li);
        });
        dd.appendChild(ul);
        c.appendChild(dd);
      }
      if (z.vorl.length) c.appendChild(el("p", "kt-nk-vorl", "Generator: " + z.vorl.map(v => v.titel).join(" · ")));
      box.appendChild(c);
    });
    return box;
  }

  /* -------------------------------------------------------- Notationen --- */
  function netzplanSvg() {
    return '<svg class="kt-np" viewBox="0 0 250 150" width="250" height="150" role="img" ' +
      'aria-label="Vorgangsknoten nach ZPA: oben links FAZ, oben rechts FEZ; im Kasten oben Vorgang und Beschreibung, unten Dauer, GP, FP; unten links SAZ, unten rechts SEZ">' +
      '<g fill="none" stroke="currentColor" stroke-width="1.6"><rect x="12" y="26" width="226" height="94"/>' +
      '<path d="M12 73h226M64 26v47M87 73v47M163 73v47"/></g>' +
      '<g font-family="ui-monospace,Consolas,monospace" font-size="13" fill="currentColor" text-anchor="middle">' +
      '<text x="30" y="18" font-weight="700">FAZ</text><text x="220" y="18" font-weight="700">FEZ</text>' +
      '<text x="38" y="54" font-size="11">Vor-</text><text x="38" y="66" font-size="11">gang</text>' +
      '<text x="151" y="55">Beschreibung</text>' +
      '<text x="49" y="101">Dauer</text><text x="125" y="101" font-weight="700">GP</text><text x="200" y="101" font-weight="700">FP</text>' +
      '<text x="30" y="140" font-weight="700">SAZ</text><text x="220" y="140" font-weight="700">SEZ</text></g></svg>';
  }

  function notationen(d) {
    const box = el("div", "kt-notation");
    box.appendChild(el("p", "kt-info", "Der Anhang des Katalogs zeigt, wie die ZPA in den Aufgaben zeichnet und rechnet. " +
      "So sieht es in der Prüfung aus — lieber genau so üben."));
    (K().anhang || []).forEach(a => {
      const c = el("div", "kt-an" + (a.wichtig ? " wichtig" : "") + (a.ap1 ? "" : " nicht"));
      const h = el("div", "kt-an-kopf");
      h.appendChild(el("b", null, a.titel));
      if (a.ap1) {
        const b = el("button", "kt-an-ref", "Katalog " + a.ap1);
        b.type = "button"; b.onclick = () => oeffnen(a.ap1);
        h.appendChild(b);
      } else h.appendChild(el("span", "kt-art a-ap2", "nicht AP1"));
      h.appendChild(el("span", "kt-an-s", "S. " + a.seite));
      c.appendChild(h);
      if (a.svg === "netzplan") { const f = el("div", "kt-an-bild"); f.innerHTML = netzplanSvg(); c.appendChild(f); }
      if (a.key === "praefixe") c.appendChild(praefixTabelle());
      const ul = el("ul");
      a.punkte.forEach(x => ul.appendChild(el("li", null, x)));
      c.appendChild(ul);
      if (a.key === "netzplan" && $("btnNetzZufall")) {
        c.appendChild(knopf(ik("diagramm", 14) + " Netzplan üben", () => $("btnNetzZufall").click()));
      }
      box.appendChild(c);
    });
    return box;
  }

  function praefixTabelle() {
    const w = el("div", "kt-tabwrap");
    const t = el("table", "kt-tab");
    t.innerHTML = "<thead><tr><th>für Datenmengen richtig</th><th>Wert</th><th>falsch benutzt</th><th>Fehler</th></tr></thead><tbody>" +
      [["KiB (Kibibyte)", "2<sup>10</sup> = 1.024 B", "kB", "2,40 %"],
       ["MiB (Mebibyte)", "2<sup>20</sup> = 1.048.576 B", "MB", "4,86 %"],
       ["GiB (Gibibyte)", "2<sup>30</sup> B", "GB", "7,37 %"],
       ["TiB (Tebibyte)", "2<sup>40</sup> B", "TB", "9,95 %"]]
        .map(r => "<tr><td><b>" + r[0] + "</b></td><td>" + r[1] + "</td><td>" + r[2] + "</td><td>" + r[3] + "</td></tr>").join("") +
      "</tbody>";
    w.appendChild(t);
    return w;
  }

  /* ----------------------------------------------------- Startseite --- */
  function standAufStart() {
    const z = document.querySelector('details.st-block[data-key="katalog"] .st-zahl');
    const d = daten();
    if (!z || !d) return;
    const sitzt = d.A.punkte.filter(p => standVon(p.id) === 2).length;
    z.textContent = sitzt + "/" + d.A.punkte.length;
  }

  function block() {
    const s = $("scStart");
    if (!s || !K()) return;
    let b = $("katalogBox");
    if (!b) {
      b = el("div", "abschnitt"); b.id = "katalogBox";
      s.appendChild(b);
    }
    b.innerHTML = "";
    b.appendChild(el("h2", null, "Prüfungskatalog AP1"));
    const d = daten();
    if (!d) return;
    const P = d.A.punkte;
    const luecken = P.filter(p => p.luecke).length;
    const neu = P.filter(p => p.nNeu).length;
    const nie = P.filter(p => !p.nAufg).length;
    b.appendChild(el("p", null, "Das Original der ZPA (2. Auflage 2024, gilt ab Frühjahr 2025): " + P.length +
      " Stichworte in 7 Fragenkomplexen. Zu jedem steht, welche Aufgaben, Karten und Generator-Typen es hier gibt."));
    const reihe = el("div", "kt-start");
    const k = (zahl, text, filter, klasse) => {
      const c = el("button", "kt-start-k" + (klasse ? " " + klasse : ""));
      c.type = "button";
      c.appendChild(el("b", null, String(zahl)));
      c.appendChild(el("span", null, text));
      c.onclick = () => { UI.komplex = ""; UI.suche = ""; oeffnen(null, { filter: filter }); };
      reihe.appendChild(c);
    };
    k(luecken, "Lücken — ohne Übungsmaterial", "luecke", "rot");
    k(neu, "seit 2025 gefragt", "neu", "gruen");
    k(nie, "in 10 Prüfungen nie gefragt", "nie");
    b.appendChild(reihe);
    const st = el("div", "steuer");
    const o = el("button", "btn primary", "Katalog öffnen");
    o.type = "button"; o.onclick = () => oeffnen(null, { filter: "alle" });
    const n = el("button", "btn", "Was nicht in AP1 kommt");
    n.type = "button"; n.onclick = () => { UI.tab = "nicht"; merkeUI(); zeichnen(); zeigen(); };
    const no = el("button", "btn ghost", "Notationen");
    no.type = "button"; no.onclick = () => { UI.tab = "notation"; merkeUI(); zeichnen(); zeigen(); };
    st.append(o, n, no);
    b.appendChild(st);
    setTimeout(standAufStart, 50);
  }

  /* --------------------------------------------- Etiketten an Aufgaben --- */
  function etikett(kreisId, klein) {
    const b = el("button", "kt-etikett" + (klein ? " klein" : ""));
    b.type = "button";
    b.textContent = "Katalog " + kreisId;
    const d = daten();
    const kr = d && d.kreisVon[kreisId];
    b.title = kr ? kr.titel + " — im Prüfungskatalog öffnen" : "im Prüfungskatalog öffnen";
    b.onclick = ev => { ev.stopPropagation(); oeffnen(kreisId); };
    return b;
  }

  function karteUmhuellen() {
    const alt = window.karte;
    if (typeof alt !== "function" || alt.__kt) return;
    const neu = function (it) {
      const card = alt.apply(this, arguments);
      try {
        const kreise = kreiseAus(codesFuer("aufg", it.k)).slice(0, 2);
        const nr = card.querySelector(".tk-nr");
        if (nr && kreise.length) kreise.forEach(k => nr.appendChild(etikett(k, true)));
      } catch (e) { }
      return card;
    };
    neu.__kt = true;
    window.karte = neu;
  }

  function kartenUmhuellen() {
    const alt = window.zeigeKarte;
    if (typeof alt !== "function" || alt.__kt) return;
    const neu = function () {
      const r = alt.apply(this, arguments);
      try {
        const q = $("kkQuelle");
        const c = (typeof KK !== "undefined" && KK.stapel) ? KK.stapel[KK.i] : null;
        if (q && c) {
          const liste = (typeof CARDS !== "undefined" ? CARDS : []);
          const i = liste.indexOf(c);
          const kreise = i >= 0 ? kreiseAus(codesFuer("karten", "k" + i)).slice(0, 2) : [];
          const alte = q.parentNode.querySelector(".kt-kk-etiketten");
          if (alte) alte.remove();
          if (kreise.length) {
            const box = el("div", "kt-kk-etiketten");
            kreise.forEach(k => box.appendChild(etikett(k, true)));
            q.parentNode.insertBefore(box, q.nextSibling);
          }
        }
      } catch (e) { }
      return r;
    };
    neu.__kt = true;
    window.zeigeKarte = neu;
  }

  /* --------------------------------------------------------- Einhängen --- */
  function einhaengen() {
    karteUmhuellen();
    kartenUmhuellen();
    const altStart = window.renderStart;
    if (typeof altStart === "function" && !altStart.__kt) {
      const neu = function () {
        const r = altStart.apply(this, arguments);
        try { block(); } catch (e) { console.error("Katalog:", e); }
        return r;
      };
      neu.__kt = true; window.renderStart = neu;
    }
    const altSchirm = window.schirm;
    if (typeof altSchirm === "function" && !altSchirm.__kt) {
      const neu = function (name) {
        /* Zurück per Verlauf landet hier mit „scKatalog“ — den kennt schirm() nicht */
        if (name === "scKatalog") { zeichnen(); zeigen(); return; }
        const s = $("scKatalog"); if (s) s.hidden = true;
        return altSchirm.apply(this, arguments);
      };
      neu.__kt = true; window.schirm = neu;
    }
    /* Andere Kapitel blenden ihre Seite selbst ein — dann verschwindet der Katalog */
    if (!window.__ktWache && window.MutationObserver) {
      window.__ktWache = new MutationObserver(muts => {
        const k = $("scKatalog");
        if (!k || k.hidden) return;
        for (const m of muts) {
          const z = m.target;
          if (z !== k && z.id && /^sc/.test(z.id) && z.classList &&
              (z.classList.contains("seite") || z.classList.contains("blatt")) && !z.hidden) { k.hidden = true; return; }
        }
      });
      window.__ktWache.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
    }
    try { block(); } catch (e) { console.error("Katalog:", e); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { oeffnen, zeigen, daten, codesFuer, kreiseAus, block, standVon,
           netzplanSvg, suchwort, get UI() { return UI; } };
})();
