/* ============================================================================
   gen/er-gen-daten.js — Wortmaterial für gewürfelte ER-Aufgaben
   ----------------------------------------------------------------------------
   Ein Generator, der Sätze aus Bausteinen zusammensetzt, schreibt schnell
   Deutsch, das kein Prüfer je geschrieben hätte: „Ein Kunde kann mehrere
   Werkstattauftrag haben." Deshalb steht hier zu jeder Beziehung ein
   FERTIGER Satz, in der Richtung, in der er gelesen wird — und zu jeder
   Entität die Beugung, die der Attributsatz braucht.

   Was gewürfelt wird, ist deshalb nicht der Satzbau, sondern die Auswahl:
   welcher Betrieb, welcher Ausschnitt aus seinem Datenmodell, welche
   Entität schon vorgegeben ist und welche Attribute vorkommen.

   Je Betrieb:
     ent  { schluessel: { nen, pl, dat, pk, attribute:[…] } }
     rel  [ { von, nach, name, kard, satz, attribute:[…], satzAttr } ]

     nen  Nominativ Singular            „Kunde"
     pl   Nominativ Plural              „Kunden"
     dat  Dativ mit „jedem/jeder"       „jedem Kunden"
     satz Beschreibung der Beziehung, fertig formuliert

   Die Kardinalität steht immer in der Richtung von → nach.
   ========================================================================== */
"use strict";

window.ER_GEN_DATEN = [

  /* ------------------------------------------------------------ Autohaus */
  {
    titel: "Autohaus Rieger",
    einstieg: "Das Autohaus Rieger führt Werkstattaufträge in einer eigenen Anwendung. " +
              "Das Datenmodell soll dokumentiert werden.",
    ent: {
      kunde:      { nen: "Kunde", pl: "Kunden", dat: "jedem Kunden", pk: "Kundennummer",
                    attribute: ["Name", "Adresse", "Telefonnummer"] },
      fahrzeug:   { nen: "Fahrzeug", pl: "Fahrzeuge", dat: "jedem Fahrzeug", pk: "Fahrgestellnummer",
                    attribute: ["Modell", "Baujahr", "Farbe"] },
      auftrag:    { nen: "Werkstattauftrag", pl: "Werkstattaufträge", dat: "jedem Werkstattauftrag",
                    pk: "Auftragsnummer", attribute: ["Auftragsdatum", "Beschreibung"] },
      mitarbeiter:{ nen: "Mitarbeiter", pl: "Mitarbeiter", dat: "jedem Mitarbeiter", pk: "Personalnummer",
                    attribute: ["Name", "Abteilung"] },
      ersatzteil: { nen: "Ersatzteil", pl: "Ersatzteile", dat: "jedem Ersatzteil", pk: "Teilenummer",
                    attribute: ["Bezeichnung", "Einzelpreis"] }
    },
    rel: [
      { von: "kunde", nach: "fahrzeug", name: "besitzt", kard: "1:n",
        satz: "Ein Kunde kann mehrere Fahrzeuge besitzen; jedes Fahrzeug gehört zu genau einem Kunden." },
      { von: "fahrzeug", nach: "auftrag", name: "hat", kard: "1:n",
        satz: "Zu einem Fahrzeug werden im Lauf der Zeit viele Werkstattaufträge angelegt; " +
              "jeder Auftrag betrifft genau ein Fahrzeug." },
      { von: "mitarbeiter", nach: "auftrag", name: "bearbeitet", kard: "1:n",
        satz: "Jeder Werkstattauftrag wird von genau einem Mitarbeiter bearbeitet; " +
              "ein Mitarbeiter bearbeitet viele Aufträge." },
      { von: "auftrag", nach: "ersatzteil", name: "verbraucht", kard: "n:m",
        satz: "In einem Werkstattauftrag werden mehrere Ersatzteile verbaut, und dasselbe " +
              "Ersatzteil wird in vielen Aufträgen verwendet.",
        attribute: ["Menge"],
        satzAttr: "Zu jeder Verwendung wird die eingebaute Menge festgehalten." }
    ]
  },

  /* ---------------------------------------------------------- Bibliothek */
  {
    titel: "Stadtbibliothek",
    einstieg: "Die Stadtbibliothek stellt ihre Ausleihe auf eine neue Software um. " +
              "Dafür wird das Datenmodell aufgenommen.",
    ent: {
      leser:    { nen: "Leser", pl: "Leser", dat: "jedem Leser", pk: "Lesernummer",
                  attribute: ["Name", "Adresse", "Geburtsdatum"] },
      buch:     { nen: "Buch", pl: "Bücher", dat: "jedem Buch", pk: "ISBN",
                  attribute: ["Titel", "Erscheinungsjahr"] },
      exemplar: { nen: "Exemplar", pl: "Exemplare", dat: "jedem Exemplar", pk: "Exemplarnummer",
                  attribute: ["Standort", "Zustand"] },
      verlag:   { nen: "Verlag", pl: "Verlage", dat: "jedem Verlag", pk: "Verlagsnummer",
                  attribute: ["Verlagsname", "Ort"] },
      autor:    { nen: "Autor", pl: "Autoren", dat: "jedem Autor", pk: "AutorID",
                  attribute: ["Name", "Geburtsjahr"] }
    },
    rel: [
      { von: "verlag", nach: "buch", name: "gibt heraus", kard: "1:n",
        satz: "Ein Verlag gibt viele Bücher heraus; jedes Buch erscheint in genau einem Verlag." },
      { von: "buch", nach: "exemplar", name: "liegt vor als", kard: "1:n",
        satz: "Von einem Buch stehen mehrere Exemplare im Regal; jedes Exemplar gehört zu " +
              "genau einem Buch." },
      { von: "leser", nach: "exemplar", name: "leiht aus", kard: "n:m",
        satz: "Ein Leser leiht im Lauf der Zeit viele Exemplare aus, und ein Exemplar wird " +
              "nacheinander an viele Leser ausgeliehen.",
        attribute: ["Ausleihdatum", "Rueckgabedatum"],
        satzAttr: "Zu jeder einzelnen Ausleihe werden das Ausleihdatum und das Rückgabedatum gespeichert." },
      { von: "autor", nach: "buch", name: "schreibt", kard: "n:m",
        satz: "Ein Autor schreibt mehrere Bücher, und ein Buch kann von mehreren Autoren " +
              "geschrieben sein." }
    ]
  },

  /* ---------------------------------------------------- Schulungszentrum */
  {
    titel: "Schulungszentrum Lindner",
    einstieg: "Das Schulungszentrum Lindner verwaltet Kurse und Buchungen. " +
              "Das Datenmodell soll dokumentiert werden.",
    ent: {
      teilnehmer: { nen: "Teilnehmer", pl: "Teilnehmer", dat: "jedem Teilnehmer", pk: "Teilnehmernummer",
                    attribute: ["Name", "E-Mail", "Firma"] },
      kurs:       { nen: "Kurs", pl: "Kurse", dat: "jedem Kurs", pk: "Kursnummer",
                    attribute: ["Kurstitel", "Dauer_Tage"] },
      termin:     { nen: "Kurstermin", pl: "Kurstermine", dat: "jedem Kurstermin", pk: "TerminID",
                    attribute: ["Startdatum", "Raum"] },
      dozent:     { nen: "Dozent", pl: "Dozenten", dat: "jedem Dozenten", pk: "Dozentennummer",
                    attribute: ["Name", "Fachgebiet"] }
    },
    rel: [
      { von: "kurs", nach: "termin", name: "findet statt als", kard: "1:n",
        satz: "Ein Kurs wird mehrmals im Jahr angeboten; jeder Kurstermin gehört zu genau " +
              "einem Kurs." },
      { von: "dozent", nach: "termin", name: "leitet", kard: "1:n",
        satz: "Jeder Kurstermin wird von genau einem Dozenten geleitet; ein Dozent leitet " +
              "viele Termine." },
      { von: "teilnehmer", nach: "termin", name: "bucht", kard: "n:m",
        satz: "Ein Teilnehmer bucht mehrere Kurstermine, und zu einem Kurstermin melden " +
              "sich viele Teilnehmer an.",
        attribute: ["Buchungsdatum", "Zahlungsstatus"],
        satzAttr: "Zu jeder Buchung werden das Buchungsdatum und der Zahlungsstatus erfasst." }
    ]
  },

  /* ---------------------------------------------------------- IT-Support */
  {
    titel: "IT-Dienstleister Nordwerk",
    einstieg: "Der IT-Dienstleister Nordwerk betreut die Rechner mehrerer Firmenkunden " +
              "und dokumentiert jede Störung in einem Ticketsystem.",
    ent: {
      kunde:      { nen: "Kunde", pl: "Kunden", dat: "jedem Kunden", pk: "Kundennummer",
                    attribute: ["Firmenname", "Ansprechpartner", "Ort"] },
      ticket:     { nen: "Ticket", pl: "Tickets", dat: "jedem Ticket", pk: "TicketID",
                    attribute: ["Eroeffnungsdatum", "Prioritaet", "Status"] },
      mitarbeiter:{ nen: "Mitarbeiter", pl: "Mitarbeiter", dat: "jedem Mitarbeiter", pk: "Personalnummer",
                    attribute: ["Name", "Team"] },
      geraet:     { nen: "Gerät", pl: "Geräte", dat: "jedem Gerät", pk: "Inventarnummer",
                    attribute: ["Bezeichnung", "Standort"] }
    },
    rel: [
      { von: "kunde", nach: "ticket", name: "meldet", kard: "1:n",
        satz: "Ein Kunde meldet viele Tickets; jedes Ticket gehört zu genau einem Kunden." },
      { von: "kunde", nach: "geraet", name: "nutzt", kard: "1:n",
        satz: "Jedes Gerät steht bei genau einem Kunden; ein Kunde nutzt viele Geräte." },
      { von: "geraet", nach: "ticket", name: "betrifft", kard: "1:n",
        satz: "Jedes Ticket betrifft genau ein Gerät; zu einem Gerät gibt es im Lauf der " +
              "Zeit viele Tickets." },
      { von: "mitarbeiter", nach: "ticket", name: "bearbeitet", kard: "n:m",
        satz: "An einem Ticket arbeiten nacheinander mehrere Mitarbeiter, und ein " +
              "Mitarbeiter bearbeitet viele Tickets.",
        attribute: ["Beginn", "Aufwand_Stunden"],
        satzAttr: "Für jeden Bearbeitungsschritt werden der Beginn und der Aufwand in Stunden erfasst." }
    ]
  },

  /* ------------------------------------------------------- Lager/Versand */
  {
    titel: "Großhandel Bergmann",
    einstieg: "Der Großhandel Bergmann bestellt Ware bei Lieferanten und lagert sie ein. " +
              "Das Datenmodell der Beschaffung soll dokumentiert werden.",
    ent: {
      lieferant:  { nen: "Lieferant", pl: "Lieferanten", dat: "jedem Lieferanten", pk: "Lieferantennummer",
                    attribute: ["Firmenname", "Ort"] },
      artikel:    { nen: "Artikel", pl: "Artikel", dat: "jedem Artikel", pk: "Artikelnummer",
                    attribute: ["Bezeichnung", "Einzelpreis", "Gewicht"] },
      bestellung: { nen: "Bestellung", pl: "Bestellungen", dat: "jeder Bestellung", pk: "Bestellnummer",
                    attribute: ["Bestelldatum"] },
      lagerplatz: { nen: "Lagerplatz", pl: "Lagerplätze", dat: "jedem Lagerplatz", pk: "Platznummer",
                    attribute: ["Regal", "Fach"] }
    },
    rel: [
      { von: "lieferant", nach: "bestellung", name: "erhält", kard: "1:n",
        satz: "Jede Bestellung geht an genau einen Lieferanten; ein Lieferant erhält im " +
              "Lauf des Jahres viele Bestellungen." },
      { von: "lagerplatz", nach: "artikel", name: "lagert", kard: "1:n",
        satz: "Jeder Artikel liegt auf genau einem Lagerplatz; auf einem Lagerplatz liegen " +
              "mehrere Artikel." },
      { von: "bestellung", nach: "artikel", name: "enthält", kard: "n:m",
        satz: "Eine Bestellung enthält mehrere Artikel, und ein Artikel wird in vielen " +
              "Bestellungen bestellt.",
        attribute: ["Menge"],
        satzAttr: "Zu jeder Bestellzeile wird die bestellte Menge gespeichert." }
    ]
  },

  /* ---------------------------------------------------------- Softwarehaus */
  {
    titel: "Softwarehaus Kestner",
    einstieg: "Das Softwarehaus Kestner plant seine Projekte künftig in einer eigenen " +
              "Anwendung statt in Tabellen. Das Datenmodell soll dokumentiert werden.",
    ent: {
      kunde:      { nen: "Kunde", pl: "Kunden", dat: "jedem Kunden", pk: "Kundennummer",
                    attribute: ["Firmenname", "Branche", "Ort"] },
      projekt:    { nen: "Projekt", pl: "Projekte", dat: "jedem Projekt", pk: "Projektnummer",
                    attribute: ["Projektname", "Startdatum", "Budget"] },
      vorgang:    { nen: "Vorgang", pl: "Vorgänge", dat: "jedem Vorgang", pk: "VorgangID",
                    attribute: ["Bezeichnung", "Dauer_Tage"] },
      mitarbeiter:{ nen: "Mitarbeiter", pl: "Mitarbeiter", dat: "jedem Mitarbeiter", pk: "Personalnummer",
                    attribute: ["Name", "Rolle", "Stundensatz"] }
    },
    rel: [
      { von: "kunde", nach: "projekt", name: "beauftragt", kard: "1:n",
        satz: "Ein Kunde beauftragt mehrere Projekte; jedes Projekt gehört zu genau einem Kunden." },
      { von: "projekt", nach: "vorgang", name: "besteht aus", kard: "1:n",
        satz: "Ein Projekt besteht aus mehreren Vorgängen; jeder Vorgang gehört zu genau " +
              "einem Projekt." },
      { von: "mitarbeiter", nach: "vorgang", name: "arbeitet an", kard: "n:m",
        satz: "An einem Vorgang arbeiten mehrere Mitarbeiter, und ein Mitarbeiter ist an " +
              "mehreren Vorgängen beteiligt.",
        attribute: ["Stunden"],
        satzAttr: "Für jede Mitarbeit werden die geleisteten Stunden erfasst." },
      { von: "mitarbeiter", nach: "projekt", name: "leitet", kard: "1:n",
        satz: "Jedes Projekt hat genau einen Projektleiter; ein Mitarbeiter kann mehrere " +
              "Projekte leiten." }
    ]
  },

  /* ----------------------------------------------------------------- Hotel */
  {
    titel: "Hotel Seeblick",
    einstieg: "Das Hotel Seeblick führt seine Buchungen bisher auf Papier und stellt " +
              "jetzt auf eine Datenbank um.",
    ent: {
      gast:       { nen: "Gast", pl: "Gäste", dat: "jedem Gast", pk: "Gastnummer",
                    attribute: ["Name", "Anschrift", "Telefonnummer"] },
      zimmer:     { nen: "Zimmer", pl: "Zimmer", dat: "jedem Zimmer", pk: "Zimmernummer",
                    attribute: ["Kategorie", "Betten", "Etage"] },
      buchung:    { nen: "Buchung", pl: "Buchungen", dat: "jeder Buchung", pk: "Buchungsnummer",
                    attribute: ["Anreise", "Abreise"] },
      leistung:   { nen: "Zusatzleistung", pl: "Zusatzleistungen", dat: "jeder Zusatzleistung",
                    pk: "Leistungsnummer", attribute: ["Bezeichnung", "Preis"] }
    },
    rel: [
      { von: "gast", nach: "buchung", name: "tätigt", kard: "1:n",
        satz: "Ein Gast kann mehrere Buchungen vornehmen; jede Buchung gehört zu genau " +
              "einem Gast." },
      { von: "zimmer", nach: "buchung", name: "wird belegt durch", kard: "1:n",
        satz: "Jede Buchung betrifft genau ein Zimmer; ein Zimmer wird im Lauf des Jahres " +
              "durch viele Buchungen belegt." },
      { von: "buchung", nach: "leistung", name: "umfasst", kard: "n:m",
        satz: "Zu einer Buchung können mehrere Zusatzleistungen gehören, und dieselbe " +
              "Zusatzleistung wird von vielen Buchungen genutzt.",
        attribute: ["Anzahl", "Datum"],
        satzAttr: "Zu jeder gebuchten Zusatzleistung werden die Anzahl und das Datum festgehalten." }
    ]
  },

  /* -------------------------------------------------------- Fitnessstudio */
  {
    titel: "Fitnessstudio Aktiv",
    einstieg: "Das Fitnessstudio Aktiv verwaltet Mitglieder, Verträge und Kurse " +
              "in einer eigenen Anwendung.",
    ent: {
      mitglied: { nen: "Mitglied", pl: "Mitglieder", dat: "jedem Mitglied", pk: "Mitgliedsnummer",
                  attribute: ["Name", "Geburtsdatum", "Telefonnummer"] },
      vertrag:  { nen: "Vertrag", pl: "Verträge", dat: "jedem Vertrag", pk: "Vertragsnummer",
                  attribute: ["Beginn", "Laufzeit_Monate", "Monatsbeitrag"] },
      kurs:     { nen: "Kurs", pl: "Kurse", dat: "jedem Kurs", pk: "Kursnummer",
                  attribute: ["Kursname", "Wochentag", "Uhrzeit"] },
      trainer:  { nen: "Trainer", pl: "Trainer", dat: "jedem Trainer", pk: "Trainernummer",
                  attribute: ["Name", "Qualifikation"] }
    },
    rel: [
      { von: "mitglied", nach: "vertrag", name: "schließt", kard: "1:n",
        satz: "Ein Mitglied kann nacheinander mehrere Verträge abschließen; jeder Vertrag " +
              "gehört zu genau einem Mitglied." },
      { von: "trainer", nach: "kurs", name: "leitet", kard: "1:n",
        satz: "Jeder Kurs wird von genau einem Trainer geleitet; ein Trainer leitet mehrere Kurse." },
      { von: "mitglied", nach: "kurs", name: "nimmt teil an", kard: "n:m",
        satz: "Ein Mitglied nimmt an mehreren Kursen teil, und an einem Kurs nehmen viele " +
              "Mitglieder teil.",
        attribute: ["Anmeldedatum"],
        satzAttr: "Zu jeder Anmeldung wird das Anmeldedatum gespeichert." }
    ]
  }
];
