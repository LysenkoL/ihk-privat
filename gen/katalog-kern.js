/* ============================================================================
   gen/katalog-kern.js — Zuordnung Katalog ↔ Material (ohne Oberfläche)
   ----------------------------------------------------------------------------
   Nimmt den Katalog aus gen/katalog-daten.js und beliebige Texte (Prüfungs-
   aufgaben, Karteikarten, Generator-Typen, Kompendium, Spickzettel) und sagt
   für jedes Stichwort, welches Material dazu passt — und umgekehrt für jedes
   Material, zu welchen Stichworten es gehört.

   Läuft im Browser und in Node (tests/katalog.test.js).
   ========================================================================== */
"use strict";

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.IHKKatalogKern = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {

  /* ä→ae usw. — die Suchmuster im Katalog sind so geschrieben */
  function norm(s) {
    return String(s || "").toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[‐-—]/g, "-")
      .replace(/\s+/g, " ");
  }

  /* Englische Passage: mindestens vier verschiedene häufige Wörter */
  const EN = ["the", "and", "of", "to", "is", "are", "with", "you", "your", "for", "this", "that",
              "which", "can", "be", "will", "from", "or", "it", "on", "by", "we", "our", "have"];
  function englisch(t) {
    const w = new Set((" " + t + " ").match(/\b[a-z]+\b/g) || []);
    let n = 0;
    for (const x of EN) if (w.has(x)) n++;
    return n >= 5;
  }

  function regex(muster) {
    const rest = String(muster || "").split("|").filter(x => x !== "@englisch").join("|");
    return {
      en: /@englisch/.test(muster || ""),
      rx: rest ? new RegExp(rest, "i") : null
    };
  }
  function passt(m, t) {
    return !!((m.rx && m.rx.test(t)) || (m.en && englisch(t)));
  }

  /* Katalog → flache Liste der Stichworte mit Id „03.04.02“ */
  function flach(K) {
    const out = [];
    (K.komplexe || []).forEach(k => (k.kreise || []).forEach(kr => {
      let n = 0;
      const nimm = (p, gruppe) => {
        n++;
        const id = k.nr + "." + kr.nr + "." + String(n).padStart(2, "0");
        out.push({ id, komplex: k.nr, kreis: k.nr + "." + kr.nr, gruppe: gruppe || null,
                   text: p[0], muster: p[1], m: regex(p[1]) });
      };
      (kr.p || []).forEach(p => {
        if (Array.isArray(p)) nimm(p, null);
        else if (p && p.g) (p.p || []).forEach(q => nimm(q, p.g));
      });
    }));
    return out;
  }

  function kreise(K) {
    const out = [];
    (K.komplexe || []).forEach(k => (k.kreise || []).forEach(kr =>
      out.push({ id: k.nr + "." + kr.nr, komplex: k.nr, titel: kr.titel, tiefe: kr.tiefe })));
    return out;
  }

  /* quellen: { art: [{ key, text, … }] } — text wird hier normalisiert */
  function abdeckung(K, quellen) {
    const P = flach(K);
    const je = {};
    P.forEach(p => { je[p.id] = {}; });
    const umgekehrt = {};
    Object.keys(quellen || {}).forEach(art => {
      (quellen[art] || []).forEach(q => {
        const t = norm(q.text);
        P.forEach(p => {
          if (!passt(p.m, t)) return;
          (je[p.id][art] = je[p.id][art] || []).push(q);
          const u = umgekehrt[art + ":" + q.key] = umgekehrt[art + ":" + q.key] || [];
          u.push(p.id);
        });
      });
    });
    return { punkte: P, je, umgekehrt };
  }

  /* Welche „nicht AP1“-Einträge treffen auf einen Text zu? */
  function nichtAP1(K, text) {
    const t = norm(text);
    return (K.nichtAP1 || []).filter(e => {
      e._m = e._m || regex(e.m);
      if (e.ohne && !e._o) e._o = new RegExp(e.ohne, "i");
      return passt(e._m, t) && !(e._o && e._o.test(t));
    });
  }

  /* Tiefe als Wort */
  const TIEFE = { 1: "kennen", 2: "unterscheiden", 3: "beurteilen", 4: "anwenden" };

  return { norm, englisch, regex, passt, flach, kreise, abdeckung, nichtAP1, TIEFE };
});
