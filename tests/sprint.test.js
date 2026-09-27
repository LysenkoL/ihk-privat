"use strict";

/* Rechen-Sprint (gen/sprint.js): fünf Bereiche, alle Vorlagen vorhanden und
   mit Rechenfeldern, schwächste Vorlage bevorzugt, Mini = drei Aufgaben.   */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

global.window = global;
const speicher = {};
global.localStorage = { getItem: k => (k in speicher ? speicher[k] : null), setItem: (k, v) => { speicher[k] = String(v); } };
global.document = { readyState: "loading", getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  addEventListener() {}, createElement: () => ({ appendChild() {}, classList: { add() {} } }) };
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
(html.match(/<script src="gen\/(kern|vorlagen-[a-z]+)\.js"><\/script>/g) || [])
  .map(s => /gen\/([a-z-]+)\.js/.exec(s)[1]).forEach(n => require(path.join(root, "gen", n + ".js")));
const S = require(path.join(root, "gen", "sprint.js"));
const G = global.GEN;

assert.strictEqual(S.SLOTS.length, 5);
S.SLOTS.forEach(sl => sl.ids.forEach(id => {
  assert(G.vorlageVon(id), "Vorlage fehlt: " + id);
  const a = G.erzeuge(id, 3);
  assert(a.felder.some(f => f.typ === "zahl" || f.typ === "raster"), id + " hat kein Rechenfeld");
  assert(a.maxPoints <= 13, id + " zu groß für den Sprint: " + a.maxPoints);
}));

let z = 0.123;
const zufall = () => { z = (z * 9301 + 0.49297) % 1; return z; };
const fuenf = S.waehle({}, zufall, 5);
assert.strictEqual(fuenf.length, 5);
assert.deepStrictEqual(fuenf.map(x => x.bereich), S.SLOTS.map(x => x.name));
fuenf.forEach(x => { assert(Number.isInteger(x.saat) && x.saat >= 0); G.erzeuge(x.vorlageId, x.saat); });
const be = fuenf.reduce((s, x) => s + G.erzeuge(x.vorlageId, x.saat).maxPoints, 0);
assert(be >= 20 && be <= 55, "BE im Sprint: " + be);

/* schwach geht vor: alle IP-Vorlagen 100 % außer einer mit 10 % */
const stat = {};
S.SLOTS[0].ids.forEach(id => { stat[id] = { versuche: 2, punkte: 10, max: 10 }; });
stat["netz-ipv6"] = { versuche: 2, punkte: 1, max: 10 };
for (let i = 0; i < 20; i++) assert.strictEqual(S.waehle(stat, zufall, 5)[0].vorlageId, "netz-ipv6");

const mini = S.waehle({}, zufall, 3);
assert.strictEqual(mini.length, 3);
assert.strictEqual(mini[0].bereich, S.SLOTS[0].name);
assert.strictEqual(mini[1].bereich, S.SLOTS[1].name);

const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
assert(html.includes("gen/sprint.js") && sw.includes("./gen/sprint.js"), "eingebunden und offline");
assert(/GENSPRINT/.test(fs.readFileSync(path.join(root, "gen", "start.js"), "utf8")), "Kachel");
assert(/GENSPRINT/.test(fs.readFileSync(path.join(root, "gen", "finder.js"), "utf8")), "Finder");
console.log("sprint: ok —", be, "BE im Beispiel");
