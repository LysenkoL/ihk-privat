"use strict";

/* Azubi-Navigator (gen/azubi.js): Kontrolle der Eingaben, Punkte, Noten,
   Reihenfolge der Empfehlung — und, falls das private Paket im Ordner
   liegt, dessen Aufbau. Ohne privat/ laufen nur die Logik-Tests.        */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

const A = require(path.join(root, "gen", "azubi.js"));

/* Zahlen: Komma, Tausenderpunkt, Einheiten */
assert.deepStrictEqual(A.zahlen("760000"), [760000]);
assert(A.zahlen("760.000").includes(760000), "Tausenderpunkt");
assert(A.zahlen("1.512").includes(1512) && A.zahlen("1.512").includes(1.512), "beide Lesarten");
assert.deepStrictEqual(A.zahlen("10,91 GiB"), [10.91]);
assert.deepStrictEqual(A.zahlen("€ 30400"), [30400]);
assert.deepStrictEqual(A.zahlen("abc"), []);

const zahl = soll => ({ id: "1", art: "zahl", soll: [].concat(soll) });
assert(A.feldRichtig(zahl("760000"), "760.000"));
assert(A.feldRichtig(zahl("760000"), "760000 €"));
assert(!A.feldRichtig(zahl("760000"), "760500"));
assert(A.feldRichtig(zahl("10,91"), "10.91"));
assert(A.feldRichtig(zahl("10,91"), "10,92"), "Rundung in der letzten Stelle zählt als richtig");
assert(!A.feldRichtig(zahl("10,91"), "10,8"));
assert(A.feldRichtig(zahl("3"), "3"));
assert(!A.feldRichtig(zahl("3"), "2"));
assert(!A.feldRichtig(zahl("3"), ""));

const text = soll => ({ id: "1", art: "text", soll: [].concat(soll) });
assert(A.feldRichtig(text(["Nein", "nein", "n"]), " NEIN "));
assert(A.feldRichtig(text("ökonomisch"), "Oekonomisch"));
assert(A.feldRichtig(text("192.168.1.2"), "192.168.1.2"));
assert(!A.feldRichtig(text("192.168.1.2"), "192.168.1.20"));

/* Teilaufgaben prüfen */
const raster = { id: "t1", punkte: 4, eingabe: { typ: "raster", spalten: 2, zeilen: 2, zellen: [
  { h: "Jahr" }, { h: "Zinsen" }, { h: "1" }, { f: { id: "1", art: "zahl", soll: ["30400"] } }] } };
let r = A.pruefe(raster, { f1: "30.400" });
assert.strictEqual(r.n, 1); assert.strictEqual(r.k, 1); assert.strictEqual(r.vorschlag, 4);
r = A.pruefe(raster, { f1: "30000" });
assert.strictEqual(r.vorschlag, 0);

const wahl = { id: "t2", punkte: 3, eingabe: { typ: "wahl", zeilen: [
  { id: "1", optionen: ["1st", "2nd", "3rd"], soll: 1 },
  { id: "2", optionen: ["1st", "2nd", "3rd"], soll: 0 },
  { id: "3", optionen: ["1st", "2nd", "3rd"], soll: 2 }] } };
r = A.pruefe(wahl, { w1: 1, w2: 0, w3: 0 });
assert.strictEqual(r.k, 2); assert.strictEqual(r.vorschlag, 2);
assert.strictEqual(r.marken.w3, false);

const zuo = { id: "t3", punkte: 2, eingabe: { typ: "zuordnung", optionen: ["a", "b"], zeilen: [{ id: "1", soll: "2" }, { id: "2", soll: "1" }] } };
assert.strictEqual(A.pruefe(zuo, { z1: "2", z2: "1" }).vorschlag, 2);
assert.strictEqual(A.pruefe(zuo, { z1: "1" }).vorschlag, 1 * 0 + 0, "nur falsch → 0");

const mehr = { id: "t4", punkte: 4, eingabe: { typ: "mehrfach", optionen: ["1", "2", "3", "4", "5", "6"], soll: [1, 2, 6, 8], anzahl: 4 } };
assert.strictEqual(A.pruefe(mehr, { m: [1, 2, 6, 8] }).vorschlag, 4);
assert.strictEqual(A.pruefe(mehr, { m: [1, 2, 3] }).vorschlag, 1, "zwei Treffer minus ein Fehlgriff");

const offen = { id: "t5", punkte: 4, eingabe: { typ: "zeilen", zeilen: [{ h: "", frei: "1", gross: true }] } };
r = A.pruefe(offen, { t1: "Risiko: Verzug" });
assert.strictEqual(r.pruefbar, false); assert.strictEqual(r.vorschlag, null);
assert(A.hatAntwort(offen, { t1: "x" })); assert(!A.hatAntwort(offen, { t1: "  " }));

/* Noten nach IHK-Schlüssel */
assert.strictEqual(A.note(92).text, "sehr gut");
assert.strictEqual(A.note(91.9).text, "gut");
assert.strictEqual(A.note(50).text, "ausreichend");
assert.strictEqual(A.note(49.5).text, "mangelhaft");
assert.strictEqual(A.note(29).text, "ungenügend");

/* Auswertung und Empfehlung */
const modul = (id, nr, art) => ({ id, nr, art: art || "pruefung", aufgaben: [{ nr: "1", titel: "Aufgabe 1", teile: [raster, offen] }] });
const Z = () => ({ a: {}, auf: {}, p: {}, auto: {}, versuche: [], zuletzt: 0 });
let z = Z(); z.p.t1 = 4; z.p.t5 = 2;
const s = A.auswertung(modul("x", 1), z);
assert.strictEqual(s.punkte, 6); assert.strictEqual(s.max, 8); assert.strictEqual(s.fertig, true); assert.strictEqual(s.prozent, 75);

const M = [modul("a", 1), modul("b", 2), modul("c", 3), modul("d", 4), modul("v", 1, "vertiefung")];
const zust = { a: Z(), b: Z(), c: Z(), d: Z(), v: Z() };
zust.c.a.t5 = { t1: "angefangen" }; zust.c.zuletzt = 5;
const reihe = A.sortiert(M, id => zust[id], { a: "befriedigend", d: "mangelhaft" }).map(e => e.m.id + ":" + e.g);
assert.deepStrictEqual(reihe, ["c:weiter", "b:neu", "v:neu", "d:schwach", "a:gemacht"]);

/* Paket aus Datei-Text: .js mit Vorspann oder reines JSON */
const mini = { module: [{ id: "az1", aufgaben: [] }], bilder: {} };
assert.strictEqual(A.paketAusText("window.IHK_AZUBI = " + JSON.stringify(mini) + ";\n").module[0].id, "az1");
assert.throws(() => A.paketAusText("{\"module\":[]}"), /kein Azubi/);
assert.throws(() => A.paketAusText("hallo"), /keine Daten/);

/* Eingebunden, offline verfügbar — und das Paket selbst NICHT öffentlich */
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
["gen/azubi.js", "gen/azubi.css"].forEach(f => {
  assert(html.includes(f), f + " in index.html");
  assert(sw.includes("./" + f), f + " im Service Worker");
});
assert(!sw.includes("privat/"), "privates Paket darf nicht in den Cache-Vorrat");
assert(!/src="privat\//.test(html), "privates Paket nicht fest in index.html");
const gi = fs.readFileSync(path.join(root, ".gitignore"), "utf8");
assert(/^privat\/$/m.test(gi), "privat/ steht in .gitignore");

/* Falls vorhanden: das echte Paket prüfen */
const paketDatei = path.join(root, "privat", "azubi-daten.js");
if (fs.existsSync(paketDatei)) {
  const P = A.paketAusText(fs.readFileSync(paketDatei, "utf8"));
  const ids = new Set();
  let teile = 0, pruefbar = 0;
  P.module.forEach(m => {
    assert(!ids.has(m.id), "Modul doppelt: " + m.id); ids.add(m.id);
    const summe = m.aufgaben.reduce((s, a) => s + a.teile.reduce((x, t) => x + t.punkte, 0), 0);
    assert.strictEqual(summe, m.punkte, "Punktsumme " + m.id);
    if (m.art === "pruefung") assert.strictEqual(m.punkte, 100, m.id + " hat 100 Punkte");
    const tids = new Set();
    m.aufgaben.forEach(a => a.teile.forEach(t => {
      teile++;
      assert(!tids.has(t.id), "Teil doppelt " + t.id); tids.add(t.id);
      assert(t.eingabe && t.eingabe.typ, "Eingabe fehlt " + t.id);
      if (A.stellen(t).length) pruefbar++;
      /* jede Soll-Angabe muss sich selbst als richtig erkennen */
      A.stellen(t).filter(s => s.art === "feld").forEach(s =>
        assert(A.feldRichtig(s.f, s.f.soll[0]), "Soll nicht erkannt: " + m.id + " " + t.id + " " + s.f.soll[0]));
      assert(!/<script|on\w+=|javascript:/i.test(t.text + t.loesung), "unsicheres HTML " + t.id);
    }));
  });
  console.log("azubi: Paket " + P.module.length + " Module, " + teile + " Teilaufgaben (" + pruefbar + " automatisch prüfbar)");
} else {
  console.log("azubi: Logik OK (kein privates Paket im Ordner)");
}
