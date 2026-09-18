/* ============================================================================
   gen/gantt-daten.js — die Gantt-Aufgabe der echten Prüfungen, strukturiert
   ----------------------------------------------------------------------------
   Herbst 2023, Aufgabe 4 b) ist eine Dreiergruppe über 8 BE:
     4 ba)  das Gantt-Diagramm aus der Beschreibung zeichnen   6 BE
     4 bb)  frühestes Projektende ermitteln                    1 BE
     4 bc)  Vorgang mit dem größten Puffer nennen              1 BE

   Alle drei hängen an derselben Vorgangsliste. Steht die einmal richtig da,
   rechnet sich der Rest von selbst — genau das soll der Trainer zeigen.

   ACHTUNG, eine Unstimmigkeit: Aus der Beschreibung im Aufgabentext folgt
   der kritische Pfad A → B → C → F → G mit 18 Tagen (das deckt sich mit der
   Musterlösung zu 4 bb). Der größte Puffer liegt danach bei E mit 5 Tagen,
   die Musterlösung zu 4 bc nennt aber C. C liegt auf dem kritischen Pfad und
   hat Puffer 0 — das kann beides nicht gleichzeitig stimmen. Vermutlich ist
   beim Auslesen des PDF eine Abhängigkeit verloren gegangen. Deshalb steht
   unten `pufferUnsicher: true`: der Trainer rechnet sauber, sagt aber dazu,
   dass die Musterlösung hier abweicht und man auf die Lösungsseite sehen
   sollte.
   ========================================================================== */
"use strict";

window.GANTT_LOESUNGEN = {

  "ap1-2023-h:4ba": {
    titel: "Projektplanung mit sieben Vorgängen",
    /* vor: Vorgänger. Die Prüfung vergleicht Dauer und Vorgänger. */
    vorgaenge: [
      { id: "A", dauer: 3, vor: [] },
      { id: "B", dauer: 6, vor: ["A"] },
      { id: "D", dauer: 8, vor: ["A"] },
      { id: "E", dauer: 5, vor: ["A"] },
      { id: "C", dauer: 4, vor: ["B"] },
      { id: "F", dauer: 3, vor: ["C", "D", "E"] },
      { id: "G", dauer: 2, vor: ["F"] }
    ],
    punkte: [
      { was: "alle sieben Vorgänge mit ihrer Dauer", be: 3 },
      { was: "Abhängigkeiten richtig eingezeichnet", be: 3 }
    ],
    pufferUnsicher: true,
    hinweis: "Im Gantt-Diagramm steht die Zeit waagerecht: jeder Vorgang ein Balken, " +
             "Länge = Dauer, Beginn = frühester Anfang. Die Abhängigkeiten werden als " +
             "Pfeile vom Ende des Vorgängers zum Anfang des Nachfolgers gezeichnet. " +
             "Anders als im Netzplan sieht man die Dauer sofort, die Puffer dagegen " +
             "erst, wenn man sie ausrechnet."
  }
};
