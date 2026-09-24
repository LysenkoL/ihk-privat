"use strict";

/* Generator „netz-ipconfig“: Fehlerbild und Konfiguration müssen zusammen-
   passen. Gefunden bei der Probeprüfung am 24.09.: Terminal .153/16 und
   Server .32/24 sehen sich gegenseitig im eigenen Netz — die Verbindung
   hätte funktioniert, die Aufgabe war falsch. Ebenso darf ein falsches
   Gateway den Server im eigenen Netz nicht „unerreichbar“ machen.        */
const assert = require("assert");
const path = require("path");
global.window = global;
["kern", "vorlagen-problemfaelle"].forEach(m => require(path.join(__dirname, "..", "gen", m + ".js")));
const G = global.GEN;

const zahl = a => a.split(".").reduce((s, o) => s * 256 + +o, 0);
const imNetz = (a, b, maske) => ((zahl(a) & zahl(maske)) >>> 0) === ((zahl(b) & zahl(maske)) >>> 0);
const werte = (code, name) => Array.from(code.matchAll(new RegExp(name + "[ .]*: (\\S+)", "g"))).map(m => m[1]);

const arten = {};
for (let s = 0; s < 3000; s++) {
  const a = G.erzeuge("netz-ipconfig", s * 7919 + 3);
  const art = /Falsch ist die (\S+?):/.exec(a.loesung)[1];
  arten[art] = (arten[art] || 0) + 1;
  const [ipT, ipS] = werte(a.code, "IPv4-Adresse"), [mT, mS] = werte(a.code, "Subnetzmaske");
  const [gwT] = werte(a.code, "Standardgateway"), dns = werte(a.code, "DNS-Server");
  const lokal = imNetz(ipT, ipS, mT) && imNetz(ipS, ipT, mS);
  const gwLokal = imNetz(ipT, gwT, mT);
  const erreicht = lokal || (!imNetz(ipT, ipS, mT) && gwLokal);
  const was = "Saat " + s + " (" + art + "): " + ipT + " " + mT + " / " + ipS + " " + mS;
  if (art === "Subnetzmaske" || art === "IPv4-Adresse") {
    assert(!erreicht, "Verbindung würde funktionieren — " + was);
    assert(/nicht erreicht/.test(a.situation), was);
  } else if (art === "Standardgateway") {
    assert(lokal && !gwLokal, was);
    assert(/Internet/.test(a.situation) && !/Anwendungsserver nicht erreicht/.test(a.situation), "Fehlerbild passt nicht — " + was);
  } else {
    assert(lokal && gwLokal && dns[0] !== dns[1], was);
    assert(/nicht gefunden/.test(a.situation), was);
  }
  if (art === "Subnetzmaske") assert(/255\.255\.255\.(128|192|224)/.test(mT), "nur engere Masken — " + was);
}
Object.keys(arten).forEach(k => assert(arten[k] > 400, "Fehlerart zu selten: " + k));
console.log("generator-ipconfig: 3000 Aufgaben, Fehlerbild und Konfiguration passen zusammen", JSON.stringify(arten));
