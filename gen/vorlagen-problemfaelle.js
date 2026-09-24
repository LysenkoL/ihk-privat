/* ============================================================================
   gen/vorlagen-problemfaelle.js — Aufgabentypen aus Lenas Problemliste:
   monatliche Betriebskosten aus Nutzungsdauern, Gesamtkosten über mehrere
   Jahre mit Ersatzbeschaffung, Amortisation über Stromersparnis,
   Netzwerkdiagnose aus zwei ipconfig-Ausgaben und Pseudocode über einem
   Datensatz-Auszug.
   ========================================================================== */
"use strict";
(function (G) {
  const f = G.fmt, r = G.runde;

  /* ================================================== 1. Monatskosten == */
  G.vorlage({
    id: "kalk-monatskosten", thema: "kalkulation", sub: "Laufende Kosten je Monat",
    titel: "Laufende Kosten pro Monat berechnen", stufe: 3,
    merksatz: "Anschaffung wird über die Nutzungsdauer verteilt: Preis ÷ Monate. Jahresbeträge durch 12 teilen, dann alles auf die Anzahl der Arbeitsplätze hochrechnen.",
    bau(R, c) {
      const plaetze = R.stufe(6, 40, 2);
      const bundle = { name: "Notebook-Bundle", preis: R.preis(850, 1600), monate: R.waehle([30, 36, 42]) };
      const dock = { name: "Dockingstation", preis: R.stufe(120, 260, 10), monate: R.waehle([48, 60]) };
      const monitor = { name: "Monitor", preis: R.stufe(180, 380, 10), monate: R.waehle([48, 60]) };
      const rabatt = R.waehle([0, 3, 5, 8, 10]);
      const tool = R.stufe(8, 22, 0.5);
      const wartung = R.stufe(600, 2400, 100);

      const teile = [bundle, dock, monitor];
      const hwRoh = r(teile.reduce((s, t) => s + t.preis / t.monate, 0), 2);
      const hwNetto = r(hwRoh * (1 - rabatt / 100), 2);
      const hwGesamt = r(hwNetto * plaetze, 2);
      const toolGesamt = r(tool * plaetze, 2);
      const wartungMonat = r(wartung / 12, 2);
      const summe = r(hwGesamt + toolGesamt + wartungMonat, 2);

      return {
        situation:
`Die ${c.firma} stattet ${plaetze} Arbeitsplätze aus. Es gelten folgende Konditionen (alle Preise netto):`,
        prompt: `Berechnen Sie die laufenden Kosten pro Monat für alle ${plaetze} Arbeitsplätze. ` +
          `Geben Sie den Rechenweg an und runden Sie das Endergebnis auf ganze Euro.`,
        tabellen: [{
          titel: "Konditionen",
          kopf: ["Position", "Preis", "Nutzungsdauer"],
          zeilen: teile.map(t => [t.name + " je Arbeitsplatz", f.eur(t.preis), t.monate + " Monate"])
            .concat([
              ["Rabatt auf die Hardware", f.kurz(rabatt) + " %", "—"],
              ["Kollaborationstool je Nutzer", f.eur(tool) + " / Monat", "laufend"],
              ["Wartungspauschale (alle Geräte)", f.eur(wartung) + " / Jahr", "laufend"]
            ])
        }],
        felder: [
          { typ: "raster", label: "Monatlicher Anteil je Arbeitsplatz (vor Rabatt)",
            kopf: ["Position", "Preis ÷ Nutzungsdauer (€/Monat)"],
            zeilen: teile.map(t => ({
              zellen: [{ t: t.name }, { eingabe: true, loesung: r(t.preis / t.monate, 2), dez: 2, be: 1 }]
            })) },
          { typ: "zahl", label: "Hardwarekosten je Arbeitsplatz und Monat nach Rabatt", einheit: "€",
            be: 2, loesung: hwNetto },
          { typ: "zahl", label: `Hardwarekosten aller ${plaetze} Arbeitsplätze je Monat`, einheit: "€",
            be: 1, loesung: hwGesamt },
          { typ: "zahl", label: "Kollaborationstool je Monat (alle Nutzer)", einheit: "€", be: 1, loesung: toolGesamt },
          { typ: "zahl", label: "Wartungspauschale je Monat", einheit: "€", be: 1, loesung: wartungMonat },
          { typ: "zahl", label: "Laufende Kosten pro Monat gesamt (auf ganze Euro gerundet)", einheit: "€",
            be: 2, dez: 0, loesung: Math.round(summe), tolAbs: 1 }
        ],
        loesung:
`Monatlicher Anteil je Arbeitsplatz (Preis ÷ Nutzungsdauer):
` + teile.map(t => `  ${t.name}: ${f.eur(t.preis)} ÷ ${t.monate} = ${f.eur(r(t.preis / t.monate, 2))}`).join("\n") +
`\n  Summe: ${f.eur(hwRoh)}
${rabatt ? `  − ${f.kurz(rabatt)} % Rabatt → ${f.eur(hwNetto)}` : "  ohne Rabatt"}

Hardware alle Arbeitsplätze: ${f.eur(hwNetto)} × ${plaetze} = ${f.eur(hwGesamt)}
Kollaborationstool:          ${f.eur(tool)} × ${plaetze} = ${f.eur(toolGesamt)}
Wartungspauschale:           ${f.eur(wartung)} ÷ 12 = ${f.eur(wartungMonat)}

Laufende Kosten pro Monat: ${f.eur(hwGesamt)} + ${f.eur(toolGesamt)} + ${f.eur(wartungMonat)}
                         = ${f.eur(summe)} ≈ ${f.zahl(Math.round(summe), 0)} €

Typischer Fehler: den Rabatt auf die Monatsrate vergessen oder die Jahrespauschale
nicht durch 12 teilen.`
      };
    }
  });

  /* ================================================ 2. Lebenszyklus ==== */
  G.vorlage({
    id: "kalk-lebenszyklus", thema: "kalkulation", sub: "Gesamtkosten über die Laufzeit",
    titel: "Gesamtkosten über mehrere Jahre mit Ersatzbeschaffung", stufe: 3,
    merksatz: "Anzahl Beschaffungen = Betrachtungszeitraum ÷ Nutzungsdauer, immer aufgerundet. Ein Gerät mit 36 Monaten Nutzungsdauer wird in 60 Monaten zweimal gekauft.",
    bau(R, c) {
      const plaetze = R.stufe(6, 30, 2);
      const jahre = R.waehle([4, 5, 6]);
      const monate = jahre * 12;
      const bundle = { name: "Notebook-Bundle", preis: R.preis(850, 1600), nd: R.waehle([30, 36]) };
      const dock = { name: "Dockingstation", preis: R.stufe(120, 260, 10), nd: 48 };
      const monitor = { name: "Monitor", preis: R.stufe(180, 380, 10), nd: 48 };
      const rabatt = R.waehle([0, 5, 8, 10]);
      const tool = R.stufe(8, 22, 0.5);
      const wartung = R.stufe(600, 2400, 100);
      const ust = 19;

      const teile = [bundle, dock, monitor].map(t => {
        const n = Math.ceil(monate / t.nd);
        return Object.assign({}, t, { n, kosten: r(t.preis * n * plaetze * (1 - rabatt / 100), 2) });
      });
      const hardware = r(teile.reduce((s, t) => s + t.kosten, 0), 2);
      const toolGesamt = r(tool * plaetze * monate, 2);
      const wartungGesamt = r(wartung * jahre, 2);
      const netto = r(hardware + toolGesamt + wartungGesamt, 2);
      const brutto = r(netto * (1 + ust / 100), 2);

      return {
        situation:
`Die Geschäftsführung der ${c.firma} möchte die Gesamtkosten für ${plaetze} Arbeitsplätze über ` +
`${jahre} Jahre (${monate} Monate) betrachten. Annahmen (netto):
• Alle Hardwarepreise gelten inklusive ${f.kurz(rabatt)} % Rabatt.
• Geräte werden nach Ablauf ihrer Nutzungsdauer in gleicher Stückzahl zu gleichen Konditionen ersetzt.
• Das Kollaborationstool läuft durchgehend über ${monate} Monate.
• Die Wartungspauschale fällt in jedem Jahr an.`,
        prompt: `Berechnen Sie die Gesamtkosten netto und brutto (${ust} % Umsatzsteuer). Geben Sie den Rechenweg an.`,
        tabellen: [{
          titel: "Konditionen",
          kopf: ["Position", "Preis", "Nutzungsdauer"],
          zeilen: [bundle, dock, monitor].map(t => [t.name + " je Arbeitsplatz", f.eur(t.preis), t.nd + " Monate"])
            .concat([
              ["Rabatt auf die Hardware", f.kurz(rabatt) + " %", "—"],
              ["Kollaborationstool je Nutzer", f.eur(tool) + " / Monat", "laufend"],
              ["Wartungspauschale (alle Geräte)", f.eur(wartung) + " / Jahr", "laufend"]
            ])
        }],
        felder: [
          { typ: "raster", label: "Wie oft wird jede Position im Betrachtungszeitraum beschafft?",
            kopf: ["Position", "Anzahl Beschaffungen"],
            zeilen: teile.map(t => ({
              zellen: [{ t: t.name + " (" + t.nd + " Monate)" }, { eingabe: true, loesung: t.n, dez: 0, be: 1, tolAbs: 0 }]
            })) },
          { typ: "zahl", label: "Hardwarekosten gesamt (inkl. Rabatt, alle Beschaffungen)", einheit: "€",
            be: 2.5, loesung: hardware, tolRel: 0.005 },
          { typ: "zahl", label: "Kosten Kollaborationstool über die gesamte Laufzeit", einheit: "€",
            be: 1, loesung: toolGesamt },
          { typ: "zahl", label: "Wartungspauschale über die gesamte Laufzeit", einheit: "€", be: 1, loesung: wartungGesamt },
          { typ: "zahl", label: "Gesamtkosten netto", einheit: "€", be: 1.5, loesung: netto, tolRel: 0.005 },
          { typ: "zahl", label: "Gesamtkosten brutto", einheit: "€", be: 1, loesung: brutto, tolRel: 0.005 }
        ],
        loesung:
`Anzahl Beschaffungen = ${monate} Monate ÷ Nutzungsdauer, aufgerundet:
` + teile.map(t => `  ${t.name}: ${monate} ÷ ${t.nd} = ${f.kurz(r(monate / t.nd, 2))} → ${t.n}×`).join("\n") +
`\n\nHardware (inkl. ${f.kurz(rabatt)} % Rabatt):
` + teile.map(t =>
`  ${t.name}: ${f.eur(t.preis)} × ${t.n} × ${plaetze} Plätze${rabatt ? " × " + f.kurz(1 - rabatt / 100) : ""} = ${f.eur(t.kosten)}`).join("\n") +
`\n  Summe Hardware: ${f.eur(hardware)}

Kollaborationstool: ${f.eur(tool)} × ${plaetze} × ${monate} Monate = ${f.eur(toolGesamt)}
Wartung:            ${f.eur(wartung)} × ${jahre} Jahre = ${f.eur(wartungGesamt)}

Gesamtkosten netto:  ${f.eur(netto)}
Gesamtkosten brutto: ${f.eur(netto)} × 1,${ust} = ${f.eur(brutto)}

Typischer Fehler: die Ersatzbeschaffung vergessen (nur einmal Hardware rechnen) oder
${monate} ÷ ${bundle.nd} abrunden statt aufrunden — nach ${bundle.nd} Monaten braucht es ein neues Gerät,
auch wenn der Zeitraum nicht voll ausgeschöpft wird.`
      };
    }
  });

  /* ============================================ 3. Energie-Amortisation = */
  G.vorlage({
    id: "kalk-amortisation-energie", thema: "kalkulation", sub: "Amortisationsrechnung",
    titel: "Mehrpreis über die Stromersparnis amortisieren", stufe: 2,
    merksatz: "Ersparnis pro Jahr = Leistungsdifferenz in kW × Stunden × Tage × Strompreis. Amortisation in Monaten = Mehrpreis ÷ (Ersparnis ÷ 12), immer aufrunden.",
    bau(R, c) {
      const geraet = R.waehle(["Monitor", "Arbeitsplatzrechner", "Multifunktionsgerät", "Thin Client"]);
      const alt = R.stufe(45, 160, 5);
      const neu = R.stufe(18, Math.max(20, alt - 20), 2);
      const mehrpreis = R.stufe(30, 180, 5);
      const tage = R.waehle([200, 210, 220, 230]);
      const stunden = R.waehle([8, 9, 10]);
      const preis = R.stufe(0.28, 0.45, 0.01);

      const kwhJahr = r((alt - neu) / 1000 * stunden * tage, 3);
      const sparJahr = r(kwhJahr * preis, 2);
      const sparMonat = r(sparJahr / 12, 2);
      const monate = sparMonat > 0 ? Math.ceil(mehrpreis / sparMonat) : 0;
      const lohnt = monate <= 60;

      return {
        situation:
`Zur Reduzierung der laufenden Kosten schlägt die IT der ${c.firma} ein energieeffizientes ` +
`${geraet}-Modell vor.

Vorgaben:
• Standardmodell: ${alt} W
• Effizientes Modell: ${neu} W
• Mehrpreis des effizienten Modells: ${f.eur(mehrpreis)}
• Nutzung: ${tage} Arbeitstage pro Jahr, ${stunden} Stunden pro Arbeitstag
• Strompreis: ${f.zahl(preis, 2)} EUR pro kWh`,
        prompt: "Berechnen Sie die Dauer in Monaten, ab der sich der Mehrpreis amortisiert hat. " +
          "Runden Sie auf volle Monate auf. Der Rechenweg muss nachvollziehbar sein.",
        felder: [
          { typ: "zahl", label: "Leistungsdifferenz", einheit: "W", be: 0.5, dez: 0, loesung: alt - neu, tolAbs: 0 },
          { typ: "zahl", label: "Eingesparte Energie pro Jahr", einheit: "kWh", be: 1.5, loesung: kwhJahr, dez: 2, tolRel: 0.01 },
          { typ: "zahl", label: "Eingesparte Stromkosten pro Jahr", einheit: "€", be: 1.5, loesung: sparJahr },
          { typ: "zahl", label: "Eingesparte Stromkosten pro Monat", einheit: "€", be: 1, loesung: sparMonat },
          { typ: "zahl", label: "Amortisationsdauer (auf volle Monate aufgerundet)", einheit: "Monate",
            be: 2, dez: 0, loesung: monate, tolAbs: 0 },
          { typ: "text", label: "Beurteilen Sie, ob sich der Mehrpreis lohnt — mit Bezug zur Nutzungsdauer",
            be: 1.5, zeilen: 3, satzbau: true, minWorte: 10,
            erwartet: [[lohnt ? "amortisiert sich innerhalb der Nutzungsdauer" : "amortisiert sich erst nach der Nutzungsdauer",
              lohnt ? "lohnt sich" : "lohnt sich nicht", lohnt ? "wirtschaftlich" : "unwirtschaftlich",
              "Nutzungsdauer"]] }
        ],
        loesung:
`Leistungsdifferenz: ${alt} W − ${neu} W = ${alt - neu} W = ${f.kurz((alt - neu) / 1000)} kW
Energieersparnis pro Jahr: ${f.kurz((alt - neu) / 1000)} kW × ${stunden} h × ${tage} Tage = ${f.kurz(kwhJahr)} kWh
Kostenersparnis pro Jahr: ${f.kurz(kwhJahr)} kWh × ${f.zahl(preis, 2)} €/kWh = ${f.eur(sparJahr)}
Kostenersparnis pro Monat: ${f.eur(sparJahr)} ÷ 12 = ${f.eur(sparMonat)}

Amortisation: ${f.eur(mehrpreis)} ÷ ${f.eur(sparMonat)} = ${f.kurz(r(mehrpreis / sparMonat, 2))} Monate
→ aufgerundet ${monate} Monate

Beurteilung: Bei einer üblichen Nutzungsdauer von 48 bis 60 Monaten ` +
(lohnt
  ? `amortisiert sich der Mehrpreis nach ${monate} Monaten deutlich innerhalb der Nutzungsdauer — die Anschaffung lohnt sich.`
  : `amortisiert sich der Mehrpreis erst nach ${monate} Monaten und damit außerhalb der Nutzungsdauer — rein rechnerisch lohnt er sich nicht.`) +
`

Typischer Fehler: Watt nicht in Kilowatt umrechnen (Faktor 1.000) oder die Jahresersparnis
direkt durch den Mehrpreis teilen, statt zuerst auf den Monat herunterzubrechen.`
      };
    }
  });

  /* ============================================== 4. ipconfig-Diagnose == */
  G.vorlage({
    id: "netz-ipconfig", thema: "netzwerk", sub: "Netzwerkdiagnose",
    titel: "Fehler in der IP-Konfiguration finden", stufe: 2,
    merksatz: "Erst Netzadresse beider Rechner ausrechnen. Stimmen die nicht überein, hilft kein Ping — dann sind IP-Adresse oder Subnetzmaske falsch.",
    bau(R, c) {
      const netz3 = R.ganz(10, 240);
      const basis = "192.168." + netz3 + ".";
      const gateway = basis + "1";
      const dns = basis + R.waehle([5, 10, 2]);
      const serverIp = basis + R.stufe(10, 40, 1);
      const clientHost = R.stufe(100, 200, 1);
      const domain = R.waehle(["averbeck", "lindner", "sturm", "kellermann", "havelblick"]) + ".local";
      const terminal = R.ganz(2, 9);
      const serverName = "appsrv." + domain;

      /* Maske: nur ENGER als /24 ist hier ein echter Fehler. Eine zu weite Maske
         (z. B. /16) schließt den Server ja weiterhin ein — dann funktioniert die
         Verbindung, und die Aufgabe wäre falsch. Gewählt wird deshalb nur eine
         Maske, bei der der Server (und das Gateway .1) außerhalb des Bereichs
         des Terminals liegt. Die Zufallszahl wird wie früher genau einmal gezogen,
         damit alle anderen Werte zur selben Saat gleich bleiben.              */
      const serverHost = +serverIp.split(".")[3];
      const PRAEFIX = { 25: "255.255.255.128", 26: "255.255.255.192", 27: "255.255.255.224" };
      const bereich = (host, pfx) => { const g = Math.pow(2, 32 - pfx), start = Math.floor(host / g) * g; return [start, start + g - 1]; };
      const aussen = pfx => { const [a, e] = bereich(clientHost, pfx); return serverHost < a || serverHost > e; };
      const maskenWahl = R.waehle([0, 1, 2]);
      const passend = [25, 26, 27].filter(aussen);
      const falschPfx = passend[maskenWahl % passend.length];
      const [bA, bE] = bereich(clientHost, falschPfx);

      const fehlerArten = [
        {
          key: "ip", label: "Die IPv4-Adresse liegt in einem anderen Subnetz.",
          clientIp: "192.168." + (netz3 + 1) + "." + clientHost,
          maske: "255.255.255.0", gw: gateway, dnsC: dns,
          richtig: basis + clientHost,
          feldName: "IPv4-Adresse",
          grund: ["falsches Subnetz", "anderes Netz", "dritte Oktett falsch", "nicht im selben Netz",
            "Netzadresse unterschiedlich", "Gateway nicht erreichbar"]
        },
        {
          key: "maske", label: "Die Subnetzmaske passt nicht zum Netz.",
          clientIp: basis + clientHost,
          maske: PRAEFIX[falschPfx], gw: gateway, dnsC: dns,
          richtig: "255.255.255.0",
          feldName: "Subnetzmaske",
          grund: ["falsche Subnetzmaske", "Maske stimmt nicht", "Server liegt außerhalb", "nicht im selben Netz",
            "Gateway nicht im eigenen Netz", "Netzadresse unterschiedlich", "Subnetz zu klein"]
        },
        {
          key: "gw", label: "Das Standardgateway zeigt auf eine Adresse außerhalb des Netzes.",
          clientIp: basis + clientHost,
          maske: "255.255.255.0", gw: "192.168." + (netz3 + 2) + ".1", dnsC: dns,
          richtig: gateway,
          feldName: "Standardgateway",
          grund: ["Gateway liegt nicht im eigenen Subnetz", "falsches Gateway", "nicht erreichbar",
            "kein Weg nach außen"]
        },
        {
          key: "dns", label: "Der DNS-Server ist falsch eingetragen.",
          clientIp: basis + clientHost,
          maske: "255.255.255.0", gw: gateway, dnsC: R.waehle(["8.8.8.8", "192.168." + (netz3 + 3) + ".5", "1.1.1.1"]),
          richtig: dns,
          feldName: "DNS-Server",
          grund: ["Namensauflösung schlägt fehl", "interner DNS nicht erreichbar", "falscher DNS-Server",
            "Servername wird nicht aufgelöst"]
        }
      ];
      const fehler = R.waehle(fehlerArten);

      const block = (titel, adapter, ip, maske, gw, dnsX, mac) =>
`${titel}

Ethernet-Adapter Ethernet:

   Verbindungsspezifisches DNS-Suffix: ${domain}
   Beschreibung. . . . . . . . . . . : ${adapter}
   Physische Adresse . . . . . . . . : ${mac}
   DHCP aktiviert. . . . . . . . . . : Nein
   IPv4-Adresse. . . . . . . . . . . : ${ip}
   Subnetzmaske. . . . . . . . . . . : ${maske}
   Standardgateway . . . . . . . . . : ${gw}
   DNS-Server. . . . . . . . . . . . : ${dnsX}`;

      const mac1 = "9C-2A-70-" + R.ganz(16, 99) + "-1D-" + R.ganz(16, 99);
      const mac2 = "00-1B-21-" + R.ganz(16, 99) + "-C4-" + R.ganz(16, 99);

      return {
        /* Das Fehlerbild muss zum Fehler passen: ein falsches Gateway stört den
           Server im EIGENEN Netz nicht, ein falscher DNS-Server nur den Aufruf
           über den Namen. */
        situation:
`In der ${c.firma} meldet die Abteilung ${c.abteilung}, dass ` +
({ ip: `Terminal ${terminal} den Anwendungsserver nicht erreicht.`,
   maske: `Terminal ${terminal} den Anwendungsserver nicht erreicht.`,
   gw: `Terminal ${terminal} zwar mit dem Anwendungsserver im eigenen Netz arbeiten kann, aber keine ` +
       `Verbindung ins Internet hat — Webseiten und der Cloud-Dienst des Herstellers laden nicht.`,
   dns: `auf Terminal ${terminal} die Anwendung nicht startet: Der Server „${serverName}“ wird nicht gefunden.` })[fehler.key] +
` Alle anderen Arbeitsplätze arbeiten normal. Sie lassen sich auf dem Terminal und auf dem ` +
`Anwendungsserver die IP-Konfiguration ausgeben.`,
        code:
block("Ausgabe auf Terminal " + terminal, "Realtek PCIe GbE Family Controller",
      fehler.clientIp, fehler.maske, fehler.gw, fehler.dnsC, mac1) +
"\n\n" +
block("Ausgabe auf dem Anwendungsserver", "Intel(R) I210 Gigabit Network Connection",
      serverIp, "255.255.255.0", gateway, dns, mac2),
        prompt: "Werten Sie die beiden Ausgaben aus und beheben Sie den Fehler.",
        felder: [
          { typ: "auswahl", label: "Welcher Eintrag auf Terminal " + terminal + " ist falsch?", be: 2,
            optionen: ["IPv4-Adresse", "Subnetzmaske", "Standardgateway", "DNS-Server"],
            loesung: fehler.feldName },
          { typ: "text", label: "Wie muss der Eintrag richtig lauten?", be: 2, zeilen: 1,
            erwartet: [[fehler.richtig].concat(fehler.key === "maske" ? ["/24"] : [])] },
          { typ: "text", label: "Begründen Sie, warum die Verbindung mit der falschen Angabe scheitert",
            be: 2, zeilen: 3, satzbau: true, minWorte: 10, erwartet: [fehler.grund] },
          fehler.key === "dns"
            ? { typ: "text", label: "Mit welchem Befehl prüfen Sie nach der Korrektur, ob der Servername aufgelöst wird?",
                be: 1, zeilen: 1, satzbau: false,
                erwartet: [["nslookup " + serverName, "nslookup", "Resolve-DnsName", "ping " + serverName]] }
            : fehler.key === "gw"
              ? { typ: "text", label: "Mit welchem Befehl prüfen Sie nach der Korrektur, ob das Gateway erreichbar ist und welchen Weg die Pakete nehmen?",
                  be: 1, zeilen: 1, satzbau: false,
                  erwartet: [["ping " + gateway, "tracert", "traceroute", "ping", "Test-NetConnection", "pathping"]] }
              : { typ: "text", label: "Mit welchem Befehl prüfen Sie nach der Korrektur die Erreichbarkeit des Servers?",
                  be: 1, zeilen: 1, satzbau: false,
                  erwartet: [["ping " + serverIp, "ping", "Test-NetConnection"]] },
          { typ: "text", label: "Welche Angabe der Ausgabe zeigt, dass die Adresse nicht automatisch bezogen wird?",
            be: 1, zeilen: 1, satzbau: false,
            erwartet: [["DHCP aktiviert Nein", "DHCP", "DHCP steht auf Nein", "statisch"]] }
        ],
        loesung:
`Netzadressen vergleichen (IP UND Subnetzmaske):
` + (fehler.key === "maske"
  ? `   Terminal ${terminal}: ${fehler.clientIp} mit ${fehler.maske} (/${falschPfx})
                → Netz ${basis}${bA}, Bereich ${basis}${bA} bis ${basis}${bE}
   Server:      ${serverIp} mit 255.255.255.0 (/24) → Netz ${basis}0`
  : fehler.key === "ip"
    ? `   Terminal ${terminal}: ${fehler.clientIp} mit 255.255.255.0 → Netz ${fehler.clientIp.replace(/\.\d+$/, ".0")}
   Server:      ${serverIp} mit 255.255.255.0 → Netz ${basis}0`
    : `   Terminal ${terminal}: ${fehler.clientIp} mit 255.255.255.0 → Netz ${basis}0
   Server:      ${serverIp} mit 255.255.255.0 → Netz ${basis}0   (gleiches Netz)`) + `

Falsch ist die ${fehler.feldName}: ${fehler.label}
Richtig wäre: ${fehler.richtig}

` + ({
  maske:
`Mit /${falschPfx} reicht das Netz des Terminals nur von .${bA} bis .${bE}. Der Server (.${serverHost}) liegt
außerhalb — das Terminal hält ihn für ein fremdes Netz und schickt die Pakete an das Gateway
${gateway}. Das liegt aber ebenfalls außerhalb seines Bereichs und ist nicht ansprechbar.
Also kommt keine Verbindung zustande. Richtig ist /24 wie beim Server und den anderen Arbeitsplätzen.

Achtung Denkfalle: Eine zu GROSSE Maske (z. B. 255.255.0.0) wäre hier kein Grund für den Fehler —
der Server läge dann weiterhin im eigenen Bereich des Terminals, die Verbindung würde funktionieren.`,
  ip:
`Das Terminal liegt in einem anderen Netz als Server und Gateway. Den Server hält es für fremd und
will über das Gateway ${gateway} gehen — das liegt aber nicht im Netz des Terminals und ist damit nicht
ansprechbar. Es kommt keine Verbindung zustande.`,
  gw:
`Terminal und Server liegen im selben Netz — deshalb klappt die Arbeit mit dem Anwendungsserver:
dafür wird kein Gateway gebraucht. Alles AUSSERHALB des eigenen Netzes (Internet, Cloud) geht über
das Standardgateway. Das eingetragene ${fehler.gw} liegt aber nicht im eigenen Subnetz, der Rechner
kann es nicht ansprechen → keine Verbindung nach draußen.`,
  dns:
`Die IP-Verbindung funktioniert, aber der Name „${serverName}“ wird nicht aufgelöst: Der eingetragene
DNS-Server ${fehler.dnsC} kennt die internen Namen der Domäne ${domain} nicht (oder ist nicht erreichbar).
Typisches Bild: „ping ${serverIp}“ klappt, „ping ${serverName}“ nicht.`
})[fehler.key] +
`

Prüfen nach der Korrektur: ` + ({ maske: `ping ${serverIp}`, ip: `ping ${serverIp}`, gw: `ping ${gateway}, dann tracert zu einem Ziel im Internet`,
  dns: `nslookup ${serverName}` })[fehler.key] + `.
Die Zeile „DHCP aktiviert: Nein“ zeigt, dass die Adresse fest eingetragen ist — der Fehler wurde
also von Hand konfiguriert und kommt nach einem Neustart wieder.`
      };
    }
  });

  /* ========================================= 5. Pseudocode über Daten === */
  G.vorlage({
    id: "dia-pseudocode-daten", thema: "programmierung", sub: "Schreibtischtest & Pseudocode",
    titel: "Pseudocode auf einen Datenauszug anwenden", stufe: 3,
    merksatz: "Bedingungen Zeichen für Zeichen lesen: < ist nicht ≤, und >= schließt den Grenzwert ein. Genau dort sitzen die Punkte.",
    bau(R, c) {
      const startH = R.waehle([7, 8]), startM = R.waehle([0, 30]);
      const endeH = R.waehle([16, 17, 18]), endeM = R.waehle([0, 30]);
      const start = startH * 60 + startM, ende = endeH * 60 + endeM;
      const hhmm = m => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");

      const konten = ["u_kruse", "u_ahlers", "u_wessel", "u_lindemann", "u_petrov", "u_schuster"];
      const akten = ["A-10427", "A-10513", "A-10688", "A-10902"];
      const aktionen = ["Akte geöffnet", "Eintrag geändert", "Dokument gedruckt", "Akte geschlossen"];
      const tage = ["Mo 02.03.2026", "Di 03.03.2026", "Mi 04.03.2026", "Do 05.03.2026", "Fr 06.03.2026"];

      /* acht Datensätze, darunter bewusst zwei Grenzfälle: genau start und genau ende */
      const zeiten = [];
      zeiten.push(start);                                   // genau Dienstbeginn → zählt NICHT (< start)
      zeiten.push(ende);                                    // genau Dienstende  → zählt (>= ende)
      for (let i = 0; i < 6; i++) {
        zeiten.push(R.muenze(0.45)
          ? R.ganz(5 * 60, ende + 5 * 60)                   // irgendwann am Tag
          : R.ganz(start + 10, ende - 10));                 // sicher innerhalb
      }
      const daten = R.mische(zeiten).map((m, i) => ({
        nr: i + 1,
        konto: R.waehle(konten),
        akte: R.waehle(akten),
        tag: R.waehle(tage),
        min: Math.max(0, Math.min(23 * 60 + 59, m)),
        aktion: R.waehle(aktionen)
      }));
      const treffer = daten.filter(d => d.min < start || d.min >= ende);
      const rueck = treffer.length;

      const code =
`01  Funktion zaehleAusserhalbDienstzeit(zugriffsListe)
02      dienstBeginn = ${start}        // ${hhmm(start)} Uhr in Minuten seit Mitternacht
03      dienstEnde   = ${ende}        // ${hhmm(ende)} Uhr in Minuten seit Mitternacht
04      anzahl = 0
05      Für jeden eintrag in zugriffsListe
06          minuten = inMinuten(eintrag.uhrzeit)
07          Wenn minuten < dienstBeginn ODER minuten >= dienstEnde dann
08              anzahl = anzahl + 1
09          Ende Wenn
10      Ende Für
11      Rückgabe anzahl
12  Ende Funktion`;

      const grenzStart = daten.find(d => d.min === start);
      const grenzEnde = daten.find(d => d.min === ende);

      const felder = [
        { typ: "mehrfachwahl", be: 4,
          label: "Welche Datensätze zählt die Funktion? (alle zutreffenden ankreuzen)",
          optionen: daten.map(d => "Nr. " + d.nr + " — " + hhmm(d.min)),
          loesung: treffer.map(d => "Nr. " + d.nr + " — " + hhmm(d.min)) },
        { typ: "zahl", be: 2, dez: 0, tolAbs: 0,
          label: "Welchen Rückgabewert liefert die Funktion?", loesung: rueck }
      ];
      if (grenzEnde) felder.push({
        typ: "text", be: 2, zeilen: 3, satzbau: true, minWorte: 8,
        label: `Datensatz Nr. ${grenzEnde.nr} liegt genau auf ${hhmm(ende)} Uhr. Wird er gezählt? Begründen Sie mit der Bedingung.`,
        erwartet: [["ja", "wird gezählt", ">= schließt den Wert ein", "größer gleich", "einschließlich"]]
      });
      if (grenzStart) felder.push({
        typ: "text", be: 2, zeilen: 3, satzbau: true, minWorte: 8,
        label: `Datensatz Nr. ${grenzStart.nr} liegt genau auf ${hhmm(start)} Uhr. Wird er gezählt? Begründen Sie.`,
        erwartet: [["nein", "wird nicht gezählt", "kleiner als", "< schließt den Wert aus", "nicht eingeschlossen"]]
      });
      felder.push({
        typ: "text", be: 1.5, zeilen: 2, satzbau: true, minWorte: 6,
        label: "Was ändert sich am Ergebnis, wenn in Zeile 07 ODER durch UND ersetzt wird?",
        erwartet: [["keine Zeile erfüllt beide Bedingungen", "Ergebnis wird 0", "nichts wird mehr gezählt",
          "Bedingungen schließen sich aus", "immer null"]]
      });

      return {
        situation:
`Für eine Revision bei der ${c.firma} wird geprüft, wie oft außerhalb der Dienstzeit ` +
`(${hhmm(start)} bis ${hhmm(ende)} Uhr) auf Akten zugegriffen wurde. Dazu liegt die folgende ` +
`Funktion im Pseudocode vor.`,
        code,
        prompt: `Die Funktion wird mit dem abgebildeten Auszug aufgerufen. Ermitteln Sie, welche der ` +
          `${daten.length} Datensätze gezählt werden und welchen Rückgabewert die Funktion liefert.`,
        tabellen: [{
          titel: "Auszug aus dem Zugriffsprotokoll",
          kopf: ["Nr.", "Benutzerkonto", "Akte", "Datum", "Uhrzeit", "Aktion"],
          zeilen: daten.map(d => [String(d.nr), d.konto, d.akte, d.tag, hhmm(d.min), d.aktion])
        }],
        felder,
        loesung:
`Bedingung: minuten < ${start} ODER minuten >= ${ende}   (also vor ${hhmm(start)} oder ab ${hhmm(ende)} Uhr)

` + daten.map(d => {
  const zaehlt = d.min < start || d.min >= ende;
  const grund = d.min < start ? "vor Dienstbeginn"
    : d.min >= ende ? (d.min === ende ? "genau " + hhmm(ende) + " — >= schließt den Wert ein" : "nach Dienstende")
    : "innerhalb der Dienstzeit";
  return `  Nr. ${d.nr}  ${hhmm(d.min)}  ${zaehlt ? "zählt    " : "zählt nicht"}  (${grund})`;
}).join("\n") +
`\n\nRückgabewert: ${rueck}

Die Grenzfälle entscheiden: „< dienstBeginn“ schließt ${hhmm(start)} Uhr AUS, „>= dienstEnde“
schließt ${hhmm(ende)} Uhr EIN. Wer hier < mit <= verwechselt, verliert die Punkte.

Mit UND statt ODER in Zeile 07 wäre das Ergebnis immer 0: Eine Uhrzeit kann nicht gleichzeitig
vor ${hhmm(start)} und nach ${hhmm(ende)} Uhr liegen — die beiden Bedingungen schließen sich aus.`
      };
    }
  });

})(window.GEN);
