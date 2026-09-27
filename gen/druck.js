/* ============================================================================
   gen/druck.js — Prüfungsbogen zum Ausdrucken und Papiermodus mit Zeitmessung
   ----------------------------------------------------------------------------
   Baut aus einem generierten Arbeitsblatt einen Bogen im Layout der echten
   AP1-Prüfung: Deckblatt, BE-Spalte am Rand, Antwortlinien nach Punktzahl,
   leere Raster und Zeichenflächen. Drucken über den Browser ("Als PDF
   speichern") — kein zusätzliches Programm nötig.
   ========================================================================== */
"use strict";

window.GENDRUCK = (function () {
  const G = window.GEN;
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const nz = n => G.fmt.kurz(n);

  let STAND = null;   // { blatt, aufgaben, modus }

  /* ==================== Grundgerüst ==================================== */

  function behaelter() {
    let wrap = $("druckWrap");
    if (wrap) return wrap;
    wrap = el("div"); wrap.id = "druckWrap"; wrap.hidden = true;

    const leiste = el("div", "dr-leiste"); leiste.id = "druckLeiste";
    wrap.appendChild(leiste);

    const bogen = el("div", "dr-bogen"); bogen.id = "druckBogen";
    wrap.appendChild(bogen);

    document.body.appendChild(wrap);
    return wrap;
  }

  function knopf(txt, cls, fn) { const b = el("button", "btn " + cls, txt); b.onclick = fn; return b; }

  function schliessen() {
    document.body.classList.remove("druckmodus");
    const w = $("druckWrap"); if (w) w.hidden = true;
    if (STAND && STAND.modus === "papier") papierStop();
    window.scrollTo(0, 0);
  }

  /* ==================== Bogen anzeigen ================================= */

  /**
   * @param blatt     Blattobjekt aus blatt.js
   * @param aufgaben  bereits erzeugte Aufgabenobjekte
   * @param opt       { loesung: bool, modus: "druck"|"papier" }
   */
  function zeige(blatt, aufgaben, opt) {
    opt = opt || {};
    STAND = { blatt, aufgaben, modus: opt.modus || "druck" };
    const wrap = behaelter();
    wrap.hidden = false;
    document.body.classList.add("druckmodus");
    /* nur das Merkblatt setzt „dr-lesbar“ wieder (gen/merkblatt.js) */
    const bg = $("druckBogen"); if (bg) bg.classList.remove("dr-lesbar");

    const leiste = $("druckLeiste");
    leiste.innerHTML = "";
    const info = el("div", "dr-info");
    info.innerHTML = "<b>Prüfungsbogen</b> — zum Drucken oder als PDF speichern " +
      "(im Druckdialog Ziel „Als PDF speichern“, Ränder „Standard“, Hintergrundgrafiken aus).";
    leiste.appendChild(info);
    leiste.appendChild(el("span", "weit"));
    leiste.appendChild(knopf("Drucken / als PDF speichern", "primary", () => window.print()));

    const mitL = el("label", "schalter");
    const cb = el("input"); cb.type = "checkbox"; cb.checked = !!opt.loesung;
    cb.onchange = () => bauen(blatt, aufgaben, { loesung: cb.checked });
    mitL.append(cb, document.createTextNode("Lösungsbogen anhängen"));
    leiste.appendChild(mitL);
    leiste.appendChild(knopf("zurück", "ghost", schliessen));

    bauen(blatt, aufgaben, { loesung: !!opt.loesung });
    window.scrollTo(0, 0);
  }

  function bauen(blatt, aufgaben, opt) {
    const b = $("druckBogen");
    b.innerHTML = "";
    b.appendChild(deckblatt(blatt, aufgaben));
    aufgaben.forEach((a, i) => b.appendChild(aufgabeDruck(a, i)));
    b.appendChild(schlussblatt(blatt, aufgaben));
    if (opt.loesung) b.appendChild(loesungsbogen(blatt, aufgaben));
  }

  /* ==================== Deckblatt ====================================== */

  function minuten(be) { return Math.max(15, Math.round(be * 0.9 / 5) * 5); }

  function deckblatt(blatt, aufgaben) {
    const be = aufgaben.reduce((s, a) => s + a.maxPoints, 0);
    const min = minuten(be);
    const s = el("section", "dr-seite dr-deck");

    const kopf = el("div", "dr-deckkopf");
    kopf.appendChild(el("div", "dr-klein", "Übungsbogen im Format der gestreckten Abschlussprüfung"));
    kopf.appendChild(el("h1", null, "Teil 1 — Einrichten eines IT-gestützten Arbeitsplatzes"));
    kopf.appendChild(el("div", "dr-unter", blatt.titel));
    s.appendChild(kopf);

    const gitter = el("table", "dr-deckdaten");
    const zeile = (a, b2) => {
      const tr = el("tr"); tr.appendChild(el("th", null, a)); tr.appendChild(el("td", null, b2)); return tr;
    };
    const tb = el("tbody");
    tb.appendChild(zeile("Bearbeitungszeit", min + " Minuten"));
    tb.appendChild(zeile("Erreichbare Punkte", nz(be) + " von " + nz(be) + " BE"));
    tb.appendChild(zeile("Anzahl Aufgaben", String(aufgaben.length)));
    tb.appendChild(zeile("Hilfsmittel", "unprogrammierbarer Taschenrechner, kein weiteres Material"));
    tb.appendChild(zeile("Erstellt am", blatt.erstellt));
    gitter.appendChild(tb);
    s.appendChild(gitter);

    const namen = el("div", "dr-namen");
    ["Name", "Datum", "Beginn / Ende"].forEach(t => {
      const f = el("div", "dr-namensfeld");
      f.appendChild(el("span", "dr-klein", t));
      f.appendChild(el("div", "dr-linie"));
      namen.appendChild(f);
    });
    s.appendChild(namen);

    s.appendChild(el("h2", "dr-h2", "Punkteverteilung"));
    const t = el("table", "dr-verteilung");
    t.innerHTML = "<thead><tr><th>Aufgabe</th><th>Thema</th><th class='r'>BE</th>" +
      "<th class='r'>erreicht</th></tr></thead>";
    const body = el("tbody");
    aufgaben.forEach((a, i) => {
      const tr = el("tr");
      tr.appendChild(el("td", null, String(i + 1)));
      tr.appendChild(el("td", null, a.titel + " · " + a.sub));
      tr.appendChild(el("td", "r", nz(a.maxPoints)));
      tr.appendChild(el("td", "r kasten", ""));
      body.appendChild(tr);
    });
    const summe = el("tr", "dr-summe");
    summe.appendChild(el("td", null, ""));
    summe.appendChild(el("td", null, "Summe"));
    summe.appendChild(el("td", "r", nz(be)));
    summe.appendChild(el("td", "r kasten", ""));
    body.appendChild(summe);
    t.appendChild(body);
    s.appendChild(t);

    const hin = el("div", "dr-hinweis");
    hin.innerHTML =
      "<b>Hinweise zur Bearbeitung</b>" +
      "<ul>" +
      "<li>Die Punktzahl am Rand zeigt, wie ausführlich die Antwort sein muss: eine Nennung je halbem Punkt, " +
      "bei „erläutern“ und „begründen“ gehört zu jeder Nennung ein vollständiger Satz mit Begründung.</li>" +
      "<li>Rechenwege sind anzugeben. Ohne nachvollziehbaren Weg gibt es für ein richtiges Ergebnis nur Teilpunkte.</li>" +
      "<li>Ergebnisse mit Einheit angeben und kaufmännisch auf zwei Nachkommastellen runden, " +
      "sofern nichts anderes verlangt ist.</li>" +
      "<li>Reicht der Platz nicht, auf der Rückseite weiterschreiben und dort die Aufgabennummer notieren.</li>" +
      "</ul>" +
      "<div class='dr-zeitplan'><b>Zeitplan:</b> " + min + " Minuten für " + nz(be) + " BE — das sind rund " +
      (Math.round(min / Math.max(1, be) * 10) / 10).toString().replace(".", ",") +
      " Minuten je Bewertungseinheit. Notiere dir zu Beginn für jede Aufgabe eine Uhrzeit.</div>";
    s.appendChild(hin);
    return s;
  }

  /* ==================== Aufgabe ======================================== */

  function aufgabeDruck(a, i) {
    const s = el("section", "dr-aufgabe");

    const kopf = el("div", "dr-akopf");
    const links = el("div");
    links.appendChild(el("span", "dr-anr", "Aufgabe " + (i + 1)));
    links.appendChild(el("span", "dr-atitel", a.titel));
    kopf.appendChild(links);
    kopf.appendChild(el("span", "dr-abe", nz(a.maxPoints) + " BE"));
    s.appendChild(kopf);

    if (a.situation) s.appendChild(el("div", "dr-situation", a.situation));
    if (a.code) s.appendChild(el("pre", "dr-code", a.code));
    (a.tabellen || []).forEach(t => s.appendChild(datenTabelle(t)));
    s.appendChild(el("div", "dr-frage", a.prompt));

    a.felder.forEach(f => s.appendChild(feldDruck(f)));
    return s;
  }

  function datenTabelle(t) {
    const box = el("div", "dr-tabbox");
    if (t.titel) box.appendChild(el("div", "dr-tabtitel", t.titel));
    const tab = el("table", "dr-daten");
    const thead = el("thead"), trh = el("tr");
    (t.kopf || []).forEach(h => trh.appendChild(el("th", null, h)));
    thead.appendChild(trh); tab.appendChild(thead);
    const tb = el("tbody");
    (t.zeilen || []).forEach(z => {
      const tr = el("tr");
      z.forEach(c => tr.appendChild(el("td", null, c)));
      tb.appendChild(tr);
    });
    tab.appendChild(tb); box.appendChild(tab);
    return box;
  }

  /** Linien: so viele, wie die Punktzahl an Antwort erwarten lässt */
  function linien(n) {
    const box = el("div", "dr-linien");
    for (let i = 0; i < n; i++) box.appendChild(el("div", "dr-linie"));
    return box;
  }

  function zeilenBedarf(f) {
    if (f.typ === "zahl") return f.be >= 2 ? 3 : 2;
    if (f.typ === "text" && (f.zeilen || 2) <= 1) return 1;
    if (f.typ === "liste") return Math.max(2, (f.noetig || 2)) * 2;
    if (f.typ === "text") return Math.min(8, Math.max(2, Math.round(f.be * 2)));
    return 2;
  }

  function feldDruck(f) {
    const box = el("div", "dr-feld" + (f.typ === "rechenweg" ? " dr-weg" : ""));
    const kopf = el("div", "dr-fkopf");
    kopf.appendChild(el("span", "dr-flabel", f.label + (f.einheit ? "  [" + f.einheit + "]" : "")));
    kopf.appendChild(el("span", "dr-fbe", f.typ === "rechenweg" ? "Folgefehler" : nz(f.be) + " BE"));
    box.appendChild(kopf);

    /* Rechenweg: kariertes Feld direkt bei der Aufgabe statt hinten auf dem
       Schmierblatt — auf dem echten Bogen steht er auch dort.            */
    if (f.typ === "rechenweg") {
      box.appendChild(el("div", "dr-klein",
        "Jeden Rechenschritt in eine eigene Zeile. Stimmt der Weg und nur das " +
        "Ergebnis nicht, gibt es die halbe Punktzahl."));
      const k = el("div", "dr-kariert dr-wegfeld");
      k.style.height = Math.min(74, 26 + (f.soll || []).length * 5) + "mm";
      box.appendChild(k);
      return box;
    }

    if (f.typ === "auswahl" || f.typ === "mehrfachwahl") {
      const ul = el("div", "dr-kreuze");
      (f.optionen || []).forEach(o => {
        const z = el("div", "dr-kreuz");
        z.appendChild(el("span", "dr-box", ""));
        z.appendChild(el("span", null, String(o)));
        ul.appendChild(z);
      });
      box.appendChild(ul);
      if (f.typ === "auswahl") box.appendChild(el("div", "dr-klein", "genau eine Antwort ankreuzen"));

    } else if (f.typ === "aussagen") {
      const t = el("table", "dr-wf");
      t.innerHTML = "<thead><tr><th>Aussage</th><th class='c'>richtig</th><th class='c'>falsch</th></tr></thead>";
      const tb = el("tbody");
      (f.aussagen || []).forEach(a => {
        const tr = el("tr");
        tr.appendChild(el("td", null, a.text));
        tr.appendChild(el("td", "c", "☐"));
        tr.appendChild(el("td", "c", "☐"));
        tb.appendChild(tr);
      });
      t.appendChild(tb); box.appendChild(t);

    } else if (f.typ === "zuordnung") {
      const hin = el("div", "dr-klein",
        "Auswahl: " + (f.optionen || []).join(" · "));
      box.appendChild(hin);
      const t = el("table", "dr-zuo");
      const tb = el("tbody");
      (f.paare || []).forEach(p => {
        const tr = el("tr");
        tr.appendChild(el("td", null, p[0]));
        tr.appendChild(el("td", "leer", ""));
        tb.appendChild(tr);
      });
      t.appendChild(tb); box.appendChild(t);

    } else if (f.typ === "raster") {
      const t = el("table", "dr-raster");
      if (f.kopf) {
        const thead = el("thead"), tr = el("tr");
        f.kopf.forEach(h => tr.appendChild(el("th", null, h)));
        thead.appendChild(tr); t.appendChild(thead);
      }
      const tb = el("tbody");
      (f.zeilen || []).forEach(z => {
        const tr = el("tr");
        z.zellen.forEach(c => {
          const td = el("td", c.eingabe ? "leer" : null, c.eingabe ? "" : (c.t == null ? "" : c.t));
          tr.appendChild(td);
        });
        tb.appendChild(tr);
      });
      t.appendChild(tb); box.appendChild(t);

    } else if (f.typ === "knoten" || f.typ === "flussbild") {
      /* Auf Papier bleibt es beim Selberzeichnen — genau das verlangt die
         Prüfung. Am Bildschirm ist es das Lückendiagramm; die eine Form
         übt das Erkennen, die andere das Entwerfen.                    */
      const flaeche = el("div", "dr-zeichnen");
      flaeche.style.minHeight = Math.min(210, 70 + (f.soll || []).length * 11) + "mm";
      flaeche.appendChild(el("div", "dr-klein dr-zeichenhinweis",
        "Zeichenfläche — Notation beachten: Startknoten ausgefüllter Kreis, Aktion abgerundetes Rechteck, " +
        "Entscheidung Raute mit Bedingungen in [ ], Fork/Join als Balken, Endknoten Kreis mit Ring."));
      box.appendChild(flaeche);

    } else if (f.typ === "modell") {
      const zeichnen = { er: true, klasse: true, usecase: true }[f.art];
      if (zeichnen) {
        const hinweis = {
          er: "Zeichenfläche: Entitäten als Rechtecke, Beziehungen als Rauten, Attribute als Ovale " +
              "oder als Liste im Rechteck. Kardinalitäten an beide Enden schreiben.",
          klasse: "Zeichenfläche: Klasse als Rechteck mit drei Fächern (Name / Attribute / Methoden). " +
                  "Vererbung mit leerer Dreieckspitze zur Oberklasse, Multiplizitäten an die Enden.",
          usecase: "Zeichenfläche: Systemgrenze als Rechteck, Anwendungsfälle als Ovale darin, " +
                   "Akteure als Strichmännchen außerhalb. «include» und «extend» gestrichelt mit Pfeil."
        }[f.art];
        const flaeche = el("div", "dr-zeichnen");
        flaeche.style.minHeight = "115mm";
        flaeche.appendChild(el("div", "dr-klein dr-zeichenhinweis", hinweis));
        box.appendChild(flaeche);
        box.appendChild(el("div", "dr-klein", "Notieren Sie dieselben Angaben zusätzlich in der Tabelle:"));
      }
      const t = el("table", "dr-raster");
      const thead = el("thead"), trh = el("tr");
      (f.spalten || []).forEach(sp => trh.appendChild(el("th", null, sp.label)));
      thead.appendChild(trh); t.appendChild(thead);
      const tb = el("tbody");
      const n = Math.max(3, (f.soll || []).length + 1);
      for (let z = 0; z < n; z++) {
        const tr = el("tr");
        (f.spalten || []).forEach(() => tr.appendChild(el("td", "leer", "")));
        tb.appendChild(tr);
      }
      t.appendChild(tb); box.appendChild(t);

    } else {
      box.appendChild(linien(zeilenBedarf(f)));
    }
    return box;
  }

  function schlussblatt(blatt, aufgaben) {
    const be = aufgaben.reduce((s, a) => s + a.maxPoints, 0);
    const s = el("section", "dr-seite dr-schluss");
    s.appendChild(el("h2", "dr-h2", "Nebenrechnungen"));
    s.appendChild(el("div", "dr-klein",
      "Dieses Blatt wird mitbewertet, wenn du hier den Rechenweg zu einer Aufgabe notierst — " +
      "schreibe die Aufgabennummer dazu."));
    const kasten = el("div", "dr-kariert");
    s.appendChild(kasten);
    s.appendChild(el("h2", "dr-h2", "Eigene Auswertung"));
    const t = el("table", "dr-verteilung");
    t.innerHTML = "<thead><tr><th>Erreichte Punkte</th><th>Prozent</th><th>Note</th>" +
      "<th>Benötigte Zeit</th></tr></thead><tbody><tr>" +
      "<td class='kasten'></td><td class='kasten'></td><td class='kasten'></td><td class='kasten'></td>" +
      "</tr></tbody>";
    s.appendChild(t);
    s.appendChild(el("div", "dr-klein",
      "IHK-Schlüssel: ab 92 % Note 1 · ab 81 % Note 2 · ab 67 % Note 3 · ab 50 % Note 4 (bestanden) · " +
      "ab 30 % Note 5. Richtwert Zeit: " + minuten(be) + " Minuten."));
    return s;
  }

  /* ==================== Lösungsbogen =================================== */

  function loesungsbogen(blatt, aufgaben) {
    const s = el("section", "dr-seite dr-loesung");
    s.appendChild(el("h1", null, "Lösungsbogen"));
    s.appendChild(el("div", "dr-klein",
      "Zum Selbstkorrigieren. Vergib Teilpunkte großzügig dort, wo der Rechenweg stimmt, " +
      "und streng dort, wo ein Fachbegriff ohne Erklärung steht."));
    aufgaben.forEach((a, i) => {
      const b = el("div", "dr-lblock");
      const kopf = el("div", "dr-akopf");
      kopf.appendChild(el("span", "dr-anr", "Aufgabe " + (i + 1)));
      kopf.appendChild(el("span", "dr-abe", nz(a.maxPoints) + " BE"));
      b.appendChild(kopf);
      b.appendChild(el("pre", "dr-ltext", a.loesung));
      const pl = el("table", "dr-punkte");
      pl.innerHTML = "<thead><tr><th>Teilantwort</th><th class='r'>BE</th><th class='r'>erreicht</th></tr></thead>";
      const tb = el("tbody");
      a.felder.forEach(f => {
        const tr = el("tr");
        tr.appendChild(el("td", null, f.label));
        tr.appendChild(el("td", "r", nz(f.be)));
        tr.appendChild(el("td", "r kasten", ""));
        tb.appendChild(tr);
      });
      pl.appendChild(tb);
      b.appendChild(pl);
      if (a.merksatz) b.appendChild(el("div", "dr-merk", "Merksatz: " + a.merksatz));
      s.appendChild(b);
    });
    return s;
  }

  /* ==================== Papiermodus ==================================== */

  let PUHR = null;

  function papierStart(blatt, aufgaben) {
    blatt.papier = blatt.papier || { sekunden: 0, punkte: {}, laeuft: false };
    blatt.papier.laeuft = true;
    zeige(blatt, aufgaben, { loesung: false, modus: "papier" });

    const leiste = $("druckLeiste");
    leiste.innerHTML = "";
    const info = el("div", "dr-info");
    info.innerHTML = "<b>Papiermodus</b> — Bogen ausdrucken, Uhr läuft mit. " +
      "Wenn du fertig bist: „Fertig — Punkte eintragen“.";
    leiste.appendChild(info);
    const uhr = el("div", "dr-uhr"); uhr.id = "papierUhr"; uhr.textContent = "00:00";
    leiste.appendChild(uhr);
    leiste.appendChild(el("span", "weit"));
    leiste.appendChild(knopf("Drucken / als PDF speichern", "primary", () => window.print()));
    leiste.appendChild(knopf("Pause", "", pauseUmschalten));
    leiste.appendChild(knopf("Fertig — Punkte eintragen", "", () => papierFertig(blatt, aufgaben)));
    leiste.appendChild(knopf("abbrechen", "ghost", () => { blatt.papier.laeuft = false; schliessen(); }));

    papierTick(blatt);
  }

  function pauseUmschalten() {
    if (!STAND) return;
    const p = STAND.blatt.papier;
    p.laeuft = !p.laeuft;
    if (p.laeuft) papierTick(STAND.blatt); else papierStop();
    const b = [...$("druckLeiste").querySelectorAll("button")].find(x => /Pause|Weiter/.test(x.textContent));
    if (b) b.textContent = p.laeuft ? "Pause" : "Weiter";
  }

  function papierTick(blatt) {
    papierStop();
    PUHR = setInterval(() => {
      const p = blatt.papier;
      if (!p || !p.laeuft) return;
      p.sekunden++;
      const u = $("papierUhr");
      if (!u) return papierStop();
      u.textContent = String(Math.floor(p.sekunden / 60)).padStart(2, "0") + ":" +
        String(p.sekunden % 60).padStart(2, "0");
      if (p.sekunden % 20 === 0 && window.GENUI && window.GENUI.speichern) window.GENUI.speichern();
    }, 1000);
  }
  function papierStop() { if (PUHR) clearInterval(PUHR); PUHR = null; }

  function papierFertig(blatt, aufgaben) {
    blatt.papier.laeuft = false;
    papierStop();
    const be = aufgaben.reduce((s, a) => s + a.maxPoints, 0);
    const bogen = $("druckBogen");
    bogen.innerHTML = "";

    const s = el("section", "dr-seite dr-eingabe");
    s.appendChild(el("h1", null, "Punkte eintragen"));
    s.appendChild(el("div", "dr-klein",
      "Vergleiche deine Blätter mit dem Lösungsbogen und trage die erreichten Punkte ein. " +
      "Die Zeit wurde mitgeschrieben: " + zeitText(blatt.papier.sekunden) + "."));

    const t = el("table", "dr-verteilung dr-eingabetab");
    t.innerHTML = "<thead><tr><th>Aufgabe</th><th>Thema</th><th class='r'>BE</th><th class='r'>erreicht</th></tr></thead>";
    const tb = el("tbody");
    aufgaben.forEach((a, i) => {
      const tr = el("tr");
      tr.appendChild(el("td", null, String(i + 1)));
      tr.appendChild(el("td", null, a.titel));
      tr.appendChild(el("td", "r", nz(a.maxPoints)));
      const td = el("td", "r");
      const inp = el("input"); inp.type = "text"; inp.inputMode = "decimal";
      inp.className = "dr-punkteingabe";
      inp.value = blatt.papier.punkte[i] == null ? "" : blatt.papier.punkte[i];
      inp.oninput = () => {
        const v = (G.leseZahlen(inp.value)[0]);
        blatt.papier.punkte[i] = v == null ? "" : Math.max(0, Math.min(a.maxPoints, v));
        rechne();
      };
      td.appendChild(inp); tr.appendChild(td);
      tb.appendChild(tr);
    });
    t.appendChild(tb); s.appendChild(t);

    const erg = el("div", "dr-ergebnis"); erg.id = "papierErgebnis";
    s.appendChild(erg);

    const zeile = el("div", "gen-knopfzeile");
    zeile.style.marginTop = "18px";
    zeile.appendChild(knopf("Ergebnis speichern", "primary", () => {
      blatt.papierErgebnis = rechne();
      if (window.GENUI && window.GENUI.speichern) window.GENUI.speichern();
      if (window.toast) window.toast("Papier-Ergebnis gespeichert.");
      schliessen();
      window.schirm("scStart"); window.renderStart();
    }));
    zeile.appendChild(knopf("Lösungsbogen ansehen", "", () => {
      bauen(blatt, aufgaben, { loesung: true });
      window.scrollTo(0, 0);
    }));
    zeile.appendChild(knopf("zurück zum Bogen", "ghost", () => bauen(blatt, aufgaben, { loesung: false })));
    s.appendChild(zeile);
    bogen.appendChild(s);

    const leiste = $("druckLeiste");
    leiste.innerHTML = "";
    leiste.appendChild(el("div", "dr-info", "Papiermodus — Auswertung"));
    leiste.appendChild(el("span", "weit"));
    leiste.appendChild(knopf("schließen", "ghost", schliessen));

    function rechne() {
      const p = Object.keys(blatt.papier.punkte)
        .reduce((s2, k) => s2 + (parseFloat(blatt.papier.punkte[k]) || 0), 0);
      const proz = be ? Math.round(p / be * 100) : 0;
      const n = window.note ? window.note(proz) : { note: "—", text: "" };
      const min = blatt.papier.sekunden / 60;
      const proBE = be ? min / be : 0;
      const hoch = Math.round(proBE * 100);
      const soll = minuten(be);
      const erg2 = {
        punkte: G.runde(p, 2), max: be, prozent: proz, note: n.note,
        sekunden: blatt.papier.sekunden, minutenJeBE: G.runde(proBE, 2), hochrechnung: hoch
      };
      $("papierErgebnis").innerHTML =
        "<div class='dr-kennzahlen'>" +
        kachel(proz + " %", "Ergebnis") +
        kachel(n.note, "IHK-Note") +
        kachel(zeitText(blatt.papier.sekunden), "gebraucht") +
        kachel(nz(G.runde(proBE, 2)) + " min", "je BE") +
        "</div>" +
        "<p class='dr-fazit'>" +
        "Für diesen Bogen waren <b>" + soll + " Minuten</b> vorgesehen, gebraucht hast du <b>" +
        Math.round(min) + "</b>. " +
        "Hochgerechnet auf eine volle Prüfung mit 100 BE wären das <b>" + hoch + " Minuten</b> — " +
        (hoch <= 90
          ? "das passt in die 90 Minuten, mit " + (90 - hoch) + " Minuten Reserve zum Nachdenken."
          : "das sind " + (hoch - 90) + " Minuten zu viel. In der echten Prüfung würdest du " +
            "hinten etwa " + Math.round((hoch - 90) / 0.9) + " BE nicht mehr schaffen — " +
            "übe die Aufgaben, bei denen du am längsten hängst, und lass in der Prüfung " +
            "teure Aufgaben nicht bis zum Schluss liegen.") +
        "</p>";
      return erg2;
    }
    rechne();
  }

  function kachel(gross, klein) {
    return "<div class='dr-kachel'><div class='zahl'>" + gross + "</div><div class='lbl'>" + klein + "</div></div>";
  }

  function zeitText(sek) {
    const m = Math.floor(sek / 60), s = sek % 60;
    return m + " min " + String(s).padStart(2, "0") + " s";
  }

  /* ==================== API ============================================ */
  return { zeige, schliessen, papierStart, minuten, zeitText };
})();
