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

/* v29: Gruppen, Symbole, feste Reihenfolge, Suchfeld, Endspurt als „Heute“ */
const css = fs.readFileSync(path.join(root, "gen", "startseite.css"), "utf8");
const endspurt = fs.readFileSync(path.join(root, "gen", "endspurt.js"), "utf8");
assert(/gen\/startseite\.css/.test(html) && /gen\/finder\.js/.test(html) && /gen\/ikonen\.js/.test(html),
  "стиль стартовой страницы, поиск и иконки должны быть подключены");
assert(html.indexOf("gen/ikonen.js") < html.indexOf("gen/start.js"), "иконки грузятся раньше start.js");
for (const g of ["pruefen", "ueben", "nachschlagen", "auswerten", "daten"])
  assert(new RegExp('key: "' + g + '"').test(start), "группа " + g + " должна быть описана");
for (const k of ["rechnen", "er", "plan"])
  assert(new RegExp('key: "' + k + '",[^}]*gruppe:').test(start), "блок " + k + " должен входить в группу");
assert(/function ordnen\(/.test(start) && /MutationObserver/.test(start), "порядок блоков должен восстанавливаться после чужих вставок");
assert(/GENENDSPURT/.test(start) && /E\.erledigt\(/.test(start), "«Heute» должен брать задачу из Endspurt");
assert(/erledigt, abhaken/.test(endspurt), "Endspurt должен отдавать erledigt/abhaken");
assert(!/^[^#\n]*\bbody\s*\{/m.test(css) && !/^\s*\.btn\s*\{/m.test(css), "новый стиль не должен менять глобальные body/.btn");

console.log("dashboard-structure: compact layout with groups, search and one Heute OK");
