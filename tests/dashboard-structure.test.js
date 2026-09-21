"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const start = fs.readFileSync(path.join(root, "gen", "start.js"), "utf8");

assert(/gen\/dashboard-modern\.css/.test(html), "современный слой стилей должен быть подключён");
assert(/dashboard-stats/.test(start), "дашборд должен создавать группу компактных показателей");
assert(/setAttribute\("role",\s*"list"\)/.test(start), "группа быстрых действий должна быть списком");
assert(/st-kachel-wrap/.test(start), "каждое быстрое действие должно иметь семантический listitem");
assert(/aria-labelledby/.test(start), "блок рекомендации должен иметь доступное название");

console.log("dashboard-structure: semantic dashboard shell OK");
