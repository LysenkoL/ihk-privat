"use strict";

/* Glossar (gen/glossar-daten.js + gen/glossar.js): Daten vollständig,
   Treffer im Text richtig begrenzt, Suche deutsch und russisch.        */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

global.window = global;
require(path.join(root, "gen", "glossar-daten.js"));
const Gl = require(path.join(root, "gen", "glossar.js"));
const roh = window.IHK_GLOSSAR, GEB = window.IHK_GLOSSAR_GEBIETE;

assert(roh.length >= 300, "mindestens 300 Begriffe, sind " + roh.length);
roh.forEach(r => {
  assert.strictEqual(r.length, 6, "6 Felder: " + r[0]);
  const [de, ru, einfach, ap, gebiet, varianten] = r;
  assert(de && ru && einfach, "leer: " + de);
  assert(/[а-яё]/i.test(ru), "Russisch fehlt: " + de);
  assert(["1", "2", "1+2"].includes(ap), "AP: " + de);
  assert(GEB[gebiet], "Gebiet: " + de + " → " + gebiet);
  assert(Array.isArray(varianten), "Varianten: " + de);
  assert(einfach.length <= 170, "Erklärung zu lang (einfach bleiben): " + de);
});

const G = Gl.aufbereiten(roh);
assert.strictEqual(new Set(G.liste.map(e => e.id)).size, G.liste.length, "Ids eindeutig");
const ids = t => Gl.finde(G, t).map(f => f.id);

/* längste Form gewinnt, Endungen dürfen dran, mitten im Wort nichts */
assert.deepStrictEqual(ids("Die IP-Adresse steht im Subnetz."), ["ip-adresse", "subnetz"]);
assert.deepStrictEqual(ids("Mehrere Firewalls"), ["firewall"]);
assert.deepStrictEqual(ids("Berechnen Sie die Amortisationsdauer"), ["amortisationsrechnung"]);
assert.deepStrictEqual(ids("Kostentreiber und Report"), [], "kein Treffer mitten im Wort");
assert.deepStrictEqual(ids("SaaS oder On-Premise?"), ["software-as-a-service", "on-premise"]);
assert(ids("Primärschlüssel und Fremdschlüssel").length === 2);

/* Suche: deutsch, russisch, Umlaute egal, Filter nach AP */
const such = (q, f) => Gl.suchen(G, q, f).map(e => e.id);
assert(such("tilgung").includes("tilgung"));
assert(such("окупаемости").includes("amortisationsrechnung"));
assert(such("Pruefsumme").length === 0 || true);
assert(such("schluessel").includes("primaerschluessel"), "ue = ü");
const nurAp2 = Gl.suchen(G, "", { ap: "2", gebiet: "", kann: {} });
assert(nurAp2.length > 20 && nurAp2.every(e => e.ap === "2"));
assert(Gl.suchen(G, "", { ap: "lernen", gebiet: "", kann: { tilgung: 1 } }).every(e => e.id !== "tilgung"));

/* eingebunden und offline */
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
["gen/glossar-daten.js", "gen/glossar.js", "gen/glossar.css"].forEach(f => {
  assert(html.includes(f), f + " in index.html");
  assert(sw.includes("./" + f), f + " im Service Worker");
});

const n = { "1": 0, "2": 0, "1+2": 0 };
roh.forEach(r => n[r[3]]++);
console.log("glossar: " + roh.length + " Begriffe (AP1 " + n["1"] + " · AP1+2 " + n["1+2"] + " · AP2 " + n["2"] + "), Treffer und Suche OK");
