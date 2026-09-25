"use strict";

/* „Prüfen lassen“ (gen/pruefen.js): Operator, Anzahl, Begründung,
   Stichworte, Text für Claude.                                          */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const P = require(path.join(root, "gen", "pruefen.js"));

/* Operator: der Auftragssatz zählt, nicht die Einleitung */
assert.strictEqual(P.operatorVon("Die Firma plant ein Projekt. Nennen Sie drei Vorteile.").key, "nennen");
assert.strictEqual(P.operatorVon("Erläutern Sie zwei Maßnahmen.").key, "erlaeutern");
assert.strictEqual(P.operatorVon("Beurteilen Sie das Angebot.").key, "beurteilen");
assert.strictEqual(P.operatorVon("Berechnen Sie die Kosten in Euro.").key, "berechnen");
assert.strictEqual(P.operatorVon("Unterscheiden Sie SaaS und PaaS.").key, "vergleichen");
assert.strictEqual(P.operatorVon("Geben Sie zwei Beispiele an.").key, "nennen");
assert.strictEqual(P.operatorVon("Ein Text ohne Auftrag."), null);

/* Anzahl, aber keine Mengenangaben mit Einheit */
assert.strictEqual(P.anzahlVon("Nennen Sie drei Vorteile"), 3);
assert.strictEqual(P.anzahlVon("Nennen Sie 2 Gründe"), 2);
assert.strictEqual(P.anzahlVon("Berechnen Sie 5 % Rabatt"), null);
assert.strictEqual(P.anzahlVon("in 3 Tagen"), null);

/* Punkte in der Antwort: Zeilen, Aufzählung, sonst Sätze */
assert.strictEqual(P.punkteIn("a) Firewall\nb) Backup\nc) Schulung"), 3);
assert.strictEqual(P.punkteIn("- Firewall - Backup"), 2);
assert.strictEqual(P.punkteIn("Die Firewall filtert. Das Backup sichert."), 2);
assert.strictEqual(P.punkteIn(""), 0);

/* Erläutern ohne Begründung → Warnung; mit „weil“ → ok */
let a = P.analyse({ frage: "Erläutern Sie zwei Maßnahmen.", antwort: "Firewall\nBackup" });
assert(a.hinweise.some(h => h.art === "warn" && /Begründung/.test(h.text)));
a = P.analyse({ frage: "Erläutern Sie zwei Maßnahmen.", antwort: "Eine Firewall, weil sie Angriffe filtert.\nEin Backup, dadurch sind Daten nach Verlust wieder da." });
assert(a.hinweise.some(h => h.art === "ok" && /Begründung/.test(h.text)));
assert(a.hinweise.some(h => h.art === "ok" && /2 Punkte/.test(h.text)));

/* zu wenige Punkte */
a = P.analyse({ frage: "Nennen Sie drei Vorteile.", antwort: "schneller" });
assert(a.hinweise.some(h => h.art === "warn" && /Verlangt sind 3/.test(h.text)));

/* Berechnen: Rechenweg und Einheit */
a = P.analyse({ frage: "Berechnen Sie die Kosten.", antwort: "1200" });
assert(a.hinweise.some(h => /Rechenweg/.test(h.text)) && a.hinweise.some(h => /Einheit/.test(h.text)));
a = P.analyse({ frage: "Berechnen Sie die Kosten.", antwort: "3 × 400 € = 1.200 €" });
assert(!a.hinweise.some(h => h.art === "warn"));

/* Stichworte der Musterlösung — und nicht vor dem Aufdecken */
const loesung = "Regelmäßige Datensicherung auf ein NAS, Verschlüsselung der Festplatten, Schulung der Mitarbeiter.";
a = P.analyse({ frage: "Nennen Sie drei Maßnahmen.", antwort: "Datensicherungen machen\nSchulungen", loesung });
assert(a.getroffen.some(w => /Datensicherung/.test(w)) && a.fehlt.some(w => /Verschlüsselung/.test(w)));
a = P.analyse({ frage: "Nennen Sie drei Maßnahmen.", antwort: "x", loesung, mitLoesung: false });
assert.strictEqual(a.getroffen.length + a.fehlt.length, 0);

/* Text für Claude: alles drin, Antwortform vorgegeben */
const t = P.prompt({ frage: "Nennen Sie zwei Vorteile.", loesung: "schnell, günstig", hinweis: "je 1 Punkt", punkte: 2, antwort: "schnell" });
["AUFGABE (2 Punkte", "MUSTERLÖSUNG", "BEWERTUNGSHINWEIS", "MEINE ANTWORT", "einfachen deutschen Sätzen", "russische Übersetzung"].forEach(s =>
  assert(t.includes(s), "fehlt im Prompt: " + s));

/* Ein Chat je Prüfung: erster Text kündigt weitere Aufgaben an, danach kurzer Kopf */
const t1 = P.prompt({ frage: "Nennen Sie zwei Vorteile.", loesung: "x", punkte: 2, antwort: "y", gruppe: "IHK Frühjahr 2024" });
assert(t1.includes("Du bist Prüfer") && t1.includes("nacheinander mehrere Aufgaben aus „IHK Frühjahr 2024“"), "erster Text");
const t2 = P.prompt({ frage: "Nennen Sie zwei Vorteile.", loesung: "x", hinweis: "h", punkte: 2, antwort: "y", gruppe: "IHK Frühjahr 2024", folge: true });
assert(!t2.includes("Du bist Prüfer") && t2.startsWith("Nächste Aufgabe aus „IHK Frühjahr 2024“"), "Folgetext kurz");
["AUFGABE (2 Punkte", "MUSTERLÖSUNG", "BEWERTUNGSHINWEIS", "MEINE ANTWORT:\ny"].forEach(s => assert(t2.includes(s), "Folgetext: " + s));
assert(t2.length < t1.length, "Folgetext kürzer");

/* Nur echte Chat-Links werden gespeichert */
assert.strictEqual(P.pruefeLink(" https://claude.ai/chat/0f3a9c1e-2b44-4d1a-9e77-12ab34cd56ef "), "https://claude.ai/chat/0f3a9c1e-2b44-4d1a-9e77-12ab34cd56ef");
assert.strictEqual(P.pruefeLink("https://claude.ai/chat/0f3a9c1e-2b44-4d1a?x=1"), "https://claude.ai/chat/0f3a9c1e-2b44-4d1a");
assert.strictEqual(P.pruefeLink("https://claude.ai/new"), null);
assert.strictEqual(P.pruefeLink("https://evil.example/chat/0f3a9c1e2b44"), null);
assert.strictEqual(P.pruefeLink("javascript:alert(1)"), null);
assert(P.MODI.map(m => m[0]).join() === "pruefung,neu,kopieren");
assert.strictEqual(P.modus(), "pruefung", "Computer ohne Einstellung: Chat dieser Prüfung");
assert.deepStrictEqual(P.gruppeIhk({ exam: { examId: "ap1-2024-f", meta: { season: "Frühjahr", year: 2024 } } }), { id: "ihk:ap1-2024-f", name: "IHK Frühjahr 2024" });

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
["gen/pruefen.js", "gen/pruefen.css"].forEach(f => { assert(html.includes(f)); assert(sw.includes("./" + f)); });

console.log("pruefen: Operator, Anzahl, Begründung, Stichworte und Prompt OK");
