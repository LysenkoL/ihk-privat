/* Präzise, testbare Hinweise zum Offline-Umfang der installierten App. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.IHKPwaCopy = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const OFFLINE =
    "Die <b>App-Oberfläche</b>, die Generatoren und <b>bereits geladene Inhalte</b> " +
    "funktionieren danach offline. Für alle Bilder einer ganzen Prüfung nutze vorher " +
    "auf ihrer Karte <b>„offline laden“</b>.";

  function installDescription(ios) {
    const start = ios
      ? "In <b>Safari</b> unten auf <b>Teilen</b> tippen und <b>„Zum Home-Bildschirm“</b> wählen. "
      : "Einmal installieren, dann startet der Simulator wie eine App — ohne Adressleiste. ";
    return start + OFFLINE;
  }

  function iosStorageNote() {
    return "Wichtig: die App auf dem Home-Bildschirm hat auf dem iPhone einen eigenen Speicher. " +
      "Dein Stand aus Safari kommt nicht automatisch mit — nimm ihn über „Fortschritt exportieren“ " +
      "als Datei mit und importiere ihn dort einmal.";
  }

  return { installDescription, iosStorageNote };
});
