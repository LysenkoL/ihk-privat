"use strict";

const assert = require("assert");
const tools = require("../gen/storage-tools.js");

function fakeStorage(start) {
  const data = new Map(Object.entries(start || {}));
  return {
    get length() { return data.size; },
    key(index) { return Array.from(data.keys())[index] ?? null; },
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(String(key), String(value)); },
    removeItem(key) { data.delete(String(key)); },
    snapshot() { return Object.fromEntries(data); }
  };
}

{
  const storage = fakeStorage({
    "ihk2:answers": "old",
    "ihk2:orphan": "stale",
    "other:key": "keep"
  });

  tools.replaceAppStorage(storage, { "ihk2:answers": "new" }, "ihk2:");

  assert.equal(storage.getItem("ihk2:answers"), "new");
  assert.equal(storage.getItem("ihk2:orphan"), null);
  assert.equal(storage.getItem("other:key"), "keep");
}

{
  const storage = fakeStorage();
  const backup = {
    typ: "ihk-ap1-fortschritt",
    version: 3,
    exportiert: "2026-09-21T08:00:00.000Z",
    speicher: { "ihk2:answers": "{\"a\":\"x\"}" }
  };
  const first = tools.backupFingerprint(backup);
  const same = tools.backupFingerprint(JSON.parse(JSON.stringify(backup)));
  const changed = tools.backupFingerprint({
    ...backup,
    speicher: { "ihk2:answers": "{\"a\":\"y\"}" }
  });

  assert.equal(first, same);
  assert.notEqual(first, changed);
  assert.equal(tools.hasImported(storage, first), false);
  tools.markImported(storage, first);
  assert.equal(tools.hasImported(storage, first), true);
  tools.markImported(storage, first);
  assert.deepEqual(JSON.parse(storage.getItem("ihk2:import-history")), [first]);
}

console.log("storage-tools: replacement and import idempotency OK");
