/* tests/prognose.test.js — Prognose-Prüfungen: Aufbau und nachgerechnete Lösungen */
"use strict";
const assert = require("assert");
const path = require("path");
const D = require(path.join(__dirname, "..", "gen", "prognose-daten.js"));
const R = require(path.join(__dirname, "..", "gen", "radar-daten.js"));
let n = 0;
const ok = (c, m) => { assert.ok(c, m); n++; };

/* ---------------------------------------------------------------- Aufbau */
ok(D.pruefungen.length === 3, "drei Prüfungen");
const alle = {};
D.pruefungen.forEach(m => {
  ok(/^azprog\d$/.test(m.id), "id " + m.id + " (Azubi-Sync erkennt ^ihk2:azubi:az)");
  ok(m.minuten === 90 && m.punkte === 100, m.id + " 90 Min./100 P.");
  ok(m.aufgaben.length === 4, m.id + " vier Aufgaben");
  const summe = m.aufgaben.reduce((s, a) => s + a.teile.reduce((x, t) => x + t.punkte, 0), 0);
  ok(summe === 100, m.id + " hat " + summe + " statt 100 BE");
  m.aufgaben.forEach(a => {
    ok(a.teile.reduce((x, t) => x + t.punkte, 0) === 25, m.id + " Aufgabe " + a.nr + " = 25 BE");
    ok(Array.isArray(a.themen) && a.themen.length, m.id + " A" + a.nr + " Themen");
    a.themen.forEach(k => ok(R.teil1.some(t => t.k === k), "Thema " + k + " steht im Radar"));
    a.teile.forEach(t => {
      ok(!alle[t.id], "id doppelt: " + t.id); alle[t.id] = t;
      ok(t.titel && t.text && t.loesung && t.vorbild, t.id + " vollständig");
      ok(/^(IHK (Frühjahr|Herbst) 20\d\d|Azubi-Navigator (P\d\d|VÜ \d))/.test(t.vorbild), t.id + " Vorlage: " + t.vorbild);
      ok(t.sek === Math.round(t.punkte * 54), t.id + " Zeit");
      const E = t.eingabe;
      ok(["zeilen", "raster", "wahl", "zuordnung", "mehrfach"].includes(E.typ), t.id + " Eingabetyp");
      if (E.typ === "zeilen") E.zeilen.forEach(z => ok(z.frei || (z.felder && z.felder.every(f => f.soll && f.soll.length)), t.id + " Zeile ohne Soll"));
      if (E.typ === "raster") {
        ok(E.zellen.length === E.zeilen * E.spalten, t.id + " Rastergröße");
        E.zellen.forEach(c => ok(c.h != null || (c.f && c.f.soll.length), t.id + " Zelle"));
      }
      if (E.typ === "wahl") E.zeilen.forEach(z => ok(z.soll >= 0 && z.soll < z.optionen.length, t.id + " Wahl-Soll"));
      if (E.typ === "zuordnung") E.zeilen.forEach(z => ok(+z.soll >= 1 && +z.soll <= E.optionen.length, t.id + " Zuordnung"));
      /* HTML grob prüfen: geöffnete und geschlossene Tabellen/Listen passen */
      [t.text, t.loesung].forEach(h => ["table", "ul", "pre", "div", "b"].forEach(tag => {
        const auf = (h.match(new RegExp("<" + tag + "[ >]", "g")) || []).length, zu = (h.match(new RegExp("</" + tag + ">", "g")) || []).length;
        ok(auf === zu, t.id + " <" + tag + "> " + auf + "/" + zu);
      }));
    });
  });
});

/* ------------------------------------------------------ Lösungen rechnen */
const feld = (id, i) => {
  const E = alle[id].eingabe;
  const fs = E.typ === "raster" ? E.zellen.filter(c => c.f).map(c => c.f) : E.zeilen.filter(z => z.felder).map(z => z.felder[0]);
  return fs[i].soll;
};
const zahl = s => parseFloat(String(s).replace(/\./g, "").replace(",", "."));
const gleich = (id, i, wert, tol) => { const s = zahl(feld(id, i)[0]); ok(Math.abs(s - wert) <= (tol || 1e-6), id + "[" + i + "] soll " + wert + ", steht " + s); };
const r2 = x => Math.round(x * 100) / 100;

/* P1 */
const mon = 380 * 0.9 * 6 / 60, pc = 1140 * 0.9 * 6 / 48, sw = 45 * 6, wa = 960 / 12;
gleich("p1-1a", 0, r2(mon)); gleich("p1-1a", 1, r2(pc)); gleich("p1-1a", 2, sw); gleich("p1-1a", 3, wa); gleich("p1-1a", 4, r2(mon + pc + sw + wa));
const wsum = 25 + 125 + 220 + 4 * 5 + 2 * 7 + 4 * 3 + 10;
gleich("p1-1b", 0, wsum); gleich("p1-1b", 1, wsum * 1.2, 1e-9);
gleich("p1-1b", 2, Math.ceil(wsum * 1.2 / 50) * 50);
const nt = Math.ceil(wsum * 1.2 / 50) * 50, aufn = nt * 0.6 / 0.88, kwh = aufn / 1000 * 220 * 8;
gleich("p1-1c", 0, aufn, 1e-9); gleich("p1-1c", 1, kwh, 1e-9); gleich("p1-1c", 2, r2(kwh * 0.32));
const alt = 600 * 0.6 / 0.88; ok(Math.abs(zahl(feld("p1-1c", 0)[1]) - alt) < 0.1, "Ersatzwert 600 W");
ok(Math.abs(zahl(feld("p1-1c", 2)[1]) - alt / 1000 * 1760 * 0.32) < 0.01, "Ersatzkosten");
gleich("p1-1d", 0, 12 * 0.75); gleich("p1-1d", 1, 12 * 0.75 / 5);
ok(feld("p1-2a", 0)[0] === "255.255.255.192" && feld("p1-2a", 2)[0] === "10.40.7.128" && feld("p1-2a", 3)[0] === "10.40.7.191", "Subnetz /26");
gleich("p1-2a", 1, Math.pow(2, 6) - 2);
ok(Math.floor(140 / 64) * 64 === 128, "Block 128");
ok(feld("p1-2e", 1)[0] === "fe80:0000:0000:0000:3e52:82ff:fe0a:6e19", "IPv6 ungekürzt");
/* EUI-64 aus der MAC */
const mac = "3C-52-82-0A-6E-19".split("-").map(h => parseInt(h, 16));
mac[0] ^= 2;
const eui = [mac[0], mac[1], mac[2], 0xff, 0xfe, mac[3], mac[4], mac[5]].map(b => b.toString(16).padStart(2, "0"));
ok([0, 2, 4, 6].map(i => (eui[i] + eui[i + 1]).replace(/^0+(?=.)/, "")).join(":") === "3e52:82ff:fe0a:6e19", "EUI-64 passt zur MAC");
gleich("p1-4d", 1, 2.5 * 4 + 0.8 * 10);

/* P2 */
const nwa = { A: [2, 3, 2], B: [1, 4, 4], C: [3, 1, 1] }, gew = [50, 30, 20];
const ws = k => nwa[k].map((p, i) => p * gew[i]);
/* Reihenfolge der Felder: je Zeile A, B, C; dann Summen; dann Bewertung */
[0, 1, 2].forEach(r => ["A", "B", "C"].forEach((k, j) => gleich("p2-1a", r * 3 + j, ws(k)[r])));
const sum = ["A", "B", "C"].map(k => ws(k).reduce((a, b) => a + b, 0));
sum.forEach((s, j) => gleich("p2-1a", 9 + j, s));
const rang = sum.map(s => sum.filter(x => x < s).length + 1);
rang.forEach((r, j) => gleich("p2-1a", 12 + j, r));
gleich("p2-1c", 0, 1290 * 48); gleich("p2-1c", 1, 1290 * 48 - 52800);
gleich("p2-1f", 0, Math.round(3847.90 * 3) / 100);
gleich("p2-2i", 0, 25 * 120 / 1000 + 30);
/* /20 */
const ip = [172, 20, 14, 77], blk = 256 - 240;
ok(feld("p2-2g", 0)[0] === "172.20." + Math.floor(ip[2] / blk) * blk + ".0", "Netzadresse /20");
ok(feld("p2-2g", 2)[0] === "172.20." + (Math.floor(ip[2] / blk) * blk + blk - 1) + ".255", "Broadcast /20");
/* Netzplan: selbst rechnen */
const V = { A: [3, []], B: [4, ["A"]], C: [5, ["B"]], D: [6, ["A"]], E: [4, ["C"]], F: [7, ["C"]], G: [2, ["D", "E"]], H: [3, ["F", "G"]], I: [1, ["H"]] };
const K = Object.keys(V), FAZ = {}, FEZ = {}, SAZ = {}, SEZ = {};
K.forEach(k => { FAZ[k] = Math.max(0, ...V[k][1].map(v => FEZ[v])); FEZ[k] = FAZ[k] + V[k][0]; });
const ende = Math.max(...K.map(k => FEZ[k]));
K.slice().reverse().forEach(k => { const nf = K.filter(x => V[x][1].includes(k)); SEZ[k] = nf.length ? Math.min(...nf.map(x => SAZ[x])) : ende; SAZ[k] = SEZ[k] - V[k][0]; });
const FP = k => { const nf = K.filter(x => V[x][1].includes(k)); return (nf.length ? Math.min(...nf.map(x => FAZ[x])) : ende) - FEZ[k]; };
const raster = alle["p2-4a"].eingabe;
for (let r = 2; r < raster.zeilen; r++) {
  const z = raster.zellen.slice(r * raster.spalten, (r + 1) * raster.spalten), k = z[0].h;
  const soll = [FAZ[k], FEZ[k], SAZ[k], SEZ[k], SAZ[k] - FAZ[k], FP(k)];
  z.slice(1).forEach((c, i) => ok(Number(c.f ? c.f.soll[0] : c.h) === soll[i], "Netzplan " + k + " Spalte " + i));
}
ok(ende === 23, "Projektdauer 23");
ok(K.filter(k => SAZ[k] === FAZ[k]).join("-") === "A-B-C-F-H-I", "kritischer Pfad");

/* P3 */
const pos = 4 * 289 + 612 + 4 * 239 + 3 * 85;
ok(pos === 2979 && r2(pos * 0.19) === 566.01 && r2(pos * 1.19) === 3545.01, "Rechnung rechnet");
gleich("p3-2b", 1, 21 / 48 * 1000, 0.1);
gleich("p3-2f", 0, 16 * 230); gleich("p3-2f", 1, 4 * 220 + 4 * 30 + 1050 + 2000);
gleich("p3-2g", 0, 3.8e9);
const tib = 5 * 8e6 * 7 * 24 * 3600 / 8 / Math.pow(1024, 4);
gleich("p3-3a", 0, r2(tib)); gleich("p3-3a", 1, Math.ceil(tib));
const bit = 2.5 * Math.pow(1024, 3) * 8, sek = Math.ceil(bit / 40e6);
gleich("p3-3b", 0, bit); gleich("p3-3b", 1, sek); gleich("p3-3b", 2, Math.floor(sek / 60)); gleich("p3-3b", 3, sek % 60);
const bit2 = 1250 * 1024 * 1024 * 8;
gleich("p3-3c", 0, bit2); gleich("p3-3c", 1, Math.ceil(bit2 / 50e6));
gleich("p3-3d", 0, 12800 * 3 * 32 / 8 / 1024);
gleich("p3-3e", 0, Math.pow(2, 30));
gleich("p3-3f", 0, 30 / 96 * 100);
gleich("p3-4a", 0, r2(1104 / 48)); gleich("p3-4a", 1, r2((1104 - 69) / 1104 * 100)); gleich("p3-4a", 2, r2(18216 / 1104));
/* verschachtelte Bedingungen nachspielen */
const art = (g, ex, k, e) => k ? (e > 100 ? "Kühl-LKW, Abfahrt sofort" : "Kühltransporter, Tour 1")
  : ex ? (g > 500 ? "Express-LKW" : "Express-Transporter") : (g > 500 && e > 50 ? "Sammel-LKW, nächster Tag" : "Regionaltour");
ok(feld("p3-4b", 0)[0] === art(800, false, false, 60), "Aufruf 1");
ok(feld("p3-4b", 1)[0] === art(500, true, false, 20), "Aufruf 2");

/* ------------------------------------------- Prüfen, Markdown, Punkte zurück */
const A = require(path.join(__dirname, "..", "gen", "azubi.js"));
const f = (soll, w, art) => A.feldRichtig({ soll: [].concat(soll), art: art || "text" }, w);
ok(f("10.40.7.128", "10.40.7.128/26") && f("10.40.7.128", "Netzadresse: 10.40.7.128") && f("255.255.255.192", "255.255.255.192 (/26)"), "IP mit Präfix/Beschriftung");
ok(f("summe = summe + (pos.gewicht * pos.menge)", "summe=summe+pos.gewicht*pos.menge"), "Codezeile ohne Leerzeichen/Klammern");
ok(!f("10.40.7.128", "10.40.7.129") && !f("summe = summe + (pos.gewicht * pos.menge)", "summe = summe +") && !f("/25", "/24"), "falsche bleiben falsch");
ok(f("375", "330/0,88 = 375 W", "zahl") && f("375", "375 W (bei 600 W: 409)", "zahl") && f("18", "2,5*4+0,8*10=18", "zahl") && f("2,75", "≈ 2,75 TiB", "zahl"), "Zahl mit Rechenweg");
ok(!f("62", "64", "zahl") && !f("4", "4,2", "zahl"), "falsche Zahl bleibt falsch");
/* Jede automatisch prüfbare Musterantwort besteht ihre eigene Prüfung */
D.pruefungen.forEach(m => A.teileVon(m).forEach(t => {
  const a = {};
  A.stellen(t).forEach(s0 => {
    if (s0.art === "feld") a[s0.key] = s0.f.soll[0];
    else if (s0.art === "wahl") a[s0.key] = s0.soll;
    else if (s0.art === "zuordnung") a[s0.key] = s0.soll;
    else if (s0.art === "mehrfach") a.m = s0.soll.slice();
  });
  const r = A.pruefe(t, a);
  if (r.pruefbar) ok(r.k === r.n, t.id + ": Musterantwort voll richtig (" + r.k + "/" + r.n + ")");
}));
const m1 = D.pruefungen[0];
const zz = { a: { "p1-1a": { f1: "34,20", f5: "512,45" }, "p1-4h": { t1: "Konstante bleibt gleich", t2: "MWST_SATZ" } }, p: { "p1-1a": 3 }, auf: {}, auto: {}, modus: "pruefung", zeit: 600000, versuche: [] };
const md = A.markdown(m1, zz, {});
ok(md.anzahl === 35 && md.text.includes("`id: p1-1a`") && md.text.includes("PUNKTE"), "Markdown: alle Teilaufgaben mit id und PUNKTE-Anweisung");
ok(md.text.includes("Monitore (alle sechs) pro Monat: 34,20 €") && md.text.includes("Unterschied: Konstante bleibt gleich"), "Markdown: Antworten mit Beschriftung");
ok(md.text.includes("_(keine Antwort)_") && md.text.includes("Meine Selbstbewertung bisher: 3 von 7"), "Markdown: leere und bewertete");
ok(A.markdown(m1, zz, { nurText: true }).anzahl < 35, "nur Textantworten");
ok(A.antwortMd(A.teileVon(m1).find(t => t.id === "p1-4c"), { f1: "4", t1: "Multiplikation" }) === "Fehlerhafte Zeile: 4\nErläuterung: Multiplikation", "Antwort mit Feld und Text");
const pk = A.punkteLesen(m1, "PUNKTE\n`p1-1a: 5,5`\n- p1-4h: 2\n1 b): 3\nAufgabe 2 a) = 4\np1-3a: 9\nxyz: 1\n3 z): 2");
ok(JSON.stringify(pk) === JSON.stringify({ "p1-1a": 5.5, "p1-4h": 2, "p1-1b": 3, "p1-2a": 4, "p1-3a": 2 }), "Punkte lesen: " + JSON.stringify(pk));

console.log("prognose.test.js: " + n + " Prüfungen bestanden");
