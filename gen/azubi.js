/* ============================================================================
   gen/azubi.js — Azubi-Navigator (u-form) als eigener Bereich
   ----------------------------------------------------------------------------
   Die 10 Prüfungssimulationen und 3 Vertiefenden Übungen aus dem
   Azubi-Navigator, aber so, wie man lernt: jederzeit aufhören, später genau
   dort weitermachen, nichts geht verloren.

   Daten: privat/azubi-daten.js (window.IHK_AZUBI), gebaut mit
   tools/azubi_import.py aus einem Export des eigenen Kontos. Der Ordner
   privat/ geht NICHT auf GitHub Pages (lizenziertes Material). Aufs Handy
   kommt das Paket über „Paket laden“ — es liegt dann im Gerätespeicher
   (IndexedDB), nicht im Netz.

   Zwei Arten zu arbeiten:
     Übung    — nach jeder Teilaufgabe „Lösung zeigen“, sofort bewerten.
     Prüfung  — Uhr läuft (90 Min.), Lösungen erst nach „Abgeben“.

   Geschlossene Aufgaben (Zahlen, Tabellen, Zuordnen, Ankreuzen) prüft die
   App selbst und schlägt Punkte vor; offene bewertet man mit Musterlösung
   und Bewertungshinweis selbst.

   Speicher: ihk2:azubi:<modul>  — wandert mit dem Export auf andere Geräte.
   ========================================================================== */
"use strict";

(function (root) {
  const hatDom = typeof document !== "undefined";
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const ik = (n, g) => root.GENIKON ? root.GENIKON.svg(n, g || 16) : "";

  const SK = "ihk2:azubi:";
  const SK_UI = "ihk2:azubi:ui";
  const lies = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

  /* ======================================================================
     Bewertung — reine Funktionen (tests/azubi.test.js)
     ====================================================================== */
  function normText(s) {
    return String(s == null ? "" : s).toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[„“”"'`´‚‘’]/g, "").replace(/\s+/g, " ").replace(/[.;:!?]+$/, "").trim();
  }

  /** Alle plausiblen Lesarten einer eingetippten Zahl: 1.512 kann 1512 oder 1,512 sein. */
  function zahlen(s) {
    let t = String(s == null ? "" : s).replace(/[\s  ]/g, "");
    t = t.replace(/^[^\d-]+/, "").replace(/[^\d.,]+$/, "");
    const out = [];
    const add = v => { if (!isNaN(v) && out.indexOf(v) < 0) out.push(v); };
    if (/^-?\d+([.,]\d+)?$/.test(t)) add(parseFloat(t.replace(",", ".")));
    if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) add(parseFloat(t.replace(/\./g, "").replace(",", ".")));
    if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) add(parseFloat(t.replace(/,/g, "")));
    return out;
  }

  const leer = v => v == null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length);

  function feldRichtig(f, wert) {
    if (leer(wert) || !f || !f.soll || !f.soll.length) return false;
    if (f.art === "zahl") {
      const ist = zahlen(wert);
      return f.soll.some(s => {
        const b = zahlen(s)[0];
        if (b == null) return false;
        const nk = (String(s).split(/[.,]/)[1] || "").length;
        const tol = nk ? Math.pow(10, -nk) + 1e-9 : 1e-9;
        return ist.some(a => Math.abs(a - b) <= tol);
      });
    }
    const n = normText(wert), n2 = n.replace(/\s/g, "");
    return f.soll.some(s => { const m = normText(s); return m === n || m.replace(/\s/g, "") === n2; });
  }

  /** Alle automatisch prüfbaren Stellen einer Teilaufgabe: [{key, art, ...}] */
  function stellen(t) {
    const E = t.eingabe || {};
    const out = [];
    if (E.typ === "raster") (E.zellen || []).forEach(z => { if (z && z.f) out.push({ key: "f" + z.f.id, art: "feld", f: z.f }); });
    else if (E.typ === "zeilen") (E.zeilen || []).forEach(z => (z.felder || []).forEach(f => out.push({ key: "f" + f.id, art: "feld", f })));
    else if (E.typ === "zuordnung") (E.zeilen || []).forEach(z => out.push({ key: "z" + z.id, art: "zuordnung", soll: z.soll }));
    else if (E.typ === "wahl") (E.zeilen || []).forEach(z => out.push({ key: "w" + z.id, art: "wahl", soll: z.soll }));
    else if (E.typ === "mehrfach") out.push({ key: "m", art: "mehrfach", soll: E.soll || [] });
    return out;
  }
  const hatFreitext = t => (t.eingabe || {}).typ === "zeilen" && (t.eingabe.zeilen || []).some(z => z.frei);

  function hatAntwort(t, a) {
    if (!a) return false;
    return Object.keys(a).some(k => !leer(a[k]));
  }

  /** Ergebnis der automatischen Kontrolle. `vorschlag` nur, wenn alles prüfbar ist. */
  function pruefe(t, a) {
    a = a || {};
    const st = stellen(t);
    const marken = {};
    let n = 0, k = 0;
    st.forEach(s => {
      const w = a[s.key];
      if (s.art === "feld") { n++; marken[s.key] = feldRichtig(s.f, w); if (marken[s.key]) k++; }
      else if (s.art === "zuordnung") { n++; marken[s.key] = !leer(w) && String(w) === String(s.soll); if (marken[s.key]) k++; }
      else if (s.art === "wahl") { n++; marken[s.key] = w != null && w !== "" && Number(w) === s.soll; if (marken[s.key]) k++; }
      else if (s.art === "mehrfach") {
        const gew = Array.isArray(w) ? w.map(Number) : [];
        const tp = gew.filter(x => s.soll.indexOf(x) >= 0).length;
        const fp = gew.length - tp;
        n += s.soll.length; k += Math.max(0, tp - fp);
        marken.m = gew.length > 0 && tp === s.soll.length && fp === 0;
      }
    });
    const offen = hatFreitext(t);
    const quote = n ? k / n : 0;
    return { n, k, quote, marken, offen, pruefbar: n > 0,
             vorschlag: (n > 0 && !offen) ? Math.round(quote * (t.punkte || 0) * 2) / 2 : null };
  }

  const NOTEN = [[92, 1, "sehr gut"], [81, 2, "gut"], [67, 3, "befriedigend"], [50, 4, "ausreichend"], [30, 5, "mangelhaft"], [0, 6, "ungenügend"]];
  function note(prozent) {
    for (const [ab, n, text] of NOTEN) if (prozent >= ab) return { n, text };
    return { n: 6, text: "ungenügend" };
  }

  const teileVon = m => (m.aufgaben || []).reduce((l, a) => l.concat(a.teile || []), []);

  function auswertung(m, z) {
    const teile = teileVon(m);
    let punkte = 0, max = 0, bewertet = 0, bearbeitet = 0;
    const jeAufgabe = (m.aufgaben || []).map(a => {
      let p = 0, mx = 0, bw = 0, bb = 0;
      (a.teile || []).forEach(t => {
        mx += t.punkte || 0;
        const pt = z.p[t.id];
        if (pt != null) { p += pt; bw++; }
        if (hatAntwort(t, z.a[t.id])) bb++;
      });
      punkte += p; max += mx; bewertet += bw; bearbeitet += bb;
      return { nr: a.nr, titel: a.titel, p, max: mx, bewertet: bw, bearbeitet: bb, n: (a.teile || []).length };
    });
    const prozent = max ? Math.round(punkte / max * 1000) / 10 : 0;
    return { punkte, max, bewertet, bearbeitet, n: teile.length, prozent, note: note(prozent),
             fertig: teile.length > 0 && bewertet === teile.length, jeAufgabe };
  }

  const BISHER_PROZENT = { "sehr gut": 95, "gut": 85, "befriedigend": 73, "ausreichend": 58, "mangelhaft": 40, "ungenügend": 20 };

  /** Reihenfolge der Empfehlung: angefangen → nie gemacht → schwach → Rest */
  function einordnen(m, z, bisher) {
    const s = auswertung(m, z);
    if ((s.bearbeitet > 0 || s.bewertet > 0) && !s.fertig) return { g: "weiter", r: 0, s };
    const letzte = s.fertig ? s.prozent : (z.versuche && z.versuche.length ? z.versuche[z.versuche.length - 1].prozent : null);
    if (letzte == null && !bisher) return { g: "neu", r: 1, s };
    const pr = letzte != null ? letzte : (BISHER_PROZENT[String(bisher).toLowerCase()] != null ? BISHER_PROZENT[String(bisher).toLowerCase()] : 50);
    return pr < 50 ? { g: "schwach", r: 2, pr, s } : { g: "gemacht", r: 3, pr, s };
  }

  function sortiert(module, zustandVon, bisher) {
    return module.map(m => {
      const z = zustandVon(m.id);
      return Object.assign({ m, z }, einordnen(m, z, (bisher || {})[m.id]));
    }).sort((x, y) => x.r - y.r ||
      (x.g === "weiter" ? (y.z.zuletzt || 0) - (x.z.zuletzt || 0) : 0) ||
      ((x.pr != null && y.pr != null) ? x.pr - y.pr : 0) ||
      (x.m.art === y.m.art ? 0 : x.m.art === "pruefung" ? -1 : 1) ||
      x.m.nr - y.m.nr);
  }

  /* ======================================================================
     Paket laden: Ordner (privat/azubi-daten.js) → Gerätespeicher → Datei
     ====================================================================== */
  let PAKET = null;
  let QUELLE = "";          /* "ordner" | "geraet" */
  const gueltig = p => !!(p && typeof p === "object" && Array.isArray(p.module) && p.module.length &&
                         p.module.every(m => m && m.id && Array.isArray(m.aufgaben)) && p.bilder && typeof p.bilder === "object");
  function paket() {
    if (!PAKET && gueltig(root.IHK_AZUBI)) PAKET = root.IHK_AZUBI;
    return PAKET;
  }
  const modul = id => { const p = paket(); return p ? p.module.find(m => m.id === id) || null : null; };

  function idb() {
    return new Promise((ok, nein) => {
      if (!root.indexedDB) { nein(new Error("Kein Gerätespeicher (IndexedDB)")); return; }
      const r = root.indexedDB.open("ihk-azubi", 1);
      r.onupgradeneeded = () => { r.result.createObjectStore("paket"); };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => nein(r.error);
    });
  }
  function idbTu(modus, fn) {
    return idb().then(db => new Promise((ok, nein) => {
      let erg;
      const tx = db.transaction("paket", modus);
      const req = fn(tx.objectStore("paket"));
      if (req) req.onsuccess = () => { erg = req.result; };
      tx.oncomplete = () => { db.close(); ok(erg); };
      tx.onerror = () => { db.close(); nein(tx.error); };
      tx.onabort = () => { db.close(); nein(tx.error); };
    }));
  }

  let ladeVersprechen = null;
  function laden() {
    if (paket()) { QUELLE = QUELLE || "ordner"; return Promise.resolve(PAKET); }
    if (ladeVersprechen) return ladeVersprechen;
    ladeVersprechen = new Promise(fertig => {
      const ausGeraet = () => idbTu("readonly", st => st.get("aktuell"))
        .then(p => { if (gueltig(p)) { root.IHK_AZUBI = p; QUELLE = "geraet"; } fertig(paket()); })
        .catch(() => fertig(paket()));
      if (!hatDom) { ausGeraet(); return; }
      const s = document.createElement("script");
      s.src = "privat/azubi-daten.js";
      s.async = true;
      s.onload = () => { if (paket()) { QUELLE = "ordner"; fertig(PAKET); } else ausGeraet(); };
      s.onerror = () => { s.remove(); ausGeraet(); };
      document.head.appendChild(s);
    });
    return ladeVersprechen;
  }

  function paketAusText(text) {
    const a = text.indexOf("{"), b = text.lastIndexOf("}");
    if (a < 0 || b < a) throw new Error("In der Datei stehen keine Daten.");
    let p;
    try { p = JSON.parse(text.slice(a, b + 1)); } catch (e) { throw new Error("Die Datei ist beschädigt oder unvollständig."); }
    if (!gueltig(p)) throw new Error("Das ist kein Azubi-Navigator-Paket (azubi-daten.js).");
    return p;
  }

  function importieren(datei) {
    const lesen = datei.text ? datei.text() : new Promise((ok, nein) => {
      const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = () => nein(fr.error); fr.readAsText(datei);
    });
    return lesen.then(text => {
      const p = paketAusText(text);
      root.IHK_AZUBI = p; PAKET = p; QUELLE = "geraet";
      paketGeaendert();
      return idbTu("readwrite", st => st.put(p, "aktuell")).then(() => ({ p, gespeichert: true }))
        .catch(() => ({ p, gespeichert: false }));
    });
  }
  function paketVomGeraetEntfernen() {
    return idbTu("readwrite", st => st.delete("aktuell")).catch(() => { });
  }

  /** Andere Bereiche nachziehen: der Katalog zählt Azubi-Aufgaben mit */
  function paketGeaendert() {
    Object.keys(KAT).forEach(k => delete KAT[k]);
    try { if (root.GENKATALOG && root.GENKATALOG.neu) root.GENKATALOG.neu(); } catch (e) { console.error("Azubi/Katalog:", e); }
    try { if (root.GENENDSPURT && root.GENENDSPURT.azubiDa) root.GENENDSPURT.azubiDa(); } catch (e) { console.error("Azubi/Endspurt:", e); }
    try { if (root.GENWIEDER && root.GENWIEDER.block) root.GENWIEDER.block(); } catch (e) { }
  }

  /* ======================================================================
     Zustand je Modul
     ====================================================================== */
  const leerZustand = () => ({ v: 1, modus: null, a: {}, auf: {}, p: {}, auto: {}, zeit: 0, abgegeben: false,
                               versuche: [], start: 0, zuletzt: 0, pos: null });
  function zustand(id) {
    const z = lies(SK + id, null);
    const n = leerZustand();
    if (!z || typeof z !== "object") return n;
    Object.keys(n).forEach(k => { if (z[k] != null && typeof z[k] === typeof n[k]) n[k] = z[k]; });
    if (z.modus === "uebung" || z.modus === "pruefung") n.modus = z.modus;
    if (typeof z.pos === "string") n.pos = z.pos;
    return n;
  }

  const fmt = p => (Math.round(p * 10) / 10).toString().replace(".", ",");
  const plural = (n, a, b) => n + " " + (n === 1 ? a : b);
  const minuten = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const datum = ts => { const d = new Date(ts); return String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + String(d.getFullYear()).slice(2); };

  /* ======================================================================
     Ab hier: Oberfläche (nur im Browser)
     ====================================================================== */
  const ERLAUBT = new Set(["p", "div", "br", "b", "strong", "i", "em", "u", "s", "sub", "sup", "ul", "ol", "li",
    "table", "thead", "tbody", "tfoot", "tr", "td", "th", "pre", "code", "h3", "h4", "hr", "img"]);
  const WEG = new Set(["script", "style", "iframe", "object", "embed", "link", "meta", "svg", "math", "form", "input", "button", "textarea", "select"]);

  function bildSrc(k) {
    const p = paket();
    const v = p && p.bilder && p.bilder[k];
    return (typeof v === "string" && /^data:image\/(png|jpe?g|gif|webp);base64,/.test(v)) ? v : null;
  }

  /** Paket-HTML → sicheres Fragment (Whitelist, keine Attribute außer colspan/rowspan) */
  function sicher(html) {
    const tpl = document.createElement("template");
    tpl.innerHTML = String(html || "");
    const geh = knoten => {
      Array.from(knoten.childNodes).forEach(n => {
        if (n.nodeType === 3) return;
        if (n.nodeType !== 1) { n.remove(); return; }
        const tag = n.tagName.toLowerCase();
        if (WEG.has(tag)) { n.remove(); return; }
        if (!ERLAUBT.has(tag)) { geh(n); n.replaceWith(...Array.from(n.childNodes)); return; }
        Array.from(n.attributes).forEach(at => {
          const an = at.name.toLowerCase();
          const ok = ((tag === "td" || tag === "th") && (an === "colspan" || an === "rowspan") && /^\d{1,2}$/.test(at.value)) ||
                     (tag === "img" && an === "data-bild");
          if (!ok) n.removeAttribute(at.name);
        });
        if (tag === "img") {
          const src = bildSrc(n.getAttribute("data-bild"));
          if (!src) { n.replaceWith(el("span", "az-bild-fehlt", "Bild fehlt — ist auch im Azubi-Navigator leer.")); return; }
          n.setAttribute("src", src); n.setAttribute("alt", ""); n.setAttribute("loading", "lazy");
          n.className = "az-bild";
          return;
        }
        if (tag === "table") {
          geh(n);
          const huelle = el("div", "az-tabelle");
          n.replaceWith(huelle); huelle.appendChild(n);
          return;
        }
        geh(n);
      });
    };
    geh(tpl.content);
    return tpl.content;
  }
  function textAus(html) {
    if (!hatDom) return String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const tpl = document.createElement("template");
    tpl.innerHTML = String(html || "");
    return (tpl.content.textContent || "").replace(/\s+/g, " ").trim();
  }
  function htmlIn(ziel, html) { ziel.appendChild(sicher(html)); return ziel; }

  /* ------------------------------------------------------------ Seite --- */
  let VIEW = { art: "liste" };
  let herkunft = "scStart";
  let LAUF = null;          /* offener Bogen: {m, z, ...} */

  function seite() {
    let s = $("scAzubi");
    if (s) return s;
    s = el("div", "seite az-seite"); s.id = "scAzubi"; s.hidden = true;
    const start = $("scStart");
    if (start && start.parentNode) start.parentNode.insertBefore(s, start.nextSibling);
    else document.body.appendChild(s);
    s.addEventListener("click", ev => {
      const img = ev.target.closest && ev.target.closest("img.az-bild");
      if (img && typeof root.zeigeLupe === "function") root.zeigeLupe(img.src);
    });
    return s;
  }

  function zeigen() {
    const s = seite();
    const vorher = ["scBogen", "scAuswertung", "scKatalog", "scWieder"].find(id => $(id) && !$(id).hidden) || "scStart";
    if (vorher !== "scAzubi") herkunft = vorher;
    document.querySelectorAll("div.seite[id^='sc'], #scBogen").forEach(e => { if (e.id !== "scAzubi") e.hidden = true; });
    s.hidden = false;
    const f = $("fuss"); if (f) f.hidden = true;
    const kt = $("kopfTitel"); if (kt) kt.hidden = false;
    if ($("kTitel")) $("kTitel").textContent = "Azubi-Navigator";
    if ($("kEyebrow")) $("kEyebrow").textContent = "u-form · Prüfungstraining AP1";
    if (root.GENZURUECK) {
      try { root.GENZURUECK.hoeher && root.GENZURUECK.hoeher("scAzubi", (herkunft === "scKatalog" || herkunft === "scWieder") ? "scStart" : herkunft); } catch (e) { }
      try { root.GENZURUECK.knopfPflegen(); } catch (e) { }
    }
  }

  function verlauf(neu) {
    try {
      const st = { ihk: 1, seite: "scAzubi" };
      if (VIEW.art !== "liste") { st.az = VIEW.id; st.azArt = VIEW.art; }
      if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: herkunft }, "");
      const gleich = history.state && history.state.seite === "scAzubi" && history.state.az === st.az && history.state.azArt === st.azArt;
      if (gleich) return;
      if (neu === "ersetzen" && history.state && history.state.seite === "scAzubi") history.replaceState(st, "", location.hash || "");
      else history.pushState(st, "", location.hash || "");
    } catch (e) { }
  }

  /** Öffentlicher Einstieg: ohne id die Übersicht, mit id der Bogen */
  function oeffnen(id, opt) {
    laden().then(() => {
      if (id && !modul(id)) id = null;
      lauffStop();
      VIEW = id ? { art: (opt && opt.ergebnis) ? "ergebnis" : "modul", id, ziel: opt && opt.ziel, modus: opt && opt.modus } : { art: "liste" };
      zeichnen();
      zeigen();
      verlauf();
      if (!VIEW.ziel) root.scrollTo(0, 0);
    });
  }

  function zeichnen() {
    const s = seite();
    s.innerHTML = "";
    const box = el("div", "az-wrap");
    s.appendChild(box);
    if (VIEW.art !== "modul" && LAUF) { lauffStop(); LAUF = null; }
    if (!paket()) { keinPaket(box); return; }
    if (VIEW.art === "modul" && modul(VIEW.id)) bogenZeichnen(box, modul(VIEW.id));
    else if (VIEW.art === "ergebnis" && modul(VIEW.id)) ergebnisZeichnen(box, modul(VIEW.id));
    else { VIEW = { art: "liste" }; listeZeichnen(box); }
  }

  /* --------------------------------------------------------- kein Paket --- */
  function ladeKnopf(text, klasse, danach) {
    const lab = el("label", "btn " + (klasse || "primary") + " az-datei");
    lab.appendChild(el("span", null, text));
    const inp = el("input");
    inp.type = "file";
    inp.accept = ".js,.json,application/json,text/javascript,text/plain";
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      lab.classList.add("laedt");
      importieren(f).then(r => {
        lab.classList.remove("laedt");
        meldung(r.gespeichert ? "Paket geladen und auf diesem Gerät gespeichert." :
          "Paket geladen — der Gerätespeicher ist voll oder gesperrt, nach dem Neuladen ist es wieder weg.");
        if (danach) danach(); else { zeichnen(); block(); }
      }).catch(e => { lab.classList.remove("laedt"); meldung(e.message || String(e), true); });
      inp.value = "";
    };
    lab.appendChild(inp);
    return lab;
  }

  function keinPaket(box) {
    const k = el("div", "az-karte az-leer");
    k.appendChild(el("h2", null, "Azubi-Navigator"));
    k.appendChild(el("p", null, "Auf diesem Gerät ist noch kein Azubi-Navigator-Paket. " +
      "Die Aufgaben sind lizenziertes Material von u-form und liegen deshalb nicht im Netz, sondern nur bei dir."));
    const ol = el("ol", "az-schritte");
    ol.appendChild(el("li", null, "Auf dem Computer liegt das Paket im Ordner ihk-sim unter privat/azubi-daten.js."));
    ol.appendChild(el("li", null, "Schick dir die Datei aufs Handy (z. B. Telegram „Gespeicherte Nachrichten“, Google Drive oder Mail an dich)."));
    ol.appendChild(el("li", null, "Hier auf „Paket laden“ tippen und die Datei auswählen. Einmal reicht — danach bleibt sie auf dem Gerät."));
    k.appendChild(ol);
    const st = el("div", "steuer");
    st.appendChild(ladeKnopf("Paket laden"));
    k.appendChild(st);
    box.appendChild(k);
  }

  let meldTimer = null;
  function meldung(text, fehler) {
    let m = $("azMeldung");
    if (!m) { m = el("div", "az-meldung"); m.id = "azMeldung"; m.setAttribute("role", "status"); document.body.appendChild(m); }
    m.textContent = text;
    m.classList.toggle("fehler", !!fehler);
    m.classList.add("an");
    clearTimeout(meldTimer);
    meldTimer = setTimeout(() => m.classList.remove("an"), fehler ? 6000 : 3200);
  }

  /* ------------------------------------------------------------- Liste --- */
  const GRUPPEN = {
    weiter: ["Weitermachen", "Angefangen — genau dort geht es weiter."],
    neu: ["Noch nie gemacht", "Weder hier noch im Azubi-Navigator bearbeitet."],
    schwach: ["Schwach — wiederholen", "Unter 50 % (hier oder im Azubi-Navigator)."],
    gemacht: ["Schon gemacht", "Zum Wiederholen, schwächste zuerst."]
  };

  function statusText(e) {
    const s = e.s;
    if (e.g === "weiter") return s.bearbeitet + "/" + s.n + " bearbeitet · " + fmt(s.punkte) + " P. bewertet";
    if (s.fertig) return fmt(s.punkte) + " / " + fmt(s.max) + " P. · " + fmt(s.prozent) + " % · " + s.note.text;
    const v = e.z.versuche && e.z.versuche[e.z.versuche.length - 1];
    if (v) return "Letzter Versuch: " + fmt(v.prozent) + " % · " + v.note;
    return plural(s.n, "Teilaufgabe", "Teilaufgaben") + " · noch nicht angefangen";
  }

  function modulKarte(e, bisher) {
    const m = e.m;
    const c = el("article", "az-mk g-" + e.g);
    const kopf = el("div", "az-mk-kopf");
    kopf.appendChild(el("span", "az-mk-nr " + (m.art === "pruefung" ? "p" : "v"), m.art === "pruefung" ? "P" + String(m.nr).padStart(2, "0") : "VÜ" + m.nr));
    const tt = el("div", "az-mk-titel");
    tt.appendChild(el("b", null, m.titel));
    tt.appendChild(el("span", null, (m.aufgaben || []).length + " Aufgaben · " + fmt(m.punkte) + " P. · " + m.minuten + " Min." +
      (m.art === "vertiefung" ? " · Vertiefende Übung" : "")));
    kopf.appendChild(tt);
    c.appendChild(kopf);
    const s = e.s;
    const bar = el("div", "az-bar");
    const i1 = el("i", "b"); i1.style.width = (s.n ? s.bearbeitet / s.n * 100 : 0) + "%";
    bar.appendChild(i1);
    c.appendChild(bar);
    const zeile = el("div", "az-mk-status");
    zeile.appendChild(el("span", null, statusText(e)));
    if (bisher) zeile.appendChild(el("span", "az-chip n-" + normText(bisher).replace(/\s/g, ""), "Azubi-Navigator: " + bisher));
    else if (e.g === "neu") zeile.appendChild(el("span", "az-chip neu", "neu"));
    if (e.z.modus === "pruefung" && e.g === "weiter" && !e.z.abgegeben) zeile.appendChild(el("span", "az-chip uhr", "Uhr " + minuten(e.z.zeit)));
    c.appendChild(zeile);
    const st = el("div", "az-mk-knoepfe");
    const haupt = el("button", "btn primary", e.g === "weiter" ? "Weiter" : (s.fertig ? "Ansehen" : "Starten"));
    haupt.type = "button";
    haupt.onclick = () => oeffnen(m.id);
    st.appendChild(haupt);
    if (s.bewertet > 0) {
      const erg = el("button", "btn", "Auswertung");
      erg.type = "button"; erg.onclick = () => oeffnen(m.id, { ergebnis: true });
      st.appendChild(erg);
    }
    c.appendChild(st);
    return c;
  }

  function listeZeichnen(box) {
    const P = paket();
    const liste = sortiert(P.module, zustand, P.bisher);
    const kopf = el("div", "az-karte az-kopf");
    const t = el("div", "az-kopf-titel");
    t.appendChild(el("h2", null, "Azubi-Navigator"));
    t.appendChild(el("p", "az-quelle", "u-form · Prüfungsvorbereitung AP1 mit realistischen Situationen · Stand " +
      (P.stand ? P.stand.split("-").reverse().join(".") : "–")));
    kopf.appendChild(t);
    const zahl = g => liste.filter(e => e.g === g).length;
    const fakten = el("div", "az-fakten");
    [[liste.filter(e => e.s.fertig).length, "fertig"], [zahl("weiter"), "angefangen"], [zahl("neu"), "nie gemacht"], [zahl("schwach"), "schwach"]]
      .forEach(([n, txt]) => { const f = el("div", "az-fakt"); f.appendChild(el("b", null, String(n))); f.appendChild(el("span", null, txt)); fakten.appendChild(f); });
    kopf.appendChild(fakten);
    kopf.appendChild(el("p", "az-info", "Alles wird bei jeder Eingabe auf diesem Gerät gespeichert. Aufhören, App schließen, später genau dort weitermachen."));
    const erst = liste[0];
    if (erst) {
      const b = el("button", "btn primary az-naechste");
      b.type = "button";
      b.innerHTML = ik("play", 16);
      b.appendChild(el("span", null, (erst.g === "weiter" ? "Weiter: " : "Als Nächstes: ") + erst.m.kurz + " — " + erst.m.titel));
      b.onclick = () => oeffnen(erst.m.id);
      kopf.appendChild(b);
    }
    box.appendChild(kopf);

    ["weiter", "neu", "schwach", "gemacht"].forEach(g => {
      const teil = liste.filter(e => e.g === g);
      if (!teil.length) return;
      const sec = el("section", "az-gruppe");
      const h = el("h3", null, GRUPPEN[g][0]);
      h.appendChild(el("span", "n", String(teil.length)));
      sec.appendChild(h);
      sec.appendChild(el("p", "az-info", GRUPPEN[g][1]));
      const gitter = el("div", "az-gitter");
      teil.forEach(e => gitter.appendChild(modulKarte(e, (P.bisher || {})[e.m.id])));
      sec.appendChild(gitter);
      box.appendChild(sec);
    });

    /* Paket */
    const pk = el("details", "az-paket");
    pk.appendChild(el("summary", null, "Datenpaket · " + (QUELLE === "geraet" ? "im Gerätespeicher" : "aus dem Ordner privat/")));
    const inn = el("div", "az-paket-in");
    inn.appendChild(el("p", null, "Lizenziertes Material von u-form aus deinem Azubi-Navigator-Konto. Es liegt nur auf deinen Geräten, " +
      "nicht auf GitHub Pages. Dein Fortschritt steckt im normalen Export der App (Daten → Export) und wandert damit mit."));
    const st = el("div", "steuer");
    const speichern = el("button", "btn", "Paket fürs Handy speichern");
    speichern.type = "button";
    speichern.onclick = () => {
      try {
        const blob = new Blob(["window.IHK_AZUBI = " + JSON.stringify(paket()) + ";\n"], { type: "text/javascript" });
        const a = el("a"); a.href = URL.createObjectURL(blob); a.download = "azubi-daten.js";
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      } catch (e) { meldung("Speichern ging nicht: " + e.message, true); }
    };
    st.appendChild(speichern);
    st.appendChild(ladeKnopf("Anderes Paket laden", "ghost"));
    if (QUELLE === "geraet") {
      const weg = el("button", "btn ghost", "Paket vom Gerät entfernen");
      weg.type = "button";
      weg.onclick = () => bestaetigen(weg, "Wirklich entfernen? Dein Fortschritt bleibt.", () => {
        paketVomGeraetEntfernen().then(() => { PAKET = null; root.IHK_AZUBI = null; ladeVersprechen = null; QUELLE = ""; paketGeaendert(); zeichnen(); block(); });
      });
      st.appendChild(weg);
    }
    inn.appendChild(st);
    pk.appendChild(inn);
    box.appendChild(pk);
  }

  /** Zweistufiger Knopf statt confirm(): erst tippen, dann „Ja“ */
  function bestaetigen(knopf, frage, tun) {
    if (knopf.dataset.frage) return;
    const alt = knopf.textContent;
    knopf.dataset.frage = "1";
    const leiste = el("span", "az-frage");
    leiste.appendChild(el("span", null, frage));
    const ja = el("button", "btn warn klein", "Ja");
    ja.type = "button";
    const nein = el("button", "btn ghost klein", "Nein");
    nein.type = "button";
    leiste.append(ja, nein);
    knopf.hidden = true;
    knopf.insertAdjacentElement("afterend", leiste);
    const zu = () => { leiste.remove(); knopf.hidden = false; delete knopf.dataset.frage; knopf.textContent = alt; };
    ja.onclick = () => { zu(); tun(); };
    nein.onclick = zu;
  }

  /* ------------------------------------------------------ Katalog-Bezug --- */
  const KAT = {};
  function katalogFuer(m) {
    if (KAT[m.id]) return KAT[m.id];
    const Kat = root.IHK_KATALOG_AP1, Kern = root.IHKKatalogKern;
    const erg = {};
    if (!Kat || !Kern) return (KAT[m.id] = erg);
    try {
      const teile = teileVon(m);
      const A = Kern.abdeckung(Kat, { azubi: teile.map(t => ({ key: t.id, text: textAus(t.titel + " " + t.text + " " + t.loesung) })) });
      teile.forEach(t => {
        const ids = A.umgekehrt["azubi:" + t.id] || [];
        const n = {};
        ids.forEach(id => { const k = id.slice(0, 5); n[k] = (n[k] || 0) + 1; });
        const kreise = Object.keys(n).sort((a, b) => n[b] - n[a] || (a < b ? -1 : 1)).slice(0, 2);
        const nicht = Kern.nichtAP1(Kat, textAus(t.titel + " " + t.text)).filter(e => e.art === "gestrichen" || e.art === "ap2");
        erg[t.id] = { kreise, nicht };
      });
    } catch (e) { console.error("Azubi/Katalog:", e); }
    return (KAT[m.id] = erg);
  }

  /* -------------------------------------------------------------- Bogen --- */
  function lauffStop() {
    if (LAUF && LAUF.uhr) { clearInterval(LAUF.uhr); LAUF.uhr = null; }
    if (LAUF) sichern(true);
  }

  let sicherTimer = null;
  function sichern(sofort) {
    if (!LAUF) return;
    clearTimeout(sicherTimer);
    const tu = () => {
      if (!LAUF) return;
      LAUF.z.zuletzt = Date.now();
      const ok = schreib(SK + LAUF.m.id, LAUF.z);
      const g = $("azGespeichert");
      if (g) {
        const d = new Date();
        g.textContent = ok ? "✓ " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") : "Speicher voll!";
        g.classList.toggle("fehler", !ok);
      }
    };
    if (sofort) tu(); else sicherTimer = setTimeout(tu, 350);
  }

  function bogenZeichnen(box, m) {
    if (LAUF) lauffStop();          /* Uhr anhalten und Stand sichern, bevor neu gelesen wird */
    const z = zustand(m.id);
    LAUF = { m, z, uhr: null, tick: Date.now() };
    if (!z.start) z.start = Date.now();
    /* Sprung aus Katalog/Suche auf eine bestimmte Teilaufgabe: gleich üben.
       Aus dem Endspurt kommt nur eine Empfehlung — die Uhr startet erst,
       wenn man selbst „Als Prüfung“ tippt. */
    if (!z.modus && VIEW.ziel) {
      z.modus = "uebung"; z.start = Date.now(); z.zeit = 0; z.abgegeben = false;
      sichern(true);
    }
    const empfohlen = VIEW.modus; VIEW.modus = null;
    if (!z.modus) { startKarte(box, m, z, empfohlen); return; }

    box.appendChild(leiste(m, z));

    /* Einleitung / Situation */
    if ((m.einleitung || []).length) {
      const d = el("details", "az-situation");
      d.id = "azSituation";
      d.open = !Object.keys(z.a).length;
      d.appendChild(el("summary", null, m.art === "pruefung" ? "Ausgangssituation" : "Einleitung"));
      m.einleitung.forEach(e => {
        const b = el("div", "az-text");
        if (m.einleitung.length > 1 && e.titel) b.appendChild(el("h4", null, textAus(e.titel)));
        htmlIn(b, e.html);
        d.appendChild(b);
        (e.anlagen || []).forEach(an => d.appendChild(anlage(an)));
      });
      box.appendChild(d);
    }

    if (z.modus === "pruefung" && z.abgegeben) {
      const s = auswertung(m, z);
      const offen = s.n - s.bewertet;
      if (offen) {
        const h = el("div", "az-hinweisbox");
        h.appendChild(el("b", null, "Abgegeben. "));
        h.appendChild(document.createTextNode("Zahlen, Tabellen, Zuordnungen und leere Felder sind schon bewertet. Noch " +
          plural(offen, "Textantwort", "Textantworten") + " mit der Musterlösung selbst bewerten — dann steht die Note."));
        box.appendChild(h);
      }
    }

    (m.aufgaben || []).forEach(a => {
      const sec = el("section", "az-aufgabe");
      sec.id = "aza-" + a.nr;
      const h = el("h3", "az-aufgabe-kopf");
      h.appendChild(el("span", null, a.titel));
      const mx = (a.teile || []).reduce((s, t) => s + (t.punkte || 0), 0);
      h.appendChild(el("span", "n", fmt(mx) + " P."));
      sec.appendChild(h);
      (a.teile || []).forEach(t => sec.appendChild(teilKarte(m, t, z)));
      box.appendChild(sec);
    });

    const fuss = el("div", "az-bogen-fuss");
    if (z.modus === "pruefung" && !z.abgegeben) fuss.appendChild(abgebenKnopf(m, z));
    const erg = el("button", "btn" + (z.modus === "pruefung" && !z.abgegeben ? "" : " primary"), "Auswertung");
    erg.type = "button"; erg.onclick = () => oeffnen(m.id, { ergebnis: true });
    fuss.appendChild(erg);
    const ueb = el("button", "btn ghost", "Zur Übersicht");
    ueb.type = "button"; ueb.onclick = () => oeffnen(null);
    fuss.appendChild(ueb);
    box.appendChild(fuss);

    leisteAktualisieren();
    uhrStarten();

    const ziel = VIEW.ziel || z.pos, blink = !!VIEW.ziel;
    if (ziel) setTimeout(() => springeZu(ziel, blink), 60);
    VIEW.ziel = null;
  }

  function springeZu(teilId, blinken) {
    const c = $("azt-" + teilId);
    if (!c) return;
    const y = c.getBoundingClientRect().top + root.scrollY - 128;
    root.scrollTo({ top: Math.max(0, y), behavior: blinken ? "smooth" : "auto" });
    if (blinken) { c.classList.add("az-blink"); setTimeout(() => c.classList.remove("az-blink"), 1600); }
  }

  function startKarte(box, m, z, empfohlen) {
    const P = paket();
    const k = el("div", "az-karte az-start");
    k.appendChild(el("span", "az-eyebrow", m.kurz + (m.art === "vertiefung" ? " · Vertiefende Übung" : " · Prüfungssimulation")));
    k.appendChild(el("h2", null, m.titel));
    const intro = el("div", "az-text az-intro");
    htmlIn(intro, m.intro);
    k.appendChild(intro);
    const b = (P.bisher || {})[m.id];
    if (b) k.appendChild(el("p", "az-info", "Im Azubi-Navigator bisher: " + b + "."));
    if (z.versuche.length) {
      const v = z.versuche[z.versuche.length - 1];
      k.appendChild(el("p", "az-info", "Hier zuletzt (" + datum(v.d) + "): " + fmt(v.prozent) + " % · " + v.note + "."));
    }
    const wahl = el("div", "az-modi");
    const modus = (art, titel, text) => {
      const c = el("button", "az-modus" + (empfohlen === art ? " empf" : ""));
      c.type = "button";
      if (empfohlen === art) c.appendChild(el("span", "az-chip az-empf", "laut Plan"));
      c.appendChild(el("b", null, titel));
      c.appendChild(el("span", null, text));
      c.onclick = () => { z.modus = art; z.start = Date.now(); z.zeit = 0; z.abgegeben = false; LAUF = { m, z }; sichern(true); zeichnen(); root.scrollTo(0, 0); };
      wahl.appendChild(c);
    };
    modus("uebung", "Als Übung", "Nach jeder Teilaufgabe die Lösung ansehen und dich bewerten. Ohne Uhr.");
    modus("pruefung", "Als Prüfung", "Uhr läuft (" + m.minuten + " Min.), Lösungen erst nach „Abgeben“. Wie am 30.09.");
    k.appendChild(wahl);
    k.appendChild(el("p", "az-info", "Egal wie: Jede Eingabe wird sofort gespeichert. Du kannst jederzeit aufhören."));
    box.appendChild(k);
  }

  function leiste(m, z) {
    const l = el("div", "az-leiste");
    l.id = "azLeiste";
    const oben = el("div", "az-leiste-oben");
    const t = el("div", "az-leiste-titel");
    t.appendChild(el("b", null, m.kurz));
    t.appendChild(el("span", null, m.titel));
    oben.appendChild(t);
    const werte = el("div", "az-leiste-werte");
    const bb = el("span", "az-wert"); bb.id = "azBearbeitet"; werte.appendChild(bb);
    const pp = el("span", "az-wert"); pp.id = "azPunkte"; werte.appendChild(pp);
    if (z.modus === "pruefung" && !z.abgegeben) { const u = el("span", "az-wert uhr"); u.id = "azUhr"; werte.appendChild(u); }
    const g = el("span", "az-wert gesp"); g.id = "azGespeichert"; g.title = "Automatisch gespeichert"; werte.appendChild(g);
    oben.appendChild(werte);
    l.appendChild(oben);
    const nav = el("div", "az-nav");
    nav.id = "azNav";
    if ((m.einleitung || []).length) {
      const s = el("button", "az-navk", m.art === "pruefung" ? "Situation" : "Einleitung");
      s.type = "button";
      s.onclick = () => { const d = $("azSituation"); if (d) { d.open = true; const y = d.getBoundingClientRect().top + root.scrollY - 128; root.scrollTo({ top: y, behavior: "smooth" }); } };
      nav.appendChild(s);
    }
    (m.aufgaben || []).forEach(a => {
      const b = el("button", "az-navk");
      b.type = "button";
      b.dataset.nr = a.nr;
      b.onclick = () => { const s = $("aza-" + a.nr); if (s) { const y = s.getBoundingClientRect().top + root.scrollY - 124; root.scrollTo({ top: y, behavior: "smooth" }); } };
      nav.appendChild(b);
    });
    l.appendChild(nav);
    return l;
  }

  function leisteAktualisieren() {
    if (!LAUF) return;
    const { m, z } = LAUF;
    const s = auswertung(m, z);
    const bb = $("azBearbeitet"); if (bb) bb.textContent = s.bearbeitet + "/" + s.n + " bearbeitet";
    const pp = $("azPunkte");
    if (pp) pp.textContent = (z.modus === "pruefung" && !z.abgegeben) ? fmt(s.max) + " P. möglich" : fmt(s.punkte) + " P. bewertet";
    const nav = $("azNav");
    if (nav) s.jeAufgabe.forEach(a => {
      const b = nav.querySelector('[data-nr="' + a.nr + '"]');
      if (!b) return;
      b.textContent = "A" + a.nr + " " + a.bearbeitet + "/" + a.n;
      b.classList.toggle("fertig", a.bearbeitet === a.n);
    });
    uhrZeigen();
  }

  function uhrZeigen() {
    const u = $("azUhr");
    if (!u || !LAUF) return;
    const z = LAUF.z, max = (LAUF.m.minuten || 90) * 60000;
    u.textContent = minuten(z.zeit) + " / " + LAUF.m.minuten + ":00";
    u.classList.toggle("knapp", z.zeit > max - 10 * 60000 && z.zeit <= max);
    u.classList.toggle("vorbei", z.zeit > max);
  }

  function uhrStarten() {
    if (!LAUF || LAUF.uhr) return;
    const z = LAUF.z;
    if (z.modus !== "pruefung" || z.abgegeben) return;
    LAUF.tick = Date.now();
    let zaehler = 0;
    LAUF.uhr = setInterval(() => {
      if (!LAUF) return;
      const jetzt = Date.now();
      if (document.visibilityState !== "hidden") LAUF.z.zeit += Math.min(5000, jetzt - LAUF.tick);
      LAUF.tick = jetzt;
      uhrZeigen();
      if (++zaehler % 15 === 0) sichern(true);
    }, 1000);
  }

  function abgebenKnopf(m, z) {
    const b = el("button", "btn primary", "Abgeben");
    b.type = "button";
    b.onclick = () => bestaetigen(b, "Abgeben? Danach siehst du alle Lösungen.", () => {
      z.abgegeben = true;
      teileVon(m).forEach(t => {
        z.auf[t.id] = 1;
        const r = pruefe(t, z.a[t.id]);
        if (z.p[t.id] != null) return;
        /* Geschlossene Aufgaben bewertet die App, leere Aufgaben sind sicher 0 */
        if (r.vorschlag != null) { z.p[t.id] = r.vorschlag; z.auto[t.id] = 1; }
        else if (!hatAntwort(t, z.a[t.id])) { z.p[t.id] = 0; z.auto[t.id] = 1; }
      });
      if (LAUF && LAUF.uhr) { clearInterval(LAUF.uhr); LAUF.uhr = null; }
      sichern(true);
      zeichnen();
      root.scrollTo(0, 0);
    });
    return b;
  }

  /* --------------------------------------------------------- Teilaufgabe --- */
  function anlage(an) {
    const d = el("details", "az-anlage");
    d.appendChild(el("summary", null, "Anlage: " + textAus(an.titel)));
    const i = el("div", "az-text");
    htmlIn(i, an.html);
    d.appendChild(i);
    return d;
  }

  function teilKarte(m, t, z) {
    const a = z.a[t.id];
    const auf = !!z.auf[t.id];
    const p = z.p[t.id];
    const c = el("article", "az-teil");
    c.id = "azt-" + t.id;
    c.dataset.id = t.id;
    if (hatAntwort(t, a)) c.classList.add("bearbeitet");
    if (p != null) c.classList.add("bewertet", p >= t.punkte ? "voll" : p > 0 ? "teils" : "null");

    const kopf = el("header", "az-teil-kopf");
    kopf.appendChild(el("span", "az-nr", t.nr + " " + t.label));
    kopf.appendChild(el("h4", null, textAus(t.titel)));
    kopf.appendChild(el("span", "az-p", (p != null ? fmt(p) + " / " : "") + fmt(t.punkte) + " P."));
    c.appendChild(kopf);

    const meta = el("div", "az-meta");
    if (t.sek) meta.appendChild(el("span", "az-min", "≈ " + Math.max(1, Math.round(t.sek / 60)) + " Min."));
    const kat = katalogFuer(m)[t.id];
    if (kat) {
      kat.kreise.forEach(k => {
        const b = el("button", "kt-etikett klein", "Katalog " + k);
        b.type = "button";
        b.title = "Im Prüfungskatalog öffnen";
        b.onclick = () => { if (root.GENKATALOG) { sichern(true); root.GENKATALOG.oeffnen(k); } };
        meta.appendChild(b);
      });
      kat.nicht.forEach(e => meta.appendChild(el("span", "az-chip warn", (e.art === "ap2" ? "laut Katalog AP2: " : "gestrichen: ") + e.label)));
    }
    if (meta.childNodes.length) c.appendChild(meta);

    const tx = el("div", "az-text");
    htmlIn(tx, t.text);
    c.appendChild(tx);
    (t.anlagen || []).forEach(an => c.appendChild(anlage(an)));

    c.appendChild(eingabe(m, t, z, c));

    if (auf) {
      c.appendChild(loesungTeil(m, t, z, c));
      markenSetzen(c, t, z.a[t.id]);
    } else if (z.modus === "uebung") {
      const ak = el("div", "az-aktionen");
      const zeig = el("button", "btn", hatAntwort(t, a) ? "Prüfen & Lösung zeigen" : "Lösung zeigen");
      zeig.type = "button";
      zeig.onclick = () => {
        z.auf[t.id] = 1;
        const r = pruefe(t, z.a[t.id]);
        if (r.vorschlag != null && z.p[t.id] == null && hatAntwort(t, z.a[t.id])) { z.p[t.id] = r.vorschlag; z.auto[t.id] = 1; }
        z.pos = t.id;
        sichern(true);
        ersetzeKarte(m, t, z);
        leisteAktualisieren();
      };
      ak.appendChild(zeig);
      c.appendChild(ak);
    }
    return c;
  }

  function ersetzeKarte(m, t, z) {
    const alt = $("azt-" + t.id);
    if (alt) alt.replaceWith(teilKarte(m, t, z));
  }

  /* Eingaben -------------------------------------------------------------- */
  function eingabe(m, t, z, karte) {
    const E = t.eingabe || { typ: "zeilen", zeilen: [] };
    const box = el("div", "az-eingabe typ-" + E.typ);
    const wert = k => (z.a[t.id] || {})[k];
    const setze = (k, v) => {
      const aa = z.a[t.id] || (z.a[t.id] = {});
      if (leer(v)) delete aa[k]; else aa[k] = v;
      if (!Object.keys(aa).length) delete z.a[t.id];
      z.pos = t.id;
      karte.classList.toggle("bearbeitet", hatAntwort(t, z.a[t.id]));
      if (z.auf[t.id]) markenSetzen(karte, t, z.a[t.id]);
      sichern();
      leisteAktualisieren();
    };
    const feldInput = (f, klasse) => {
      const i = el("input", "az-f" + (klasse ? " " + klasse : ""));
      i.type = "text";
      i.dataset.key = "f" + f.id;
      i.autocomplete = "off"; i.spellcheck = false;
      i.setAttribute("autocapitalize", "off");
      if (f.art === "zahl") i.inputMode = "decimal";
      const w = wert("f" + f.id); if (w != null) i.value = w;
      i.addEventListener("input", () => setze("f" + f.id, i.value));
      return i;
    };

    if (E.typ === "raster") {
      const huelle = el("div", "az-tabelle");
      const tab = el("table", "az-raster");
      const tb = el("tbody");
      const zellen = E.zellen || [];
      for (let r = 0; r < E.zeilen; r++) {
        const tr = el("tr");
        for (let s = 0; s < E.spalten; s++) {
          const zz = zellen[r * E.spalten + s];
          const td = el(zz && zz.h && r === 0 ? "th" : "td");
          if (zz && zz.f) {
            const lab = el("label", "az-zelle");
            lab.appendChild(feldInput(zz.f));
            if (zz.f.einheit) lab.appendChild(el("span", "az-einheit", zz.f.einheit));
            td.appendChild(lab);
          } else if (zz && zz.h) htmlIn(td, zz.h);
          tr.appendChild(td);
        }
        tb.appendChild(tr);
      }
      tab.appendChild(tb);
      huelle.appendChild(tab);
      box.appendChild(huelle);
    } else if (E.typ === "zuordnung") {
      const leg = el("div", "az-optionen");
      leg.appendChild(el("b", null, textAus(E.otitel) || "Auswahl"));
      const ol = el("ol");
      E.optionen.forEach(o => ol.appendChild(htmlIn(el("li"), o)));
      leg.appendChild(ol);
      box.appendChild(leg);
      (E.zeilen || []).forEach(zl => {
        const r = el("div", "az-zuo");
        htmlIn(r.appendChild(el("div", "az-zuo-text")), zl.h);
        const sel = el("select", "az-sel");
        sel.dataset.key = "z" + zl.id;
        sel.appendChild(el("option", null, "–"));
        sel.firstChild.value = "";
        E.optionen.forEach((o, i) => { const op = el("option", null, (i + 1) + " – " + textAus(o)); op.value = String(i + 1); sel.appendChild(op); });
        const w = wert("z" + zl.id); if (w != null) sel.value = String(w);
        sel.addEventListener("change", () => setze("z" + zl.id, sel.value));
        r.appendChild(sel);
        box.appendChild(r);
      });
    } else if (E.typ === "wahl") {
      if (E.ftitel) box.appendChild(el("div", "az-wahl-titel", textAus(E.ftitel)));
      (E.zeilen || []).forEach(zl => {
        const r = el("div", "az-wahl");
        r.dataset.key = "w" + zl.id;
        r.setAttribute("role", "radiogroup");
        const txt = htmlIn(el("div", "az-wahl-text"), zl.h);
        r.setAttribute("aria-label", textAus(zl.h));
        r.appendChild(txt);
        const reihe = el("div", "az-wahl-reihe");
        zl.optionen.forEach((o, i) => {
          const lab = el("label", "az-opt");
          lab.dataset.i = String(i);
          const inp = el("input");
          inp.type = "radio"; inp.name = "azw-" + t.id + "-" + zl.id; inp.value = String(i);
          if (String(wert("w" + zl.id)) === String(i)) inp.checked = true;
          inp.addEventListener("change", () => setze("w" + zl.id, i));
          lab.appendChild(inp);
          htmlIn(lab.appendChild(el("span")), o);
          reihe.appendChild(lab);
        });
        r.appendChild(reihe);
        box.appendChild(r);
      });
    } else if (E.typ === "mehrfach") {
      const f = el("fieldset", "az-mehr");
      f.dataset.key = "m";
      f.appendChild(el("legend", null, "Wähle " + E.anzahl + " aus."));
      E.optionen.forEach((o, i) => {
        const lab = el("label", "az-opt");
        lab.dataset.i = String(i + 1);
        const inp = el("input");
        inp.type = "checkbox"; inp.value = String(i + 1);
        const gew = wert("m") || [];
        if (gew.indexOf(i + 1) >= 0) inp.checked = true;
        inp.addEventListener("change", () => {
          const neu = Array.from(f.querySelectorAll("input:checked")).map(x => Number(x.value));
          setze("m", neu);
        });
        lab.appendChild(inp);
        htmlIn(lab.appendChild(el("span")), o);
        f.appendChild(lab);
      });
      box.appendChild(f);
    } else {
      (E.zeilen || []).forEach(zl => {
        const r = el("div", "az-zeile");
        if (zl.h) htmlIn(r.appendChild(el("div", "az-zeile-text")), zl.h);
        if (zl.frei) {
          const ta = el("textarea", "az-frei");
          ta.dataset.key = "t" + zl.frei;
          ta.rows = zl.gross ? 6 : 3;
          ta.placeholder = "Deine Antwort …";
          const w = wert("t" + zl.frei); if (w != null) ta.value = w;
          ta.addEventListener("input", () => setze("t" + zl.frei, ta.value));
          r.appendChild(ta);
        }
        if (zl.felder && zl.felder.length) {
          const fz = el("div", "az-felder");
          zl.felder.forEach(f => {
            const lab = el("label", "az-feld");
            lab.appendChild(feldInput(f));
            if (f.einheit) lab.appendChild(el("span", "az-einheit", f.einheit));
            fz.appendChild(lab);
          });
          r.appendChild(fz);
        }
        box.appendChild(r);
      });
      /* Rechenaufgaben: Platz für den Rechenweg — der bringt in der echten Prüfung Teilpunkte */
      const zl = E.zeilen || [];
      if (!zl.some(x => x.frei) && zl.some(x => x.felder && x.felder.length)) {
        const ta = el("textarea", "az-frei az-rechenweg");
        ta.dataset.key = "rw";
        ta.rows = 2;
        ta.placeholder = "Rechenweg (optional) — bringt in der echten Prüfung Teilpunkte";
        const w = wert("rw"); if (w != null) ta.value = w;
        ta.addEventListener("input", () => setze("rw", ta.value));
        box.appendChild(ta);
      }
    }
    return box;
  }

  const sollText = f => (f.soll || []).slice(0, 3).join(" / ");

  /** Richtig/falsch an die Eingaben schreiben (nach „Lösung zeigen“) */
  function markenSetzen(karte, t, a) {
    const r = pruefe(t, a);
    const E = t.eingabe || {};
    karte.querySelectorAll(".az-soll").forEach(x => x.remove());
    stellen(t).forEach(s => {
      const ok = !!r.marken[s.key];
      if (s.art === "feld") {
        const i = karte.querySelector('input[data-key="' + s.key + '"]');
        if (!i) return;
        i.classList.toggle("ok", ok); i.classList.toggle("falsch", !ok);
        if (!ok) { const h = el("span", "az-soll", "✓ " + sollText(s.f)); i.parentNode.appendChild(h); }
      } else if (s.art === "zuordnung") {
        const sel = karte.querySelector('select[data-key="' + s.key + '"]');
        if (!sel) return;
        sel.classList.toggle("ok", ok); sel.classList.toggle("falsch", !ok);
        if (!ok) {
          const o = E.optionen[Number(s.soll) - 1];
          sel.parentNode.appendChild(el("span", "az-soll", "✓ " + s.soll + (o ? " – " + textAus(o) : "")));
        }
      } else if (s.art === "wahl") {
        const fs = karte.querySelector('.az-wahl[data-key="' + s.key + '"]');
        if (!fs) return;
        fs.classList.toggle("ok", ok); fs.classList.toggle("falsch", !ok);
        fs.querySelectorAll(".az-opt").forEach(l => {
          const i = Number(l.dataset.i);
          const gew = l.querySelector("input").checked;
          l.classList.toggle("soll", i === s.soll);
          l.classList.toggle("falsch", gew && i !== s.soll);
        });
      } else if (s.art === "mehrfach") {
        const fs = karte.querySelector('fieldset[data-key="m"]');
        if (!fs) return;
        fs.querySelectorAll(".az-opt").forEach(l => {
          const i = Number(l.dataset.i);
          const gew = l.querySelector("input").checked;
          l.classList.toggle("soll", s.soll.indexOf(i) >= 0);
          l.classList.toggle("falsch", gew && s.soll.indexOf(i) < 0);
        });
      }
    });
    const zf = karte.querySelector(".az-auto");
    if (zf) zf.textContent = autoText(t, r);
  }

  function autoText(t, r) {
    if (!r.pruefbar) return "";
    const E = t.eingabe || {};
    const was = E.typ === "mehrfach" ? "Treffer (falsche ziehen ab)" : E.typ === "wahl" || E.typ === "zuordnung" ? "Zeilen richtig" : "Felder richtig";
    return "Automatisch geprüft: " + r.k + " von " + r.n + " " + was +
      (r.vorschlag != null ? " → Vorschlag " + fmt(r.vorschlag) + " P." : " — der Rest ist Text, den bewertest du selbst.");
  }

  function loesungTeil(m, t, z, karte) {
    const box = el("div", "az-loesung");
    const r = pruefe(t, z.a[t.id]);
    if (r.pruefbar) box.appendChild(el("p", "az-auto", autoText(t, r)));
    box.appendChild(el("h5", null, "Musterlösung"));
    const l = el("div", "az-text");
    if (t.loesung) htmlIn(l, t.loesung); else l.textContent = "Im Azubi-Navigator ist hier keine Musterlösung hinterlegt.";
    box.appendChild(l);
    if (t.hinweis) {
      const h = el("div", "az-hinweis");
      h.appendChild(el("b", null, "So wird bewertet: "));
      h.appendChild(sicher(t.hinweis));
      box.appendChild(h);
    }
    box.appendChild(bewerten(m, t, z, r));
    const nochmal = el("button", "btn ghost klein az-nochmal", "Diese Teilaufgabe neu versuchen");
    nochmal.type = "button";
    nochmal.onclick = () => {
      delete z.a[t.id]; delete z.auf[t.id]; delete z.p[t.id]; delete z.auto[t.id];
      sichern(true); ersetzeKarte(m, t, z); leisteAktualisieren();
    };
    if (z.modus === "uebung") box.appendChild(nochmal);
    return box;
  }

  function bewerten(m, t, z, r) {
    const box = el("div", "az-bewerten");
    const kopf = el("div", "az-bew-kopf");
    kopf.appendChild(el("b", null, "Deine Punkte"));
    if (z.auto[t.id] && z.p[t.id] != null) kopf.appendChild(el("span", "az-chip", "automatisch — änderbar"));
    else if (z.p[t.id] == null) kopf.appendChild(el("span", "az-chip warn", "noch nicht bewertet"));
    box.appendChild(kopf);
    const max = t.punkte || 0;
    const setze = v => {
      z.p[t.id] = Math.max(0, Math.min(max, v));
      delete z.auto[t.id];
      sichern(true);
      ersetzeKarte(m, t, z);
      leisteAktualisieren();
    };
    const wahl = el("div", "az-pwahl");
    if (max <= 12) {
      for (let i = 0; i <= max; i++) {
        const b = el("button", "az-pk", String(i));
        b.type = "button";
        if (z.p[t.id] === i) b.classList.add("an");
        if (r.vorschlag === i) b.classList.add("vorschlag");
        b.onclick = () => setze(i);
        wahl.appendChild(b);
      }
      const halb = z.p[t.id] != null && z.p[t.id] % 1 !== 0;
      if (halb) wahl.appendChild(el("span", "az-pk an", fmt(z.p[t.id])));
    } else {
      const minus = el("button", "az-pk", "−"); minus.type = "button";
      const wert = el("span", "az-pwert", z.p[t.id] != null ? fmt(z.p[t.id]) : "–");
      const plus = el("button", "az-pk", "+"); plus.type = "button";
      minus.onclick = () => setze((z.p[t.id] != null ? z.p[t.id] : (r.vorschlag || 0)) - 1);
      plus.onclick = () => setze((z.p[t.id] != null ? z.p[t.id] : (r.vorschlag || 0)) + 1);
      const null0 = el("button", "az-pk breit", "0"); null0.type = "button"; null0.onclick = () => setze(0);
      const voll = el("button", "az-pk breit", "alle " + max); voll.type = "button"; voll.onclick = () => setze(max);
      wahl.append(null0, minus, wert, plus, voll);
      if (r.vorschlag != null) {
        const v = el("button", "az-pk breit vorschlag", "Vorschlag " + fmt(r.vorschlag)); v.type = "button";
        v.onclick = () => setze(r.vorschlag);
        wahl.appendChild(v);
      }
    }
    box.appendChild(wahl);
    return box;
  }

  /* ---------------------------------------------------------- Auswertung --- */
  function ergebnisZeichnen(box, m) {
    lauffStop();
    LAUF = null;
    const z = zustand(m.id);
    const s = auswertung(m, z);
    const P = paket();
    const k = el("div", "az-karte az-erg");
    k.appendChild(el("span", "az-eyebrow", m.kurz + " · Auswertung"));
    k.appendChild(el("h2", null, m.titel));
    const gross = el("div", "az-erg-gross");
    const pz = el("div", "az-erg-zahl");
    pz.appendChild(el("b", null, fmt(s.punkte)));
    pz.appendChild(el("span", null, "von " + fmt(s.max) + " P."));
    gross.appendChild(pz);
    const nt = el("div", "az-erg-note n" + s.note.n);
    nt.appendChild(el("b", null, s.note.text));
    nt.appendChild(el("span", null, fmt(s.prozent) + " %"));
    gross.appendChild(nt);
    k.appendChild(gross);
    const info = [];
    if (z.modus === "pruefung") info.push("Prüfungsmodus · Zeit " + minuten(z.zeit));
    else if (z.modus === "uebung") info.push("Übungsmodus");
    const b = (P.bisher || {})[m.id];
    if (b) info.push("Azubi-Navigator bisher: " + b);
    if (info.length) k.appendChild(el("p", "az-info", info.join(" · ")));
    if (s.bewertet < s.n) {
      const h = el("div", "az-hinweisbox");
      h.appendChild(el("b", null, (s.n - s.bewertet) + " von " + s.n + " Teilaufgaben noch ohne Punkte "));
      h.appendChild(document.createTextNode("— sie zählen hier als 0. " + (z.modus === "pruefung" && !z.abgegeben ?
        "Erst abgeben, dann bewerten." : "Im Bogen „Lösung zeigen“ und bewerten.")));
      k.appendChild(h);
    }
    /* je Aufgabe */
    const jl = el("div", "az-je");
    s.jeAufgabe.forEach(a => {
      const r = el("button", "az-je-z");
      r.type = "button";
      r.appendChild(el("span", "az-je-n", "A" + a.nr));
      const bar = el("span", "az-bar");
      const i = el("i", a.max && a.p / a.max >= .67 ? "gut" : a.max && a.p / a.max >= .5 ? "mittel" : "schwach");
      i.style.width = (a.max ? a.p / a.max * 100 : 0) + "%";
      bar.appendChild(i);
      r.appendChild(bar);
      r.appendChild(el("span", "az-je-p", fmt(a.p) + "/" + fmt(a.max)));
      r.onclick = () => { const t0 = (m.aufgaben.find(x => x.nr === a.nr) || {}).teile; if (t0 && t0[0]) oeffnen(m.id, { ziel: t0[0].id }); };
      jl.appendChild(r);
    });
    k.appendChild(jl);
    box.appendChild(k);

    /* verlorene Punkte */
    const verl = teileVon(m).map(t => ({ t, weg: (t.punkte || 0) - (z.p[t.id] || 0), bew: z.p[t.id] != null, leer: !hatAntwort(t, z.a[t.id]) }))
      .filter(x => x.bew && x.weg > 0).sort((a, b) => b.weg - a.weg);
    if (verl.length) {
      const v = el("div", "az-karte");
      v.appendChild(el("h3", null, "Hier gingen Punkte verloren"));
      const ul = el("ul", "az-verloren");
      verl.slice(0, 10).forEach(x => {
        const li = el("li");
        const bt = el("button", "az-link");
        bt.type = "button";
        bt.appendChild(el("span", "az-nr", x.t.nr + " " + x.t.label));
        bt.appendChild(el("span", null, textAus(x.t.titel) + (x.leer ? " · leer gelassen" : "")));
        bt.appendChild(el("span", "az-weg", "−" + fmt(x.weg) + " P."));
        bt.onclick = () => oeffnen(m.id, { ziel: x.t.id });
        li.appendChild(bt);
        ul.appendChild(li);
      });
      v.appendChild(ul);
      box.appendChild(v);
    }

    /* Knöpfe */
    const st = el("div", "az-karte steuer az-erg-knoepfe");
    const zum = el("button", "btn primary", "Zum Bogen");
    zum.type = "button"; zum.onclick = () => oeffnen(m.id);
    st.appendChild(zum);
    if (verl.length && s.bewertet) {
      const fal = el("button", "btn", "Nur die mit Punktverlust nochmal");
      fal.type = "button";
      fal.onclick = () => bestaetigen(fal, "Diese " + verl.length + " Teilaufgaben leeren? Das Ergebnis kommt ins Archiv.", () => {
        archivieren(m, z, s);
        verl.forEach(x => { delete z.a[x.t.id]; delete z.auf[x.t.id]; delete z.p[x.t.id]; delete z.auto[x.t.id]; });
        z.modus = "uebung"; z.abgegeben = false;
        schreib(SK + m.id, z);
        oeffnen(m.id, { ziel: verl[0].t.id });
      });
      st.appendChild(fal);
    }
    const neu = el("button", "btn", "Neuer Versuch");
    neu.type = "button";
    neu.onclick = () => bestaetigen(neu, "Alles leeren und neu anfangen? Das Ergebnis kommt ins Archiv.", () => {
      archivieren(m, z, s);
      const n = leerZustand(); n.versuche = z.versuche;
      schreib(SK + m.id, n);
      oeffnen(m.id);
    });
    st.appendChild(neu);
    const ueb = el("button", "btn ghost", "Zur Übersicht");
    ueb.type = "button"; ueb.onclick = () => oeffnen(null);
    st.appendChild(ueb);
    box.appendChild(st);

    if (z.versuche.length) {
      const h = el("div", "az-karte");
      h.appendChild(el("h3", null, "Frühere Versuche"));
      const tab = el("table", "az-versuche");
      const tr0 = el("tr");
      ["Datum", "Art", "Punkte", "Note"].forEach(x => tr0.appendChild(el("th", null, x)));
      tab.appendChild(tr0);
      z.versuche.slice().reverse().forEach(v => {
        const tr = el("tr");
        tr.appendChild(el("td", null, datum(v.d)));
        tr.appendChild(el("td", null, v.modus === "pruefung" ? "Prüfung " + minuten(v.zeit || 0) : "Übung"));
        tr.appendChild(el("td", null, fmt(v.p) + "/" + fmt(v.max)));
        tr.appendChild(el("td", null, v.note));
        tab.appendChild(tr);
      });
      h.appendChild(tab);
      box.appendChild(h);
    }
  }

  function archivieren(m, z, s) {
    if (!s.bewertet) return;
    z.versuche.push({ d: Date.now(), modus: z.modus, p: s.punkte, max: s.max, prozent: s.prozent, note: s.note.text,
                      zeit: z.zeit, bewertet: s.bewertet, n: s.n });
    if (z.versuche.length > 20) z.versuche = z.versuche.slice(-20);
  }

  /* ------------------------------------------------------- Startseite --- */
  function block() {
    if (!hatDom) return;
    const s = $("scStart");
    if (!s) return;
    let b = $("azubiBox");
    if (!b) { b = el("div", "abschnitt"); b.id = "azubiBox"; s.appendChild(b); }
    b.innerHTML = "";
    b.appendChild(el("h2", null, "Azubi-Navigator"));
    const P = paket();
    if (!P) {
      b.appendChild(el("p", null, "Die 10 Prüfungssimulationen und 3 Vertiefenden Übungen von u-form — mit Speichern und Weitermachen. " +
        "Auf diesem Gerät ist noch kein Paket."));
      const st = el("div", "steuer");
      st.appendChild(ladeKnopf("Paket laden", "primary", () => { block(); }));
      const wie = el("button", "btn ghost", "Wie?");
      wie.type = "button"; wie.onclick = () => oeffnen(null);
      st.appendChild(wie);
      b.appendChild(st);
      zahlSetzen("");
      return;
    }
    const liste = sortiert(P.module, zustand, P.bisher);
    const fertig = liste.filter(e => e.s.fertig).length;
    b.appendChild(el("p", null, P.module.length + " Simulationen aus deinem Azubi-Navigator-Konto — hier gehen angefangene Prüfungen nicht verloren."));
    const reihe = el("div", "az-start-reihe");
    const k = (n, text, klasse) => { const c = el("div", "az-start-k" + (klasse ? " " + klasse : "")); c.appendChild(el("b", null, String(n))); c.appendChild(el("span", null, text)); reihe.appendChild(c); };
    k(liste.filter(e => e.g === "neu").length, "noch nie gemacht", "rot");
    k(liste.filter(e => e.g === "weiter").length, "angefangen");
    k(fertig, "fertig", "gruen");
    b.appendChild(reihe);
    const st = el("div", "steuer");
    const e0 = liste[0];
    if (e0) {
      const w = el("button", "btn primary", (e0.g === "weiter" ? "Weiter: " : "Als Nächstes: ") + e0.m.kurz);
      w.type = "button"; w.onclick = () => oeffnen(e0.m.id);
      st.appendChild(w);
    }
    const alle = el("button", "btn", "Alle ansehen");
    alle.type = "button"; alle.onclick = () => oeffnen(null);
    st.appendChild(alle);
    b.appendChild(st);
    zahlSetzen(fertig + "/" + P.module.length + " fertig");
  }
  function zahlSetzen(text) {
    const d = document.querySelector('details.st-block[data-key="azubi"] .st-zahl');
    if (d) d.textContent = text;
  }

  /* -------------------------------------------------------- Einhängen --- */
  function einhaengen() {
    const altStart = root.renderStart;
    if (typeof altStart === "function" && !altStart.__az) {
      const neu = function () {
        const r = altStart.apply(this, arguments);
        try { block(); } catch (e) { console.error("Azubi:", e); }
        return r;
      };
      neu.__az = true; root.renderStart = neu;
    }
    const altSchirm = root.schirm;
    if (typeof altSchirm === "function" && !altSchirm.__az) {
      const neu = function (name) {
        if (name === "scAzubi") {
          const st = history.state || {};
          VIEW = st.az ? { art: st.azArt || "modul", id: st.az } : { art: "liste" };
          laden().then(() => { zeichnen(); zeigen(); });
          return;
        }
        const s = $("scAzubi");
        if (s && !s.hidden) { lauffStop(); LAUF = null; s.hidden = true; }
        return altSchirm.apply(this, arguments);
      };
      neu.__az = true; root.schirm = neu;
    }
    /* Innerhalb des Bereichs: Zurück-Taste wechselt zwischen Übersicht, Bogen und Auswertung */
    root.addEventListener("popstate", ev => {
      const st = ev.state || {};
      const s = $("scAzubi");
      if (st.seite !== "scAzubi" || !s || s.hidden) return;
      lauffStop();
      VIEW = st.az ? { art: st.azArt || "modul", id: st.az } : { art: "liste" };
      zeichnen();
    });
    /* Andere Bereiche blenden sich selbst ein — dann Bereich schließen, Uhr anhalten */
    if (!root.__azWache && root.MutationObserver) {
      root.__azWache = new MutationObserver(muts => {
        const k = $("scAzubi");
        if (!k || k.hidden) return;
        for (const m of muts) {
          const z = m.target;
          if (z !== k && z.id && /^sc/.test(z.id) && z.classList &&
              (z.classList.contains("seite") || z.classList.contains("blatt")) && !z.hidden) {
            lauffStop(); LAUF = null; k.hidden = true; return;
          }
        }
      });
      root.__azWache.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
    }
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") sichern(true); });
    root.addEventListener("pagehide", () => sichern(true));
    /* Speichern im Blick behalten: welche Teilaufgabe zuletzt angefasst wurde */
    document.addEventListener("focusin", ev => {
      if (!LAUF) return;
      const k = ev.target.closest && ev.target.closest(".az-teil");
      if (k && k.dataset.id && LAUF.z.pos !== k.dataset.id) { LAUF.z.pos = k.dataset.id; sichern(); }
    });
    try { block(); } catch (e) { console.error("Azubi:", e); }
    setTimeout(() => laden().then(p => {
      try { block(); } catch (e) { console.error("Azubi:", e); }
      if (p) paketGeaendert();
      const s = $("scAzubi");
      if (s && !s.hidden) zeichnen();
    }), 250);
  }

  /** Eine Teilaufgabe als Frage und Lösung — für „Fehler wiederholen“ */
  function ansicht(mid, tid) {
    const m = modul(mid);
    if (!m || !hatDom) return null;
    let t = null, a = null;
    (m.aufgaben || []).forEach(x => (x.teile || []).forEach(y => { if (y.id === tid) { t = y; a = x; } }));
    if (!t) return null;
    const frage = document.createDocumentFragment();
    const tx = el("div", "az-text"); htmlIn(tx, t.text); frage.appendChild(tx);
    (t.anlagen || []).forEach(an => frage.appendChild(anlage(an)));
    const loesung = document.createDocumentFragment();
    const l = el("div", "az-text");
    if (t.loesung) htmlIn(l, t.loesung); else l.textContent = "Keine Musterlösung hinterlegt.";
    loesung.appendChild(l);
    if (t.hinweis) {
      const h = el("div", "az-hinweis");
      h.appendChild(el("b", null, "So wird bewertet: "));
      h.appendChild(sicher(t.hinweis));
      loesung.appendChild(h);
    }
    return { m, t, aufgabe: a, titel: textAus(t.titel), frage, loesung };
  }

  const api = {
    oeffnen, zeigen, block, laden, importieren, paket, modul, zustand, ansicht, teileVon,
    normText, zahlen, feldRichtig, pruefe, stellen, hatAntwort, note, auswertung, einordnen, sortiert, paketAusText,
    get VIEW() { return VIEW; }
  };
  root.GENAZUBI = api;
  if (typeof module === "object" && module.exports) module.exports = api;

  if (hatDom) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
    else einhaengen();
  }
})(typeof window !== "undefined" ? window : globalThis);
