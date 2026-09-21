/* ============================================================================
   gen/er-uebung.js — zusätzliche ER-Aufgaben zum Üben
   ----------------------------------------------------------------------------
   Die fünf ER-Aufgaben in er-daten.js stammen aus den zehn echten Prüfungen.
   Sie sind schnell durch, und danach kennt man sie auswendig — was beim
   Datenmodellieren wenig hilft, weil dort nicht das Ergebnis geübt wird,
   sondern die Entscheidung: Wohin gehört dieses Attribut? Ist das 1:n oder
   n:m? Braucht die Beziehung eigene Attribute?

   Hier liegen drei weitere Aufgaben, die genau diese drei Entscheidungen je
   einmal isoliert stellen:

     TheraPlan      zwei 1:n-Beziehungen auf dieselbe Entität
     Leihgeräte     eine n:m-Beziehung, deren Attribute an die Raute gehören
     Bestellwesen   eine Kette aus drei Entitäten, alle 1:n

   Sie sind KEINE IHK-Aufgaben und stehen deshalb mit Quelle dabei. Geprüft
   werden sie vom selben Prüfer wie die echten (gen/er.js): Entitäten,
   Primärschlüssel, Attributzuordnung, Kardinalitäten, Beziehungsattribute.

   Technisch hängen sie sich in denselben Übungsmodus wie die Rechenaufgaben:
   VIEW bekommt künstliche Teilaufgaben, die aussehen wie Prüfungsaufgaben,
   und der vorhandene Bogen macht den Rest. Dadurch gibt es keine zweite
   Stelle, an der Zeichnung, Prüfung und Musterlösung gepflegt werden müssen.
   ========================================================================== */
"use strict";

window.GENERUEBUNG = (function () {
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  /* ------------------------------------------------------------ Aufgaben */
  const UEBUNGEN = [
    {
      key: "er-ue:theraplan",
      label: "Ü1",
      titel: "TheraPlan — Terminverwaltung",
      quelle: "Übungsaufgabe (azubi.io), keine IHK-Prüfungsaufgabe",
      maxPoints: 8,
      prompt:
        "Eine Praxisgruppe setzt die Praxisverwaltungssoftware TheraPlan ein. Das Datenmodell " +
        "der Terminverwaltung soll dokumentiert werden. Die Entität TERMIN ist bereits " +
        "vorgegeben mit TerminID (Primärschlüssel), Datum, Uhrzeit, Dauer_Minuten und Raum.\n\n" +
        "In TheraPlan wird zu jedem Termin genau ein Patient und genau ein Behandler erfasst. " +
        "Ein Patient kann im Lauf der Behandlung beliebig viele Termine haben, ein Behandler " +
        "ebenfalls. Zu jedem Patienten werden Patientennummer, Name, Geburtsdatum und " +
        "Krankenkasse gespeichert, zu jedem Behandler Personalnummer, Name und Fachgebiet.\n\n" +
        "Ergänzen Sie das Datenmodell um die zwei Entitäten PATIENT und BEHANDLER. Ordnen Sie " +
        "beiden die genannten Attribute zu, kennzeichnen Sie je Entität den Primärschlüssel, " +
        "zeichnen und benennen Sie die zwei Beziehungen zur Entität TERMIN und geben Sie zu " +
        "beiden die Kardinalitäten an.",
      loesung:
        "Patient (Patientennummer = Primärschlüssel, Name, Geburtsdatum, Krankenkasse)\n" +
        "Behandler (Personalnummer = Primärschlüssel, Name, Fachgebiet)\n" +
        "Termin (TerminID = Primärschlüssel, Datum, Uhrzeit, Dauer_Minuten, Raum) — vorgegeben\n\n" +
        "Patient  1 —hat— n  Termin\n" +
        "Behandler 1 —hat— n  Termin\n\n" +
        "Lesart: Zu einem Termin gehört genau EIN Patient, zu einem Patienten gehören VIELE " +
        "Termine. Die 1 steht also beim Patienten, das n beim Termin. Für den Behandler gilt " +
        "dasselbe. Keine der beiden Beziehungen hat eigene Attribute — Datum und Uhrzeit " +
        "gehören zum Termin selbst, nicht zur Verbindung.",
      er: {
        titel: "TheraPlan — Terminverwaltung",
        entitaeten: [
          { name: "Termin", pk: "TerminID", attribute: ["Datum", "Uhrzeit", "Dauer_Minuten", "Raum"],
            gegeben: true, alias: ["TERMIN"] },
          { name: "Patient", pk: "Patientennummer", attribute: ["Name", "Geburtsdatum", "Krankenkasse"],
            alias: ["PATIENT", "Patienten"] },
          { name: "Behandler", pk: "Personalnummer", attribute: ["Name", "Fachgebiet"],
            alias: ["BEHANDLER", "Therapeut", "Behandlerin"] }
        ],
        beziehungen: [
          { von: "Patient", nach: "Termin", name: "hat", kard: "1:n",
            alias: ["nimmt wahr", "bekommt", "vereinbart"] },
          { von: "Behandler", nach: "Termin", name: "hat", kard: "1:n",
            alias: ["führt durch", "betreut", "übernimmt"] }
        ],
        punkte: [
          { was: "zwei Entitäten ergänzt", be: 2 },
          { was: "Primärschlüssel je Entität", be: 2 },
          { was: "übrige Attribute richtig zugeordnet", be: 2 },
          { was: "zwei Beziehungen mit Kardinalität", be: 2 }
        ],
        hinweis: "Beide Beziehungen sind 1:n in dieselbe Richtung: die 1 steht bei Patient " +
                 "bzw. Behandler, das n beim Termin. Wer hier n:m einträgt, hat die Lesart " +
                 "verdreht — „ein Patient hat viele Termine“ heißt nicht, dass ein Termin " +
                 "viele Patienten hat. Die Beziehungen brauchen keine eigenen Attribute."
      }
    },

    {
      key: "er-ue:leihgeraete",
      label: "Ü2",
      titel: "Leihgeräte — wohin mit dem Ausleihdatum?",
      quelle: "Übungsaufgabe, keine IHK-Prüfungsaufgabe",
      maxPoints: 8,
      prompt:
        "Ein IT-Dienstleister verleiht Geräte an Mitarbeitende: Notebooks, Beamer, Messgeräte. " +
        "Ein Mitarbeiter kann im Lauf der Zeit viele Geräte ausleihen, und ein Gerät wird " +
        "nacheinander an viele Mitarbeitende verliehen.\n\n" +
        "Zu jedem Gerät werden Inventarnummer, Bezeichnung und Anschaffungsjahr gespeichert, " +
        "zu jedem Mitarbeitenden Personalnummer, Name und Abteilung. Für jede einzelne " +
        "Ausleihe werden außerdem das Ausleihdatum und das geplante Rückgabedatum erfasst.\n\n" +
        "Zeichnen Sie das Datenmodell in CHEN-Notation. Kennzeichnen Sie die Primärschlüssel, " +
        "benennen Sie die Beziehung und geben Sie die Kardinalität an. Ordnen Sie alle " +
        "Attribute redundanzfrei zu.",
      loesung:
        "Geraet (Inventarnummer = Primärschlüssel, Bezeichnung, Anschaffungsjahr)\n" +
        "Mitarbeiter (Personalnummer = Primärschlüssel, Name, Abteilung)\n\n" +
        "Mitarbeiter  n —leiht aus— m  Geraet\n" +
        "An der Beziehung: Ausleihdatum, Rueckgabedatum\n\n" +
        "Warum n:m: Ein Mitarbeiter leiht viele Geräte, ein Gerät wird an viele " +
        "Mitarbeitende verliehen — beide Seiten „viele“.\n" +
        "Warum die Daten an die Raute: Ausleihdatum und Rückgabedatum gehören weder zum " +
        "Gerät (es hat viele Ausleihen) noch zum Mitarbeiter (er hat viele Ausleihen), " +
        "sondern zur einzelnen Ausleihe. Stünden sie beim Gerät, ließe sich nur die " +
        "letzte Ausleihe speichern.\n\n" +
        "Auch richtig: die n:m-Beziehung als eigene Entität AUSLEIHE auflösen, mit " +
        "Ausleihdatum und Rückgabedatum als Attributen und je einer 1:n-Beziehung zu " +
        "Geraet und Mitarbeiter.",
      er: {
        titel: "Leihgeräte",
        entitaeten: [
          { name: "Geraet", pk: "Inventarnummer", attribute: ["Bezeichnung", "Anschaffungsjahr"],
            alias: ["Gerät", "GERAET", "Geräte"] },
          { name: "Mitarbeiter", pk: "Personalnummer", attribute: ["Name", "Abteilung"],
            alias: ["MITARBEITER", "Mitarbeitende", "Mitarbeiterin"] }
        ],
        beziehungen: [
          { von: "Mitarbeiter", nach: "Geraet", name: "leiht aus", kard: "n:m",
            attribute: ["Ausleihdatum", "Rueckgabedatum"],
            alias: ["ausleihen", "Ausleihe", "entleiht"] }
        ],
        punkte: [
          { was: "zwei Entitäten mit Primärschlüssel", be: 2 },
          { was: "Kardinalität n:m", be: 2 },
          { was: "Attribute an der Beziehung", be: 2 },
          { was: "übrige Attribute richtig zugeordnet", be: 2 }
        ],
        hinweis: "Die Frage, an der es hängt: Wo steht das Ausleihdatum? Nicht beim Gerät " +
                 "und nicht beim Mitarbeiter — sonst passt nur eine einzige Ausleihe hinein. " +
                 "Es gehört an die Beziehung. Das ist das sichere Zeichen für n:m: sobald " +
                 "ein Attribut erst durch die Verbindung entsteht, ist es keine 1:n."
      }
    },

    {
      key: "er-ue:bestellung",
      label: "Ü3",
      titel: "Bestellwesen — Kette aus drei Entitäten",
      quelle: "Übungsaufgabe, keine IHK-Prüfungsaufgabe",
      maxPoints: 9,
      prompt:
        "Ein Handwerksbetrieb bestellt Material bei Lieferanten. Jede Bestellung geht an genau " +
        "einen Lieferanten; ein Lieferant erhält im Lauf des Jahres viele Bestellungen. Zu " +
        "jeder Bestellung gehören mehrere Bestellpositionen, jede Position gehört zu genau " +
        "einer Bestellung.\n\n" +
        "Gespeichert werden: zum Lieferanten Lieferantennummer, Firmenname und Ort; zur " +
        "Bestellung Bestellnummer und Bestelldatum; zur Bestellposition Positionsnummer, " +
        "Artikelbezeichnung, Menge und Einzelpreis.\n\n" +
        "Zeichnen Sie das Datenmodell in CHEN-Notation mit Primärschlüsseln, benannten " +
        "Beziehungen und Kardinalitäten.",
      loesung:
        "Lieferant (Lieferantennummer = Primärschlüssel, Firmenname, Ort)\n" +
        "Bestellung (Bestellnummer = Primärschlüssel, Bestelldatum)\n" +
        "Bestellposition (Positionsnummer = Primärschlüssel, Artikelbezeichnung, Menge, Einzelpreis)\n\n" +
        "Lieferant   1 —erhält—  n  Bestellung\n" +
        "Bestellung  1 —enthält— n  Bestellposition\n\n" +
        "Beide Beziehungen sind 1:n, und beide zeigen in dieselbe Richtung: vom „einen“ " +
        "zum „vielen“. Das Bestelldatum steht genau einmal bei der Bestellung und nicht " +
        "bei jeder Position — sonst wäre es redundant und könnte auseinanderlaufen.\n\n" +
        "Der Gesamtpreis einer Position wird NICHT gespeichert: er lässt sich aus Menge " +
        "mal Einzelpreis berechnen. Gespeicherte Rechenergebnisse sind Redundanz.",
      er: {
        titel: "Bestellwesen",
        entitaeten: [
          { name: "Lieferant", pk: "Lieferantennummer", attribute: ["Firmenname", "Ort"],
            alias: ["LIEFERANT", "Lieferanten"] },
          { name: "Bestellung", pk: "Bestellnummer", attribute: ["Bestelldatum"],
            alias: ["BESTELLUNG", "Bestellungen"] },
          { name: "Bestellposition", pk: "Positionsnummer",
            attribute: ["Artikelbezeichnung", "Menge", "Einzelpreis"],
            alias: ["Position", "Bestellpositionen", "Positionen"] }
        ],
        beziehungen: [
          { von: "Lieferant", nach: "Bestellung", name: "erhält", kard: "1:n",
            alias: ["bekommt", "beliefert", "liefert"] },
          { von: "Bestellung", nach: "Bestellposition", name: "enthält", kard: "1:n",
            alias: ["besteht aus", "hat"] }
        ],
        /* Beziehungen und Kardinalitäten getrennt bepunkten: wer den
           Lieferanten an die Position hängt statt an die Bestellung, hat
           die Kette falsch — das muss mehr kosten als eine vergessene
           Kardinalität.                                                  */
        punkte: [
          { was: "drei Entitäten", be: 2 },
          { was: "Primärschlüssel je Entität", be: 2 },
          { was: "zwei Beziehungen gezeichnet und benannt", be: 2 },
          { was: "zwei Kardinalitäten", be: 1 },
          { was: "Attribute redundanzfrei zugeordnet", be: 2 }
        ],
        hinweis: "Eine Kette, keine Sternform: Der Lieferant hängt an der Bestellung, nicht " +
                 "an der Position. Und das Bestelldatum steht nur bei der Bestellung — " +
                 "dasselbe Datum an jeder Position wäre Redundanz und die klassische " +
                 "Falle in dieser Aufgabe."
      }
    }
  ];

  /* Die Lösungen beim vorhandenen Prüfer anmelden — er findet sie über den
     Schlüssel der Karte und braucht sonst nichts.                        */
  function anmelden() {
    if (!window.ER_LOESUNGEN) window.ER_LOESUNGEN = {};
    UEBUNGEN.forEach(u => { window.ER_LOESUNGEN[u.key] = u.er; });
  }
  anmelden();

  /* Künstliche Teilaufgabe im Format der echten — damit der vorhandene Bogen
     sie zeichnen kann, ohne eine Zeile Sonderbehandlung.                 */
  function alsItem(u) {
    return {
      k: u.key,
      id: u.key,
      label: u.label,
      fullLabel: u.label,
      prompt: u.prompt,
      maxPoints: u.maxPoints,
      topics: ["daten"],
      felder: null,
      solution: { text: u.loesung },
      task: { id: "er-ue", label: "ER-Übung", intro: u.quelle },
      exam: { examId: "er-ue", meta: { season: "Übung", year: "", title: u.titel } }
    };
  }

  function starte(liste, titel) {
    if (typeof VIEW === "undefined") return;
    anmelden();
    VIEW = { modus: "uebung", exam: null, items: liste.map(alsItem),
             titel: "ER-Modell · " + titel };
    if (typeof SHOW_SOL !== "undefined") SHOW_SOL = false;
    if (typeof zeigeBogen === "function") zeigeBogen();
    if (typeof schirm === "function") schirm("scBogen");
  }

  /* --------------------------------------------------------- Startblock */
  function stand(u) {
    if (typeof SCORES === "undefined") return null;
    return SCORES[u.key] == null ? null : SCORES[u.key];
  }

  function block() {
    const det = el("details", "st-block");
    det.id = "erUebungBlock";
    const sum = el("summary");
    const fertig = UEBUNGEN.filter(u => stand(u) != null).length;
    sum.append(el("span", null, "ER-Modelle — drei Übungsaufgaben"),
      el("span", "st-zahl", fertig + " von " + UEBUNGEN.length + " bewertet"));
    det.appendChild(sum);

    const innen = el("div", "erue-innen");
    innen.appendChild(el("p", "erue-satz",
      "Die fünf ER-Aufgaben der echten Prüfungen stehen in den Prüfungsbögen. Diese drei " +
      "hier sind zusätzlich und stellen je eine Entscheidung isoliert: zwei 1:n auf dieselbe " +
      "Entität, eine n:m mit Attributen an der Beziehung, und eine Kette aus drei Entitäten. " +
      "Geprüft wird mit demselben Prüfer — Entitäten, Schlüssel, Attribute, Kardinalitäten."));

    const liste = el("div", "erue-liste");
    UEBUNGEN.forEach(u => {
      const k = el("button", "erue-karte");
      k.type = "button";
      const txt = el("div", "erue-txt");
      txt.appendChild(el("div", "erue-titel", u.titel));
      const p = stand(u);
      txt.appendChild(el("div", "erue-meta",
        u.maxPoints + " BE · " + u.quelle +
        (p == null ? "" : " · zuletzt " + p + " von " + u.maxPoints + " BE")));
      k.appendChild(txt);
      k.appendChild(el("span", "erue-los", p == null ? "lösen" : "noch einmal"));
      if (p != null) k.classList.add("fertig");
      k.onclick = () => starte([u], u.titel);
      liste.appendChild(k);
    });
    innen.appendChild(liste);

    const alle = el("button", "btn ghost", "alle drei nacheinander");
    alle.type = "button";
    alle.onclick = () => starte(UEBUNGEN, "alle drei Übungen");
    innen.appendChild(alle);

    /* ------------------------------------------------------------------
       Gewürfelte Aufgaben. Drei feste Übungen sind nach zwei Abenden
       auswendig gelernt; hier kommt bei jedem Klick ein anderer Betrieb
       mit anderem Ausschnitt. Die Wahl daneben bestimmt, worauf es in der
       Aufgabe ankommen soll.
       ------------------------------------------------------------------ */
    if (window.GENERGEN) {
      innen.appendChild(el("div", "erue-trenner"));
      innen.appendChild(el("p", "erue-satz",
        "Oder eine neue Aufgabe würfeln: ein anderer Betrieb, ein anderer Ausschnitt " +
        "aus seinem Datenmodell. Dieselbe Saat ergibt wieder dieselbe Aufgabe — " +
        "zum Wiederholen und zum Ausdrucken."));

      const wunsch = { entitaeten: 3, beziehungen: 3, nm: true, vorgabe: true };
      const stell = el("div", "erue-stell");

      const gruppe = (titel, felder) => {
        const g = el("div", "erue-gruppe");
        g.appendChild(el("span", "erue-lbl", titel));
        felder.forEach(f => g.appendChild(f));
        stell.appendChild(g);
      };
      const schalter = (txt, an, tun) => {
        const k = el("button", "erue-sch" + (an() ? " an" : ""), txt);
        k.type = "button";
        k.onclick = () => { tun(); [...stell.querySelectorAll(".erue-sch")].forEach(x => x.__auf && x.__auf()); };
        k.__auf = () => k.classList.toggle("an", an());
        return k;
      };

      gruppe("Entitäten:", [
        schalter("3", () => wunsch.entitaeten === 3, () => { wunsch.entitaeten = 3; }),
        schalter("4", () => wunsch.entitaeten === 4, () => { wunsch.entitaeten = 4; })
      ]);
      gruppe("Beziehungen:", [
        schalter("nur 1:n", () => !wunsch.nm, () => { wunsch.nm = false; }),
        schalter("mit n:m", () => wunsch.nm, () => { wunsch.nm = true; })
      ]);
      gruppe("Vorgabe:", [
        schalter("eine Entität steht schon da", () => wunsch.vorgabe,
          () => { wunsch.vorgabe = !wunsch.vorgabe; })
      ]);
      innen.appendChild(stell);

      const reihe = el("div", "erue-knopfe");
      const wuerfeln = el("button", "btn primary", "Aufgabe würfeln");
      wuerfeln.type = "button";
      wuerfeln.onclick = () => {
        const a = window.GENERGEN.neu(Object.assign({}, wunsch));
        if (!a) { if (window.toast) window.toast("Für diese Auswahl gibt es keinen Ausschnitt."); return; }
        window.GENERGEN.starten(a);
      };
      reihe.appendChild(wuerfeln);

      const frueher = window.GENERGEN.liste();
      if (frueher.length) {
        const wieder = el("button", "btn ghost", "letzte noch einmal");
        wieder.type = "button";
        wieder.title = "Saat " + frueher[0].saat;
        wieder.onclick = () => {
          const a = window.GENERGEN.ausSaat(frueher[0].saat, frueher[0].wunsch);
          if (a) window.GENERGEN.starten(a);
        };
        reihe.appendChild(wieder);
      }
      innen.appendChild(reihe);
    }

    det.appendChild(innen);
    return det;
  }

  function einbauen() {
    const s = $("scStart");
    if (!s || $("erUebungBlock")) return;
    const b = block();
    /* Direkt hinter den Diagramm-Trainer, sonst ans Ende der Startseite. */
    const nach = $("rechnenBlock") ||
                 [...s.querySelectorAll("details.st-block")].slice(-1)[0];
    if (nach && nach.parentNode) nach.parentNode.insertBefore(b, nach.nextSibling);
    else s.appendChild(b);
  }

  function einhaengen() {
    const alt = window.renderStart;
    if (typeof alt === "function" && !alt.__erue) {
      const neu = function () {
        const r = alt.apply(this, arguments);
        try { setTimeout(einbauen, 70); } catch (e) { }
        return r;
      };
      neu.__erue = true; window.renderStart = neu;
    }
    /* Die Startseite steht schon, bevor die Module sie umhängen. */
    setTimeout(() => { try { einbauen(); } catch (e) { console.error("ER-Übung:", e); } }, 80);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { UEBUNGEN, starte, block, einbauen, anmelden };
})();
