/* ============================================================================
   gen/test5.js — erkennt die Prüfung eine richtige Antwort in eigenen Worten?
   ----------------------------------------------------------------------------
   Lena hat „Mindestens 12 Symbolen, mit großen und kleinen Buchstaben und
   Sonderzeichen“ geschrieben und 0 von 2 Punkten bekommen. Sachlich war die
   Antwort richtig; sie hat nur „Symbol“ statt „Zeichen“ gesagt und die
   Groß-/Kleinschreibung auseinandergezogen. Genau das darf in einer echten
   Prüfung nicht durchfallen — der Prüfer liest den Sachverhalt, nicht das Wort.

   Dieser Test misst beide Fehlerrichtungen an allen Erwartungswerten, die in
   den Vorlagen stehen:

     falsch-negativ  eine richtige Antwort wird nicht erkannt
                     (Tippfehler, umgestellte Wörter, Synonym, Teilphrase)
     falsch-positiv  eine fremde Antwort wird fälschlich anerkannt
                     (Erwartungswert aus einer ANDEREN Vorlage)

   Die Toleranz ist zwangsläufig ein Kompromiss: Wer alles durchwinkt, hat
   0 % falsch-negativ und eine wertlose Prüfung. Deshalb stehen beide Zahlen
   nebeneinander, und der Test schlägt erst an, wenn eine davon aus dem Ruder
   läuft.
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
const enthaelt = GEN.enthaelt;
if (typeof enthaelt !== "function") { console.error("GEN.enthaelt fehlt"); process.exit(1); }

/* ---------------------------------------------------------------------------
   1. Alle Erwartungswerte einsammeln
   Ein Erwartungswert ist entweder ein String oder eine Gruppe gleichwertiger
   Schreibweisen. Für den Test zählt jede Gruppe einmal; als „richtige Antwort“
   dient immer die erste Schreibweise, weil die anderen ja schon per Hand als
   gleichwertig hinterlegt sind.
--------------------------------------------------------------------------- */
const SAATEN = [1, 5, 17, 42, 777];
const gruppen = [];      /* {vorlage, texte:[…]} */
const gesehen = new Set();

function sammle(vid, wert) {
  if (wert == null) return;
  if (Array.isArray(wert)) {
    if (wert.every(x => typeof x === "string")) {
      const texte = wert.filter(x => x && x.trim());
      if (texte.length) merke(vid, texte);
    } else wert.forEach(x => sammle(vid, x));
    return;
  }
  if (typeof wert === "string" && wert.trim()) merke(vid, [wert]);
}
function merke(vid, texte) {
  const schl = vid + "|" + texte.join("|");
  if (gesehen.has(schl)) return;
  gesehen.add(schl);
  gruppen.push({ vorlage: vid, texte });
}

GEN.alleVorlagen().forEach(v => {
  SAATEN.forEach(saat => {
    let a; try { a = GEN.erzeuge(v.id, saat); } catch (e) { return; }
    (a.felder || []).forEach(f => {
      if (f.typ === "liste" || f.typ === "text" || f.typ === "textarea") {
        sammle(v.id, f.erwartet);
        sammle(v.id, f.text);
      }
      if (f.typ === "raster") {
        (f.zeilen || []).forEach(z => (z.zellen || []).forEach(c => {
          if (!c.eingabe) return;
          if (c.loesung != null || c.dez != null) return;   /* Zahlen: anderer Prüfweg */
          sammle(v.id, c.text); sammle(v.id, c.erwartet);
        }));
      }
    });
  });
});

/* ---------------------------------------------------------------------------
   2. Richtige Antworten „in eigenen Worten“ erzeugen
--------------------------------------------------------------------------- */
function tippfehler(s) {
  /* einen Buchstabendreher in das längste Wort setzen */
  const w = s.split(/\s+/);
  let i = 0;
  w.forEach((x, k) => { if (x.length > w[i].length) i = k; });
  const x = w[i];
  if (x.length < 6) return null;
  const p = Math.floor(x.length / 2);
  w[i] = x.slice(0, p) + x[p + 1] + x[p] + x.slice(p + 2);
  return w.join(" ");
}
function buchstabeWeg(s) {
  const w = s.split(/\s+/);
  let i = 0;
  w.forEach((x, k) => { if (x.length > w[i].length) i = k; });
  if (w[i].length < 7) return null;
  const p = Math.floor(w[i].length / 2);
  w[i] = w[i].slice(0, p) + w[i].slice(p + 1);
  return w.join(" ");
}
function umgestellt(s) {
  const w = s.split(/\s+/).filter(Boolean);
  if (w.length < 3) return null;
  return w.slice(1).concat(w[0]).join(" ");
}
function eingebettet(s) {
  return "Ich würde " + s.charAt(0).toLowerCase() + s.slice(1) + " einsetzen.";
}
const VARIANTEN = [
  { name: "unverändert", f: s => s },
  { name: "Tippfehler (Dreher)", f: tippfehler },
  { name: "Tippfehler (Buchstabe fehlt)", f: buchstabeWeg },
  { name: "Wörter umgestellt", f: umgestellt },
  { name: "in einen Satz eingebettet", f: eingebettet }
];

let jaGesamt = 0, jaTreffer = 0;
const jaFehler = [];

/* Bei reinen Zahlen/Kürzeln ist ein „Tippfehler“ kein Tippfehler, sondern
   eine falsche Antwort: 11111000 statt 11110000 ist schlicht falsch.      */
const NUR_CODE = /^[\d\s.,:%/+-]+$/;

gruppen.forEach(g => {
  const richtig = g.texte[0];
  if (NUR_CODE.test(richtig)) return;
  VARIANTEN.forEach(v => {
    const antwort = v.f(richtig);
    if (!antwort) return;
    jaGesamt++;
    const ok = g.texte.some(t => enthaelt(antwort, t));
    if (ok) jaTreffer++;
    else if (jaFehler.length < 25)
      jaFehler.push(v.name + " · " + g.vorlage + "\n      erwartet: " + richtig + "\n      Antwort : " + antwort);
  });
});

/* ---------------------------------------------------------------------------
   3. Fremde Antworten dürfen nicht durchgehen
   Für jede Gruppe wird der Erwartungswert einer anderen Vorlage als Antwort
   eingesetzt. Das ist der harte Gegentest: was hier durchrutscht, wäre in der
   echten Prüfung ein geschenkter Punkt.
--------------------------------------------------------------------------- */
let neinGesamt = 0, neinDurch = 0;
const neinFehler = [];

const UNSINN = [
  "ich weiß es nicht",
  "keine Ahnung",
  "der Rechner ist zu langsam",
  "das steht in der Anlage",
  "siehe oben"
];

gruppen.forEach((g, i) => {
  /* drei fremde Gruppen, gleichmäßig über die Liste verteilt */
  [1, 3, 7].forEach(schritt => {
    const f = gruppen[(i + Math.floor(gruppen.length / 3) * schritt + schritt) % gruppen.length];
    if (!f || f.vorlage === g.vorlage) return;
    neinGesamt++;
    if (g.texte.some(t => enthaelt(f.texte[0], t))) {
      neinDurch++;
      if (neinFehler.length < 25)
        neinFehler.push(g.vorlage + "\n      erwartet: " + g.texte[0] + "\n      fremd   : " + f.texte[0]);
    }
  });
  UNSINN.forEach(u => {
    neinGesamt++;
    if (g.texte.some(t => enthaelt(u, t))) {
      neinDurch++;
      if (neinFehler.length < 25)
        neinFehler.push(g.vorlage + "\n      erwartet: " + g.texte[0] + "\n      Unsinn  : " + u);
    }
  });
});

/* ---------------------------------------------------------------------------
   4. Die Fälle, an denen die Sache aufgefallen ist — namentlich
--------------------------------------------------------------------------- */
const HANDPROBEN = [
  [true,  "Mindestens 12 Symbolen, mit großen und kleinen Buchstaben und Sonderzeichen", "mindestens 12 Zeichen"],
  [true,  "Mindestens 12 Symbolen, mit großen und kleinen Buchstaben und Sonderzeichen", "Groß- und Kleinbuchstaben, Ziffern, Sonderzeichen"],
  [true,  "Fehler im Netz", "Störung im Netzwerk"],
  [true,  "Kennwort regelmäßig wechseln", "Passwort regelmäßig ändern"],
  [true,  "Backup machen", "Datensicherung durchführen"],
  [true,  "die Daten müssen verschlüselt werden", "Daten verschlüsseln"],
  [true,  "Zwei-Faktor-Authentifizierung", "Mehr-Faktor-Authentifizierung"],
  [false, "der Rechner ist zu langsam", "Mehr-Faktor-Authentifizierung"],
  [false, "ich weiss es nicht", "ausreichende Länge"],
  [false, "Datensicherung durchführen", "Firewall einrichten"],
  [false, "RAID 1", "RAID 5"],
  [false, "Drucker anschließen", "Netzwerk einrichten"]
];
let handFehler = 0;
HANDPROBEN.forEach(([soll, antwort, begriff]) => {
  const ist = enthaelt(antwort, begriff);
  if (ist !== soll) {
    handFehler++;
    console.log("  HANDPROBE falsch: erwartet " + (soll ? "JA" : "nein") +
      ", bekommen " + (ist ? "JA" : "nein") +
      "\n      Begriff : " + begriff + "\n      Antwort : " + antwort);
  }
});

/* --------------------------------------------------------------- Bericht -- */
const fnQuote = jaGesamt ? (100 * (jaGesamt - jaTreffer) / jaGesamt) : 0;
const fpQuote = neinGesamt ? (100 * neinDurch / neinGesamt) : 0;

if (jaFehler.length) {
  console.log("\nNicht erkannt (Auszug):");
  jaFehler.forEach(x => console.log("  " + x));
}
if (neinFehler.length) {
  console.log("\nFälschlich anerkannt (Auszug):");
  neinFehler.forEach(x => console.log("  " + x));
}

console.log("\nErwartungsgruppen: " + gruppen.length);
console.log("richtige Antworten erkannt : " + jaTreffer + "/" + jaGesamt +
            "  (nicht erkannt " + fnQuote.toFixed(1) + " %)");
console.log("fremde Antworten abgelehnt : " + (neinGesamt - neinDurch) + "/" + neinGesamt +
            "  (durchgerutscht " + fpQuote.toFixed(1) + " %)");
console.log("Handproben: " + (HANDPROBEN.length - handFehler) + "/" + HANDPROBEN.length);

/* Grenzen: großzügig genug für echte Umformulierungen, streng genug, dass
   ein Aufweichen der Prüfung hier auffällt.                              */
const schlecht = fnQuote > 12 || fpQuote > 6 || handFehler > 0;
console.log(schlecht ? "FEHLER: Toleranz aus dem Gleichgewicht" : "Antwortprüfung im Gleichgewicht");
process.exit(schlecht ? 1 : 0);
