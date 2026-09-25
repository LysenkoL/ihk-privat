/* ============================================================================
   gen/prognose-daten.js — drei Prognose-Prüfungen für den 30.09.2026
   ----------------------------------------------------------------------------
   Gebaut aus dem Themen-Radar (gen/radar-daten.js): je Prüfung vier Aufgaben
   zu den Themen, die in den letzten AP1-Prüfungen am häufigsten kamen.

   Jede Teilaufgabe ist eine ECHTE Aufgabe aus den zehn IHK-Prüfungen oder aus
   dem Azubi-Navigator (u-form, ausbildung.io) — gemischt, wie es die Prognose
   verlangt. Weil diese Aufgaben schon einmal bearbeitet wurden, ist der Text
   leicht verändert: andere Firma, andere Zahlen (Lösungen neu gerechnet),
   eigene Formulierung. Frage, Antwortformat und Punkte bleiben wie im
   Original. Die Vorlage steht unter der Musterlösung („Vorlage: …“).
   Aus dem lizenzierten Azubi-Material ist kein Text übernommen, nur die
   Aufgabenidee — deshalb darf diese Datei öffentlich sein.

   Format = das Modulformat des Azubi-Navigators (gen/azubi.js läuft die
   Prüfungen ab: Übung/Prüfung, Uhr, Speichern, Auswertung, Fehler wiederholen).
   Zahlenfelder prüft die App selbst; alle Lösungen sind in
   tests/prognose.test.js nachgerechnet.
   ========================================================================== */
(function (root) {
  "use strict";

  /* ------------------------------------------------------------ Bausteine */
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const p = (...absaetze) => absaetze.map(a => "<div>" + a + "</div>").join("<br>");
  const ul = punkte => "<ul>" + punkte.map(x => "<li>" + x + "</li>").join("") + "</ul>";
  const code = s => "<pre>" + esc(s.replace(/^\n/, "")) + "</pre>";
  const tab = (kopf, zeilen) => "<table><tr>" + kopf.map(k => "<th>" + k + "</th>").join("") + "</tr>" +
    zeilen.map(z => "<tr>" + z.map(c => "<td>" + c + "</td>").join("") + "</tr>").join("") + "</table>";

  /* Eingaben im Format von gen/azubi.js ---------------------------------- */
  const FREI = gross => ({ typ: "zeilen", zeilen: [{ h: "", frei: "1", gross: !!gross }] });
  const FREIE = (...titel) => ({ typ: "zeilen", zeilen: titel.map((h, i) => ({ h: "<b>" + h + "</b>", frei: String(i + 1), gross: false })) });
  /** Gemischte Zeilen: {h, s, e, t} = Feld (s = Soll, t = Textfeld), {h, frei: true} = Textbox */
  function Z(...items) {
    let f = 0, t = 0;
    return {
      typ: "zeilen", zeilen: items.map(x => x.frei
        ? { h: "<b>" + x.h + "</b>", frei: String(++t), gross: !!x.gross }
        : { h: "<b>" + x.h + "</b>", felder: [{ id: String(++f), art: x.t ? "text" : "zahl", soll: [].concat(x.s).map(String), einheit: x.e || "" }] })
    };
  }
  const WAHL = (ftitel, optionen, zeilen) => ({
    typ: "wahl", ftitel,
    zeilen: zeilen.map(([h, soll, eigene], i) => ({ id: String(i + 1), h, optionen: eigene || optionen, soll }))
  });
  const ZUO = (otitel, ftitel, optionen, zeilen) => ({
    typ: "zuordnung", otitel, ftitel, optionen,
    zeilen: zeilen.map(([h, soll], i) => ({ id: String(i + 1), h, soll: String(soll) }))
  });
  const MEHR = (optionen, soll) => ({ typ: "mehrfach", optionen, soll, anzahl: soll.length });
  /** Raster: Zeilen aus Zellen; Text = feste Zelle, {s, e, t} = Eingabefeld */
  function RASTER(zeilen) {
    let n = 0;
    const zellen = [];
    zeilen.forEach(z => z.forEach(c => zellen.push(typeof c === "object"
      ? { f: { id: String(++n), art: c.t ? "text" : "zahl", soll: [].concat(c.s).map(String), einheit: c.e || "" } }
      : { h: String(c) })));
    return { typ: "raster", zeilen: zeilen.length, spalten: zeilen[0].length, zellen };
  }

  /** Teilaufgabe. Nummer, Buchstabe und id setzt aufgabe() */
  const T = (titel, punkte, text, eingabe, loesung, hinweis, vorbild, extra) =>
    Object.assign({ titel, punkte, sek: Math.round(punkte * 54), text, eingabe, loesung, hinweis: hinweis || "", vorbild }, extra || {});

  function aufgabe(pid, nr, titel, themen, teile) {
    const abc = "abcdefghijklmnop";
    teile.forEach((t, i) => { t.nr = String(nr); t.label = abc[i] + ")"; t.id = pid + "-" + nr + abc[i]; });
    return { nr: String(nr), titel, themen, teile };
  }
  function pruefung(nr, titel, kurzinfo, situation, intro, aufgaben) {
    return {
      id: "azprog" + nr, art: "pruefung", nr, virtuell: true,
      kurz: "Prognose " + nr, titel, kurzinfo, minuten: 90, punkte: 100,
      intro, einleitung: [{ titel: "Ausgangssituation", html: situation, anlagen: [] }],
      aufgaben
    };
  }

  const INTRO = schwerpunkte => p(
    "Zusammengestellt aus dem <b>Themen-Radar</b>: " + schwerpunkte + " — Themen, die in den letzten AP1-Prüfungen am häufigsten drankamen.",
    "Jede Teilaufgabe stammt aus einer echten IHK-Prüfung oder aus dem Azubi-Navigator — bunt gemischt. Damit du sie nicht wiedererkennst, sind Firma, Zahlen und Formulierung verändert. Unter jeder Musterlösung steht die Vorlage.",
    "Wie in der echten Prüfung: 4 Aufgaben × 25 Punkte, 90 Minuten. Zahlenfelder prüft die App selbst, Textantworten bewertest du mit der Musterlösung.");

  /* ========================================================================
     PROGNOSE 1 — Lindqvist Präzisionstechnik GmbH
     ====================================================================== */
  const P1 = "p1";
  const prognose1 = pruefung(1, "Lindqvist Präzisionstechnik: CAD-Plätze, Hallennetz, Sicherheit, Lagersoftware",
    "Kosten & Strom · IPv4/IPv6 · Phishing, Verschlüsselung, Backup · Algorithmus & ER-Modell",
    p("Die <b>Lindqvist Präzisionstechnik GmbH (LPT)</b> in Bremen fertigt Frästeile für die Medizintechnik und beschäftigt 140 Mitarbeitende.",
      "Sie sind Auszubildende/r der <b>KonnektIT GmbH</b>, eines IT-Systemhauses, das LPT betreut. In diesem Quartal stehen an:" +
      ul(["sechs neue Konstruktionsarbeitsplätze (CAD) beschaffen und einrichten,",
          "ein eigenes Netz für die Messstationen in der Fertigungshalle,",
          "ein Sicherheitskonzept für den E-Mail-Verkehr mit Kliniken und für die Datensicherung,",
          "eine kleine Software, die den Materialbestand im Lager überwacht."])),
    INTRO("Kostenkalkulation, Leistung P = U · I, Kaufvertrag, IPv4/IPv6 und Fehlersuche, Phishing und Malware, Verschlüsselung, Backup, Algorithmus, Schreibtischtest und ER-Modell"),
    [
      aufgabe(P1, 1, "Beschaffung, Kalkulation und Stromversorgung", ["kosten", "hardware", "strom", "energie", "kaufvertrag"], [
        T("Laufende Kosten der CAD-Arbeitsplätze", 7,
          p("Für die sechs Konstruktionsarbeitsplätze liegt folgendes Angebot vor:" +
            tab(["Position", "Preis"], [
              ["Monitor 27 Zoll", "380,00 € je Stück"],
              ["CAD-PC", "1.140,00 € je Stück"],
              ["CAD-Software (Miete)", "45,00 € pro Monat und Arbeitsplatz"],
              ["Wartungspauschale", "960,00 € pro Jahr für alle Geräte"],
              ["Rabatt", "10 % auf PC und Monitor"]]),
            "LPT verteilt die Anschaffungskosten gleichmäßig auf die Nutzungsdauer: Monitore <b>5 Jahre</b>, PCs <b>4 Jahre</b>.",
            "Berechnen Sie die laufenden Kosten <b>pro Monat</b> für alle sechs Arbeitsplätze. Der Rechenweg ist anzugeben."),
          Z({ h: "Monitore (alle sechs) pro Monat", s: "34,20", e: "€" },
            { h: "PCs (alle sechs) pro Monat", s: "128,25", e: "€" },
            { h: "Software pro Monat", s: "270,00", e: "€" },
            { h: "Wartung pro Monat", s: "80,00", e: "€" },
            { h: "Laufende Kosten gesamt pro Monat", s: "512,45", e: "€" }),
          tab(["Kostenart", "Rechnung", "pro Monat"], [
            ["Monitore", "380,00 € − 10 % = 342,00 € · 6 = 2.052,00 € ÷ 60 Monate", "34,20 €"],
            ["PCs", "1.140,00 € − 10 % = 1.026,00 € · 6 = 6.156,00 € ÷ 48 Monate", "128,25 €"],
            ["Software", "45,00 € · 6 Arbeitsplätze", "270,00 €"],
            ["Wartung", "960,00 € ÷ 12 Monate", "80,00 €"],
            ["<b>Summe</b>", "", "<b>512,45 €</b>"]]) +
          p("Typische Fehler: Rabatt vergessen, Nutzungsdauer in Jahren statt Monaten, Wartung als Monatsbetrag gelesen."),
          "Je Kostenart 1 BE (Rabatt und Monate richtig), 1 BE Summe, 2 BE nachvollziehbarer Rechenweg. Folgefehler werden nicht doppelt abgezogen.",
          "IHK Frühjahr 2024 · 1 b)"),

        T("Netzteil dimensionieren", 4,
          p("Für einen CAD-PC wurden folgende Komponenten gewählt:" +
            tab(["Komponente", "max. Leistung je Stück", "Anzahl"], [
              ["Mainboard", "25 W", "1"], ["Prozessor", "125 W", "1"], ["Grafikkarte", "220 W", "1"],
              ["RAM-Modul", "5 W", "4"], ["SSD (NVMe)", "7 W", "2"], ["Gehäuselüfter", "3 W", "4"],
              ["Kartenleser und USB-Geräte", "10 W", "1"]]),
            "Netzteile gibt es von 400 W bis 1.200 W in <b>50-W-Schritten</b>. Auf die maximale Leistungsaufnahme ist ein Puffer von <b>20 %</b> aufzuschlagen.",
            "Ermitteln Sie das Netzteil, das Sie auswählen."),
          Z({ h: "Maximale Leistungsaufnahme", s: "426", e: "W" },
            { h: "Mit 20 % Puffer", s: "511,2", e: "W" },
            { h: "Gewähltes Netzteil", s: "550", e: "W" }),
          p("25 + 125 + 220 + 4 · 5 + 2 · 7 + 4 · 3 + 10 = <b>426 W</b>",
            "426 W · 1,2 = <b>511,2 W</b>",
            "Nächste Stufe darüber: <b>550-W-Netzteil</b>. 500 W wären zu wenig — beim Netzteil wird immer aufgerundet."),
          "1 BE Summe (Stückzahlen beachten), 1 BE Puffer, 2 BE richtige Stufe mit Begründung.",
          "IHK Frühjahr 2024 · 3 e)"),

        T("Stromkosten pro Jahr", 3,
          p("Der PC läuft an <b>220 Arbeitstagen je 8 Stunden</b>. Das Netzteil aus b) ist im Schnitt zu <b>60 %</b> ausgelastet und hat einen Wirkungsgrad von <b>88 %</b>.",
            "Berechnen Sie die Stromkosten pro Jahr bei 0,32 € je kWh.",
            "<i>Haben Sie in b) kein Netzteil ermittelt, rechnen Sie mit 600 W.</i>"),
          Z({ h: "Leistungsaufnahme aus dem Stromnetz", s: ["375", "409,1"], e: "W" },
            { h: "Energie pro Jahr", s: ["660", "720"], e: "kWh" },
            { h: "Stromkosten pro Jahr", s: ["211,20", "230,40"], e: "€" }),
          p("Abgegebene Leistung: 550 W · 0,6 = 330 W",
            "Aus dem Netz (Verluste im Netzteil!): 330 W ÷ 0,88 = <b>375 W</b>",
            "Betriebsstunden: 220 · 8 h = 1.760 h → 0,375 kW · 1.760 h = <b>660 kWh</b>",
            "Kosten: 660 kWh · 0,32 €/kWh = <b>211,20 €</b>",
            "Mit 600 W: 360 W ÷ 0,88 ≈ 409,1 W → 720 kWh → 230,40 €."),
          "1 BE Wirkungsgrad richtig (durch 0,88 teilen, nicht malnehmen), 1 BE Energie in kWh, 1 BE Kosten.",
          "IHK Frühjahr 2024 · 3 f)"),

        T("Barcode-Scanner über USB versorgen", 2,
          p("Zum Wareneingang gehört ein Barcode-Scanner. Mitgeliefert wird ein Netzteil mit <b>12 V / 0,75 A</b>. Alternativ kann der Scanner über USB mit <b>5 V</b> versorgt werden.",
            "Ermitteln Sie rechnerisch, welche Stromstärke der USB-Anschluss liefern müsste, damit dem Scanner dieselbe Leistung zur Verfügung steht. Formel: P = U · I"),
          Z({ h: "Leistung des Scanners", s: "9", e: "W" }, { h: "Nötige Stromstärke bei 5 V", s: "1,8", e: "A" }),
          p("P = 12 V · 0,75 A = <b>9 W</b>", "I = P ÷ U = 9 W ÷ 5 V = <b>1,8 A</b>"),
          "", "IHK Herbst 2025 · 3 ea)"),

        T("Aussetzer am USB-Hub", 3,
          p("Der Scanner hängt an einem <b>passiven USB-2.0-Hub</b>, an dem auch Tastatur, Maus und ein USB-Stick angeschlossen sind. Immer wieder bricht die Verbindung zum Scanner ab.",
            "Begründen Sie einen möglichen Zusammenhang mit der Stromversorgung und nennen Sie eine Abhilfe."),
          FREI(),
          p("Ein USB-2.0-Port liefert höchstens <b>0,5 A (2,5 W)</b>, USB 3.x 0,9 A (4,5 W). Der Scanner braucht aber 1,8 A (9 W).",
            "Ein passiver Hub hat keine eigene Stromversorgung: alle Geräte teilen sich den Strom <b>eines</b> Ports. Bei Lastspitzen (Scannen mit Beleuchtung) bricht die Spannung ein, der Scanner startet neu oder verliert die Verbindung.",
            "Abhilfe: das mitgelieferte Netzteil verwenden, einen aktiven Hub mit eigenem Netzteil einsetzen oder einen Port mit ausreichender Leistung (z. B. USB-C mit Power Delivery)."),
          "2 BE Begründung (zu wenig Strom je Port bzw. geteilter Strom am Hub), 1 BE Abhilfe.",
          "IHK Herbst 2025 · 3 eb)"),

        T("Kaufvertragsstörungen", 2,
          p("LPT legt großen Wert darauf, dass die Kaufverträge für die neuen Arbeitsplätze reibungslos erfüllt werden.",
            "Nennen Sie zwei Kaufvertragsstörungen, die dabei auf Seiten des Lieferanten eintreten können."),
          FREI(),
          ul(["<b>Lieferungsverzug</b> (Nicht-rechtzeitig-Lieferung): die Ware kommt nicht zum vereinbarten Termin",
              "<b>Mangelhafte Lieferung</b> (Schlechtleistung): falsche Art, falsche Menge oder schlechte Qualität, z. B. PCs mit 16 statt 32 GB RAM"]) +
          p("Auf Seiten des Käufers wären es Annahmeverzug und Zahlungsverzug."),
          "Je Störung 1 BE.", "IHK Frühjahr 2024 · 1 fa)"),

        T("Störungen vorbeugen", 2,
          p("Geben Sie für die beiden in f) genannten Störungen je eine Maßnahme an, mit der LPT ihnen schon beim Abschluss des Kaufvertrags vorbeugen kann."),
          FREIE("Lieferungsverzug:", "Mangelhafte Lieferung:"),
          p("<b>Lieferungsverzug:</b> festen Liefertermin (Fixgeschäft) vereinbaren; Vertragsstrafe (Konventionalstrafe) bei Verspätung; Lieferanten mit nachweislich guter Termintreue wählen; zeitlichen Puffer einplanen.",
            "<b>Mangelhafte Lieferung:</b> genaue technische Spezifikation in der Bestellung (z. B. „32 GB RAM“); Abnahme bzw. Wareneingangsprüfung vereinbaren; vorab ein Testgerät anfordern; Garantie- oder Qualitätsvereinbarung."),
          "Je sinnvolle Maßnahme 1 BE.", "IHK Frühjahr 2024 · 1 fb)"),

        T("Rechte bei Lieferungsverzug", 2,
          p("Der Lieferant der Monitore liefert trotz Mahnung nicht. LPT hat ihm eine angemessene Nachfrist gesetzt, die ebenfalls verstrichen ist.",
            "Beschreiben Sie ein Recht, das LPT jetzt geltend machen kann."),
          FREI(),
          p("Nach Ablauf der Nachfrist kann LPT wählen:" +
            ul(["<b>Rücktritt</b> vom Kaufvertrag — und die Monitore bei einem anderen Händler kaufen,",
                "<b>Schadensersatz statt der Leistung</b> — z. B. die Mehrkosten eines teureren Ersatzkaufs, wenn der Lieferant den Verzug zu vertreten hat,",
                "weiterhin auf <b>Lieferung bestehen</b> und zusätzlich den Verzögerungsschaden verlangen."]),
            "Ohne Nachfrist gibt es nur Lieferung plus Verzögerungsschaden (Ausnahme: Fixgeschäft)."),
          "1 BE Recht genannt, 1 BE beschrieben.", "IHK Frühjahr 2026 · 3 ca)")
      ]),

      aufgabe(P1, 2, "Netzwerk: IPv4, IPv6 und Fehlersuche", ["ip", "netzwerk"], [
        T("Subnetz der Messstationen", 4,
          p("Die Messstationen in der Fertigungshalle bekommen ein eigenes Subnetz. Die erste Station erhält die Adresse <b>10.40.7.140/26</b>.",
            "Ermitteln Sie:"),
          Z({ h: "Subnetzmaske", s: "255.255.255.192", t: 1 },
            { h: "Anzahl nutzbarer Hostadressen", s: "62" },
            { h: "Netzadresse", s: "10.40.7.128", t: 1 },
            { h: "Broadcast-Adresse", s: "10.40.7.191", t: 1 }),
          p("/26 → 26 Einsen → <b>255.255.255.192</b>",
            "Hostanteil 32 − 26 = 6 Bit → 2<sup>6</sup> − 2 = <b>62</b> nutzbare Adressen",
            "Blockgröße 256 − 192 = 64 → Netze .0, .64, .128, .192. Die 140 liegt im Block .128 bis .191:",
            "Netzadresse <b>10.40.7.128</b>, Broadcast <b>10.40.7.191</b>, nutzbar .129 bis .190."),
          "Je Wert 1 BE.", "IHK Frühjahr 2026 · 2 a)"),

        T("Adressen des Subnetzes", 3,
          p("Ein Rechner in der Qualitätssicherung hatte keinen Netzzugang. Nachdem Sie die Adresse per Befehl erneuert haben, weist ihm der DHCP-Server Folgendes zu:" + code(
            "IPv4-Adresse  . . . . . . . . . : 172.18.64.35\n" +
            "Subnetzmaske  . . . . . . . . . : 255.255.255.0\n" +
            "Standardgateway . . . . . . . . : 172.18.64.1"),
            "Geben Sie für dieses Subnetz an:"),
          Z({ h: "Netzadresse", s: "172.18.64.0", t: 1 },
            { h: "Broadcast-Adresse", s: "172.18.64.255", t: 1 },
            { h: "Anzahl möglicher Hosts", s: "254" }),
          p("Maske 255.255.255.0 = /24: die ersten drei Oktette sind das Netz.",
            "Netzadresse <b>172.18.64.0</b>, Broadcast <b>172.18.64.255</b>",
            "Hosts: 256 Adressen − 2 (Netz- und Broadcastadresse) = <b>254</b>"),
          "Je Wert 1 BE.", "Azubi-Navigator P10 · 3 ad)"),

        T("Unterschiede IPv4 und IPv6", 4,
          p("Ältere Maschinensteuerungen bei LPT arbeiten nur mit IPv4, die neuen Messgeräte schon mit IPv6.",
            "Beschreiben Sie zwei Unterschiede zwischen den Protokollen IPv4 und IPv6."),
          FREIE("Unterschied 1:", "Unterschied 2:"),
          ul(["<b>Adresslänge:</b> IPv4 32 Bit, IPv6 128 Bit — dadurch ein riesiger Adressraum (NAT wird überflüssig)",
              "<b>Schreibweise:</b> IPv4 dezimal mit Punkten (10.40.7.140), IPv6 hexadezimal in acht Blöcken mit Doppelpunkten (fe80::3e52:…)",
              "<b>Konfiguration:</b> IPv4 manuell oder DHCP, IPv6 zusätzlich automatisch per SLAAC",
              "<b>Header:</b> IPv6 hat einen schlankeren Header fester Länge ohne Prüfsumme → schnellere Verarbeitung",
              "<b>Broadcast:</b> gibt es nur bei IPv4, IPv6 nutzt Multicast"]),
          "Je Unterschied 2 BE (nennen und beschreiben).", "IHK Frühjahr 2026 · 2 c)"),

        T("IPv4 und IPv6 gemeinsam betreiben", 3,
          p("Bis alle Maschinen IPv6 können, müssen beide Protokolle im Hallennetz funktionieren. Erläutern Sie eine Möglichkeit, IPv4 und IPv6 kombiniert zu betreiben."),
          FREI(),
          p("<b>Dual Stack:</b> Geräte (Rechner, Router, Server) haben <b>gleichzeitig einen IPv4- und einen IPv6-Protokollstapel</b> mit je eigener Adresse. Mit IPv6-Partnern sprechen sie IPv6, mit reinen IPv4-Geräten weiter IPv4 — keine Umstellung auf einen Schlag nötig.",
            "Ebenso richtig: <b>Tunneling</b> (IPv6-Pakete werden in IPv4 verpackt, z. B. 6in4, und durch ein IPv4-Netz geschickt) oder <b>Übersetzung</b> (NAT64/DNS64 übersetzt zwischen den Protokollen)."),
          "Möglichkeit genannt 1 BE, erläutert 2 BE.", "IHK Frühjahr 2026 · 2 d)"),

        T("IPv6-Adresse auswerten", 5,
          p("ipconfig am neuen Messrechner zeigt:" + code(
            "Physische Adresse . . . . . . . . : 3C-52-82-0A-6E-19\n" +
            "Verbindungslokale IPv6-Adresse  . : fe80::3e52:82ff:fe0a:6e19%12"),
            "Geben Sie an:"),
          Z({ h: "Länge der IPv6-Adresse in Bit", s: "128", e: "Bit" },
            { h: "Ungekürzte Darstellung in Hexadezimalschreibweise (ohne %12)", s: "fe80:0000:0000:0000:3e52:82ff:fe0a:6e19", t: 1 },
            { h: "Präfixlänge: /", s: "64" },
            { h: "Interface-Identifier", s: ["3e52:82ff:fe0a:6e19", "::3e52:82ff:fe0a:6e19"], t: 1 }),
          p("IPv6-Adressen sind <b>128 Bit</b> lang.",
            "Ungekürzt: <b>fe80:0000:0000:0000:3e52:82ff:fe0a:6e19</b> — „::“ steht hier für drei Blöcke 0000, in jedem Block werden führende Nullen ergänzt.",
            "Link-local-Adressen haben das Präfix fe80::/<b>64</b>; die hinteren 64 Bit sind der Interface-Identifier <b>3e52:82ff:fe0a:6e19</b>.",
            "Nebenbei: Er wurde per EUI-64 aus der MAC-Adresse 3C-52-82-0A-6E-19 gebildet — in der Mitte ff:fe eingefügt, im ersten Byte das 7. Bit umgedreht (3C → 3E). „%12“ ist nur die Nummer der Netzwerkschnittstelle."),
          "Länge 1 BE, ungekürzte Darstellung 2 BE, Präfix 1 BE, Interface-Identifier 1 BE.", "IHK Frühjahr 2024 · 2 c)"),

        T("Adresse 169.254.40.17", 3,
          p("Ein anderer Messrechner erreicht nach einem Neustart niemanden mehr. ipconfig zeigt die IPv4-Adresse <b>169.254.40.17</b>, Subnetzmaske 255.255.0.0, kein Standardgateway.",
            "Nennen Sie die Art dieser Adresse, die wahrscheinliche Ursache und eine Maßnahme."),
          FREIE("Art der Adresse:", "Ursache:", "Maßnahme:"),
          p("<b>APIPA-Adresse</b> (Automatic Private IP Addressing, Bereich 169.254.0.0/16).",
            "Der Rechner steht auf „IP-Adresse automatisch beziehen“, hat aber <b>keinen DHCP-Server erreicht</b> — z. B. DHCP-Dienst aus, Kabel oder Switchport defekt, falsches VLAN, Adressbereich erschöpft. Dann gibt er sich selbst eine Adresse, mit der er nur Nachbarn mit APIPA-Adresse erreicht.",
            "Maßnahme: Verbindung und DHCP-Server prüfen und danach die Adresse erneuern (ipconfig /renew) — oder eine feste Adresse aus dem Hallennetz eintragen."),
          "Je Teil 1 BE.", "Azubi-Navigator P01 · 2 cc) / IHK Herbst 2024 · 1 da)"),

        T("Fehler benennen", 1,
          p("Beim Messrechner aus f) haben Sie die Adresse erneuert. Um die Wirkung zu prüfen, geben Sie „ping 10.40.7.129“ (Gateway) ein:" + code(
            "Ping wird ausgeführt für 10.40.7.129 mit 32 Bytes Daten:\n" +
            "Antwort von 10.40.7.129: Bytes=32 Zeit<1ms TTL=64\n" +
            "Antwort von 10.40.7.129: Bytes=32 Zeit<1ms TTL=64\n" +
            "Antwort von 10.40.7.129: Bytes=32 Zeit=1ms TTL=64\n" +
            "Antwort von 10.40.7.129: Bytes=32 Zeit<1ms TTL=64\n" +
            "Ping-Statistik für 10.40.7.129:\n" +
            "    Pakete: Gesendet = 4, Empfangen = 4, Verloren = 0 (0% Verlust)"),
            "An dieser Ausgabe erkennen Sie, was der Fehler war. Benennen Sie ihn."),
          FREI(),
          p("Der Rechner hatte <b>keine gültige IP-Adresse</b> zugeteilt bekommen (er war auf eine APIPA-Adresse ausgewichen). Nach der Erneuerung über den DHCP-Server hat er eine Adresse aus dem Hallennetz, das Gateway antwortet ohne Verluste."),
          "", "Azubi-Navigator P10 · 3 ae)"),

        T("Erreichbarkeit prüfen", 2,
          p("Ein Konstruktions-PC soll den Lizenzserver unter der Adresse <b>10.40.1.20</b> nutzen. Geben Sie einen geeigneten Befehl an, um von diesem PC aus die Erreichbarkeit des Servers zu prüfen."),
          Z({ h: "Befehl:", s: ["ping 10.40.1.20", "tracert 10.40.1.20", "traceroute 10.40.1.20", "ping -t 10.40.1.20", "ping"], t: 1 }),
          p("<b>ping 10.40.1.20</b> — schickt ICMP-Echo-Anfragen; antwortet der Server, ist er erreichbar.",
            "Ebenso richtig: <b>tracert 10.40.1.20</b> (Linux: traceroute) — zeigt zusätzlich, über welche Router der Weg führt und wo er abbricht."),
          "Befehl 1 BE, mit der richtigen Adresse 1 BE.", "IHK Frühjahr 2024 · 2 f)")
      ]),

      aufgabe(P1, 3, "IT-Sicherheit, Verschlüsselung und Datensicherung", ["malware", "schutz", "datenschutz", "verschluesselung", "backup"], [
        T("Gefahr durch Phishing", 2,
          p("In der Buchhaltung von LPT häufen sich E-Mails, die angeblich von einem Stahllieferanten stammen. Beschreiben Sie eine Gefahr, die von solchen Phishing-Mails für LPT ausgeht."),
          FREI(),
          ul(["Zugangsdaten (Online-Banking, E-Mail-Konto) werden auf gefälschten Seiten abgegriffen — Angreifer melden sich danach als LPT an.",
              "Ein Anhang installiert Schadsoftware, z. B. Ransomware, die alle Konstruktionsdaten verschlüsselt.",
              "Gefälschte Rechnungen mit geänderter Bankverbindung: LPT überweist Geld an Betrüger.",
              "Vertrauliche Daten (Kundendaten, Zeichnungen) fließen ab."]),
          "Gefahr genannt 1 BE, Folge für LPT beschrieben 1 BE.", "IHK Herbst 2024 · 3 ca)"),

        T("Merkmale einer Phishing-Mail", 3,
          p("Sie schulen die Beschäftigten der Buchhaltung. Nennen Sie drei Anzeichen, an denen man erkennen kann, dass eine E-Mail eine Phishing-Mail ist."),
          FREIE("Anzeichen 1:", "Anzeichen 2:", "Anzeichen 3:"),
          ul(["Absenderadresse passt nicht zur Firma (fremde oder leicht veränderte Domain)",
              "keine persönliche Anrede („Sehr geehrter Kunde“), Rechtschreib- und Grammatikfehler",
              "Zeitdruck oder Drohung („Konto wird in 24 Stunden gesperrt“)",
              "Aufforderung, Passwort, PIN oder Bankdaten einzugeben",
              "Links, deren Ziel nicht zur angeblichen Firma passt",
              "unerwartete Anhänge, z. B. mit doppelter Endung wie Rechnung.pdf.exe"]),
          "Je Anzeichen 1 BE.", "IHK Herbst 2024 · 3 cb)"),

        T("Schutz vor Phishing", 2,
          p("Nennen Sie zwei Maßnahmen, die Sie LPT zum Schutz vor Phishing empfehlen — eine technische und eine organisatorische."),
          FREIE("technisch:", "organisatorisch:"),
          p("<b>Technisch:</b> Spam- und Phishing-Filter am Mailserver; ausführbare Anhänge (.exe, .js, Makros) blockieren; Mehr-Faktor-Anmeldung, damit gestohlene Passwörter allein nicht reichen; Warnhinweis bei externen Absendern; SPF/DKIM/DMARC prüfen.",
            "<b>Organisatorisch:</b> regelmäßige Schulungen und Phishing-Tests; Rückruf beim Lieferanten unter bekannter Nummer, wenn sich eine Bankverbindung ändert; klarer Meldeweg für verdächtige Mails an die IT."),
          "Je Maßnahme 1 BE.", "IHK Herbst 2024 · 3 cc)"),

        T("Arten von Schadsoftware", 3,
          p("Neue Beschäftigte der Konstruktion werden über Schadsoftware informiert. „Malware“ ist dabei der Oberbegriff.",
            "Nennen Sie drei Arten von Malware."),
          FREIE("Art 1:", "Art 2:", "Art 3:"),
          p("Zum Beispiel: <b>Virus, Wurm, Trojaner, Ransomware, Spyware, Keylogger, Adware, Rootkit, Botnetz-Software (Bot)</b>."),
          "Je Art 1 BE.", "IHK Frühjahr 2024 · 4 da)"),

        T("Merkmale der Malware-Arten", 3,
          p("Ordnen Sie den in d) genannten Arten jeweils ein typisches Merkmal zu."),
          FREIE("Merkmal zu Art 1:", "Merkmal zu Art 2:", "Merkmal zu Art 3:"),
          ul(["<b>Virus:</b> hängt sich an ein anderes Programm oder eine Datei an und verbreitet sich, wenn dieses ausgeführt wird",
              "<b>Wurm:</b> wird nach der Infektion selbst aktiv und verbreitet sich eigenständig über das Netzwerk",
              "<b>Trojaner:</b> steckt getarnt in nützlicher Software und wird mit deren Start aktiv (z. B. öffnet eine Hintertür)",
              "<b>Ransomware:</b> verschlüsselt Dateien bzw. sperrt den Zugriff und fordert Lösegeld",
              "<b>Spyware:</b> spioniert Daten und Aktivitäten aus",
              "<b>Keylogger:</b> zeichnet Tastatureingaben auf, z. B. Passwörter"]),
          "Je passendes Merkmal 1 BE.", "IHK Frühjahr 2024 · 4 db)"),

        T("Rechtliche Grundlage", 1,
          p("LPT schickt Kliniken auch Bestellungen für Sonderanfertigungen, in denen Name und Befund des Patienten stehen. Nennen Sie eine rechtliche Grundlage, die für diese Daten besondere Anforderungen stellt."),
          FREI(),
          p("<b>DSGVO</b> (Datenschutz-Grundverordnung) — Gesundheitsdaten gehören zu den besonderen Kategorien nach Art. 9, Art. 32 verlangt geeignete Sicherheitsmaßnahmen wie Verschlüsselung. Ergänzend: <b>BDSG</b> (Bundesdatenschutzgesetz)."),
          "", "IHK Frühjahr 2025 · 2 aa)"),

        T("Asymmetrisch verschlüsseln", 4,
          p("Die Einkäuferin einer Klinik hat LPT per E-Mail ihren <b>öffentlichen Schlüssel</b> geschickt, damit Bestellungen künftig verschlüsselt ausgetauscht werden können. Ihr Kollege bittet Sie um Unterstützung.",
            "Skizze:" + code("LPT (Absender)  ──── verschlüsselte E-Mail ────►  Klinik (Empfängerin)\n" +
                             "                                                Schlüsselpaar der Klinik:\n" +
                             "                                                öffentlich + privat"),
            "Beschreiben Sie die Vorgehensweise bei der asymmetrischen Verschlüsselung und Entschlüsselung einer E-Mail von LPT an die Klinik."),
          FREIE("Verschlüsselung bei LPT:", "Entschlüsselung bei der Klinik:"),
          p("LPT <b>verschlüsselt</b> die Nachricht mit dem <b>öffentlichen Schlüssel der Klinik</b> und schickt sie ab.",
            "Die Klinik <b>entschlüsselt</b> sie mit ihrem <b>eigenen privaten Schlüssel</b>. Den hat nur sie — wer die E-Mail unterwegs abfängt, kann mit dem öffentlichen Schlüssel nichts entschlüsseln.",
            "Merksatz: verschlüsselt wird immer mit dem öffentlichen Schlüssel des <b>Empfängers</b>."),
          "Je Schritt 2 BE (richtiger Schlüssel und wessen Schlüssel).", "IHK Frühjahr 2025 · 2 ba)"),

        T("Schutzziel", 1,
          p("Nennen Sie das IT-Schutzziel, das durch diese Verwendung der Schlüssel erreicht wird."),
          Z({ h: "Schutzziel:", s: ["Vertraulichkeit"], t: 1 }),
          p("<b>Vertraulichkeit</b> — nur die Klinik kann die Bestellung lesen."),
          "", "IHK Frühjahr 2025 · 2 bb)"),

        T("Asymmetrisch gegenüber symmetrisch", 2,
          p("Nennen Sie einen Vorteil und einen Nachteil der asymmetrischen gegenüber der symmetrischen Verschlüsselung."),
          FREIE("Vorteil:", "Nachteil:"),
          p("<b>Vorteil:</b> Kein geheimer Schlüssel muss vorher sicher ausgetauscht werden — der öffentliche Schlüssel darf jeder kennen. Bei vielen Partnern braucht jeder nur ein Schlüsselpaar. Signaturen werden möglich.",
            "<b>Nachteil:</b> deutlich langsamer und rechenaufwendiger; die Echtheit öffentlicher Schlüssel muss gesichert werden (Zertifikate). In der Praxis deshalb hybrid: asymmetrisch nur für den Austausch eines symmetrischen Sitzungsschlüssels."),
          "Je 1 BE.", "IHK Frühjahr 2025 · 2 bc)"),

        T("Differenzielle Sicherung", 2,
          p("Damit keine Konstruktionsdaten verloren gehen, wird der Dateiserver sonntags voll gesichert, an den Werktagen läuft zusätzlich eine Teilsicherung.",
            "Beschreiben Sie die differenzielle Sicherung."),
          FREI(),
          p("Zuerst eine <b>Vollsicherung</b>. Danach sichert jede differenzielle Sicherung <b>alle Daten, die seit der letzten Vollsicherung</b> neu hinzugekommen oder geändert worden sind.",
            "Die Sicherungen werden deshalb von Tag zu Tag größer, bis wieder voll gesichert wird. Zum Wiederherstellen braucht man nur die Vollsicherung und die <b>letzte</b> differenzielle Sicherung."),
          "Bezug zur letzten Vollsicherung 1 BE, Folge (wächst / Wiederherstellung) 1 BE.", "Azubi-Navigator P01 · 2 da)"),

        T("Inkrementelle Sicherung", 2,
          p("Beschreiben Sie die inkrementelle Sicherung."),
          FREI(),
          p("Zuerst eine <b>Vollsicherung</b>. Danach sichert jede inkrementelle Sicherung nur, was <b>seit der letzten Sicherung</b> — egal ob voll oder inkrementell — geändert wurde.",
            "Die einzelnen Sicherungen bleiben klein und laufen schnell. Zum Wiederherstellen braucht man aber die Vollsicherung und <b>alle</b> Inkremente danach, in der richtigen Reihenfolge."),
          "Bezug zur letzten Sicherung 1 BE, Folge (klein / Wiederherstellung) 1 BE.", "Azubi-Navigator P01 · 2 db)")
      ]),

      aufgabe(P1, 4, "Algorithmen, Schreibtischtest und Datenmodell", ["algorithmus", "schreibtisch", "programmierung", "erm", "datenbank"], [
        T("Algorithmus erläutern", 3,
          p("Für das Materiallager hat ein Kollege folgenden Pseudocode geschrieben:" + code(
            "Zeile 1  FUNKTION pruefeBestand(teile, mindestmenge)\n" +
            "Zeile 2    FÜR JEDES teil IN teile\n" +
            "Zeile 3      WENN teil.bestand <= mindestmenge DANN\n" +
            "Zeile 4        AUSGABE teil.bezeichnung + \" nachbestellen\"\n" +
            "Zeile 5      ENDE WENN\n" +
            "Zeile 6    ENDE FÜR\n" +
            "Zeile 7  ENDE FUNKTION"),
            "Erläutern Sie die Zeilen 2, 3 und 4."),
          FREIE("Zeile 2:", "Zeile 3:", "Zeile 4:"),
          p("<b>Zeile 2:</b> Schleife über die Liste <i>teile</i> — jedes Element steht nacheinander in der Variablen <i>teil</i> bereit.",
            "<b>Zeile 3:</b> Bedingung: Ist der Bestand dieses Teils <b>kleiner oder gleich</b> der Mindestmenge?",
            "<b>Zeile 4:</b> Nur dann wird die Bezeichnung mit dem Text „ nachbestellen“ verkettet und ausgegeben."),
          "Je Zeile 1 BE.", "IHK Herbst 2025 · 4 ca)"),

        T("Schreibtischtest", 2,
          p("Führen Sie einen Schreibtischtest durch und geben Sie alle Ausgaben an für <b>mindestmenge = 40</b> und:" + code(
            "teile = [\n" +
            "  {bezeichnung: \"Fräser 6 mm\",          bestand: 55},\n" +
            "  {bezeichnung: \"Spannzange ER16\",      bestand: 40},\n" +
            "  {bezeichnung: \"Kühlschmierstoff 5 l\", bestand: 12},\n" +
            "  {bezeichnung: \"Messtaster\",           bestand: 41}\n" +
            "]")),
          FREI(true),
          code("Spannzange ER16 nachbestellen\nKühlschmierstoff 5 l nachbestellen") +
          p("Fräser (55) und Messtaster (41) liegen über 40. Die Spannzange mit <b>genau 40</b> wird ausgegeben, weil die Bedingung „&lt;=“ lautet — bei „&lt;“ wäre sie nicht dabei. Beliebte Falle!"),
          "Je richtige Zeile 1 BE, eine zusätzliche falsche Zeile kostet 1 BE.", "IHK Herbst 2025 · 4 cb)"),

        T("Fehler finden", 3,
          p("Jede Lieferung an eine Klinik besteht aus mehreren Positionen; zu jeder Position sind Gewicht pro Stück und Menge bekannt. Folgender Pseudocode soll das Gesamtgewicht einer Lieferung berechnen:" + code(
            "Zeile 1  FUNKTION gesamtgewicht(positionen)\n" +
            "Zeile 2    summe = 0\n" +
            "Zeile 3    FÜR JEDE pos IN positionen\n" +
            "Zeile 4      summe = summe * (pos.gewicht * pos.menge)\n" +
            "Zeile 5    ENDE FÜR\n" +
            "Zeile 6    RÜCKGABE summe\n" +
            "Zeile 7  ENDE FUNKTION"),
            "Ein Test mit den Positionen (2,5 kg × 4 Stück) und (0,8 kg × 10 Stück) liefert <b>0 kg</b>.",
            "Nennen Sie die fehlerhafte Zeile und erläutern Sie, warum die Funktion nie das richtige Gesamtgewicht liefert."),
          Z({ h: "Fehlerhafte Zeile:", s: "4" }, { h: "Erläuterung:", frei: true }),
          p("<b>Zeile 4</b>: Die Positionsgewichte werden mit der bisherigen Summe <b>multipliziert</b> statt addiert.",
            "Weil <i>summe</i> mit 0 beginnt, ergibt 0 · (…) immer wieder 0 — das Ergebnis ist bei jeder Eingabe 0 kg. Richtig wären 2,5 · 4 + 0,8 · 10 = 10 + 8 = 18 kg."),
          "1 BE Zeile, 2 BE Erläuterung (Multiplikation statt Addition, Startwert 0).", "IHK Herbst 2025 · 4 da)"),

        T("Fehler beheben", 2,
          p("Korrigieren Sie die fehlerhafte Zeile und geben Sie das Ergebnis des Tests nach der Korrektur an."),
          Z({ h: "Korrigierte Zeile 4:", s: ["summe = summe + (pos.gewicht * pos.menge)", "summe = summe + pos.gewicht * pos.menge", "summe += pos.gewicht * pos.menge", "summe += (pos.gewicht * pos.menge)", "summe = (pos.gewicht * pos.menge) + summe", "summe = pos.gewicht * pos.menge + summe"], t: 1 },
            { h: "Ergebnis des Tests:", s: "18", e: "kg" }),
          p("<b>summe = summe + (pos.gewicht * pos.menge)</b> — dann liefert der Test <b>18 kg</b>."),
          "Je 1 BE.", "IHK Herbst 2025 · 4 db)"),

        T("ER-Modell für das Materiallager", 8,
          p("Die Lagerdaten sollen in einer Datenbank gespeichert werden. Dazu soll ein Entity-Relationship-Diagramm erstellt werden, das folgende Annahmen berücksichtigt:",
            "Materialien werden auf mehreren Lagerplätzen eingelagert, und auf einem Lagerplatz liegen mehrere Materialien. Gespeichert werden sollen eine Materialnummer (MatNr), die Materialbezeichnung, die Mindestmenge, eine Lagerplatznummer (LPNr), die Regalzone, die maximale Traglast des Lagerplatzes sowie das Einlagerungsdatum und die eingelagerte Menge.",
            "Erstellen Sie das ER-Diagramm mit Entitäten, Attributen, Primärschlüsseln, Beziehung und Kardinalitäten (Chen- oder Krähenfuß-Notation). Zeichnen Sie auf Papier und notieren Sie hier die Lösung in Stichpunkten."),
          FREI(true),
          p("<b>Entitäten</b> (Primärschlüssel unterstrichen):" +
            ul(["Material (<u>MatNr</u>, Bezeichnung, Mindestmenge)",
                "Lagerplatz (<u>LPNr</u>, Regalzone, MaxTraglast)"]),
            "<b>Beziehung:</b> Material <b>m</b> — wird eingelagert auf — <b>n</b> Lagerplatz",
            "Die Attribute <b>Einlagerungsdatum</b> und <b>Menge</b> gehören an die <b>Beziehung</b> — nicht an Material und nicht an Lagerplatz, denn sie beschreiben genau eine Einlagerung eines Materials auf einem Platz.",
            "Als Tabellen wird daraus: Material(<u>MatNr</u>, …), Lagerplatz(<u>LPNr</u>, …), Einlagerung(<u>MatNr↑, LPNr↑, Einlagerungsdatum</u>, Menge)."),
          "2 BE je Entität mit Primärschlüssel und Attributen (4), 2 BE Beziehung mit m:n-Kardinalität, 2 BE Datum und Menge an der Beziehung.",
          "IHK Frühjahr 2026 · 4 c)"),

        T("Zweck von Fremdschlüsseln", 2,
          p("Bei der Umsetzung in Tabellen entsteht für die Einlagerung eine eigene Tabelle mit den Feldern MatNr und LPNr als Fremdschlüssel.",
            "Beschreiben Sie den Zweck von Fremdschlüsseln in relationalen Datenbanken."),
          FREI(),
          p("Ein Fremdschlüssel verweist auf den <b>Primärschlüssel einer anderen Tabelle</b> und stellt so die <b>Beziehung</b> zwischen den Tabellen her (hier: welches Material liegt auf welchem Platz).",
            "Die Datenbank sichert damit die <b>referenzielle Integrität</b>: Es kann keine Einlagerung für ein Material oder einen Lagerplatz geben, die nicht existieren."),
          "Verweis/Beziehung 1 BE, Integrität 1 BE.", "IHK Herbst 2025 · 4 ab)"),

        T("Vorteil verknüpfter Tabellen", 2,
          p("Beschreiben Sie den Vorteil, Material- und Lagerplatzdaten in getrennten, über Schlüssel verknüpften Tabellen zu speichern statt in einer großen Tabelle."),
          FREI(),
          p("<b>Keine Redundanz:</b> Bezeichnung und Mindestmenge eines Materials stehen nur einmal in der Datenbank, nicht bei jeder Einlagerung erneut. Änderungen passieren an einer Stelle — keine widersprüchlichen Daten (Änderungsanomalien), weniger Speicherbedarf. Über die Verknüpfung (JOIN) lassen sich die Daten trotzdem jederzeit zusammen abfragen."),
          "", "IHK Herbst 2025 · 4 ac)"),

        T("Variablen und Konstanten", 3,
          p("In der Lagersoftware stehen folgende Zeilen:" + code(
            "MWST_SATZ    = 0.19\n" +
            "mindestmenge = 40\n" +
            "standort     = \"Halle 2\"\n" +
            "anzahlTeile  = 0"),
            "Beschreiben Sie den Unterschied zwischen Variablen und Konstanten und begründen Sie, welcher der vier Werte als Konstante festgelegt werden sollte."),
          FREIE("Unterschied:", "Konstante und Begründung:"),
          p("<b>Variable:</b> benannter Speicherplatz, dessen Wert sich während der Programmausführung ändern kann (z. B. <i>anzahlTeile</i> wird hochgezählt).",
            "<b>Konstante:</b> benannter Wert, der nach der Festlegung nicht mehr geändert werden kann; oft in Großbuchstaben geschrieben.",
            "<b>MWST_SATZ</b> sollte eine Konstante sein: Er gilt im ganzen Programm gleich, darf sich zur Laufzeit nicht versehentlich ändern und muss bei einer Gesetzesänderung nur an einer Stelle angepasst werden."),
          "2 BE Unterschied, 1 BE begründete Auswahl.", "Azubi-Navigator P06 · 3 eb)")
      ])
    ]);

  /* ========================================================================
     PROGNOSE 2 — Hansen & Voss Steuerberatung
     ====================================================================== */
  const P2 = "p2";
  const prognose2 = pruefung(2, "Hansen & Voss Steuerberatung: Notebooks, Umzug, Datensicherheit, Mandantenportal",
    "Nutzwertanalyse & Leasing · WLAN & Fehlersuche · Signatur, VPN, Datenschutz · Netzplan, OOP & KI",
    p("Die Steuerkanzlei <b>Hansen & Voss PartG</b> in Kiel betreut rund 1.200 Mandanten und beschäftigt 38 Mitarbeitende. Steuerdaten sind besonders schutzbedürftig.",
      "Sie sind Auszubildende/r der <b>KielNet IT-Service GmbH</b>, die die Kanzlei betreut. Anstehende Projekte:" +
      ul(["40 neue Notebooks für mobiles Arbeiten — kaufen oder leasen?",
          "Umzug in ein neues Bürogebäude mit neuem WLAN und schnellerem Internetanschluss,",
          "Absicherung: Festplattenverschlüsselung, VPN mit Zertifikat, digitale Signatur, Datenschutz,",
          "ein Mandantenportal als Projekt, bei dem auch KI-Werkzeuge eingesetzt werden sollen."])),
    INTRO("Nutzwertanalyse, Leasing und Skonto, WLAN und Fehlersuche nach OSI, Bandbreite, digitale Signatur, Verschlüsselung und VPN, Datenschutz, Mehr-Faktor-Anmeldung, Netzplan, OOP und KI"),
    [
      aufgabe(P2, 1, "Wirtschaftlichkeit: Nutzwertanalyse, Leasing, Skonto", ["nutzwert", "angebotsvergleich", "leasing", "kosten", "rechnung"], [
        T("Nutzwertanalyse", 7,
          p("Für die 40 Notebooks haben drei Anbieter ein Angebot abgegeben. Ihnen liegt eine unvollständige Nutzwertanalyse vor.",
            "Die Punkte wurden nach Schulnoten vergeben (1 = sehr gut, 6 = ungenügend). Gewichtete Punkte = Punkte × Gewichtung.",
            "Vervollständigen Sie die Tabelle. Tragen Sie in der Zeile „Bewertung“ beim besten Angebot eine 1 ein, beim zweitbesten eine 2 und beim am wenigsten geeigneten eine 3."),
          RASTER([
            ["Angebot", "", "1", "", "2", "", "3", ""],
            ["Kriterium", "Gewichtung", "Punkte", "gewichtet", "Punkte", "gewichtet", "Punkte", "gewichtet"],
            ["Leistung", "50", "2", { s: "100" }, "1", { s: "50" }, "3", { s: "150" }],
            ["Service", "30", "3", { s: "90" }, "4", { s: "120" }, "1", { s: "30" }],
            ["Preis", "20", "2", { s: "40" }, "4", { s: "80" }, "1", { s: "20" }],
            ["Summe", "100", "7", { s: "230" }, "9", { s: "250" }, "5", { s: "200" }],
            ["Bewertung", "", "", { s: "2" }, "", { s: "3" }, "", { s: "1" }]]),
          tab(["", "Angebot 1", "Angebot 2", "Angebot 3"], [
            ["Leistung (50)", "2 · 50 = 100", "1 · 50 = 50", "3 · 50 = 150"],
            ["Service (30)", "3 · 30 = 90", "4 · 30 = 120", "1 · 30 = 30"],
            ["Preis (20)", "2 · 20 = 40", "4 · 20 = 80", "1 · 20 = 20"],
            ["<b>Summe</b>", "<b>230</b>", "<b>250</b>", "<b>200</b>"],
            ["<b>Bewertung</b>", "2", "3", "<b>1</b>"]]) +
          p("Bei Schulnoten ist die <b>kleinste</b> gewichtete Summe am besten: Angebot 3 (200) hat den höchsten Nutzwert, obwohl es bei der Leistung nur eine 3 hat. Angebot 2 ist trotz der besten Leistung am schlechtesten."),
          "Gewichtete Punkte 3 BE, Summen 2 BE, Bewertung 2 BE. Folgefehler werden nicht doppelt abgezogen.",
          "Azubi-Navigator P08 · 2 b)"),

        T("Grundprinzip des Leasings", 4,
          p("Ein weiterer Anbieter bietet die 40 Notebooks zu einem Gesamtpreis von <b>52.800,00 €</b> an, alternativ einen Leasingvertrag über <b>vier Jahre</b> mit einer monatlichen Rate von <b>1.290,00 €</b> und Kaufoption.",
            "Beschreiben Sie das Grundprinzip des Leasings und erklären Sie dabei die Eigentums- und Besitzverhältnisse."),
          FREIE("Grundprinzip:", "Eigentümer:", "Besitzer:"),
          p("Leasing ist ein zeitlich begrenztes, vertraglich vereinbartes <b>Nutzungsrecht</b> an einem Wirtschaftsgut gegen regelmäßige Leasingraten — ähnlich einer Miete.",
            "<b>Eigentümer</b> bleibt der <b>Leasinggeber</b> (Leasinggesellschaft).",
            "<b>Besitzer</b> ist der <b>Leasingnehmer</b> — die Kanzlei, die die Notebooks nutzt."),
          "Grundprinzip 2 BE, Eigentümer 1 BE, Besitzer 1 BE.", "IHK Frühjahr 2023 · 2 ba)"),

        T("Kauf oder Leasing — Differenz", 3,
          p("Vergleichen Sie den Kaufpreis mit den Gesamtkosten des Leasings aus b) und ermitteln Sie den Differenzbetrag."),
          Z({ h: "Gesamtkosten Leasing", s: "61.920", e: "€" }, { h: "Differenzbetrag", s: "9.120", e: "€" }),
          p("Kauf: 52.800,00 €",
            "Leasing: 1.290,00 € · 48 Monate = <b>61.920,00 €</b>",
            "Das Leasing ist um <b>9.120,00 €</b> teurer als der Kauf."),
          "Leasingkosten 1 BE (48 Monate!), Differenz 1 BE, Aussage welches teurer ist 1 BE.", "IHK Frühjahr 2023 · 2 bb)"),

        T("Was spricht für Leasing?", 3,
          p("Trotz der Mehrkosten denkt die Kanzlei über das Leasing nach. Nennen Sie drei Vorteile, die für einen Leasingvertrag sprechen."),
          FREIE("Vorteil 1:", "Vorteil 2:", "Vorteil 3:"),
          ul(["keine hohe Einmalzahlung, Liquidität bleibt erhalten (kein Kapital gebunden)",
              "feste, planbare monatliche Raten",
              "nach der Laufzeit Austausch gegen aktuelle Geräte — technisch immer auf dem neuesten Stand",
              "Leasingraten sind als Betriebsausgaben sofort absetzbar",
              "Service, Wartung oder Versicherung oft inklusive; keine Entsorgung der Altgeräte"]),
          "Je Vorteil 1 BE.", "IHK Frühjahr 2023 · 2 bc)"),

        T("Kaufoption", 2,
          p("Erläutern Sie den Begriff Kaufoption im Leasingvertrag."),
          FREI(),
          p("Die Kaufoption gibt dem Leasingnehmer das <b>Recht, aber nicht die Pflicht</b>, die Notebooks am Ende der Laufzeit zu einem vorher vereinbarten Restwert zu kaufen. Die Kanzlei kann also entscheiden, ob sie die Geräte übernimmt oder zurückgibt."),
          "", "IHK Frühjahr 2023 · 2 bd)"),

        T("Skonto berechnen", 2,
          p("Für 40 Dockingstationen erhält die Kanzlei eine Rechnung:" +
            tab(["Rechnungsbetrag (brutto)", "Zahlungsbedingung"], [["3.847,90 €", "innerhalb von 10 Tagen mit 3 % Skonto, innerhalb von 30 Tagen netto"]]),
            "Berechnen Sie den Skontobetrag, der abgezogen werden kann. Runden Sie kaufmännisch auf zwei Nachkommastellen."),
          Z({ h: "Skontobetrag", s: "115,44", e: "€" }),
          p("3.847,90 € · 0,03 = 115,437 € ≈ <b>115,44 €</b>",
            "(Überweisungsbetrag bei Skontoabzug: 3.847,90 € − 115,44 € = 3.732,46 €)"),
          "Rechnung 1 BE, Rundung 1 BE.", "IHK Herbst 2025 · 1 ca)"),

        T("Gründe für einen Rabatt", 4,
          p("Neben Skonto gibt es als Preisnachlass auch den Rabatt. Beschreiben Sie zwei mögliche Gründe, einen Rabatt zu erhalten."),
          FREIE("Grund 1:", "Grund 2:"),
          ul(["<b>Mengenrabatt:</b> bei Abnahme einer großen Menge (z. B. 40 Dockingstationen auf einmal)",
              "<b>Treuerabatt:</b> für langjährige Stammkunden",
              "<b>Neukundenrabatt:</b> um neue Kunden zu gewinnen",
              "<b>Zeitrabatt</b> wie Frühbezugsrabatt: für frühzeitige Bestellung, oder Aktionsrabatt",
              "<b>Wiederverkäuferrabatt</b> oder Personalrabatt für bestimmte Kundengruppen",
              "<b>Online-Rabatt</b> für Bestellungen über den Webshop"]),
          "Je Grund 2 BE (genannt und beschrieben).", "IHK Herbst 2025 · 1 cb)")
      ]),

      aufgabe(P2, 2, "WLAN, Netzwerkdiagnose und Bandbreite", ["wlan", "netzwerk", "osi", "ip", "uebertragung"], [
        T("WLAN-Zugang einrichten", 2,
          p("Im neuen Büro sollen Sie ein Notebook mit dem WLAN der Kanzlei verbinden. Es ist mit <b>WPA2-Personal (WPA-PSK)</b> gesichert.",
            "Nennen Sie zwei Informationen, die Sie vom Administrator erfragen müssen, um das Notebook im WLAN anzumelden."),
          FREIE("Information 1:", "Information 2:"),
          p("<b>SSID</b> (Name des WLANs — vor allem, wenn es versteckt ist) und der <b>Pre-Shared Key</b> (WLAN-Passwort/Netzwerkschlüssel)."),
          "Je 1 BE.", "IHK Frühjahr 2022 · 3 a)"),

        T("WPA-PSK oder WPA-Enterprise?", 3,
          p("Für die Anmeldung im WLAN gibt es neben WPA-PSK auch das EAP-Verfahren mit RADIUS-Server (WPA-Enterprise). Für WPA-PSK ist die Bewertung schon eingetragen:" +
            tab(["Verfahren", "Vorteil", "Nachteil", "Unternehmensgröße"], [
              ["WPA-PSK", "einfach einzurichten", "unsicher, weil das gemeinsame Passwort mit steigender Nutzerzahl schnell weitergegeben wird", "kleine Unternehmen mit wenigen Mitarbeitenden"],
              ["WPA-Enterprise (EAP/RADIUS)", "?", "?", "?"]]),
            "Ergänzen Sie für WPA-Enterprise je einen Vorteil und einen Nachteil und geben Sie an, für welche Unternehmensgröße es sich vorwiegend eignet."),
          FREIE("Vorteil:", "Nachteil:", "Unternehmensgröße:"),
          p("<b>Vorteil:</b> deutlich sicherer — jede Person meldet sich mit eigenem Benutzernamen und Passwort (oder Zertifikat) an; einzelne Zugänge lassen sich sperren.",
            "<b>Nachteil:</b> aufwendiger einzurichten, ein RADIUS-Server ist nötig.",
            "<b>Unternehmensgröße:</b> mittlere und große Unternehmen."),
          "Je Feld 1 BE.", "IHK Frühjahr 2022 · 3 b)"),

        T("Fehlersuche auf Schicht 1", 4,
          p("Ein Mitarbeiter meldet, dass sein Notebook keinen Zugriff aufs Netz hat. Die Statusanzeige der WLAN-Verbindung zeigt u. a.:" + code(
            "IPv4-Konnektivität:  Kein Netzwerkzugriff\n" +
            "IPv6-Konnektivität:  Kein Netzwerkzugriff\n" +
            "Medienstatus:        Aktiviert\n" +
            "SSID:                HV-Buero\n" +
            "Dauer:               01:42:17\n" +
            "Übertragungsrate:    866,7 Mbit/s\n" +
            "Signalqualität:      sehr gut"),
            "Sie suchen den Fehler im OSI-Modell von unten nach oben (Bottom-up) und beginnen mit Schicht 1.",
            "Benennen Sie einen Wert, der der OSI-Schicht 1 zuzuordnen ist, und interpretieren Sie ihn bezüglich der Funktionalität."),
          FREIE("Wert:", "Interpretation:"),
          p("<b>Wert:</b> Medienstatus „Aktiviert“ oder Signalqualität „sehr gut“ oder Übertragungsrate 866,7 Mbit/s.",
            "<b>Interpretation:</b> Die physische Funkverbindung steht und ist gut — <b>Schicht 1 arbeitet fehlerfrei</b>. Der Fehler liegt in einer höheren Schicht (z. B. fehlende IP-Adresse auf Schicht 3)."),
          "Wert 2 BE, Interpretation 2 BE.", "IHK Frühjahr 2022 · 3 d)"),

        T("Herkunft der physischen Adresse", 2,
          p("Zur Analyse der Schichten 2 und 3 lassen Sie sich die Netzwerkkonfiguration anzeigen:" + code(
            "Drahtlos-LAN-Adapter WLAN:\n" +
            "   Beschreibung . . . . . . . . . . : Intel Wi-Fi 6E AX211\n" +
            "   Physische Adresse  . . . . . . . : 8C-16-45-A2-07-3B\n" +
            "   DHCP aktiviert . . . . . . . . . : Ja\n" +
            "   Autokonfiguration aktiviert  . . : Ja\n" +
            "   Verbindungslokale IPv6-Adresse . : fe80::5a1c:92d0:3b7e:11f4%7(Bevorzugt)"),
            "Trotz fehlenden Netzzugriffs werden zwei Adressen angezeigt. Beschreiben Sie die Herkunft der Adresse 8C-16-45-A2-07-3B."),
          FREI(),
          p("Es ist die <b>MAC-Adresse</b> — die Hardware-Adresse, die der <b>Hersteller</b> der Netzwerkkarte fest zugeordnet hat (48 Bit; die ersten 3 Byte kennzeichnen den Hersteller, die letzten 3 das einzelne Gerät)."),
          "", "IHK Frühjahr 2022 · 3 ea)"),

        T("Herkunft der IPv6-Adresse", 2,
          p("Beschreiben Sie die Herkunft der Adresse fe80::5a1c:92d0:3b7e:11f4."),
          FREI(),
          p("Es ist eine <b>verbindungslokale IPv6-Adresse (Link-local)</b>. Jedes IPv6-fähige Gerät bildet sie beim Start <b>automatisch selbst</b> (Autokonfiguration) — ohne DHCP-Server und ohne Router: Präfix fe80::/64 plus ein Interface-Identifier, der zufällig oder aus der MAC-Adresse gebildet wird. Sie gilt nur im lokalen Netzsegment."),
          "", "IHK Frühjahr 2022 · 3 eb)"),

        T("Welcher Server antwortet?", 1,
          p("Sie konzentrieren sich nun auf die höheren Schichten. Nach dem Befehl zur Erneuerung der IP-Adresse wird angezeigt:" + code(
            "Drahtlos-LAN-Adapter WLAN:\n" +
            "   Verbindungslokale IPv6-Adresse . : fe80::5a1c:92d0:3b7e:11f4%7\n" +
            "   IPv4-Adresse . . . . . . . . . . : 172.20.14.77\n" +
            "   Subnetzmaske . . . . . . . . . . : 255.255.240.0\n" +
            "   Standardgateway  . . . . . . . . : 172.20.0.1"),
            "Nennen Sie die Bezeichnung des Servers, der durch den Befehl zur Erneuerung der IP-Adresse kontaktiert wurde."),
          Z({ h: "Server:", s: ["DHCP-Server", "DHCP", "DHCP Server", "DHCP-Dienst"], t: 1 }),
          p("Der <b>DHCP-Server</b>."), "", "IHK Frühjahr 2022 · 3 fa)"),

        T("Adressen des Hosts", 3,
          p("Geben Sie für das Notebook aus f) folgende Adressen an:"),
          Z({ h: "Netzadresse", s: ["172.20.0.0", "172.20.0.0/20"], t: 1 },
            { h: "Hostadresse", s: ["172.20.14.77", "0.0.14.77"], t: 1 },
            { h: "Broadcastadresse", s: "172.20.15.255", t: 1 }),
          p("255.255.240.0 = /20 → im 3. Oktett Blöcke zu 256 − 240 = 16: 0–15, 16–31, … Die 14 liegt im Block 0–15.",
            "Netzadresse <b>172.20.0.0</b> · Hostadresse <b>172.20.14.77</b> (Hostanteil 0.0.14.77) · Broadcast <b>172.20.15.255</b>"),
          "Je Adresse 1 BE.", "IHK Frühjahr 2022 · 3 fb)"),

        T("Fehler ermitteln", 2,
          p("Um die veränderte Situation zu prüfen, geben Sie „ping 172.20.0.1“ ein:" + code(
            "Ping wird ausgeführt für 172.20.0.1 mit 32 Bytes Daten:\n" +
            "Antwort von 172.20.0.1: Bytes=32 Zeit=4ms TTL=64\n" +
            "Antwort von 172.20.0.1: Bytes=32 Zeit=3ms TTL=64\n" +
            "Antwort von 172.20.0.1: Bytes=32 Zeit=5ms TTL=64\n" +
            "Antwort von 172.20.0.1: Bytes=32 Zeit=3ms TTL=64\n" +
            "Ping-Statistik für 172.20.0.1:\n" +
            "    Pakete: Gesendet = 4, Empfangen = 4, Verloren = 0 (0% Verlust)"),
            "Sie werten Ihre gesamte Fehlersuche aus. Benennen Sie den ermittelten Fehler."),
          FREI(),
          p("Dem Notebook war <b>keine IP-Adresse zugeteilt</b> (kein Netzwerkzugriff trotz funktionierender Schicht 1). Nach der Erneuerung über den DHCP-Server ist das Gateway ohne Verluste erreichbar."),
          "", "IHK Frühjahr 2022 · 3 fc)"),

        T("Bandbreite für den neuen Anschluss", 4,
          p("Der Internetanschluss im neuen Büro muss gleichzeitig abdecken — jeweils im Up- und im Download:" +
            ul(["25 VoIP-Telefonate mit je 120 kbit/s,", "Datenübertragungen und Serverlast mit mindestens 30 Mbit/s."]),
            "Angebote:" + tab(["Nr.", "Download", "Upload"], [["1", "100 Mbit/s", "20 Mbit/s"], ["2", "50 Mbit/s", "40 Mbit/s"], ["3", "250 Mbit/s", "25 Mbit/s"]]),
            "a) Berechnen Sie die benötigte Mindestbandbreite (1 Mbit/s = 1.000 kbit/s). b) Geben Sie das geeignete Angebot an."),
          Z({ h: "a) Mindestbandbreite", s: "33", e: "Mbit/s" }, { h: "b) Geeignetes Angebot Nr.", s: "2" }),
          p("VoIP: 25 · 120 kbit/s = 3.000 kbit/s = 3 Mbit/s; + 30 Mbit/s = <b>33 Mbit/s</b> in beide Richtungen.",
            "Nur <b>Angebot 2</b> schafft 33 Mbit/s auch im Upload (40 Mbit/s). 1 und 3 haben zu wenig Upload, obwohl ihr Download viel höher ist."),
          "a) 2 BE, b) 2 BE mit Begründung.", "Azubi-Navigator P08 · 2 aa), ab)"),

        T("Unerwartete Adresse am Drucker", 2,
          p("Für den neuen Netzwerkdrucker gibt der Administrator vor:" + code(
            "Netzwerk:    192.168.60.0/24\n" +
            "DHCP-Range:  192.168.60.30 - 192.168.60.250\n" +
            "Router:      192.168.60.1"),
            "Der Drucker soll später eine statische Adresse bekommen. Beim ersten Einschalten zeigt er jedoch die Adresse <b>169.254.77.201</b>.",
            "Begründen Sie diese „Vorkonfiguration“."),
          FREI(),
          p("Der Drucker ist ab Werk auf <b>automatische (dynamische) Adressvergabe</b> eingestellt. Er hat noch keinen DHCP-Server erreicht und sich deshalb selbst eine <b>APIPA-Adresse</b> aus 169.254.0.0/16 gegeben."),
          "", "IHK Herbst 2024 · 1 da)")
      ]),

      aufgabe(P2, 3, "Verschlüsselung, Signatur, VPN und Datenschutz", ["signatur", "verschluesselung", "schutz", "vpn", "datenschutz", "homeoffice"], [
        T("Digitale Signatur", 4,
          p("Die Kanzlei übermittelt Steuererklärungen mit einer „elektronischen Unterschrift“ (Signatur) an das Rechenzentrum der Finanzverwaltung.",
            "Skizze:" + code("Kanzlei  ── Erklärung + Signatur ──►  Rechenzentrum\n" +
                             "Schlüsselpaar der Kanzlei:           kennt den öffentlichen\n" +
                             "privat + öffentlich                  Schlüssel der Kanzlei"),
            "Beschreiben Sie die prinzipielle Vorgehensweise bei der Erstellung und Überprüfung der Signatur zwischen Kanzlei und Rechenzentrum."),
          FREIE("Erstellung (Kanzlei):", "Überprüfung (Rechenzentrum):"),
          ul(["Die Kanzlei berechnet den <b>Hashwert</b> der Erklärung und <b>verschlüsselt ihn mit ihrem privaten Schlüssel</b> — das ist die Signatur. Sie wird mit der Erklärung verschickt.",
              "Das Rechenzentrum <b>entschlüsselt die Signatur mit dem öffentlichen Schlüssel der Kanzlei</b> und erhält den ursprünglichen Hashwert. Klappt das, stammt die Erklärung von der Kanzlei (<b>Authentizität</b>).",
              "Dann berechnet es den Hashwert der empfangenen Erklärung neu. Stimmen beide Hashwerte überein, wurde unterwegs nichts verändert (<b>Integrität</b>)."]),
          "Erstellung 2 BE, Überprüfung 2 BE.", "IHK Herbst 2025 · 3 h)"),

        T("Wohin mit dem Wiederherstellungsschlüssel?", 3,
          p("Die Notebooks werden mit einer Festplattenverschlüsselung geschützt. Bei der Einrichtung müssen Sie wählen, wie der Wiederherstellungsschlüssel gesichert wird. Die erste Möglichkeit ist schon bewertet:" +
            tab(["Verfahren", "Vorteil", "Nachteil"], [["Auf dem Notebook in einer Textdatei speichern", "kein zusätzlicher Speicher nötig", "im Wiederherstellungsfall evtl. nicht erreichbar"]]),
            "Beurteilen Sie die übrigen Verfahren, indem Sie stichwortartig jeweils einen typischen Vorteil und einen Nachteil nennen."),
          FREIE("In einen Cloud-Speicher hochladen:", "Auf einem USB-Stick speichern:", "Ausdrucken:"),
          tab(["Verfahren", "Vorteil", "Nachteil"], [
            ["Cloud-Speicher", "von verschiedenen Geräten aus erreichbar", "Anbieter hält Datenschutz evtl. nicht ein, Zugangsdaten nötig"],
            ["USB-Stick", "mobil, offline", "kann leicht verloren gehen oder defekt werden"],
            ["Ausdruck", "kein IT-Gerät nötig, nicht hackbar", "Drucker und sichere Ablage nötig, kann verloren gehen"]]),
          "Je Verfahren 1 BE (Vorteil und Nachteil).", "IHK Herbst 2023 · 3 cb)"),

        T("Vertraulichkeit und Integrität", 4,
          p("Der Algorithmus der Verschlüsselungssoftware unterstützt die Sicherheitsziele Vertraulichkeit und Integrität. Beschreiben Sie, was das für die Mandantendaten auf der SSD bedeutet."),
          FREIE("Vertraulichkeit:", "Integrität:"),
          p("<b>Vertraulichkeit:</b> Die Daten auf der SSD können nur von berechtigten Personen gelesen werden — ohne Schlüssel sind sie unlesbar.",
            "<b>Integrität:</b> Eine Veränderung der gespeicherten Daten wird bemerkt — Daten können nicht unbemerkt manipuliert werden."),
          "Je Schutzziel 2 BE.", "IHK Herbst 2023 · 3 cc)"),

        T("Schutz bei Diebstahl", 2,
          p("Beurteilen Sie, inwiefern die Festplattenverschlüsselung die Mandantendaten schützt, wenn ein ganzes Notebook gestohlen wird."),
          FREI(),
          p("Die Daten sind geschützt: Ohne das Passwort bzw. den Schlüssel zum Entsperren des Laufwerks kann der Dieb nicht auf die Daten zugreifen — auch nicht, wenn er die SSD ausbaut.",
            "Einschränkung: Wird das Notebook im eingeschalteten, entsperrten Zustand gestohlen oder klebt das Passwort am Gerät, hilft die Verschlüsselung nicht."),
          "", "IHK Herbst 2023 · 3 cd)"),

        T("VPN im Homeoffice", 2,
          p("Beschäftigte im Homeoffice sollen über ein VPN auf den Server der Kanzlei zugreifen. Zusätzlich bekommt jede Person ein persönlich ausgestelltes digitales Zertifikat.",
            "Beschreiben Sie den sicherheitstechnischen Vorteil eines VPN."),
          FREI(),
          p("Ein VPN baut einen <b>verschlüsselten Tunnel</b> durch das unsichere Internet. So ist eine sichere Datenübertragung auch über ein unsicheres Netz möglich: Die Daten können unterwegs weder mitgelesen noch verändert werden."),
          "", "IHK Herbst 2023 · 3 da)"),

        T("Identifizierung mit Zertifikat", 3,
          p("Beschreiben Sie die Identifizierung, die die Kanzlei mithilfe des persönlichen digitalen Zertifikats plant."),
          FREI(),
          p("Das Zertifikat dient der <b>Authentifizierung</b> der Person am Homeoffice-Arbeitsplatz gegenüber dem Server der Kanzlei: Es bestätigt (von einer Zertifizierungsstelle signiert), dass der enthaltene öffentliche Schlüssel zu genau dieser Person gehört. Beim Verbindungsaufbau beweist der Client mit dem passenden privaten Schlüssel, dass er der Inhaber ist — nur so wird der VPN-Zugang gewährt."),
          "", "IHK Herbst 2023 · 3 db)"),

        T("Personenbezogene Daten", 3,
          p("Im Mandantenportal sollen Steuerunterlagen verarbeitet werden. Diese Daten müssen nach geltenden Gesetzen besonders geschützt werden — man spricht von personenbezogenen Daten.",
            "a) Beschreiben Sie, was personenbezogene Daten sind. (2 BE)",
            "b) Nennen Sie eine rechtliche Grundlage, die ihre Verarbeitung regelt. (1 BE)"),
          FREIE("a)", "b)"),
          p("a) Alle Informationen, die sich auf eine <b>identifizierte oder identifizierbare natürliche Person</b> beziehen — z. B. Name, Steuer-ID, Anschrift, Einkommen, Bankverbindung. Sie stehen unter besonderem rechtlichem Schutz.",
            "b) <b>DSGVO</b> (Datenschutz-Grundverordnung) oder <b>BDSG</b> (Bundesdatenschutzgesetz)."),
          "", "Azubi-Navigator P06 · 4 c)"),

        T("Mehr-Faktor-Authentifizierung", 3,
          p("Für die Anmeldung am Mandantenportal wird eine Mehr-Faktor-Authentifizierung eingeführt. Dabei werden Nachweise aus unterschiedlichen Kategorien kombiniert.",
            "Nennen Sie drei dieser Kategorien. Konkrete Beispiele werden nicht gewertet."),
          FREIE("Kategorie 1:", "Kategorie 2:", "Kategorie 3:"),
          ul(["<b>Wissen</b> — etwas, das nur die Person weiß (Passwort, PIN)",
              "<b>Besitz</b> — etwas, das nur die Person hat (Smartphone mit App, Token, Smartcard)",
              "<b>Inhärenz/Biometrie</b> — etwas, das die Person ist (Fingerabdruck, Gesicht)",
              "außerdem möglich: <b>Ort</b> (Standort) und <b>Verhalten</b> (z. B. Tippverhalten)"]),
          "Je Kategorie 1 BE.", "Azubi-Navigator VÜ 3 · 3 d)"),

        T("Passwortrichtlinie", 1,
          p("Die Kanzlei hat folgende Passwortrichtlinie festgelegt:" +
            ul(["mindestens <b>12 Zeichen</b>,",
                "Zeichen aus mindestens <b>drei der vier Gruppen</b> Großbuchstaben, Kleinbuchstaben, Ziffern, Sonderzeichen,",
                "Änderung alle 180 Tage, Sperrung nach 3 Fehlversuchen."]),
            "Nennen Sie ein Beispiel für ein Passwort, das dieser Richtlinie entspricht."),
          FREI(),
          p("Zum Beispiel <b>Steuer-Ber4ter</b> oder <b>Kiel#Hafen2026</b> — mindestens 12 Zeichen und mindestens drei Zeichengruppen. Nicht richtig wäre z. B. „Kanzlei2026“ (nur 11 Zeichen)."),
          "", "Azubi-Navigator P02 · 4 da)")
      ]),

      aufgabe(P2, 4, "Projekt, objektorientierte Programmierung und KI", ["netzplan", "projekt", "oop", "programmierung", "ki"], [
        T("Netzplan vervollständigen", 9,
          p("Sie sollen den Netzplan für die Einführung des Mandantenportals vervollständigen. Vorgangsliste (Dauer in Arbeitstagen):" +
            tab(["Vorgang", "Beschreibung", "Dauer", "Vorgänger"], [
              ["A", "Anforderungen aufnehmen", "3", "–"],
              ["B", "Portal-Anbieter auswählen", "4", "A"],
              ["C", "Cloud-Umgebung einrichten", "5", "B"],
              ["D", "Datenschutz-Folgenabschätzung", "6", "A"],
              ["E", "Portal konfigurieren", "4", "C"],
              ["F", "Schnittstelle zur Kanzleisoftware programmieren", "7", "C"],
              ["G", "Mitarbeitende schulen", "2", "D, E"],
              ["H", "Pilottest mit Mandanten", "3", "F, G"],
              ["I", "Go-live", "1", "H"]]),
            "Der Entwurf enthält schon einige Werte. Tragen Sie die fehlenden FAZ, FEZ, SAZ, SEZ, GP (Gesamtpuffer) und FP (freier Puffer) ein. Start bei 0.",
            "<i>FP = FAZ des Nachfolgers − FEZ des Vorgangs; GP = SAZ − FAZ.</i>"),
          RASTER([
            ["Vorgang", "FAZ", "FEZ", "SAZ", "SEZ", "GP", "FP"],
            ["A", "0", "3", "0", "3", "0", "0"],
            ["B", "3", "7", { s: "3" }, { s: "7" }, { s: "0" }, { s: "0" }],
            ["C", { s: "7" }, { s: "12" }, { s: "7" }, { s: "12" }, { s: "0" }, { s: "0" }],
            ["D", "3", "9", { s: "11" }, { s: "17" }, { s: "8" }, { s: "7" }],
            ["E", { s: "12" }, { s: "16" }, { s: "13" }, { s: "17" }, { s: "1" }, { s: "0" }],
            ["F", { s: "12" }, { s: "19" }, { s: "12" }, { s: "19" }, { s: "0" }, { s: "0" }],
            ["G", { s: "16" }, { s: "18" }, { s: "17" }, { s: "19" }, { s: "1" }, { s: "1" }],
            ["H", { s: "19" }, { s: "22" }, { s: "19" }, { s: "22" }, { s: "0" }, { s: "0" }],
            ["I", { s: "22" }, { s: "23" }, { s: "22" }, { s: "23" }, { s: "0" }, { s: "0" }]]),
          tab(["Vorgang", "FAZ", "FEZ", "SAZ", "SEZ", "GP", "FP"], [
            ["A", "0", "3", "0", "3", "0", "0"], ["B", "3", "7", "3", "7", "0", "0"], ["C", "7", "12", "7", "12", "0", "0"],
            ["D", "3", "9", "11", "17", "8", "7"], ["E", "12", "16", "13", "17", "1", "0"], ["F", "12", "19", "12", "19", "0", "0"],
            ["G", "16", "18", "17", "19", "1", "1"], ["H", "19", "22", "19", "22", "0", "0"], ["I", "22", "23", "22", "23", "0", "0"]]) +
          p("<b>Vorwärts:</b> FAZ = größter FEZ der Vorgänger — G wartet auf E (16), nicht auf D (9); H wartet auf F (19).",
            "<b>Rückwärts</b> ab Projektende 23: SEZ = kleinster SAZ der Nachfolger — C: min(E 13, F 12) = 12; A: min(B 3, D 11) = 3.",
            "Projektdauer <b>23 Tage</b>."),
          "Vorwärtsrechnung 3 BE, Rückwärtsrechnung 3 BE, Puffer 3 BE. Folgefehler werden nicht doppelt abgezogen.",
          "IHK Frühjahr 2025 · 3 aa)"),

        T("Kritischer Pfad", 1,
          p("Nennen Sie die Vorgänge des kritischen Pfads."),
          Z({ h: "Kritischer Pfad:", s: ["A-B-C-F-H-I", "A, B, C, F, H, I", "A B C F H I", "ABCFHI", "A → B → C → F → H → I", "A->B->C->F->H->I", "A – B – C – F – H – I"], t: 1 }),
          p("<b>A – B – C – F – H – I</b>: alle Vorgänge mit Gesamtpuffer 0. Jede Verzögerung dort verschiebt das Projektende."),
          "", "IHK Frühjahr 2025 · 3 ab)"),

        T("Vorteile objektorientierter Sprachen", 2,
          p("Die Schnittstelle (Vorgang F) kann objektorientiert oder prozedural programmiert werden. Nennen Sie zwei Vorteile objektorientierter gegenüber prozeduralen Programmiersprachen."),
          FREIE("Vorteil 1:", "Vorteil 2:"),
          p("Z. B. bessere <b>Wiederverwendbarkeit</b>, leichtere <b>Erweiterbarkeit</b> und <b>Wartbarkeit</b>, <b>Vererbung</b>, <b>Kapselung</b>, <b>Polymorphie</b>; reale Dinge (Mandant, Beleg) lassen sich direkt als Objekte abbilden."),
          "Je Vorteil 1 BE.", "IHK Frühjahr 2026 · 4 a)"),

        T("Glossar: Klasse und Methode", 4,
          p("Für das Entwicklerteam erstellen Sie ein Glossar zur objektorientierten Programmierung. Als Beispiel dient ein Auszug aus dem Entwurf:" + code(
            "Klasse Mandant\n" +
            "  - mandantenNr : Integer\n" +
            "  - name        : String\n" +
            "  + abgabefrist(jahr : Integer) : Datum"),
            "Ergänzen Sie passende Beschreibungen zu den Begriffen <b>Klasse</b> und <b>Methode</b>."),
          FREIE("Klasse:", "Methode:"),
          p("<b>Klasse:</b> Bauplan (Vorlage) für gleichartige Objekte; legt fest, welche Attribute und Methoden alle Objekte dieses Typs haben — hier <i>Mandant</i>. Klassen nennt man auch Objekttypen.",
            "<b>Methode:</b> „Unterprogramm“ (Funktion/Prozedur) einer Klasse; beschreibt und implementiert das Verhalten der Objekte — hier <i>abgabefrist(jahr)</i>."),
          "Je Begriff 2 BE.", "Azubi-Navigator P03 · 4 aa)"),

        T("Risiken KI-gestützter Software", 4,
          p("Die KielNet erwägt, beim Mandantenportal KI-gestützte Software einzusetzen, die Programmcode prüft, Fehler findet und direkt Verbesserungen vorschlägt.",
            "Nennen Sie vier Risiken, die mit dem Einsatz solcher KI-gestützter Software verbunden sein können."),
          FREIE("Risiko 1:", "Risiko 2:", "Risiko 3:", "Risiko 4:"),
          ul(["Datenschutz: Quellcode oder Mandantendaten gehen an den KI-Anbieter",
              "falsche Verbesserungsvorschläge oder Fehlinterpretationen, die ungeprüft übernommen werden",
              "Sicherheitslücken durch fehlerhaften generierten Code",
              "fehlende Nachvollziehbarkeit der Entscheidungen der KI",
              "Abhängigkeit vom Anbieter und von der KI, Verlust eigener Kompetenz",
              "Überanpassung an Trainingsdaten, Urheberrechtsfragen beim erzeugten Code"]),
          "Je Risiko 1 BE.", "Azubi-Navigator VÜ 3 · 2 a)"),

        T("KI-gestützte Entwicklungsumgebung", 3,
          p("Zusätzlich sollen die Entwickler eine KI-gestützte Entwicklungsumgebung nutzen. Nennen Sie drei Funktionen solcher Systeme."),
          FREIE("Funktion 1:", "Funktion 2:", "Funktion 3:"),
          ul(["Code-Vervollständigung (Autocompletion)", "Fehlererkennung und Debugging-Hinweise",
              "Code aus Beschreibungen oder Kommentaren erzeugen", "Refactoring-Vorschläge",
              "Unit-Tests erzeugen", "Dokumentation und Kommentare schreiben", "Sicherheitsanalyse des Codes"]),
          "Je Funktion 1 BE.", "Azubi-Navigator VÜ 2 · 1 d)"),

        T("Vorteil von KI für die Beschäftigten", 2,
          p("Einige Beschäftigte der Kanzlei stehen dem Einsatz von KI skeptisch gegenüber. Erläutern Sie einen möglichen Vorteil für die Beschäftigten selbst."),
          FREI(),
          p("Z. B.: Routinearbeit (Belege sortieren, Standardfragen beantworten) wird abgenommen — die gewonnene Zeit bleibt für anspruchsvollere Beratung. Oder: weniger Fehler, dadurch effektivere eigene Arbeit und weniger Stress in der Abgabezeit."),
          "", "IHK Frühjahr 2025 · 4 b)")
      ])
    ]);

  /* ========================================================================
     PROGNOSE 3 — Elbtal Getränkelogistik GmbH
     ====================================================================== */
  const P3 = "p3";
  const RECHNUNG =
    p("<b>Netzwerkhaus Sachsen GmbH</b> · Königsbrücker Straße 12 · 01099 Dresden · Tel. 0351 440 17-0 · Steuernummer 202/115/04711",
      "An: Elbtal Getränkelogistik GmbH · Hafenstraße 8 · 01067 Dresden · Kundennummer 4417",
      "<b>Rechnung Nr. 26-0815</b> · Rechnungsdatum 14.09.2026<br>Ihre Bestellung vom 02.09.2026 · Lieferung und Montage am 11.09.2026") +
    tab(["Pos.", "Menge", "Artikel", "Einzelpreis", "Gesamt"], [
      ["1", "4", "IP-Kamera Outdoor, PoE, IR, Heizung", "289,00 €", "1.156,00 €"],
      ["2", "1", "PoE-Switch, 16 Ports", "612,00 €", "612,00 €"],
      ["3", "4", "Monitor 27 Zoll mit DisplayPort-MST", "239,00 €", "956,00 €"],
      ["4", "3", "Montage (Stunden)", "85,00 €", "255,00 €"],
      ["", "", "Summe netto", "", "2.979,00 €"],
      ["", "", "zzgl. 19 % Umsatzsteuer", "", "566,01 €"],
      ["", "", "<b>Rechnungsbetrag</b>", "", "<b>3.545,01 €</b>"]]) +
    p("Zahlbar innerhalb von 10 Tagen mit 2 % Skonto, innerhalb von 30 Tagen ohne Abzug. Bankverbindung: Elbufer Bank Dresden. Vielen Dank für Ihren Auftrag!");
  const ANLAGE_RECHNUNG = [{ titel: "Rechnung Nr. 26-0815", html: RECHNUNG }];

  const prognose3 = pruefung(3, "Elbtal Getränkelogistik: Rechnung, Kamera-Technik, Speicher, Tourensoftware",
    "Rechnung & Lizenzen · PoE, Strom, Daisy Chaining, Ergonomie · Speicher & Übertragung · Schreibtischtest & Datenmodell",
    p("Die <b>Elbtal Getränkelogistik GmbH</b> in Dresden beliefert Gastronomie und Handel in Sachsen. Sie hat 85 Mitarbeitende, ein eigenes Lager und 14 LKW.",
      "Sie sind Auszubildende/r der <b>DataWerk Dresden GmbH</b>, die die IT der Elbtal betreut. Aktuell:" +
      ul(["die Laderampe wird mit IP-Kameras überwacht, die Bilder laufen auf vier Monitoren in der Disposition zusammen,",
          "neue Arbeitsplätze und Lizenzen für die Lagersoftware,",
          "Aufzeichnungen und Lagerdaten werden gespeichert und in die Cloud übertragen,",
          "eine Software wertet die Touren aus, die Tourendatenbank wird erweitert."])),
    INTRO("Rechnungsprüfung und Pflichtangaben, Kaufvertrag, Lizenzmodelle, PoE und P = U · I, Daisy Chaining, Ergonomie, Speicher- und Übertragungsberechnung, Schreibtischtest und Datenmodell"),
    [
      aufgabe(P3, 1, "Rechnung, Kaufvertrag und Lizenzen", ["rechnung", "kaufvertrag", "lizenz", "angebotsvergleich"], [
        T("Vorgänge auf dem Beleg", 3,
          p("Für die Überwachung der Laderampe wurde Technik gekauft. Die Buchhaltung legt Ihnen folgenden Beleg vor:" + RECHNUNG,
            "Auf dem Beleg sind mehrere kaufmännisch relevante Zeitpunkte vermerkt. Nennen Sie unter Angabe des Datums die Vorgänge, die bereits stattgefunden haben."),
          FREI(),
          ul(["02.09.2026: <b>Bestellung</b> der Ware durch die Elbtal",
              "11.09.2026: <b>Lieferung</b> (und Montage)",
              "14.09.2026: <b>Rechnungsstellung</b>"]) +
          p("Noch nicht stattgefunden hat die Zahlung (mit Skonto bis 24.09., ohne Abzug bis 14.10.)."),
          "Je Vorgang mit Datum 1 BE.", "IHK Herbst 2025 · 1 a)"),

        T("Rechnungspositionen abgleichen", 6,
          p("Sie gleichen die Rechnungspositionen ab. Beschreiben Sie dazu drei mögliche Kontrollvorgänge."),
          FREIE("Kontrolle 1:", "Kontrolle 2:", "Kontrolle 3:"),
          ul(["<b>Artikel:</b> Stimmt die Artikelbezeichnung mit Bestellung und Lieferschein überein (richtiges Kameramodell)?",
              "<b>Menge/Einheit:</b> Wurden 4 Kameras, 1 Switch, 4 Monitore bestellt und geliefert, 3 Montagestunden erbracht?",
              "<b>Einzelpreis:</b> Entspricht der Preis dem in der Bestellung vereinbarten Preis (inkl. Rabatt)?",
              "<b>Rechnerisch:</b> Menge × Einzelpreis, Summe, Umsatzsteuer richtig berechnet?",
              "<b>Steuersatz:</b> regulärer (19 %) oder ermäßigter Satz korrekt?"]) +
          p("Achtung: gefragt ist der Abgleich der <b>Positionen</b>, nicht Anschrift oder Bankverbindung."),
          "Je Kontrollvorgang 2 BE (was wird womit verglichen).", "IHK Herbst 2025 · 1 b)", { anlagen: ANLAGE_RECHNUNG }),

        T("Pflichtangaben einer Rechnung", 8,
          p("Später sollen Sie selbst Rechnungen der DataWerk prüfen. Zur Übung nehmen Sie die Rechnung der Netzwerkhaus Sachsen GmbH. Auf ihr stehen folgende Angaben:" +
            tab(["Nr.", "Angabe", "Nr.", "Angabe"], [
              ["1", "Logo des Lieferanten", "9", "Liefer- bzw. Leistungsdatum"],
              ["2", "Name und Anschrift des Lieferanten", "10", "Menge und Bezeichnung der Artikel"],
              ["3", "Name und Anschrift der Elbtal", "11", "Nettobeträge (Entgelt)"],
              ["4", "Telefonnummer des Lieferanten", "12", "Steuersatz 19 %"],
              ["5", "Fortlaufende Rechnungsnummer", "13", "Umsatzsteuerbetrag"],
              ["6", "Rechnungsdatum", "14", "Skontovereinbarung"],
              ["7", "Kundennummer", "15", "Bankverbindung"],
              ["8", "Steuernummer des Lieferanten", "16", "„Vielen Dank für Ihren Auftrag!“"]]),
            "a) Nennen Sie fünf Angaben, die gesetzlich vorgeschrieben sind. (5 BE)",
            "b) Nennen Sie drei Angaben, die gesetzlich nicht vorgeschrieben sind. (3 BE)",
            "<i>Die Nummern genügen.</i>"),
          FREIE("a) vorgeschrieben:", "b) nicht vorgeschrieben:"),
          p("a) Vorgeschrieben (§ 14 Abs. 4 UStG): <b>2, 3, 5, 6, 8, 9, 10, 11, 12, 13</b> und <b>14</b> (im Voraus vereinbarte Minderung des Entgelts, z. B. Skonto) — fünf davon genügen.",
            "b) Nicht vorgeschrieben: <b>1</b> Logo, <b>4</b> Telefonnummer, <b>7</b> Kundennummer, <b>15</b> Bankverbindung, <b>16</b> Dankesformel — drei davon genügen."),
          "a) je richtige Angabe 1 BE, b) je richtige Angabe 1 BE; falsch zugeordnete Angaben geben keinen Punkt.",
          "Azubi-Navigator P10 · 2 aa), ab)", { anlagen: ANLAGE_RECHNUNG }),

        T("Pay-per-Use-Lizenzen", 4,
          p("Die Elbtal führt eine neue Lagersoftware für alle 80 Mitarbeitenden ein. Der Hersteller bietet zwei Lizenzmodelle an: <b>Pay-per-Use</b> (Concurrent-Lizenzen) und <b>Pay-per-License</b> (Named-Lizenzen).",
            "a) Erläutern Sie kurz anhand eines Beispiels, was Pay-per-Use bei Software bedeutet. (2 BE)",
            "b) Nennen Sie zwei Vorteile von Pay-per-Use-Lizenzen. (2 BE)"),
          FREIE("a)", "b)"),
          p("a) Lizenziert wird nicht jede einzelne Person, sondern die <b>Anzahl gleichzeitiger Zugriffe</b>. Wer die Software nutzt, ist egal, solange die Höchstzahl nicht erreicht ist; meldet sich jemand ab, wird die Lizenz sofort wieder frei. <i>Beispiel:</i> Im Schichtbetrieb arbeiten nie mehr als 25 der 80 Beschäftigten gleichzeitig mit der Lagersoftware — 25 Lizenzen genügen.",
            "b) Vorteile: geringere Kosten, wenn viele nur zeitweise arbeiten; hohe Flexibilität (neue Beschäftigte brauchen keine eigene Lizenz); einfache Verwaltung, keine Lizenz pro Person pflegen."),
          "", "Azubi-Navigator P08 · 3 aa), ab)"),

        T("Kaufvertragsstörungen", 3,
          p("Beim Kauf der Kameratechnik ist es wichtig, dass der Kaufvertrag einwandfrei erfüllt wird. Nennen Sie zwei Kaufvertragsstörungen und beschreiben Sie eine davon kurz."),
          FREIE("Zwei Störungen:", "Beschreibung einer Störung:"),
          ul(["<b>Mangelhafte Lieferung (Schlechtleistung):</b> Die Ware wird geliefert, entspricht aber nicht der vereinbarten Beschaffenheit — defekt, falsch oder zu wenig (z. B. eine Kamera ohne Bild).",
              "<b>Lieferungsverzug (Nichtleistung):</b> Der Verkäufer liefert nicht oder nicht rechtzeitig.",
              "<b>Annahmeverzug:</b> Der Käufer nimmt ordnungsgemäß gelieferte Ware nicht an.",
              "<b>Zahlungsverzug:</b> Der Käufer zahlt nicht rechtzeitig."]),
          "Zwei Störungen je 1 BE, Beschreibung 1 BE.", "Azubi-Navigator P07 · 1 c)"),

        T("Formale Angaben im Angebot", 1,
          p("Für weitere Kameras am Nebentor soll die DataWerk der Elbtal ein Angebot schreiben. Dafür werden auch formale Informationen benötigt, z. B. die Anschrift.",
            "Welche formale Information könnte darüber hinaus erforderlich sein?"),
          FREI(),
          p("Zum Beispiel: <b>Ansprechpartner mit Kontaktdaten</b>, <b>Bindungsfrist</b> des Angebots (gültig bis …), <b>Datum der Anfrage</b> bzw. Bezug auf die Anfrage, Angebotsnummer und -datum."),
          "", "IHK Frühjahr 2022 · 1 cb)")
      ]),

      aufgabe(P3, 2, "Hardware, Strom und ergonomischer Arbeitsplatz", ["hardware", "strom", "daisy", "englisch", "ergonomie"], [
        T("IR und Heizung", 2,
          p("Die Kameras an der Laderampe sollen Sie technisch prüfen und einrichten. Das Datenblatt nennt drei Werte für die Leistungsaufnahme:" +
            tab(["Typical", "Max. without heater, with IR", "Max. with heater, with IR"], [["6 W", "11 W", "21 W"]]),
            "Nennen Sie den Zweck, warum Varianten mit „IR“ bzw. „heater“ angeboten werden."),
          FREIE("IR:", "Heater (Heizung):"),
          p("<b>IR</b> (Infrarot-Beleuchtung): Aufnahmen auch bei Dunkelheit, also nachts an der Rampe.",
            "<b>Heater</b>: verhindert Beschlagen, Vereisen und Frostschäden bei Kälte im Außenbereich."),
          "Je Zweck 1 BE.", "IHK Frühjahr 2026 · 1 ab)"),

        T("PoE-Standard und Stromstärke", 4,
          p("Die Kamera in der Variante „with heater, with IR“ soll über das Netzwerkkabel mit Strom versorgt werden (PoE, Power over Ethernet)." +
            tab(["Standard", "Bezeichnung", "max. Leistung am Switch-Port", "max. Leistung am Endgerät"], [
              ["IEEE 802.3af", "PoE", "15,4 W", "12,95 W"],
              ["IEEE 802.3at", "PoE+", "30 W", "25,5 W"],
              ["IEEE 802.3bt Typ 3", "PoE++", "60 W", "51 W"],
              ["IEEE 802.3bt Typ 4", "PoE++", "100 W", "71 W"]]),
            "Wählen Sie für die Beschaffung des Switches den passenden IEEE-802-Standard aus und berechnen Sie die zu erwartende maximale Stromstärke in mA bei 48 V. Formel: P = U · I"),
          Z({ h: "Standard:", s: ["802.3at", "IEEE 802.3at", "PoE+", "802.3at (PoE+)", "IEEE 802.3at (PoE+)"], t: 1 },
            { h: "Maximale Stromstärke", s: ["437,5", "438"], e: "mA" }),
          p("Die Kamera braucht bis zu 21 W. 802.3af liefert am Gerät nur 12,95 W → reicht nicht. <b>IEEE 802.3at (PoE+)</b> liefert 25,5 W → passt.",
            "I = P ÷ U = 21 W ÷ 48 V = 0,4375 A = <b>437,5 mA</b>"),
          "Standard 2 BE, Stromstärke 2 BE (Umrechnung in mA beachten).", "IHK Frühjahr 2026 · 1 ac)"),

        T("Daisy Chaining — Vorteil", 1,
          p("Die vier Kamerabilder sollen auf vier Monitoren in der Disposition angezeigt werden. Bei Ihrer Recherche finden Sie folgenden Text:" +
            "<div><i>With daisy chaining you can run several monitors from a single video output of your computer. Only the first display is connected to the PC; every further display is plugged into the previous one. Both the graphics output and the monitors must support DisplayPort or Thunderbolt Multi-Stream Transport (MST).</i></div>",
            "Nennen Sie einen Vorteil dieser Verbindungsart."),
          FREI(),
          p("Z. B.: <b>geringer Verkabelungsaufwand</b> — nur ein Kabel zum PC, aufgeräumter Arbeitsplatz; mehr Monitore als Grafikausgänge am PC."),
          "", "IHK Frühjahr 2026 · 1 ca)"),

        T("Daisy Chaining — Voraussetzung", 3,
          p("Erläutern Sie die technische Voraussetzung für die Nutzung dieser Verbindungsart (siehe Text in c)."),
          FREI(),
          p("Der Videoausgang des PCs (DisplayPort oder Thunderbolt) <b>und</b> die Monitore müssen <b>Multi-Stream Transport (MST)</b> unterstützen. Die Monitore brauchen dafür neben dem Eingang einen DisplayPort-<b>Ausgang</b> zum Weiterreichen des Signals.",
            "Übersetzung des Textes: Mit Daisy Chaining betreibt man mehrere Monitore an einem einzigen Videoausgang. Nur der erste Monitor hängt am PC, jeder weitere am vorherigen. Grafikausgang und Monitore müssen DisplayPort- oder Thunderbolt-MST unterstützen."),
          "MST genannt 1 BE, für PC und Monitore 1 BE, erläutert 1 BE.", "IHK Frühjahr 2026 · 1 cb)"),

        T("Monitore verbinden", 2,
          p("Der Disponenten-PC hat am I/O-Panel u. a. 2 × USB-A, 1 × HDMI, 1 × DisplayPort und 1 × Thunderbolt (USB-C).",
            "Beschreiben Sie, wie die vier Monitore nach dem Daisy-Chaining-Verfahren angeschlossen werden und welche Schnittstelle am PC Sie dafür nutzen."),
          FREI(),
          p("Der <b>erste Monitor</b> wird über den <b>DisplayPort</b> (oder den <b>Thunderbolt-Port</b>) des PCs angeschlossen — nicht über HDMI, das kein MST kann. Monitor 2 hängt am DP-Ausgang von Monitor 1, Monitor 3 an Monitor 2, Monitor 4 an Monitor 3."),
          "Richtige Schnittstelle 1 BE, Kette beschrieben 1 BE.", "IHK Frühjahr 2026 · 1 cc)"),

        T("Mehrfachsteckdose", 4,
          p("In der Disposition sollen folgende Geräte an einer einzigen Mehrfachsteckdose mit der Aufschrift „maximal 16 A“ (230 V) betrieben werden:" +
            ul(["4 PCs mit einer maximalen Leistungsaufnahme von je 220 W,",
                "4 Monitore mit je 30 W,",
                "ein Laserdrucker mit maximal 1.050 W,",
                "ein Wasserkocher mit 2.000 W."]),
            "Weisen Sie durch eine Rechnung nach, dass diese Geräte nicht gleichzeitig betrieben werden können."),
          Z({ h: "Maximal zulässige Leistung der Steckdosenleiste", s: "3680", e: "W" },
            { h: "Gesamtleistung der Geräte", s: "4050", e: "W" },
            { h: "Begründung:", frei: true }),
          p("Zulässig: 16 A · 230 V = <b>3.680 W</b>",
            "Geräte: 4 · 220 W + 4 · 30 W + 1.050 W + 2.000 W = 880 + 120 + 1.050 + 2.000 = <b>4.050 W</b>",
            "4.050 W &gt; 3.680 W → zu viel (das wären 4.050 W ÷ 230 V ≈ 17,6 A). Der Wasserkocher gehört an einen anderen Stromkreis."),
          "Zulässige Leistung 2 BE, Summe 1 BE, Vergleich 1 BE.", "IHK Herbst 2021 · 2 d)"),

        T("Taktfrequenz", 1,
          p("Die neuen PCs haben einen Prozessor mit 3,8 GHz Basistakt. Geben Sie die Taktfrequenz in Hertz an."),
          Z({ h: "Taktfrequenz", s: "3800000000", e: "Hz" }),
          p("3,8 GHz = 3,8 · 10<sup>9</sup> Hz = <b>3.800.000.000 Hz</b>"), "", "IHK Frühjahr 2022 · 2 gc)"),

        T("USB-C", 2,
          p("Die PCs haben Anschlüsse mit der Bezeichnung „USB-C“. Beschreiben Sie, was durch die Bezeichnung „USB-C“ festgelegt wird."),
          FREI(),
          p("USB-C legt die <b>Bauform bzw. den Steckertyp</b> des Anschlusses fest (klein, verdrehsicher).",
            "Nicht festgelegt sind Übertragungsgeschwindigkeit (USB 2.0 bis USB4), Videofähigkeit und Ladeleistung — die hängen vom Standard hinter der Buchse ab."),
          "", "Azubi-Navigator VÜ 2 · 3 ba)"),

        T("Ergonomische Mängel", 2,
          p("Die Geschäftsleitung möchte krankheitsbedingte Fehlzeiten senken. Sie prüfen die Ergonomie in der Disposition. Ein Disponent arbeitet so:" +
            ul(["Das Notebook steht flach auf dem Tisch, sein Blick geht steil nach unten.",
                "Er sitzt mit rundem Rücken vorn auf der Stuhlkante, die Lehne nutzt er nicht.",
                "Der Tisch ist so hoch, dass die Handgelenke beim Tippen stark abgeknickt sind.",
                "Der Stuhl ist so hoch eingestellt, dass seine Füße in der Luft hängen."]),
            "Nennen Sie zwei konkrete ergonomische Mängel in der Körperhaltung oder Arbeitsplatzeinstellung."),
          FREIE("Mangel 1:", "Mangel 2:"),
          ul(["Bildschirm zu tief (falsche Monitorhöhe)", "gekrümmte Wirbelsäule / Stuhl und Lehne falsch genutzt",
              "abgeknickte Handgelenke / falsche Tischhöhe", "Füße ohne Bodenkontakt / falsche Stuhlhöhe"]),
          "Je Mangel 1 BE.", "Azubi-Navigator VÜ 2 · 2 a)"),

        T("Gesundheitliche Auswirkungen", 4,
          p("Beschreiben Sie für jeden der beiden in i) genannten Mängel eine mögliche langfristige gesundheitliche Auswirkung auf den Mitarbeiter."),
          FREIE("zu Mangel 1:", "zu Mangel 2:"),
          ul(["<b>Monitor zu tief:</b> Nacken- und Kopfschmerzen durch Verspannung und Überlastung der Halsmuskulatur",
              "<b>gekrümmter Rücken:</b> einseitige Belastung, Rückenschmerzen, erhöhtes Risiko für Bandscheibenvorfälle",
              "<b>abgeknickte Handgelenke:</b> Sehnenscheidenentzündung, „Mausarm“ (RSI), Verspannungen in Schultern und Nacken",
              "<b>hängende Füße:</b> Druck auf die Oberschenkel, Durchblutungsstörungen, Rückenbelastung"]),
          "Je Auswirkung 2 BE.", "Azubi-Navigator VÜ 2 · 2 b)")
      ]),

      aufgabe(P3, 3, "Speicher und Übertragung berechnen", ["speicher", "uebertragung", "ip"], [
        T("Speicher für die Videoaufzeichnung", 5,
          p("Die Aufnahmen von <b>fünf Kameras</b> sollen <b>7 Tage</b> lang rund um die Uhr gespeichert werden. Jede Kamera liefert einen Datenstrom von <b>8 Mbit/s</b> (1 Mbit = 10<sup>6</sup> Bit).",
            "Berechnen Sie die notwendige Speicherkapazität in TiB. Runden Sie Ihr Ergebnis auf ganze TiB auf. Der Rechenweg ist anzugeben."),
          Z({ h: "Speicherbedarf (2 Nachkommastellen)", s: "2,75", e: "TiB" }, { h: "Aufgerundet", s: "3", e: "TiB" }),
          p("5 · 8 Mbit/s = 40 Mbit/s = 40.000.000 Bit/s",
            "7 Tage = 7 · 24 · 3.600 s = 604.800 s",
            "40.000.000 Bit/s · 604.800 s = 24.192.000.000.000 Bit ÷ 8 = 3.024.000.000.000 Byte",
            "÷ 1.024<sup>4</sup> (= 1.099.511.627.776) ≈ <b>2,75 TiB</b> → aufgerundet <b>3 TiB</b>"),
          "Datenrate 1 BE, Sekunden 1 BE, Bit → Byte 1 BE, Byte → TiB 1 BE, Aufrunden 1 BE.", "IHK Frühjahr 2026 · 1 b)"),

        T("Übertragungsdauer nach Speedtest", 6,
          p("Ein Disponent möchte einen Lagerplan-Export mit einem Umfang von <b>2,5 GiB</b> in der Cloud abspeichern. Ergebnis des Speedtests:" + code(
            "Download: 250.00 Mbps\nUpload:    40.00 Mbps"),
            "Berechnen Sie die Übertragungsdauer. Runden Sie auf volle Sekunden auf und stellen Sie das Ergebnis in Minuten und Sekunden dar. Der Rechenweg ist anzugeben."),
          Z({ h: "Datenmenge", s: "21474836480", e: "Bit" }, { h: "Dauer (aufgerundet)", s: "537", e: "s" },
            { h: "= Minuten", s: "8", e: "min" }, { h: "und Sekunden", s: "57", e: "s" }),
          p("2,5 GiB · 1.024 · 1.024 · 1.024 = 2.684.354.560 Byte · 8 = <b>21.474.836.480 Bit</b>",
            "Abspeichern in der Cloud = <b>Upload</b>: 40 Mbps = 40.000.000 Bit/s",
            "21.474.836.480 ÷ 40.000.000 ≈ 536,87 s → <b>537 s = 8 min 57 s</b>",
            "Falle: mit der Downloadrate gerechnet kämen nur 86 s heraus."),
          "GiB → Byte 1 BE, → Bit 1 BE, Mbps → Bit/s 1 BE, Division 1 BE, Ergebnis 1 BE, min/s 1 BE.", "IHK Frühjahr 2024 · 4 f)"),

        T("Daten in die Cloud migrieren", 4,
          p("Die Elbtal hat sich für eine Cloudlösung entschieden. Nun soll das Archiv der Lieferscheine mit <b>1.250 MiByte</b> in die Cloud migriert werden. Der Anschluss bietet einen Upstream von <b>50.000 kbit/s</b>.",
            "Berechnen Sie, wie lange die Übertragung dauert. Runden Sie auf ganze Sekunden auf."),
          Z({ h: "Datenmenge", s: "10485760000", e: "Bit" }, { h: "Übertragungsdauer", s: "210", e: "s" }),
          p("1.250 MiB · 1.024 · 1.024 · 8 = <b>10.485.760.000 Bit</b>",
            "50.000 kbit/s = 50.000.000 Bit/s",
            "10.485.760.000 ÷ 50.000.000 = 209,72 s → <b>210 s</b> (3 min 30 s)"),
          "Umrechnung in Bit 2 BE, Sekunden 1 BE, Aufrunden 1 BE.", "Azubi-Navigator P10 · 4 e)"),

        T("Speicherbedarf einer Punktwolke", 3,
          p("Ein 3D-Scanner an der Rampe vermisst beladene Paletten. In einer Messdatei sind <b>12.800 Punkte</b> gespeichert. Jeder Punkt wird durch x-, y- und z-Koordinate bestimmt; jede Koordinate ist ein 32-Bit-Float-Wert.",
            "Berechnen Sie, wie viele Kibibyte Sie benötigen, um die 12.800 Punkte zu speichern (ohne Dateikopf und Farben)."),
          Z({ h: "Speicherbedarf", s: "150", e: "KiB" }),
          p("12.800 Punkte · 3 Koordinaten · 32 Bit = 1.228.800 Bit ÷ 8 = 153.600 Byte ÷ 1.024 = <b>150 KiB</b>"),
          "", "IHK Frühjahr 2024 · 3 da)"),

        T("Anzahl der Farben", 2,
          p("Jeder Punkt soll zusätzlich im RGB-Farbraum mit <b>10 Bit pro Farbkanal</b> gespeichert werden. Berechnen Sie, wie viele verschiedene Farben sich damit darstellen lassen."),
          Z({ h: "Anzahl Farben", s: "1073741824" }),
          p("3 Kanäle · 10 Bit = 30 Bit → 2<sup>30</sup> = <b>1.073.741.824</b> Farben (zum Vergleich: 8 Bit je Kanal → 2<sup>24</sup> = 16.777.216)."),
          "", "IHK Frühjahr 2024 · 3 db)"),

        T("Mehrbedarf in Prozent", 3,
          p("Berechnen Sie, wie viel Prozent Speicher Sie pro Punkt zusätzlich benötigen, um die Farbwerte aus e) zu speichern."),
          Z({ h: "Mehrbedarf", s: "31,25", e: "%" }),
          p("Koordinaten: 3 · 32 Bit = 96 Bit · Farbe: 3 · 10 Bit = 30 Bit", "30 ÷ 96 · 100 = <b>31,25 %</b>"),
          "", "IHK Frühjahr 2024 · 3 dc)"),

        T("Öffentlich erreichbar?", 2,
          p("Nach einem Defekt mussten drei Kameras getauscht werden. Die Netzwerkeinstellungen wurden so vorgenommen:" +
            tab(["Kamera", "IP-Adresse", "Standort"], [["1", "10.12.4.21/16", "Rampe Süd"], ["2", "10.12.4.22/16", "Rampe Nord"], ["3", "10.12.4.23/16", "Tor West"]]),
            "Beschreiben Sie, wie sich diese IP-Adressen in Bezug auf ihre öffentliche Erreichbarkeit im Internet verhalten."),
          FREI(),
          p("Es sind <b>private IP-Adressen</b> (Bereich 10.0.0.0/8). Sie werden nur im lokalen Netz verwendet und im Internet nicht geroutet — die Kameras sind aus dem Internet <b>nicht direkt erreichbar</b> (nur über NAT/Portweiterleitung oder VPN)."),
          "", "IHK Frühjahr 2026 · 3 da)")
      ]),

      aufgabe(P3, 4, "Programmierung und Datenmodellierung", ["schreibtisch", "algorithmus", "programmierung", "erm", "datenbank"], [
        T("Schreibtischtest: Tourenauswertung", 6,
          p("Die Touren werden durch eine bereits programmierte Funktion ausgewertet. Sie sollen einen Schreibtischtest durchführen:" + code(
            "def auswertung_touren(touren, stopps, verspaetet, kilometer):\n" +
            "    stopps_pro_tour = stopps / touren\n" +
            "    puenktlichkeit = ((stopps - verspaetet) / stopps) * 100\n" +
            "    km_pro_stopp = kilometer / stopps\n" +
            "    return (stopps_pro_tour, puenktlichkeit, km_pro_stopp)\n\n" +
            "ergebnis = auswertung_touren(48, 1104, 69, 18216)"),
            "Berechnen Sie die drei Rückgabewerte dieses Funktionsaufrufs mit zwei Nachkommastellen."),
          Z({ h: "Stopps pro Tour", s: "23,00" }, { h: "Pünktlichkeit in %", s: "93,75", e: "%" }, { h: "Kilometer pro Stopp", s: "16,50", e: "km" }),
          p("stopps_pro_tour = 1104 ÷ 48 = <b>23,00</b>",
            "puenktlichkeit = (1104 − 69) ÷ 1104 · 100 = 1035 ÷ 1104 · 100 = <b>93,75</b>",
            "km_pro_stopp = 18216 ÷ 1104 = <b>16,50</b>"),
          "Je Rückgabewert 2 BE.", "IHK Frühjahr 2025 · 3 d)"),

        T("Verschachtelte Bedingungen", 8,
          p("Eine weitere Funktion legt fest, womit eine Lieferung gefahren wird. Dafür wurde folgender Pseudocode erstellt:" + code(
            "Funktion transportart(gewicht_kg, express, kuehlware, entfernung_km):\n" +
            "    Wenn kuehlware:\n" +
            "        Wenn entfernung_km > 100:\n" +
            "            ergebnis = \"Kühl-LKW, Abfahrt sofort\"\n" +
            "        Sonst:\n" +
            "            ergebnis = \"Kühltransporter, Tour 1\"\n" +
            "    Sonst:\n" +
            "        Wenn express:\n" +
            "            Wenn gewicht_kg > 500:\n" +
            "                ergebnis = \"Express-LKW\"\n" +
            "            Sonst:\n" +
            "                ergebnis = \"Express-Transporter\"\n" +
            "        Sonst:\n" +
            "            Wenn gewicht_kg > 500 UND entfernung_km > 50:\n" +
            "                ergebnis = \"Sammel-LKW, nächster Tag\"\n" +
            "            Sonst:\n" +
            "                ergebnis = \"Regionaltour\"\n" +
            "    Rückgabe ergebnis"),
            "Geben Sie die Rückgabe der Funktion bei den folgenden Aufrufen an."),
          Z({ h: "1. transportart(800, Falsch, Falsch, 60)", s: ["Sammel-LKW, nächster Tag", "Sammel-LKW nächster Tag"], t: 1 },
            { h: "2. transportart(500, Wahr, Falsch, 20)", s: ["Express-Transporter"], t: 1 }),
          p("<b>1.</b> keine Kühlware → Sonst; kein Express → Sonst; 800 &gt; 500 <b>und</b> 60 &gt; 50 → beide wahr → <b>„Sammel-LKW, nächster Tag“</b>",
            "<b>2.</b> keine Kühlware → Sonst; Express → 500 &gt; 500 ist <b>falsch</b> (genau 500 ist nicht größer) → <b>„Express-Transporter“</b>"),
          "Je Aufruf 4 BE.", "IHK Frühjahr 2025 · 3 e)"),

        T("Datenmodell erweitern", 6,
          p("Alle Touren sollen dokumentiert werden. Gegeben ist folgender Ausschnitt des Datenmodells:" + code(
            "┌──────────────────────┐\n" +
            "│ Fahrer               │ 1\n" +
            "│ Fahrer-ID (PS)       │────── fährt ──────  ?\n" +
            "│ Fahrer_Name          │\n" +
            "└──────────────────────┘"),
            "Erweitern Sie das Datenmodell redundanzfrei um die folgenden Angaben und geben Sie auch die Kardinalitäten an:" +
            ul(["Eine Tour darf immer nur von einem einzigen Fahrer gefahren werden, ein Fahrer fährt viele Touren.",
                "Neben dem Namen ist auch die Führerscheinklasse des Fahrers zu erfassen.",
                "Jede Tour hat ein Datum, eine Abfahrts- und eine Rückkehrzeit.",
                "In jeder Entitätsmenge soll eine eindeutige Identifizierung durch einen Primärschlüssel möglich sein."]),
            "Zeichnen Sie auf Papier und notieren Sie hier die Lösung in Stichpunkten."),
          FREI(true),
          p("<b>Fahrer</b> (<u>Fahrer-ID</u> (PS), Fahrer_Name, <b>Führerscheinklasse</b>)",
            "<b>Tour</b> (<u>Tour-Nr</u> (PS), Datum, Abfahrt, Rückkehr) — neue Entität",
            "Beziehung: Fahrer <b>1</b> — fährt — <b>n</b> Tour",
            "In Tabellen: Tour erhält den Fremdschlüssel Fahrer-ID."),
          "Je Kardinalität, Entität und Attribut an der richtigen Stelle 1 BE (höchstens 6).", "IHK Herbst 2024 · 4 b)"),

        T("Compiler, Interpreter und Linker", 5,
          p("Die Tourenauswertung ist in Python geschrieben, die Steuerung der Förderbänder im Lager in C.",
            "a) Beschreiben Sie den grundlegenden Unterschied zwischen Compiler- und Interpretersprachen. (2 BE)",
            "b) Bei Compilersprachen wird neben dem Compiler auch ein Linker genutzt. Beschreiben Sie seine Aufgabe bei der Erzeugung des ausführbaren Programms. (3 BE)"),
          FREIE("a)", "b)"),
          p("a) Der Unterschied liegt im <b>Zeitpunkt der Übersetzung</b>: Ein Compiler übersetzt den <b>gesamten</b> Quellcode <b>vor</b> der Ausführung in Maschinencode (z. B. C). Ein Interpreter übersetzt <b>während der Laufzeit</b> Anweisung für Anweisung, bei jeder Ausführung neu (z. B. Python) — dafür langsamer.",
            "b) Der Compiler erzeugt aus jeder Quelldatei eine Objektdatei. Der <b>Linker</b> fügt diese Objektdateien und die benötigten <b>Bibliotheken</b> (z. B. Standardbibliothek) zu einem ausführbaren Programm zusammen und löst dabei die Verweise auf Funktionen und Variablen in anderen Modulen auf (Adressen einsetzen)."),
          "a) 2 BE, b) 3 BE.", "Azubi-Navigator P06 · 3 b), c)")
      ])
    ]);

  const D = { stand: "2026-09-25", pruefungen: [prognose1, prognose2, prognose3] };
  root.IHK_PROGNOSE = D;
  if (typeof module === "object" && module.exports) module.exports = D;
})(typeof window !== "undefined" ? window : globalThis);
