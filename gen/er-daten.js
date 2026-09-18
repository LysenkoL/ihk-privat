/* ============================================================================
   gen/er-daten.js — die fünf ER-Aufgaben der echten Prüfungen, strukturiert
   ----------------------------------------------------------------------------
   Das ER-Modell ist nach Netzplan und Pseudocode die dritthäufigste Zeichnung
   in den zehn Prüfungen — fünf Teilaufgaben, 33 BE, in jeder zweiten Prüfung
   eine. Anders als Netzplan und Pseudocode hatte es bisher keine eigene
   Prüfung: die Musterlösung steht als Fließtext da, und die Bewertung lief
   über den Wortabgleich.

   Hier stehen dieselben Lösungen als Struktur. Damit lässt sich sagen, WAS
   fehlt — „Primärschlüssel bei LKW nicht gekennzeichnet“ statt „6 von 8
   Begriffen gefunden“ — und die Punkte fallen nach demselben Schlüssel wie
   im Korrekturbogen der IHK.

   Aufbau je Aufgabe:
     entitaeten  [{ name, pk, attribute:[…], gegeben?, alias?:[…] }]
     beziehungen [{ von, nach, name, kard:"1:n"|"n:m"|"1:1",
                    attribute:[…], gegeben? }]
     punkte      [{ was, be }]  — wofür es wie viele BE gibt
     hinweis     Satz aus dem Korrekturbogen
     unsicher    true, wenn die Vorlage aus dem PDF nicht eindeutig war

   „gegeben“ markiert, was die Aufgabe schon vorgibt: dafür gibt es keine
   Punkte, und es wird beim Start eingetragen, damit man nicht abtippt, was
   schon dasteht.
   ========================================================================== */
"use strict";

window.ER_LOESUNGEN = {

  /* ---------------------------------------------- Frühjahr 2026, 4 c) --- */
  "ap1-2026-f:4c": {
    titel: "Artikel und LKW",
    entitaeten: [
      { name: "Artikel", pk: "AID", attribute: ["Artikelname", "Einzelgewicht"],
        alias: ["Artikelnummer"] },
      { name: "LKW", pk: "LID", attribute: ["LKW-Kennzeichen", "LKW-Typ"],
        alias: ["Fahrzeug", "Fahrzeugnummer"] }
    ],
    beziehungen: [
      { von: "Artikel", nach: "LKW", name: "verladen", kard: "n:m",
        attribute: ["Verladezeit", "Menge pro Artikel"] }
    ],
    punkte: [
      { was: "Beziehung gezeichnet und benannt", be: 2 },
      { was: "Kardinalität n:m", be: 1 },
      { was: "Primärschlüssel je Entität", be: 2 },
      { was: "übrige Attribute richtig zugeordnet", be: 3 }
    ],
    hinweis: "Die Attribute Verladezeit und Menge gehören an die Beziehung, nicht " +
             "an eine der beiden Entitäten — sie entstehen erst durch das Verladen."
  },

  /* ------------------------------------------------- Herbst 2025, 4 b) --- */
  "ap1-2025-h:4b": {
    titel: "Apotheke Curatia — Wirkstoffe, Medikamente, Lieferanten",
    entitaeten: [
      { name: "Medikament", pk: "PZN", attribute: ["NameM", "Lagerbestand", "Preis", "Datum"],
        gegeben: true, alias: ["Medikamente"] },
      { name: "Wirkstoff", pk: "WID", attribute: ["NameW"], alias: ["Wirkstoffe"] },
      { name: "Lieferant", pk: "LID", attribute: ["NameL", "IBAN"], alias: ["Lieferanten"] }
    ],
    beziehungen: [
      { von: "Medikament", nach: "Wirkstoff", name: "besteht aus", kard: "n:m",
        attribute: ["Dosierung", "Dosierungseinheit"] },
      { von: "Lieferant", nach: "Medikament", name: "liefert", kard: "1:n" }
    ],
    punkte: [
      { was: "zwei Entitäten ergänzt", be: 2 },
      { was: "zwei Kardinalitäten", be: 2 },
      { was: "Primärschlüssel in allen drei Tabellen", be: 1 },
      { was: "Attribute sinnvoll zugeordnet", be: 2 },
      { was: "Dosierung an der n:m-Beziehung", be: 1 }
    ],
    hinweis: "CHEN-Notation. Ein Medikament kommt von genau einem Lieferanten, " +
             "ein Lieferant liefert viele — also 1:n. Wirkstoff und Medikament sind " +
             "n:m, und die Dosierung gehört in die Zwischentabelle. " +
             "Die Auflösung der n:m-Beziehung in eine eigene Entität ist auch richtig."
  },

  /* ------------------------------------------------- Herbst 2024, 4 b) --- */
  "ap1-2024-h:4b": {
    titel: "Auftrag und Mitarbeiter",
    entitaeten: [
      { name: "Mitarbeiter", pk: "Mitarbeiter-ID", attribute: ["Mitarbeiter_Name", "Vorname"],
        gegeben: true, alias: ["Mitarbeiter_ID", "MID"] },
      { name: "Auftrag", pk: "Auftrag-ID", attribute: ["Beginn", "Ende"],
        alias: ["Auftrags-ID", "AID", "Auftragsnummer"] }
    ],
    beziehungen: [
      { von: "Mitarbeiter", nach: "Auftrag", name: "bearbeitet", kard: "1:n" }
    ],
    punkte: [
      { was: "Entität Auftrag mit Primärschlüssel", be: 2 },
      { was: "Kardinalität 1:n", be: 1 },
      { was: "Vorname beim Mitarbeiter ergänzt", be: 1 },
      { was: "Beginn und Ende beim Auftrag", be: 2 }
    ],
    hinweis: "Redundanzfrei heißt: Beginn und Ende gehören zum Auftrag, nicht zum " +
             "Mitarbeiter — sonst stünden sie bei jedem Auftrag desselben " +
             "Mitarbeiters noch einmal."
  },

  /* ------------------------------------------------ Herbst 2023, 4 ca) --- */
  "ap1-2023-h:4ca": {
    titel: "Tickets und Tätigkeiten",
    unsicher: true,
    entitaeten: [
      { name: "Kunde", pk: "KundenID", attribute: [], gegeben: true },
      { name: "Mitarbeiter", pk: "MitarbeiterID", attribute: [], gegeben: true },
      { name: "Ticket", pk: "TicketID", attribute: [], gegeben: true },
      { name: "Taetigkeiten", pk: "TaetigkeitID", attribute: ["Beschreibung", "Dauer"],
        alias: ["Tätigkeiten", "Taetigkeit", "Tätigkeit"] }
    ],
    beziehungen: [
      { von: "Ticket", nach: "Taetigkeiten", name: "führt zu", kard: "1:n" },
      { von: "Mitarbeiter", nach: "Taetigkeiten", name: "führt aus", kard: "1:n" }
    ],
    punkte: [
      { was: "zwei Beziehungen mit Kardinalitäten", be: 2 },
      { was: "Attribute der Tätigkeiten", be: 3 }
    ],
    hinweis: "Die Vorlage im PDF gibt die Attributnamen nicht vor — gewertet wird, " +
             "ob ein Primärschlüssel und sinnvolle Attribute da sind. " +
             "Ein Blick auf die Lösungsseite lohnt sich hier besonders."
  },

  /* ------------------------------------------------- Herbst 2022, 4 c) --- */
  "ap1-2022-h:4c": {
    titel: "Walzanlagen und Produktionsdaten",
    entitaeten: [
      { name: "Walzanlage", pk: "WID", attribute: ["Spezifikation", "Bezeichnung", "Baujahr"],
        gegeben: true, alias: ["Maschinennummer", "Walzanlagen"] },
      { name: "Produktionsdaten", pk: "OrderID", attribute: ["Breite", "Länge", "Dicke", "Anzahl", "Zeitstempel"],
        gegeben: true, alias: ["Produktionsdatum", "Produktion"] }
    ],
    beziehungen: [
      { von: "Walzanlage", nach: "Produktionsdaten", name: "produziert", kard: "1:n",
        alias: ["liefern", "liefert", "stellt her"] }
    ],
    punkte: [
      { was: "Kardinalität 1:n", be: 1 },
      { was: "Primärschlüssel in beiden Tabellen", be: 2 },
      { was: "Attribute richtig zugeordnet", be: 3 }
    ],
    hinweis: "Die Fremdschlüssel müssen laut Aufgabenstellung nicht eingetragen " +
             "werden. Die Spezifikation (mögliche Dicken) gehört zur Walzanlage, " +
             "die tatsächlich produzierte Dicke zu den Produktionsdaten."
  }
};
