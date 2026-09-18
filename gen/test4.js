/* ============================================================================
   gen/test4.js — sind alle Aufgaben überhaupt LESBAR?
   ----------------------------------------------------------------------------
   test.js prüft die Struktur, test2.js die Musterlösungen, test3.js dass
   Unsinn nichts bringt. Keiner davon hätte gemerkt, was Lena auf dem Handy
   sofort gesehen hat: bei „Betriebssystem härten“ stand in der Spalte
   „Aussage“ nichts. Die Vorlagen schreiben die Aussage als `t`, der
   Arbeitsblatt-Aufbau las `text` — geprüft wurde aber nur `wahr`, und das
   war da. Sechs leere Zeilen mit richtig/falsch, und die Aufgabe war nicht
   lösbar.

   Dieser Test schaut deshalb auf das, was am Ende auf dem Bildschirm steht:
   jede Aussage, jedes Paar, jede Auswahlmöglichkeit, jede Tabellenzelle und
   jedes Feldetikett muss sichtbaren Text haben.
   ========================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const HIER = __dirname;
const DATEIEN = [
  "kern.js", "vorlagen-kalkulation.js", "vorlagen-netz.js", "vorlagen-text.js",
  "vorlagen-katalog.js", "vorlagen-diagramm.js", "vorlagen-modelle.js",
  "vorlagen-problemfaelle.js", "vorlagen-tabellen.js", "vorlagen-sicherheit.js",
  "vorlagen-hardware.js", "vorlagen-fachthemen.js", "vorlagen-ki.js",
  "vorlagen-einheiten.js"
];

const fenster = { window: null, console, localStorage: null, document: undefined };
fenster.window = fenster;
vm.createContext(fenster);
DATEIEN.forEach(d => {
  const p = path.join(HIER, d);
  if (!fs.existsSync(p)) return;
  vm.runInContext(fs.readFileSync(p, "utf8"), fenster, { filename: d });
});

const GEN = fenster.window.GEN;
if (!GEN) { console.error("GEN nicht geladen"); process.exit(1); }

const leer = x => x == null || String(x).trim() === "";
const SAATEN = [1, 2, 3, 7, 11, 23, 42, 99, 1234, 8888];

let fehler = 0, geprueft = 0, felder = 0;

function meldung(v, saat, was) {
  fehler++;
  if (fehler <= 40) console.log("  " + v + " (Saat " + saat + "): " + was);
}

GEN.alleVorlagen().forEach(v => {
  SAATEN.forEach(saat => {
    let a;
    try { a = GEN.erzeuge(v.id, saat); }
    catch (e) { return meldung(v.id, saat, "erzeuge() wirft: " + e.message); }
    geprueft++;

    if (leer(a.prompt)) meldung(v.id, saat, "prompt ist leer");
    if (leer(a.titel)) meldung(v.id, saat, "titel ist leer");

    (a.felder || []).forEach((f, nr) => {
      felder++;
      const wo = "Feld " + nr + " (" + f.typ + ")";
      if (leer(f.label) && f.typ !== "rechenweg") meldung(v.id, saat, wo + ": label leer");

      if (f.typ === "aussagen") {
        if (!(f.aussagen || []).length) return meldung(v.id, saat, wo + ": keine Aussagen");
        f.aussagen.forEach((x, i) => {
          if (leer(x.text)) meldung(v.id, saat, wo + ": Aussage " + i + " ohne Text");
          if (x.wahr !== true && x.wahr !== false) meldung(v.id, saat, wo + ": Aussage " + i + " ohne wahr/falsch");
        });
      }
      if (f.typ === "zuordnung") {
        if (!(f.paare || []).length) return meldung(v.id, saat, wo + ": keine Paare");
        /* Paare sind Arrays [links, rechts]; die Auswahl kommt aus f.optionen */
        f.paare.forEach((x, i) => {
          const l = Array.isArray(x) ? x[0] : (x.links || x.a);
          const r = Array.isArray(x) ? x[1] : (x.rechts || x.b);
          if (leer(l)) meldung(v.id, saat, wo + ": Paar " + i + " ohne linke Seite");
          if (leer(r)) meldung(v.id, saat, wo + ": Paar " + i + " ohne rechte Seite");
          if ((f.optionen || []).length && (f.optionen || []).indexOf(r) < 0)
            meldung(v.id, saat, wo + ": Paar " + i + " — richtige Antwort steht nicht zur Auswahl");
        });
      }
      if (f.typ === "auswahl" || f.typ === "mehrfachwahl") {
        const o = f.optionen || f.moeglich || [];
        if (!o.length) return meldung(v.id, saat, wo + ": keine Optionen");
        o.forEach((x, i) => {
          const t = typeof x === "string" ? x : (x.text || x.t);
          if (leer(t)) meldung(v.id, saat, wo + ": Option " + i + " ohne Text");
        });
      }
      if (f.typ === "raster") {
        (f.zeilen || []).forEach((z, i) => {
          (z.zellen || []).forEach((c, j) => {
            if (!c.eingabe && leer(c.t) && leer(c.text))
              meldung(v.id, saat, wo + ": Zelle " + i + "/" + j + " ohne Inhalt und ohne Eingabe");
            /* Eine Eingabezelle braucht eine erwartete Antwort — sonst ist sie
               weder prüfbar noch weiß das Arbeitsblatt, welche Tastatur auf
               dem Handy aufgehen soll (Ziffernblock oder Buchstaben).      */
            if (c.eingabe) {
              const zahl = c.loesung != null || c.dez != null;
              const txt = (c.text || c.erwartet || []).filter(x => !leer(x));
              if (!zahl && !txt.length)
                meldung(v.id, saat, wo + ": Eingabezelle " + i + "/" + j + " ohne erwartete Antwort");
            }
          });
        });
      }
    });

    (a.tabellen || []).forEach((t, i) => {
      if (!(t.zeilen || []).length) meldung(v.id, saat, "Tabelle " + i + " ohne Zeilen");
    });

    if (leer(a.loesung)) meldung(v.id, saat, "Musterlösung leer");
  });
});

console.log("Vorlagen: " + GEN.alleVorlagen().length +
            " · erzeugt: " + geprueft + " · Felder: " + felder);
console.log(fehler ? "FEHLER: " + fehler : "alles sichtbar befüllt");
process.exit(fehler ? 1 : 0);
