/* ============================================================================
   gen/formeln.js — Formelblatt zum Ausdrucken (A4)
   ----------------------------------------------------------------------------
   Grundlage ist Lenas eigene Sammlung „AP1 Formeln und harte Fakten“
   (lysenkol.github.io/ap1/ap1-formeln-fakten.html), ergänzt um alles, was die
   63 Aufgabentypen des Generators sonst noch brauchen.
   In der Prüfung ist nur ein unprogrammierbarer Taschenrechner erlaubt —
   dieses Blatt ist zum Auswendiglernen, nicht zum Mitnehmen.
   ========================================================================== */
"use strict";

window.GENFORMELN = (function () {
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  /* f = Formel/Fakt · h = Hinweis, Falle, typischer Fehler */
  const BLOCK = [
    {
      titel: "Daten, Einheiten, Übertragung",
      zeilen: [
        { f: "Datenmengen binär: KiB → MiB → GiB → TiB je ÷ 1.024 · Raten, Strom, Leistung dezimal: ÷ 1.000", h: "Katalog S. 43: „Angaben zu Datenmengen sind nur mit Binärpräfixen richtig!“" },
        { f: "MB → Mbit: × 8   ·   Mbit → MB: ÷ 8", h: "Datenraten sind Bit, Speicher ist Byte." },
        { f: "Dauer = Datenmenge (Mbit) ÷ Datenrate (Mbit/s)", h: "72 MB × 8 = 576 Mbit ÷ 48 = 12 s" },
        { f: "1 GB = 10⁹ Byte · 1 GiB = 1.073.741.824 Byte", h: "Bei GiB nicht mit 8 multiplizieren, außer es geht um bit/s." },
        { f: "Sekunden → Minuten: ÷ 60, Rest bleibt Sekunden", h: "Nie in Stunden umrechnen: 7.776 s = 129 min 36 s." },
        { f: "Effektive Bandbreite = Leitung × Nutzanteil", h: "„70 % stehen zur Verfügung“ zuerst anwenden." }
      ]
    },
    {
      titel: "Speicher und Reichweite",
      zeilen: [
        { f: "Zuwachs/Jahr = Menge je Vorgang × Vorgänge je Jahr", h: "" },
        { f: "Frei = Gesamtkapazität − Füllstand", h: "Herstellerangabe 12 TB = 12 × 10¹² Byte ≈ 10,91 TiB" },
        { f: "Reichweite = Frei ÷ Zuwachs   → abrunden", h: "6,888 Jahre → 6, nicht 7." },
        { f: "Video: Mbit/s × 3600 ÷ 8 = MB je Stunde", h: "× Stunden × Tage × Kameras" },
        { f: "Reserve aufschlagen: Bedarf × (1 + Reserve %)", h: "Reserve kommt zum Schluss, nicht auf den Jahreswert." }
      ]
    },
    {
      titel: "Backup",
      zeilen: [
        { f: "Differenziell: Tag n = n × Änderungsmenge", h: "Restore: Vollsicherung + letzte differenzielle = 2 Sätze." },
        { f: "Inkrementell: jeden Tag = 1 × Änderungsmenge", h: "Restore: Vollsicherung + ALLE Inkremente." },
        { f: "3-2-1: 3 Kopien · 2 Medien · 1 Ort außer Haus", h: "Dauerhaft angesteckte USB-Platte zählt praktisch nicht als zweites Medium." },
        { f: "RAID 0: n × K · RAID 1: K · RAID 5: (n−1) × K · RAID 6: (n−2) × K · RAID 10: n/2 × K",
          h: "RAID ersetzt kein Backup — Löschen und Ransomware wirken sofort auf alle Platten." }
      ]
    },
    {
      titel: "IPv4-Subnetting",
      zeilen: [
        { f: "/24 = 255.255.255.0 → 254 · /25 = .128 → 126 · /26 = .192 → 62", h: "" },
        { f: "/27 = .224 → 30 · /28 = .240 → 14 · /29 = .248 → 6 · /30 = .252 → 2", h: "" },
        { f: "nutzbare Hosts = 2^Hostbits − 2", h: "Netzadresse und Broadcast gehen ab." },
        { f: "Netzadresse = IP UND Maske · Broadcast = Hostbits alle 1", h: "192.168.140.64/26 → .64 bis .127, nutzbar .65–.126" },
        { f: "Subnetze: 2ⁿ ≥ Anzahl → n Bits dazu", h: "Adressbedarf = Endgeräte + Gateway + Reserve, dann Präfix suchen." },
        { f: "169.254.x.x = APIPA (kein DHCP) · 127.0.0.1 = Loopback", h: "Privat: 10/8 · 172.16/12 · 192.168/16" }
      ]
    },
    {
      titel: "IPv6",
      zeilen: [
        { f: "1. Führende Nullen je Block weg   2. EINE Nullfolge durch :: ersetzen", h: "2001:0db8:00f3:0000:0000:0000:02a4:00b7 → 2001:db8:f3::2a4:b7" },
        { f: "Interface-ID = 128 − Präfixlänge", h: "Bei zwei Nullfolgen nur die längere kürzen." },
        { f: "fe80::/10 Link-Local · fc00::/7 ULA · 2000::/3 Global", h: "" }
      ]
    },
    {
      titel: "Strom, Netzteil, USV, PoE",
      zeilen: [
        { f: "P = U · I   ·   I = P ÷ U   ·   U = P ÷ I", h: "57 W ÷ 19 V = 3,0 A" },
        { f: "Netzteil prüfen über die DC-Ausgangswerte (19 V), nicht über 230 V", h: "Reicht, wenn benötigter Strom ≤ max. Ausgangsstrom." },
        { f: "USV: nutzbare Leistung = VA × Leistungsfaktor", h: "1.500 VA × 0,6 = 900 W" },
        { f: "Überbrückung (min) = Akku (Wh) ÷ Last (W) × 60", h: "Nicht Wirkleistung ÷ Last rechnen." },
        { f: "PoE: belegt = Σ(Anzahl × W je Port) · Reserve = Budget − belegt", h: "af 15,4 W · at 30 W · bt 60 W. Jeder Schritt ist ein eigener Rechenschritt." },
        { f: "Stromkosten = W ÷ 1000 × h × Tage × Preis je kWh", h: "Watt IMMER erst durch 1.000 teilen." }
      ]
    },
    {
      titel: "Kaufmännisches Rechnen",
      zeilen: [
        { f: "USt = Netto × 0,19 · Brutto = Netto × 1,19 · Netto = Brutto ÷ 1,19", h: "" },
        { f: "Skonto wird vom Bruttobetrag abgezogen: Brutto × (1 − Satz)", h: "3.451,00 × 0,98 = 3.381,98. Frist läuft ab Rechnungsdatum." },
        { f: "Listeneinkaufspreis − Rabatt = Zieleinkaufspreis", h: "" },
        { f: "− Skonto (vom Ziel-EK) = Bareinkaufspreis", h: "" },
        { f: "+ Bezugskosten = Bezugspreis (Einstandspreis)", h: "Bezugskosten durch die Stückzahl teilen, wenn sie einmalig sind." }
      ]
    },
    {
      titel: "Kosten und Wirtschaftlichkeit",
      zeilen: [
        { f: "Kosten je Monat = (Kaufpreis + laufende Kosten × Monate) ÷ Monate", h: "" },
        { f: "Anteil je Monat = Preis ÷ Nutzungsdauer in Monaten", h: "Rabatt auf die Monatsrate anwenden, Jahrespauschale ÷ 12." },
        { f: "Beschaffungen = Zeitraum ÷ Nutzungsdauer   → aufrunden", h: "60 ÷ 36 = 1,67 → 2× kaufen." },
        { f: "Amortisation (Monate) = Investition ÷ jährliche Einsparung × 12", h: "Oder: Mehrpreis ÷ monatliche Ersparnis. Immer aufrunden." },
        { f: "Break-even = Fixkosten ÷ (Preis je Stück − variable Kosten je Stück)", h: "Ergebnis ist die Menge, bei der beide Varianten gleich viel kosten." },
        { f: "Lineare AfA = Anschaffungskosten ÷ Nutzungsdauer", h: "Im Anschaffungsjahr zeitanteilig: × Monate ÷ 12." },
        { f: "Ausfallkosten = Tage × Personen × Stunden/Tag × Satz", h: "Bei „je Person und Tag“ müssen alle drei Faktoren auftauchen." },
        { f: "Pakete/Lizenzen = Bedarf ÷ Kapazität je Paket   → aufrunden", h: "Lizenzen hängen an Nutzern, Pakete nicht." }
      ]
    },
    {
      titel: "Vergleiche und Prozente",
      zeilen: [
        { f: "Absolute Abweichung = Ist − Soll", h: "" },
        { f: "Prozentuale Abweichung = Abweichung ÷ SOLL × 100", h: "Immer auf das Soll beziehen, nie auf das Ist." },
        { f: "Nutzwertanalyse: Teilnutzwert = Gewichtung × Punkte, Summe = Nutzwert", h: "Gewichtung in der Tabelle als %, im Rechenweg als Dezimalzahl." },
        { f: "Verfügbarkeit: Ausfallzeit = Zeitraum × (100 % − Verfügbarkeit)", h: "Jahr = 8.760 h = 525.600 min. 99,9 % → 525,6 min." }
      ]
    },
    {
      titel: "Netzplan und Termine",
      zeilen: [
        { f: "FAZ = größter FEZ der Vorgänger · FEZ = FAZ + Dauer", h: "Vorwärtsrechnung" },
        { f: "SEZ = kleinster SAZ der Nachfolger · SAZ = SEZ − Dauer", h: "Rückwärtsrechnung; letzter Vorgang: SEZ = Projektdauer" },
        { f: "GP = SAZ − FAZ · FP = FAZ(Nachfolger) − FEZ", h: "Kritischer Pfad = alle Vorgänge mit GP 0." },
        { f: "Projektdauer = größter FEZ", h: "Puffer eines Nebenpfads = Projektdauer − Pfadlänge." },
        { f: "Gantt: Start = FAZ + 1, Ende = FEZ (wenn Tag 1 der erste Projekttag ist)", h: "" },
        { f: "Wochentag = ((Tag − 1) MOD 7) + 1", h: "Formel vollständig abschreiben, das +1 nicht vergessen. 6 = Sa, 7 = So." }
      ]
    },
    {
      titel: "Datenbanken und Modelle",
      zeilen: [
        { f: "1:n → Fremdschlüssel auf die n-Seite", h: "Auf der 1-Seite müssten mehrere Werte in ein Feld — verstößt gegen die 1. Normalform." },
        { f: "n:m → Zwischentabelle mit beiden Fremdschlüsseln", h: "Beide zusammen bilden den Primärschlüssel." },
        { f: "Chen 1:n = UML 1 … 0..*   ·   Chen n:m = UML 0..* … 0..*", h: "UML kennt kein „n“: nur 1, 0..1, 0..*, *." },
        { f: "Referentielle Integrität: jeder Fremdschlüssel zeigt auf einen vorhandenen Datensatz", h: "Kein Verweis ins Leere; Löschen wird blockiert." },
        { f: "Klasse: Name / Attribute / Methoden · − privat + öffentlich # geschützt", h: "Methoden mit Klammern, Attribute mit Datentyp, geerbte nicht wiederholen." }
      ]
    },
    {
      titel: "Sicherheit und Kryptografie",
      zeilen: [
        { f: "Schutzziele: Vertraulichkeit · Integrität · Verfügbarkeit", h: "Je Objekt getrennt bewerten." },
        { f: "Schutzbedarf: normal = überschaubar · hoch = beträchtlich · sehr hoch = existenziell", h: "" },
        { f: "Prüfsumme → unverändert · Signatur → unverändert + Herkunft · Zertifikat → Schlüssel + Name", h: "" },
        { f: "Signieren: Hash bilden → mit privatem Schlüssel verschlüsseln", h: "Prüfen: eigener Hash + Entschlüsselung mit öffentlichem Schlüssel." },
        { f: "Asymmetrisch: öffentlicher Schlüssel verschlüsselt, privater entschlüsselt", h: "" },
        { f: "2FA: Wissen · Besitz · Sein — zwei aus verschiedenen Kategorien", h: "Passwort + PIN ist KEINE 2FA." },
        { f: "Passwortstärke = Zeichenvorrat ^ Länge", h: "Dauer = Kombinationen ÷ Versuche pro Sekunde." }
      ]
    },
    {
      titel: "WLAN und Anschlüsse",
      zeilen: [
        { f: "Wi-Fi 4 = 802.11n · 5 = ac · 6 = ax · 6E = ax + 6 GHz", h: "" },
        { f: "WPA2-Personal = PSK · WPA2-Enterprise = RADIUS je Benutzer · WPA3 = SAE", h: "WPA3 verhindert Offline-Angriffe auf aufgezeichnete Handshakes." },
        { f: "IPxy: x = Staub, y = Wasser · IP54 · IP65 · IP67", h: "MIL-STD-810 prüft Vibration, Staub, Sturz." },
        { f: "RJ45 8 Kontakte · DisplayPort 20-polig · HDMI 19-polig · VGA 15-polig", h: "IEC C14 = Kaltgerätebuchse." }
      ]
    },
    {
      titel: "Programmierung",
      zeilen: [
        { f: "vor 7:30 → < start · ab 7:30 → >= start · bis 17:00 → <= ende · nach 17:00 → > ende",
          h: "Beide Grenzfälle einzeln durchspielen — dort sitzen die Punkte." },
        { f: "Außerhalb eines Zeitraums: wert < start ODER wert > ende", h: "Mit UND wäre das Ergebnis immer 0." },
        { f: "Schreibtischtest: nach jedem Durchlauf ALLE Variablen notieren", h: "Erst am Schluss die Ausgabe ablesen." },
        { f: "Schleife ohne Änderung der Bedingung = Endlosschleife", h: "" }
      ]
    },
    {
      titel: "Antwortdisziplin — die billigsten Punkte",
      zeilen: [
        { f: "Zahl + Einheit + Bezug im Antwortsatz", h: "„Die laufenden Kosten betragen 616 € pro Monat für alle 10 Arbeitsplätze.“" },
        { f: "Bei „Nennen Sie zwei … und erläutern Sie“ → vier Teilantworten", h: "Verben in der Aufgabe zählen: jedes verlangt etwas." },
        { f: "Nach jedem Fachbegriff ein „weil / dadurch / damit“", h: "Ein Stichwort allein ist der halbe Punkt oder gar keiner." },
        { f: "Empfehlung immer aussprechen und mit einer Zahl belegen", h: "„Ich empfehle Angebot B, es ist um 412,50 € günstiger.“" },
        { f: "Rechenweg hinschreiben, auch wenn das Ergebnis stimmt", h: "Ohne Weg gibt es für ein richtiges Ergebnis nur Teilpunkte." },
        { f: "Runden: kaufmännisch auf 2 Stellen, außer die Aufgabe sagt etwas anderes", h: "Mengen und Pakete aufrunden, Reichweiten abrunden." }
      ]
    }
  ];

  /* ---------------------------------------------------------------- Bauen */
  function zeigen() {
    if (!window.GENDRUCK) return;
    /* Behälter des Druckmoduls mitbenutzen */
    window.GENDRUCK.zeige({ titel: "Formelblatt", erstellt: "" }, [], { loesung: false });
    const leiste = $("druckLeiste");
    leiste.innerHTML = "";
    const info = el("div", "dr-info");
    info.innerHTML = "<b>Formelblatt</b> — zum Auswendiglernen. In der Prüfung ist nur ein " +
      "unprogrammierbarer Taschenrechner erlaubt, dieses Blatt darfst du nicht mitnehmen.";
    leiste.appendChild(info);
    leiste.appendChild(el("span", "weit"));
    const dr = el("button", "btn primary", "Drucken / als PDF speichern");
    dr.onclick = () => window.print();
    leiste.appendChild(dr);
    const zu = el("button", "btn ghost", "zurück");
    zu.onclick = () => window.GENDRUCK.schliessen();
    leiste.appendChild(zu);

    const b = $("druckBogen");
    b.innerHTML = "";
    const s = el("section", "dr-formeln");
    const kopf = el("div", "dr-deckkopf");
    kopf.appendChild(el("div", "dr-klein", "IHK AP1 — Einrichten eines IT-gestützten Arbeitsplatzes"));
    kopf.appendChild(el("h1", null, "Formeln und harte Fakten"));
    kopf.appendChild(el("div", "dr-klein",
      "Alles, was in den Aufgaben dieses Simulators gebraucht wird. Fett = Formel, klein = die Falle dazu."));
    s.appendChild(kopf);

    const spalten = el("div", "fo-spalten");
    BLOCK.forEach(bl => {
      const box = el("div", "fo-block");
      box.appendChild(el("h3", null, bl.titel));
      bl.zeilen.forEach(z => {
        const zeile = el("div", "fo-zeile");
        zeile.appendChild(el("div", "fo-f", z.f));
        if (z.h) zeile.appendChild(el("div", "fo-h", z.h));
        box.appendChild(zeile);
      });
      spalten.appendChild(box);
    });
    s.appendChild(spalten);

    const fuss = el("div", "dr-klein");
    fuss.style.marginTop = "8pt";
    fuss.textContent = "Vor jedem Übungssatz einmal quer lesen — Rechenfehler wiederholen sich sonst " +
      "über die Folgeaufgaben. Quelle der Grundsammlung: eigene Notizen „AP1 Formeln und harte Fakten“.";
    s.appendChild(fuss);
    b.appendChild(s);
    window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------- Startbox */
  function knopfEinbauen() {
    const ziel = $("satzBox") || $("genStartBox");
    if (!ziel) return;
    if ($("btnFormelblatt")) return;
    const zeile = el("div", "gen-knopfzeile");
    zeile.style.marginTop = "14px";
    const k = el("button", "btn"); k.id = "btnFormelblatt";
    k.textContent = "Formelblatt (A4) ansehen und drucken";
    k.onclick = zeigen;
    zeile.appendChild(k);
    const hin = el("span");
    hin.style.cssText = "font-size:13px;color:var(--muted)";
    hin.textContent = BLOCK.reduce((s, b) => s + b.zeilen.length, 0) +
      " Formeln und Merksätze aus " + BLOCK.length + " Bereichen.";
    zeile.appendChild(hin);
    ziel.appendChild(zeile);
  }

  function einhaengen() {
    const alt = window.renderStart;
    window.renderStart = function () {
      alt.apply(null, arguments);
      try { knopfEinbauen(); } catch (e) { console.error("Formelblatt:", e); }
    };
    try { knopfEinbauen(); } catch (e) { console.error("Formelblatt:", e); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { zeigen, BLOCK };
})();
