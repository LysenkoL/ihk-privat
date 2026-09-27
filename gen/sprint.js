/* ============================================================================
   gen/sprint.js — Rechen-Sprint: Rechnungen aus den wahrscheinlichsten Themen
   ----------------------------------------------------------------------------
   Rechenaufgaben sind die sichersten Punkte: eindeutig richtig oder falsch,
   Teilpunkte für den Rechenweg. Laut Themen-Radar sind IP-Adressen und
   Kosten „sehr wahrscheinlich“, Speicher, Nutzwertanalyse „wahrscheinlich“,
   Übertragung, Strom und Leasing „gut möglich“.

   Ein Knopf: fünf Aufgaben, eine je Bereich, jedes Mal mit neuen Zahlen —
   aus jedem Bereich die Vorlage, in der du bisher am schwächsten warst
   (noch nie gerechnet zählt wie 50 %). Die Uhr läuft mit Prüfungstempo
   (0,9 Minuten je BE), die Lösungen bleiben offen, alles wird geprüft.
   „Mini“: drei Aufgaben — IP, Kosten und ein Bereich per Zufall.
   ========================================================================== */
"use strict";

(function (root) {
  const SLOTS = [
    { key: "ip", name: "IP-Adressen & Subnetting", kurz: "IP",
      ids: ["netz-subnetz", "netz-subnetting", "netz-ipv6", "tab-ipkonfig", "netz-dhcp", "netz-linklocal"] },
    { key: "kosten", name: "Kosten", kurz: "Kosten",
      ids: ["kalk-monatskosten", "kalk-tco", "kalk-lebenszyklus", "kalk-bezugspreis", "eh-rabatt", "kalk-lizenzstaffel", "kalk-angebotspreis"] },
    { key: "speicher", name: "Speicher & Übertragung", kurz: "Speicher",
      ids: ["daten-speicherbedarf", "daten-video", "netz-bandbreite", "hw-usb", "daten-backup"] },
    { key: "entscheiden", name: "Nutzwert, Leasing, Angebote", kurz: "Nutzwert/Leasing",
      ids: ["kalk-nutzwertanalyse", "kalk-leasing", "kalk-angebotsvergleich"] },
    { key: "strom", name: "Strom & Leistung", kurz: "Strom",
      ids: ["kalk-stromkosten", "eh-energie", "hw-leistung", "eh-usv", "netz-poe", "kalk-amortisation-energie", "eh-ohm"] }
  ];

  const lies = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };

  /** bisherige Quote einer Vorlage (0…1), nie gerechnet = 0,5 */
  function quote(id, stat) {
    const s = stat && stat[id];
    return s && s.max ? s.punkte / s.max : 0.5;
  }

  /**
   * Aufgaben wählen — reine Funktion (tests/sprint.test.js).
   * @param stat    ihk2:gen:stat
   * @param zufall  () => 0…1
   * @param anzahl  5 = alle Bereiche, 3 = Mini
   * @returns [{vorlageId, saat, bereich}]
   */
  function waehle(stat, zufall, anzahl) {
    zufall = zufall || Math.random;
    const G = root.GEN;
    let slots = SLOTS;
    if ((anzahl || 5) < 5) {
      const rest = SLOTS.slice(2);
      slots = [SLOTS[0], SLOTS[1], rest[Math.floor(zufall() * rest.length) % rest.length]];
    }
    return slots.map(sl => {
      const ids = sl.ids.filter(id => !G || !G.vorlageVon || G.vorlageVon(id));
      if (!ids.length) return null;
      /* schwächste zuerst, etwas Zufall, damit es nicht jedes Mal dieselbe ist */
      const best = ids.map(id => ({ id, w: quote(id, stat) + zufall() * 0.3 })).sort((a, b) => a.w - b.w)[0];
      return { vorlageId: best.id, saat: Math.floor(zufall() * 4294967295) >>> 0, bereich: sl.name, kurz: sl.kurz || sl.name };
    }).filter(Boolean);
  }

  function starten(anzahl) {
    const U = root.GENUI;
    if (!U || !U.erzeugeBlatt) return;
    const liste = waehle(lies("ihk2:gen:stat", {}), null, anzahl || 5);
    U.erzeugeBlatt({
      liste: liste.map(x => ({ vorlageId: x.vorlageId, saat: x.saat })),
      titel: (liste.length < 5 ? "Mini-Rechen-Sprint" : "Rechen-Sprint") + " · " + liste.map(x => x.kurz).join(", "),
      zeit: 2
    });
  }

  const api = { SLOTS, waehle, starten, quote };
  root.GENSPRINT = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
