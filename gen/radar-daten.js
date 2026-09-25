/* ============================================================================
   gen/radar-daten.js — welches Thema kam in welcher Prüfung dran?
   ----------------------------------------------------------------------------
   Aus der Themenanalyse „IHK_Pruefung_Themen.xlsx“ (Blätter „Teil 1“ und
   „Teil 2 FIAE“). Je Thema zwei Zeichenketten, eine Stelle je Prüfung:
     x = Thema kam dran, . = nicht, 2 = in zwei Aufgaben (nur AP2)
   alt = alte Ausbildungsordnung (Sommer 2013 … Sommer 2023, 21 Prüfungen)
   neu = neue AP1 (Herbst 2021 … Frühjahr 2026, 10 Prüfungen) — dieselben zehn
         Prüfungen, die in der App liegen, Reihenfolge wie `spalten`/`exams`.
   Die Spalte „Anzahl“ der Tabelle ist nicht übernommen: sie zählte teilweise
   falsch (Malware 28 statt 2). Gezählt wird hier aus den Kreuzen selbst.
   such = Suchmuster (klein geschrieben), mit dem gen/radar.js passende
          Aufgaben aus den IHK-Prüfungen und dem Azubi-Navigator findet.
   ap2 = laut Prüfungskatalog nur noch in Teil 2 (SQL, RAID).
   Erzeugt mit tools/radar_import.py — bei neuen Daten neu erzeugen.
   ========================================================================== */
(function (root) {
  const D = {
   "stand": "2026-09-25",
   "quelle": "Themenanalyse IHK_Pruefung_Themen.xlsx (Teil 1, Teil 2 FIAE)",
   "spalten": [
    "H21",
    "F22",
    "H22",
    "F23",
    "H23",
    "F24",
    "H24",
    "F25",
    "H25",
    "F26"
   ],
   "exams": [
    "ap1-2021-h",
    "ap1-2022-f",
    "ap1-2022-h",
    "ap1-2023-f",
    "ap1-2023-h",
    "ap1-2024-f",
    "ap1-2024-h",
    "ap1-2025-f",
    "ap1-2025-h",
    "ap1-2026-f"
   ],
   "altSpalten": "Sommer 2013 bis Sommer 2023 (alte Ausbildungsordnung, Teil 1 = „GA1“), 21 Prüfungen",
   "ap2Spalten": [
    "W21/22",
    "S22",
    "W22/23",
    "S23",
    "W23/24",
    "S24",
    "W24/25",
    "S25",
    "W25/26"
   ],
   "gruppen": {
    "kaufm": "Kaufmännisch & Recht",
    "projekt": "Projektmanagement",
    "sicher": "IT-Sicherheit & Datenschutz",
    "system": "IT-Systeme & Berechnungen",
    "netz": "Netzwerk",
    "software": "Software & Programmierung",
    "db": "Datenbanken",
    "sonst": "Sonstiges"
   },
   "teil1": [
    {
     "k": "angebotskalk",
     "t": "Angebotskalkulation",
     "g": "kaufm",
     "alt": ".x..xx.....x.x.......",
     "neu": "..........",
     "such": "angebotskalkulation|listenverkaufspreis|barverkaufspreis|zielverkaufspreis"
    },
    {
     "k": "handelskalk",
     "t": "Handelskalkulation",
     "g": "kaufm",
     "alt": "......x.....x..x.....",
     "neu": "..........",
     "such": "handelskalkulation|bezugspreis|listeneinkaufspreis|handelsspanne"
    },
    {
     "k": "industriekalk",
     "t": "Industriekalkulation",
     "g": "kaufm",
     "alt": "........xx..x........",
     "neu": "..........",
     "such": "industriekalkulation|herstellkosten|materialgemeinkosten|fertigungsgemeinkosten"
    },
    {
     "k": "kosten",
     "t": "Kostenkalkulation",
     "g": "kaufm",
     "alt": "...........xxxxx.x...",
     "neu": "xxxx.xxx..",
     "such": "kostenvergleich|laufende[nr]? kosten|gesamtkosten|kosten (pro|je) (monat|jahr|arbeitsplatz|stück)|anschaffungskosten|kosten.{0,40}berechnen|berechnen.{0,60}kosten|stückkosten|fixkosten|variable kosten|kostenvergleichsrechnung"
    },
    {
     "k": "bab",
     "t": "Betriebsabrechnungsbogen",
     "g": "kaufm",
     "alt": "......x..x.x.........",
     "neu": "..........",
     "such": "betriebsabrechnungsbogen|\\bbab\\b"
    },
    {
     "k": "deckungsbeitrag",
     "t": "Deckungsbeitragsrechnung",
     "g": "kaufm",
     "alt": ".....x....x..........",
     "neu": "..........",
     "such": "deckungsbeitrag|break.?even|gewinnschwelle"
    },
    {
     "k": "wagnis",
     "t": "Kalkulatorische Wagniskosten",
     "g": "kaufm",
     "alt": "....x................",
     "neu": "..........",
     "such": "wagnis"
    },
    {
     "k": "leasing",
     "t": "Finanzierung / Leasing oder Kauf",
     "g": "kaufm",
     "alt": "..x...........x.x.x.x",
     "neu": "...x..x...",
     "such": "leasing|finanzierung|kaufoption|ratenkauf|darlehen|kredit"
    },
    {
     "k": "lager",
     "t": "Lagerkennzahlen",
     "g": "kaufm",
     "alt": ".x........x..........",
     "neu": "..........",
     "such": "lagerkennzahl|meldebestand|lagerumschlag|mindestbestand|lagerdauer"
    },
    {
     "k": "wirtschaftlichkeit",
     "t": "Wirtschaftlichkeitsrechnung",
     "g": "kaufm",
     "alt": "..x.x..x..x.x........",
     "neu": "..........",
     "such": "wirtschaftlichkeit|amortisation|rentabilit|return on invest"
    },
    {
     "k": "buchhaltung",
     "t": "Buchhaltung",
     "g": "kaufm",
     "alt": ".........x...........",
     "neu": "..........",
     "such": "buchhaltung|buchungssatz|soll an haben"
    },
    {
     "k": "aufbauorg",
     "t": "Aufbauorganisation / Organigramm",
     "g": "kaufm",
     "alt": "x.x......x.x.x.......",
     "neu": "..........",
     "such": "organigramm|aufbauorganisation|stabsstelle|linienorganisation|matrixorganisation"
    },
    {
     "k": "kaufvertrag",
     "t": "Kaufvertrag & Störungen",
     "g": "kaufm",
     "alt": "............xx.......",
     "neu": ".....x..x.",
     "such": "kaufvertrag|lieferverzug|lieferungsverzug|mangelhafte lieferung|annahmeverzug|zahlungsverzug|nicht.?rechtzeitig|mängelrüge|gewährleistung"
    },
    {
     "k": "rechnung",
     "t": "Rechnung / Beleg prüfen",
     "g": "kaufm",
     "alt": ".....................",
     "neu": "........x.",
     "such": "\\brechnung(en|sbeleg|spositionen|sprüfung|sstellung|sbetrag)?\\b|\\bbeleg|skonto|pflichtangaben|umsatzsteuer"
    },
    {
     "k": "einkauf",
     "t": "Einkauf / Lager",
     "g": "kaufm",
     "alt": ".........x...........",
     "neu": "..........",
     "such": "einkauf|bestellmenge|bestellpunkt"
    },
    {
     "k": "marketing",
     "t": "Marketing",
     "g": "kaufm",
     "alt": "x.....xx.x....x......",
     "neu": "..x.......",
     "such": "marketing|werbung|marktforschung|preispolitik"
    },
    {
     "k": "swot",
     "t": "SWOT-Analyse",
     "g": "kaufm",
     "alt": "..............x...x..",
     "neu": "..........",
     "such": "swot"
    },
    {
     "k": "angebotsvergleich",
     "t": "Angebotsvergleich",
     "g": "kaufm",
     "alt": ".............x.......",
     "neu": "..xx......",
     "such": "angebotsvergleich|angebote? .{0,30}vergleich|günstigste[sn]? angebot|rabatt"
    },
    {
     "k": "marktformen",
     "t": "Marktformen",
     "g": "kaufm",
     "alt": ".....................",
     "neu": "..x.......",
     "such": "marktform|monopol|oligopol|polypol"
    },
    {
     "k": "nutzwert",
     "t": "Nutzwertanalyse",
     "g": "projekt",
     "alt": ".x..xx....x...x......",
     "neu": "..xx.x.x..",
     "such": "nutzwert"
    },
    {
     "k": "projekt",
     "t": "Projektplanung & -merkmale",
     "g": "projekt",
     "alt": "........x.xx.x.......",
     "neu": "..x...x...",
     "such": "projektmerkmal|merkmale eines projekt|projektplanung|projektphase|projektziel|magische[sn]? dreieck|projektauftrag|stakeholder|kick.?off"
    },
    {
     "k": "lastenheft",
     "t": "Lasten- und Pflichtenheft",
     "g": "projekt",
     "alt": ".............x......x",
     "neu": ".x.x..x...",
     "such": "lastenheft|pflichtenheft"
    },
    {
     "k": "psp",
     "t": "Projektstrukturplan",
     "g": "projekt",
     "alt": ".......x.............",
     "neu": "..........",
     "such": "projektstrukturplan|arbeitspaket"
    },
    {
     "k": "epk",
     "t": "EPK",
     "g": "projekt",
     "alt": "xx..x................",
     "neu": "..........",
     "such": "\\bepk\\b|ereignisgesteuerte"
    },
    {
     "k": "netzplan",
     "t": "Netzplan",
     "g": "projekt",
     "alt": "...x...xx.x..........",
     "neu": "x......x.x",
     "such": "netzplan|kritische[rn]? pfad|gesamtpuffer|freie[rn]? puffer|\\bfaz\\b"
    },
    {
     "k": "gantt",
     "t": "Gantt-Diagramm",
     "g": "projekt",
     "alt": "...........x.x.......",
     "neu": "....x.....",
     "such": "gantt|balkendiagramm"
    },
    {
     "k": "smart",
     "t": "SMART-Ziele",
     "g": "projekt",
     "alt": ".....................",
     "neu": "x.........",
     "such": "\\bsmart\\b"
    },
    {
     "k": "backup",
     "t": "Datensicherung (Backup)",
     "g": "sicher",
     "alt": "xx.xxx..xx.xxxxxx....",
     "neu": "....x.xxx.",
     "such": "datensicherung|backup|vollsicherung|inkrementell|differenziell|generationenprinzip|3-2-1|großvater"
    },
    {
     "k": "verschluesselung",
     "t": "Verschlüsselung",
     "g": "sicher",
     "alt": "................x....",
     "neu": "....x..x..",
     "such": "verschlüssel|symmetrisch|asymmetrisch|öffentliche[nr]? schlüssel|private[nr]? schlüssel|public key|hybride"
    },
    {
     "k": "signatur",
     "t": "Elektronische Signatur & Zertifikate",
     "g": "sicher",
     "alt": ".....................",
     "neu": "........x.",
     "such": "signatur|zertifikat|hashwert|hashfunktion"
    },
    {
     "k": "schutz",
     "t": "IT-Sicherheit & Schutzziele",
     "g": "sicher",
     "alt": ".................xx.x",
     "neu": "x..x..xxx.",
     "such": "schutzziel|vertraulichkeit|integrität|verfügbarkeit|grundschutz|\\bbsi\\b|firewall|zugangskontrolle|zutrittskontrolle|zugriffskontrolle|passwort|authentifizierung|zwei-faktor|multi-faktor"
    },
    {
     "k": "datenschutz",
     "t": "Datenschutz (DSGVO)",
     "g": "sicher",
     "alt": ".............x.xx....",
     "neu": "....x...x.",
     "such": "datenschutz|dsgvo|personenbezogen|\\bbdsg\\b|auftragsverarbeitung"
    },
    {
     "k": "video",
     "t": "Videokonferenzsysteme",
     "g": "system",
     "alt": "...............x.....",
     "neu": "..........",
     "such": "videokonferenz"
    },
    {
     "k": "support",
     "t": "Support & Service",
     "g": "system",
     "alt": "................x....",
     "neu": "....x.....",
     "such": "support|ticket|helpdesk|service.?level|\\bsla\\b|first.?level|störungsmeldung"
    },
    {
     "k": "speicher",
     "t": "Berechnungen: Speicher & Einheiten",
     "g": "system",
     "alt": ".....xx....xxxxxxxx.x",
     "neu": "..x..x..xx",
     "such": "speicher(bedarf|kapazität|platz)|\\b(kib|mib|gib|tib|kibibyte|mebibyte|gibibyte|tebibyte)\\b|farbtiefe|bildauflösung|auflösung von|farben .{0,20}darstellen"
    },
    {
     "k": "energie",
     "t": "Energiekosten",
     "g": "system",
     "alt": ".....................",
     "neu": "x....x....",
     "such": "energiekosten|stromkosten|\\bkwh\\b|stromverbrauch|energieverbrauch"
    },
    {
     "k": "uebertragung",
     "t": "Datenübertragung berechnen",
     "g": "system",
     "alt": "............x...x.x..",
     "neu": ".x...x...x",
     "such": "übertragungs(dauer|zeit|rate)|download|upload|bandbreite|mbit/s|mbps|datenrate|speedtest"
    },
    {
     "k": "usv",
     "t": "USV",
     "g": "system",
     "alt": "...........x..x..x..x",
     "neu": "..........",
     "such": "\\busv\\b|unterbrechungsfreie"
    },
    {
     "k": "englisch",
     "t": "Englisch / Übersetzen",
     "g": "sonst",
     "alt": "xxxx...x.xxxxxxxxxx..",
     "neu": ".x.....x.x",
     "such": "übersetz|englisch|english|translate"
    },
    {
     "k": "homeoffice",
     "t": "IT im Homeoffice",
     "g": "system",
     "alt": ".....................",
     "neu": "....x.....",
     "such": "home.?office|telearbeit|mobiles arbeiten"
    },
    {
     "k": "begriffe",
     "t": "Allgemeine IT-Begriffe",
     "g": "sonst",
     "alt": ".....................",
     "neu": ".x...x...."
    },
    {
     "k": "bs",
     "t": "Betriebssysteme",
     "g": "system",
     "alt": ".....................",
     "neu": "...x......",
     "such": "betriebssystem"
    },
    {
     "k": "osi",
     "t": "OSI-Modell",
     "g": "netz",
     "alt": "...........x.........",
     "neu": ".x...x....",
     "such": "\\bosi\\b|osi-"
    },
    {
     "k": "raid",
     "t": "RAID",
     "g": "system",
     "alt": "............x...x.x..",
     "neu": "x.x.......",
     "such": "\\braid\\b",
     "ap2": true
    },
    {
     "k": "programmierung",
     "t": "Programmierung (Grundlagen)",
     "g": "software",
     "alt": ".x.........x......x..",
     "neu": "......xx.x",
     "such": "programmier|quellcode|variable|konstante|compiler|interpreter|objektorient|prozedural|datentyp"
    },
    {
     "k": "struktogramm",
     "t": "Struktogramm",
     "g": "software",
     "alt": "............xx..x.x.x",
     "neu": ".xx.......",
     "such": "struktogramm|nassi"
    },
    {
     "k": "oop",
     "t": "Klassendiagramm & OOP",
     "g": "software",
     "alt": "...........x....x....",
     "neu": "...x.....x",
     "such": "klassendiagramm|objektorient|vererbung|kapselung|\\bklasse\\b|\\bobjekt(e)?\\b"
    },
    {
     "k": "algorithmus",
     "t": "Algorithmus / Pseudocode",
     "g": "software",
     "alt": ".............xx.x.x..",
     "neu": "x.....xxxx",
     "such": "algorithmus|pseudocode|quellcode|schleife|funktion .{0,40}\\("
    },
    {
     "k": "schreibtisch",
     "t": "Schreibtischtest",
     "g": "software",
     "alt": ".....................",
     "neu": ".......xxx",
     "such": "schreibtischtest|führen sie .{0,30}test durch|rückgabe der funktion|rückgabewert"
    },
    {
     "k": "usecase",
     "t": "UML-Anwendungsfalldiagramm",
     "g": "software",
     "alt": "................x....",
     "neu": "....x.x...",
     "such": "anwendungsfall|use.?case"
    },
    {
     "k": "aktivitaet",
     "t": "UML-Aktivitätsdiagramm",
     "g": "software",
     "alt": ".....................",
     "neu": "........x.",
     "such": "aktivitätsdiagramm"
    },
    {
     "k": "web",
     "t": "Webentwicklung",
     "g": "software",
     "alt": ".....................",
     "neu": ".......x..",
     "such": "webseite|website|\\bhtml\\b|\\bcss\\b|javascript|webanwendung|responsive|\\bseo\\b"
    },
    {
     "k": "datenbank",
     "t": "Datenbank-Grundlagen",
     "g": "db",
     "alt": "xx..xx..xxxxx........",
     "neu": ".......xx.",
     "such": "datenbank|fremdschlüssel|primärschlüssel|relational"
    },
    {
     "k": "erm",
     "t": "ER-Modell",
     "g": "db",
     "alt": "...............x.....",
     "neu": "..x.x.x.xx",
     "such": "entity|er-diagramm|er-modell|datenmodell|kardinalität|entität"
    },
    {
     "k": "relmodell",
     "t": "Relationales Modell",
     "g": "db",
     "alt": "...........xx....xx..",
     "neu": "..........",
     "such": "relationale[sn]? (daten)?modell|tabellenmodell|normalform|normalisier"
    },
    {
     "k": "sql",
     "t": "SQL",
     "g": "db",
     "alt": "x.xx.....x..xx...xx.x",
     "neu": "..xxx.....",
     "such": "\\bsql\\b",
     "ap2": true
    },
    {
     "k": "ip",
     "t": "IPv4 & IPv6 / Subnetting",
     "g": "netz",
     "alt": "...........xxx..x....",
     "neu": "..x..xxxxx",
     "such": "ipv4|ipv6|ip-adresse|subnetz|netzadresse|broadcast|präfix|\\bcidr\\b"
    },
    {
     "k": "netzwerk",
     "t": "Netzwerk & Fehlersuche",
     "g": "netz",
     "alt": "xxxxxxx.xxxxxxx.x...x",
     "neu": ".....xxxxx",
     "such": "netzwerk|switch|router|\\blan\\b|\\bping\\b|ipconfig|\\bdhcp\\b|\\bdns\\b|gateway|mac-adresse|\\barp\\b|tracert|nslookup"
    },
    {
     "k": "cloud",
     "t": "Cloud (IaaS/PaaS/SaaS)",
     "g": "netz",
     "alt": ".......x.............",
     "neu": "..........",
     "such": "cloud|\\bsaas\\b|\\biaas\\b|\\bpaas\\b"
    },
    {
     "k": "vpn",
     "t": "VPN",
     "g": "netz",
     "alt": "...............x.....",
     "neu": "....xx....",
     "such": "\\bvpn\\b|virtual private"
    },
    {
     "k": "fileserver",
     "t": "File-Server / NAS",
     "g": "netz",
     "alt": "..........xx..x......",
     "neu": "..........",
     "such": "file.?server|\\bnas\\b|dateiserver"
    },
    {
     "k": "wlan",
     "t": "WLAN",
     "g": "netz",
     "alt": ".....................",
     "neu": ".x.....x..",
     "such": "wlan|\\bwpa|access.?point|\\bssid\\b"
    },
    {
     "k": "virtualisierung",
     "t": "Virtualisierung",
     "g": "system",
     "alt": "...........x..xx.x..x",
     "neu": "..........",
     "such": "virtualisier|hypervisor|virtuelle[nr]? maschine"
    },
    {
     "k": "hardware",
     "t": "Hardware & Schnittstellen",
     "g": "system",
     "alt": ".....................",
     "neu": ".x...xxx..",
     "such": "hardware|prozessor|\\bcpu\\b|arbeitsspeicher|\\bram\\b|mainboard|netzteil|grafikkarte|schnittstelle|\\bssd\\b|\\bhdd\\b|\\busb\\b|displayport|hdmi|taktfrequenz"
    },
    {
     "k": "hwsw",
     "t": "Hardware-/Software-Auswahl",
     "g": "system",
     "alt": ".........x...xxx.....",
     "neu": "..........",
     "such": "hardware.{0,20}software|softwareauswahl"
    },
    {
     "k": "malware",
     "t": "Malware & Phishing",
     "g": "sicher",
     "alt": ".....................",
     "neu": ".....xx...",
     "such": "malware|phishing|virus|viren|trojaner|ransomware|\\bwurm|schadsoftware|social engineering"
    },
    {
     "k": "lizenz",
     "t": "Lizenzmodelle",
     "g": "kaufm",
     "alt": ".....................",
     "neu": ".......x..",
     "such": "lizenz|open.?source|pay.?per.?use|subskription|abonnement|\\beula\\b|freeware"
    },
    {
     "k": "ki",
     "t": "Einsatz von KI",
     "g": "software",
     "alt": ".....................",
     "neu": ".......x..",
     "such": "\\bki\\b|künstliche[rn]? intelligenz|chatbot|machine learning|\\bki-"
    },
    {
     "k": "strom",
     "t": "Leistung P = U · I",
     "g": "system",
     "alt": ".....................",
     "neu": "........xx",
     "such": "p ?= ?u|leistungsaufnahme|\\bwatt\\b|\\bvolt\\b|ampere|stromstärke|\\bpoe\\b|netzteil"
    },
    {
     "k": "ergonomie",
     "t": "Ergonomischer Arbeitsplatz",
     "g": "system",
     "alt": ".....................",
     "neu": ".........x",
     "such": "ergonom|bildschirmarbeit|körperhaltung"
    },
    {
     "k": "daisy",
     "t": "Daisy-Chaining (Monitore)",
     "g": "system",
     "alt": ".....................",
     "neu": ".........x",
     "such": "daisy|\\bmst\\b|thunderbolt|displayport"
    }
   ],
   "ap2": [
    {
     "t": "Klassendiagramm OOP",
     "alt": "xxxxxxxxxxx.x",
     "neu": "xx2x.xxx."
    },
    {
     "t": "Algorithmus erstellen",
     "alt": "xxxxxxxxxxx.x",
     "neu": "xx2xxxxx2"
    },
    {
     "t": "Testverfahren / Schreibtischtest",
     "alt": ".............",
     "neu": "xx2xxx.x2"
    },
    {
     "t": "Software Qualität",
     "alt": "..x..........",
     "neu": "x..x.x..."
    },
    {
     "t": "Entwurfsmuster",
     "alt": ".............",
     "neu": "......xx."
    },
    {
     "t": "UML Aktivität",
     "alt": "x......x....x",
     "neu": "xxxxxx.x."
    },
    {
     "t": "UML Anwendungsfall",
     "alt": "........xx...",
     "neu": "x...xx..x"
    },
    {
     "t": "UML Sequenz",
     "alt": "...xx.x.xx...",
     "neu": ".x..xx.x."
    },
    {
     "t": "UML Zustand",
     "alt": "..x..x...xx..",
     "neu": "..xx..x.2"
    },
    {
     "t": "Relationales Datenbankmodell",
     "alt": "xx..xxxxx...x",
     "neu": "xx2xx.xxx"
    },
    {
     "t": "Entity Relationship Modell",
     "alt": "..x......xx..",
     "neu": "x.2.xx.x."
    },
    {
     "t": "SQL & Allgemeines",
     "alt": "xxxxxxxxxxx.x",
     "neu": "xx2xxxxxx"
    },
    {
     "t": "Datenanomalien",
     "alt": ".............",
     "neu": "........x"
    },
    {
     "t": "Normalformen",
     "alt": ".....x......x",
     "neu": "...x....x"
    },
    {
     "t": "NoSQL",
     "alt": ".............",
     "neu": ".xx.x...."
    },
    {
     "t": "Transaktionen (ACID)",
     "alt": ".............",
     "neu": "....x...."
    },
    {
     "t": "Netzplan",
     "alt": ".xxx..x......",
     "neu": "........."
    },
    {
     "t": "Gantt",
     "alt": "...x.........",
     "neu": "........."
    },
    {
     "t": "Lasten- & Pflichtenheft",
     "alt": "...x.........",
     "neu": "........."
    },
    {
     "t": "Projektstrukturplan",
     "alt": "....x........",
     "neu": "........."
    },
    {
     "t": "Anforderungsanalyse",
     "alt": ".....x.......",
     "neu": "........x"
    },
    {
     "t": "Machbarkeitsanalyse",
     "alt": ".............",
     "neu": "........x"
    },
    {
     "t": "Nutzwertanalyse",
     "alt": ".....x.......",
     "neu": "........."
    },
    {
     "t": "Vorgehensmodell",
     "alt": ".............",
     "neu": ".xx...x.x"
    },
    {
     "t": "Anforderungen (Nicht-)Funktional",
     "alt": ".............",
     "neu": ".xxx....."
    },
    {
     "t": "Befürchtungen & Maßnahmen",
     "alt": ".............",
     "neu": ".x......."
    },
    {
     "t": "Projektrisiken",
     "alt": ".............",
     "neu": "...x....x"
    },
    {
     "t": "Stakeholder",
     "alt": ".............",
     "neu": "....xxx.."
    },
    {
     "t": "User Stories",
     "alt": ".............",
     "neu": "....x...."
    },
    {
     "t": "Verschlüsselung",
     "alt": ".............",
     "neu": "x.xx....x"
    },
    {
     "t": "Datensicherheit Datenschutz",
     "alt": ".............",
     "neu": ".xx..xx.."
    },
    {
     "t": "Service & Support",
     "alt": ".............",
     "neu": ".x......."
    },
    {
     "t": "Datenqualität",
     "alt": ".............",
     "neu": "......x.."
    },
    {
     "t": "Excel",
     "alt": ".............",
     "neu": "...x....."
    },
    {
     "t": "MVC",
     "alt": "......x......",
     "neu": "........."
    },
    {
     "t": "Wiki CMS",
     "alt": "......x......",
     "neu": "........."
    },
    {
     "t": "3-Schichten-Architektur",
     "alt": ".............",
     "neu": "..x......"
    },
    {
     "t": "Open Source",
     "alt": ".............",
     "neu": "..x......"
    },
    {
     "t": "Benutzerschnittstellen GUI",
     "alt": ".............",
     "neu": "..x.xx..."
    },
    {
     "t": "XML",
     "alt": ".............",
     "neu": "..x.....x"
    },
    {
     "t": "Green IT",
     "alt": ".............",
     "neu": "....x...."
    },
    {
     "t": "JSON",
     "alt": ".............",
     "neu": "....xx..."
    },
    {
     "t": "Speicherbedarf berechnen",
     "alt": ".............",
     "neu": "....x...."
    },
    {
     "t": "Versionsverwaltung",
     "alt": ".............",
     "neu": "x........"
    },
    {
     "t": "Programmiersprachen",
     "alt": ".............",
     "neu": "x........"
    },
    {
     "t": "E-Service-Plattform",
     "alt": ".............",
     "neu": ".....x..."
    },
    {
     "t": "REST-API",
     "alt": ".............",
     "neu": ".....x..."
    },
    {
     "t": "HTTP",
     "alt": ".............",
     "neu": ".....xx.."
    },
    {
     "t": "LAN/SAN/WAN",
     "alt": ".............",
     "neu": "......x.."
    },
    {
     "t": "IoT",
     "alt": ".............",
     "neu": "......x.."
    },
    {
     "t": "Ethernet",
     "alt": ".............",
     "neu": "......x.."
    },
    {
     "t": "IP",
     "alt": ".............",
     "neu": "......x.."
    },
    {
     "t": "eInvoice",
     "alt": ".............",
     "neu": "........x"
    }
   ]
  };
  root.IHK_RADAR = D;
  if (typeof module === "object" && module.exports) module.exports = D;
})(typeof window !== "undefined" ? window : globalThis);
