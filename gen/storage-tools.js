/* ============================================================================
   Reine Hilfsfunktionen für Export und Import.
   Das Modul läuft im Browser und direkt unter Node für Regressionstests.
   ========================================================================== */
"use strict";

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.IHKStorageTools = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function appKeys(storage, prefix) {
    const result = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.indexOf(prefix) === 0) result.push(key);
    }
    return result;
  }

  function replaceAppStorage(storage, incoming, prefix) {
    appKeys(storage, prefix).forEach(key => storage.removeItem(key));
    Object.keys(incoming || {}).forEach(key => {
      if (key.indexOf(prefix) !== 0 || typeof incoming[key] !== "string") return;
      storage.setItem(key, incoming[key]);
    });
  }

  function backupFingerprint(data) {
    if (data && typeof data.backupId === "string" && data.backupId) {
      return "id:" + data.backupId;
    }
    const text = JSON.stringify(data || {});
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return "fnv1a:" + (hash >>> 0).toString(16).padStart(8, "0");
  }

  const HISTORY_KEY = "ihk2:import-history";

  function importHistory(storage) {
    try {
      const parsed = JSON.parse(storage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter(x => typeof x === "string") : [];
    } catch (e) {
      return [];
    }
  }

  function hasImported(storage, fingerprint) {
    return importHistory(storage).indexOf(fingerprint) >= 0;
  }

  function markImported(storage, fingerprint) {
    const history = importHistory(storage).filter(x => x !== fingerprint);
    history.push(fingerprint);
    storage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-100)));
  }

  return {
    appKeys,
    replaceAppStorage,
    backupFingerprint,
    hasImported,
    markImported,
    HISTORY_KEY
  };
});
