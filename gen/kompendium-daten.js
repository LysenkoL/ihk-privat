/* ============================================================================
   gen/kompendium-daten.js — Verzeichnis des AP1-Kompendiums
   ----------------------------------------------------------------------------
   Nur die Liste der Themen mit ihren Merkmalen (Gebiet, Thema, Unterthema,
   Stand, Kurznotiz). Der eigentliche Text steht je Thema in gen/komp/<id>.js
   und wird erst beim Öffnen nachgeladen — siehe gen/kompendium.js.

   Quelle: geteilte Notion-Sammlung „Prüfungsvorbereitung“ (Kurskollegin,
   FIAE). Lesekopie vom 13.09.2026; die Originalseiten wurden nicht verändert.
   ========================================================================== */
"use strict";

window.KOMP_THEMEN = [
 {
  "id": "osi-referenzmodell",
  "nr": "1",
  "titel": "OSI-Referenzmodell",
  "ap": "2 Informieren und Beraten",
  "thema": "Netzwerk- & Internettechnologien",
  "unter": "OSI",
  "notiz": "OSI-Überblick ergänzt: Schichtenmodell, Kapselung, Adressen, Geräte, TCP/IP-Vergleich, Fehlersuche und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "definition-und-klassifikation-von-it-systemen",
  "nr": "2",
  "titel": "Definition und Klassifikation von IT-Systemen",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "IT-Systeme",
  "unter": "EVA-Prinzip,IT-System Kriterien,Schutzziele IT,phys. vs. virt. Systeme,On-Premise,Cloud-Bereitstellung",
  "notiz": "Ausgearbeitet als AP1-Kompendium: Definition und Klassifikation von IT-Systemen mit Hardware, Software, Daten, Netzwerk, EVA/EVAS, Klassifikation nach Größe, Einsatzzweck, Benutzerzahl, Betriebsmodell, physisch/virtuell/Cloud, Bewertungskriterien, Schutzzielen, Protokollen, Musteraufgaben und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "hardwarekomponenten",
  "nr": "3",
  "titel": "Hardwarekomponenten",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "IT-Systeme",
  "unter": "Hardware",
  "notiz": "",
  "stand": "Nicht gelernt"
 },
 {
  "id": "protokolle",
  "nr": "4",
  "titel": "Protokolle",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "Netzwerk- & Internettechnologien",
  "unter": "",
  "notiz": "Ausgearbeitet als AP1-Kompendium: Protokolle im OSI-Modell mit Prüfung der Fachbuchliste, Korrekturen zu IEEE 802.4/802.5, PPPoE und TCP-Bezeichnung, Ergänzungen moderner Protokolle wie ARP, ICMP, IPv6, VLAN, TLS, HTTP/HTTPS, SMTP/IMAP/POP3, SSH, SNMP, NTP, LDAP, RDP, REST sowie Ports, Musteraufgaben und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "berechnungen",
  "nr": "5",
  "titel": "Berechnungen",
  "ap": "0 Praktisches",
  "thema": "",
  "unter": "",
  "notiz": "Ausgearbeitet als AP1-Kompendium: Berechnungen mit Bit/Byte, Speichergrößen, SI-/IEC-Einheiten, Speicherbedarf, Datenübertragung, Subnetting, Prozentrechnung, Dreisatz, Wirtschaftlichkeit, Abschreibungszeitrechnungen, Arbeitszeitberechnungen für Migrationen, Nutzwertanalyse, elektrischer Leistung, Verfügbarkeit, Lösungswegen und Bemerkungen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "usv-unterbrechungsfreie-stromversorgung",
  "nr": "6",
  "titel": "USV - Unterbrechungsfreie Stromversorgung",
  "ap": "",
  "thema": "",
  "unter": "",
  "notiz": "Siehe Heft",
  "stand": "Bearbeitet"
 },
 {
  "id": "firewall",
  "nr": "7",
  "titel": "Firewall",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "Netzwerk- & Internettechnologien",
  "unter": "Firewall",
  "notiz": "Aufgaben Firewall",
  "stand": "Bearbeitet"
 },
 {
  "id": "gewa-hrleistung-wartungsvertra-ge",
  "nr": "8",
  "titel": "Gewährleistung & Wartungsverträge",
  "ap": "7 Auftragsabschluss",
  "thema": "",
  "unter": "",
  "notiz": "Ausgearbeitet als AP1-Kompendium: Gewährleistungspflichten, Mängelrechte, Garantie-Abgrenzung, Wartungsverträge, SLA/SLO/KPI, Support-Level 1st/2nd/3rd, Ticketsystem, Priorisierung, Wartungsfenster, Protokollvorschlag und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "abnahme-u-bergabe",
  "nr": "9",
  "titel": "Abnahme & Übergabe",
  "ap": "7 Auftragsabschluss",
  "thema": "",
  "unter": "",
  "notiz": "Ausgearbeitet als AP1-Kompendium: Abnahme und Übergabe mit Funktionstest, Abnahmetest, Abnahmekriterien, Abnahmeprotokoll, Mängelliste, Übergabedokumentation, Einweisung der Anwender, Übergabe an Betrieb/Support, Checklisten und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "verschlu-sselung",
  "nr": "10",
  "titel": "Verschlüsselung",
  "ap": "6 IT-Sicherheit",
  "thema": "",
  "unter": "",
  "notiz": "Ausgearbeitet als AP1-Kompendium: symmetrische Verschlüsselung mit AES/DES/3DES, asymmetrische Verschlüsselung mit RSA, hybride Verfahren, Zertifikate, PKI, TLS/SSL, Hashfunktionen, Passwort-Hashing, digitale Signaturen und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "datensicherungskonzepte",
  "nr": "11",
  "titel": "Datensicherungskonzepte",
  "ap": "6 IT-Sicherheit",
  "thema": "",
  "unter": "",
  "notiz": "Ausgearbeitet als AP1-Kompendium: Vollbackup, differenzielles und inkrementelles Backup, 3-2-1-Regel, RTO, RPO, RAID-Level, Restore-Tests, Backup-Protokolle, Ransomware-Schutz und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "dsgvo-grundlagen",
  "nr": "12",
  "titel": "DSGVO-Grundlagen",
  "ap": "6 IT-Sicherheit",
  "thema": "",
  "unter": "",
  "notiz": "Ausgearbeitet als AP1-Kompendium: DSGVO-Grundlagen, Art. 5, Datenschutzprinzipien, personenbezogene Daten, Rechtsgrundlagen, Einwilligung, Betroffenenrechte, Datenschutzbeauftragter, TOMs, Privacy by Design/Default und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "schutzmassnahmen-firewall",
  "nr": "13",
  "titel": "Schutzmaßnahmen & Firewall",
  "ap": "6 IT-Sicherheit",
  "thema": "",
  "unter": "Firewall",
  "notiz": "Ausgearbeitet als AP1-Kompendium: Schutzmaßnahmen und Firewall mit Paketfilter, Stateful Inspection, Proxy-Firewall, DMZ, IDS/IPS, Antivirus, Patch-Management, Protokollen, Firewall-Regeln, Protokollierung und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "bedrohungsszenarien",
  "nr": "14",
  "titel": "Bedrohungsszenarien",
  "ap": "6 IT-Sicherheit",
  "thema": "",
  "unter": "",
  "notiz": "Ausgearbeitet als AP1-Kompendium: Bedrohungsszenarien mit Malware, Viren, Trojanern, Ransomware, Würmern, Phishing, Social Engineering, DoS/DDoS, Man-in-the-Middle, SQL-Injection, Incident Response, Protokollvorschlag und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "schutzziele-cia-prinzip",
  "nr": "15",
  "titel": "Schutzziele (CIA-Prinzip)",
  "ap": "6 IT-Sicherheit",
  "thema": "",
  "unter": "Schutzziele IT",
  "notiz": "Vertraulichkeit (Confidentiality), Integrität (Integrity), Verfügbarkeit (Availability); + Authentizität, Nichtabstreitbarkeit",
  "stand": "Nicht gelernt"
 },
 {
  "id": "qualita-tskriterien-nach-iso-25010",
  "nr": "16",
  "titel": "Qualitätskriterien nach ISO 25010",
  "ap": "5 Durchführen & Dokumentieren von Qualitätssichernden Maßnahmen",
  "thema": "",
  "unter": "",
  "notiz": "Ausgearbeitet als AP1-Kompendium: ISO/IEC 25010, funktionale Eignung, Zuverlässigkeit, Benutzbarkeit, Leistungseffizienz, Wartbarkeit, Portabilität, Sicherheit, Kompatibilität, Qualitätssicherung und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "testarten",
  "nr": "17",
  "titel": "Testarten",
  "ap": "5 Durchführen & Dokumentieren von Qualitätssichernden Maßnahmen",
  "thema": "",
  "unter": "",
  "notiz": "Ausgearbeitet als AP1-Kompendium: Unit-Test, Integrationstest, Systemtest, Abnahmetest, Regressionstest, Lasttest, Stresstest, Testprotokolle, V-Modell, TDD und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "softwaretestmethoden",
  "nr": "18",
  "titel": "Softwaretestmethoden",
  "ap": "5 Durchführen & Dokumentieren von Qualitätssichernden Maßnahmen",
  "thema": "",
  "unter": "",
  "notiz": "Ausgearbeitet als AP1-Kompendium: Blackbox-Test, Whitebox-Test, Greybox-Test, Testmethoden vs. Testarten, Grenzwertanalyse, Testprotokolle, Qualitätssicherung und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "sql-grundlagen",
  "nr": "19",
  "titel": "SQL-Grundlagen",
  "ap": "4 Entwickeln erstellen & Betreuen IT-Lösungen",
  "thema": "",
  "unter": "",
  "notiz": "Ausgearbeitet als AP1-Kompendium: SQL-Grundlagen, SELECT/FROM/WHERE/JOIN/GROUP BY/ORDER BY, DDL/DML/DCL/TCL, Aggregatfunktionen, Transaktionen, Sicherheit, Indizes und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "datenbankgrundlagen-er-modell",
  "nr": "20",
  "titel": "Datenbankgrundlagen & ER-Modell",
  "ap": "4 Entwickeln erstellen & Betreuen IT-Lösungen",
  "thema": "",
  "unter": "",
  "notiz": "Ausgearbeitet als AP1-Kompendium: Datenbankgrundlagen, ER-Modell, Entitäten, Attribute, Beziehungen, Kardinalitäten, PK/FK, Normalisierung, Anomalien und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "grundlagen-oop",
  "nr": "21",
  "titel": "Grundlagen OOP",
  "ap": "4 Entwickeln erstellen & Betreuen IT-Lösungen",
  "thema": "",
  "unter": "",
  "notiz": "Ausgearbeitet als AP1-Kompendium: OOP-Grundlagen, Klassen, Objekte, Attribute, Methoden, Kapselung, Vererbung, Polymorphismus, Abstraktion, UML-Klassendiagramm und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "algorithmen-ablaufdiagramme",
  "nr": "22",
  "titel": "Algorithmen & Ablaufdiagramme",
  "ap": "4 Entwickeln erstellen & Betreuen IT-Lösungen",
  "thema": "",
  "unter": "",
  "notiz": "Ausgearbeitet als AP1-Kompendium: Algorithmen, PAP, Struktogramm, Pseudocode, Sequenz, Selektion, Iteration, Schreibtischtest, UML-Aktivitätsdiagramm und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "netzwerktopologien",
  "nr": "23",
  "titel": "Netzwerktopologien",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "Netzwerk- & Internettechnologien",
  "unter": "",
  "notiz": "Stern (häufigste), Ring, Bus, Baum, Vollvermascht; Vor-/Nachteile je Topologie",
  "stand": "Nicht gelernt"
 },
 {
  "id": "wlan-vpn",
  "nr": "24",
  "titel": "WLAN & VPN",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "Netzwerk- & Internettechnologien",
  "unter": "",
  "notiz": "IEEE 802.11 (a/b/g/n/ac/ax=Wi-Fi 6), WPA2/WPA3; VPN-Tunnel, IPSec, SSL-VPN, Site-to-Site vs. Remote",
  "stand": "Bearbeitet"
 },
 {
  "id": "netzwerkkomponenten",
  "nr": "25",
  "titel": "Netzwerkkomponenten",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "Netzwerk- & Internettechnologien",
  "unter": "",
  "notiz": "Router (L3), Switch (L2), Hub (L1), Bridge (L2), Repeater (L1), Access Point, Modem, Proxy",
  "stand": "Bearbeitet"
 },
 {
  "id": "netzwerkprotokolle",
  "nr": "26",
  "titel": "Netzwerkprotokolle",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "Netzwerk- & Internettechnologien",
  "unter": "",
  "notiz": "HTTP/HTTPS (80/443), FTP (21), SMTP (25), POP3 (110), IMAP (143), DNS (53), DHCP (67/68), SSH (22)",
  "stand": "Bearbeitet"
 },
 {
  "id": "ip-adressen-subnetting",
  "nr": "27",
  "titel": "IP-Adressen & Subnetting",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "Netzwerk- & Internettechnologien",
  "unter": "",
  "notiz": "IPv4 (Klassen A/B/C), IPv6; Subnetzmaske, CIDR (/24), private Adressbereiche, NAT",
  "stand": "Bearbeitet"
 },
 {
  "id": "tcp-ip-modell",
  "nr": "28",
  "titel": "TCP/IP-Modell",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "Netzwerk- & Internettechnologien",
  "unter": "",
  "notiz": "4 Schichten: Netzzugang, Internet, Transport, Anwendung; Vergleich mit OSI; TCP vs. UDP",
  "stand": "Bearbeitet"
 },
 {
  "id": "eva-prinzip",
  "nr": "29",
  "titel": "EVA-Prinzip",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "IT-Systeme",
  "unter": "EVA-Prinzip",
  "notiz": "Eingabe – Verarbeitung – Ausgabe; Beispiele: Tastatur → CPU → Bildschirm",
  "stand": "Bearbeitet"
 },
 {
  "id": "nutzwertanalyse-angebotsvergleich",
  "nr": "30",
  "titel": "Nutzwertanalyse & Angebotsvergleich",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "IT-Systeme",
  "unter": "IT-System Kriterien",
  "notiz": "Überarbeitet im Stil der Prüfungsvorbereitung: Nutzwertanalyse, Angebotsvergleich, Muss-Kriterien, Beispielrechnung, AP1-Aufgaben und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "lizenzmodelle",
  "nr": "31",
  "titel": "Lizenzmodelle",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "IT-Systeme",
  "unter": "IT-System Kriterien",
  "notiz": "Ausgearbeitet als AP1-Kompendium: Kauflizenz, Abo/Miete, Open Source, GPL, MIT, Freeware, Shareware, OEM, CAL, Kostenvergleich und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "on-premise-vs-cloud",
  "nr": "32",
  "titel": "On-Premise vs. Cloud",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "IT-Systeme",
  "unter": "On-Premise,Cloud-Bereitstellung",
  "notiz": "Ausgearbeitet als AP1-Kompendium: Vergleich On-Premise vs. Cloud nach Kosten, Datenschutz, Skalierbarkeit, Kontrolle, Verfügbarkeit, IaaS/PaaS/SaaS und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "cloud-modelle-iaas-paas-saas",
  "nr": "33",
  "titel": "Cloud-Modelle: IaaS, PaaS, SaaS",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "IT-Systeme",
  "unter": "Cloud-Bereitstellung",
  "notiz": "Ausgearbeitet als AP1-Kompendium: IaaS, PaaS, SaaS, Public/Private/Hybrid/Multi Cloud, Verantwortung, Protokolle, Datenschutz, Vor-/Nachteile und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "virtualisierung",
  "nr": "34",
  "titel": "Virtualisierung",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "IT-Systeme",
  "unter": "phys. vs. virt. Systeme",
  "notiz": "Ausgearbeitet als AP1-Kompendium: Hypervisor Typ 1/2, VMs, Container/Docker, Ressourcen, Überprovisionierung, Netzwerk, Cloud-Bezug und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "betriebssysteme",
  "nr": "35",
  "titel": "Betriebssysteme",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "IT-Systeme",
  "unter": "IT-System Kriterien",
  "notiz": "Ausgearbeitet als AP1-Kompendium: Windows, Linux, macOS, Kernel, Prozesse, Scheduler, Dateisysteme, Shell, Rechte, Bootvorgang, Paketmanager, Protokolle und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "hardwarekomponenten-2",
  "nr": "36",
  "titel": "Hardwarekomponenten",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "IT-Systeme",
  "unter": "Hardware",
  "notiz": "Ausgearbeitet als AP1-Kompendium: CPU, RAM, Mainboard, Netzteil, HDD/SSD/NVMe, GPU, Peripherie, Schnittstellen, Green IT, Diagnose und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "technische-dokumentation",
  "nr": "37",
  "titel": "Technische Dokumentation",
  "ap": "2 Informieren und Beraten",
  "thema": "",
  "unter": "",
  "notiz": "Benutzerhandbuch, Installationsanleitung, Systemdokumentation, Präsentationstechniken",
  "stand": "Bearbeitet"
 },
 {
  "id": "kommunikationsmodelle",
  "nr": "38",
  "titel": "Kommunikationsmodelle",
  "ap": "2 Informieren und Beraten",
  "thema": "",
  "unter": "",
  "notiz": "Sender-Empfänger-Modell, 4-Ohren-Modell (Schulz v. Thun), aktives Zuhören",
  "stand": "Bearbeitet"
 },
 {
  "id": "bedarfsermittlung-anforderungsanalyse",
  "nr": "39",
  "titel": "Bedarfsermittlung & Anforderungsanalyse",
  "ap": "2 Informieren und Beraten",
  "thema": "",
  "unter": "",
  "notiz": "Ist-/Soll-Analyse; funktionale & nicht-funktionale Anforderungen; Interviewtechniken",
  "stand": "Bearbeitet"
 },
 {
  "id": "make-or-buy-entscheidung",
  "nr": "40",
  "titel": "Make-or-Buy-Entscheidung",
  "ap": "1 Planen Vorbereiten und Durchführen von Projekten",
  "thema": "",
  "unter": "",
  "notiz": "Eigenentwicklung vs. Fremdbeschaffung; Kriterien: Kosten, Zeit, Know-how, Abhängigkeit",
  "stand": "Bearbeitet"
 },
 {
  "id": "kosten-nutzen-analyse",
  "nr": "41",
  "titel": "Kosten-Nutzen-Analyse",
  "ap": "1 Planen Vorbereiten und Durchführen von Projekten",
  "thema": ".",
  "unter": "",
  "notiz": "ROI, Amortisationszeit, Wirtschaftlichkeitsberechnung, Gesamtbetriebskosten (TCO); ausgearbeitet als AP1-Kompendium mit Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "projektmanagementmethoden",
  "nr": "42",
  "titel": "Projektmanagementmethoden",
  "ap": "1 Planen Vorbereiten und Durchführen von Projekten",
  "thema": "",
  "unter": "",
  "notiz": "Wasserfallmodell, Scrum, Kanban, V-Modell; agil vs. klassisch; ausgearbeitet als AP1-Kompendium mit Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "lasten-und-pflichtenheft",
  "nr": "43",
  "titel": "Lasten- und Pflichtenheft",
  "ap": "1 Planen Vorbereiten und Durchführen von Projekten",
  "thema": "IT-Systeme",
  "unter": "",
  "notiz": "Lastenheft = Auftraggeber (Was?); Pflichtenheft = Auftragnehmer (Wie?); fachlich überprüft und als AP1-Kompendium mit Quellen ausgearbeitet.",
  "stand": "Bearbeitet"
 },
 {
  "id": "projektphasen",
  "nr": "44",
  "titel": "Projektphasen",
  "ap": "1 Planen Vorbereiten und Durchführen von Projekten",
  "thema": "IT-Systeme",
  "unter": "",
  "notiz": "Initiierung, Planung, Durchführung, Steuerung, Abschluss; Meilensteine; ausgearbeitet als AP1-Kompendium mit Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "gantt-diagramm-netzplan",
  "nr": "45",
  "titel": "Gantt-Diagramm & Netzplan",
  "ap": "1 Planen Vorbereiten und Durchführen von Projekten",
  "thema": "IT-Systeme",
  "unter": "",
  "notiz": "Zeitplanung, kritischer Pfad, Pufferzeit, Meilensteine, Abhängigkeiten; ausgearbeitet als AP1-Kompendium mit Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "glossar",
  "nr": "46",
  "titel": "Glossar",
  "ap": "0 Praktisches",
  "thema": "",
  "unter": "",
  "notiz": "",
  "stand": "Nicht gelernt"
 },
 {
  "id": "spannung-stromsta-rke-widerstand",
  "nr": "47",
  "titel": "Spannung, Stromstärke, Widerstand",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "IT-Systeme",
  "unter": "Hardware",
  "notiz": "Ausgearbeitet als AP1-Kompendium: Spannung, Stromstärke, Widerstand, Ohm'sches Gesetz, Leistung, Netzteile, USV, EMV, PoE, Sicherheit und Quellen.",
  "stand": "Bearbeitet"
 },
 {
  "id": "14-tage-lernplan-ap1",
  "nr": "48",
  "titel": "14-Tage-Lernplan AP1",
  "ap": "3 Beurteilen Marktgängiger IT-Systeme",
  "thema": "Netzwerk- & Internettechnologien,IT-Systeme",
  "unter": "",
  "notiz": "Strukturierter 14-Tage-Lernplan mit Tageszielen, Prüfungsfragen, Prioritäten und Notizvorlage.",
  "stand": "Bearbeitet"
 },
 {
  "id": "03-arbeitsaufgaben-im-rahmen-von-gescha-fts-und-",
  "nr": "49",
  "titel": "03 Arbeitsaufgaben im Rahmen von Geschäfts- und Leistungsprozessen planen, vorbereiten und durchführen",
  "ap": "1 Planen Vorbereiten und Durchführen von Projekten",
  "thema": "",
  "unter": "",
  "notiz": "Umfassendes AP1-Kompendium zu Kundenkommunikation, systematischem Fehlermanagement, Incident- und Störungsmanagement, Ticketsystemen, Support-Leveln und verantwortungsvoller KI-Unterstützung.",
  "stand": "Bearbeitet"
 },
 {
  "id": "02-machbarkeit-und-wirtschaftlichkeit-von-projek",
  "nr": "50",
  "titel": "02 Machbarkeit und Wirtschaftlichkeit von Projekten beurteilen können",
  "ap": "1 Planen Vorbereiten und Durchführen von Projekten",
  "thema": "",
  "unter": "",
  "notiz": "Umfassendes AP1-Kompendium zu Machbarkeitsanalyse, Budgetprüfung, Vor- und Nachkalkulation, Wirtschaftlichkeit, Stakeholderbewertung und Risikoanalyse.",
  "stand": "Bearbeitet"
 },
 {
  "id": "01-merkmale-und-methoden-des-projektmanagements",
  "nr": "51",
  "titel": "01 Merkmale und Methoden des Projektmanagements",
  "ap": "1 Planen Vorbereiten und Durchführen von Projekten",
  "thema": "",
  "unter": "",
  "notiz": "Umfassendes AP1-Kompendium auf 100-%-Niveau: Projektmerkmale, SMART, Wasserfall, Scrum, Projektstrukturplan, Gantt, Netzplan, kritischer Pfad, Puffer, Terminsteuerung, Meilensteine, Teamentwicklung, Feedback und Lessons Learned.",
  "stand": "Bearbeitet"
 },
 {
  "id": "schutzbedarfsfeststellung-nach-bsi",
  "nr": "52",
  "titel": "Schutzbedarfsfeststellung nach BSI",
  "ap": "6 IT-Sicherheit",
  "thema": "IT-Systeme",
  "unter": "Schutzziele IT",
  "notiz": "Ausgearbeitet als AP1-Kompendium: Schutzbedarfsfeststellung nach BSI-Standard 200-2 mit Schutzzielen, Schutzbedarfskategorien, Schadensszenarien, Vererbung, Maximumprinzip, Kumulations- und Verteilungseffekt, Fallbeispiel, Dokumentationsvorlage, Musteraufgaben und Quellen.",
  "stand": "Bearbeitet"
 }
];
