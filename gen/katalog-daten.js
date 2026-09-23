/* ============================================================================
   gen/katalog-daten.js — Prüfungskatalog AP1 (Original), als Daten
   ----------------------------------------------------------------------------
   Quelle: „Prüfungskatalog für die IHK-Abschlussprüfungen — Fachinformatiker/
   Fachinformatikerin Fachrichtung Anwendungsentwicklung“, 2. Auflage 2024,
   ZPA Nord-West, Köln 10/2024. AP1-Teil: Katalogseiten 9–16 (PDF-Seiten
   11–18), Anhang „Notationen“: Seiten 34–44.

   Gilt erstmals für die AP1 Frühjahr 2025 (Vorbemerkung, S. 4). Die Prüfungen
   Frühjahr 2025, Herbst 2025 und Frühjahr 2026 dieser Sammlung sind also schon
   nach diesem Katalog gestellt — sie zeigen am ehesten, wie er ausgelegt wird.

   Aufbau je Stichwort:  [Text wie im Katalog, Suchmuster]
   • Der Text ist wörtlich übernommen (Aufzählungen gelegentlich aufgeteilt,
     damit man jedes Stichwort einzeln abhaken kann).
   • Das Suchmuster (regulärer Ausdruck) findet passende Aufgaben, Karten,
     Generator-Typen, Kompendium- und Spickzettel-Seiten. Es wird auf Text
     angewendet, der klein geschrieben ist und in dem ä/ö/ü/ß zu ae/oe/ue/ss
     umgeschrieben sind. „@englisch“ = der Text enthält englische Passagen.
   • { g: "…", p: [ … ] } fasst Stichworte unter einer Überschrift zusammen.

   Nichts hier ist erfunden: was nicht im Katalog steht, steht in
   `nichtAP1` (mit Fundstelle) oder im Anhang.
   ========================================================================== */
"use strict";

window.IHK_KATALOG_AP1 = {
  quelle: "Prüfungskatalog Fachinformatiker/-in Anwendungsentwicklung, 2. Auflage 2024 (ZPA Nord-West, Köln 10/2024)",
  gueltigAb: "AP1 Frühjahr 2025",
  neuerKatalogAb: 2025,                 /* Prüfungen ab Frühjahr 2025 */

  aufbau: [
    ["Prüfungsbereich", "Einrichten eines IT-gestützten Arbeitsplatzes"],
    ["Dauer", "90 Minuten, ungebundene Aufgaben"],
    ["Aufgaben", "4 Aufgaben mit je 20–30 Punkten, zusammen 100 Punkte"],
    ["Gewicht", "20 % der Gesamtnote der Abschlussprüfung"],
    ["Termine", "Frühjahr und Herbst"],
    ["Englisch", "fließt bereichsübergreifend in die Aufgaben ein"],
    ["Operatoren", "Die Überschriften zeigen durch ihre Operatoren die verlangte Tiefe: kennen → unterscheiden → beurteilen → anwenden"]
  ],

  /* Gebiete laut Raster (S. 5) — die Handlungsschritte des AP1-Szenarios */
  gebiete: [
    "Kundenbedarfe zielgruppengerecht ermitteln",
    "Hard- und Software auswählen und ihre Beschaffung einleiten",
    "Einen IT-Arbeitsplatz konfigurieren und testen und dabei die Bestimmungen und die betrieblichen Vorgaben zum Datenschutz, zur IT-Sicherheit und zur Qualitätssicherung einhalten",
    "Kunden und Kundinnen in die Nutzung des Arbeitsplatzes einweisen",
    "Die Leistungserbringung kontrollieren und protokollieren"
  ],

  /* Tiefe: 1 kennen · 2 unterscheiden/zuordnen · 3 beurteilen/bestimmen · 4 anwenden/durchführen */
  komplexe: [
    {
      nr: "01", seite: 9, lf: "LF 1, LF 2, LF 3, LF 5, LF 6",
      titel: "Planen, Vorbereiten und Durchführen von Arbeitsaufgaben in Abstimmung mit den kundenspezifischen Geschäfts- und Leistungsprozessen",
      kurz: "Projekte & Arbeitsaufgaben",
      handlungen: [
        "Grundsätze und Methoden des Projektmanagements anwenden",
        "Auftragsunterlagen und Durchführbarkeit des Auftrags prüfen, insbesondere im Hinblick auf rechtliche, wirtschaftliche und terminliche Vorgaben, und den Auftrag mit den betrieblichen Prozessen und Möglichkeiten abstimmen",
        "Zeitplan und Reihenfolge der Arbeitsschritte für den eigenen Arbeitsbereich festlegen",
        "Termine planen und abstimmen sowie Terminüberwachung durchführen",
        "Probleme analysieren und als Aufgabe definieren sowie Lösungsalternativen entwickeln und beurteilen",
        "Arbeits- und Organisationsmittel wirtschaftlich und ökologisch unter Berücksichtigung der vorhandenen Ressourcen und der Budgetvorgaben einsetzen",
        "Aufgaben im Team sowie mit internen und externen Kunden und Kundinnen abstimmen",
        "Betriebswirtschaftlich relevante Daten erheben und bewerten und dabei Geschäfts- und Leistungsprozesse berücksichtigen",
        "Eigene Vorgehensweise sowie die Aufgabendurchführung im Team reflektieren und bei der Verbesserung der Arbeitsprozesse mitwirken"
      ],
      kreise: [
        { nr: "01", tiefe: 4, titel: "Merkmale und Methoden des Projektmanagements kennen, beurteilen, anwenden können",
          p: [
            ["Merkmale eines Projektes", "merkmale? (eines|von) projekt|projektmerkmal|einmaligkeit|zeitlich begrenzt"],
            { g: "Projektplanung mithilfe von Strukturplan, Netzplan und Gantt-Diagramm", p: [
              ["Strukturplan (Projektstrukturplan)", "strukturplan|\\bpsp\\b|arbeitspaket"],
              ["Netzplan", "netzplan|vorgangsliste|\\bfaz\\b|\\bsez\\b"],
              ["Gantt-Diagramm", "gantt|balkendiagramm|balkenplan"],
              ["kritischer Weg", "kritische[rn]? (weg|pfad)"],
              ["Pufferzeiten", "puffer"],
              ["fristgerechte Terminierung", "terminierung|terminplan|fertigstellungstermin|fristgerecht|endtermin|terminueberwachung|projektende"],
              ["Lösungsmöglichkeiten bei Terminproblemen", "terminproblem|terminverzug|zeitverzug|verzoegert sich|verzoegerung|termin.{0,30}(gefaehrdet|nicht (ein)?gehalten)|beschleunig"],
              ["SMART-Prinzip", "\\bsmart\\b"],
              ["Meilensteine", "meilenstein"]
            ] },
            ["Projektphasen am Beispiel des Wasserfallmodells bzw. SCRUM definieren können", "wasserfall|scrum|sprint|product owner|projektphase"],
            ["Phasen der Teambildung und -entwicklung kennen", "teambildung|teamentwicklung|tuckman|forming|storming|norming|performing"],
            ["Reflektionsmethoden kennen, z. B. Feedback-Kultur, Lessons Learned", "feedback|lessons learned|reflexion|reflektion|retrospektive"]
          ] },
        { nr: "02", tiefe: 3, titel: "Machbarkeit und Wirtschaftlichkeit von Projekten beurteilen können",
          p: [
            ["Machbarkeitsanalyse mithilfe einer Budgetvorgabe", "machbarkeit|budget"],
            ["Vor- und Nachkalkulation", "vorkalkulation|nachkalkulation|projektkosten|kosten des projekt"],
            ["Einfluss der Stakeholder beurteilen können", "stakeholder|interessengruppe|anspruchsgruppe"],
            ["Risikoanalyse", "risikoanalyse|risiken? (analys|bewert|identifiz|einschaetz)|projektrisik"]
          ] },
        { nr: "03", tiefe: 4, titel: "Arbeitsaufgaben im Rahmen von Geschäfts- und Leistungsprozessen planen, vorbereiten und durchführen",
          p: [
            ["Kundenkommunikation", "kundenkommunikation|kundengespraech|gespraech mit (dem|der|den) kund"],
            ["Fehlermanagement", "fehlermanagement|fehlerbehebung|fehlerursache|fehleranalyse"],
            ["Störungs-Management", "stoerung|incident"],
            ["Bearbeitungsstatus, z. B. mittels Ticketsystem", "ticket|bearbeitungsstatus"],
            ["KI-Unterstützung", "\\bki\\b|\\bki-|kuenstliche[rn]? intelligenz|chatbot|\\bllm\\b|chatgpt|copilot|machine learning"],
            ["Support- und Serviceanfragen (First-, Second- und Thirdlevelsupport)", "(first|second|third|1st|2nd|3rd)[- ]?level|supportanfrage|serviceanfrage|service ?desk|helpdesk|user help desk"]
          ] }
      ]
    },

    {
      nr: "02", seite: 10, lf: "LF 1, LF 2",
      titel: "Informieren und Beraten von Kunden und Kundinnen",
      kurz: "Kunden informieren & beraten",
      handlungen: [
        "Im Rahmen der Marktbeobachtung Preise, Leistungen und Konditionen von Wettbewerbern vergleichen",
        "Bedarfe von Kunden und Kundinnen feststellen sowie Zielgruppen unterscheiden",
        "Kunden unter Beachtung von Kommunikationsregeln informieren sowie Sachverhalte präsentieren und deutsche und englische Fachbegriffe anwenden",
        "Maßnahmen für Marketing und Vertrieb unterstützen (betrieblich)",
        "Informationsquellen auch in englischer Sprache aufgabenbezogen auswerten und für die Kundeninformation nutzen"
      ],
      kreise: [
        { nr: "01", tiefe: 3, titel: "Marktsituationen bewerten können",
          p: [
            ["Marktformen, z. B. Monopol, Oligopol, Polypol, Käufer-/Verkäufermarkt", "monopol|oligopol|polypol|marktform|kaeufermarkt|verkaeufermarkt"],
            ["Zielgruppendefinition- und Abgrenzung", "zielgruppe"],
            ["Quantitative und qualitative Angebotsbewertung", "angebotsvergleich|angebote? (zu )?(vergleich|bewert|auswert)|qualitative[rn]? (und|oder) quantitative|quantitative[rn]? (und|oder) qualitative"]
          ] },
        { nr: "02", tiefe: 4, titel: "Zielgruppengerechte Bedarfsanalyse durchführen können",
          p: [
            ["Eigene Datenerhebung, z. B. Kundenbefragung", "befragung|umfrage|fragebogen|datenerhebung|interview"],
            ["Auswertung vorhandener Daten, z. B. Anforderung an Büroarbeitsplätze", "anforderung(en)? an (den |die |einen )?(buero)?arbeitspl|bedarfsanalyse|bedarfsermittlung|ist-?analyse"]
          ] },
        { nr: "03", tiefe: 3, titel: "Zielgerichtete Methoden zur Kundenberatung kennen und beurteilen können",
          p: [
            ["Situationsgerechte Kundenkommunikation", "kundenkommunikation|kundengespraech|gespraechsfuehrung|situationsgerecht"],
            ["Kommunikationsmodelle, z. B. 4-Ohren-Modell, Sender-Empfänger-Modell", "vier-?ohren|4-ohren|sender-empfaenger|sender und empfaenger|kommunikationsmodell|selbstoffenbarung|schulz von thun"],
            ["Kundenbedarf ermitteln und Angebote unterbreiten", "kundenbedarf|bedarf (des|der) kund|angebot (unterbreit|erstell)|kundenwunsch"],
            ["Interpretation englischsprachiger Texte", "@englisch"]
          ] },
        { nr: "04", tiefe: 4, titel: "Informationen aufbereiten und präsentieren sowie Quellen auswerten können",
          p: [
            ["Technische und kaufmännische Texte in deutscher und englischer Sprache", "@englisch|datenblatt|specification|herstellerangabe|produktbeschreibung"],
            ["Präsentation und Medienkompetenz", "praesentation|praesentier|medienkompetenz|folien"]
          ] },
        { nr: "05", tiefe: 4, titel: "Marketingaktivitäten unterstützen können",
          p: [
            ["Nutzwertanalyse", "nutzwert|entscheidungsmatrix|gewichtete[rn]? (punkt|kriter)"],
            ["Vertriebsformen (direkter Vertrieb, indirekter Vertrieb)", "vertriebsform|vertriebsweg|direkte[rn]? vertrieb|indirekte[rn]? vertrieb|absatzweg"]
          ] }
      ]
    },

    {
      nr: "03", seite: 11, lf: "LF 2, LF 3",
      titel: "Beurteilen marktgängiger IT-Systeme und kundenspezifischer Lösungen",
      kurz: "IT-Systeme beurteilen",
      handlungen: [
        "Marktgängige IT-Systeme für unterschiedliche Einsatzbereiche hinsichtlich Leistungsfähigkeit, Wirtschaftlichkeit und Barrierefreiheit beurteilen",
        "Angebote zu IT-Komponenten, IT-Produkten und IT-Dienstleistungen einholen und bewerten sowie Spezifikationen und Konditionen vergleichen"
      ],
      kreise: [
        { nr: "01", tiefe: 3, titel: "Marktgängige IT-Systeme kennen, unterscheiden und beurteilen können",
          p: [
            ["Funktionale, ökonomische und ökologische Aspekte, z. B. Ergonomie, Leistungsparameter, einmalige und laufende Kosten, Nutzungsdauer, Energieverbrauch, Recyclingfähigkeit", "oekolog|oekonom|recycl|nutzungsdauer|laufende kosten|einmalige kosten|energieverbrauch|umweltfreundlich"],
            ["Hardwareprodukte, z. B. CPU, Motherboard, Speicher, Datenspeicher, Netzteile, Grafikkarte, Peripheriegeräte, Sensoren, Netzwerkkomponenten wie WLAN-Router, Switch, Gateway, Accesspoint", "\\bcpu\\b|prozessor|mainboard|motherboard|netzteil|grafikkarte|peripherie|sensor|access ?point|\\bswitch|router|gateway"],
            { g: "Softwareprodukte, z. B. Anwendungen, Betriebssysteme", p: [
              ["Standardsoftware, z. B. Office-Pakete, Datenbank-Managementsysteme, Browser", "standardsoftware|office|browser|datenbank-?managementsystem|\\bdbms\\b"],
              ["Branchensoftware, z. B. ERP-Systeme, Supply Chain Management, Customer Relationship", "branchensoftware|\\berp\\b|\\bcrm\\b|\\bscm\\b|supply chain|customer relationship|warenwirtschaft"],
              ["Systemsoftware", "systemsoftware|treiber|firmware"],
              ["Entwicklungssysteme, z. B. Compiler, virtuelle Maschinen, Interpreter, Editoren und Debugger", "compiler|interpreter|debugger|virtuelle maschine|entwicklungsumgebung|entwicklungssystem"]
            ] },
            ["Cloudlösungen, z. B. Software as a Service, Desktop as a Service", "cloud|\\bsaas\\b|\\bdaas\\b|software as a service|desktop as a service"],
            ["KI-Software", "\\bki\\b|\\bki-|kuenstliche[rn]? intelligenz|chatbot|\\bllm\\b|chatgpt|copilot"],
            ["Virtuelle Desktops (Cloud oder lokal)", "virtuelle[rn]? desktop|\\bvdi\\b|\\bdaas\\b|desktop as a service|terminalserver"]
          ] },
        { nr: "02", tiefe: 2, titel: "Typische IT-Systeme und deren Einsatzbereiche identifizieren und zuordnen können",
          p: [
            ["Kommunikationssysteme, z. B. Videokonferenzsysteme, Social-Media-Systeme", "videokonferenz|social[- ]media|messenger|kommunikationssystem|voip"],
            ["Client-Server-Systeme", "client-?server|client und server"],
            ["Einbindung in einer Domäne", "domaene|domain|active directory|verzeichnisdienst|arbeitsgruppe"],
            ["Mobile Geräte, z. B. Smartphone, Tablet", "smartphone|tablet|mobile[sn]? (geraet|endgeraet)|mobilgeraet"],
            ["Netzwerkprotokolle (z. B. Ethernet, IP, DNS) und OSI-Modell", "\\bosi\\b|osi-|\\bschicht|\\blayer\\b|netzwerkprotokoll|uebertragungsprotokoll|\\bdns\\b|ethernet|\\btcp\\b|\\budp\\b|https?\\b|imap|pop3|smtp|\\bssh\\b|telnet"]
          ] },
        { nr: "03", tiefe: 3, titel: "Leistungsfähigkeit und Energieeffizienz von IT-Systemen bestimmen, analysieren und beurteilen können",
          p: [
            { g: "Kenngrößen, Leistungsdaten, Funktionsumfang, z. B.", p: [
              ["Einstellungsmöglichkeiten im BIOS, UEFI", "\\bbios\\b|\\buefi\\b|secure boot|bootreihenfolge"],
              ["CPU, RAM, Datenspeicher (SSD/HDD)", "\\bram\\b|arbeitsspeicher|\\bssd\\b|\\bhdd\\b|festplatte|nvme|\\bcpu\\b|prozessor|taktfrequenz"],
              ["Filesysteme (z. B. fat32, NTFS, APFS, ext4)", "fat32|ntfs|apfs|ext4|exfat|dateisystem|filesystem"],
              ["Grafikkarte, Netzwerkkarte, Gateway/Router, Switch", "grafikkarte|netzwerkkarte|router|\\bswitch|gateway"],
              ["LWL, Ethernet Standards, WLAN-Standards", "\\blwl\\b|lichtwellenleiter|glasfaser|wlan|wi-?fi|802\\.11|base-?t\\b|cat ?[5-8]|twisted pair"]
            ] },
            ["Barrierefreier Zugriff auf IT-Systeme am Arbeitsplatz, z. B. Einstellungsmöglichkeiten auf Webseiten", "barrierefrei|screenreader|bitv|wcag|sehbehind|schriftgroesse|kontrast"],
            ["Gütesiegel für Energieeffizienz", "guetesiegel|energy star|blauer engel|energieeffizienzklasse|effizienzklasse|energielabel|energieeffizienz ?label|label von a|tco certified|epeat|80 plus"],
            { g: "Kenngrößen, Leistungsdaten", p: [
              ["Übertragungsraten, -zeiten, Datenmengen von digitalisierten Dokumenten, Videos usw.", "uebertragungs(rate|zeit|dauer|geschwindigkeit)|bandbreite|mbit|gbit|datenmenge|speicherbedarf|speicherplatz|\\bmib\\b|\\bgib\\b|\\bkib\\b|bitrate|farbtiefe|fps\\b"],
              ["Strom, Spannung, Leistung, Wirkungsgrad, Energie, Energiekosten", "spannung|stromstaerke|stromkosten|stromverbrauch|leistungsaufnahme|\\bwatt\\b|\\bkwh\\b|wirkungsgrad|energiekosten|ampere|\\bvolt\\b|\\bpoe\\b"]
            ] }
          ] },
        { nr: "04", tiefe: 3, titel: "Wirtschaftlichkeit von IT-Systemen bestimmen und beurteilen können",
          p: [
            ["Anschaffungskosten", "anschaffung"],
            ["Betriebskosten", "betriebskosten|laufende kosten|wartungskosten|monatliche kosten|kosten (pro|je) monat"],
            ["Variable und fixe Kosten", "fixe kosten|fixkosten|variable kosten|deckungsbeitrag"],
            ["Lizenzkosten", "lizenzkosten|lizenzgebuehr|lizenzpreis|(preis|kosten) (je|pro) lizenz|abonnement|\\babo\\b"],
            ["Finanzierungskosten", "finanzierung|darlehen|kredit|zinsen"],
            ["Einfacher Kostenvergleich (Leasing, Kauf, Finanzierung, Pay-per-Use)", "leasing|pay-?per-?use|kostenvergleich|break-?even|amortis|miete (oder|statt) kauf|kauf (oder|statt) miete"],
            ["Preis-Leistungs-Verhältnis", "preis-?leistung"],
            ["Qualitativer und quantitativer Angebotsvergleich", "angebotsvergleich|angebote.{0,40}vergleich|guenstigste[sn]? angebot|bezugspreis|skonto|rabatt"],
            ["Nutzwertanalyse", "nutzwert|entscheidungsmatrix|gewichtete[rn]? (punkt|kriter)"],
            ["Wertschöpfung", "wertschoepfung"]
          ] }
      ]
    },

    {
      nr: "04", seite: 12, lf: "LF 5",
      titel: "Entwickeln, Erstellen und Betreuen von IT-Lösungen",
      kurz: "IT-Lösungen & Programmierung",
      handlungen: [
        "IT-Systeme zur Bearbeitung betrieblicher Fachaufgaben analysieren sowie unter Beachtung insbesondere von Lizenzmodellen, Urheberrechten und Barrierefreiheit konzeptionieren, konfigurieren, testen und dokumentieren",
        "Programmiersprachen, insbesondere prozedurale und objektorientierte Programmiersprachen, unterscheiden"
      ],
      kreise: [
        { nr: "01", tiefe: 4, titel: "IT-Systeme unter Berücksichtigung des IT-Umfeldes konzeptionieren, konfigurieren, testen und dokumentieren können",
          p: [
            ["Bedarfsanalyse", "bedarfsanalyse|bedarfsermittlung|ist-?analyse|anforderungsanalyse"],
            ["Lasten- und Pflichtenheft (Zweck, Urheber, Inhalt)", "lastenheft|pflichtenheft"],
            ["Installation und Einrichtung von Systemen, z. B. Betriebssysteme, BIOS, UEFI, Partitionierungen/Formatierungen, Netzwerkanbindungen, IP(v4/v6)-Konfiguration, Remote-Desktop, KI-Software", "partition|formatier|ipv4|ipv6|ip-adresse|ip-konfiguration|remote-?desktop|\\brdp\\b|installation des betriebssystem"]
          ] },
        { nr: "02", tiefe: 3, titel: "Bedarfsgerechte Auswahl von Hardware vornehmen und begründen können",
          p: [
            ["Geräteklassen, z. B. Desktops, Notebooks, All-in-One, Thin Clients, Tablets, Smartphones", "notebook|all-in-one|thin ?client|desktop-?pc|geraeteklasse|tablets? (zum|im|fuer|als)|geraet auswaehlen"],
            ["Mobile und stationäre Arbeitsplatzsysteme wie PC, Terminals, LAN, WLAN", "mobile[rn]? arbeitspl|stationaere[rn]? arbeitspl|homeoffice|home-office|arbeitsplatzsystem|kartenterminal|terminal"],
            ["Barrierefreiheit, Unterstützung durch zusätzliche Hardware, z. B. größerer Monitor, breitere Tastatur, Lautsprecher/Mikrofon", "barrierefrei|sehbehind|behinderung|braille|sprachausgabe|groessere[rn]? (monitor|bildschirm)"]
          ] },
        { nr: "03", tiefe: 3, titel: "Bedarfsgerechte Auswahl von Software vornehmen und begründen können",
          p: [
            ["Anwendungssoftware", "anwendungssoftware|anwendungsprogramm"],
            ["Betriebssysteme (Einsatzzweck, Filemanagement, Freigaben managen)", "betriebssystem|windows|linux|macos|freigabe|filemanagement|dateiverwaltung"],
            ["Integrierte Entwicklungsumgebung (IDE)", "\\bide\\b|entwicklungsumgebung|visual studio|eclipse|intellij"],
            ["Standard- oder Individualsoftware", "individualsoftware|standardsoftware|make-?or-?buy|eigenentwicklung"],
            ["Open Source", "open[- ]?source|quelloffen"],
            ["Proprietäre Software", "proprietaer|closed source"],
            ["Beurteilungskriterien (Anpassbarkeit, Wartbarkeit, Schnittstellen)", "anpassbarkeit|wartbarkeit|erweiterbarkeit|skalierbarkeit|softwareschnittstelle|\\bapi\\b"],
            ["KI-Software", "\\bki\\b|\\bki-|kuenstliche[rn]? intelligenz|chatbot|chatgpt|copilot|\\bllm\\b"]
          ] },
        { nr: "04", tiefe: 2, titel: "Urheberrechtsgesetz kennen und Lizenzmodelle unterscheiden können",
          p: [
            ["Grundlagen des Schutzes der Urheber", "urheber"],
            ["Lizenzarten, z. B. EULA, OEM, GNU", "\\beula\\b|\\boem\\b|\\bgnu\\b|\\bgpl\\b|lizenzart|lizenzmodell|volumenlizenz|einzelplatzlizenz|freeware|shareware|creative commons|mietlizenz|kauflizenz"],
            ["Pay-per-Use", "pay-?per-?use|nutzungsabhaengig|verbrauchsabhaengig|pay as you go"]
          ] },
        { nr: "05", tiefe: 3, titel: "Aktivitäten bei Installationen und Konfigurationen kennen und beurteilen",
          p: [
            ["Installation und Konfiguration der Hardware", "treiber|einbau|verkabel|patchkabel|netzwerkdose|anschliessen\\b|rj-?45|steckplatz|sockel|installation der hardware"],
            ["Installation und Konfiguration des Betriebssystems", "installation des betriebssystem|betriebssystem (install|einricht|konfigur)|benutzerkonto|benutzerkonten|adminrecht"],
            ["Arbeiten mit der Kommandozeile, Befehlssyntax, Parameter", "kommandozeile|konsole|befehlssyntax|\\bcmd\\b|powershell|\\bbash\\b|eingabeaufforderung"],
            ["Anpassung von Software", "anpassung (der|von) software|customizing|softwareanpassung"],
            ["Konfiguration, Test, Troubleshooting und Dokumentation von Netzwerkverbindungen, z. B. IP-Adressen, DHCP, WLAN-Zugang, Pre shared key/Enterprise, VPN", "dhcp|ip-adresse|subnetz|standard-?gateway|\\bpsk\\b|pre-?shared|\\bwpa|\\bvpn\\b|netzwerkdiagnose|keine verbindung|nicht erreichbar"],
            ["Konsolenbefehle für Dateioperationen und Netzwerktroubleshooting, z. B. dir, ls, mkdir, ipconfig, ifconfig/ip, alias, iproute2, arp, del, cp, copy, chmod, ping, traceroute, nslookup", "ipconfig|ifconfig|\\bping\\b|traceroute|tracert|nslookup|\\bchmod\\b|\\bmkdir\\b|\\bls\\b|\\barp\\b|iproute|konsolenbefehl"]
          ] },
        { nr: "06", tiefe: 2, titel: "Programmiersprachen mit folgenden Merkmalen kennen, einordnen und unterscheiden können",
          p: [
            ["Compiler, Linker, Interpreter", "compiler|kompilier|linker|interpreter"],
            ["Prozedurale und objektorientierte Herangehensweise", "prozedural|objektorientiert|\\boop\\b"],
            ["Variablen, Datentypen und -strukturen", "variable|datentyp|integer|boolean|\\barray\\b|datenstruktur"],
            ["Kontrollstrukturen, z. B. Verzweigung, Schleife", "schleife|verzweigung|kontrollstruktur|wiederhole|solange"],
            ["Prozeduren, Funktionen", "funktion \\w+\\(|prozedur|rueckgabewert|uebergabeparameter|aufruf der funktion"],
            ["Klassen, Attribute, Objekte, Methoden, Sichtbarkeit", "\\bklasse\\b|klassenname|sichtbarkeit|konstruktor|objektorient|instanz|getter|setter|methode \\w+\\("],
            ["Bibliotheken, Frameworks", "bibliothek|framework|library"],
            ["Skriptsprachen, z. B. Shell-Skript", "skriptsprache|shell-?skript|python|powershell|javascript|\\bphp\\b"],
            ["Debugging, formale und inhaltliche Fehler", "debug|syntaxfehler|logische[rn]? fehler|laufzeitfehler|formale[rn]? fehler|inhaltliche[rn]? fehler"]
          ] },
        { nr: "07", tiefe: 4, titel: "Programmierwerkzeuge kennen und anwenden können",
          p: [
            ["Abbildung der Kontrollstrukturen, z. B. Verzweigungen, Schleife, mittels Pseudocode", "pseudocode|pseudo-code"],
            { g: "UML", p: [
              ["Use Case bzw. Anwendungsfalldiagramm", "use[- ]?case|anwendungsfall"],
              ["Klassendiagramm", "klassendiagramm"],
              ["Aktivitätsdiagramm", "aktivitaetsdiagramm"]
            ] },
            ["Entwurf der Bildschirmausgabemasken (Softwareergonomie, Corporate Identity, Barrierefreiheit)", "bildschirmmaske|eingabemaske|ausgabemaske|softwareergonomie|corporate identity|benutzeroberflaeche|\\bgui\\b|mockup"],
            ["Fehler in einem gegebenen Quellcode finden", "fehlerhafte zeile|fehler im (pseudo)?code|korrigieren sie (die|den)|(zeile|code) .{0,30}fehler"],
            ["Schreibtischtest mit einem gegebenen Quellcode durchführen", "schreibtischtest|trace-?tabelle|variablenbelegung|ablaufverfolgung"]
          ] },
        { nr: "08", tiefe: 4, titel: "Grundlagen von relationalen Datenbanken kennen und anwenden können",
          p: [
            ["Einfache ER-Modelle", "entity|er-modell|er-diagramm|\\berm\\b|kardinalitaet|primaerschluessel|fremdschluessel|entitaet|relationale"]
          ] }
      ]
    },

    {
      nr: "05", seite: 14, lf: "LF 3, LF 5, LF 6",
      titel: "Durchführen und Dokumentieren von qualitätssichernden Maßnahmen",
      kurz: "Qualitätssicherung",
      handlungen: [
        "Betriebliche Qualitätssicherungssysteme im eigenen Arbeitsbereich anwenden und Qualitätssicherungsmaßnahmen projektbegleitend durchführen und dokumentieren"
      ],
      kreise: [
        { nr: "01", tiefe: 1, titel: "Grundverständnis zu folgenden Fachbegriffen nachweisen",
          p: [
            ["Betriebliche QM-Systeme", "qualitaetsmanagement|\\bqm\\b|qm-system|\\btqm\\b"],
            ["QS-Normen", "iso 9001|iso 9000|din en iso|qualitaetsnorm|qs-norm"],
            ["Zertifizierung", "zertifizierung|zertifiziert|\\baudit"]
          ] },
        { nr: "02", tiefe: 4, titel: "Maßnahmen des Qualitätsmanagements für den eigenen Arbeitsbereich kennen, planen und anwenden",
          p: [
            ["Qualitätsplanung, Qualitätsziele (Ist-Zustand ermitteln und Ziel-Zustand festlegen)", "qualitaetsplanung|qualitaetsziel|ist-zustand|soll-zustand|ziel-zustand"],
            ["Qualitätslenkung (Umsetzung der Planphase)", "qualitaetslenkung|qualitaetssicherung|qualitaetskontrolle|qualitaetspruefung"],
            ["PDCA – Plan, Do, Check, Act als Qualitätsmanagementzyklus", "pdca|plan[, -]+do|deming|\\bkvp\\b|kontinuierliche[rn]? verbesserung"],
            ["Testprotokoll für das Einrichten eines Arbeitsplatzes", "testprotokoll|testfall|testfaelle|pruefprotokoll|funktionstest|testplan"]
          ] }
      ]
    },

    {
      nr: "06", seite: 15, lf: "LF 4",
      titel: "Umsetzen, Integrieren und Prüfen von Maßnahmen zur IT-Sicherheit und zum Datenschutz",
      kurz: "IT-Sicherheit & Datenschutz",
      handlungen: [
        "Betriebliche Vorgaben und rechtliche Regelungen zur IT-Sicherheit und zum Datenschutz einhalten",
        "Sicherheitsanforderungen von IT-Systemen analysieren und Maßnahmen zur IT-Sicherheit ableiten, abstimmen, umsetzen und evaluieren"
      ],
      kreise: [
        { nr: "01", tiefe: 4, titel: "Regelungen zur IT-Sicherheit auf Grundschutzniveau im eigenen Arbeitsbereich analysieren, anwenden und ihre Einhaltung überprüfen",
          p: [
            ["Gewährleistung von Verfügbarkeit, Vertraulichkeit und Integrität der Daten", "vertraulichkeit|integritaet|schutzziel|verfuegbarkeit"],
            { g: "Maßnahmen zur Informationssicherheit", p: [
              ["Technisch organisatorische Maßnahmen (TOM)", "\\btom\\b|technisch[- ]organisatorisch|technische und organisatorische|organisatorische massnahme|technische massnahme"],
              ["Unterscheidung von IT-Sicherheitsbeauftragtem und Datenschutzbeauftragtem im Betrieb", "sicherheitsbeauftragt|datenschutzbeauftragt"],
              ["Erläuterung von IT-Sicherheitsrichtlinien wie Passwort-Policy", "passwort-?(policy|richtlinie)|kennwortrichtlinie|passwortregel|sicherheitsrichtlinie|passwortanforderung"],
              ["Benennung von technischen Maßnahmen, z. B. Virenschutz, Personal Firewall, Verschlüsselung (inkl. Unterscheidung symmetrisch, asymmetrisch und hybrid)", "virenschutz|antivir|virenscanner|firewall|verschluessel"],
              ["personelle Maßnahmen, Entwicklung des Sicherheitsbewusstseins", "sensibilisier|awareness|sicherheitsbewusst|personelle|mitarbeiterschulung|schulung der mitarbeiter"],
              ["Auszüge aus BSI IT-Grundschutz-Kompendium", "grundschutz|\\bbsi\\b"]
            ] },
            { g: "Einhaltung der Grundzüge der Datenschutzgesetze, national und auf EU-Ebene, z. B. DSGVO, BDSG überprüfen", p: [
              ["Definition von personenbezogenen Daten", "personenbezogen|dsgvo|bdsg|datenschutz-?grundverordnung"],
              ["Rechte der Betroffenen, Konsequenzen der Einwilligung der Betroffenen kennen", "betroffenenrecht|rechte? (der|des) betroffenen|recht auf (auskunft|loeschung|berichtigung|vergessen)|auskunftsrecht|einwilligung|widerspruchsrecht"],
              ["Maßnahmen wie Anonymisierung und Pseudonymisierung", "anonymisier|pseudonymisier"]
            ] }
          ] },
        { nr: "02", tiefe: 4, titel: "Schutzbedarfsanalyse im eigenen Arbeitsbereich aufgrund betrieblicher Vorgaben nach BSI IT-Grundschutz durchführen",
          p: [
            ["Schutzbedarfsanalyse für Anwendungen, IT-Systeme, Räume/Infrastruktur und Kommunikationsverbindungen", "schutzbedarf"]
          ] },
        { nr: "03", tiefe: 4, titel: "Modellierung eines arbeitsplatzbezogenen Sicherheitskonzeptes nach BSI IT Grundschutz",
          p: [
            ["Bausteine aus dem Grundschutzkatalog", "baustein|grundschutz"],
            ["Schutzbedarfskategorien (normal, hoch, sehr hoch) ableiten und begründen", "sehr hoch|schutzbedarfskategorie|schutzbedarf.{0,40}(normal|hoch)"],
            ["Risiko-Klassifikation, z. B. mit Matrix", "risikomatrix|risiko-?matrix|eintrittswahrscheinlichkeit|risikoklass"],
            ["Informations-Sicherheitsmanagementsystem (ISMS) kennen und unterstützen", "\\bisms\\b|informationssicherheitsmanagement"]
          ] },
        { nr: "04", tiefe: 4, titel: "Umsetzung des arbeitsplatzbezogenen Sicherheitskonzeptes unterstützen können",
          p: [
            ["Schaffung eines Sicherheitsbewusstseins bei den Mitarbeitern, z. B. Security by Design, Security by Default", "security by|privacy by|by default|by design|sicherheitsbewusst|sensibilisier"],
            ["IT-Sicherheitsmanagement", "sicherheitsmanagement|sicherheitskonzept"],
            ["Durch technische (infrastrukturelle), organisatorische und personelle Schutzmaßnahmen", "schutzmassnahme|sicherheitsmassnahme|massnahmen? zur (it-)?sicherheit"],
            ["Härtung Betriebssystem (Schwachstellen schließen)", "haertung|haerten|schwachstelle|softwareupdate|sicherheitsupdate|patch"],
            ["Datensicherung/Backup-Verfahren", "backup|datensicherung|inkrementell|differenziell|vollsicherung|generationenprinzip|3-2-1"],
            ["Sicherung der Verfügbarkeit, z. B. NAS", "\\bnas\\b|network attached|hochverfueg"],
            ["Zugangs- und Zugriffskontrolle", "zugangskontrolle|zugriffskontrolle|zutrittskontrolle|zugriffsrecht|berechtigung|rollenkonzept|rechtevergabe"],
            ["Verschlüsselungstechniken kennen (symmetrische, asymmetrische und hybride Verschlüsselung)", "symmetrisch|asymmetrisch|hybride[rn]? verschl|public key|private key|oeffentliche[rn]? schluessel|private[rn]? schluessel|\\baes\\b|\\brsa\\b"],
            ["Hashwerte, Zertifikate und digitale Signaturen verwenden", "hash|zertifikat|signatur|\\bpki\\b"],
            ["Authentifizierung (z. B. Zweifaktor) kennen, Passwort-Policy bewerten", "authentifizierung|zwei-?faktor|\\b2fa\\b|\\bmfa\\b|multi-?faktor|biometr|fingerabdruck|chipkarte"],
            ["Personal Firewall anpassen, z. B. Softwarezugriff auf Internet sperren", "firewall"]
          ] }
      ]
    },

    {
      nr: "07", seite: 16, lf: "LF 2, LF 3, LF 6, LF 7",
      titel: "Erbringen der Leistungen und Auftragsabschluss",
      kurz: "Leistung & Auftragsabschluss",
      handlungen: [
        "Leistungen nach betrieblichen und vertraglichen Vorgaben dokumentieren",
        "Leistungserbringung unter Berücksichtigung der organisatorischen und terminlichen Vorgaben mit Kunden und Kundinnen abstimmen und kontrollieren",
        "Veränderungsprozesse begleiten und unterstützen",
        "Kunden und Kundinnen in die Nutzung von Produkten und Dienstleistungen einweisen",
        "Leistungen und Dokumentationen an Kunden und Kundinnen übergeben sowie Abnahmeprotokolle anfertigen",
        "Kosten für erbrachte Leistungen erfassen sowie im Zeitvergleich und im Soll-Ist-Vergleich bewerten"
      ],
      kreise: [
        { nr: "01", tiefe: 2, titel: "Vertragsarten, Vertragsbestandteile und Vertragsstörungen kennen und unterscheiden",
          p: [
            ["Kaufvertrag, Mietvertrag, Leasing", "kaufvertrag|mietvertrag|leasing"],
            ["Lizenzvertrag", "lizenzvertrag|lizenzvereinbarung|nutzungsrecht"],
            ["Servicevertrag, Service Level Agreement (SLA)", "servicevertrag|wartungsvertrag|\\bsla\\b|service level"],
            ["Werkvertrag, Dienstvertrag", "werkvertrag|dienstvertrag"],
            ["Vertragsbestandteile, z. B. Leistungsbeschreibung, Termine, Entgelte, Sanktionen/Konventionalstrafen", "vertragsbestandteil|leistungsbeschreibung|konventionalstrafe|vertragsstrafe|zahlungsbedingung|lieferbedingung|zahlungsziel"],
            ["Vertragsstörungen", "vertragsstoerung|lieferverzug|zahlungsverzug|annahmeverzug|nicht-?rechtzeitig|mangelhafte lieferung|nacherfuellung|ruecktritt|minderung|schadensersatz|gewaehrleistung"]
          ] },
        { nr: "02", tiefe: 1, titel: "Zielsetzungen des Unternehmens dem Leitbild entnehmen können",
          p: [
            ["Ökonomisch, z. B. Umsatz und Gewinn", "leitbild|unternehmensziel|oekonomische[sn]? ziel|umsatzsteiger|umsatzrueckgang|gewinnmaxim|gewinnsteiger"],
            ["Ökologisch, z. B. Ressourcenschonung, Nachhaltigkeit", "oekologische[sn]? ziel|ressourcenschon|nachhaltig"],
            ["Sozial, z. B. Arbeitsbedingungen", "soziale[sn]? ziel|arbeitsbedingung"]
          ] },
        { nr: "03", tiefe: 1, titel: "Umsetzungsvarianten der Leistungserbringung kennen",
          p: [
            ["Leistungserbringung vor Ort vs. Remote", "vor ort|remote|fernwartung|fernzugriff"],
            ["Ticketsystem", "ticket"],
            ["Kundenvorgaben bei der Leistungserbringung, z. B. Termin und Erfüllungsort, technische Voraussetzungen (Betriebssystem, Hersteller), Einhaltung des Budgets", "erfuellungsort|kundenvorgabe|vorgaben des kunden|budget"]
          ] },
        { nr: "04", tiefe: 4, titel: "Leistungserbringung gemäß der Aufbauorganisation des eigenen Unternehmens abstimmen",
          p: [
            ["Mehrliniensystem, Einliniensystem, Matrixorganisation", "einlinien|mehrlinien|matrixorganisation|stablinien|aufbauorganisation|organigramm"],
            ["Handlungs- und Entscheidungsspielräume/Vollmachten", "vollmacht|prokura|entscheidungsspielraum|handlungsspielraum|befugnis"]
          ] },
        { nr: "05", tiefe: 4, titel: "Veränderungsprozesse begleiten und unterstützen",
          p: [
            ["Motivierte Herangehensweise und Betonung der Chancen", "chancen|motivier"],
            ["Identifizierung und Darstellung von Veränderungsschritten", "veraenderungsprozess|veraenderungsschritt|aenderungsmanagement|change[- ]management|neues verfahren|umstellung auf"],
            ["Mitarbeiterqualifizierung, z. B. durch Blended-Learning, Multiplikatoren", "blended|multiplikator|mitarbeiterqualifiz|schulung|e-learning|einarbeitung"],
            ["Erkennen von Promotor, Bremser, Skeptiker und Widerständler", "promotor|bremser|skeptiker|widerstaendler"],
            ["Ursachen von Widerständen gegen Veränderungen, z. B. Angst vor Kompetenzverlust, Wissenslücken, persönliche Historie", "widerstand|widerstaende|befuerchtung|bedenken|kompetenzverlust|wissensluecke"]
          ] },
        { nr: "06", tiefe: 4, titel: "Leistungsübergabe und Einweisungen planen und dokumentieren",
          p: [
            ["Inhalt des Abnahmeprotokolls", "abnahme|uebergabeprotokoll|einweisung"],
            ["Mängel und Mängelarten: Schlechtleistung, Falschlieferung, Minderlieferung", "schlechtleistung|falschlieferung|minderlieferung|mangelart|mangelhaft|\\bmangel\\b|maengel"]
          ] },
        { nr: "07", tiefe: 4, titel: "Leistungserbringung bewerten und dokumentieren können",
          p: [
            ["Soll-Ist-Vergleich, Abweichungsanalyse", "soll-ist|ist-soll|abweichungsanalyse|abweichung"],
            ["Nachkalkulation", "nachkalkulation"],
            ["Lessons Learned", "lessons learned"],
            ["Generierung von Nachfolgeaufträgen", "nachfolgeauftrag|folgeauftrag|anschlussauftrag|kundenbindung"]
          ] }
      ]
    }
  ],

  /* --------------------------------------------------------------------
     Was NICHT (mehr) zu AP1 gehört — mit Fundstelle im Katalog.
     art: "gestrichen" | "ap2" | "grenzfall" | "anhang"
     ------------------------------------------------------------------ */
  nichtAP1: [
    { key: "sql", art: "ap2", label: "SQL (Abfragen, CREATE/INSERT, JOIN, GROUP BY)",
      wo: "Vorbemerkung S. 3: „SQL und RAID ausschließlich in Teil 2“; AP2 S. 17, 24",
      m: "\\bsql\\b|select\\s[^.]{1,80}\\sfrom|group by|\\bhaving\\b|insert into|create table|inner join" },
    { key: "raid", art: "ap2", label: "RAID",
      wo: "Vorbemerkung S. 3; AP2 S. 21 (Maßnahmen zur Sicherstellung des Betriebes)",
      m: "\\braid\\b" },
    { key: "struktogramm", art: "gestrichen", label: "Struktogramm und PAP",
      wo: "Vorbemerkung S. 3: gestrichen — „Platz geschaffen für UML, BPMN, KI“",
      hinweis: "Aufgaben mit Struktogramm/PAP sind trotzdem gutes Training: löse sie als Pseudocode.",
      m: "struktogramm|nassi|programmablaufplan|\\bpap\\b" },
    { key: "normalisierung", art: "ap2", label: "Normalisierung (1.–3. NF), Anomalien, referenzielle Integrität",
      wo: "AP2 S. 17 und S. 23 — in AP1 steht nur „einfache ER-Modelle“",
      hinweis: "Primär- und Fremdschlüssel wurden 2025 und 2026 in AP1 trotzdem gefragt — als Teil des ER-Modells.",
      m: "normalform|normalisier|anomalie|referenzielle integritaet" },
    { key: "uml_weitere", art: "ap2", label: "UML-Sequenz- und Zustandsdiagramm",
      wo: "AP2 S. 22–23; im Anhang S. 42 nur als Notation",
      m: "sequenzdiagramm|zustandsdiagramm|zustandsautomat" },
    { key: "vorgehensmodelle", art: "ap2", label: "V-Modell, Spiralmodell und andere Vorgehensmodelle",
      wo: "AP2 S. 23 — AP1 nennt nur Wasserfall und SCRUM",
      m: "v-modell|spiralmodell|\\bkanban\\b|extreme programming" },
    { key: "oop_konzepte", art: "grenzfall", label: "Vererbung, Polymorphie, Kapselung, Interfaces",
      wo: "Als OOP-Konzepte AP2 S. 24. Aber: das Klassendiagramm steht in AP1 (S. 13), und die Notation im Anhang (S. 41) zeigt Vererbung.",
      hinweis: "Pfeil für Vererbung im Klassendiagramm lesen/zeichnen können — tiefer nicht.",
      m: "vererbung|polymorph|datenkapselung|abstrakte klasse|oberklasse|unterklasse|erbt von|<<interface>>",
      ohne: "ihrer vererbung|vererbung von (zugriffs)?rechten|rechtevererbung",
      beleg: "Frühjahr 2026, Aufgabe 4a: Vorteile der OOP — Vererbung, Kapselung, Polymorphie standen in der Musterlösung." },
    { key: "pattern", art: "ap2", label: "Design-Pattern (Observer, Singleton, Factory, MVC)",
      wo: "AP2 S. 23", m: "observer|singleton|factory|\\bmvc\\b|design-?pattern|entwurfsmuster" },
    { key: "algorithmen", art: "ap2", label: "Such- und Sortieralgorithmen",
      wo: "AP2 S. 24", m: "bubble ?sort|selection ?sort|insertion ?sort|binaere suche|lineare suche|sortieralgorithmus" },
    { key: "softwaretest", art: "ap2", label: "Black-/White-Box-, Unit-, Integrations-, Systemtests",
      wo: "AP2 S. 17, 18, 25 — AP1: nur Testprotokoll, Schreibtischtest, Fehler im Code finden",
      m: "black-?box|white-?box|unit-?test|integrationstest|systemtest|modultest|\\btdd\\b|end-?to-?end|regressionstest|lasttest" },
    { key: "versionsverwaltung", art: "ap2", label: "Versionsverwaltung (Branch, Merge, Push, Pull)",
      wo: "AP2 S. 17, 25", m: "\\bgit\\b|versionsverwaltung|versionskontrolle|\\bbranch(es)?\\b|\\bmerge\\b|pull request" },
    { key: "austauschformate", art: "ap2", label: "Datenaustauschformate XML, JSON, CSV; REST, SOAP",
      wo: "AP2 S. 21, 22, 24",
      hinweis: "Dateigrößen und Kompression von Dokumenten, Bildern, Videos bleiben AP1 (03.03).",
      m: "\\bjson\\b|\\bxml\\b|\\bcsv\\b|rest-?api|restful|\\bsoap\\b" },
    { key: "speichernetze", art: "ap2", label: "SAN, iSCSI, NFS, Fibre Channel, JBOD",
      wo: "AP2 S. 21 — AP1 nennt nur NAS", m: "\\bsan\\b|storage area|iscsi|\\bnfs\\b|fibre ?channel|\\bjbod\\b" },
    { key: "iaas_paas", art: "ap2", label: "IaaS/PaaS, Hypervisor, Container",
      wo: "AP2 S. 21 — AP1 nennt SaaS, Desktop as a Service, virtuelle Desktops, virtuelle Maschinen",
      m: "\\biaas\\b|\\bpaas\\b|infrastructure as a service|platform as a service|hypervisor|container|docker" },
    { key: "betrieb", art: "ap2", label: "USV, Monitoring (SNMP, S.M.A.R.T.), MTBF, Disaster Recovery, Eskalationsstufen",
      wo: "AP2 S. 20–21", m: "\\busv\\b|unterbrechungsfreie stromversorgung|monitoring|\\bsnmp\\b|s\\.m\\.a\\.r\\.t|\\bmtbf\\b|disaster recovery|notfallkonzept|eskalationsstufe" },
    { key: "netz_vertieft", art: "ap2", label: "VLAN, RADIUS/Kerberos, IPsec, Topologien, strukturierte Verkabelung, Routing, Proxy",
      wo: "AP2 S. 20 — AP1: IP-Konfiguration, DHCP, WLAN (PSK/Enterprise), VPN, OSI, Ethernet/IP/DNS",
      m: "\\bvlan\\b|radius|kerberos|ipsec|topologie|strukturierte verkabelung|routingtabelle|\\bproxy",
      ohne: "wpa-?enterprise|\\beap\\b",
      hinweis: "IPv4/IPv6 nebeneinander (Dual-Stack, Tunneling) kam Frühjahr 2026 in AP1 — das gehört zur IP-Konfiguration." },
    { key: "angriffe", art: "grenzfall", label: "Angriffsarten: Ransomware, Phishing, DDoS, Man-in-the-Middle",
      wo: "Ausdrücklich AP2 S. 19. In AP1 nur Virenschutz, Sicherheitsbewusstsein, Härtung (S. 15)",
      hinweis: "Begriffe kennen reicht — gefragt wird in AP1 eher die Schutzmaßnahme.",
      m: "ransomware|phishing|ddos|man-in-the-middle|sql-injection|penetrationstest|trojaner|\\bwurm\\b|malware|schadsoftware|social engineering" },
    { key: "recht_vertieft", art: "ap2", label: "BGB/HGB, UWG, AGB, Compliance",
      wo: "AP2 S. 17", m: "\\bbgb\\b|\\bhgb\\b|\\buwg\\b|unlauter|\\bagb\\b|allgemeine geschaeftsbedingungen|compliance-?(regel|richtlinie|management|verstoss)|regelkonformitaet" },
    { key: "wiso", art: "ap2", label: "WiSo: Arbeits- und Tarifrecht, Rechtsformen, Arbeitsschutz, Umweltschutz",
      wo: "AP2 Teil 3 (WiSo), S. 26–33", m: "tarifvertrag|tarifrecht|arbeitsrecht|kuendigungsschutz|berufsbildungsgesetz|\\bbbig\\b|arbeitsschutzgesetz|sozialversicherung|jugendarbeitsschutz" },
    { key: "swqualitaet", art: "grenzfall", label: "Softwarequalitätskriterien (ISO 25010/9126)",
      wo: "AP2 S. 22. AP1 nennt nur Anpassbarkeit, Wartbarkeit, Schnittstellen als Auswahlkriterien (S. 12)",
      m: "iso ?25010|iso ?9126|softwarequalit|qualitaetskriterien" },
    { key: "bpmn_epk", art: "anhang", label: "BPMN und EPK",
      wo: "Nur im Anhang „Notationen“ (S. 34–35) und in der Vorbemerkung — in keinem AP1-Themenkreis",
      hinweis: "Symbole lesen können schadet nicht; eigene Aufgaben dazu gibt es in AP1 bisher nicht.",
      m: "bpmn|\\bepk\\b|ereignisgesteuerte prozesskette" }
  ],

  /* Generator-Typen, die nach dem Original eindeutig zuzuordnen sind —
     Muster allein würden hier danebengreifen.                          */
  vorlagenNichtAP1: {
    "db-normalisierung": "normalisierung",
    "db-sql-lesen": "sql",
    "daten-raid": "raid",
    "sp-jbod": "speichernetze",
    "recht-arbeitsrecht": "wiso",
    "eh-usv": "betrieb"
  },

  /* --------------------------------------------------------------------
     Anhang „Notationen“ (S. 34–44). Hier steht, WIE die ZPA zeichnet —
     so sieht es in der Prüfung aus.
     ------------------------------------------------------------------ */
  anhang: [
    { key: "netzplan", titel: "Netzplan — Vorgangsknoten", seite: 36, ap1: "01.01", svg: "netzplan",
      punkte: [
        "Oberhalb des Kastens: links FAZ, rechts FEZ. Unterhalb: links SAZ, rechts SEZ.",
        "Im Kasten oben: Vorgang (A, B, C …) | Beschreibung. Unten: Dauer | GP | FP.",
        "Dauer in Arbeitstagen.",
        "GP = SAZ − FAZ oder GP = SEZ − FEZ.",
        "FP = FAZ des Nachfolgers − FEZ des Vorgangs (bei mehreren Nachfolgern: kleinstes FAZ).",
        "Beispiel im Katalog: A Planung 30 → B Netzwerk 40, C Hardware 15, D Software 30 → E Installation 5 (Vorgänger C, D) → F, G."
      ] },
    { key: "praefixe", titel: "Dezimal- und Binärpräfixe", seite: 43, ap1: "03.03", wichtig: true,
      punkte: [
        "Dezimalpräfixe (k, M, G = 10³, 10⁶, 10⁹) für physikalische Größen: Strom, Leistung, Geschwindigkeit, Übertragungsrate.",
        "Binärpräfixe (Ki, Mi, Gi = 2¹⁰, 2²⁰, 2³⁰) für Datenmengen: KiB, MiB, GiB, TiB.",
        "„Angaben zu Datenmengen sind nur mit Binärpräfixen richtig!“ — so steht es fett im Katalog.",
        "Abweichung bei falscher Verwendung: kB 2,40 % · MB 4,86 % · GB 7,37 % · TB 9,95 % · PB 12,6 %.",
        "Name (Gibibyte) oder Symbol (GiB) — beides ist erlaubt."
      ] },
    { key: "aktivitaet", titel: "UML-Aktivitätsdiagramm", seite: 40, ap1: "04.07",
      punkte: [
        "Startknoten ● · Endknoten ◉ (beendet ALLE Aktivitäten) · Ablaufende ⊗ (beendet nur den aktuellen Fluss).",
        "Aktion: Rechteck mit abgerundeten Ecken.",
        "Teilung (Splitting) und Synchronisation (Und): dicker Balken.",
        "Entscheidung und Zusammenführung (Oder): Raute, an den Ausgängen Bedingungen in eckigen Klammern [x<0], [x>=0].",
        "Schwimmbahnen (Swimlanes) für Zuständigkeiten; Verbinder als Kreis mit Buchstabe (A)."
      ] },
    { key: "usecase", titel: "UML-Anwendungsfalldiagramm", seite: 40, ap1: "04.07",
      punkte: [
        "Akteur als Strichmännchen, Anwendungsfall als Ellipse, Assoziation als Linie.",
        "Generalisierung von Akteuren und Anwendungsfällen: Pfeil mit hohlem Dreieck zum Allgemeineren.",
        "<<include>>: gestrichelter Pfeil vom Basis- zum inkludierten (sekundären) Anwendungsfall.",
        "<<extend>>: gestrichelter Pfeil vom erweiternden zum Basis-Anwendungsfall; dort Extension Point, Bedingung als Notiz."
      ] },
    { key: "klasse", titel: "UML-Klassendiagramm", seite: 41, ap1: "04.07",
      punkte: [
        "Klasse: Name · Attribute · Methoden. Abstrakte Klasse kursiv mit {abstract}, Interface mit <<interface>>.",
        "Attribut: Sichtbarkeit Name : Typ {Eigenschaften}. Methode: Sichtbarkeit name(param : Typ) : Rückgabetyp.",
        "Sichtbarkeit: + public · # protected · − private · ~ package.",
        "Beziehungen: Assoziation (Linie), gerichtete Assoziation (offener Pfeil), Multiplizität (1, *, 0..1).",
        "Aggregation: hohle Raute am Ganzen · Komposition: gefüllte Raute (Teil existenzabhängig).",
        "Vererbung: hohles Dreieck zur Oberklasse · Implementierung: gestrichelt mit hohlem Dreieck zum Interface."
      ] },
    { key: "netzwerkplan", titel: "Netzwerkplan — Symbole", seite: 37, ap1: "03.02",
      punkte: [
        "Switch: Koppelelement auf OSI-Layer 2 (weitere Funktionen je nach Aufgabe).",
        "Router: Layer 3, ggf. NAT/PAT. Firewall: Stateful Inspection bis Layer 4.",
        "Kombigerät für SOHO (Switch/Router/Firewall/Accesspoint), Accesspoint, Server.",
        "Ein (Teil-)Netz wird als Ellipse mit Netzadresse gezeichnet, z. B. 192.0.2.0/24.",
        "Ein Netzwerkplan zeigt immer nur den relevanten Ausschnitt."
      ] },
    { key: "rechnung", titel: "Rechnung (Belegsatz)", seite: 44, ap1: "03.04", rechnung: true,
      punkte: [
        "3 × Print Fusion 3D à 4.450,00 € = 13.350,00 €",
        "− 6 % Rabatt = 801,00 € → Nettopreis 12.549,00 €",
        "+ 19 % MwSt. = 2.384,31 € → Rechnungsbetrag 14.933,31 €",
        "2 % Skonto vom Rechnungsbetrag = 298,67 € → Zahlbetrag 14.634,64 €",
        "Auf dem Beleg: Bestell-, Liefer- und Rechnungsdatum, Skontofrist, Zahlungsziel (danach Verzug ohne Mahnung)."
      ] },
    { key: "bpmn", titel: "BPMN und EPK", seite: 34, ap1: null,
      punkte: [
        "BPMN: Task (abgerundetes Rechteck), Sequenzfluss (durchgezogen), Nachrichtenfluss (gestrichelt), Datenobjekt.",
        "Gateways: XOR ✕ exklusiv · OR ◯ inklusiv · AND ✚ parallel. Events: Start ○, Intermediate ◎, Ende ● (dick); Message, Timer, Exception.",
        "Pool mit Lanes für Beteiligte.",
        "EPK: Ereignis (Sechseck), Funktion (abgerundetes Rechteck), Organisationseinheit, Konnektoren ∧ UND, XOR, ∨ ODER.",
        "In keinem AP1-Themenkreis genannt — nur Notation im Anhang."
      ] },
    { key: "ap2", titel: "SQL-Syntax, Sequenz- und Zustandsdiagramm", seite: 38, ap1: null,
      punkte: [
        "Stehen im Anhang für alle IT-Berufe, geprüft werden sie in AP2.",
        "Für AP1 nicht lernen — erst nach dem 30.09."
      ] }
  ]
};
