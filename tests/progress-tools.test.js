"use strict";

const assert = require("assert");
const tools = require("../gen/progress-tools.js");

assert.deepEqual(tools.summary(8, 10, 100, 2, 20), {
  points: 8,
  allMax: 100,
  gradedCount: 2,
  allCount: 20,
  gradedRate: 80,
  examRate: 8,
  complete: false
});

const topics = tools.distributeByTopics([
  { k: "a", maxPoints: 6, topics: ["netzwerk", "sicherheit"] },
  { k: "b", maxPoints: 4, topics: ["netzwerk"] }
], { a: 4, b: 2 });

assert.deepEqual(topics, {
  netzwerk: { got: 4, max: 7 },
  sicherheit: { got: 2, max: 3 }
});

console.log("progress-tools: rates and topic distribution OK");
