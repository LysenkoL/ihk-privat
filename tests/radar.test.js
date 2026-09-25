/* tests/radar.test.js — Themen-Radar: Zählung, Kategorien, Überraschungen */
"use strict";
const assert = require("assert");
const path = require("path");
global.window = global;
require(path.join(__dirname, "..", "gen", "radar-daten.js"));
require(path.join(__dirname, "..", "gen", "prognose-daten.js"));
const G = require(path.join(__dirname, "..", "gen", "radar.js"));
const D = window.IHK_RADAR;
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };

ok(D.spalten.length === 10 && D.exams.length === 10, "zehn neue AP1-Prüfungen");
D.teil1.forEach(t => {
  ok(t.neu.length === 10 && t.alt.length === 21, t.t + " Kreuze");
  ok(/^[.x]+$/.test(t.neu + t.alt), t.t + " nur x und .");
  if (t.such) ok(new RegExp(t.such, "i"), t.t + " Suchmuster");
  ok(D.gruppen[t.g], t.t + " Gruppe");
});
ok(new Set(D.teil1.map(t => t.k)).size === D.teil1.length, "Schlüssel eindeutig");

const L = G.prognose(D), by = k => L.find(t => t.k === k);
ok(by("ip").n10 === 6 && by("ip").n4 === 4 && by("ip").wert === 10, "IPv4/6: 6 von 10, alle letzten 4");
ok(L[0].k === "ip", "IPv4/6 steht oben");
["ip", "algorithmus", "netzwerk", "kosten", "schutz", "erm"].forEach(k => ok(by(k).kat === "sehr", k + " sehr wahrscheinlich"));
["backup", "speicher", "hardware", "programmierung", "schreibtisch", "nutzwert", "netzplan", "englisch"].forEach(k => ok(by(k).kat === "wahr", k + " wahrscheinlich"));
ok(by("kosten").faellig && by("nutzwert").faellig && by("hardware").faellig, "fällig: oft dran, zuletzt 2× nicht");
ok(!by("ip").faellig, "IP nicht als fällig markiert");
ok(by("sql").kat === "ap2" && by("raid").kat === "ap2", "SQL und RAID nur noch Teil 2");
["angebotskalk", "bab", "deckungsbeitrag", "usv", "virtualisierung"].forEach(k => ok(by(k).kat === "weg", k + " seit 2021 weg"));
ok(by("malware").n10 === 2, "Malware 2× (Tabelle sagte fälschlich 28)");
ok(by("strom").neuSeit === 8 && by("ergonomie").neuSeit === 9, "neu seit H25 / F26");

const ue = G.ueberraschungen(D);
ok(ue.length === 4 && ue[3].name === "F26", "letzte vier Prüfungen");
ok(ue[3].themen.includes("Ergonomischer Arbeitsplatz") && ue[3].themen.includes("Daisy-Chaining (Monitore)"), "F26: Ergonomie, Daisy");
ok(ue[1].themen.includes("Einsatz von KI") && ue[1].themen.includes("Webentwicklung"), "F25: KI, Web");

const a2 = G.ap2Liste(D);
ok(["Algorithmus erstellen", "SQL & Allgemeines", "Klassendiagramm OOP"].every(t => a2.slice(0, 5).some(x => x.t === t)), "AP2-Spitze");
ok(a2[0].anzahl >= a2[1].anzahl, "AP2 sortiert");

/* Prognose-Prüfungen decken die Spitze ab */
L.filter(t => t.kat === "sehr").forEach(t => ok(G.inPrognose(t.k).length >= 1, t.t + " steckt in einer Prognose-Prüfung"));
ok(G.inPrognose("ip").length >= 2, "IP in mehreren Prüfungen");
console.log("radar.test.js: " + n + " Prüfungen bestanden");
