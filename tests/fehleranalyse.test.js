"use strict";

/* Fehler durchgehen (gen/fehleranalyse.js): „Du ↔ Richtig“ je Feld für alle
   Generator-Vorlagen und alle Prognose-Teilaufgaben, Fehlt/Passt/Weg damit,
   Stand „sitzt“/„morgen“, Eingaben aus alten Blättern, Einbindung.        */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

global.window = global;
const speicher = {};
global.localStorage = {
  getItem: k => (k in speicher ? speicher[k] : null),
  setItem: (k, v) => { speicher[k] = String(v); },
  removeItem: k => { delete speicher[k]; }
};
global.document = { readyState: "loading", getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  addEventListener() {}, createElement: () => ({ appendChild() {}, classList: { add() {} }, set textContent(v) {}, get innerHTML() { return ""; } }) };

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
/* Generator mit allen Vorlagen — in der Reihenfolge der Seite */
(html.match(/<script src="gen\/(kern|vorlagen-[a-z]+)\.js"><\/script>/g) || [])
  .map(s => /gen\/([a-z-]+)\.js/.exec(s)[1])
  .forEach(n => require(path.join(root, "gen", n + ".js")));
require(path.join(root, "gen", "fehlerjournal.js"));
require(path.join(root, "gen", "prognose-daten.js"));
const A = require(path.join(root, "gen", "azubi.js"));
require(path.join(root, "gen", "pruefen.js"));
require(path.join(root, "gen", "wiederholen.js"));
const FA = require(path.join(root, "gen", "fehleranalyse.js"));
const G = global.GEN, F = global.GENFEHLER;

assert(G && G.alleVorlagen().length > 50, "Generator geladen");

/* ---------------------------------------------------------------- klar -- */
assert.strictEqual(FA.klar("<b>A&amp;B</b>&nbsp;x<br>y"), "A&B x y");
assert.strictEqual(FA.klar(null), "");

/* ------------------------------------------- Generator: jede Vorlage ---- */
const richtigFuer = f => {
  switch (f.typ) {
    case "zahl": return G.fmt.kurz(f.loesung);
    case "auswahl": return String(f.loesung);
    case "mehrfachwahl": return (f.loesung || []).slice();
    case "aussagen": { const o = {}; (f.aussagen || []).forEach((x, i) => { o[i] = x.wahr ? "w" : "f"; }); return o; }
    case "zuordnung": { const o = {}; (f.paare || []).forEach((p, i) => { o[i] = p[1]; }); return o; }
    case "raster": {
      const o = {};
      (f.zeilen || []).forEach((z, zi) => z.zellen.forEach((c, ci) => {
        if (!c.eingabe) return;
        o[zi + "-" + ci] = c.text != null ? (Array.isArray(c.text) ? c.text[0] : c.text) : G.fmt.kurz(c.loesung);
      }));
      return o;
    }
    case "text": case "liste": return (f.erwartet || []).map(e => e[0]).join("\n");
    default: return undefined;
  }
};
const EINDEUTIG = { zahl: 1, auswahl: 1, mehrfachwahl: 1, aussagen: 1, zuordnung: 1 };
let vorlagen = 0, felder = 0;
G.alleVorlagen().forEach(v => {
  const a = G.erzeuge(v.id, 12345);
  vorlagen++;
  /* leer */
  const leer = FA.zeilenGen(a, G.pruefeAufgabe(a, {}), {});
  const ohneWeg = a.felder.filter(f => f.typ !== "rechenweg");
  assert.strictEqual(leer.length, ohneWeg.length, v.id + ": eine Zeile je Feld (leerer Rechenweg entfällt)");
  leer.forEach((z, i) => assert(z.status === "leer" || (z.sub && z.sub.every(s => s.leer)) || ohneWeg[i].typ === "flussbild",
    v.id + " Feld " + i + " (" + ohneWeg[i].typ + ") leer → " + z.status));
  /* richtig */
  const ein = {};
  a.felder.forEach(f => { const w = richtigFuer(f); if (w !== undefined) ein[f.nr] = w; });
  const erg = G.pruefeAufgabe(a, ein);
  const zeilen = FA.zeilenGen(a, erg, ein);
  zeilen.forEach((z, i) => {
    const f = ohneWeg[i];
    felder++;
    assert(typeof z.label === "string", v.id + " label");
    if (EINDEUTIG[f.typ]) {
      assert.strictEqual(z.status, "richtig", v.id + " Feld " + i + " (" + f.typ + ") mit Musterantwort: " + z.status);
      assert(!z.fehlt.length && !z.weg.length, v.id + " Feld " + i + ": nichts fehlt, nichts zu viel");
    }
    if (f.typ === "zahl") {
      assert(A.zahlen(z.richtig.replace(/\s*[^\d.,\s-].*$/, "")).some(n => Math.abs(n - f.loesung) <= Math.max(0.006, Math.abs(f.loesung) * 1e-6)),
        v.id + ": Richtig zeigt die Lösung (" + z.richtig + " / " + f.loesung + ")");
      if (f.einheit) assert(z.richtig.endsWith(f.einheit), v.id + ": mit Einheit");
    }
    if (z.sub) z.sub.forEach(s => assert(typeof s.richtig === "string" && s.richtig !== "", v.id + ": Unterzeile ohne Soll"));
  });
  /* falsch: Zahlen daneben, Auswahl daneben */
  const ein2 = Object.assign({}, ein);
  a.felder.forEach(f => {
    if (f.typ === "zahl") ein2[f.nr] = String(Math.round(Number(f.loesung) * 3 + 7777));
    if (f.typ === "mehrfachwahl") ein2[f.nr] = (f.optionen || []).filter(o => (f.loesung || []).map(String).indexOf(String(o)) < 0).slice(0, 1);
  });
  const z2 = FA.zeilenGen(a, G.pruefeAufgabe(a, ein2), ein2);
  ohneWeg.forEach((f, i) => {
    if (f.typ === "zahl") {
      assert.notStrictEqual(z2[i].status, "richtig", v.id + ": falsche Zahl");
      assert(z2[i].du.indexOf(ein2[f.nr]) === 0, v.id + ": Du zeigt die eigene Eingabe");
    }
    if (f.typ === "mehrfachwahl" && ein2[f.nr].length) {
      assert.deepStrictEqual(z2[i].weg, ein2[f.nr].map(String), v.id + ": falsches Kreuz steht unter „Weg damit“");
      assert.strictEqual(z2[i].fehlt.length, (f.loesung || []).length, v.id + ": richtige Kreuze fehlen");
    }
  });
});
assert(vorlagen > 50 && felder > 100, vorlagen + " Vorlagen, " + felder + " Felder");

/* Geld mit zwei Stellen, große Zahlen mit Tausenderpunkt */
assert.strictEqual(FA.sollZahl(44085.6, { einheit: "€" }), "44.085,60");
assert.strictEqual(FA.sollZahl(31360, { einheit: "€" }), "31.360,00");
assert.strictEqual(FA.sollZahl(31360, { einheit: "GB" }), "31.360");
assert.strictEqual(FA.sollZahl(2.5, {}), "2,5");

/* Text: getroffene und fehlende Begriffe */
const textVorlage = G.alleVorlagen().map(v => G.erzeuge(v.id, 7)).find(a => a.felder.some(f => f.typ === "liste" && (f.erwartet || []).length >= 3 && f.noetig >= 3));
if (textVorlage) {
  const f = textVorlage.felder.find(x => x.typ === "liste" && x.erwartet.length >= 3 && x.noetig >= 3);
  const ein = { [f.nr]: f.erwartet[0][0] };
  const z = FA.zeilenGen(textVorlage, G.pruefeAufgabe(textVorlage, ein), ein).find(y => y.label === f.label);
  assert(z.passt.length >= 1, "Text: ein Begriff getroffen");
  assert(z.fehlt.length >= 1, "Text: Rest fehlt");
  assert(z.richtig.length > 0);
}

/* ------------------------------------------ Prognose: jede Teilaufgabe --- */
const P = global.IHK_PROGNOSE.pruefungen;
let teile = 0;
P.forEach(m => A.teileVon(m).forEach(t => {
  teiles(t);
}));
function teiles(t) {
  teile++;
  const E = t.eingabe || {};
  const ok = {}, falsch = {};
  if (E.typ === "raster") (E.zellen || []).forEach(c => { if (c && c.f) { ok["f" + c.f.id] = c.f.soll[0]; falsch["f" + c.f.id] = c.f.art === "zahl" ? "999999" : "xyz"; } });
  else if (E.typ === "zeilen") (E.zeilen || []).forEach(z => {
    (z.felder || []).forEach(f => { ok["f" + f.id] = f.soll[0]; falsch["f" + f.id] = f.art === "zahl" ? "999999" : "xyz"; });
    if (z.frei) { ok["t" + z.frei] = "Meine Antwort"; falsch["t" + z.frei] = "Meine Antwort"; }
  });
  else if (E.typ === "zuordnung") E.zeilen.forEach(z => { ok["z" + z.id] = String(z.soll); falsch["z" + z.id] = String(Number(z.soll) === 1 ? 2 : 1); });
  else if (E.typ === "wahl") E.zeilen.forEach(z => { ok["w" + z.id] = z.soll; falsch["w" + z.id] = Number(z.soll) === 0 ? 1 : 0; });
  else if (E.typ === "mehrfach") { ok.m = E.soll.slice(); falsch.m = E.optionen.map((_, i) => i + 1).filter(i => E.soll.indexOf(i) < 0).slice(0, 1); }

  const leer = FA.zeilenAzubi(t, {}, A);
  assert(leer.length >= 1, t.id + ": mindestens eine Zeile");
  leer.forEach(z => assert.strictEqual(z.status, "leer", t.id + " leer → " + z.status + " (" + z.label + ")"));

  const zo = FA.zeilenAzubi(t, ok, A);
  zo.forEach(z => {
    if (z.frei) { assert.strictEqual(z.status, "offen", t.id + ": Freitext = selbst vergleichen"); return; }
    assert.strictEqual(z.status, "richtig", t.id + " mit Musterantwort: " + z.label + " → " + z.status);
    assert(!z.fehlt.length && !z.weg.length, t.id + ": nichts fehlt");
    if (z.sub) z.sub.forEach(s => assert(s.label && s.richtig, t.id + ": Unterzeile mit Beschriftung und Soll"));
    else assert(z.richtig, t.id + ": Richtig angegeben (" + z.label + ")");
  });

  const zf = FA.zeilenAzubi(t, falsch, A);
  zf.forEach(z => {
    if (z.frei) return;
    assert(z.status === "falsch" || z.status === "teil", t.id + " falsch → " + z.status + " (" + z.label + ")");
  });
  if (E.typ === "mehrfach" && falsch.m.length) assert.strictEqual(zf[0].weg.length, 1, t.id + ": Weg damit");
}
assert(teile >= 90, "Prognose-Teile: " + teile);

/* Beschriftung aus dem HTML der Zeile, Einheit an der eigenen Antwort */
const t1 = P[0].aufgaben[0].teile[0];
const z1 = FA.zeilenAzubi(t1, { f1: "34,20" }, A)[0];
assert(z1.label.indexOf("<") < 0 && z1.label.length > 3, "Label ohne HTML: " + z1.label);
assert.strictEqual(z1.du, "34,20 €");
assert.strictEqual(z1.richtig, "34,20 €");

/* ------------------------------------------------------ Abgleich Text --- */
const ab = FA.abgleich("Erläutern Sie RAID 1.", "Die Daten werden gespiegelt, dadurch gibt es Redundanz.",
  "RAID 1 spiegelt alle Daten auf eine zweite Festplatte (Mirroring). Dadurch entsteht Redundanz: fällt eine Festplatte aus, arbeitet die zweite weiter. Die Kapazität halbiert sich.");
assert(ab.passt.some(w => /Redundanz/.test(w)), "Redundanz getroffen: " + ab.passt);
assert(ab.fehlt.some(w => /Festplatte|Kapazität|Mirroring/.test(w)), "fehlende Begriffe: " + ab.fehlt);
assert(!ab.passt.concat(ab.fehlt).some(w => /^RAID$/.test(w)), "Begriff aus der Aufgabe zählt nicht");
assert.strictEqual(ab.status, "info");

/* ------------------------------------------------ Journal: Eingaben ---- */
const aufg = G.erzeuge(G.alleVorlagen().find(v => G.erzeuge(v.id, 1).felder.some(f => f.typ === "zahl")).id, 4242);
const zf1 = aufg.felder.find(f => f.typ === "zahl");
const eing = { [zf1.nr]: "1" };
const erg1 = G.pruefeAufgabe(aufg, eing);
erg1.eingaben = eing;
F.ausGenerator(aufg, erg1);
const eintrag = F.liste().find(x => x.schluessel === "g|" + aufg.vorlageId + "|" + aufg.saat);
assert(eintrag, "Journal-Eintrag angelegt");
assert.deepStrictEqual(eintrag.eingaben, eing, "alle Eingaben gespeichert");
assert.strictEqual(eintrag.saat, aufg.saat);
assert.strictEqual(F.still(() => 42), 42, "still gibt das Ergebnis durch");

/* Eingaben aus einem alten Blatt (Einträge von vor v39 haben keine) */
speicher["ihk2:gen:blaetter"] = JSON.stringify([{ aufgaben: [{ vorlageId: "x", saat: 1 }, { vorlageId: aufg.vorlageId, saat: aufg.saat }],
  antworten: { 1: { [zf1.nr]: "77" } }, selbst: { "1:0": 2, "0:0": 1 } }]);
const q = FA.genEingaben({ schluessel: "g|" + aufg.vorlageId + "|" + aufg.saat }, aufg);
assert.strictEqual(q.woher, "blatt");
assert.deepStrictEqual(q.eingaben, { [zf1.nr]: "77" });
assert.deepStrictEqual(q.selbst, { 0: 2 }, "Selbstwertung nur von dieser Aufgabe");
const q2 = FA.genEingaben({ schluessel: "g|" + aufg.vorlageId + "|" + aufg.saat, eingaben: { a: 1 } }, aufg);
assert.strictEqual(q2.woher, "journal", "Journal schlägt Blatt");

/* ------------------------------------------ sitzt / morgen / offen ------ */
const item = { id: "gen:" + eintrag.schluessel, quelle: "gen", art: "gen", ref: eintrag, verlust: 2, gruppe: { key: "gen", name: "Generator" } };
assert.strictEqual(FA.statusVon(item), "offen");
FA.setzen(item, "sitzt");
assert.strictEqual(FA.statusVon(item), "sitzt");
assert(F.liste().find(x => x.schluessel === eintrag.schluessel).erledigt, "sitzt hakt im Journal ab");
FA.setzen(item, "morgen");
assert.strictEqual(FA.statusVon(item), "morgen");
assert(!F.liste().find(x => x.schluessel === eintrag.schluessel).erledigt, "morgen öffnet im Journal wieder");
assert.strictEqual(FA.statusVon(item, FA.morgenIso()), "offen", "am nächsten Tag wieder offen");
FA.setzen(item, "offen");
assert.strictEqual(FA.statusVon(item), "offen");
const z = FA.zaehlen([item, Object.assign({}, item, { id: "x", verlust: 1.5 })]);
assert.strictEqual(z.offen, 2); assert.strictEqual(z.verlust, 3.5);
assert(JSON.parse(speicher["ihk2:analyse"]).k, "Stand gespeichert");

/* ordnen: Prognose → IHK → Azubi → Generator */
const o = FA.ordnen([
  { id: "1", art: "gen", gruppe: { key: "gen" } }, { id: "2", art: "azubi", gruppe: { key: "az:a" } },
  { id: "3", art: "ihk", gruppe: { key: "ihk:1" } }, { id: "4", art: "prognose", gruppe: { key: "az:p2" } },
  { id: "5", art: "prognose", gruppe: { key: "az:p1" } }, { id: "6", art: "prognose", gruppe: { key: "az:p2" } }]);
assert.deepStrictEqual(o.map(x => x.id), ["4", "6", "5", "3", "2", "1"]);

/* sammeln: ohne Seite keine Prüfungen, aber die Generator-Einträge */
const s = FA.sammeln();
assert(s.some(x => x.id === "gen:" + eintrag.schluessel), "Generator-Eintrag gesammelt");

/* ------------------------------------------------------- Einbindung ---- */
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
["gen/fehleranalyse.js", "gen/fehleranalyse.css"].forEach(f => {
  assert(html.includes(f), f + " in index.html");
  assert(sw.includes("./" + f), f + " im Service Worker");
});
assert(html.indexOf("gen/fehleranalyse.js") > html.indexOf("gen/wiederholen.js"), "nach wiederholen.js");
const zk = fs.readFileSync(path.join(root, "gen", "zurueck.js"), "utf8");
assert((zk.match(/scAnalyse/g) || []).length >= 3, "Zurück kennt scAnalyse");
const st = fs.readFileSync(path.join(root, "gen", "start.js"), "utf8");
assert(/key: "analyse", id: "analyseBox"/.test(st), "Startseiten-Block");
assert(/GENANALYSE/.test(fs.readFileSync(path.join(root, "gen", "finder.js"), "utf8")), "im Finder");

console.log("fehleranalyse: ok —", vorlagen, "Vorlagen,", felder, "Felder,", teile, "Prognose-Teile");
