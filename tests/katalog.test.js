"use strict";

/* Prüfungskatalog AP1 (gen/katalog-daten.js + gen/katalog-kern.js):
   vollständig, eindeutig, Muster gültig — und die Markierungen in den
   Prüfungsdaten folgen dem Original (umformen/grenzfall statt veraltet). */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

global.window = global;
require(path.join(root, "gen", "katalog-daten.js"));
const Kern = require(path.join(root, "gen", "katalog-kern.js"));
const K = window.IHK_KATALOG_AP1;

/* Aufbau wie im Katalog: 7 Fragenkomplexe, 33 Themenkreise */
assert.strictEqual(K.komplexe.length, 7, "7 Fragenkomplexe");
assert.deepStrictEqual(K.komplexe.map(k => k.nr), ["01", "02", "03", "04", "05", "06", "07"]);
const kreise = Kern.kreise(K);
assert.strictEqual(kreise.length, 33, "33 Themenkreise");
kreise.forEach(k => assert([1, 2, 3, 4].includes(k.tiefe), "Tiefe fehlt bei " + k.id));

/* Stichworte: eindeutig, jedes Muster kompiliert und trifft seinen eigenen Text nicht zwingend,
   aber es darf nicht leer sein */
const P = Kern.flach(K);
assert(P.length >= 160, "mindestens 160 Stichworte, sind " + P.length);
assert.strictEqual(new Set(P.map(p => p.id)).size, P.length, "Ids eindeutig");
P.forEach(p => {
  assert(p.muster && p.muster.length > 2, "Muster fehlt: " + p.id);
  assert(p.m.rx || p.m.en, "Muster ungültig: " + p.id);
});

/* Nicht AP1 und Anhang */
(K.nichtAP1 || []).forEach(e => {
  assert(["gestrichen", "ap2", "grenzfall", "anhang"].includes(e.art), "Art: " + e.key);
  assert(e.wo && e.wo.length > 5, "Fundstelle fehlt: " + e.key);
  new RegExp(e.m, "i");
  if (e.ohne) new RegExp(e.ohne, "i");
});
const kreisIds = new Set(kreise.map(k => k.id));
(K.anhang || []).forEach(a => assert(!a.ap1 || kreisIds.has(a.ap1), "Anhang verweist ins Leere: " + a.key));

/* Normalisierung und Treffer */
assert.strictEqual(Kern.norm("Prüfung Maß"), "pruefung mass");
assert(Kern.englisch(Kern.norm("Whether you are an individual or a company, you can protect your data with this tool and the settings of the device")));
assert(!Kern.englisch(Kern.norm("Nennen Sie zwei Vorteile der asymmetrischen Verschlüsselung.")));
const A = Kern.abdeckung(K, { aufg: [
  { key: "a", text: "Berechnen Sie den Skontobetrag und vergleichen Sie die Angebote." },
  { key: "b", text: "Erstellen Sie einen Netzplan und bestimmen Sie den kritischen Pfad." }
] });
const hat = (id, key) => (A.je[id].aufg || []).some(x => x.key === key);
assert(hat("03.04.08", "a"), "Angebotsvergleich/Skonto");
assert(hat("01.01.03", "b") && hat("01.01.05", "b"), "Netzplan + kritischer Weg");
assert(!hat("01.01.03", "a"));
assert(Kern.nichtAP1(K, "SELECT name FROM kunde WHERE ort = 'Köln'").some(e => e.key === "sql"));
assert(!Kern.nichtAP1(K, "Rechte und ihrer Vererbung auf das Notwendige begrenzen").some(e => e.key === "oop_konzepte"),
  "Rechtevererbung ist keine OOP-Vererbung");

/* Prüfungsdaten: Struktogramm-Aufgaben sind „umformen“, das Klassendiagramm „grenzfall“ */
require(path.join(root, "exams", "exams.js"));
const find = (ex, id) => {
  const e = window.IHK_EXAMS.find(x => x.examId === ex);
  for (const t of e.tasks) for (const s of t.subtasks) if (s.id === id) return s;
  return null;
};
assert.strictEqual(find("ap1-2022-h", "4b").katalog.status, "umformen");
assert.strictEqual(find("ap1-2022-f", "4d").katalog.status, "umformen");
assert.strictEqual(find("ap1-2023-f", "4c").katalog.status, "grenzfall");
assert.strictEqual(find("ap1-2023-h", "4cb").katalog.status, "veraltet", "SQL bleibt veraltet");

/* eingebunden und offline verfügbar */
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
["gen/katalog-daten.js", "gen/katalog-kern.js", "gen/katalog.js", "gen/katalog.css"].forEach(f => {
  assert(html.includes(f), f + " in index.html");
  assert(sw.includes("./" + f), f + " im Service Worker");
});

console.log("katalog: " + P.length + " Stichworte, " + kreise.length + " Themenkreise, Markierungen nach Original OK");
