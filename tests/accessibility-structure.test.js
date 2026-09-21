"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const auth = fs.readFileSync(path.join(root, "gen", "auth.js"), "utf8");

const start = html.match(/<div class="seite" id="scStart">([\s\S]*?)<!-- ===================== BOGEN/);
assert(start, "Startseite muss gefunden werden");
assert(/<h1\b[^>]*>[^<]+<\/h1>/.test(start[1]), "Startseite braucht ein sichtbares h1");

for (const id of ["drillAnzahl", "drillOrder", "netzAnzahl", "kkTyp", "sucheFeld", "importDatei", "modellWahl"]) {
  const label = new RegExp("<label[^>]+for=[\"']" + id + "[\"']", "i");
  const control = new RegExp("<(?:input|select)[^>]+id=[\"']" + id + "[\"'][^>]+aria-label=", "i");
  assert(label.test(html) || control.test(html), id + " braucht einen zugänglichen Namen");
}

assert(/setAttribute\("role",\s*"dialog"\)/.test(auth), "PIN-Sperre braucht role=dialog");
assert(/setAttribute\("aria-modal",\s*"true"\)/.test(auth), "PIN-Sperre braucht aria-modal");
assert(/aria-live="assertive"/.test(auth), "PIN-Fehler muss angekündigt werden");
assert(/h \? h === PIN_HASH : pin === "2026"/.test(auth), "PIN braucht einen Fallback ohne Web Crypto");

console.log("accessibility-structure: headings, labels and dialog semantics OK");
