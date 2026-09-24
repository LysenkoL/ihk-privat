/* ============================================================================
   gen/sql-daten.js — Datenbank und Aufgaben für den SQL-Trainer (gen/sql.js)
   ----------------------------------------------------------------------------
   Ein kleiner Online-Händler für IT-Ausstattung, wie er in AP2-Bögen
   vorkommt: Kunden, Artikel, Kategorien, Bestellungen mit Positionen und
   Mitarbeiter mit Vorgesetzten. Die Daten sind so gewählt, dass jede
   Aufgabe ein eindeutiges Ergebnis hat (keine Gleichstände beim Sortieren,
   Kunden ohne Bestellung, Kategorie ohne Artikel, Artikel ohne Bestellung,
   NULL-Werte bei Firma und E-Mail).

   Aufgabe:
     id, thema, stufe (1–3), titel, text, loesung (SQL)
     art:     "select" Ergebnis vergleichen (Standard)
              "dml"    Tabelleninhalt danach vergleichen
              "ddl"    Tabellenaufbau prüfen (ddl: {…})
              "view"   Sicht vorhanden + Inhalt vergleichen
     ordnung: Reihenfolge zählt (ORDER BY verlangt)
     vorher:  SQL, das vor deiner Lösung läuft
     tipp, ru (kurzer Merksatz auf Russisch)
   ========================================================================== */
"use strict";

(function (root) {
  const SCHEMA = `
CREATE TABLE Kunde (
  KundenNr    INTEGER PRIMARY KEY,
  Firma       VARCHAR(60),
  Name        VARCHAR(40) NOT NULL,
  Vorname     VARCHAR(40),
  PLZ         CHAR(5),
  Ort         VARCHAR(40),
  Email       VARCHAR(80),
  Registriert DATE
);
CREATE TABLE Kategorie (
  KategorieNr INTEGER PRIMARY KEY,
  Bezeichnung VARCHAR(40) NOT NULL
);
CREATE TABLE Artikel (
  ArtikelNr   INTEGER PRIMARY KEY,
  Bezeichnung VARCHAR(60) NOT NULL,
  KategorieNr INTEGER REFERENCES Kategorie(KategorieNr),
  Preis       DECIMAL(8,2) NOT NULL,
  Bestand     INTEGER DEFAULT 0
);
CREATE TABLE Bestellung (
  BestellNr INTEGER PRIMARY KEY,
  KundenNr  INTEGER NOT NULL REFERENCES Kunde(KundenNr),
  Datum     DATE NOT NULL,
  Status    VARCHAR(20)
);
CREATE TABLE Bestellposition (
  BestellNr INTEGER REFERENCES Bestellung(BestellNr),
  ArtikelNr INTEGER REFERENCES Artikel(ArtikelNr),
  Menge     INTEGER NOT NULL,
  PRIMARY KEY (BestellNr, ArtikelNr)
);
CREATE TABLE Mitarbeiter (
  PersNr         INTEGER PRIMARY KEY,
  Name           VARCHAR(40),
  Vorname        VARCHAR(40),
  Abteilung      VARCHAR(30),
  Gehalt         DECIMAL(8,2),
  Eintritt       DATE,
  VorgesetzterNr INTEGER REFERENCES Mitarbeiter(PersNr)
);

INSERT INTO Kunde VALUES
 (1,'Müller Bau GmbH','Müller','Stefan','50667','Köln','s.mueller@muellerbau.de','2023-03-14'),
 (2,NULL,'Schneider','Anna','80331','München','anna.schneider@web.de','2024-01-09'),
 (3,'Praxis Dr. Weber','Weber','Thomas','50674','Köln',NULL,'2022-11-02'),
 (4,NULL,'Fischer','Julia','10115','Berlin','julia.f@gmx.de','2025-06-21'),
 (5,'Wagner Logistik KG','Wagner','Michael','20095','Hamburg','einkauf@wagner-logistik.de','2021-08-30'),
 (6,NULL,'Becker','Laura','50823','Köln','laura.becker@t-online.de','2025-02-17'),
 (7,'Hoffmann IT-Service','Hoffmann','Jan','40210','Düsseldorf','info@hoffmann-it.de','2024-09-05'),
 (8,NULL,'Schulz','Mehmet','80335','München',NULL,'2026-01-12'),
 (9,'Kanzlei Koch & Partner','Koch','Sabine','10117','Berlin','kanzlei@koch-partner.de','2023-05-23'),
 (10,NULL,'Richter','Paul','01067','Dresden','paul.richter@gmail.com','2026-03-03');

INSERT INTO Kategorie VALUES
 (1,'Notebooks'),(2,'Monitore'),(3,'Zubehör'),(4,'Netzwerk'),(5,'Software');

INSERT INTO Artikel VALUES
 (1,'ProBook 450 G10',1,899.00,12),
 (2,'ThinkPad E14',1,749.00,5),
 (3,'MacBook Air 13',1,1199.00,0),
 (4,'Monitor 24 Zoll Full HD',2,229.00,20),
 (5,'Monitor 27 Zoll 4K',2,389.00,7),
 (6,'Logitech MX Keys',3,109.99,30),
 (7,'Logitech MX Master 3S',3,99.99,25),
 (8,'USB-C Dockingstation',3,189.00,3),
 (9,'Headset Jabra Evolve2 40',3,79.90,0),
 (10,'Switch 24 Port Gigabit',4,249.00,4),
 (11,'WLAN Access Point AX3000',4,159.00,9),
 (12,'Patchkabel Cat6 2m',4,4.99,200),
 (13,'Webcam Full HD',3,59.00,14),
 (14,'Monitorarm Doppel',3,89.00,6);

INSERT INTO Bestellung VALUES
 (1001,1,'2025-02-10','versandt'),
 (1002,3,'2025-03-05','versandt'),
 (1003,5,'2025-05-19','versandt'),
 (1004,2,'2025-07-01','storniert'),
 (1005,1,'2025-09-12','versandt'),
 (1006,7,'2025-11-28','versandt'),
 (1007,4,'2026-01-15','versandt'),
 (1008,5,'2026-02-02','versandt'),
 (1009,9,'2026-03-20','versandt'),
 (1010,6,'2026-05-08','offen'),
 (1011,1,'2026-06-30','offen'),
 (1012,7,'2026-07-14','offen');

INSERT INTO Bestellposition VALUES
 (1001,1,3),(1001,6,3),(1001,7,3),
 (1002,2,1),(1002,4,2),
 (1003,10,2),(1003,12,50),(1003,11,4),
 (1004,3,1),
 (1005,4,5),(1005,8,5),
 (1006,11,2),(1006,12,20),(1006,7,1),
 (1007,3,1),(1007,7,1),
 (1008,1,10),(1008,5,10),(1008,6,10),(1008,7,10),
 (1009,2,2),(1009,9,2),
 (1010,5,1),
 (1011,8,3),(1011,12,10),
 (1012,10,1),(1012,9,4);

INSERT INTO Mitarbeiter VALUES
 (1,'Krause','Heike','Geschäftsleitung',7800,'2012-04-01',NULL),
 (2,'Neumann','Tobias','Vertrieb',4200,'2016-09-01',1),
 (3,'Lang','Miriam','Vertrieb',3650,'2021-02-15',2),
 (4,'Yilmaz','Deniz','IT',4600,'2018-07-01',1),
 (5,'Hartmann','Sophie','IT',3100,'2025-08-01',4),
 (6,'Braun','Felix','Lager',2900,'2019-03-01',1),
 (7,'Zimmer','Olga','Lager',2750,'2023-10-01',6),
 (8,'Wolf','Kevin','IT',3900,'2020-01-15',4);
`;

  /* Für die Schema-Ansicht: Kurzbeschreibung je Tabelle */
  const TABELLEN = {
    Kunde: "Privat- und Firmenkunden. Firma und Email dürfen leer (NULL) sein.",
    Kategorie: "Warengruppen. „Software“ hat noch keine Artikel.",
    Artikel: "Sortiment mit Preis (netto) und Lagerbestand.",
    Bestellung: "Kopf der Bestellung. Status: offen, versandt oder storniert.",
    Bestellposition: "Welche Artikel in welcher Menge zu einer Bestellung gehören. Schlüssel aus zwei Spalten.",
    Mitarbeiter: "Beschäftigte. VorgesetzterNr verweist auf einen anderen Mitarbeiter (NULL = Geschäftsleitung)."
  };

  const THEMEN = [
    { key: "grund", name: "Grundlagen" },
    { key: "filter", name: "WHERE" },
    { key: "sort", name: "Sortieren" },
    { key: "agg", name: "Gruppieren" },
    { key: "join", name: "JOIN" },
    { key: "sub", name: "Unterabfragen" },
    { key: "dml", name: "Daten ändern" },
    { key: "ddl", name: "Tabellen anlegen" }
  ];

  const LIEFERANT = "CREATE TABLE Lieferant (LieferantNr INTEGER PRIMARY KEY, Firma VARCHAR(60) NOT NULL, Ort VARCHAR(40), Telefon VARCHAR(20));";

  const AUFGABEN = [
    /* --------------------------------------------------------- Grundlagen */
    { id: "g1", thema: "grund", stufe: 1, titel: "Spalten auswählen",
      text: "Geben Sie Name, Vorname und Ort aller Kunden aus.",
      loesung: "SELECT Name, Vorname, Ort\nFROM Kunde;",
      tipp: "SELECT Spalte1, Spalte2 FROM Tabelle;",
      ru: "SELECT — какие столбцы, FROM — из какой таблицы. Столбцы через запятую, после последнего запятой нет." },
    { id: "g2", thema: "grund", stufe: 1, titel: "Berechnete Spalte mit Alias",
      text: "Geben Sie für jeden Artikel die Bezeichnung und den Lagerwert (Bestand × Preis) aus. Die berechnete Spalte soll „Lagerwert“ heißen.",
      loesung: "SELECT Bezeichnung, Bestand * Preis AS Lagerwert\nFROM Artikel;",
      tipp: "Rechnen direkt im SELECT, Name mit AS vergeben.",
      ru: "В SELECT можно считать (*, +, -, /). AS даёт столбцу понятное имя (псевдоним)." },
    { id: "g3", thema: "grund", stufe: 2, titel: "Texte verbinden",
      text: "Geben Sie für alle Mitarbeiter den vollständigen Namen in einer Spalte aus, im Format „Vorname Name“ (z. B. „Heike Krause“). Die Spalte soll „Mitarbeiter“ heißen.",
      loesung: "SELECT Vorname || ' ' || Name AS Mitarbeiter\nFROM Mitarbeiter;",
      tipp: "Standard-SQL: Vorname || ' ' || Name. In MySQL: CONCAT(Vorname, ' ', Name) — geht hier auch.",
      ru: "Склейка строк: || (стандарт) или CONCAT() (MySQL). Пробел — отдельной строкой ' '." },
    { id: "g4", thema: "grund", stufe: 2, titel: "NULL ersetzen",
      text: "Geben Sie Name und Firma aller Kunden aus. Ist keine Firma eingetragen, soll stattdessen „privat“ erscheinen.",
      loesung: "SELECT Name, COALESCE(Firma, 'privat') AS Firma\nFROM Kunde;",
      tipp: "COALESCE(Spalte, Ersatz) nimmt den ersten Wert, der nicht NULL ist. MySQL kennt auch IFNULL.",
      ru: "COALESCE(a, b) — вернёт a, если он не NULL, иначе b. Удобно для пустых полей." },
    { id: "g5", thema: "grund", stufe: 2, titel: "Fallunterscheidung mit CASE",
      text: "Geben Sie Bezeichnung und Bestand aller Artikel aus und dazu eine Spalte „Lager“: „ausverkauft“ bei Bestand 0, „knapp“ bei einem Bestand unter 5, sonst „ok“.",
      loesung: "SELECT Bezeichnung, Bestand,\n  CASE WHEN Bestand = 0 THEN 'ausverkauft'\n       WHEN Bestand < 5 THEN 'knapp'\n       ELSE 'ok' END AS Lager\nFROM Artikel;",
      tipp: "CASE WHEN Bedingung THEN Wert WHEN … ELSE Wert END — die erste zutreffende Bedingung zählt.",
      ru: "CASE WHEN … THEN … ELSE … END — как if/else прямо в запросе. Проверяется сверху вниз." },

    /* --------------------------------------------------------------- WHERE */
    { id: "w1", thema: "filter", stufe: 1, titel: "Einfache Bedingung",
      text: "Geben Sie alle Angaben (alle Spalten) zu den Kunden aus Köln aus.",
      loesung: "SELECT *\nFROM Kunde\nWHERE Ort = 'Köln';",
      tipp: "Texte stehen in einfachen Anführungszeichen: 'Köln'.",
      ru: "WHERE фильтрует строки. Текст — в одинарных кавычках. * = все столбцы." },
    { id: "w2", thema: "filter", stufe: 1, titel: "Vergleich mit Zahl",
      text: "Geben Sie Bezeichnung und Preis aller Artikel aus, die weniger als 100 € kosten.",
      loesung: "SELECT Bezeichnung, Preis\nFROM Artikel\nWHERE Preis < 100;",
      tipp: "Zahlen ohne Anführungszeichen und ohne €-Zeichen, Dezimalpunkt statt Komma.",
      ru: "Числа пишем без кавычек и без €, дробную часть — через точку (99.99)." },
    { id: "w3", thema: "filter", stufe: 2, titel: "AND verknüpfen",
      text: "Geben Sie ArtikelNr, Bezeichnung und Bestand aller Artikel aus, deren Bestand unter 5 liegt und die mehr als 150 € kosten.",
      loesung: "SELECT ArtikelNr, Bezeichnung, Bestand\nFROM Artikel\nWHERE Bestand < 5 AND Preis > 150;",
      tipp: "Beide Bedingungen müssen gelten → AND.",
      ru: "AND — должны выполняться оба условия, OR — хотя бы одно." },
    { id: "w4", thema: "filter", stufe: 1, titel: "LIKE",
      text: "Geben Sie Bezeichnung und Preis aller Artikel aus, deren Bezeichnung „Logitech“ enthält.",
      loesung: "SELECT Bezeichnung, Preis\nFROM Artikel\nWHERE Bezeichnung LIKE '%Logitech%';",
      tipp: "% steht für beliebig viele Zeichen, _ für genau ein Zeichen.",
      ru: "LIKE ищет по шаблону: % — любое количество символов, _ — ровно один." },
    { id: "w5", thema: "filter", stufe: 1, titel: "IS NULL",
      text: "Geben Sie KundenNr, Name und Vorname aller Kunden aus, für die keine E-Mail-Adresse gespeichert ist.",
      loesung: "SELECT KundenNr, Name, Vorname\nFROM Kunde\nWHERE Email IS NULL;",
      tipp: "Mit NULL vergleicht man nie mit =, sondern mit IS NULL / IS NOT NULL.",
      ru: "NULL — «нет значения». Сравнивать только IS NULL / IS NOT NULL, «= NULL» никогда не срабатывает." },
    { id: "w6", thema: "filter", stufe: 1, titel: "BETWEEN mit Datum",
      text: "Geben Sie BestellNr und Datum aller Bestellungen aus dem Jahr 2025 aus.",
      loesung: "SELECT BestellNr, Datum\nFROM Bestellung\nWHERE Datum BETWEEN '2025-01-01' AND '2025-12-31';",
      tipp: "Datum als Text im Format 'JJJJ-MM-TT'. BETWEEN schließt beide Grenzen ein. YEAR(Datum) = 2025 geht hier auch.",
      ru: "Дата пишется как 'ГГГГ-ММ-ДД'. BETWEEN включает обе границы." },
    { id: "w7", thema: "filter", stufe: 1, titel: "IN-Liste",
      text: "Geben Sie Name und Ort aller Kunden aus Berlin, Hamburg oder München aus.",
      loesung: "SELECT Name, Ort\nFROM Kunde\nWHERE Ort IN ('Berlin', 'Hamburg', 'München');",
      tipp: "IN (…) ersetzt mehrere OR-Bedingungen.",
      ru: "IN ('a','b','c') — короче, чем три условия через OR." },

    /* ----------------------------------------------------------- Sortieren */
    { id: "o1", thema: "sort", stufe: 1, titel: "ORDER BY absteigend", ordnung: true,
      text: "Geben Sie Bezeichnung und Preis aller Artikel aus — der teuerste Artikel zuerst.",
      loesung: "SELECT Bezeichnung, Preis\nFROM Artikel\nORDER BY Preis DESC;",
      tipp: "ASC = aufsteigend (Standard), DESC = absteigend.",
      ru: "ORDER BY сортирует: ASC — по возрастанию (по умолчанию), DESC — по убыванию." },
    { id: "o2", thema: "sort", stufe: 2, titel: "Nach zwei Spalten sortieren", ordnung: true,
      text: "Geben Sie Abteilung, Name und Gehalt aller Mitarbeiter aus, sortiert nach Abteilung (A–Z) und innerhalb der Abteilung nach Gehalt, das höchste zuerst.",
      loesung: "SELECT Abteilung, Name, Gehalt\nFROM Mitarbeiter\nORDER BY Abteilung ASC, Gehalt DESC;",
      tipp: "ORDER BY Spalte1 ASC, Spalte2 DESC — die zweite Spalte entscheidet nur bei Gleichstand der ersten.",
      ru: "Сортировка по нескольким столбцам: второй работает только внутри одинаковых значений первого." },
    { id: "o3", thema: "sort", stufe: 1, titel: "DISTINCT", ordnung: true,
      text: "Aus welchen Orten kommen die Kunden? Geben Sie jeden Ort nur einmal aus, alphabetisch sortiert.",
      loesung: "SELECT DISTINCT Ort\nFROM Kunde\nORDER BY Ort;",
      tipp: "DISTINCT direkt hinter SELECT entfernt doppelte Zeilen.",
      ru: "DISTINCT убирает повторы в результате." },
    { id: "o4", thema: "sort", stufe: 2, titel: "Die drei teuersten", ordnung: true,
      text: "Geben Sie Bezeichnung und Preis der drei teuersten Artikel aus.",
      loesung: "SELECT Bezeichnung, Preis\nFROM Artikel\nORDER BY Preis DESC\nLIMIT 3;",
      tipp: "Erst sortieren, dann begrenzen: LIMIT 3 (MySQL). MS SQL: SELECT TOP 3 …, Standard: FETCH FIRST 3 ROWS ONLY.",
      ru: "Сначала ORDER BY, потом LIMIT. В MS SQL вместо LIMIT пишут TOP 3 после SELECT." },

    /* ---------------------------------------------------------- Gruppieren */
    { id: "a1", thema: "agg", stufe: 1, titel: "Zählen",
      text: "Wie viele Kunden sind gespeichert? Geben Sie nur die Anzahl aus.",
      loesung: "SELECT COUNT(*) AS Anzahl\nFROM Kunde;",
      tipp: "COUNT(*) zählt Zeilen.",
      ru: "COUNT(*) считает строки." },
    { id: "a2", thema: "agg", stufe: 2, titel: "COUNT(Spalte) und NULL",
      text: "Wie viele Kunden haben eine E-Mail-Adresse hinterlegt? Geben Sie nur die Anzahl aus.",
      loesung: "SELECT COUNT(Email) AS Anzahl\nFROM Kunde;",
      tipp: "COUNT(Spalte) zählt nur Zeilen, in denen die Spalte nicht NULL ist.",
      ru: "COUNT(столбец) не считает NULL, COUNT(*) считает всё." },
    { id: "a3", thema: "agg", stufe: 1, titel: "MIN, MAX, AVG",
      text: "Geben Sie den niedrigsten, den höchsten und den durchschnittlichen Artikelpreis aus (drei Spalten in dieser Reihenfolge).",
      loesung: "SELECT MIN(Preis), MAX(Preis), AVG(Preis)\nFROM Artikel;",
      tipp: "Aggregatfunktionen: COUNT, SUM, AVG, MIN, MAX.",
      ru: "Агрегатные функции сводят много строк в одно значение: COUNT, SUM, AVG, MIN, MAX." },
    { id: "a4", thema: "agg", stufe: 2, titel: "GROUP BY",
      text: "Geben Sie für jeden Ort die Anzahl der Kunden aus (Ort, Anzahl).",
      loesung: "SELECT Ort, COUNT(*) AS Anzahl\nFROM Kunde\nGROUP BY Ort;",
      tipp: "Jede Spalte im SELECT, die nicht in einer Aggregatfunktion steht, muss ins GROUP BY.",
      ru: "GROUP BY собирает строки в группы. Всё в SELECT без агрегатной функции должно стоять в GROUP BY." },
    { id: "a5", thema: "agg", stufe: 2, titel: "Summe und Schnitt je Gruppe",
      text: "Geben Sie für jede Abteilung die Gehaltssumme und das Durchschnittsgehalt aus (Abteilung, Summe, Durchschnitt).",
      loesung: "SELECT Abteilung, SUM(Gehalt) AS Summe, AVG(Gehalt) AS Durchschnitt\nFROM Mitarbeiter\nGROUP BY Abteilung;",
      tipp: "GROUP BY Abteilung, dann SUM und AVG.",
      ru: "SUM — сумма, AVG — среднее, считаются отдельно для каждой группы." },
    { id: "a6", thema: "agg", stufe: 2, titel: "HAVING",
      text: "Geben Sie alle Orte aus, in denen mindestens zwei Kunden wohnen — mit der Anzahl (Ort, Anzahl).",
      loesung: "SELECT Ort, COUNT(*) AS Anzahl\nFROM Kunde\nGROUP BY Ort\nHAVING COUNT(*) >= 2;",
      tipp: "Bedingungen auf Gruppen (COUNT, SUM …) gehören in HAVING, nicht in WHERE.",
      ru: "WHERE фильтрует строки ДО группировки, HAVING — группы ПОСЛЕ неё (условия с COUNT/SUM)." },
    { id: "a7", thema: "agg", stufe: 3, titel: "WHERE und GROUP BY",
      text: "Wie viele Bestellungen gibt es seit dem 01.01.2026 je Status? Geben Sie Status und Anzahl aus.",
      loesung: "SELECT Status, COUNT(*) AS Anzahl\nFROM Bestellung\nWHERE Datum >= '2026-01-01'\nGROUP BY Status;",
      tipp: "Reihenfolge: SELECT – FROM – WHERE – GROUP BY – HAVING – ORDER BY.",
      ru: "Порядок частей запроса: SELECT – FROM – WHERE – GROUP BY – HAVING – ORDER BY." },

    /* ---------------------------------------------------------------- JOIN */
    { id: "j1", thema: "join", stufe: 1, titel: "Zwei Tabellen verbinden",
      text: "Geben Sie zu jeder Bestellung BestellNr und Datum sowie Name und Ort des Kunden aus.",
      loesung: "SELECT b.BestellNr, b.Datum, k.Name, k.Ort\nFROM Bestellung b\nJOIN Kunde k ON k.KundenNr = b.KundenNr;",
      tipp: "JOIN … ON Fremdschlüssel = Primärschlüssel. Aliase (b, k) sparen Schreibarbeit.",
      ru: "JOIN соединяет таблицы по ключу: внешний ключ = первичный ключ. Без ON получится каждая строка с каждой." },
    { id: "j2", thema: "join", stufe: 2, titel: "Positionen einer Bestellung",
      text: "Geben Sie für die Bestellung 1008 die Bezeichnung, die Menge und den Einzelpreis jedes bestellten Artikels aus.",
      loesung: "SELECT a.Bezeichnung, p.Menge, a.Preis\nFROM Bestellposition p\nJOIN Artikel a ON a.ArtikelNr = p.ArtikelNr\nWHERE p.BestellNr = 1008;",
      tipp: "Bestellposition kennt die ArtikelNr, die Bezeichnung steht in Artikel.",
      ru: "Нужные данные в двух таблицах — соединяем через общий столбец ArtikelNr." },
    { id: "j3", thema: "join", stufe: 2, titel: "Bestellwert", ordnung: true,
      text: "Berechnen Sie den Gesamtwert (Menge × Preis) jeder Bestellung. Geben Sie BestellNr und Gesamtwert aus, der höchste Wert zuerst.",
      loesung: "SELECT p.BestellNr, SUM(p.Menge * a.Preis) AS Gesamtwert\nFROM Bestellposition p\nJOIN Artikel a ON a.ArtikelNr = p.ArtikelNr\nGROUP BY p.BestellNr\nORDER BY Gesamtwert DESC;",
      tipp: "Erst verbinden, dann GROUP BY BestellNr und SUM(Menge * Preis).",
      ru: "JOIN + GROUP BY + SUM: сначала соединяем, потом группируем по заказу и суммируем." },
    { id: "j4", thema: "join", stufe: 2, titel: "LEFT JOIN mit 0",
      text: "Geben Sie alle Kategorien mit der Anzahl ihrer Artikel aus (Bezeichnung, Anzahl). Kategorien ohne Artikel sollen mit 0 erscheinen.",
      loesung: "SELECT k.Bezeichnung, COUNT(a.ArtikelNr) AS Anzahl\nFROM Kategorie k\nLEFT JOIN Artikel a ON a.KategorieNr = k.KategorieNr\nGROUP BY k.KategorieNr, k.Bezeichnung;",
      tipp: "LEFT JOIN behält alle Zeilen der linken Tabelle. COUNT(a.ArtikelNr) statt COUNT(*), sonst steht bei „Software“ 1.",
      ru: "LEFT JOIN оставляет все строки левой таблицы, даже без пары. COUNT(столбец справа) даст 0, COUNT(*) дал бы 1." },
    { id: "j5", thema: "join", stufe: 2, titel: "Kunden ohne Bestellung",
      text: "Geben Sie KundenNr und Name aller Kunden aus, die noch nie bestellt haben.",
      loesung: "SELECT k.KundenNr, k.Name\nFROM Kunde k\nLEFT JOIN Bestellung b ON b.KundenNr = k.KundenNr\nWHERE b.BestellNr IS NULL;",
      tipp: "LEFT JOIN und dann die Zeilen ohne Partner: WHERE b.BestellNr IS NULL. Mit NOT IN oder NOT EXISTS geht es auch.",
      ru: "«У кого нет ни одного…» = LEFT JOIN + WHERE правая_таблица.ключ IS NULL (или NOT EXISTS)." },
    { id: "j6", thema: "join", stufe: 3, titel: "Selbstbezug: Vorgesetzte",
      text: "Geben Sie für jeden Mitarbeiter seinen Namen und den Namen seines Vorgesetzten aus (Mitarbeiter, Vorgesetzter). Auch die Geschäftsleitung ohne Vorgesetzten soll erscheinen.",
      loesung: "SELECT m.Name AS Mitarbeiter, v.Name AS Vorgesetzter\nFROM Mitarbeiter m\nLEFT JOIN Mitarbeiter v ON v.PersNr = m.VorgesetzterNr;",
      tipp: "Dieselbe Tabelle zweimal mit verschiedenen Aliasen (m, v). LEFT JOIN, damit Frau Krause nicht wegfällt.",
      ru: "Таблица соединяется сама с собой: два псевдонима (m — сотрудник, v — начальник)." },
    { id: "j7", thema: "join", stufe: 3, titel: "Umsatz je Kunde mit HAVING",
      text: "Geben Sie Name und Umsatz (Summe aus Menge × Preis) aller Kunden aus, deren Umsatz über 1.000 € liegt. Stornierte Bestellungen zählen nicht.",
      loesung: "SELECT k.Name, SUM(p.Menge * a.Preis) AS Umsatz\nFROM Kunde k\nJOIN Bestellung b ON b.KundenNr = k.KundenNr\nJOIN Bestellposition p ON p.BestellNr = b.BestellNr\nJOIN Artikel a ON a.ArtikelNr = p.ArtikelNr\nWHERE b.Status <> 'storniert'\nGROUP BY k.KundenNr, k.Name\nHAVING SUM(p.Menge * a.Preis) > 1000;",
      tipp: "Vier Tabellen: Kunde – Bestellung – Bestellposition – Artikel. Storno raus mit WHERE, die Grenze mit HAVING.",
      ru: "Цепочка JOIN по ключам; «не считать отменённые» — WHERE, «больше 1000» по сумме — HAVING." },
    { id: "j8", thema: "join", stufe: 3, titel: "Umsatz je Kategorie",
      text: "Geben Sie für jede Kategorie (Bezeichnung) den Umsatz aus versandten Bestellungen aus. Kategorien ohne Umsatz müssen nicht erscheinen.",
      loesung: "SELECT k.Bezeichnung, SUM(p.Menge * a.Preis) AS Umsatz\nFROM Kategorie k\nJOIN Artikel a ON a.KategorieNr = k.KategorieNr\nJOIN Bestellposition p ON p.ArtikelNr = a.ArtikelNr\nJOIN Bestellung b ON b.BestellNr = p.BestellNr\nWHERE b.Status = 'versandt'\nGROUP BY k.KategorieNr, k.Bezeichnung;",
      tipp: "Kategorie → Artikel → Bestellposition → Bestellung. Nur Status 'versandt'.",
      ru: "Путь по ключам через четыре таблицы, фильтр по статусу, группировка по категории." },

    /* ------------------------------------------------------- Unterabfragen */
    { id: "u1", thema: "sub", stufe: 2, titel: "Über dem Durchschnitt",
      text: "Geben Sie Bezeichnung und Preis aller Artikel aus, die teurer sind als der Durchschnittspreis aller Artikel.",
      loesung: "SELECT Bezeichnung, Preis\nFROM Artikel\nWHERE Preis > (SELECT AVG(Preis) FROM Artikel);",
      tipp: "Aggregat im WHERE geht nicht direkt — aber als Unterabfrage in Klammern.",
      ru: "В WHERE нельзя написать AVG напрямую, но можно подзапрос в скобках: (SELECT AVG(…) FROM …)." },
    { id: "u2", thema: "sub", stufe: 2, titel: "NOT IN",
      text: "Geben Sie ArtikelNr und Bezeichnung aller Artikel aus, die noch nie bestellt wurden.",
      loesung: "SELECT ArtikelNr, Bezeichnung\nFROM Artikel\nWHERE ArtikelNr NOT IN (SELECT ArtikelNr FROM Bestellposition);",
      tipp: "Die Unterabfrage liefert alle bestellten ArtikelNr, NOT IN nimmt den Rest.",
      ru: "NOT IN (подзапрос) — все, кого нет в списке из подзапроса." },
    { id: "u3", thema: "sub", stufe: 3, titel: "EXISTS",
      text: "Geben Sie Name und Vorname aller Kölner Kunden aus, die mindestens eine offene Bestellung haben.",
      loesung: "SELECT k.Name, k.Vorname\nFROM Kunde k\nWHERE k.Ort = 'Köln'\n  AND EXISTS (SELECT * FROM Bestellung b\n              WHERE b.KundenNr = k.KundenNr AND b.Status = 'offen');",
      tipp: "EXISTS (Unterabfrage) ist wahr, sobald die Unterabfrage mindestens eine Zeile findet. Sie bezieht sich auf k aus der äußeren Abfrage.",
      ru: "EXISTS — «есть хотя бы одна строка». Подзапрос ссылается на внешнюю таблицу (коррелированный)." },
    { id: "u4", thema: "sub", stufe: 3, titel: "Spitzenverdiener je Abteilung",
      text: "Geben Sie für jede Abteilung den Mitarbeiter mit dem höchsten Gehalt aus (Abteilung, Name, Gehalt).",
      loesung: "SELECT m.Abteilung, m.Name, m.Gehalt\nFROM Mitarbeiter m\nWHERE m.Gehalt = (SELECT MAX(m2.Gehalt) FROM Mitarbeiter m2\n                  WHERE m2.Abteilung = m.Abteilung);",
      tipp: "Korrelierte Unterabfrage: das Maximum der eigenen Abteilung.",
      ru: "Подзапрос считает максимум для отдела текущей строки (m2.Abteilung = m.Abteilung)." },

    /* -------------------------------------------------------- Daten ändern */
    { id: "d1", thema: "dml", stufe: 1, art: "dml", titel: "INSERT",
      text: "Legen Sie einen neuen Kunden an: KundenNr 11, Emma Klein, Privatkundin (keine Firma), 50672 Köln, E-Mail emma.klein@posteo.de, registriert am 30.09.2026.",
      loesung: "INSERT INTO Kunde (KundenNr, Firma, Name, Vorname, PLZ, Ort, Email, Registriert)\nVALUES (11, NULL, 'Klein', 'Emma', '50672', 'Köln', 'emma.klein@posteo.de', '2026-09-30');",
      tipp: "INSERT INTO Tabelle (Spalten …) VALUES (Werte …); — PLZ ist Text ('50672'), das Datum als '2026-09-30'.",
      ru: "INSERT INTO таблица (столбцы) VALUES (значения) — порядок значений = порядок столбцов." },
    { id: "d2", thema: "dml", stufe: 1, art: "dml", titel: "UPDATE",
      text: "Alle Artikel der Kategorie „Zubehör“ (KategorieNr 3) werden um 5 % teurer. Ändern Sie die Preise.",
      loesung: "UPDATE Artikel\nSET Preis = Preis * 1.05\nWHERE KategorieNr = 3;",
      tipp: "UPDATE Tabelle SET Spalte = neuer Wert WHERE …; — ohne WHERE trifft es ALLE Zeilen.",
      ru: "UPDATE … SET … WHERE … — без WHERE изменятся все строки таблицы!" },
    { id: "d3", thema: "dml", stufe: 1, art: "dml", titel: "DELETE",
      text: "Löschen Sie den Kunden mit der KundenNr 10 (Paul Richter hat nie bestellt).",
      loesung: "DELETE FROM Kunde\nWHERE KundenNr = 10;",
      tipp: "DELETE FROM Tabelle WHERE …;",
      ru: "DELETE FROM … WHERE … — удаляет строки. Без WHERE удалит всё." },
    { id: "d4", thema: "dml", stufe: 3, art: "dml", titel: "UPDATE mit Unterabfrage",
      text: "Alle offenen Bestellungen von Kunden aus Köln wurden heute verschickt. Setzen Sie ihren Status auf „versandt“.",
      loesung: "UPDATE Bestellung\nSET Status = 'versandt'\nWHERE Status = 'offen'\n  AND KundenNr IN (SELECT KundenNr FROM Kunde WHERE Ort = 'Köln');",
      tipp: "Der Ort steht in Kunde, der Status in Bestellung → Unterabfrage mit IN.",
      ru: "В UPDATE нельзя просто JOIN (по стандарту) — берём подзапрос: KundenNr IN (SELECT …)." },
    { id: "d5", thema: "dml", stufe: 3, art: "dml", titel: "Löschen trotz Fremdschlüssel",
      text: "Löschen Sie alle stornierten Bestellungen vollständig aus der Datenbank.",
      loesung: "DELETE FROM Bestellposition\nWHERE BestellNr IN (SELECT BestellNr FROM Bestellung WHERE Status = 'storniert');\nDELETE FROM Bestellung\nWHERE Status = 'storniert';",
      tipp: "Referentielle Integrität: Solange Positionen auf die Bestellung verweisen, darf sie nicht gelöscht werden. Erst die Positionen, dann die Bestellung.",
      ru: "Ссылочная целостность: сначала удаляем строки, которые ссылаются (позиции), потом сам заказ." },

    /* ---------------------------------------------------- Tabellen anlegen */
    { id: "c1", thema: "ddl", stufe: 2, art: "ddl", titel: "CREATE TABLE",
      text: "Legen Sie die Tabelle Lieferant an: LieferantNr (ganze Zahl, Primärschlüssel), Firma (Text bis 60 Zeichen, Pflichtfeld), Ort (Text bis 40 Zeichen), Telefon (Text bis 20 Zeichen).",
      loesung: "CREATE TABLE Lieferant (\n  LieferantNr INTEGER PRIMARY KEY,\n  Firma       VARCHAR(60) NOT NULL,\n  Ort         VARCHAR(40),\n  Telefon     VARCHAR(20)\n);",
      ddl: { tabelle: "Lieferant", spalten: { LieferantNr: "int", Firma: "text", Ort: "text", Telefon: "text" },
             pk: ["LieferantNr"], notnull: ["Firma"], laenge: { Firma: 60, Ort: 40, Telefon: 20 } },
      tipp: "Spalte Datentyp [NOT NULL], … und PRIMARY KEY. Telefonnummern sind Text (führende 0, +49).",
      ru: "CREATE TABLE имя (столбец тип ограничения, …). Телефон — текст, не число (ведущий 0, +49)." },
    { id: "c2", thema: "ddl", stufe: 2, art: "ddl", titel: "ALTER TABLE mit Fremdschlüssel",
      vorher: LIEFERANT,
      text: "Die Tabelle Lieferant gibt es jetzt. Erweitern Sie die Tabelle Artikel um die Spalte LieferantNr (ganze Zahl), die als Fremdschlüssel auf Lieferant verweist.",
      loesung: "ALTER TABLE Artikel\nADD COLUMN LieferantNr INTEGER REFERENCES Lieferant(LieferantNr);",
      ddl: { tabelle: "Artikel", spalten: { LieferantNr: "int" }, alle: false,
             fk: [["LieferantNr", "Lieferant", "LieferantNr"]] },
      tipp: "ALTER TABLE Artikel ADD LieferantNr INT; danach ALTER TABLE Artikel ADD FOREIGN KEY (LieferantNr) REFERENCES Lieferant(LieferantNr); — oder beides in einem: ADD COLUMN … REFERENCES ….",
      ru: "ALTER TABLE … ADD — добавить столбец; FOREIGN KEY … REFERENCES — связать с другой таблицей." },
    { id: "c3", thema: "ddl", stufe: 3, art: "ddl", titel: "Zwischentabelle (n:m)",
      vorher: LIEFERANT,
      text: "Ein Artikel kann von mehreren Lieferanten kommen, ein Lieferant liefert mehrere Artikel. Legen Sie die Tabelle Lieferung an: LieferantNr und ArtikelNr bilden zusammen den Primärschlüssel und sind jeweils Fremdschlüssel. Dazu Einkaufspreis (Dezimalzahl mit 2 Nachkommastellen) und LieferzeitTage (ganze Zahl).",
      loesung: "CREATE TABLE Lieferung (\n  LieferantNr    INTEGER REFERENCES Lieferant(LieferantNr),\n  ArtikelNr      INTEGER REFERENCES Artikel(ArtikelNr),\n  Einkaufspreis  DECIMAL(8,2),\n  LieferzeitTage INTEGER,\n  PRIMARY KEY (LieferantNr, ArtikelNr)\n);",
      ddl: { tabelle: "Lieferung", spalten: { LieferantNr: "int", ArtikelNr: "int", Einkaufspreis: "dezimal", LieferzeitTage: "int" },
             pk: ["LieferantNr", "ArtikelNr"],
             fk: [["LieferantNr", "Lieferant", "LieferantNr"], ["ArtikelNr", "Artikel", "ArtikelNr"]] },
      tipp: "Zusammengesetzter Schlüssel: PRIMARY KEY (Spalte1, Spalte2) am Ende. Fremdschlüssel: FOREIGN KEY (Spalte) REFERENCES Tabelle(Spalte).",
      ru: "Связь n:m = отдельная таблица; её первичный ключ — из двух внешних ключей." },
    { id: "c4", thema: "ddl", stufe: 2, art: "view", titel: "Sicht (VIEW)",
      text: "Erstellen Sie eine Sicht (View) mit dem Namen KundenKoeln, die Name, Vorname und Email aller Kölner Kunden zeigt.",
      loesung: "CREATE VIEW KundenKoeln AS\nSELECT Name, Vorname, Email\nFROM Kunde\nWHERE Ort = 'Köln';",
      view: "KundenKoeln",
      tipp: "CREATE VIEW Name AS SELECT …; — danach kann man SELECT * FROM KundenKoeln schreiben.",
      ru: "VIEW — сохранённый запрос, с ним работают как с таблицей." }
  ];

  const api = { SCHEMA, TABELLEN, THEMEN, AUFGABEN };
  root.GENSQLDATEN = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
