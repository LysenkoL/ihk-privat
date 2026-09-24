"use strict";

/* SQL-Trainer (gen/sql.js): jede Musterlösung besteht, gleichwertige
   Schreibweisen bestehen auch, typische Fehler werden erkannt und auf
   Deutsch erklärt.                                                        */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const LIB = path.join(root, "vendor", "sqljs-1.14.2");
const initSqlJs = require(path.join(LIB, "sql-wasm.js"));
const S = require(path.join(root, "gen", "sql.js"));
const D = require(path.join(root, "gen", "sql-daten.js"));

initSqlJs({ locateFile: f => path.join(LIB, f) }).then(SQL => {
  S.setzeSQL(SQL);
  const A = id => D.AUFGABEN.find(a => a.id === id);
  const ok = (id, code, msg) => { const r = S.bewerte(A(id), code); assert(r.ok, (msg || id) + ": " + r.text + (r.punkte ? " " + JSON.stringify(r.punkte) : "")); return r; };
  const nein = (id, code, rx) => { const r = S.bewerte(A(id), code); assert(!r.ok, id + " sollte falsch sein: " + code); if (rx) assert(rx.test(r.text + JSON.stringify(r.punkte || r.teile || "")), id + ": " + r.text); return r; };

  /* Daten und Aufgaben sauber */
  const ids = new Set();
  D.AUFGABEN.forEach(a => {
    assert(!ids.has(a.id), "doppelt: " + a.id); ids.add(a.id);
    assert(D.THEMEN.some(t => t.key === a.thema), a.id + " Thema");
    assert(a.text && a.loesung && a.tipp && a.ru, a.id + " unvollständig");
    const l = S.loesungLauf(a);
    assert(!l.lauf.fehler, a.id + " Musterlösung: " + (l.lauf.fehler && l.lauf.fehler.roh));
    if ((a.art || "select") === "select") assert(l.lauf.letztes && l.lauf.letztes.zeilen.length, a.id + " leeres Ergebnis");
    ok(a.id, a.loesung, a.id + " Musterlösung gegen sich selbst");
  });
  assert(D.AUFGABEN.length >= 35);

  /* Sortier-Aufgaben: keine Gleichstände, sonst wäre die Reihenfolge nicht eindeutig */
  D.AUFGABEN.filter(a => a.ordnung).forEach(a => {
    const z = S.loesungLauf(a).lauf.letztes.zeilen.map(r => JSON.stringify(r));
    assert.strictEqual(new Set(z).size, z.length, a.id);
  });

  /* Gleichwertige Schreibweisen */
  ok("g1", "select ort, name, vorname from kunde", "Spaltenreihenfolge egal");
  ok("g3", "SELECT CONCAT(Vorname, ' ', Name) FROM Mitarbeiter", "CONCAT");
  ok("g4", "SELECT Name, IFNULL(Firma, 'privat') FROM Kunde");
  ok("w6", "SELECT BestellNr, Datum FROM Bestellung WHERE YEAR(Datum) = 2025", "YEAR()");
  ok("w6", "SELECT BestellNr, Datum FROM Bestellung WHERE Datum >= '2025-01-01' AND Datum < '2026-01-01'");
  ok("j5", "SELECT KundenNr, Name FROM Kunde k WHERE NOT EXISTS (SELECT * FROM Bestellung b WHERE b.KundenNr = k.KundenNr)", "NOT EXISTS");
  ok("j5", "SELECT KundenNr, Name FROM Kunde WHERE KundenNr NOT IN (SELECT KundenNr FROM Bestellung);");
  ok("a3", "SELECT MIN(Preis), MAX(Preis), ROUND(AVG(Preis), 2) FROM Artikel", "gerundet");
  ok("d2", "UPDATE Artikel SET Preis = ROUND(Preis * 1.05, 2) WHERE KategorieNr = 3;");
  ok("d1", "INSERT INTO Kunde VALUES (11, NULL, 'Klein', 'Emma', '50672', 'Köln', 'emma.klein@posteo.de', '2026-09-30')");
  ok("c1", "CREATE TABLE lieferant (LieferantNr INT AUTO_INCREMENT PRIMARY KEY, Firma VARCHAR(60) NOT NULL, Ort VARCHAR(40), Telefon VARCHAR(20))", "AUTO_INCREMENT");
  ok("c2", "ALTER TABLE Artikel ADD LieferantNr INT;\nALTER TABLE Artikel ADD CONSTRAINT fk_lief FOREIGN KEY (LieferantNr) REFERENCES Lieferant(LieferantNr);", "ADD FOREIGN KEY nachgebildet");
  ok("c3", "CREATE TABLE Lieferung (LieferantNr INT, ArtikelNr INT, Einkaufspreis DECIMAL(10,2), LieferzeitTage INT, PRIMARY KEY (LieferantNr, ArtikelNr), FOREIGN KEY (LieferantNr) REFERENCES Lieferant(LieferantNr), FOREIGN KEY (ArtikelNr) REFERENCES Artikel)");
  ok("o4", "SELECT Bezeichnung, Preis FROM Artikel ORDER BY Preis DESC LIMIT 3 -- Kommentar");

  /* Typische Fehler */
  nein("w5", "SELECT KundenNr, Name, Vorname FROM Kunde WHERE Email = NULL", /0 Zeilen|erwartet/);
  nein("g1", "SELECT * FROM Kunde", /Spalten|Werte stimmen/);
  nein("g1", "SELECT Name, Ort FROM Kunde", /fehlen Spalten/);
  nein("o1", "SELECT Bezeichnung, Preis FROM Artikel ORDER BY Preis", /Reihenfolge/);
  nein("j4", "SELECT k.Bezeichnung, COUNT(*) FROM Kategorie k LEFT JOIN Artikel a ON a.KategorieNr = k.KategorieNr GROUP BY k.Bezeichnung", /Werte|Zeilen/);
  nein("j1", "SELECT b.BestellNr, b.Datum, k.Name, k.Ort FROM Bestellung b JOIN Kunde k", /JOIN-Bedingung|zu viele|Zeilen/);
  nein("d2", "UPDATE Artikel SET Preis = Preis * 1.05", /Artikel/);
  nein("d2", "UPDATE Artikel SET Preis = Preis * 1.05 WHERE KategorieNr = 9", /nichts geändert/);
  let r = nein("d5", "DELETE FROM Bestellung WHERE Status = 'storniert'");
  assert(/referentielle Integrität/.test(r.text), r.text);
  r = nein("c1", "CREATE TABLE Lieferant (LieferantNr INT, Firma VARCHAR(50), Ort VARCHAR(40), Telefon INT)");
  assert(r.punkte.some(p => !p.ok && /Primärschlüssel/.test(p.text)));
  assert(r.punkte.some(p => !p.ok && /60 Zeichen/.test(p.text)));
  assert(r.punkte.some(p => !p.ok && /Telefon/.test(p.text)));
  assert(r.punkte.some(p => !p.ok && /NOT NULL/.test(p.text)));
  r = nein("c2", "ALTER TABLE Artikel ADD LieferantNr INT", /Punkt/);
  assert(r.punkte.some(p => !p.ok && /Fremdschlüssel/.test(p.text)));
  r = nein("c3", "CREATE TABLE Lieferung (LieferantNr INT PRIMARY KEY, ArtikelNr INT PRIMARY KEY)");
  assert(/EIN Primärschlüssel/.test(r.text), r.text);
  r = nein("c3", "CREATE TABLE Lieferung (LieferantNr INT REFERENCES Lieferant, ArtikelNr INT REFERENCES Artikel, Einkaufspreis FLOAT, LieferzeitTage INT, PRIMARY KEY (LieferantNr, ArtikelNr))");
  assert(r.punkte.some(p => !p.ok && /DECIMAL/.test(p.text)));
  nein("c4", "CREATE TABLE KundenKoeln (Name TEXT)", /Tabelle/);

  /* Fehlermeldungen auf Deutsch */
  const f = code => { const d = S.neueDb(); try { return S.ausfuehren(d, code).fehler.text; } finally { d.close(); } };
  assert(/einfache Anführungszeichen/.test(f("SELECT * FROM Kunde WHERE Ort = Köln")));
  assert(/gibt es nicht/.test(f("SELECT * FROM Kunden")));
  assert(/mehreren Tabellen/.test(f("SELECT KundenNr FROM Kunde JOIN Bestellung ON Kunde.KundenNr = Bestellung.KundenNr")));
  assert(/HAVING/.test(f("SELECT Ort FROM Kunde WHERE COUNT(*) > 1 GROUP BY Ort")));
  assert(/LIMIT/.test(f("SELECT TOP 3 * FROM Artikel")));
  assert(/Komma zu viel/.test(f("SELECT Name, FROM Kunde")));

  /* Warnungen für Dinge, die SQLite durchlässt */
  const w = c => S.warnungen(c, ["Kunde", "Ort", "Name"]).join(" ");
  assert(/GROUP BY/.test(w("SELECT Ort, Name, COUNT(*) FROM Kunde GROUP BY Ort")));
  assert(!/GROUP BY/.test(w("SELECT k.Ort, COUNT(*) AS n FROM Kunde k GROUP BY k.Ort")));
  assert(/kein GROUP BY/.test(w("SELECT Name, COUNT(*) FROM Kunde")));
  assert(/IS NULL/.test(w("SELECT * FROM Kunde WHERE Email = NULL")));
  assert(/ALLE Zeilen/.test(w("DELETE FROM Kunde")));
  assert(/einfache/.test(w('SELECT * FROM Kunde WHERE Ort = "Köln"')));
  assert(!/einfache/.test(w('SELECT "Name" FROM "Kunde"')));
  assert(/kartesisches/.test(w("SELECT * FROM Kunde k JOIN Bestellung b WHERE k.Ort = 'Köln'")));
  assert(/LIKE/.test(w("SELECT * FROM Artikel WHERE Bezeichnung LIKE 'Logitech'")));

  /* Zerlegen: ; in Texten und Kommentare */
  assert.deepStrictEqual(S.zerlege("SELECT ';' ; -- x;\nSELECT 2; /* ; */"), ["SELECT ';'", "SELECT 2"]);

  /* Einbindung */
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  ["gen/sql.js", "gen/sql.css", "gen/sql-daten.js"].forEach(x => { assert(html.includes(x), x); assert(sw.includes("./" + x), x); });
  assert(!html.includes("sql-wasm.js"), "Bibliothek erst bei Bedarf laden");
  assert(sw.includes("vendor/"), "Bibliothek offline verfügbar");

  console.log("sql: " + D.AUFGABEN.length + " Musterlösungen, Varianten, Fehler und Warnungen OK");
}).catch(e => { console.error(e); process.exit(1); });
