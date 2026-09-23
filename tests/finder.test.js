"use strict";

/* Suchfeld der Startseite (gen/finder.js): Normalisierung und Bewertung.
   Läuft ohne Browser — ein minimales document reicht, weil die Datei ohne
   #scStart nichts aufbaut.                                               */
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "..", "gen", "finder.js"), "utf8");
global.window = {};
global.document = {
  readyState: "complete",
  addEventListener() {},
  getElementById() { return null; },
  querySelector() { return null; },
  querySelectorAll() { return []; }
};
new Function(src)();
const F = window.GENFINDER;
assert(F, "GENFINDER muss existieren");

/* Umlaute: ü, ue und u finden dasselbe */
assert.strictEqual(F.norm("Prüfung"), F.norm("Pruefung"));
assert.strictEqual(F.norm("Prüfung"), F.norm("prufung"));
assert.strictEqual(F.norm("Maß"), F.norm("mass"));
assert.strictEqual(F.norm("Größe"), F.norm("Groesse"));

/* Mehrere Wörter: kurze Füllwörter fallen weg, jedes Wort muss passen */
assert.deepStrictEqual(F.tokens("Netzplan a üben"), ["netzplan", "uben"]);
const e = t => ({ _t: F.norm(t.titel), _u: F.norm(t.unter || ""), _w: F.norm(t.worte || "") });
const netz = e({ titel: "Netzplan üben", unter: "Diagramm-Trainer", worte: "puffer vorgang" });
const komp = e({ titel: "Gantt-Diagramm & Netzplan", unter: "IT-Systeme" });
assert(F.bewerte(netz, F.tokens("netzplan")) > F.bewerte(komp, F.tokens("netzplan")),
  "Treffer am Titelanfang zählt mehr als in der Mitte");
assert(F.bewerte(netz, F.tokens("puffer")) > 0, "Stichwörter werden durchsucht");
assert.strictEqual(F.bewerte(netz, F.tokens("netzplan skonto")), 0, "alle Wörter müssen vorkommen");

console.log("finder: normalization and ranking OK");
