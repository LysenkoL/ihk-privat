/* ============================================================================
   gen/vorlagen-netz.js — Netzwerke, Adressierung, Speicher und Datenmengen
   ========================================================================== */
"use strict";
(function (G) {
  const f = G.fmt, r = G.runde;

  /* ---------------------- IPv4-Hilfen ----------------------------------- */
  const ipZuInt = ip => ip.split(".").reduce((s, o) => (s << 8 >>> 0) + (+o), 0) >>> 0;
  const intZuIp = n => [24, 16, 8, 0].map(s => (n >>> s) & 255).join(".");
  const maskeVon = p => (p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0);
  const maskeText = p => intZuIp(maskeVon(p));
  const netzVon = (ip, p) => (ipZuInt(ip) & maskeVon(p)) >>> 0;
  const bcVon = (ip, p) => ((netzVon(ip, p) | (~maskeVon(p) >>> 0)) >>> 0);
  const binOktett = n => n.toString(2).padStart(8, "0");
  const maskeBinaer = p => intZuIp(maskeVon(p)).split(".").map(o => binOktett(+o)).join(".");

  /** private Adresse aus einem der drei Blöcke, passend zum Präfix */
  function privatIp(R, praefix) {
    const block = R.waehle([
      { basis: ipZuInt("10.0.0.0"), min: 8 },
      { basis: ipZuInt("172.16.0.0"), min: 12 },
      { basis: ipZuInt("192.168.0.0"), min: 16 }
    ].filter(b => b.min <= praefix));
    const spielraum = 32 - block.min;
    const zufall = Math.floor(R.f() * Math.pow(2, Math.min(spielraum, 20)));
    return (block.basis + zufall) >>> 0;
  }

  /* ---------------------------------------------------------------- 1 ---- */
  G.vorlage({
    id: "netz-subnetz", thema: "netzwerk", sub: "IP-Adressierung",
    titel: "Netz- und Broadcastadresse bestimmen", stufe: 2,
    merksatz: "Netzadresse = IP UND Maske. Broadcast = Netzadresse mit allen Hostbits auf 1. Nutzbare Hosts = 2^(32−Präfix) − 2.",
    bau(R, c) {
      const praefix = R.waehle([20, 21, 22, 23, 24, 25, 26, 27, 28]);
      const roh = privatIp(R, Math.min(praefix, 16));
      const netz = (roh & maskeVon(praefix)) >>> 0;
      const hostAnteil = R.ganz(1, Math.max(1, Math.pow(2, Math.min(32 - praefix, 12)) - 2));
      const ip = intZuIp((netz + hostAnteil) >>> 0);
      const bc = bcVon(ip, praefix);
      const hosts = Math.pow(2, 32 - praefix) - 2;

      return {
        situation: `In der Niederlassung der ${c.firma} (${c.standort}) arbeitet ein Arbeitsplatzrechner mit der ` +
          `IP-Adresse ${ip}/${praefix}.`,
        prompt: "Bestimmen Sie für dieses Netz die geforderten Angaben.",
        felder: [
          { typ: "text", label: "Subnetzmaske (dezimal)", be: 1, zeilen: 1, erwartet: [[maskeText(praefix)]] },
          { typ: "text", label: "Netzadresse", be: 1.5, zeilen: 1, erwartet: [[intZuIp(netz)]] },
          { typ: "text", label: "Broadcastadresse", be: 1.5, zeilen: 1, erwartet: [[intZuIp(bc)]] },
          { typ: "text", label: "Erste nutzbare Hostadresse", be: 1, zeilen: 1, erwartet: [[intZuIp((netz + 1) >>> 0)]] },
          { typ: "text", label: "Letzte nutzbare Hostadresse", be: 1, zeilen: 1, erwartet: [[intZuIp((bc - 1) >>> 0)]] },
          { typ: "zahl", label: "Anzahl nutzbarer Hostadressen", be: 1, dez: 0, loesung: hosts, tolAbs: 0 }
        ],
        loesung:
`Präfix /${praefix} → Maske ${maskeText(praefix)}
binär: ${maskeBinaer(praefix)}
Netzadresse:   ${intZuIp(netz)}   (IP UND Maske, alle Hostbits auf 0)
Broadcast:     ${intZuIp(bc)}   (alle Hostbits auf 1)
Erster Host:   ${intZuIp((netz + 1) >>> 0)}
Letzter Host:  ${intZuIp((bc - 1) >>> 0)}
Nutzbare Hosts: 2^${32 - praefix} − 2 = ${f.zahl(hosts, 0)}`
      };
    }
  });

  /* ---------------------------------------------------------------- 2 ---- */
  G.vorlage({
    id: "netz-subnetting", thema: "netzwerk", sub: "Subnetting",
    titel: "Netz in Subnetze aufteilen", stufe: 3,
    bau(R, c) {
      const basisPraefix = R.waehle([16, 20, 22, 24]);
      const netz = (privatIp(R, basisPraefix) & maskeVon(basisPraefix)) >>> 0;
      const anzahl = R.waehle([3, 4, 5, 6, 7, 9, 10, 12, 14]);
      const bits = Math.ceil(Math.log2(anzahl));
      const neu = basisPraefix + bits;
      const hosts = Math.pow(2, 32 - neu) - 2;
      const groesse = Math.pow(2, 32 - neu);
      const k = R.ganz(2, Math.pow(2, bits));
      const kNetz = (netz + (k - 1) * groesse) >>> 0;
      const kBc = (kNetz + groesse - 1) >>> 0;
      const abteilungen = R.waehleN(G.KONTEXT.abteilungen, anzahl);

      return {
        situation: `Die ${c.firma} betreibt das Netz ${intZuIp(netz)}/${basisPraefix}. ` +
          `Es soll in Subnetze aufgeteilt werden — je ein Subnetz für die ${anzahl} Bereiche ` +
          `${f.liste(abteilungen.slice(0, 3))} und weitere. Alle Subnetze sollen gleich groß sein.`,
        prompt: `Ermitteln Sie die neue Präfixlänge und beschreiben Sie das ${k}. Subnetz.`,
        felder: [
          { typ: "zahl", label: "Zusätzlich benötigte Subnetzbits", be: 1, dez: 0, loesung: bits, tolAbs: 0 },
          { typ: "zahl", label: "Neue Präfixlänge (nur Zahl)", be: 1, dez: 0, loesung: neu, tolAbs: 0 },
          { typ: "text", label: "Neue Subnetzmaske (dezimal)", be: 1, zeilen: 1, erwartet: [[maskeText(neu)]] },
          { typ: "zahl", label: "Nutzbare Hosts je Subnetz", be: 1.5, dez: 0, loesung: hosts, tolAbs: 0 },
          { typ: "text", label: `Netzadresse des ${k}. Subnetzes`, be: 1.5, zeilen: 1, erwartet: [[intZuIp(kNetz)]] },
          { typ: "text", label: `Broadcastadresse des ${k}. Subnetzes`, be: 1, zeilen: 1, erwartet: [[intZuIp(kBc)]] }
        ],
        loesung:
`${anzahl} Subnetze → 2^n ≥ ${anzahl} → n = ${bits} Subnetzbits (2^${bits} = ${Math.pow(2, bits)} Subnetze).
Neues Präfix: /${basisPraefix} + ${bits} = /${neu}, Maske ${maskeText(neu)}
Hosts je Subnetz: 2^${32 - neu} − 2 = ${f.zahl(hosts, 0)}
Subnetzgröße (Blockgröße): ${f.zahl(groesse, 0)} Adressen
${k}. Subnetz: ${intZuIp(netz)} + ${k - 1} × ${f.zahl(groesse, 0)} = ${intZuIp(kNetz)}/${neu}
   erster Host ${intZuIp((kNetz + 1) >>> 0)} · letzter Host ${intZuIp((kBc - 1) >>> 0)} · Broadcast ${intZuIp(kBc)}`
      };
    }
  });

  /* ---------------------------------------------------------------- 3 ---- */
  G.vorlage({
    id: "netz-zugehoerigkeit", thema: "netzwerk", sub: "Netzwerkdiagnose",
    titel: "Liegen beide Rechner im selben Netz?", stufe: 2,
    bau(R, c) {
      const praefix = R.waehle([24, 25, 26, 27, 22, 23]);
      const netzA = (privatIp(R, 16) & maskeVon(praefix)) >>> 0;
      const gleich = R.muenze(0.5);
      const groesse = Math.pow(2, 32 - praefix);
      const ipA = intZuIp((netzA + R.ganz(1, Math.min(groesse - 2, 40))) >>> 0);
      const ipB = gleich
        ? intZuIp((netzA + R.ganz(Math.max(2, groesse - 40), groesse - 2)) >>> 0)
        : intZuIp((netzA + groesse + R.ganz(1, Math.min(groesse - 2, 40))) >>> 0);

      const netzAtxt = intZuIp(netzVon(ipA, praefix));
      const netzBtxt = intZuIp(netzVon(ipB, praefix));

      return {
        situation: `In der Abteilung ${c.abteilung} der ${c.firma} können zwei Rechner sich gegenseitig nicht erreichen. ` +
          `Ein Ping schlägt fehl, obwohl beide am selben Switch hängen.\n` +
          `Rechner 1: ${ipA}, Subnetzmaske ${maskeText(praefix)}\n` +
          `Rechner 2: ${ipB}, Subnetzmaske ${maskeText(praefix)}`,
        prompt: "Prüfen Sie rechnerisch, ob beide Rechner im selben Subnetz liegen, und erklären Sie das Ergebnis.",
        felder: [
          { typ: "text", label: "Netzadresse Rechner 1", be: 1, zeilen: 1, erwartet: [[netzAtxt]] },
          { typ: "text", label: "Netzadresse Rechner 2", be: 1, zeilen: 1, erwartet: [[netzBtxt]] },
          { typ: "auswahl", label: "Liegen beide im selben Subnetz?", be: 1,
            optionen: ["ja", "nein"], loesung: gleich ? "ja" : "nein" },
          { typ: "text", label: "Begründen Sie und nennen Sie eine Lösung", be: 2, zeilen: 3,
            noetig: 2,
            erwartet: gleich
              ? [["gleiche Netzadresse", "identische Netzadresse", "selbes Netz"],
                 ["Ursache liegt woanders", "Firewall", "Kabel", "VLAN", "Adresskonflikt", "falsches Gateway"]]
              : [["unterschiedliche Netzadresse", "verschiedene Netze", "nicht im selben Netz"],
                 ["Router", "Gateway", "Adresse anpassen", "gleiches Subnetz vergeben", "Maske ändern", "Layer-3"]] }
        ],
        loesung:
`Maske ${maskeText(praefix)} (/${praefix}) auf beide Adressen anwenden:
${ipA} UND ${maskeText(praefix)} = ${netzAtxt}
${ipB} UND ${maskeText(praefix)} = ${netzBtxt}
` + (gleich
  ? `Beide Netzadressen sind identisch — die Rechner liegen im selben Subnetz.
Die Ursache der Störung liegt also nicht in der Adressierung: zu prüfen sind Kabel/Port, VLAN-Zuordnung,
lokale Firewall und ein möglicher Adresskonflikt.`
  : `Die Netzadressen unterscheiden sich — die Rechner liegen in verschiedenen Subnetzen und können
ohne Router (Layer 3) nicht direkt miteinander kommunizieren.
Lösung: beiden Rechnern Adressen aus demselben Subnetz geben oder einen Router bzw. das Default-Gateway
korrekt konfigurieren.`)
      };
    }
  });

  /* ---------------------------------------------------------------- 4 ---- */
  G.vorlage({
    id: "netz-ipv6", thema: "netzwerk", sub: "IPv6-Adressierung",
    titel: "IPv6-Adresse kürzen und einordnen", stufe: 2,
    merksatz: "Führende Nullen je Block streichen, den längsten Nullblock (mind. 2 Gruppen) einmal durch :: ersetzen.",
    bau(R, c) {
      const hex = () => R.waehle(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"]);
      const gruppe = () => hex() + hex() + hex() + hex();
      const arten = [
        { pre: ["2001", "0db8"], name: "Global Unicast (Dokumentationspräfix 2001:db8::/32)", key: "global" },
        { pre: ["fe80", "0000"], name: "Link-Local (fe80::/10)", key: "linklocal" },
        { pre: ["fd" + hex() + hex(), gruppe()], name: "Unique Local Address, ULA (fc00::/7)", key: "ula" },
        { pre: ["2a02", gruppe()], name: "Global Unicast (öffentlich routbar)", key: "global" }
      ];
      const art = R.waehle(arten);
      const nullen = R.ganz(2, 4);
      const g = art.pre.slice();
      for (let i = g.length; i < 8 - nullen; i++) g.push(gruppe());
      const einsetzen = g.length;
      for (let i = 0; i < nullen; i++) g.splice(einsetzen, 0, "0000");
      while (g.length < 8) g.push(gruppe());
      const voll = g.slice(0, 8);

      // korrekt kürzen
      const teile = voll.map(x => x.replace(/^0+(?=.)/, ""));
      let bestI = -1, bestL = 0, i = 0;
      while (i < 8) {
        if (teile[i] === "0") { let j = i; while (j < 8 && teile[j] === "0") j++; if (j - i > bestL) { bestL = j - i; bestI = i; } i = j; }
        else i++;
      }
      let kurz;
      if (bestL >= 2) {
        const links = teile.slice(0, bestI).join(":");
        const rechts = teile.slice(bestI + bestL).join(":");
        kurz = links + "::" + rechts;
      } else kurz = teile.join(":");

      const praefixLen = R.waehle([48, 56, 64]);

      return {
        situation: `Ein Server der ${c.firma} hat die IPv6-Adresse\n` +
          `${voll.join(":")}\nmit der Präfixlänge /${praefixLen}.`,
        prompt: "Kürzen Sie die Adresse nach den IPv6-Regeln und ordnen Sie sie ein.",
        felder: [
          { typ: "text", label: "Gekürzte Schreibweise", be: 2, zeilen: 1, erwartet: [[kurz]] },
          { typ: "auswahl", label: "Um welchen Adresstyp handelt es sich?", be: 1,
            optionen: ["Global Unicast", "Link-Local", "Unique Local Address (ULA)", "Multicast"],
            loesung: art.key === "linklocal" ? "Link-Local" : (art.key === "ula" ? "Unique Local Address (ULA)" : "Global Unicast") },
          { typ: "zahl", label: "Wie viele Bits stehen bei /" + praefixLen + " für den Interface-Identifier zur Verfügung?",
            be: 1, dez: 0, loesung: 128 - praefixLen, tolAbs: 0 },
          { typ: "text", label: "Nennen Sie einen Vorteil von IPv6 gegenüber IPv4", be: 1, zeilen: 2,
            erwartet: [["größerer Adressraum", "128 Bit", "mehr Adressen", "kein NAT nötig",
              "Autokonfiguration", "SLAAC", "vereinfachter Header", "IPsec"]] }
        ],
        loesung:
`Voll:   ${voll.join(":")}
1. Führende Nullen je Block streichen: ${teile.join(":")}
2. Längsten zusammenhängenden Nullblock einmal durch :: ersetzen: ${kurz}

Typ: ${art.name}
Interface-Identifier bei /${praefixLen}: 128 − ${praefixLen} = ${128 - praefixLen} Bit
Vorteile von IPv6: 128-Bit-Adressraum (kein Adressmangel, kein NAT nötig), zustandslose
Autokonfiguration (SLAAC), vereinfachter Header, IPsec von Anfang an vorgesehen.`
      };
    }
  });

  /* ---------------------------------------------------------------- 5 ---- */
  G.vorlage({
    id: "netz-bandbreite", thema: "netzwerk", sub: "Bandbreiten- & Übertragungsberechnung",
    titel: "Übertragungsdauer berechnen", stufe: 2,
    merksatz: "Datenmenge binär (1 GiB = 1.024³ Byte), Übertragungsrate dezimal (1 Mbit/s = 1.000.000 Bit/s). Byte × 8 = Bit — so rechnet die ZPA.",
    bau(R, c) {
      /* Prüfungskatalog, Anhang S. 43: Datenmengen nur mit Binärpräfixen,
         physikalische Größen (Übertragungsrate) dezimal. So rechnen auch die
         Musterlösungen, z. B. Frühjahr 2024, 4f: GiB × 1.024³ × 8 ÷ (Mbit/s × 10⁶). */
      const gib = R.stufe(4, 90, 2);
      const leitung = R.waehle([50, 100, 200, 250, 400, 500, 1000]);
      const nutz = R.waehle([60, 65, 70, 75, 80]);
      const effektiv = r(leitung * nutz / 100, 2);
      const bit = gib * 1024 * 1024 * 1024 * 8;          // 1 GiB = 1.073.741.824 Byte
      const mbit = r(bit / 1e6, 0);
      const sekVoll = r(bit / (leitung * 1e6), 1);
      const sekEff = r(bit / (effektiv * 1e6), 1);
      const minEff = r(sekEff / 60, 1);
      const fenster = R.waehle([2, 3, 4, 6, 8]);
      const passt = minEff <= fenster * 60;

      return {
        situation: `Die ${c.firma} sichert jede Nacht ${gib} GiB Daten in ein zweites Rechenzentrum. ` +
          `Die Standleitung hat eine Bandbreite von ${leitung} Mbit/s, davon stehen der Sicherung ` +
          `${nutz} % zur Verfügung. Das Sicherungsfenster beträgt ${fenster} Stunden.\n` +
          `Rechnen Sie mit 1 GiB = 1.024 MiB = 1.024 × 1.024 × 1.024 Byte, 1 Byte = 8 Bit und 1 Mbit/s = 1.000.000 Bit/s.`,
        prompt: "Berechnen Sie die Übertragungsdauer und beurteilen Sie, ob das Sicherungsfenster ausreicht.",
        felder: [
          { typ: "zahl", label: "Zu übertragende Datenmenge", einheit: "Mbit", be: 1, dez: 0, loesung: mbit, tolRel: 0.005 },
          { typ: "zahl", label: "Effektiv nutzbare Bandbreite", einheit: "Mbit/s", be: 1, loesung: effektiv },
          { typ: "zahl", label: "Übertragungsdauer", einheit: "Minuten", be: 2, loesung: minEff, dez: 1, tolRel: 0.01 },
          { typ: "auswahl", label: "Reicht das Sicherungsfenster?", be: 1, optionen: ["ja", "nein"], loesung: passt ? "ja" : "nein" }
        ],
        loesung:
`Datenmenge: ${gib} GiB × 1.024 × 1.024 × 1.024 × 8 = ${f.zahl(r(bit, 0), 0)} Bit = ${f.zahl(mbit, 0)} Mbit
Effektive Bandbreite: ${leitung} Mbit/s × ${nutz} % = ${f.kurz(effektiv)} Mbit/s
Dauer: ${f.zahl(mbit, 0)} Mbit ÷ ${f.kurz(effektiv)} Mbit/s = ${f.kurz(sekEff)} s = ${f.kurz(minEff)} Minuten
(bei voller Leitung wären es ${f.kurz(sekVoll)} s)
Das Fenster von ${fenster} Stunden = ${fenster * 60} Minuten ${passt ? "reicht aus." : "reicht NICHT aus — Datenmenge reduzieren (inkrementell, Komprimierung, Deduplizierung) oder Bandbreite erhöhen."}`
      };
    }
  });

  /* ---------------------------------------------------------------- 6 ---- */
  G.vorlage({
    id: "daten-speicherbedarf", thema: "daten", sub: "Speicherbedarfsberechnung",
    titel: "Speicherbedarf eines Archivs", stufe: 2,
    merksatz: "Datenmengen in KiB/MiB/GiB (÷ 1.024). Festplatten verkaufen Hersteller in TB = 10¹² Byte — erst in GiB umrechnen, dann teilen.",
    bau(R, c) {
      /* Wie Herbst 2025, 2c: KiB × Scans ÷ 1.024 ÷ 1.024 … (Katalog, Anhang S. 43) */
      const proTag = R.stufe(120, 1800, 20);
      const groesseKiB = R.stufe(180, 2600, 20);
      const tage = R.waehle([220, 230, 250, 260]);
      const jahre = R.waehle([5, 7, 10]);
      const reserve = R.waehle([15, 20, 25, 30]);

      const proJahrKiB = proTag * tage * groesseKiB;
      const proJahrMiB = r(proJahrKiB / 1024, 2);
      const proJahrGiB = r(proJahrKiB / 1024 / 1024, 2);
      const gesamtGiB = r(proJahrGiB * jahre, 2);
      const mitReserve = r(gesamtGiB * (1 + reserve / 100), 2);
      const platten = R.waehle([2, 4, 6, 8]);
      const platteGiB = r(platten * 1e12 / 1024 / 1024 / 1024, 2);   // Herstellerangabe TB → GiB
      const anzahlPlatten = Math.ceil(mitReserve / platteGiB);

      return {
        situation: `Die ${c.firma} digitalisiert eingehende Belege. Täglich fallen ${f.zahl(proTag, 0)} Dokumente ` +
          `mit durchschnittlich ${f.zahl(groesseKiB, 0)} KiB an, gerechnet wird mit ${tage} Arbeitstagen im Jahr. ` +
          `Die gesetzliche Aufbewahrungsfrist beträgt ${jahre} Jahre. Für Wachstum und Verwaltungsdaten sind ` +
          `zusätzlich ${reserve} % Reserve einzuplanen. Gespeichert wird auf Festplatten mit ${platten} TB ` +
          `(Herstellerangabe, 1 TB = 10¹² Byte).\n` +
          `Rechnen Sie mit 1 MiB = 1.024 KiB und 1 GiB = 1.024 MiB.`,
        prompt: "Berechnen Sie den Speicherbedarf und die Anzahl benötigter Festplatten.",
        felder: [
          { typ: "zahl", label: "Datenmenge pro Jahr", einheit: "GiB", be: 1.5, loesung: proJahrGiB, dez: 2, tolRel: 0.01 },
          { typ: "zahl", label: `Datenmenge über ${jahre} Jahre`, einheit: "GiB", be: 1, loesung: gesamtGiB, dez: 2, tolRel: 0.01 },
          { typ: "zahl", label: "Speicherbedarf inklusive Reserve", einheit: "GiB", be: 1.5, loesung: mitReserve, dez: 2, tolRel: 0.01 },
          { typ: "zahl", label: `Nutzbare Kapazität einer ${platten}-TB-Platte`, einheit: "GiB", be: 1, loesung: platteGiB, dez: 2, tolRel: 0.01 },
          { typ: "zahl", label: `Benötigte Festplatten à ${platten} TB (aufgerundet)`, einheit: "Stück",
            be: 1, dez: 0, loesung: anzahlPlatten, tolAbs: 0 }
        ],
        loesung:
`Pro Jahr: ${f.zahl(proTag, 0)} Dok. × ${tage} Tage × ${f.zahl(groesseKiB, 0)} KiB = ${f.zahl(proJahrKiB, 0)} KiB
        ÷ 1.024 = ${f.kurz(proJahrMiB)} MiB ÷ 1.024 = ${f.kurz(proJahrGiB)} GiB
Über ${jahre} Jahre: ${f.kurz(proJahrGiB)} GiB × ${jahre} = ${f.kurz(gesamtGiB)} GiB
+ ${reserve} % Reserve: ${f.kurz(gesamtGiB)} × ${f.kurz(1 + reserve / 100)} = ${f.kurz(mitReserve)} GiB
Eine Platte: ${platten} TB = ${platten} × 10¹² Byte ÷ 1.024³ = ${f.kurz(platteGiB)} GiB
Festplatten: ${f.kurz(mitReserve)} GiB ÷ ${f.kurz(platteGiB)} GiB = ${f.kurz(r(mitReserve / platteGiB, 2))} → ${anzahlPlatten} Platten (aufrunden)`
      };
    }
  });

  /* ---------------------------------------------------------------- 7 ---- */
  G.vorlage({
    id: "daten-video", thema: "daten", sub: "Speicherbedarfsberechnung",
    titel: "Speicherbedarf einer Videoaufzeichnung", stufe: 2,
    merksatz: "Videostrom in Mbit/s ist eine Rate (× 10⁶), der Speicherbedarf eine Datenmenge (÷ 1.024³ für GiB).",
    bau(R, c) {
      /* Wie Frühjahr 2026, 1b: Kameras × Mbit/s × 10⁶ × Sekunden ÷ 8 ÷ 1.024⁴ = TiB */
      const kameras = R.stufe(4, 24, 2);
      const mbits = R.waehle([2, 3, 4, 6, 8]);
      const stunden = R.waehle([10, 12, 16, 24]);
      const tage = R.waehle([7, 10, 14, 30]);

      const byteProStunde = mbits * 1e6 * 3600 / 8;
      const proKameraStundeGiB = r(byteProStunde / 1024 / 1024 / 1024, 4);
      const gesamtGiB = r(byteProStunde * stunden * tage * kameras / 1024 / 1024 / 1024, 2);
      const tib = r(gesamtGiB / 1024, 2);

      return {
        situation: `Die ${c.firma} betreibt ${kameras} Überwachungskameras. Jede Kamera erzeugt einen ` +
          `Videostrom von ${mbits} Mbit/s und zeichnet ${stunden} Stunden pro Tag auf. ` +
          `Die Aufzeichnungen müssen ${tage} Tage vorgehalten werden.\n` +
          `Rechnen Sie mit 1 Mbit/s = 1.000.000 Bit/s, 1 Byte = 8 Bit und 1 GiB = 1.024³ Byte.`,
        prompt: "Berechnen Sie den benötigten Speicherplatz.",
        felder: [
          { typ: "zahl", label: "Datenmenge je Kamera und Stunde", einheit: "GiB", be: 1.5, loesung: proKameraStundeGiB, dez: 3, tolRel: 0.01 },
          { typ: "zahl", label: "Gesamter Speicherbedarf", einheit: "GiB", be: 2, loesung: gesamtGiB, dez: 2, tolRel: 0.01 },
          { typ: "zahl", label: "Gesamter Speicherbedarf", einheit: "TiB", be: 1, loesung: tib, dez: 2, tolRel: 0.01 },
          { typ: "text", label: "Nennen Sie eine Maßnahme, die den Speicherbedarf senkt", be: 1, zeilen: 2,
            erwartet: [["stärkere Komprimierung", "H.265", "geringere Auflösung", "niedrigere Bildrate",
              "bewegungsgesteuerte Aufzeichnung", "Motion Detection", "kürzere Aufbewahrung", "weniger fps"]] }
        ],
        loesung:
`Je Kamera und Stunde: ${mbits} × 1.000.000 Bit/s × 3.600 s ÷ 8 = ${f.zahl(byteProStunde, 0)} Byte ÷ 1.024³ = ${f.kurz(proKameraStundeGiB)} GiB
Gesamt: ${f.kurz(proKameraStundeGiB)} GiB × ${stunden} h × ${tage} Tage × ${kameras} Kameras = ${f.kurz(gesamtGiB)} GiB ÷ 1.024 = ${f.kurz(tib)} TiB
Senken lässt sich der Bedarf durch stärkere Komprimierung (H.265 statt H.264), geringere Auflösung
oder Bildrate, bewegungsgesteuerte Aufzeichnung und eine kürzere Aufbewahrungsfrist.`
      };
    }
  });

  /* ---------------------------------------------------------------- 8 ---- */
  G.vorlage({
    id: "daten-backup", thema: "daten", sub: "Backups",
    titel: "Backup-Strategie und Speicherbedarf", stufe: 2,
    merksatz: "Differenziell sichert immer gegen die letzte Vollsicherung, inkrementell gegen die letzte Sicherung jeder Art. Restore: differenziell = 2 Sätze, inkrementell = Voll + alle Inkremente.",
    bau(R, c) {
      const vollGB = R.stufe(200, 1800, 20);
      const aenderung = R.waehle([2, 3, 4, 5, 6]);
      const tage = 6;              // Mo–Sa, Sonntag Vollsicherung
      const art = R.muenze() ? "differenziell" : "inkrementell";

      const taeglich = r(vollGB * aenderung / 100, 2);
      let woche;
      if (art === "differenziell") {
        // Tag n enthält n × Änderungsmenge
        woche = r(vollGB + taeglich * (tage * (tage + 1) / 2), 2);
      } else {
        woche = r(vollGB + taeglich * tage, 2);
      }
      const restore = art === "differenziell" ? 2 : tage + 1;

      return {
        situation: `Die ${c.firma} sichert ${f.zahl(vollGB, 0)} GB Nutzdaten. Sonntags läuft eine Vollsicherung, ` +
          `von Montag bis Samstag wird ${art} gesichert. Täglich ändern sich ${aenderung} % des ` +
          `Gesamtdatenbestands.`,
        prompt: "Berechnen Sie den Speicherbedarf für eine komplette Woche und beurteilen Sie die Wiederherstellung.",
        felder: [
          { typ: "zahl", label: "Datenmenge einer Tagessicherung am Montag", einheit: "GB", be: 1, loesung: taeglich },
          { typ: "zahl", label: "Speicherbedarf für die gesamte Woche", einheit: "GB", be: 2, loesung: woche, tolRel: 0.01 },
          { typ: "zahl", label: "Benötigte Sicherungssätze für eine Wiederherstellung am Samstagabend",
            einheit: "Sätze", be: 1.5, dez: 0, loesung: restore, tolAbs: 0 },
          { typ: "text", label: `Nennen Sie einen Nachteil der ${art}en Sicherung`, be: 1.5, zeilen: 2,
            erwartet: art === "differenziell"
              ? [["wachsender Speicherbedarf", "Sicherungen werden immer größer", "längere Sicherungsdauer", "mehr Speicherplatz"]]
              : [["Wiederherstellung dauert länger", "viele Sicherungssätze nötig", "fehlerhaftes Inkrement macht Kette unbrauchbar",
                  "aufwendiges Restore", "Kette", "alle Sicherungen nötig"]] }
        ],
        loesung:
`Tägliche Änderungsmenge: ${f.zahl(vollGB, 0)} GB × ${aenderung} % = ${f.kurz(taeglich)} GB
` + (art === "differenziell"
  ? `Differenziell: Montag ${f.kurz(taeglich)} GB, Dienstag ${f.kurz(r(taeglich * 2, 2))} GB … Samstag ${f.kurz(r(taeglich * 6, 2))} GB
Summe Mo–Sa: ${f.kurz(taeglich)} × (1+2+3+4+5+6) = ${f.kurz(r(taeglich * 21, 2))} GB
Woche gesamt: ${f.zahl(vollGB, 0)} + ${f.kurz(r(taeglich * 21, 2))} = ${f.kurz(woche)} GB
Restore: Vollsicherung + letzte differenzielle Sicherung = 2 Sätze.
Nachteil: Die Sicherungen werden von Tag zu Tag größer und brauchen mehr Zeit und Platz.`
  : `Inkrementell: jeden Tag ${f.kurz(taeglich)} GB → 6 × ${f.kurz(taeglich)} = ${f.kurz(r(taeglich * 6, 2))} GB
Woche gesamt: ${f.zahl(vollGB, 0)} + ${f.kurz(r(taeglich * 6, 2))} = ${f.kurz(woche)} GB
Restore: Vollsicherung + alle 6 Inkremente = 7 Sätze.
Nachteil: Die Wiederherstellung dauert länger; fehlt oder fehlerhaft ist ein Inkrement,
ist die gesamte Kette ab diesem Punkt unbrauchbar.`)
      };
    }
  });

  /* ---------------------------------------------------------------- 9 ---- */
  G.vorlage({
    id: "daten-raid", thema: "daten", sub: "RAID",
    titel: "RAID-Kapazität und Ausfallsicherheit", stufe: 1,
    katalog: { status: "veraltet", grund: "RAID wird laut Prüfungskatalog ab 2025 nur noch in AP2 geprüft.", themen: ["RAID"] },
    bau(R, c) {
      const level = R.waehle(["0", "1", "5", "6", "10"]);
      const platten = level === "10" ? R.waehle([4, 6, 8]) : R.ganz(level === "1" ? 2 : (level === "6" ? 4 : 3), 8);
      const groesse = R.waehle([1, 2, 4, 6, 8, 12]);
      const netto = {
        "0": platten * groesse,
        "1": groesse,
        "5": (platten - 1) * groesse,
        "6": (platten - 2) * groesse,
        "10": platten / 2 * groesse
      }[level];
      const ausfall = { "0": 0, "1": platten - 1, "5": 1, "6": 2, "10": 1 }[level];
      const formel = { "0": "n × Kapazität", "1": "Kapazität einer Platte", "5": "(n − 1) × Kapazität",
        "6": "(n − 2) × Kapazität", "10": "n/2 × Kapazität" }[level];

      return {
        situation: `Ein Server der ${c.firma} wird mit ${platten} Festplatten à ${groesse} TB bestückt ` +
          `und als RAID ${level} konfiguriert. Bei RAID 1 arbeiten alle Platten als Spiegel derselben Daten.`,
        prompt: "Bestimmen Sie die nutzbare Kapazität und die Ausfallsicherheit.",
        felder: [
          { typ: "zahl", label: "Nutzbare Kapazität", einheit: "TB", be: 2, loesung: netto, dez: 1, tolRel: 0.005 },
          { typ: "zahl", label: "Wie viele Platten dürfen gleichzeitig ausfallen?", einheit: "Platten",
            be: 1.5, dez: 0, loesung: ausfall, tolAbs: 0 },
          { typ: "text", label: `Nennen Sie einen Nachteil von RAID ${level}`, be: 1.5, zeilen: 2,
            erwartet: level === "0"
              ? [["keine Ausfallsicherheit", "Totalverlust bei Plattenausfall", "kein Schutz"]]
              : level === "1" ? [["hoher Kapazitätsverlust", "nur die Hälfte nutzbar", "teuer", "50 % Verlust"]]
              : level === "5" ? [["Rebuild dauert lange", "nur eine Platte darf ausfallen", "Schreibleistung durch Parität",
                  "Risiko beim Wiederherstellen"]]
              : level === "6" ? [["geringere Schreibleistung", "zwei Platten Kapazitätsverlust", "aufwendige Paritätsberechnung"]]
              : [["hoher Kapazitätsverlust", "nur die Hälfte nutzbar", "mindestens vier Platten"]] },
          { typ: "text", label: "Warum ersetzt ein RAID kein Backup?", be: 1, zeilen: 2,
            erwartet: [["schützt nicht vor Löschen", "kein Schutz vor Ransomware", "Fehler werden mitgespiegelt",
              "kein Schutz vor Versehen", "kein Versionsstand", "nur Hardwareausfall"]] }
        ],
        loesung:
`RAID ${level}: nutzbare Kapazität = ${formel} = ${f.kurz(netto)} TB
Ausfallsicherheit: ${ausfall === 0 ? "keine — schon eine defekte Platte bedeutet Totalverlust"
  : "es dürfen " + ausfall + " Platte(n) gleichzeitig ausfallen"}
Ein RAID schützt nur gegen den Ausfall von Hardware. Versehentliches Löschen, Verschlüsselung durch
Ransomware oder logische Fehler werden sofort auf alle Platten übernommen — deshalb ersetzt ein RAID
niemals ein Backup.`
      };
    }
  });

  /* --------------------------------------------------------------- 10 ---- */
  G.vorlage({
    id: "netz-zahlensysteme", thema: "netzwerk", sub: "Zahlensysteme",
    titel: "Zwischen Zahlensystemen umrechnen", stufe: 1,
    merksatz: "Hex-Ziffer = 4 Bit. Dual → Hex: von rechts in Vierergruppen teilen.",
    bau(R, c) {
      const wert = R.ganz(60, 250);
      const oktett = R.ganz(1, 254);
      const praefix = R.waehle([21, 22, 26, 27, 28, 30]);
      const maske = maskeText(praefix).split(".")[Math.floor(praefix / 8)] || "0";

      return {
        situation: `Bei der Fehlersuche im Netz der ${c.firma} müssen Adressen und Masken zwischen ` +
          `Dezimal-, Dual- und Hexadezimalschreibweise umgerechnet werden.`,
        prompt: "Rechnen Sie um. Geben Sie Dualzahlen achtstellig an (mit führenden Nullen).",
        felder: [
          { typ: "text", label: `${wert} (dezimal) als Dualzahl`, be: 1, zeilen: 1,
            erwartet: [[binOktett(wert)]] },
          { typ: "text", label: `${wert} (dezimal) als Hexadezimalzahl`, be: 1, zeilen: 1,
            erwartet: [[wert.toString(16).toUpperCase(), "0x" + wert.toString(16).toUpperCase()]] },
          { typ: "zahl", label: `${binOktett(oktett)} (dual) als Dezimalzahl`, be: 1, dez: 0, loesung: oktett, tolAbs: 0 },
          { typ: "text", label: `Subnetzmaske /${praefix} — das entscheidende Oktett dezimal`, be: 1, zeilen: 1,
            erwartet: [[maske]] },
          { typ: "text", label: `Dieses Oktett als Dualzahl`, be: 1, zeilen: 1, erwartet: [[binOktett(+maske)]] }
        ],
        loesung:
`${wert} dezimal = ${binOktett(wert)} dual = ${wert.toString(16).toUpperCase()} hexadezimal
   (${binOktett(wert).match(/.{4}/g).join(" ")} → ${binOktett(wert).match(/.{4}/g).map(x => parseInt(x, 2).toString(16).toUpperCase()).join(" ")})
${binOktett(oktett)} dual = ${oktett} dezimal
Maske /${praefix} = ${maskeText(praefix)}, entscheidendes Oktett ${maske} = ${binOktett(+maske)} dual
Binär gilt: ${maskeBinaer(praefix)}`
      };
    }
  });

  /* --------------------------------------------------------------- 11 ---- */
  G.vorlage({
    id: "netz-poe", thema: "netzwerk", sub: "WLAN & Netzwerktechnik",
    titel: "PoE-Budget eines Switches", stufe: 2,
    bau(R, c) {
      const aps = R.stufe(6, 22, 1);
      const norm = R.waehle([
        { name: "802.3af (PoE)", watt: 15.4 },
        { name: "802.3at (PoE+)", watt: 30 },
        { name: "802.3bt (PoE++, Typ 3)", watt: 60 }
      ]);
      const budget = R.waehle([120, 180, 240, 370, 740]);
      const kameras = R.stufe(2, 10, 1);
      const kameraWatt = R.waehle([6.5, 9, 12.5]);

      const bedarf = r(aps * norm.watt + kameras * kameraWatt, 1);
      const reicht = bedarf <= budget;
      const frei = r(budget - bedarf, 1);
      const maxAps = Math.floor((budget - kameras * kameraWatt) / norm.watt);

      return {
        situation: `Am ${c.standort} der ${c.firma} sollen ${aps} Access Points nach ${norm.name} ` +
          `(max. ${f.kurz(norm.watt)} W je Port) und ${kameras} IP-Kameras mit je ${f.kurz(kameraWatt)} W ` +
          `über einen PoE-Switch versorgt werden. Das PoE-Budget des Switches beträgt ${budget} W.`,
        prompt: "Prüfen Sie, ob das PoE-Budget ausreicht.",
        felder: [
          { typ: "zahl", label: "Gesamter Leistungsbedarf", einheit: "W", be: 2, loesung: bedarf, dez: 1, tolRel: 0.005 },
          { typ: "auswahl", label: "Reicht das PoE-Budget?", be: 1, optionen: ["ja", "nein"], loesung: reicht ? "ja" : "nein" },
          { typ: "zahl", label: reicht ? "Freie Reserve" : "Fehlende Leistung", einheit: "W", be: 1,
            loesung: Math.abs(frei), dez: 1, tolRel: 0.01 },
          { typ: "zahl", label: "Wie viele Access Points könnte der Switch neben den Kameras höchstens versorgen?",
            einheit: "Stück", be: 1, dez: 0, loesung: maxAps, tolAbs: 0 }
        ],
        loesung:
`Access Points: ${aps} × ${f.kurz(norm.watt)} W = ${f.kurz(r(aps * norm.watt, 1))} W
Kameras:       ${kameras} × ${f.kurz(kameraWatt)} W = ${f.kurz(r(kameras * kameraWatt, 1))} W
Summe:         ${f.kurz(bedarf)} W bei einem Budget von ${budget} W
→ ${reicht ? "Das Budget reicht aus, es bleiben " + f.kurz(frei) + " W Reserve."
           : "Das Budget reicht NICHT aus, es fehlen " + f.kurz(Math.abs(frei)) + " W. Abhilfe: Switch mit größerem PoE-Budget, zweiter PoE-Switch oder Netzteile vor Ort."}
Maximal mögliche APs: (${budget} − ${f.kurz(r(kameras * kameraWatt, 1))}) ÷ ${f.kurz(norm.watt)} = ${maxAps}`
      };
    }
  });

  /* --------------------------------------------------------------- 12 ---- */
  G.vorlage({
    id: "netz-osi", thema: "netzwerk", sub: "OSI-Modell",
    titel: "OSI-Schichten zuordnen", stufe: 1,
    bau(R, c) {
      const alle = [
        ["IP", "3 – Vermittlungsschicht"], ["TCP", "4 – Transportschicht"],
        ["HTTP", "7 – Anwendungsschicht"], ["Ethernet-Frame / MAC-Adresse", "2 – Sicherungsschicht"],
        ["RJ45-Stecker und Kabel", "1 – Bitübertragungsschicht"], ["DNS", "7 – Anwendungsschicht"],
        ["Switch", "2 – Sicherungsschicht"], ["Router", "3 – Vermittlungsschicht"],
        ["UDP", "4 – Transportschicht"], ["Hub / Repeater", "1 – Bitübertragungsschicht"]
      ];
      const paare = R.waehleN(alle, 5);
      const optionen = ["1 – Bitübertragungsschicht", "2 – Sicherungsschicht", "3 – Vermittlungsschicht",
        "4 – Transportschicht", "5 – Sitzungsschicht", "6 – Darstellungsschicht", "7 – Anwendungsschicht"];

      return {
        situation: `Bei der Fehlersuche im Netz der ${c.firma} hilft die Einordnung der Komponenten und ` +
          `Protokolle in das OSI-Referenzmodell.`,
        prompt: "Ordnen Sie jedem Begriff die richtige OSI-Schicht zu.",
        felder: [
          { typ: "zuordnung", label: "Zuordnung", be: 5, optionen, paare },
          { typ: "text", label: "Warum ist die Schichtung im OSI-Modell für die Fehlersuche nützlich?", be: 1.5, zeilen: 3,
            erwartet: [["von unten nach oben eingrenzen", "Fehler lässt sich einer Schicht zuordnen",
              "systematisch eingrenzen", "strukturierte Fehlersuche", "Schicht für Schicht"]] }
        ],
        loesung: paare.map(p => `${p[0]} → Schicht ${p[1]}`).join("\n") +
`\n\nDie Schichtung erlaubt es, einen Fehler systematisch von unten nach oben einzugrenzen:
erst Kabel und Verbindung (Schicht 1), dann Switch/MAC (2), dann IP-Adressierung und Routing (3),
dann Ports und Verbindungen (4) und erst zum Schluss die Anwendung (7).`
      };
    }
  });

})(window.GEN);
