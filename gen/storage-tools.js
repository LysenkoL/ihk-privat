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
    const oldKeys = appKeys(storage, prefix);
    const before = {};
    oldKeys.forEach(key => { before[key] = storage.getItem(key); });
    const entries = Object.keys(incoming || {})
      .filter(key => key.indexOf(prefix) === 0 && typeof incoming[key] === "string")
      .map(key => [key, incoming[key]]);

    try {
      oldKeys.forEach(key => storage.removeItem(key));
      entries.forEach(([key, value]) => storage.setItem(key, value));
    } catch (error) {
      /* localStorage kennt keine Transaktionen. Ein In-Memory-Snapshot hält
         „alles ersetzen“ trotzdem verlustfrei, falls eine einzelne
         setItem-Operation (z. B. wegen QuotaExceeded) scheitert. */
      appKeys(storage, prefix).forEach(key => storage.removeItem(key));
      try {
        Object.keys(before).forEach(key => storage.setItem(key, before[key]));
      } catch (rollbackError) {
        try { error.rollbackError = rollbackError; } catch (ignore) { }
      }
      throw error;
    }
    return entries.length;
  }

  function mergeUniqueBy(local, incoming, key) {
    const items = Array.isArray(local) ? local.slice() : [];
    const token = value => {
      if (!value || typeof value !== "object") return "value:" + JSON.stringify(value);
      const id = value[key];
      return id != null && String(id) !== ""
        ? "id:" + String(id)
        : "value:" + JSON.stringify(value);
    };
    const seen = new Set(items.map(token));
    let added = 0;
    (Array.isArray(incoming) ? incoming : []).forEach(value => {
      const id = token(value);
      if (seen.has(id)) return;
      seen.add(id);
      items.push(value);
      added++;
    });
    return { items, added };
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
    API_VERSION: 2,
    appKeys,
    replaceAppStorage,
    mergeUniqueBy,
    backupFingerprint,
    hasImported,
    markImported,
    HISTORY_KEY
  };
});
