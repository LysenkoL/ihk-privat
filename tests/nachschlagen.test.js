"use strict";

/* Nachschlagen (gen/nachschlagen.js): jedes markierte Wort — Fachbegriff,
   Prüfungsdeutsch oder neu —, Fundstellen in den Prüfungen, „Meine Wörter“
   im Glossar.                                                              */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
global.window = global;
require(path.join(root, "exams", "exams.js"));
require(path.join(root, "gen", "glossar-daten.js"));
const GL = require(path.join(root, "gen", "glossar.js"));
const N = require(path.join(root, "gen", "nachschlagen.js"));
global.GENGLOSSAR = GL;

/* Wortschatz sauber: keine Doppelten, nichts, was schon Fachbegriff ist */
const D = GL.aufbereiten(global.IHK_GLOSSAR);
const W = N.wortschatz().liste;
assert(W.length >= 400, "Wortschatz " + W.length);
const ids = new Set();
W.forEach(w => {
  assert(!ids.has(w.id), "doppelt: " + w.wort); ids.add(w.id);
  assert(w.ru && w.ru.length > 2, "ohne Übersetzung: " + w.wort);
  assert(!D.formVon[w.lemma.toLowerCase()], "schon im Glossar: " + w.wort);
});

/* Formen */
const vf = N.verbFormen("an|geben", ["gibt an", "angegeben"]);
["angeben", "anzugeben", "angegeben", "gibt an"].forEach(f => assert(vf.includes(f), f));
assert(N.verbFormen("rechnen").includes("rechnet"));
assert(N.verbFormen("lernen").includes("lernt"));
assert(N.verbFormen("erläutern").includes("erläutert"));
assert(N.verbFormen("installieren").includes("installiert") && !N.verbFormen("installieren").includes("geinstalliert"));
assert(N.verbFormen("dar|stellen").includes("dargestellt"));

/* Säubern: Satzzeichen weg, Abkürzungen bleiben */
assert.strictEqual(N.saeubern("„Maßnahmen.“"), "Maßnahmen");
assert.strictEqual(N.saeubern(" z. B. "), "z. B.");
assert.strictEqual(N.saeubern("(gewährleistet),"), "gewährleistet");

/* Nachschlagen */
const art = t => (N.nachschlagen(t) || {}).art;
const e = t => (N.nachschlagen(t) || {}).e;
assert.strictEqual(art("Firewall"), "glossar");
assert.strictEqual(art("Anforderungen"), "glossar");
assert.strictEqual(art("gewährleistet"), "wort");
assert.strictEqual(e("gewährleistet").lemma, "gewährleisten");
assert.strictEqual(e("anzugeben").lemma, "angeben");
assert.strictEqual(e("Maßnahmen").lemma, "Maßnahme");
assert.strictEqual(e("jeweils").ru.indexOf("каждый") >= 0, true);
assert.strictEqual(e("Erläutern").lemma, "erläutern");
assert.strictEqual(art("Quatschwortxy"), "neu");
assert.strictEqual(N.nachschlagen("  "), null);

/* Fundstellen in den echten Bögen */
global.__ALLE_TEST = [];
global.IHK_EXAMS.forEach(ex => ex.tasks.forEach(t => t.subtasks.forEach(s => global.__ALLE_TEST.push(Object.assign({}, s, { exam: ex, task: t, k: ex.examId + ":" + s.id })))));
N._index();
let r = N.nachschlagen("erläutern");
let f = N.vorkommen(N.formenFuer(r).formen, N.formenFuer(r).frei);
assert(f.length >= 10, "erläutern: " + f.length);
assert(f[0].wo === "Aufgabe" && /erläuter/i.test(f[0].s.treffer), JSON.stringify(f[0].s));
assert(f.every(x => x.s.vor.length + x.s.treffer.length + x.s.nach.length < 260), "Schnipsel kurz");
r = N.nachschlagen("gewährleisten");
f = N.vorkommen(N.formenFuer(r).formen, false);
assert(f.length >= 3, "gewährleisten: " + f.length);
r = N.nachschlagen("Walzanlagen");                                  /* unbekannt → Stamm */
assert.strictEqual(r.art, "neu");
f = N.vorkommen(N.formenFuer(r).formen, N.formenFuer(r).frei);
assert(f.length >= 2, "Walzanlage: " + f.length);
assert(!N.vorkommen(["kein-wort-dieser-art"], false).length);

/* Meine Wörter → Glossar-Zeilen, eigene Kennung, Übersetzung */
global.localStorage = { _: {}, getItem(k) { return this._[k] || null; }, setItem(k, v) { this._[k] = String(v); } };
const id = N.speichern(N.nachschlagen("Walzanlagen"), "прокатный стан", "Die Walzanlage ist defekt.", "Herbst 2024");
const id2 = N.speichern(N.nachschlagen("gewährleistet"), null, "", "");
const Z = N.zeilen();
assert.strictEqual(Z.length, 2);
const D2 = GL.aufbereiten(Z.concat(global.IHK_GLOSSAR));
assert.strictEqual(D2.von[id].ap, "mein");
assert.strictEqual(D2.von[id].ru, "прокатный стан");
assert.strictEqual(D2.von[id2].ru, e("gewährleisten").ru);
assert(GL.finde(D2, "Die Walzanlagen laufen.").some(x => x.id === id), "eigenes Wort wird im Text gefunden");
assert(GL.finde(D2, "Das ist zu gewährleisten.").some(x => x.id === id2), "Verbform wird gefunden");
assert.strictEqual(N.meinVonWort("Walzanlagen"), id);
N.aendern(id, { ru: "стан" }); assert.strictEqual(N.MEIN[id].ru, "стан");
N.loeschen(id); assert(!N.MEIN[id]);

/* Frage an Claude: Wort, Satz, gewünschte Form */
const t = N.claudeText("gewährleisten", "Die Verfügbarkeit ist zu gewährleisten.");
["„gewährleisten“", "Die Verfügbarkeit", "Russische Übersetzung", "einfachen deutschen Satz", "Operator"].forEach(x => assert(t.includes(x), x));

/* Suche im Wortschatz deutsch und russisch */
assert(N.suchen("gewähr").some(w => w.lemma === "gewährleisten"));
assert(N.suchen("обеспечить").some(w => w.lemma === "gewährleisten"));

/* Einbindung, und keine Lookbehind-Ausdrücke (ältere iPhones) */
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
["gen/wortschatz-daten.js", "gen/nachschlagen.js"].forEach(x => { assert(html.includes(x), x); assert(sw.includes("./" + x), x); });
assert(html.indexOf("gen/nachschlagen.js") > html.indexOf("gen/glossar.js"));
["nachschlagen.js", "glossar.js", "sql.js", "sync.js", "pruefen.js"].forEach(x =>
  assert(!/\(\?<[=!]/.test(fs.readFileSync(path.join(root, "gen", x), "utf8")), "Lookbehind in " + x));

console.log("nachschlagen: " + W.length + " Wörter Prüfungsdeutsch, Formen, Fundstellen, Meine Wörter OK");
