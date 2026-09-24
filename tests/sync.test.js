"use strict";

/* Abgleich Handy ↔ Computer (gen/sync.js): nichts geht verloren, die
   neuere Fassung gewinnt, Zähler verdoppeln sich beim Hin- und Rück-
   Abgleich nicht, Azubi-Navigator je Teilaufgabe.                        */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const S = require(path.join(root, "gen", "sync.js"));

const J = JSON.stringify;
const P = r => JSON.parse(r);

/* Antworten: beide Seiten bleiben; Widerspruch → neuere Seite */
let r = S.mische(
  { "ihk2:answers": J({ a: "Handy alt", b: "nur hier" }) }, { "ihk2:answers": 100 },
  { "ihk2:answers": J({ a: "Computer neu", c: "nur dort" }) }, { "ihk2:answers": 200 });
assert.deepStrictEqual(P(r.schreiben["ihk2:answers"]), { a: "Computer neu", b: "nur hier", c: "nur dort" });
r = S.mische(
  { "ihk2:answers": J({ a: "hier neuer" }) }, { "ihk2:answers": 300 },
  { "ihk2:answers": J({ a: "dort älter", c: "x" }) }, { "ihk2:answers": 200 });
assert.deepStrictEqual(P(r.schreiben["ihk2:answers"]), { a: "hier neuer", c: "x" });

/* Neuer Schlüssel kommt dazu, gleicher Stand → nichts zu schreiben */
r = S.mische({}, {}, { "ihk2:glossar:kann": J({ tilgung: 1 }) }, {});
assert.strictEqual(r.schreiben["ihk2:glossar:kann"], J({ tilgung: 1 }));
r = S.mische({ "ihk2:x": "1" }, {}, { "ihk2:x": "1" }, {});
assert.deepStrictEqual(r.schreiben, {});
/* fremde Schlüssel ohne ihk2: werden ignoriert */
r = S.mische({}, {}, { "ihk:auth": "1", "anderes": "x" }, {});
assert.deepStrictEqual(r.schreiben, {});
/* Geräte-Einstellungen bleiben auf dem Gerät */
r = S.mische({}, {}, { "ihk2:theme": J("dunkel"), "ihk2:start:offen": "{}", "ihk2:glossar:ui": "{}", "ihk2:pwa:weg": "1" }, {});
assert.deepStrictEqual(r.schreiben, {});

/* SQL-Trainer: gelöst bleibt gelöst, neuerer Code gewinnt */
r = S.mische({ "ihk2:sql": J({ v: 1, a: { g1: { ok: 1, n: 1, t: 5, code: "alt" }, g2: { n: 2, t: 9, code: "hier" } } }) }, {},
             { "ihk2:sql": J({ v: 1, a: { g1: { n: 3, t: 8, code: "neu" }, w1: { ok: 1, n: 1, t: 3 } } }) }, {});
const sq = P(r.schreiben["ihk2:sql"]).a;
assert.deepStrictEqual(sq.g1, { ok: 1, n: 3, t: 8, code: "neu" });
assert(sq.g2 && sq.w1.ok === 1);

/* Zähler: Maximum, nicht Summe — hin und zurück bleibt es bei 5 */
const hier = { "ihk2:cards": J({ k1: { richtig: 5, falsch: 1 } }) };
const dort = { "ihk2:cards": J({ k1: { richtig: 3, falsch: 2 }, k2: { richtig: 1, falsch: 0 } }) };
r = S.mische(hier, {}, dort, {});
const nach = P(r.schreiben["ihk2:cards"]);
assert.deepStrictEqual(nach, { k1: { richtig: 5, falsch: 2 }, k2: { richtig: 1, falsch: 0 } });
const zurueck = S.mische(dort, {}, { "ihk2:cards": J(nach) }, {});
assert.deepStrictEqual(P(zurueck.schreiben["ihk2:cards"]), nach, "Rückweg verdoppelt nichts");

/* Listen: vereinigt, nach Kennung */
r = S.mische({ "ihk2:attempts": J([{ datum: "2026-09-01", p: 50 }]) }, {},
             { "ihk2:attempts": J([{ datum: "2026-09-01", p: 50 }, { datum: "2026-09-20", p: 70 }]) }, {});
assert.strictEqual(P(r.schreiben["ihk2:attempts"]).length, 2);

/* Azubi-Navigator: Teilaufgaben von beiden Seiten, Widerspruch → später bearbeitete Seite */
const az = (a, p, zuletzt, extra) => J(Object.assign({ v: 1, modus: "uebung", a, auf: {}, p, auto: {}, zeit: 0, abgegeben: false,
  versuche: [], start: 1, zuletzt, pos: null }, extra || {}));
r = S.mische(
  { "ihk2:azubi:az8091": az({ t1: { t1: "Handy" }, t2: { t1: "gleich" } }, { t1: 2 }, 1000, { zeit: 500 }) }, {},
  { "ihk2:azubi:az8091": az({ t1: { t1: "Computer" }, t3: { f1: "760000" } }, { t1: 3, t3: 5 }, 2000, { zeit: 900, versuche: [{ d: 5, p: 40 }] }) }, {});
const m = P(r.schreiben["ihk2:azubi:az8091"]);
assert.deepStrictEqual(m.a, { t1: { t1: "Computer" }, t2: { t1: "gleich" }, t3: { f1: "760000" } });
assert.deepStrictEqual(m.p, { t1: 3, t3: 5 });
assert.strictEqual(m.zeit, 900); assert.strictEqual(m.zuletzt, 2000); assert.strictEqual(m.versuche.length, 1);

/* Fehler wiederholen: je Aufgabe die Fassung mit mehr Wiederholungen */
r = S.mische(
  { "ihk2:wieder": J({ k: { a: { l: 1, n: 1, t: 10 }, b: { l: 0, n: 3, t: 5 } }, tage: { "2026-09-23": 4 } }) }, {},
  { "ihk2:wieder": J({ k: { a: { l: 2, n: 2, t: 20, raus: 1 }, c: { l: 0, n: 1, t: 7 } }, tage: { "2026-09-23": 2, "2026-09-24": 6 } }) }, {});
const w = P(r.schreiben["ihk2:wieder"]);
assert.strictEqual(w.k.a.raus, 1); assert.strictEqual(w.k.b.n, 3); assert(w.k.c);
assert.deepStrictEqual(w.tage, { "2026-09-23": 4, "2026-09-24": 6 });

/* Endspurt: Haken von beiden Geräten */
r = S.mische({ "ihk2:endspurt": J({ v: 2, erledigt: { "2026-09-23": { art: "azubi" } } }) }, {},
             { "ihk2:endspurt": J({ v: 2, erledigt: { "2026-09-24": { art: "sim" } } }) }, {});
assert.deepStrictEqual(Object.keys(P(r.schreiben["ihk2:endspurt"]).erledigt).sort(), ["2026-09-23", "2026-09-24"]);

/* Bericht nach Bereichen */
assert.strictEqual(S.bereichVon("ihk2:azubi:az8091"), "Azubi-Navigator");
assert.strictEqual(S.bereichVon("ihk2:scores"), "Prüfungen (Antworten, Punkte)");

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
["gen/sync.js", "gen/sync.css"].forEach(f => { assert(html.includes(f)); assert(sw.includes("./" + f)); });
assert(html.indexOf("gen/sync.js") < html.indexOf("gen/start.js"), "sync.js früh laden (Zeitstempel)");

console.log("sync: zusammenführen ohne Verlust, neuere Fassung gewinnt, Zähler ohne Verdopplung OK");
