"use strict";

/* Kurzfragen (gen/satzbau.js + gen/satzbausteine*.js): jede Musterantwort
   bekommt selbst volle Punkte, jede Karte hat eine russische Erklärung,
   „Auswählen“ baut sinnvolle Antworten, Runden bevorzugen Wackeliges.    */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

global.window = global;
const speicher = {};
global.localStorage = { getItem: k => (k in speicher ? speicher[k] : null), setItem: (k, v) => { speicher[k] = String(v); } };
global.document = { readyState: "loading", getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  addEventListener() {}, createElement: () => ({ appendChild() {}, classList: { add() {} } }) };
require(path.join(root, "gen", "kern.js"));
require(path.join(root, "gen", "satzbausteine.js"));
require(path.join(root, "gen", "satzbausteine2.js"));
require(path.join(root, "gen", "satzbau.js"));
const S = global.GENSATZ, P = global.SATZ_POOL;

assert(P.length >= 150, "Karten: " + P.length);
const ids = new Set();
P.forEach(x => {
  assert(!ids.has(x.id), "doppelt " + x.id); ids.add(x.id);
  ["thema", "frage", "stichwort", "muster", "tipp", "ru"].forEach(f => assert(x[f] && String(x[f]).trim(), x.id + " ohne " + f));
  assert(Array.isArray(x.muss) && x.muss.length, x.id + " muss");
  const e = S.bewerte(x, x.muster);
  assert.strictEqual(e.punkte, 2, x.id + ": Musterantwort bekommt nur " + e.punkte + " — fehlt " +
    e.begriffe.filter(b => !b.ok).map(b => b.soll).join(", "));
  assert(S.bewerte(x, x.stichwort).punkte < 2, x.id + ": Stichwort allein darf keine vollen Punkte geben");
});
const themen = new Set(P.map(x => x.thema));
assert(themen.size >= 12, "Themen: " + themen.size);

/* Auswählen: genau eine Antwort mit 2 BE, das Stichwort ist dabei */
P.forEach(x => {
  const o = S.optionen(x);
  assert.strictEqual(o.filter(y => y.be === 2).length, 1, x.id);
  assert(o.length >= 3 && o.length <= 4, x.id + " Optionen " + o.length);
  assert(o.some(y => y.be === 0.5 && y.text.indexOf(x.stichwort) === 0), x.id + " Stichwort-Option");
  assert(new Set(o.map(y => y.text)).size === o.length, x.id + " doppelte Option");
});

/* Stand: aus alten Daten ableiten, Runde bevorzugt nicht/halb */
speicher["ihk2:gen:satz"] = JSON.stringify({});
assert.strictEqual(S.stand("s01"), "neu");
S.setzeStand("s03", "nicht"); S.setzeStand("s05", "halb"); S.setzeStand("s01", "gut");
assert.strictEqual(S.stand("s03"), "nicht");
const r = S.runde({ modus: "schreiben", anzahl: 6, themen: ["IT-Sicherheit"], folge: "wackelig" });
assert.strictEqual(r.length, 6);
assert.deepStrictEqual(r.slice(0, 2).map(x => x.id), ["s03", "s05"], "erst nicht, dann halb");
assert(!r.slice(0, 5).some(x => x.id === "s01"), "Gewusstes kommt zuletzt");
assert(r.every(x => x.thema === "IT-Sicherheit"));
const nurW = S.runde({ anzahl: 20, themen: [], folge: "nurWackelig" });
assert.deepStrictEqual(nurW.map(x => x.id).sort(), ["s03", "s05"]);
assert.deepStrictEqual(S.runde({ ids: ["s10", "s11"], anzahl: 6 }).map(x => x.id).sort(), ["s10", "s11"]);

/* Abgleich: je Karte die neuere Fassung, Zähler als Maximum */
const Y = require(path.join(root, "gen", "sync.js"));
const m = Y.mische({ "ihk2:gen:satz": JSON.stringify({ s01: { versuche: 3, bestPunkte: 2, stand: "gut", t: 5 } }) }, {},
                   { "ihk2:gen:satz": JSON.stringify({ s01: { versuche: 1, bestPunkte: 1, stand: "nicht", t: 9 }, s02: { stand: "halb", t: 1 } }) }, {});
const z = JSON.parse(m.schreiben["ihk2:gen:satz"]);
assert.strictEqual(z.s01.stand, "nicht"); assert.strictEqual(z.s01.versuche, 3); assert.strictEqual(z.s01.bestPunkte, 2); assert(z.s02);
assert.strictEqual(Y.bereichVon("ihk2:gen:satz"), "Kurzfragen");

/* Einbindung */
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
["gen/satzbausteine2.js", "gen/kurzfragen.css"].forEach(f => { assert(html.includes(f), f); assert(sw.includes("./" + f), f); });
assert(html.indexOf("gen/satzbausteine2.js") < html.indexOf("gen/satzbau.js"));
assert(fs.readFileSync(path.join(root, "gen", "zurueck.js"), "utf8").includes("scSatz"), "Zurück kennt die Kurzfragen");
assert(fs.readFileSync(path.join(root, "gen", "wiederholen.js"), "utf8").includes('quelle: "satz"'), "Fehler wiederholen kennt die Kurzfragen");

console.log("kurzfragen: " + P.length + " Karten in " + themen.size + " Themen, Musterantworten 2/2, Auswählen, Runden, Abgleich OK");
