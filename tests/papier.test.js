"use strict";

/* Fehler von Papier (gen/papier.js): Claudes Antwort einlesen — Format,
   Nachsicht bei Markdown, JSON, Punkte, Gründe, Speicher; Anbindung an
   „Fehler durchgehen“ und Merkblatt; Abgleich je Eintrag.                 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

global.window = global;
const speicher = {};
global.localStorage = { getItem: k => (k in speicher ? speicher[k] : null), setItem: (k, v) => { speicher[k] = String(v); }, removeItem: k => { delete speicher[k]; } };
global.document = { readyState: "loading", getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  addEventListener() {}, createElement: () => ({ appendChild() {}, classList: { add() {} } }) };

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
(html.match(/<script src="gen\/(kern|vorlagen-[a-z]+)\.js"><\/script>/g) || [])
  .map(s => /gen\/([a-z-]+)\.js/.exec(s)[1]).forEach(n => require(path.join(root, "gen", n + ".js")));
require(path.join(root, "gen", "fehlerjournal.js"));
require(path.join(root, "gen", "prognose-daten.js"));
require(path.join(root, "gen", "azubi.js"));
require(path.join(root, "gen", "pruefen.js"));
require(path.join(root, "gen", "wiederholen.js"));
require(path.join(root, "gen", "radar-daten.js"));
require(path.join(root, "gen", "radar.js"));
require(path.join(root, "gen", "glossar-daten.js"));
require(path.join(root, "gen", "glossar.js"));
const P = require(path.join(root, "gen", "papier.js"));
const FA = require(path.join(root, "gen", "fehleranalyse.js"));

/* ---------------------------------------------------- Standardformat --- */
const claude = [
  "Hier sind deine Fehler:",
  "```text",
  "## FEHLER",
  "Quelle: Prognose 1 · 2 c)",
  "Ref: p1-1a",
  "Thema: Subnetting",
  "Punkte: 1 / 4",
  "Aufgabe: Bestimmen Sie die Broadcastadresse des Netzes 192.168.10.64/26.",
  "Meine Antwort: 192.168.10.255",
  "Richtig: Netzadresse 192.168.10.64, /26 = 64 Adressen.",
  "Broadcast = 64 + 63 = 192.168.10.127",
  "Fehlt: Rechenweg; Blockgröße 64",
  "Falsch: -",
  "Warum: Präfix falsch gelesen",
  "Merksatz: /26 → Blockgröße 64, Broadcast = Netzadresse + 63",
  "Vokabeln: Broadcastadresse = широковещательный адрес; Netzteil = блок питания",
  "",
  "## FEHLER",
  "Quelle: IHK Frühjahr 2024 · 3 b)",
  "Thema: Datenschutz",
  "Punkte: 0,5 von 2",
  "Aufgabe: Erläutern Sie zwei Betroffenenrechte.",
  "Meine Antwort: Auskunft",
  "Richtig: Recht auf Auskunft (Art. 15): …; Recht auf Löschung (Art. 17): …",
  "Fehlt: Recht auf Löschung; Begründung mit „weil“",
  "Warum: zu knapp, keine Begründung",
  "```"
].join("\n");
let r = P.lesen(claude);
assert.strictEqual(r.eintraege.length, 2, JSON.stringify(r));
const [a, b] = r.eintraege;
assert.strictEqual(a.quelle, "Prognose 1 · 2 c)");
assert.strictEqual(a.ref, "p1-1a");
assert.strictEqual(a.erreicht, 1); assert.strictEqual(a.max, 4);
assert(/Broadcast = 64 \+ 63/.test(a.richtig), "mehrzeilig: " + a.richtig);
assert.deepStrictEqual(a.fehlt, ["Rechenweg", "Blockgröße 64"]);
assert.deepStrictEqual(a.falsch, [], "„-“ heißt nichts");
assert.strictEqual(a.grund, "gelesen");
assert.deepStrictEqual(a.vokabeln[0], { de: "Broadcastadresse", ru: "широковещательный адрес" });
assert.strictEqual(b.erreicht, 0.5); assert.strictEqual(b.max, 2);
assert.strictEqual(b.grund, "formuliert");
assert.strictEqual(b.ref, "");

/* ------------------------------------------- Markdown-Nachsicht -------- */
r = P.lesen([
  "### Fehler 1",
  "- **Aufgabe:** Wie viele Hosts hat ein /27-Netz?",
  "- **Meine Antwort:** 32",
  "- **Richtig:** 30 (32 Adressen minus Netz- und Broadcastadresse)",
  "- **Warum:** nicht gewusst",
  "---",
  "### Fehler 2",
  "* __Frage__: Was ist RAID 1?",
  "* __Lösung__: Spiegelung",
].join("\n"));
assert.strictEqual(r.eintraege.length, 2, JSON.stringify(r));
assert.strictEqual(r.eintraege[0].meine, "32");
assert.strictEqual(r.eintraege[0].grund, "gewusst");
assert.strictEqual(r.eintraege[1].richtig, "Spiegelung");

/* ohne Kopf: ein einzelner Fehler */
r = P.lesen("Aufgabe: X\nMeine Antwort: Y\nRichtig: Z");
assert.strictEqual(r.eintraege.length, 1);
assert.strictEqual(r.eintraege[0].richtig, "Z");

/* JSON */
r = P.lesen('```json\n[{"Quelle":"Blatt 3","Aufgabe":"A","Meine Antwort":"B","Richtig":"C","Fehlt":["x","y"],"Punkte":"1/3"}]\n```');
assert.strictEqual(r.eintraege.length, 1);
assert.deepStrictEqual(r.eintraege[0].fehlt, ["x", "y"]);
assert.strictEqual(r.eintraege[0].max, 3);

/* Unsinn */
r = P.lesen("Hallo, wie geht's?");
assert.strictEqual(r.eintraege.length, 0);
assert(r.hinweise.length >= 1);
assert.strictEqual(P.lesen("").eintraege.length, 0);

/* stabile Kennung: gleiche Aufgabe + Antwort = derselbe Eintrag */
assert.strictEqual(P.lesen(claude).eintraege[0].id, a.id);

/* --------------------------------------------------------- Speicher --- */
let s = P.speichern([a, b]);
assert.deepStrictEqual(s, { neu: 2, alt: 0 });
s = P.speichern([a]);
assert.deepStrictEqual(s, { neu: 0, alt: 1 }, "noch einmal einlesen aktualisiert");
assert.strictEqual(P.alle().length, 2);
const gespeichert = JSON.parse(speicher[P.SK]);
assert(gespeichert[a.id] && gespeichert[a.id].geaendert, "flach je Kennung, mit Zeitstempel");

/* ---------------------------------------- in „Fehler durchgehen“ ------ */
const items = FA.sammeln().filter(x => x.quelle === "papier");
assert.strictEqual(items.length, 2);
assert.strictEqual(items[0].art, "papier");
assert.strictEqual(items[0].gruppe.name, "Papier · Prognose 1");
assert.strictEqual(items[0].verlust, 3);
assert.strictEqual(FA.ordnen(FA.sammeln())[0].art, "papier", "Papier steht vorn");
const z = FA.zeilenPapier(a)[0];
assert.strictEqual(z.status, "teil");
assert.strictEqual(z.du, "192.168.10.255");
assert.deepStrictEqual(z.fehlt, ["Rechenweg", "Blockgröße 64"]);
const ref = FA.refFinden("P1-1A");
assert(ref && ref.art === "azubi" && ref.tid === "p1-1a", "Kennung der Prognose-Prüfung gefunden");
assert.strictEqual(FA.refFinden("-"), null);

/* Merkblatt: Vokabeln mit Russisch, Kern der Lösung mit Merksatz */
const lp = FA.lernpunkte(items[0]);
assert(lp.begriffe.some(x => x.de === "Broadcastadresse" && /широковещ/.test(x.ru)), JSON.stringify(lp.begriffe));
assert(lp.fakten.some(f => f.art === "kern" && /Merke: \/26/.test(f.richtig)), JSON.stringify(lp.fakten));
const lz = FA.lernzettel(FA.sammeln());
assert(lz.some(g => g.fakten.some(f => /Broadcastadresse/.test(f.frage))), "auf dem Lernzettel");

/* Status wie bei allen anderen Fehlern; „offen“ bleibt gespeichert */
FA.setzen(items[0], "sitzt");
assert.strictEqual(FA.statusVon(items[0]), "sitzt");
FA.setzen(items[0], "offen");
assert.strictEqual(FA.statusVon(items[0]), "offen");
assert.strictEqual(JSON.parse(speicher["ihk2:analyse"]).k[items[0].id].s, "offen");

/* Löschen */
assert(P.entfernen(b.id));
assert.strictEqual(P.alle().length, 1);
assert.strictEqual(FA.sammeln().filter(x => x.quelle === "papier").length, 1);

/* ------------------------------------------- Abgleich Handy ↔ PC ------ */
const S = require(path.join(root, "gen", "sync.js"));
const J = JSON.stringify;
let m = S.mische(
  { "ihk2:papier": J({ x: { id: "x", geaendert: 5, richtig: "alt" }, y: { id: "y", geaendert: 9, weg: true } }) }, { "ihk2:papier": 900 },
  { "ihk2:papier": J({ x: { id: "x", geaendert: 7, richtig: "neu" }, y: { id: "y", geaendert: 3, richtig: "lebt" }, z: { id: "z", geaendert: 1 } }) }, { "ihk2:papier": 100 });
let o = JSON.parse(m.schreiben["ihk2:papier"]);
assert.strictEqual(o.x.richtig, "neu", "je Eintrag gewinnt der neuere");
assert.strictEqual(o.y.weg, true, "gelöscht bleibt gelöscht, auch wenn die andere Seite insgesamt älter ist");
assert(o.z, "neuer Eintrag kommt dazu");
m = S.mische(
  { "ihk2:analyse": J({ k: { a: { s: "sitzt", t: 10 }, b: { s: "offen", t: 50 } } }) }, { "ihk2:analyse": 900 },
  { "ihk2:analyse": J({ k: { a: { s: "morgen", f: "2026-09-29", t: 20 }, b: { s: "sitzt", t: 40 }, c: { s: "sitzt", t: 1 } } }) }, { "ihk2:analyse": 100 });
o = JSON.parse(m.schreiben["ihk2:analyse"]);
assert.strictEqual(o.k.a.s, "morgen", "a: dort neuer");
assert.strictEqual(o.k.b.s, "offen", "b: hier neuer");
assert.strictEqual(o.k.c.s, "sitzt", "c: nur dort");
assert.strictEqual(S.bereichVon("ihk2:papier"), "Papier-Fehler");

/* ------------------------------------------------------- Einbindung ---- */
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
assert(html.includes("gen/papier.js") && sw.includes("./gen/papier.js"), "eingebunden und offline");
assert(html.indexOf("gen/papier.js") < html.indexOf("gen/fehleranalyse.js"));
const an = P.anleitung();
["## FEHLER", "Meine Antwort:", "Richtig:", "Fehlt:", "Vokabeln:"].forEach(w => assert(an.includes(w), "Anleitung: " + w));
/* die Anleitung selbst als Beispielantwort gelesen: ein Block, nichts stürzt ab */
assert.strictEqual(P.lesen(an).eintraege.length, 1);
const es = fs.readFileSync(path.join(root, "gen", "endspurt.js"), "utf8");
assert(/Nur Fehler: Papier einlesen/.test(es) && /GENANALYSE\.oeffnen/.test(es), "Endspurt: letzte Tage = Fehlerarbeit");

console.log("papier: ok");
