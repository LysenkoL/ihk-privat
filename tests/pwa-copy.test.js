"use strict";

const assert = require("node:assert/strict");
const copy = require("../gen/pwa-copy.js");

const android = copy.installDescription(false);
const ios = copy.installDescription(true);

for (const text of [android, ios]) {
  assert.match(text, /App-Oberfläche/);
  assert.match(text, /bereits geladene Inhalte/);
  assert.match(text, /offline laden/);
  assert.doesNotMatch(text, /alle zehn Prüfungen.*offline/i);
}

assert.match(ios, /Safari/);
assert.doesNotMatch(android, /Safari/);
assert.match(copy.iosStorageNote(), /eigenen Speicher/);

console.log("pwa-copy: precise offline promise OK");
