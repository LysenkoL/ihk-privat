"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const start = fs.readFileSync(path.join(root, "gen", "start.js"), "utf8");

assert(!/gen\/dashboard-modern\.css/.test(html), "неудачный глобальный слой дашборда должен быть удалён");
assert(!/start-intro/.test(html), "лишний заголовок Lerncockpit не должен занимать место");
assert(!/dashboard-stats/.test(start), "лишняя группа показателей должна быть удалена");
assert(!/st-kachel-wrap/.test(start), "быстрые действия должны снова быть прямыми элементами сетки");
assert(/s\.insertBefore\(k,\s*s\.firstChild\)/.test(start), "исходный дашборд должен стоять первым");
assert(/g\.appendChild\(t\)/.test(start), "исходные быстрые действия должны рендериться напрямую");

console.log("dashboard-structure: proven compact layout restored");
