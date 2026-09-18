/* ============================================================================
   gen/vorlagen-einheiten.js — Einheiten und Brutto/Netto
   ----------------------------------------------------------------------------
   Nachgezählt: von den 107 Aufgabentypen des Generators berührten genau ZWEI
   die Umrechnungen, an denen in der AP1 dauernd Punkte hängen — Brutto/Netto
   mit der Umsatzsteuer, Milliampere in Ampere, P = U · I, Verbrauch in kWh
   und was der Strom im Jahr kostet. In den Prüfungen kommen sie in fast jeder
   Kalkulations- und Hardware-Aufgabe vor, meist als letzter Schritt: die
   Rechnung stimmt, und dann steht da „450“ statt „0,45“ oder der Nettopreis,
   wo der Bruttopreis gefragt war.

   Sieben neue Typen, alle mit frischen Zahlen bei jedem Klick:

     eh-brutto     Netto → Brutto → Umsatzsteuer, mit 19 % und 7 %
     eh-rueck      aus einem Bruttobetrag Netto und Steuer herausrechnen
     eh-vorsatz    Einheitenvorsätze: mA, kW, MB/s, µs — hin und zurück
     eh-ohm        P = U · I und I = P / U am Netzteil und am USB-Port
     eh-energie    W = P · t, Verbrauch in kWh und Stromkosten
     eh-usv        USV auslegen: Leistung, Überbrückungszeit, Wh
     eh-rabatt     Listenpreis → Rabatt → Skonto → Bezugspreis, netto/brutto

   Absicht ist nicht, Rechnen zu üben — das kann sie. Es geht um die Stelle
   DANACH: welche Einheit gehört an das Ergebnis, und war nach netto oder
   brutto gefragt. Deshalb steht in fast jedem Typ am Schluss eine Frage,
   die genau das prüft.
   ========================================================================== */
"use strict";
(function (G) {
  const f = G.fmt, r = G.runde;

  /* ==================================================== 1. Netto → Brutto */
  G.vorlage({
    id: "eh-brutto", thema: "kalkulation", sub: "Umsatzsteuer",
    titel: "Netto, Brutto und Umsatzsteuer", stufe: 1,
    merksatz: "Netto ist ohne Steuer, brutto ist mit. Aufschlagen: netto × 1,19. " +
      "Die Steuer allein: netto × 0,19. Ein Angebot an eine Firma ist fast immer netto — " +
      "die Firma holt sich die Umsatzsteuer vom Finanzamt zurück (Vorsteuerabzug).",
    bau(R, c) {
      const satz = R.waehle([19, 19, 19, 7]);
      const stueck = R.stufe(3, 25, 1);
      const netto = r(R.stufe(120, 1800, 10) + R.waehle([0, 0.5, 0.9]), 2);
      const summeNetto = r(netto * stueck, 2);
      const steuer = r(summeNetto * satz / 100, 2);
      const brutto = r(summeNetto + steuer, 2);

      return {
        situation:
`Die ${c.firma} bestellt ${f.kurz(stueck)} ${c.geraetPl || "Geräte"}.
Der Händler nennt einen Preis von ${f.eur(netto)} netto je Stück.
Es gilt der Umsatzsteuersatz von ${satz} %.`,
        prompt: "Berechnen Sie den Nettobetrag, die Umsatzsteuer und den Bruttobetrag der Bestellung.",
        felder: [
          { typ: "zahl", label: "Nettobetrag der Bestellung", einheit: "€", be: 1, dez: 2, loesung: summeNetto },
          { typ: "zahl", label: "Umsatzsteuer (" + satz + " %)", einheit: "€", be: 1, dez: 2, loesung: steuer },
          { typ: "zahl", label: "Bruttobetrag der Bestellung", einheit: "€", be: 1, dez: 2, loesung: brutto },
          { typ: "text", be: 2, zeilen: 2, satzbau: true, minWorte: 8,
            label: "Warum rechnet ein Betrieb intern meistens mit dem Nettopreis?",
            erwartet: [
              ["der Betrieb bekommt die Umsatzsteuer als Vorsteuer vom Finanzamt zurück",
               "Vorsteuerabzug", "die Umsatzsteuer ist für den Betrieb kein Kostenfaktor",
               "durchlaufender Posten"]
            ] }
        ],
        loesung:
`Netto der Bestellung:
  ${f.eur(netto)} × ${f.kurz(stueck)} = ${f.eur(summeNetto)}

Umsatzsteuer:
  ${f.eur(summeNetto)} × ${satz} % = ${f.eur(summeNetto)} × ${f.kurz(satz / 100)} = ${f.eur(steuer)}

Brutto:
  ${f.eur(summeNetto)} + ${f.eur(steuer)} = ${f.eur(brutto)}
  (oder in einem Schritt: ${f.eur(summeNetto)} × ${f.kurz(1 + satz / 100)} = ${f.eur(brutto)})

Für den Betrieb ist die Umsatzsteuer ein durchlaufender Posten: er zieht sie als
Vorsteuer ab und bekommt sie vom Finanzamt zurück. Deshalb vergleicht man
Angebote NETTO. Der Bruttobetrag zählt nur für die Liquidität — bezahlt werden
muss er trotzdem sofort.`
      };
    }
  });

  /* =============================================== 2. Brutto → Netto ==== */
  G.vorlage({
    id: "eh-rueck", thema: "kalkulation", sub: "Umsatzsteuer",
    titel: "Aus dem Bruttobetrag herausrechnen", stufe: 2,
    merksatz: "Rückwärts wird GETEILT, nicht abgezogen: netto = brutto ÷ 1,19. " +
      "19 % vom Bruttobetrag abzuziehen ist falsch — das ergibt zu wenig, weil die 19 % " +
      "vom kleineren Nettobetrag gerechnet werden.",
    bau(R, c) {
      const satz = R.waehle([19, 19, 7]);
      const brutto = r(R.stufe(300, 4500, 10) + R.waehle([0, 0.9, 0.5]), 2);
      const netto = r(brutto / (1 + satz / 100), 2);
      const steuer = r(brutto - netto, 2);
      const falsch = r(brutto * (1 - satz / 100), 2);

      return {
        situation:
`Eine Rechnung über einen ${c.geraet || "Drucker"} weist ${f.eur(brutto)} brutto aus.
Der Umsatzsteuersatz beträgt ${satz} %. Die Buchhaltung braucht den Nettobetrag
für die Anlagenbuchhaltung.`,
        prompt: "Ermitteln Sie den Nettobetrag und die enthaltene Umsatzsteuer.",
        felder: [
          { typ: "zahl", label: "Nettobetrag", einheit: "€", be: 2, dez: 2, loesung: netto, tolAbs: 0.02 },
          { typ: "zahl", label: "enthaltene Umsatzsteuer", einheit: "€", be: 1, dez: 2, loesung: steuer, tolAbs: 0.02 },
          { typ: "text", be: 2, zeilen: 2, satzbau: true, minWorte: 8,
            label: "Warum ist „Brutto minus " + satz + " %“ hier das falsche Vorgehen?",
            erwartet: [
              ["die " + satz + " % beziehen sich auf den Nettobetrag, nicht auf den Bruttobetrag",
               "der Prozentsatz gehört zur kleineren Grundzahl", "man muss durch " + f.kurz(1 + satz / 100) + " teilen",
               "Grundwert ist netto"]
            ] }
        ],
        loesung:
`Netto:
  ${f.eur(brutto)} ÷ ${f.kurz(1 + satz / 100)} = ${f.eur(netto)}

Umsatzsteuer:
  ${f.eur(brutto)} − ${f.eur(netto)} = ${f.eur(steuer)}

Häufiger Fehler:
  ${f.eur(brutto)} − ${satz} % = ${f.eur(falsch)}  ← FALSCH, ${f.eur(r(netto - falsch, 2))} zu wenig.
  Die ${satz} % sind vom NETTObetrag gerechnet. Der Bruttobetrag ist bereits
  ${f.kurz(100 + satz)} % — deshalb wird geteilt.

Merkhilfe: brutto = 119 %, netto = 100 %, Steuer = 19 %.
  netto  = brutto ÷ 1,19      Steuer = brutto ÷ 1,19 × 0,19  (oder brutto − netto)`
      };
    }
  });

  /* ================================================ 3. Einheitenvorsätze */
  G.vorlage({
    id: "eh-vorsatz", thema: "hardware", sub: "Einheiten",
    titel: "Einheiten umrechnen: mA, kW, MB/s, µs", stufe: 1,
    merksatz: "Jeder Vorsatz ist ein Faktor 1000: µ (millionstel) — m (tausendstel) — " +
      "Grundeinheit — k (tausend) — M (Million) — G (Milliarde). Nach oben wird geteilt, " +
      "nach unten multipliziert. Beim Speicher gilt zusätzlich 1024 statt 1000, wenn Ki, Mi, Gi dasteht.",
    bau(R, c) {
      const faelle = [
        { von: "mA", nach: "A", wert: R.stufe(120, 950, 10), faktor: 1000, teilt: true,
          was: "Stromaufnahme eines USB-Geräts" },
        { von: "W", nach: "kW", wert: R.stufe(250, 2400, 50), faktor: 1000, teilt: true,
          was: "Leistungsaufnahme eines Serverschranks" },
        { von: "µs", nach: "ms", wert: R.stufe(200, 9000, 100), faktor: 1000, teilt: true,
          was: "Zugriffszeit einer SSD" },
        { von: "GB", nach: "MB", wert: R.stufe(2, 48, 2), faktor: 1000, teilt: false,
          was: "Größe eines Datenträgerabbilds" },
        { von: "Mbit/s", nach: "kbit/s", wert: R.stufe(50, 940, 10), faktor: 1000, teilt: false,
          was: "Übertragungsrate einer Leitung" }
      ];
      const drei = R.waehleN(faelle, 3);
      const werte = drei.map(x => x.teilt ? r(x.wert / x.faktor, 6) : r(x.wert * x.faktor, 0));

      /* Zusätzlich eine Größe, bei der die Einheit selbst gefragt ist */
      const mA = R.stufe(150, 900, 10);
      const volt = R.waehle([5, 5, 12]);
      const watt = r(mA / 1000 * volt, 2);

      return {
        situation:
`In einem Datenblatt stehen die folgenden Angaben:

` + drei.map((x, i) => "    " + (i + 1) + ". " + x.was.padEnd(38) + f.kurz(x.wert) + " " + x.von).join("\n") + `

Für die Dokumentation sollen sie in eine andere Einheit umgerechnet werden.`,
        prompt: "Rechnen Sie die drei Angaben um und bestimmen Sie anschließend die Leistung.",
        felder: drei.map((x, i) => (
          { typ: "zahl", label: (i + 1) + ". " + f.kurz(x.wert) + " " + x.von + " in " + x.nach,
            einheit: x.nach, be: 1, dez: x.teilt ? 3 : 0, loesung: werte[i], tolRel: 0.001 }
        )).concat([
          { typ: "zahl", label: "Ein USB-Gerät zieht " + f.kurz(mA) + " mA bei " + volt + " V — welche Leistung nimmt es auf?",
            einheit: "W", be: 2, dez: 2, loesung: watt, tolAbs: 0.02 },
          { typ: "text", be: 1, zeilen: 2, satzbau: true, minWorte: 6,
            label: "Woran erkennt man, ob bei Speichergrößen mit 1000 oder mit 1024 gerechnet wird?",
            erwartet: [
              ["am Vorsatz: Ki, Mi, Gi bedeuten 1024, k, M, G bedeuten 1000",
               "Kibibyte Mebibyte Gibibyte rechnen mit 1024", "das kleine i steht für 1024"]
            ] }
        ]),
        loesung:
drei.map((x, i) =>
`${i + 1}. ${f.kurz(x.wert)} ${x.von} → ${x.nach}
   ${x.teilt ? "nach oben, also GETEILT" : "nach unten, also MAL"}: ${f.kurz(x.wert)} ${x.teilt ? "÷" : "×"} ${f.kurz(x.faktor)} = ${f.kurz(werte[i])} ${x.nach}`).join("\n\n") +

`\n\nLeistung des USB-Geräts:
   Erst die Einheit richtigstellen: ${f.kurz(mA)} mA = ${f.kurz(r(mA / 1000, 3))} A
   P = U × I = ${volt} V × ${f.kurz(r(mA / 1000, 3))} A = ${f.kurz(watt)} W

Die Leiter:
   µ  ·1000→  m  ·1000→  Grundeinheit  ·1000→  k  ·1000→  M  ·1000→  G
   Nach RECHTS (größere Einheit) teilen, nach LINKS multiplizieren.

Speicher: 1 kB = 1000 Byte, aber 1 KiB = 1024 Byte. Windows zeigt „GB“ an und
meint oft GiB — daher wirkt eine 1-TB-Platte im Explorer kleiner.`
      };
    }
  });

  /* ============================================= 4. P = U · I ========== */
  G.vorlage({
    id: "eh-ohm", thema: "hardware", sub: "Leistung",
    titel: "Spannung, Strom und Leistung am Arbeitsplatz", stufe: 2,
    merksatz: "P = U × I. Umgestellt: I = P ÷ U und U = P ÷ I. Vor dem Einsetzen immer " +
      "auf Grundeinheiten bringen — Milliampere zuerst in Ampere, sonst ist das Ergebnis " +
      "um den Faktor 1000 daneben.",
    bau(R, c) {
      const volt = R.waehle([5, 12, 230]);
      const geraete = volt === 5
        ? [{ n: "USB-Festplatte", mA: R.stufe(400, 900, 10) },
           { n: "USB-Headset", mA: R.stufe(80, 200, 10) },
           { n: "Beleuchtete Tastatur", mA: R.stufe(100, 300, 10) }]
        : volt === 12
        ? [{ n: "Gehäuselüfter", mA: R.stufe(120, 400, 10) },
           { n: "LED-Streifen im Serverschrank", mA: R.stufe(300, 900, 10) },
           { n: "Festplatte (Anlaufstrom)", mA: R.stufe(600, 1800, 50) }]
        : [{ n: "Monitor", mA: R.stufe(90, 210, 10) },
           { n: "Arbeitsplatzrechner", mA: R.stufe(300, 700, 10) },
           { n: "Multifunktionsgerät (Druck)", mA: R.stufe(1800, 3200, 100) }];
      const g = R.waehle(geraete);
      const ampere = r(g.mA / 1000, 3);
      const watt = r(volt * ampere, 2);

      /* Sicherung: wie viele solcher Geräte passen an einen Stromkreis? */
      const sicherung = volt === 230 ? R.waehle([10, 16]) : 0;
      const maxGeraete = sicherung ? Math.floor(sicherung / ampere) : 0;

      const felder = [
        { typ: "zahl", label: "Stromaufnahme in Ampere", einheit: "A", be: 1, dez: 3, loesung: ampere },
        { typ: "zahl", label: "Leistungsaufnahme", einheit: "W", be: 2, dez: 2, loesung: watt, tolAbs: 0.05 }
      ];
      if (sicherung) {
        felder.push({ typ: "zahl", be: 2, dez: 0, loesung: maxGeraete, einheit: "Stück",
          label: "Wie viele dieser Geräte darf ein mit " + sicherung + " A abgesicherter Stromkreis rechnerisch tragen?" });
      }
      felder.push({ typ: "text", be: 2, zeilen: 2, satzbau: true, minWorte: 8,
        label: "Was passiert mit dem Ergebnis, wenn man die " + f.kurz(g.mA) + " mA direkt in P = U × I einsetzt?",
        erwartet: [
          ["das Ergebnis ist tausendmal zu groß", "Faktor 1000 zu hoch",
           "man muss erst in Ampere umrechnen", "mA sind Tausendstel Ampere"]
        ] });

      return {
        situation:
`Ein ${g.n} am ${volt}-V-Anschluss nimmt laut Typenschild ${f.kurz(g.mA)} mA auf.` +
(sicherung ? `\nDer Stromkreis in ${c.abteilung || "der Abteilung"} ist mit ${sicherung} A abgesichert.` : ""),
        prompt: "Berechnen Sie Stromaufnahme und Leistung." +
          (sicherung ? " Beurteilen Sie außerdem die Belastung des Stromkreises." : ""),
        felder: felder,
        loesung:
`Erst die Einheit:
  ${f.kurz(g.mA)} mA ÷ 1000 = ${f.kurz(ampere)} A

Leistung:
  P = U × I = ${volt} V × ${f.kurz(ampere)} A = ${f.kurz(watt)} W
` + (sicherung ?
`\nStromkreis:
  ${sicherung} A ÷ ${f.kurz(ampere)} A = ${f.kurz(r(sicherung / ampere, 2))} → rechnerisch ${maxGeraete} Geräte
  In der Praxis plant man Reserve ein: Anlaufströme liegen deutlich über dem
  Dauerstrom, und ein Stromkreis versorgt selten nur eine Geräteart.
` : "") +
`\nWer die ${f.kurz(g.mA)} direkt einsetzt, rechnet ${volt} × ${f.kurz(g.mA)} = ${f.kurz(r(volt * g.mA, 0))} W —
das wäre ein Heizlüfter, kein ${g.n}. Faktor 1000 daneben.

Die drei Formen derselben Formel:
  P = U × I        I = P ÷ U        U = P ÷ I`
      };
    }
  });

  /* ============================================ 5. Energie und Kosten == */
  G.vorlage({
    id: "eh-energie", thema: "kalkulation", sub: "Energiekosten",
    titel: "Verbrauch in kWh und Stromkosten", stufe: 2,
    merksatz: "Energie = Leistung × Zeit. In der Rechnung stehen Watt, gebraucht werden " +
      "Kilowatt: erst ÷ 1000, dann × Stunden — das ergibt kWh. Der Strompreis steht " +
      "in €/kWh, also Kosten = kWh × Preis.",
    bau(R, c) {
      const anzahl = R.stufe(8, 60, 2);
      const watt = R.waehle([45, 65, 85, 120, 160]);
      const stdTag = R.waehle([8, 9, 10]);
      const tage = R.waehle([220, 230, 250]);
      const preis = R.stufe(0.26, 0.42, 0.01);
      const stdJahr = stdTag * tage;

      const kwhEines = r(watt / 1000 * stdJahr, 1);
      const kwhAlle = r(kwhEines * anzahl, 1);
      const kosten = r(kwhAlle * preis, 2);

      /* Sparvariante: Standby-Abschaltung spart Stunden */
      const sparStd = R.waehle([300, 500, 700]);
      const ersparnis = r(watt / 1000 * sparStd * anzahl * preis, 2);

      return {
        situation:
`In ${c.abteilung || "der Verwaltung"} der ${c.firma} stehen ${f.kurz(anzahl)} Arbeitsplatzrechner.
Jeder nimmt im Mittel ${f.kurz(watt)} W auf und läuft ${stdTag} Stunden an ${f.kurz(tage)} Arbeitstagen im Jahr.
Der Strompreis beträgt ${f.kurz(preis)} €/kWh.`,
        prompt: "Berechnen Sie den Jahresverbrauch und die Stromkosten.",
        felder: [
          { typ: "zahl", label: "Betriebsstunden je Rechner und Jahr", einheit: "h", be: 1, dez: 0, loesung: stdJahr },
          { typ: "zahl", label: "Verbrauch eines Rechners im Jahr", einheit: "kWh", be: 2, dez: 1, loesung: kwhEines, tolRel: 0.01 },
          { typ: "zahl", label: "Verbrauch aller Rechner im Jahr", einheit: "kWh", be: 1, dez: 1, loesung: kwhAlle, tolRel: 0.01 },
          { typ: "zahl", label: "Stromkosten im Jahr", einheit: "€", be: 2, dez: 2, loesung: kosten, tolRel: 0.01 },
          { typ: "zahl", be: 2, dez: 2, einheit: "€", loesung: ersparnis, tolRel: 0.02,
            label: "Eine Abschaltautomatik spart je Rechner " + f.kurz(sparStd) + " Betriebsstunden im Jahr. Wie viel Geld spart das?" }
        ],
        loesung:
`Betriebsstunden:
  ${stdTag} h × ${f.kurz(tage)} Tage = ${f.kurz(stdJahr)} h

Verbrauch eines Rechners:
  ${f.kurz(watt)} W = ${f.kurz(r(watt / 1000, 3))} kW
  ${f.kurz(r(watt / 1000, 3))} kW × ${f.kurz(stdJahr)} h = ${f.kurz(kwhEines)} kWh

Alle Rechner:
  ${f.kurz(kwhEines)} kWh × ${f.kurz(anzahl)} = ${f.kurz(kwhAlle)} kWh

Kosten:
  ${f.kurz(kwhAlle)} kWh × ${f.kurz(preis)} €/kWh = ${f.eur(kosten)}

Ersparnis durch Abschaltautomatik:
  ${f.kurz(r(watt / 1000, 3))} kW × ${f.kurz(sparStd)} h × ${f.kurz(anzahl)} × ${f.kurz(preis)} €/kWh = ${f.eur(ersparnis)}

Die häufigste Falle ist das fehlende ÷ 1000: Watt × Stunden ergibt Wattstunden,
nicht Kilowattstunden. Der Strompreis gilt aber je kWh.`
      };
    }
  });

  /* ================================================== 6. USV auslegen == */
  G.vorlage({
    id: "eh-usv", thema: "hardware", sub: "USV",
    titel: "USV auslegen: Leistung und Überbrückungszeit", stufe: 3,
    merksatz: "Eine USV wird in VA (Scheinleistung) angegeben, die Geräte ziehen W " +
      "(Wirkleistung). W = VA × Leistungsfaktor (meist 0,6 bis 0,9). Die Laufzeit " +
      "ergibt sich aus der gespeicherten Energie in Wh geteilt durch die Last in W.",
    bau(R, c) {
      const geraete = [
        { n: "Server", w: R.waehle([220, 300, 380]) },
        { n: "Switch", w: R.waehle([35, 55, 75]) },
        { n: "NAS", w: R.waehle([45, 60, 90]) },
        { n: "Router und Firewall", w: R.waehle([25, 40]) }
      ];
      const last = geraete.reduce((s, g) => s + g.w, 0);
      const faktor = R.waehle([0.6, 0.7, 0.8, 0.9]);
      const noetigVA = r(last / faktor, 0);
      const groessen = [700, 1000, 1500, 2200, 3000];
      const gewaehlt = groessen.find(x => x >= noetigVA) || 3000;
      const wh = R.waehle([450, 700, 900, 1200]);
      const minuten = r(wh / last * 60, 1);
      const brauchtMin = R.waehle([5, 10, 15]);
      const reicht = minuten >= brauchtMin;

      return {
        situation:
`Der Serverschrank der ${c.firma} soll eine USV bekommen. Angeschlossen werden:

` + geraete.map(g => "    " + g.n.padEnd(26) + String(g.w).padStart(4) + " W").join("\n") + `

Der Leistungsfaktor der USV beträgt ${f.kurz(faktor)}, ihr Akku speichert ${f.kurz(wh)} Wh.
Erhältliche Baugrößen: ` + groessen.join(" VA · ") + ` VA
Das geordnete Herunterfahren der Systeme dauert ${brauchtMin} Minuten.`,
        prompt: "Legen Sie die USV aus und prüfen Sie, ob die Überbrückungszeit reicht.",
        felder: [
          { typ: "zahl", label: "Gesamte Wirkleistung der Geräte", einheit: "W", be: 1, dez: 0, loesung: last },
          { typ: "zahl", label: "Benötigte Scheinleistung", einheit: "VA", be: 2, dez: 0, loesung: noetigVA, tolAbs: 3 },
          { typ: "auswahl", label: "Welche Baugröße wählen Sie?", be: 1,
            optionen: groessen.map(x => x + " VA"), loesung: gewaehlt + " VA" },
          { typ: "zahl", label: "Überbrückungszeit bei voller Last", einheit: "min", be: 2, dez: 1, loesung: minuten, tolRel: 0.02 },
          { typ: "text", be: 2, zeilen: 3, satzbau: true, minWorte: 9,
            label: "Reicht die Zeit für das Herunterfahren? Begründen Sie mit Zahlen.",
            erwartet: [
              reicht ? ["ja, " + f.kurz(minuten) + " Minuten sind mehr als die benötigten " + brauchtMin + " Minuten",
                        "die Zeit reicht aus", "ausreichend Reserve"]
                     : ["nein, " + f.kurz(minuten) + " Minuten reichen für " + brauchtMin + " Minuten nicht",
                        "die Zeit reicht nicht", "zu wenig Überbrückungszeit"],
              ["ein größerer Akku oder weniger Last wäre nötig", "Akku erweitern",
               "nicht kritische Geräte abklemmen", "Reserve einplanen"]
            ] }
        ],
        loesung:
`Wirkleistung:
` + geraete.map(g => "  " + g.n.padEnd(26) + String(g.w).padStart(4) + " W").join("\n") +
`\n  ` + "".padEnd(26) + "─────\n  " + "Summe".padEnd(26) + String(last).padStart(4) + " W" +

`\n\nScheinleistung (das ist die Angabe auf der USV):
  ${last} W ÷ ${f.kurz(faktor)} = ${f.kurz(noetigVA)} VA
  → nächste erhältliche Größe: ${gewaehlt} VA

Überbrückungszeit:
  ${f.kurz(wh)} Wh ÷ ${last} W = ${f.kurz(r(wh / last, 3))} h
  ${f.kurz(r(wh / last, 3))} h × 60 = ${f.kurz(minuten)} Minuten

Bewertung:
  Benötigt werden ${brauchtMin} Minuten, verfügbar sind ${f.kurz(minuten)} Minuten →
  ${reicht ? "die Zeit reicht." : "die Zeit reicht NICHT — größerer Akku oder weniger Last."}

VA und W nicht verwechseln: eine 1000-VA-USV trägt bei Leistungsfaktor 0,6 nur
600 W. Wer VA mit W gleichsetzt, legt die USV zu klein aus.`
      };
    }
  });

  /* ======================================= 7. Rabatt, Skonto, Bezugspreis */
  G.vorlage({
    id: "eh-rabatt", thema: "kalkulation", sub: "Bezugskalkulation",
    titel: "Vom Listenpreis zum Bezugspreis — netto und brutto", stufe: 3,
    merksatz: "Die Reihenfolge ist fest: Listenpreis − Rabatt = Zieleinkaufspreis, " +
      "− Skonto = Bareinkaufspreis, + Bezugskosten = Bezugspreis. Rabatt und Skonto " +
      "werden nacheinander gerechnet, nie addiert. Alles netto — die Umsatzsteuer kommt " +
      "erst ganz zum Schluss dazu, wenn überhaupt.",
    bau(R, c) {
      const stueck = R.stufe(5, 40, 5);
      const liste = r(R.stufe(180, 1400, 10), 2);
      const rabatt = R.waehle([5, 8, 10, 12, 15]);
      const skonto = R.waehle([2, 2, 3]);
      const fracht = r(R.stufe(20, 180, 10), 2);
      const satz = 19;

      const listeGesamt = r(liste * stueck, 2);
      const ziel = r(listeGesamt * (1 - rabatt / 100), 2);
      const bar = r(ziel * (1 - skonto / 100), 2);
      const bezug = r(bar + fracht, 2);
      const jeStueck = r(bezug / stueck, 2);
      const brutto = r(bezug * (1 + satz / 100), 2);
      const falschZusammen = r(listeGesamt * (1 - (rabatt + skonto) / 100), 2);

      return {
        situation:
`Die ${c.firma} bestellt ${f.kurz(stueck)} ${c.geraetPl || "Geräte"} zum Listenpreis von ${f.eur(liste)} netto je Stück.
Der Lieferant gewährt ${rabatt} % Rabatt und bei Zahlung innerhalb von 10 Tagen ${skonto} % Skonto.
Für die Lieferung werden ${f.eur(fracht)} Bezugskosten berechnet.`,
        prompt: "Ermitteln Sie den Bezugspreis der Lieferung und den Bezugspreis je Stück.",
        felder: [
          { typ: "zahl", label: "Listenpreis der Lieferung", einheit: "€", be: 1, dez: 2, loesung: listeGesamt },
          { typ: "zahl", label: "Zieleinkaufspreis (nach Rabatt)", einheit: "€", be: 1, dez: 2, loesung: ziel, tolAbs: 0.02 },
          { typ: "zahl", label: "Bareinkaufspreis (nach Skonto)", einheit: "€", be: 2, dez: 2, loesung: bar, tolAbs: 0.02 },
          { typ: "zahl", label: "Bezugspreis der Lieferung", einheit: "€", be: 1, dez: 2, loesung: bezug, tolAbs: 0.02 },
          { typ: "zahl", label: "Bezugspreis je Stück", einheit: "€", be: 1, dez: 2, loesung: jeStueck, tolAbs: 0.02 },
          { typ: "zahl", label: "Bruttobetrag der Lieferung (" + satz + " % USt)", einheit: "€", be: 1, dez: 2, loesung: brutto, tolAbs: 0.05 },
          { typ: "text", be: 2, zeilen: 2, satzbau: true, minWorte: 8,
            label: "Warum darf man Rabatt und Skonto nicht zusammenzählen?",
            erwartet: [
              ["das Skonto wird vom bereits verminderten Zieleinkaufspreis gerechnet",
               "die Grundzahl ist nach dem Rabatt kleiner", "nacheinander rechnen",
               "unterschiedliche Grundwerte"]
            ] }
        ],
        loesung:
`Listenpreis:
  ${f.eur(liste)} × ${f.kurz(stueck)} = ${f.eur(listeGesamt)}

− Rabatt ${rabatt} %:
  ${f.eur(listeGesamt)} × ${f.kurz(1 - rabatt / 100)} = ${f.eur(ziel)}   (Zieleinkaufspreis)

− Skonto ${skonto} %:
  ${f.eur(ziel)} × ${f.kurz(1 - skonto / 100)} = ${f.eur(bar)}   (Bareinkaufspreis)

+ Bezugskosten:
  ${f.eur(bar)} + ${f.eur(fracht)} = ${f.eur(bezug)}   (Bezugspreis)

Je Stück:
  ${f.eur(bezug)} ÷ ${f.kurz(stueck)} = ${f.eur(jeStueck)}

Brutto (nur für die Zahlung, nicht für den Angebotsvergleich):
  ${f.eur(bezug)} × ${f.kurz(1 + satz / 100)} = ${f.eur(brutto)}

Zusammengezählt wäre falsch:
  ${rabatt} % + ${skonto} % = ${rabatt + skonto} % → ${f.eur(falschZusammen)}
  Abweichung ${f.eur(r(Math.abs(bar - falschZusammen), 2))}. Das Skonto wird vom bereits
  verminderten Zieleinkaufspreis gerechnet, also von einer kleineren Grundzahl.`
      };
    }
  });

})(window.GEN);
