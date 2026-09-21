/* ============================================================================
   gen/er-gen.js — ER-Aufgaben würfeln
   ----------------------------------------------------------------------------
   Fünf echte Prüfungsaufgaben und drei feste Übungen sind nach zwei Abenden
   auswendig gelernt — und auswendig gelernte Datenmodelle üben nichts. Was
   geübt werden muss, sind drei Entscheidungen, und die kann man beliebig oft
   neu stellen:

     1. Wohin gehört dieses Attribut?
     2. Ist das 1:n oder n:m?
     3. Hat die Beziehung eigene Attribute?

   Der Generator schneidet dafür einen zusammenhängenden Ausschnitt aus dem
   Datenmodell eines Betriebs heraus: drei oder vier Entitäten, zwei oder
   drei Beziehungen, darunter — wenn gewünscht — mindestens eine n:m mit
   Attributen an der Raute. Der Aufgabentext entsteht aus fertigen Sätzen
   (gen/er-gen-daten.js), nicht aus Satzbausteinen; deshalb liest er sich wie
   eine Prüfungsaufgabe und nicht wie eine Serienbrief-Vorlage.

   Jede Aufgabe hängt an einer Saat. Dieselbe Saat ergibt dieselbe Aufgabe —
   so lässt sie sich wieder öffnen, drucken und vergleichen.

   Bewertet wird mit dem vorhandenen Prüfer aus gen/er.js: die Lösung wird
   in genau demselben Format erzeugt wie die der echten Prüfungen.
   ========================================================================== */
"use strict";

window.GENERGEN = (function () {
  const putz = s => String(s == null ? "" : s).trim();

  /* Kleiner, verlässlicher Zufall an einer Saat — derselbe Ansatz wie im
     Aufgabengenerator: gleiche Saat, gleiche Aufgabe.                    */
  function rng(saat) {
    let a = (saat >>> 0) || 1;
    return function () {
      a += 0x6D2B79F5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const wahl = (r, liste) => liste[Math.floor(r() * liste.length) % liste.length];
  function mische(r, liste) {
    const a = liste.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const BETRIEBE = () => window.ER_GEN_DATEN || [];

  /* ------------------------------------------------------------ Schneiden */
  /* Einen zusammenhängenden Ausschnitt wählen: mit einer Beziehung anfangen
     und so lange Nachbarbeziehungen dazunehmen, bis genug Entitäten
     zusammen sind. „Zusammenhängend" ist dabei die einzige harte Bedingung —
     ein Modell, das in zwei Teile zerfällt, ist keine sinnvolle Aufgabe.  */
  function schnitt(r, betrieb, wunsch) {
    const alle = betrieb.rel;
    /* Wenn n:m gewünscht ist, zuerst eine n:m MIT Attributen an der Raute —
       das ist die Entscheidung, um die es in diesen Aufgaben geht. Erst
       wenn es keine gibt, tut es auch eine ohne.                        */
    const nm = alle.filter(x => x.kard === "n:m");
    const nmMitAttr = mische(r, nm.filter(x => (x.attribute || []).length));
    const nmZuerst = wunsch.nm
      ? (nmMitAttr.length ? nmMitAttr : mische(r, nm))
      : mische(r, alle.filter(x => x.kard !== "n:m")).concat(mische(r, nm));
    const start = nmZuerst.length ? nmZuerst[0] : wahl(r, alle);
    if (!start) return null;

    const rel = [start];
    const ent = new Set([start.von, start.nach]);
    /* „Nur 1:n" heißt auch beim Weiterwachsen nur 1:n — sonst rutschte über
       die Nachbarbeziehung doch wieder eine n:m hinein, und die Auswahl
       hielt nur in der Hälfte der Fälle, was sie versprach.            */
    const erlaubt = x => wunsch.nm || x.kard !== "n:m";
    const rest = mische(r, alle.filter(x => x !== start && erlaubt(x)));
    const notnagel = mische(r, alle.filter(x => x !== start && !erlaubt(x)));

    const wachsen = quelle => {
      while (ent.size < wunsch.entitaeten && rel.length < wunsch.beziehungen) {
        const naechste = quelle.find(x => !rel.includes(x) && (ent.has(x.von) || ent.has(x.nach)));
        if (!naechste) return;
        rel.push(naechste);
        ent.add(naechste.von); ent.add(naechste.nach);
      }
    };
    wachsen(rest);
    /* Reicht es mit der Einschränkung nicht für drei Entitäten, wird dieser
       Betrieb verworfen und der nächste versucht — nicht heimlich doch eine
       n:m eingebaut. In zwei der sechs Betriebe hängen die 1:n-Beziehungen
       nämlich in zwei getrennten Paaren, dort gibt es keinen reinen
       1:n-Ausschnitt mit drei Entitäten.                                */
    if (ent.size < 3 && wunsch.nm) wachsen(notnagel);

    /* Noch eine Beziehung dazu, wenn sie keine neue Entität mitbringt —
       das ergibt die Sternform statt der reinen Kette.                  */
    if (rel.length < wunsch.beziehungen) {
      const quer = rest.find(x => !rel.includes(x) && ent.has(x.von) && ent.has(x.nach));
      if (quer) rel.push(quer);
    }
    if (ent.size < 3) return null;
    return { ent: [...ent], rel: rel };
  }

  /* -------------------------------------------------------------- Bauen -- */
  /**
   * @param saat   Zahl; gleiche Saat ⇒ gleiche Aufgabe
   * @param wunsch { entitaeten:3|4, nm:true|false, vorgabe:true|false }
   */
  function baue(saat, wunsch) {
    const r = rng(saat);
    wunsch = Object.assign({ entitaeten: 3, beziehungen: 3, nm: true, vorgabe: true }, wunsch || {});
    const betriebe = mische(r, BETRIEBE());
    let b = null, s = null;
    for (const kandidat of betriebe) {
      s = schnitt(r, kandidat, wunsch);
      if (s) { b = kandidat; break; }
    }
    if (!b) return null;

    const E = k => b.ent[k];

    /* Eine Entität ist vorgegeben — wie in der Prüfung, wo TERMIN oder
       MEDIKAMENT schon im Editor steht. Genommen wird die, an der die
       meisten Beziehungen hängen: dann bleibt für die Lösung am meisten
       zu tun.                                                          */
    let gegeben = null;
    if (wunsch.vorgabe) {
      const grad = {};
      s.ent.forEach(k => { grad[k] = s.rel.filter(x => x.von === k || x.nach === k).length; });
      gegeben = s.ent.slice().sort((x, y) => grad[y] - grad[x])[0];
    }

    /* ---------------------------------------------------------- Lösung -- */
    const entitaeten = s.ent.map(k => {
      const e = E(k);
      return {
        name: e.nen.replace(/\s/g, ""),
        pk: e.pk,
        attribute: e.attribute.slice(),
        gegeben: k === gegeben,
        alias: [e.nen, e.pl, e.nen.toUpperCase()]
      };
    });
    const beziehungen = s.rel.map(x => ({
      von: E(x.von).nen.replace(/\s/g, ""),
      nach: E(x.nach).nen.replace(/\s/g, ""),
      name: x.name,
      kard: x.kard,
      attribute: (x.attribute || []).slice()
    }));

    const zuBauen = entitaeten.filter(e => !e.gegeben).length;
    const mitAttr = beziehungen.filter(x => x.attribute.length).length;
    const punkte = [];
    punkte.push({ was: zuBauen + " Entitäten ergänzt", be: Math.max(1, zuBauen) });
    punkte.push({ was: "Primärschlüssel je Entität", be: 2 });
    punkte.push({ was: beziehungen.length + " Beziehungen gezeichnet und benannt", be: 2 });
    punkte.push({ was: beziehungen.length + " Kardinalitäten", be: 2 });
    punkte.push({ was: "Attribute richtig zugeordnet", be: 2 });
    if (mitAttr) punkte.push({ was: "Attribute an der Beziehung", be: 1 });
    const maxBe = punkte.reduce((a, p) => a + p.be, 0);

    /* ----------------------------------------------------- Aufgabentext -- */
    const t = [];
    t.push(b.einstieg);
    if (gegeben) {
      const g = E(gegeben);
      t.push("Die Entität " + g.nen.toUpperCase() + " ist bereits vorgegeben, sie steht " +
             "schon im Editor. Sie muss nicht noch einmal angelegt werden.");
    }
    t.push("");
    s.rel.forEach(x => {
      t.push(x.satz);
      if (x.attribute && x.attribute.length && x.satzAttr) t.push(x.satzAttr);
    });
    t.push("");
    s.ent.forEach(k => {
      const e = E(k);
      const liste = [e.pk].concat(e.attribute);
      t.push("Zu " + e.dat + " werden " + aufzaehlung(liste) + " gespeichert.");
    });
    t.push("");
    t.push("Ergänzen Sie das Datenmodell in der CHEN-Notation:");
    t.push("· Legen Sie die fehlenden Entitäten an und ordnen Sie ihnen die genannten " +
           "Attribute zu.");
    t.push("· Kennzeichnen Sie je Entität den Primärschlüssel.");
    t.push("· Zeichnen und benennen Sie die Beziehungen und geben Sie die Kardinalitäten an.");
    if (mitAttr) t.push("· Achten Sie darauf, wo die Attribute der Beziehung hingehören.");

    /* ------------------------------------------------- Musterlösungstext */
    const l = [];
    entitaeten.forEach(e => {
      l.push(e.name + " (" + e.pk + " = Primärschlüssel" +
             (e.attribute.length ? ", " + e.attribute.join(", ") : "") + ")" +
             (e.gegeben ? "   — vorgegeben" : ""));
    });
    l.push("");
    beziehungen.forEach(x => {
      const k = x.kard.split(":");
      l.push(x.von + "  " + k[0] + " —" + x.name + "— " + k[1] + "  " + x.nach +
             (x.attribute.length ? "\n      an der Beziehung: " + x.attribute.join(", ") : ""));
    });
    if (mitAttr) {
      l.push("");
      l.push("Die Attribute an der n:m-Beziehung gehören dorthin, weil sie erst durch die " +
             "Verbindung entstehen: an einer der beiden Entitäten ließe sich nur ein " +
             "einziger Wert speichern. Die Auflösung der n:m-Beziehung in eine eigene " +
             "Entität ist ebenfalls richtig.");
    }

    const titel = b.titel + " — " + entitaeten.map(e => e.name).join(", ");
    return {
      key: "er-gen:" + saat,
      saat: saat,
      titel: titel,
      betrieb: b.titel,
      maxPoints: maxBe,
      prompt: t.join("\n"),
      loesung: l.join("\n"),
      quelle: "gewürfelte Übungsaufgabe · Saat " + saat,
      er: {
        titel: titel,
        entitaeten: entitaeten,
        beziehungen: beziehungen,
        punkte: punkte,
        hinweis: mitAttr
          ? "Mindestens eine Beziehung ist n:m und hat eigene Attribute. Sie gehören an " +
            "die Raute — genau daran entscheidet sich diese Aufgabe."
          : (beziehungen.some(x => x.kard === "n:m")
            ? "Eine Beziehung ist n:m, hat aber keine eigenen Attribute. Achte bei den " +
              "übrigen auf die Richtung: die 1 steht bei der Seite, von der es nur eine gibt."
            : "Alle Beziehungen sind 1:n. Achte auf die Richtung: die 1 steht bei der Seite, " +
              "von der es nur eine gibt.")
      }
    };
  }

  function aufzaehlung(liste) {
    if (liste.length <= 1) return liste[0] || "";
    return liste.slice(0, -1).join(", ") + " und " + liste[liste.length - 1];
  }

  /* --------------------------------------------------------- Verwaltung -- */
  const SK = "ihk2:er:gen";
  const lies = () => { try { return JSON.parse(localStorage.getItem(SK)) || []; } catch (e) { return []; } };
  const schreib = a => { try { localStorage.setItem(SK, JSON.stringify(a.slice(0, 20))); } catch (e) { } };

  /** Aufgabe erzeugen, merken und ihre Lösung beim Prüfer anmelden. */
  function neu(wunsch) {
    const saat = (Math.random() * 2147483647) >>> 0;
    const a = baue(saat, wunsch);
    if (!a) return null;
    anmelden(a);
    const liste = lies().filter(x => x.saat !== saat);
    liste.unshift({ saat: saat, titel: a.titel, wunsch: wunsch || {}, zeit: Date.now() });
    schreib(liste);
    return a;
  }

  function ausSaat(saat, wunsch) {
    const a = baue(saat, wunsch);
    if (a) anmelden(a);
    return a;
  }

  function anmelden(a) {
    if (!window.ER_LOESUNGEN) window.ER_LOESUNGEN = {};
    window.ER_LOESUNGEN[a.key] = a.er;
  }

  /* Beim Start alle gemerkten Aufgaben wieder anmelden — sonst findet der
     Prüfer die Lösung nicht mehr, wenn die Seite neu geladen wurde.     */
  function alleAnmelden() {
    lies().forEach(x => { try { const a = baue(x.saat, x.wunsch); if (a) anmelden(a); } catch (e) { } });
  }

  function starten(a) {
    if (!a || typeof VIEW === "undefined") return;
    VIEW = {
      modus: "uebung", exam: null, titel: "ER-Modell · " + a.betrieb,
      items: [{
        k: a.key, id: a.key, label: "gewürfelt", fullLabel: "gewürfelt",
        prompt: a.prompt, maxPoints: a.maxPoints, topics: ["daten"], felder: null,
        solution: { text: a.loesung },
        task: { id: "er-gen", label: "ER-Übung", intro: a.quelle },
        exam: { examId: "er-gen", meta: { season: "gewürfelt", year: "", title: a.titel } }
      }]
    };
    if (typeof SHOW_SOL !== "undefined") SHOW_SOL = false;
    if (typeof zeigeBogen === "function") zeigeBogen();
    if (typeof schirm === "function") schirm("scBogen");
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", alleAnmelden);
  else alleAnmelden();

  return { baue, neu, ausSaat, starten, anmelden, liste: lies, rng };
})();
