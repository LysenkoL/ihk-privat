"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

assert.match(html, /IHKStorageTools\.API_VERSION !== 2/);
assert.match(html, /typeof IHKStorageTools\.mergeUniqueBy !== "function"/);
assert.match(html, /typeof IHKStorageTools\.replaceAppStorage !== "function"/);
assert.match(html, /window\.__ihkImport = "abbruch"/);

console.log("import-integration: mixed PWA versions are blocked safely");
