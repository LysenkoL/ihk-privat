/* ============================================================================
   gen/er.js — ER-Modelle bauen, zeichnen und bewerten
   ----------------------------------------------------------------------------
   Gezählt über die zehn Prüfungen: Netzplan 6 Teilaufgaben (38 BE),
   Pseudocode 6 (35 BE), ER-Modell 5 (33 BE). Für die ersten beiden gibt es
   längst eigene Trainer — das ER-Modell wurde bisher in ein Textfeld
   getippt und über Stichwörter bewertet.

   Was diese Datei daraus macht:

   1. EINGABE IN ZWEI TABELLEN statt einer. Vorher standen Entität,
      Attribute, Primärschlüssel, „Beziehung zu“ und Kardinalität in
      derselben Zeile — für eine n:m-Beziehung mit eigenen Attributen
      (Verladezeit, Menge) gab es dort gar keinen Platz, und genau das ist
      die Stelle, an der in der Prüfung die Punkte hängen. Jetzt:
        · Entitäten: Name | Primärschlüssel | weitere Attribute
        · Beziehungen: von | Name | nach | Kardinalität | Attribute
      Was die Aufgabe vorgibt, steht beim Start schon drin und ist grau.

   2. ZEICHNUNG IN CHEN-NOTATION, live aus der Tabelle. Rechteck = Entität,
      Raute = Beziehung, Ellipse = Attribut, unterstrichen = Primärschlüssel.
      In der Prüfung wird gezeichnet, nicht getippt — wer die Form nie sieht,
      malt sie unter Zeitdruck falsch. Die Zeichnung geht auch mit aufs
      Papier: beim Drucken steht sie im Bogen.

   3. BEWERTUNG NACH DEM KORREKTURBOGEN. Die Punkteschlüssel der fünf
      Aufgaben stehen in gen/er-daten.js so, wie sie in der Musterlösung
      stehen („Kardinalität 1 Punkt, Primärschlüssel 2 Punkte, Attribute
      3 Punkte“). Geprüft wird Stück für Stück, mit Tippfehlertoleranz —
      und gesagt wird, WAS fehlt, nicht nur wie viel.

   Absicht: nicht die Lösung vorsagen. Die Prüfung läuft erst auf Knopfdruck,
   und sie nennt fehlende Stücke beim Namen, weil man sonst aus „5 von 8“
   nichts lernt.
   ========================================================================== */
"use strict";

window.GENER = (function () {
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const G = () => (typeof window.GEN !== "undefined" ? window.GEN : null);
  const A = () => (typeof ANSWERS !== "undefined" ? ANSWERS : {});
  const V = () => (typeof VIEW !== "undefined" ? VIEW : null);
  const SVGNS = "http://www.w3.org/2000/svg";

  const KARD = ["", "1:1", "1:n", "n:1", "n:m"];

  /* ===================================================== Vergleichen === */

  const putz = s => String(s == null ? "" : s).trim();
  const klein = s => putz(s).toLowerCase().replace(/[_\-\s.]/g, "");

  /** Zwei Bezeichner gleich? Groß/klein, Bindestriche und ein Tippfehler
   *  sind egal — „Mitarbeiter_Name“ und „Mitarbeitername“ sind dasselbe.  */
  function gleich(a, b) {
    const x = klein(a), y = klein(b);
    if (!x || !y) return false;
    if (x === y) return true;
    /* Angehängte Endungen sind egal: „Artikeln“ trifft „Artikel“. */
    if (x.length > 4 && y.length > 4 && (x.indexOf(y) === 0 || y.indexOf(x) === 0)) return true;
    /* Tippfehlertoleranz NUR bei langen Wörtern. Kurze Kürzel stehen in
       ER-Aufgaben reihenweise dicht beieinander — NameM, NameW, NameL,
       AID, LID, WID. Mit einem erlaubten Fehler wäre jedes davon jedes
       andere, und eine fehlerfreie Lösung bekäme Meldungen wie
       „NameW gehört zu Medikament“.                                    */
    const g = G();
    if (g && typeof g.abstand === "function" && Math.min(x.length, y.length) >= 8) {
      const max = Math.min(x.length, y.length) >= 12 ? 2 : 1;
      return g.abstand(x, y, max + 1) <= max;
    }
    return false;
  }

  /** Passt der Name auf die Soll-Entität (inklusive ihrer Aliasse)? */
  function trifft(soll, name) {
    if (gleich(soll.name, name)) return true;
    return (soll.alias || []).some(a => gleich(a, name));
  }

  /* ====================================================== Antwortdaten === */

  const schluessel = k => k + "#er";

  function leer(loes) {
    /* Was die Aufgabe vorgibt, steht von Anfang an da. */
    const ent = (loes.entitaeten || []).filter(e => e.gegeben)
      .map(e => ({ name: e.name, pk: e.pk || "", attr: (e.attribute || []).join(", "), fest: true }));
    const bez = (loes.beziehungen || []).filter(b => b.gegeben)
      .map(b => ({ von: b.von, name: b.name || "", nach: b.nach, kard: "", attr: "", fest: true }));
    /* Immer eine leere Zeile zum Weiterschreiben */
    ent.push({ name: "", pk: "", attr: "" });
    if (!bez.length) bez.push({ von: "", name: "", nach: "", kard: "", attr: "" });
    return { ent: ent, bez: bez };
  }

  function lade(k, loes) {
    const roh = A()[schluessel(k)];
    if (!roh) return leer(loes);
    try {
      const o = typeof roh === "string" ? JSON.parse(roh) : roh;
      if (o && o.ent && o.bez) return o;
    } catch (e) { }
    return leer(loes);
  }

  function sichere(k, daten) {
    A()[schluessel(k)] = JSON.stringify(daten);
    if (window.debouncedSave) window.debouncedSave();
    else if (window.speichern) window.speichern();
  }

  /** Als lesbarer Text — für Export, Archiv und die Wortprüfung. */
  function alsText(daten) {
    if (!daten) return "";
    const z = [];
    (daten.ent || []).forEach(e => {
      if (!putz(e.name)) return;
      const t = [];
      if (putz(e.pk)) t.push(putz(e.pk) + " (PK)");
      putz(e.attr).split(",").map(putz).filter(Boolean).forEach(a => t.push(a));
      z.push("Entität " + putz(e.name) + (t.length ? ": " + t.join(", ") : ""));
    });
    (daten.bez || []).forEach(b => {
      if (!putz(b.von) && !putz(b.nach)) return;
      let s = "Beziehung " + (putz(b.name) || "—") + ": " +
              putz(b.von) + " " + (putz(b.kard) || "?") + " " + putz(b.nach);
      const at = putz(b.attr).split(",").map(putz).filter(Boolean);
      if (at.length) s += " (Attribute an der Beziehung: " + at.join(", ") + ")";
      z.push(s);
    });
    return z.length ? "ER-Modell:\n" + z.join("\n") : "";
  }

  /* ========================================================== Zeichnen === */

  function svgEl(name, attrs) {
    const e = document.createElementNS(SVGNS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function text(x, y, s, cls) {
    const t = svgEl("text", { x: x, y: y, "text-anchor": "middle", "dominant-baseline": "middle" });
    if (cls) t.setAttribute("class", cls);
    t.textContent = s;
    return t;
  }

  /* Breite einer Beschriftung schätzen — ohne Messung im Dokument, damit
     die Zeichnung auch im Druck und im Hintergrund stimmt.              */
  const breiteVon = (s, px) => Math.max(46, putz(s).length * (px || 7.2) + 20);

  /**
   * Die eingetragenen Daten als ER-Diagramm zeichnen.
   * Aufbau: Entitäten nebeneinander, Attribute als Ellipsen darüber bzw.
   * darunter, Beziehungen als Raute auf der Verbindungslinie.
   */
  function zeichne(daten) {
    const ent = (daten.ent || []).filter(e => putz(e.name));
    const bez = (daten.bez || []).filter(b => putz(b.von) || putz(b.nach));

    const svg = svgEl("svg", { class: "er-svg", xmlns: SVGNS });
    if (!ent.length) {
      svg.setAttribute("viewBox", "0 0 400 80");
      svg.appendChild(text(200, 40, "Noch keine Entität eingetragen", "er-t-leer"));
      return svg;
    }

    const SP = 380;            /* Abstand der Entitätsmitten */
    const EH = 44;             /* Höhe eines Entitätsrechtecks */
    const platz = {};          /* Name → x-Mitte */

    /* Reihenfolge nach den Beziehungen: verbundene Entitäten nebeneinander.
       Sonst läuft die Linie Lieferant–Medikament quer durch den Kasten
       Wirkstoff, der zufällig dazwischen steht.                         */
    const verbunden = (a, c) => bez.some(b =>
      (gleich(b.von, a.name) && gleich(b.nach, c.name)) ||
      (gleich(b.nach, a.name) && gleich(b.von, c.name)));

    const reihe = [];
    const offen = ent.slice();
    while (offen.length) {
      reihe.push(offen.shift());
      let weiter = true;
      while (weiter) {
        weiter = false;
        /* erst hinten anhängen … */
        for (let i = 0; i < offen.length; i++) {
          if (verbunden(reihe[reihe.length - 1], offen[i])) {
            reihe.push(offen.splice(i, 1)[0]); weiter = true; break;
          }
        }
        if (weiter) continue;
        /* … und wenn das nicht geht, vorne. Ohne diesen zweiten Versuch
           landete der Lieferant hinter dem Wirkstoff, mit dem er nichts zu
           tun hat — und seine Beziehungslinie lief quer durch dessen
           Kasten, die Raute unsichtbar dahinter.                        */
        for (let i = 0; i < offen.length; i++) {
          if (verbunden(reihe[0], offen[i])) {
            reihe.unshift(offen.splice(i, 1)[0]); weiter = true; break;
          }
        }
      }
    }

    /* Wie hoch muss der Platz über den Kästen sein? */
    const reihenVon = e => {
      const n = (putz(e.pk) ? 1 : 0) + putz(e.attr).split(",").map(putz).filter(Boolean).length;
      return Math.ceil(n / Math.min(3, Math.max(1, n)));
    };
    const maxReihen = Math.max(1, ...reihe.map(reihenVon));
    const yE = 40 + 17 + 52 + (maxReihen - 1) * 56;   /* Grundlinie der Entitäten */

    reihe.forEach((e, i) => { platz[klein(e.name)] = 150 + i * SP; });
    const kastenBreite = {};
    reihe.forEach(e => { kastenBreite[klein(e.name)] = breiteVon(e.name, 8); });
    const breite = 150 + (reihe.length - 1) * SP + 150;

    /* --- Beziehungen zuerst, damit Linien hinter den Kästen liegen --- */
    bez.forEach((b, i) => {
      const x1 = platz[klein(b.von)], x2 = platz[klein(b.nach)];
      if (x1 == null || x2 == null) return;
      const mx = (x1 + x2) / 2;
      /* Zwei Beziehungen zwischen denselben Kästen versetzt zeichnen,
         sonst liegt Raute auf Raute.                                   */
      const doppelt = bez.filter((o, j) => j < i &&
        ((gleich(o.von, b.von) && gleich(o.nach, b.nach)) ||
         (gleich(o.von, b.nach) && gleich(o.nach, b.von)))).length;
      const my = yE + EH / 2 + doppelt * 64;
      const rw = Math.max(86, breiteVon(b.name, 6.6));
      const rh = 46;

      /* Linien */
      svg.appendChild(svgEl("line", { x1: Math.min(x1, x2) + 0, y1: my, x2: mx, y2: my, class: "er-linie" }));
      svg.appendChild(svgEl("line", { x1: mx, y1: my, x2: Math.max(x1, x2), y2: my, class: "er-linie" }));

      /* Raute */
      const p = [[mx, my - rh / 2], [mx + rw / 2, my], [mx, my + rh / 2], [mx - rw / 2, my]]
        .map(q => q.join(",")).join(" ");
      svg.appendChild(svgEl("polygon", { points: p, class: "er-raute" }));
      svg.appendChild(text(mx, my, putz(b.name) || "?", "er-t-bez"));

      /* Kardinalitäten links und rechts an die Linie */
      /* Die Kardinalität gehört neben den Kasten, nicht hinein: gemessen
         wird ab dessen Rand, sonst steht die „1“ mitten im Wort.       */
      const k = putz(b.kard).split(":");
      const links = (x1 <= x2 ? k[0] : k[1]) || "";
      const rechts = (x1 <= x2 ? k[1] : k[0]) || "";
      const linkerName = x1 <= x2 ? b.von : b.nach;
      const rechterName = x1 <= x2 ? b.nach : b.von;
      const halbL = (kastenBreite[klein(linkerName)] || 80) / 2;
      const halbR = (kastenBreite[klein(rechterName)] || 80) / 2;
      if (links) svg.appendChild(text(Math.min(x1, x2) + halbL + 16, my - 14, links, "er-t-kard"));
      if (rechts) svg.appendChild(text(Math.max(x1, x2) - halbR - 16, my - 14, rechts, "er-t-kard"));

      /* Attribute an der Beziehung hängen unter der Raute */
      putz(b.attr).split(",").map(putz).filter(Boolean).forEach((a, j) => {
        const ax = mx + (j - 0.5) * 132, ay = my + 86;
        svg.appendChild(svgEl("line", { x1: mx, y1: my + rh / 2, x2: ax, y2: ay, class: "er-linie" }));
        svg.appendChild(svgEl("ellipse", { cx: ax, cy: ay, rx: breiteVon(a, 5.6) / 2, ry: 17, class: "er-ellipse" }));
        svg.appendChild(text(ax, ay, a, "er-t-attr"));
      });
    });

    /* --- Entitäten mit ihren Attributen --- */
    reihe.forEach(e => {
      const x = platz[klein(e.name)];
      const bw = breiteVon(e.name, 8);
      svg.appendChild(svgEl("rect", { x: x - bw / 2, y: yE, width: bw, height: EH, class: "er-kasten" }));
      svg.appendChild(text(x, yE + EH / 2, putz(e.name), "er-t-ent"));

      const attr = [];
      if (putz(e.pk)) attr.push({ s: putz(e.pk), pk: true });
      putz(e.attr).split(",").map(putz).filter(Boolean).forEach(a => attr.push({ s: a, pk: false }));

      /* Fächerförmig über dem Kasten, bei mehr als drei in zwei Reihen */
      attr.forEach((a, i) => {
        const proReihe = Math.min(3, attr.length);
        const zeile = Math.floor(i / proReihe);
        const inReihe = i % proReihe;
        const spanne = (proReihe - 1) * 116;
        const ax = x - spanne / 2 + inReihe * 116;
        const ay = yE - 52 - zeile * 56;
        svg.appendChild(svgEl("line", { x1: x, y1: yE, x2: ax, y2: ay + 17, class: "er-linie" }));
        svg.appendChild(svgEl("ellipse", { cx: ax, cy: ay, rx: breiteVon(a.s, 5.6) / 2, ry: 17,
          class: "er-ellipse" + (a.pk ? " er-pk" : "") }));
        const t = text(ax, ay, a.s, "er-t-attr" + (a.pk ? " er-t-pk" : ""));
        svg.appendChild(t);
      });
    });

    /* --- Ausmaße: so hoch wie nötig, nicht wie geplant. Ein fester Wert
       ließ über der Zeichnung ein Drittel Leerraum stehen.            --- */
    let tiefstes = yE + EH + 30;
    bez.forEach((b, i) => {
      if (platz[klein(b.von)] == null || platz[klein(b.nach)] == null) return;
      const at = putz(b.attr).split(",").map(putz).filter(Boolean).length;
      const unten = yE + EH / 2 + 86 + (at ? 30 : -30) + 30;
      if (unten > tiefstes) tiefstes = unten;
    });
    svg.setAttribute("viewBox", "0 0 " + breite + " " + Math.round(tiefstes));
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    return svg;
  }

  /* =========================================================== Prüfen === */

  /**
   * Eingabe gegen die strukturierte Lösung halten.
   * @returns { punkte, max, zeilen:[{ok, text}] }
   */
  function pruefe(daten, loes) {
    const ent = (daten.ent || []).filter(e => putz(e.name));
    const bez = (daten.bez || []).filter(b => putz(b.von) && putz(b.nach));
    const zeilen = [];

    /* --- Entitäten, Primärschlüssel, Attribute ---
       Die Soll-Zahlen kommen aus der Lösung, nicht aus dem Gefundenen.
       Sonst hätte eine leere Eingabe ein Soll von null und damit — als
       Anteil gerechnet — volle Punkte. Genau das war der Fall: ein
       unbearbeitetes ER-Modell bekam 5 von 8 BE.                        */
    let pkDa = 0, pkSoll = 0, attrDa = 0, attrSoll = 0, entDa = 0, entSoll = 0;
    (loes.entitaeten || []).forEach(se => {
      if (se.pk) pkSoll++;
      attrSoll += (se.attribute || []).length;
      if (!se.gegeben) entSoll++;
    });

    (loes.entitaeten || []).forEach(se => {
      const meine = ent.find(e => trifft(se, e.name));
      if (meine && !se.gegeben) entDa++;
      if (!meine) {
        if (!se.gegeben) zeilen.push({ ok: false, text: "Entität „" + se.name + "“ fehlt" });
        return;
      }
      if (se.pk) {
        if (gleich(se.pk, meine.pk)) { pkDa++; zeilen.push({ ok: true, text: se.name + ": Primärschlüssel " + se.pk }); }
        else zeilen.push({ ok: false, text: se.name + ": Primärschlüssel fehlt oder steht nicht in der PK-Spalte" });
      }
      const geschrieben = putz(meine.attr).split(",").map(putz).filter(Boolean);
      (se.attribute || []).forEach(sa => {
        if (geschrieben.some(g => gleich(g, sa))) attrDa++;
        else zeilen.push({ ok: false, text: se.name + ": Attribut „" + sa + "“ fehlt" });
      });
    });

    /* Attribute an der falschen Entität — häufigster Fehler und einer,
       für den es keine Punkte gibt, obwohl das Wort dasteht.           */
    (loes.entitaeten || []).forEach(se => {
      const meine = ent.find(e => trifft(se, e.name));
      if (!meine) return;
      const geschrieben = putz(meine.attr).split(",").map(putz).filter(Boolean);
      geschrieben.forEach(g => {
        const gehoert = (loes.entitaeten || []).find(x => (x.attribute || []).some(a => gleich(a, g)));
        if (gehoert && gehoert.name !== se.name)
          zeilen.push({ ok: false, text: "„" + g + "“ steht bei " + se.name + ", gehört aber zu " + gehoert.name });
      });
    });

    /* --- Beziehungen --- */
    let bezDa = 0, bezSoll = 0, kardDa = 0, bAttrDa = 0, bAttrSoll = 0;
    (loes.beziehungen || []).forEach(sb => {
      bezSoll++;
      if ((sb.attribute || []).length) bAttrSoll++;
    });
    (loes.beziehungen || []).forEach(sb => {
      const meine = bez.find(b => {
        const hin = trifft({ name: sb.von, alias: alias(loes, sb.von) }, b.von) &&
                    trifft({ name: sb.nach, alias: alias(loes, sb.nach) }, b.nach);
        const her = trifft({ name: sb.von, alias: alias(loes, sb.von) }, b.nach) &&
                    trifft({ name: sb.nach, alias: alias(loes, sb.nach) }, b.von);
        return hin || her;
      });
      if (!meine) {
        zeilen.push({ ok: false, text: "Beziehung " + sb.von + " – " + sb.nach + " fehlt" });
        return;
      }
      bezDa++;
      /* Richtung beachten: 1:n rückwärts gelesen ist n:1 */
      const rueck = trifft({ name: sb.von, alias: alias(loes, sb.von) }, meine.nach);
      const soll = rueck ? dreh(sb.kard) : sb.kard;
      if (putz(meine.kard) === soll || putz(meine.kard) === sb.kard) {
        kardDa++;
        zeilen.push({ ok: true, text: "Kardinalität " + sb.von + " " + sb.kard + " " + sb.nach });
      } else {
        /* „stimmt nicht“ allein ist keine Rückmeldung — man sieht weder die
           eigene noch die richtige Kardinalität. Beide gehören in die Zeile,
           und zwar in der Leserichtung, die im Feld steht.               */
        zeilen.push({ ok: false, text: "Kardinalität " + sb.von + " – " + sb.nach + ": " +
          (putz(meine.kard) ? "eingetragen " + putz(meine.kard) : "leer") +
          ", richtig " + soll + (soll !== sb.kard ? " (in dieser Leserichtung)" : "") });
      }
      if ((sb.attribute || []).length) {
        const gs = putz(meine.attr).split(",").map(putz).filter(Boolean);
        const treffer = (sb.attribute || []).filter(sa => gs.some(g => gleich(g, sa))).length;
        if (treffer) { bAttrDa++; zeilen.push({ ok: true, text: "Attribut an der Beziehung „" + sb.name + "“ gesetzt" }); }
        else zeilen.push({ ok: false, text: "An der Beziehung „" + sb.name + "“ fehlt " +
          sb.attribute.map(a => "„" + a + "“").join(" bzw. ") });
      }
    });

    /* --- Punkte nach dem Korrekturbogen verteilen --- */
    const anteil = (da, soll) => soll ? da / soll : 1;
    const max = (loes.punkte || []).reduce((s, p) => s + p.be, 0);
    let punkte = 0;
    (loes.punkte || []).forEach(p => {
      const w = p.was.toLowerCase();
      let q = 0;
      if (/kardinalit/.test(w)) q = anteil(kardDa, bezSoll);
      else if (/primärschlüssel|primaerschluessel/.test(w)) q = anteil(pkDa, pkSoll);
      else if (/beziehung/.test(w) && !/attribut/.test(w)) q = anteil(bezDa, bezSoll);
      else if (/an der .*beziehung|zwischentabelle|dosierung/.test(w)) q = anteil(bAttrDa, bAttrSoll);
      else if (/entität|entitaet/.test(w)) q = anteil(entDa, entSoll);
      else if (/attribut|vorname|beginn/.test(w)) q = anteil(attrDa, attrSoll);
      else q = anteil(attrDa + pkDa, attrSoll + pkSoll);
      punkte += p.be * q;
    });
    punkte = Math.round(punkte * 2) / 2;   /* halbe Punkte wie in der Prüfung */

    if (!zeilen.some(z => !z.ok)) zeilen.unshift({ ok: true, text: "Alles Geforderte ist da." });
    return { punkte: punkte, max: max, zeilen: zeilen };
  }

  function alias(loes, name) {
    const e = (loes.entitaeten || []).find(x => x.name === name);
    return e ? (e.alias || []) : [];
  }
  const dreh = k => ({ "1:n": "n:1", "n:1": "1:n" })[k] || k;

  /* ======================================================== Oberfläche === */

  function tabelle(spalten, zeilen, beiAenderung, optionen) {
    const wrap = el("div", "er-tab-wrap");
    const t = el("table", "er-tab");
    const kopf = el("tr");
    spalten.forEach(s => kopf.appendChild(el("th", null, s.label)));
    kopf.appendChild(el("th", "er-weg", ""));
    t.appendChild(el("thead")).appendChild(kopf);
    const tb = el("tbody");
    t.appendChild(tb);

    function zeichneZeilen() {
      tb.innerHTML = "";
      zeilen.forEach((z, r) => {
        const tr = el("tr");
        if (z.fest) tr.className = "er-fest";
        spalten.forEach(s => {
          const td = el("td");
          td.dataset.spalte = s.label;
          let f;
          if (s.optionen) {
            f = el("select");
            s.optionen.forEach(o => {
              const op = el("option", null, o || "—"); op.value = o; f.appendChild(op);
            });
          } else {
            f = el("input"); f.type = "text";
            if (s.platz) f.placeholder = s.platz;
          }
          f.className = "er-feld";
          f.value = z[s.key] || "";
          f.setAttribute("aria-label", s.label + ", Zeile " + (r + 1));
          if (z.fest && s.key !== "kard") { f.readOnly = true; f.classList.add("er-ro"); }
          const merken = () => { z[s.key] = f.value; beiAenderung(); };
          f.addEventListener("input", merken);
          f.addEventListener("change", merken);
          td.appendChild(f);
          tr.appendChild(td);
        });
        const weg = el("td", "er-weg");
        if (!z.fest) {
          const b = el("button", "er-weg-knopf", "×");
          b.title = "Zeile löschen";
          b.setAttribute("aria-label", "Zeile " + (r + 1) + " löschen");
          b.onclick = () => { zeilen.splice(r, 1); if (!zeilen.length) zeilen.push({}); zeichneZeilen(); beiAenderung(); };
          weg.appendChild(b);
        }
        tr.appendChild(weg);
        tb.appendChild(tr);
      });
    }
    zeichneZeilen();
    wrap.appendChild(t);

    const plus = el("button", "btn ghost klein", (optionen && optionen.plus) || "+ Zeile");
    plus.onclick = () => { zeilen.push({}); zeichneZeilen(); beiAenderung(); };
    wrap.appendChild(plus);
    return wrap;
  }

  function baue(karte, it, loes) {
    const k = it.k;
    const daten = lade(k, loes);

    const box = el("div", "er-block");

    const kopf = el("div", "er-kopf");
    kopf.append(el("span", "er-titel", "ER-Modell bauen"),
                el("span", "er-note", loes.titel || ""));
    box.appendChild(kopf);

    const bild = el("div", "er-bild");
    const knopfe = el("div", "er-knopfe");

    function neuzeichnen() {
      bild.innerHTML = "";
      bild.appendChild(zeichne(daten));
    }
    function geaendert() { sichere(k, daten); neuzeichnen(); }

    box.appendChild(el("div", "er-unter", "Entitäten"));
    box.appendChild(tabelle([
      { key: "name", label: "Entität", platz: "z. B. Artikel" },
      { key: "pk", label: "Primärschlüssel", platz: "z. B. AID" },
      { key: "attr", label: "weitere Attribute (Komma)", platz: "Name, Gewicht" }
    ], daten.ent, geaendert, { plus: "+ Entität" }));

    box.appendChild(el("div", "er-unter", "Beziehungen"));
    box.appendChild(tabelle([
      { key: "von", label: "von" },
      { key: "name", label: "Beziehung", platz: "z. B. verladen" },
      { key: "nach", label: "nach" },
      { key: "kard", label: "Kardinalität", optionen: KARD },
      { key: "attr", label: "Attribute an der Beziehung", platz: "nur bei n:m" }
    ], daten.bez, geaendert, { plus: "+ Beziehung" }));

    box.appendChild(el("div", "er-unter", "So sieht es aus"));
    box.appendChild(bild);
    neuzeichnen();

    /* --- Knöpfe --- */
    const pruefKnopf = el("button", "btn", "ER-Modell prüfen");
    const ausgabe = el("div", "er-ausgabe");
    pruefKnopf.onclick = () => {
      const r = pruefe(daten, loes);
      ausgabe.innerHTML = "";
      const kopfz = el("div", "er-erg");
      kopfz.append(el("b", null, r.punkte + " von " + r.max + " BE"),
        el("span", "er-erg-note", loes.unsicher
          ? " — die Vorlage im PDF war nicht eindeutig, sieh auf der Lösungsseite nach"
          : " — nach dem Schlüssel im Korrekturbogen"));
      ausgabe.appendChild(kopfz);
      const ul = el("div", "er-liste");
      r.zeilen.forEach(z => {
        const d = el("div", "er-zeile " + (z.ok ? "er-ja" : "er-nein"));
        d.append(el("span", "er-zeichen", z.ok ? "✓" : "·"), el("span", null, z.text));
        ul.appendChild(d);
      });
      ausgabe.appendChild(ul);
      if (loes.punkte && loes.punkte.length) {
        const sch = el("div", "er-schluessel",
          "Punkte laut Korrekturbogen: " + loes.punkte.map(p => p.was + " " + p.be).join(" · "));
        ausgabe.appendChild(sch);
      }
      /* Eigenbewertung anbieten — die Punkte selbst setzt sie weiter selbst */
      if (typeof SCORES !== "undefined") {
        const uebern = el("button", "btn ghost klein", "als Selbstbewertung übernehmen");
        uebern.onclick = () => {
          SCORES[k] = Math.round(r.punkte);
          if (window.speichern) window.speichern();
          if (window.refresh) window.refresh();
          if (window.zeigeBogen) window.zeigeBogen();
          if (window.toast) window.toast("Punkte übernommen.");
        };
        ausgabe.appendChild(uebern);
      }
    };

    /* Auf dem Telefon schrumpft die Zeichnung auf Bildschirmbreite — lesbar
       ist sie dann nur in der Großansicht.                              */
    const grossKnopf = el("button", "btn ghost", "⤢ Zeichnung groß");
    grossKnopf.onclick = () => {
      const alt = document.getElementById("erLupe");
      if (alt) alt.remove();
      const hg = el("div", "er-lupe"); hg.id = "erLupe";
      const innen = el("div", "er-lupe-innen");
      innen.appendChild(zeichne(daten));
      const zu = el("button", "er-lupe-zu", "×");
      zu.setAttribute("aria-label", "schließen");
      zu.onclick = () => hg.remove();
      hg.append(innen, zu);
      hg.addEventListener("click", ev => { if (ev.target === hg) hg.remove(); });
      document.addEventListener("keydown", function esc(ev) {
        if (ev.key === "Escape") { hg.remove(); document.removeEventListener("keydown", esc); }
      });
      document.body.appendChild(hg);
    };

    const hinweisKnopf = el("button", "btn ghost", "Notation");
    const hinweis = el("div", "er-hinweis");
    hinweis.hidden = true;
    hinweis.innerHTML =
      "<b>Chen-Notation</b><div>· Rechteck = Entität · Raute = Beziehung · Ellipse = Attribut · " +
      "unterstrichen = Primärschlüssel</div>" +
      "<div>· Die Kardinalität steht an der Linie: <i>1:n</i> heißt — ein Satz links, viele rechts.</div>" +
      "<div>· Attribute, die erst durch die Beziehung entstehen (Menge, Datum, Dosierung), " +
      "gehören an die Raute, nicht an eine Entität.</div>" +
      (loes.hinweis ? "<div class=\"er-hinweis-auf\">" + loes.hinweis + "</div>" : "");
    hinweisKnopf.onclick = () => { hinweis.hidden = !hinweis.hidden; };

    knopfe.append(pruefKnopf, grossKnopf, hinweisKnopf);
    box.append(knopfe, hinweis, ausgabe);
    return box;
  }

  /* ======================================================= Nachrüsten === */

  const merk = {};    /* k → daten, damit antwortText sie findet */

  function nachruesten() {
    const view = V();
    if (!view || !view.items) return;
    const L = window.ER_LOESUNGEN || {};
    document.querySelectorAll("#bogenMain .tk").forEach(karte => {
      if (karte.dataset.erFertig) return;
      const k = karte.dataset.k;
      const loes = L[k];
      if (!loes) return;
      const it = view.items.find(x => x.k === k);
      if (!it) return;
      karte.dataset.erFertig = "1";
      /* Die allgemeine Diagrammtabelle tritt zurück — sie kann n:m-Attribute
         nicht abbilden und stünde sonst doppelt da.                      */
      karte.dataset.diaFertig = "1";
      const doppelt = karte.querySelector(".ex-dia");
      if (doppelt) doppelt.remove();

      const daten = lade(k, loes);
      merk[k] = daten;

      const ziel = karte.querySelector(".tk-haupt > textarea");
      const block = baue(karte, it, loes);
      if (ziel) ziel.parentNode.insertBefore(block, ziel);
      else karte.querySelector(".tk-haupt").appendChild(block);
    });
  }

  function einhaengen() {
    const altText = window.antwortText;
    if (typeof altText === "function" && !altText.__er) {
      const neu = function (it) {
        const basis = altText.apply(null, arguments);
        if (!it || !merk[it.k]) return basis;
        const t = alsText(merk[it.k]);
        if (!t) return basis;
        return basis ? basis + "\n\n" + t : t;
      };
      neu.__er = true; window.antwortText = neu;
    }

    const altBogen = window.zeigeBogen;
    if (typeof altBogen === "function" && !altBogen.__er) {
      const neu = function () {
        const r = altBogen.apply(this, arguments);
        try { setTimeout(nachruesten, 10); } catch (e) { console.error("ER:", e); }
        return r;
      };
      neu.__er = true; window.zeigeBogen = neu;
    }
  }

  /* Vor dem Drucken: ein <input> zeigt auf Papier nur, was hineinpasst —
     aus „Verladezeit, Menge pro Artikel“ wurde „Verladezeit, Menge pr“.
     Deshalb steht im Ausdruck ein einfacher Textblock daneben.          */
  function druckVorbereiten() {
    document.querySelectorAll(".er-block .er-feld").forEach(f => {
      let d = f.nextElementSibling;
      if (!d || !d.classList || !d.classList.contains("er-druck")) {
        d = document.createElement("div");
        d.className = "er-druck";
        f.parentNode.insertBefore(d, f.nextSibling);
      }
      d.textContent = putz(f.value);
    });
  }
  window.addEventListener("beforeprint", druckVorbereiten);
  if (window.matchMedia) {
    const mq = window.matchMedia("print");
    const h = e => { if (e.matches) druckVorbereiten(); };
    if (mq.addEventListener) mq.addEventListener("change", h);
    else if (mq.addListener) mq.addListener(h);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { zeichne, pruefe, alsText, nachruesten, gleich, druckVorbereiten };
})();
