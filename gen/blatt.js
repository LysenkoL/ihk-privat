/* ============================================================================
   gen/blatt.js — Oberfläche des Aufgaben-Generators ("Arbeitsblätter")
   ----------------------------------------------------------------------------
   Hängt sich an die vorhandene index.html an: legt eine eigene Seite (#scGen)
   an, ergänzt die Startseite um einen Abschnitt und erweitert schirm() und
   renderStart(). An den bestehenden Daten und Speichern wird nichts geändert.
   ========================================================================== */
"use strict";

window.GENUI = (function () {
  const G = window.GEN;
  const $ = id => document.getElementById(id);

  /* ======================= Speicher ===================================== */
  const SK = { blaetter: "ihk2:gen:blaetter", stat: "ihk2:gen:stat", letzte: "ihk2:gen:letzteWahl" };
  const store = {
    get(k, alt) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : alt; } catch { return alt; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } }
  };
  let BLAETTER = store.get(SK.blaetter, []);
  let STAT = store.get(SK.stat, {});
  let BLATT = null;          // aktuell geöffnetes Blatt
  let AUFG = [];             // aufgebaute Aufgabenobjekte des offenen Blatts
  let UHR = null;

  const esc = s => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; };
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const nz = n => G.fmt.kurz(n);
  const heute = () => new Date().toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  function sichern() { store.set(SK.blaetter, BLAETTER.slice(0, 40)); }

  /* ======================= Seite anlegen ================================ */
  function seiteAnlegen() {
    if ($("scGen")) return;
    const s = el("div", "seite");
    s.id = "scGen"; s.hidden = true;
    s.innerHTML = '<div class="abschnitt" id="genInhalt"></div>';
    document.body.insertBefore(s, $("fuss") || null);
  }

  /* ======================= Startseite =================================== */
  function startBox() {
    seiteAnlegen();
    let box = $("genStartBox");
    if (!box) {
      box = el("div", "abschnitt");
      box.id = "genStartBox";
      const ziel = $("themenChips") ? $("themenChips").closest(".abschnitt") : null;
      if (ziel && ziel.parentNode) ziel.parentNode.insertBefore(box, ziel);
      else $("scStart").appendChild(box);
    }
    box.innerHTML = "";

    const kopf = el("div", "gen-kopf");
    const links = el("div");
    links.appendChild(el("h2", null, "Arbeitsblätter — unendlich neue Aufgaben"));
    links.appendChild(el("p", null,
      "Aufgaben nach IHK-Muster, bei jedem Klick mit anderen Zahlen und Daten. Automatisch geprüft."));
    const neu = el("button", "btn primary", "+ Neues Arbeitsblatt");
    neu.onclick = () => assistent();
    kopf.append(links, neu);
    box.appendChild(kopf);

    const themen = G.themenBaum();
    const anzVorlagen = G.alleVorlagen().length;
    const hin = el("div", "gen-hinweis");
    hin.innerHTML = "<b>" + anzVorlagen + " Aufgabentypen</b> in " + themen.length + " Themen. " +
      "Jede Aufgabe wird beim Erzeugen neu gewürfelt — Preise, Adressen, Mengen und Szenarien " +
      "ändern sich, die Musterlösung wird mitgerechnet. " +
      "<b>„Neu würfeln“</b> in jeder Aufgabe gibt dir sofort die nächste Variante desselben Typs.";
    box.appendChild(hin);

    if (BLAETTER.length) {
      /* Bisher standen hier nur die neun neuesten Blätter. Gespeichert sind
         vierzig — eine abgegebene Simulation von vorgestern war damit
         unauffindbar, obwohl sie noch da war. Jetzt sind alle erreichbar,
         und Simulationen lassen sich einzeln herausfiltern.              */
      const sims = BLAETTER.filter(b => b.pruefung);
      const steuer = el("div", "gen-werkzeug");
      const zaehler = el("span", "gen-zaehler");
      steuer.appendChild(zaehler);
      let nurSim = false, alle = false;
      const gitter = el("div", "karten");

      function neuZeichnen() {
        const liste = nurSim ? sims : BLAETTER;
        const zeigen = alle ? liste : liste.slice(0, 9);
        gitter.innerHTML = "";
        zeigen.forEach(b => gitter.appendChild(blattKarte(b)));
        zaehler.textContent = zeigen.length + " von " + liste.length +
          (nurSim ? " Simulationen" : " Arbeitsblättern") +
          (sims.length && !nurSim ? " · davon " + sims.length + " Simulationen" : "");
        mehr.hidden = liste.length <= 9;
        mehr.textContent = alle ? "nur die neuesten neun" : "alle " + liste.length + " zeigen";
      }
      const filter = el("button", "btn ghost klein", "nur Simulationen");
      filter.hidden = !sims.length;
      filter.onclick = () => {
        nurSim = !nurSim;
        filter.textContent = nurSim ? "alle Arbeitsblätter" : "nur Simulationen";
        neuZeichnen();
      };
      const mehr = el("button", "btn ghost klein", "");
      mehr.onclick = () => { alle = !alle; neuZeichnen(); };
      steuer.append(filter, mehr);
      box.appendChild(steuer);
      box.appendChild(gitter);
      neuZeichnen();
    } else {
      const leer = el("div", "leer-hinweis",
        "Noch kein Arbeitsblatt. Wähle oben ein Thema — in zehn Sekunden hast du zehn frische Aufgaben.");
      box.appendChild(leer);
    }

    const zb = zeitBox();
    if (zb) box.appendChild(zb);
    if (BLAETTER.length > 1) box.appendChild(schwaechen());
  }

  function blattKarte(b) {
    const k = el("div", "gen-karte" + (b.bewertet ? " fertig" : ""));
    k.appendChild(el("h3", null, b.titel));
    const m = el("div", "meta");
    /* Die Prozentzahl auf der Karte rechnet jetzt über das Beurteilte, nicht
       über das ganze Blatt — sonst steht bei einem halb bearbeiteten Blatt
       eine Zahl, die niemand so gemeint hat.                            */
    const bl = bilanz(b);
    m.textContent = b.aufgaben.length + " Aufgaben · " + nz(b.maxPoints) + " BE" +
      (bl.geprueft && bl.quote != null
        ? " · " + nz(bl.zaehler) + " von " + nz(bl.nenner) + " BE bewertet (" +
          Math.round(bl.quote * 100) + " %)" +
          (bl.offenBe > 0 ? " · " + nz(bl.offenBe) + " BE offen" : "") +
          (bl.teilweise && bl.modus === "uebung" ? " · nur teilweise bearbeitet" : "")
        : "");
    k.appendChild(m);
    if (b.themenLabel) k.appendChild(el("div", "meta", b.themenLabel));
    if (b.papierErgebnis) {
      const pe = b.papierErgebnis;
      const z = el("div", "meta");
      z.innerHTML = "<b>Auf Papier:</b> " + pe.prozent + " % · Note " + pe.note + " · " +
        Math.round(pe.sekunden / 60) + " min (" + nz(pe.minutenJeBE) + " min je BE)";
      k.appendChild(z);
    }

    const fuss = el("div", "fuss");
    fuss.appendChild(el("span", "datum", b.erstellt));
    const rechts = el("div");
    rechts.style.cssText = "display:flex;gap:6px";
    const oef = el("button", "btn klein", "Öffnen");
    oef.onclick = () => oeffne(b.id);
    const wg = el("button", "btn ghost klein", "löschen");
    wg.onclick = () => {
      if (!confirm("Arbeitsblatt „" + b.titel + "\" löschen?")) return;
      /* Vorher ins Archiv — die Antworten sollen das Löschen überleben. */
      try {
        if (b.antworten && Object.keys(b.antworten).length) archivieren("vor dem Löschen", b);
      } catch (e) { console.error("Archiv:", e); }
      BLAETTER = BLAETTER.filter(x => x.id !== b.id); sichern(); startBox();
    };
    rechts.append(oef, wg);
    fuss.appendChild(rechts);
    k.appendChild(fuss);
    return k;
  }


  /** Zeitgefühl aus den Papier-Durchgängen */
  function zeitBox() {
    const laeufe = BLAETTER.filter(b => b.papierErgebnis && b.papierErgebnis.sekunden > 120);
    if (!laeufe.length) return null;
    const be = laeufe.reduce((s, b) => s + b.papierErgebnis.max, 0);
    const sek = laeufe.reduce((s, b) => s + b.papierErgebnis.sekunden, 0);
    const proBE = sek / 60 / Math.max(1, be);
    const hoch = Math.round(proBE * 100);
    const punkte = laeufe.reduce((s, b) => s + b.papierErgebnis.punkte, 0);
    const proz = Math.round(punkte / Math.max(1, be) * 100);

    const box = el("div");
    box.style.marginTop = "22px";
    box.appendChild(el("h2", null, "Auf Papier — dein Tempo"));
    box.appendChild(el("p", null,
      laeufe.length + " Durchgang" + (laeufe.length > 1 ? "e" : "") + " mit Stoppuhr, " +
      nz(be) + " BE insgesamt."));
    const h = el("div", "hero");
    h.innerHTML =
      '<div><span class="eyebrow">Minuten je BE</span><div class="zahl">' + nz(G.runde(proBE, 2)) + "</div></div>" +
      '<div><span class="eyebrow">Hochrechnung auf 100 BE</span><div class="neben">' + hoch + " min</div></div>" +
      '<div><span class="eyebrow">Trefferquote</span><div class="neben">' + proz + " %</div></div>" +
      '<div class="txt">' +
      (hoch <= 90
        ? "Du liegst im Zeitrahmen: 100 BE wären in <b>" + hoch + " Minuten</b> geschafft, " +
          (90 - hoch) + " Minuten blieben als Reserve."
        : "Zu langsam für 90 Minuten: 100 BE würden <b>" + hoch + " Minuten</b> dauern. " +
          "Rund <b>" + Math.round((hoch - 90) / 0.9) + " BE</b> bliebest du in der echten Prüfung liegen — " +
          "übe die Aufgabentypen, bei denen du hängst, und arbeite die teuren Aufgaben zuerst ab.") +
      "</div>";
    box.appendChild(h);
    return box;
  }

  /** kleine Auswertung: welche Aufgabentypen laufen schlecht? */
  function schwaechen() {
    const zeilen = Object.keys(STAT).map(id => {
      const s = STAT[id], v = G.vorlageVon(id);
      if (!v || !s.max) return null;
      return { id, titel: v.titel, thema: (G.HAUPT_LABEL && G.HAUPT_LABEL[G.hauptVon(v)]) || G.THEMEN_LABEL[v.thema] || v.thema, quote: s.punkte / s.max, n: s.versuche };
    }).filter(Boolean).filter(x => x.n >= 1).sort((a, b) => a.quote - b.quote).slice(0, 6);
    const box = el("div");
    box.style.marginTop = "22px";
    if (!zeilen.length) return box;
    box.appendChild(el("h2", null, "Woran es im Generator hakt"));
    box.appendChild(el("p", null, "Sortiert nach deiner Quote. Ein Klick startet ein Blatt nur mit diesem Aufgabentyp."));
    const t = el("table", "tab");
    t.innerHTML = "<thead><tr><th>Aufgabentyp</th><th>Thema</th><th>Versuche</th><th>Quote</th><th></th></tr></thead>";
    const tb = el("tbody");
    zeilen.forEach(z => {
      const tr = el("tr");
      tr.innerHTML = "<td>" + esc(z.titel) + "</td><td>" + esc(z.thema) + "</td>" +
        '<td class="z">' + z.n + '</td><td class="z">' + Math.round(z.quote * 100) + " %</td>";
      const td = el("td");
      const b = el("button", "btn ghost klein", "gezielt üben");
      b.onclick = () => erzeugeBlatt({ ids: [z.id], anzahl: 5, titel: z.titel + " — gezielt" });
      td.appendChild(b); tr.appendChild(td);
      tb.appendChild(tr);
    });
    t.appendChild(tb); box.appendChild(t);
    return box;
  }

  /* ======================= Assistent ==================================== */
  /* Ein Schirm statt drei Schritten. Kein 1–3-Limit mehr: alles ist
     vorausgewählt, du legst die Anzahl fest und hakst nur ab, was heute
     NICHT drankommen soll.                                              */

  let wahl = {
    modus: "gezielt",        // "zufall" | "gezielt"
    themenAus: [],           // abgewählte Hauptthemen
    subsAus: [],             // abgewählte Unterthemen
    offen: [],               // aufgeklappte Hauptthemen
    anzahl: 10, stufen: [], zeit: 1
  };

  function assistent() {
    const letzte = store.get(SK.letzte, null) || {};
    wahl = {
      modus: letzte.modus || "gezielt",
      themenAus: (letzte.themenAus || []).slice(),
      subsAus: (letzte.subsAus || []).slice(),
      offen: [],
      anzahl: letzte.anzahl || 10,
      stufen: letzte.stufen || [],
      zeit: letzte.zeit == null ? 1 : letzte.zeit
    };
    schirmGen();
    zeichneAssistent();
  }

  function schirmGen() { seiteAnlegen(); window.schirm("scGen"); }
  function kopfTitel(eyebrow, titel) {
    $("kEyebrow").textContent = eyebrow;
    $("kTitel").textContent = titel;
  }

  /* --- Auswahl -> Liste der erlaubten Vorlagen ------------------------- */
  function gewaehlteVorlagen() {
    let p = G.alleVorlagen();
    if (wahl.modus === "gezielt") {
      p = p.filter(v => !wahl.themenAus.includes(G.hauptVon(v)) && !wahl.subsAus.includes(v.sub));
    }
    if (wahl.stufen.length) p = p.filter(v => wahl.stufen.includes(v.stufe));
    return p;
  }

  function zeichneAssistent() {
    kopfTitel("Generator", "Neues Arbeitsblatt");
    const w = $("genInhalt"); w.innerHTML = "";
    const k = el("div", "gen-schritt");

    /* ---------- 1. Umfang ---------- */
    k.appendChild(el("h3", null, "Wie viele Aufgaben?"));
    k.appendChild(el("p", null,
      "Für 90 Prüfungsminuten sind rund 100 BE realistisch — das sind etwa 20–25 Aufgaben. Ein Übungsblatt darf kürzer sein."));

    const steuer = el("div", "steuer");

    const fAnz = el("div", "feld");
    fAnz.appendChild(el("span", "eyebrow", "Anzahl Aufgaben"));
    const inAnz = el("input"); inAnz.type = "number"; inAnz.min = 1; inAnz.max = 60; inAnz.value = wahl.anzahl;
    fAnz.appendChild(inAnz);
    const schnell = el("div", "gen-schnell");
    [5, 10, 15, 20, 25, 40].forEach(n => {
      const b = el("button", "chip", String(n));
      b.onclick = () => { inAnz.value = n; wahl.anzahl = n; stand(); };
      schnell.appendChild(b);
    });
    fAnz.appendChild(schnell);

    const fStufe = el("div", "feld");
    fStufe.appendChild(el("span", "eyebrow", "Schwierigkeit"));
    const selStufe = el("select");
    [["", "alle Stufen"], ["1", "Aufwärmen (leicht)"], ["2", "Prüfungsniveau"], ["3", "knifflig"]]
      .forEach(([v, t]) => { const o = el("option", null, t); o.value = v; selStufe.appendChild(o); });
    selStufe.value = wahl.stufen.length ? String(wahl.stufen[0]) : "";
    fStufe.appendChild(selStufe);

    const fZeit = el("div", "feld");
    fZeit.appendChild(el("span", "eyebrow", "Zeit"));
    const selZeit = el("select");
    [["0", "ohne Uhr"], ["1", "Uhr mitlaufen lassen"], ["2", "Prüfungszeit (0,9 min je BE)"]]
      .forEach(([v, t]) => { const o = el("option", null, t); o.value = v; selZeit.appendChild(o); });
    selZeit.value = String(wahl.zeit);
    fZeit.appendChild(selZeit);

    steuer.append(fAnz, fStufe, fZeit);
    k.appendChild(steuer);

    /* ---------- 2. Modus ---------- */
    const modus = el("div", "gen-modus");
    const karten = [
      { key: "zufall", titel: "Zufall — alles gemischt", text: "Aus allen " + G.alleVorlagen().length + " Aufgabentypen, quer über alle Themen. Wie in der echten Prüfung: du weißt vorher nicht, was kommt." },
      { key: "gezielt", titel: "Gezielt auswählen", text: "Alle Themen sind angehakt. Nimm die Haken weg bei allem, was heute nicht drankommen soll." }
    ];
    karten.forEach(m => {
      const kar = el("button", "gen-moduskarte" + (wahl.modus === m.key ? " an" : ""));
      kar.type = "button";
      kar.appendChild(el("div", "mt", m.titel));
      kar.appendChild(el("div", "mx", m.text));
      kar.onclick = () => { wahl.modus = m.key; zeichneAssistentErhalten(inAnz, selStufe, selZeit); };
      modus.appendChild(kar);
    });
    k.appendChild(modus);

    /* ---------- 3. Themenbaum (nur im gezielten Modus) ---------- */
    const baumBox = el("div", "gen-baum");
    if (wahl.modus === "gezielt") {
      const themen = G.themenBaum();

      const werkzeug = el("div", "gen-werkzeug");
      const bAlle = el("button", "btn ghost klein", "alle anhaken");
      bAlle.onclick = () => { wahl.themenAus = []; wahl.subsAus = []; zeichneAssistentErhalten(inAnz, selStufe, selZeit); };
      const bKeins = el("button", "btn ghost klein", "alle abwählen");
      bKeins.onclick = () => {
        wahl.themenAus = themen.map(t => t.key); wahl.subsAus = [];
        zeichneAssistentErhalten(inAnz, selStufe, selZeit);
      };
      const bSchwach = el("button", "btn ghost klein", "nur meine Schwächen");
      bSchwach.onclick = () => {
        const schwach = schwacheIds();
        if (!schwach.length) { hinweisZeile.textContent = "Noch zu wenig Statistik — löse erst ein paar Aufgaben."; return; }
        erzeugeBlatt({ ids: schwach, anzahl: Math.max(1, Math.min(60, +inAnz.value || 10)),
                       stufen: [], zeit: +selZeit.value, titel: "Meine Schwächen" });
      };
      werkzeug.append(bAlle, bKeins, bSchwach);
      baumBox.appendChild(werkzeug);

      themen.forEach(t => {
        const anT = !wahl.themenAus.includes(t.key);
        const zeile = el("div", "wahlzeile gross" + (anT ? " an" : ""));
        const lab = el("label", "wz-haupt");
        const cb = el("input"); cb.type = "checkbox"; cb.checked = anT;
        cb.onchange = () => {
          if (cb.checked) {
            wahl.themenAus = wahl.themenAus.filter(x => x !== t.key);
            wahl.subsAus = wahl.subsAus.filter(x => !t.subs.some(s => s.key === x));
          } else {
            wahl.themenAus.push(t.key);
          }
          zeichneAssistentErhalten(inAnz, selStufe, selZeit);
        };
        const txt = el("div", "txt");
        const name = el("div", "name");
        name.appendChild(el("span", null, t.label));
        const aktiv = t.subs.filter(s => anT && !wahl.subsAus.includes(s.key)).reduce((n, s) => n + s.n, 0);
        name.appendChild(el("span", "zahl", aktiv === t.n ? t.n + " Aufgaben" : aktiv + " von " + t.n + " Aufgaben"));
        txt.appendChild(name);
        txt.appendChild(el("div", "unter", t.subs.slice(0, 4).map(s => s.label).join(" · ")));
        lab.append(cb, txt);
        zeile.appendChild(lab);

        const auf = el("button", "wz-auf", wahl.offen.includes(t.key) ? "▲ Unterthemen" : "▼ Unterthemen (" + t.subs.length + ")");
        auf.type = "button";
        auf.onclick = () => {
          wahl.offen = wahl.offen.includes(t.key) ? wahl.offen.filter(x => x !== t.key) : wahl.offen.concat(t.key);
          zeichneAssistentErhalten(inAnz, selStufe, selZeit);
        };
        zeile.appendChild(auf);
        baumBox.appendChild(zeile);

        if (wahl.offen.includes(t.key)) {
          const sBox = el("div", "wz-subs");
          t.subs.forEach(s => {
            const anS = anT && !wahl.subsAus.includes(s.key);
            const sl = el("label", "wahlzeile klein" + (anS ? " an" : ""));
            const scb = el("input"); scb.type = "checkbox"; scb.checked = anS; scb.disabled = !anT;
            scb.onchange = () => {
              if (scb.checked) wahl.subsAus = wahl.subsAus.filter(x => x !== s.key);
              else wahl.subsAus.push(s.key);
              zeichneAssistentErhalten(inAnz, selStufe, selZeit);
            };
            const st = el("div", "txt");
            const sn = el("div", "name");
            sn.appendChild(el("span", null, s.label));
            sn.appendChild(el("span", "zahl", s.n + (s.n === 1 ? " Aufgabe" : " Aufgaben")));
            st.appendChild(sn);
            sl.append(scb, st);
            sBox.appendChild(sl);
          });
          baumBox.appendChild(sBox);
        }
      });
    }
    k.appendChild(baumBox);

    /* ---------- 4. Fuß ---------- */
    const vorschau = el("div", "gen-zaehler");
    const hinweisZeile = el("div", "gen-zaehler");
    k.appendChild(vorschau);
    k.appendChild(hinweisZeile);

    const zeile = el("div", "gen-knopfzeile");
    const los = el("button", "btn primary", "Arbeitsblatt erzeugen");
    const zurueck = el("button", "btn ghost", "abbrechen");
    zurueck.onclick = () => window.schirm("scStart");
    zeile.append(los, el("span", "weit"), zurueck);
    k.appendChild(zeile);
    w.appendChild(k);

    function stand() {
      wahl.anzahl = Math.max(1, Math.min(60, +inAnz.value || 10));
      wahl.stufen = selStufe.value ? [+selStufe.value] : [];
      wahl.zeit = +selZeit.value;
      const pool = gewaehlteVorlagen();
      const beSchnitt = 4.5;
      vorschau.textContent = pool.length
        ? pool.length + " passende Aufgabentypen · " + wahl.anzahl + " Aufgaben · geschätzt " + Math.round(wahl.anzahl * beSchnitt) + " BE"
        : "Zu dieser Auswahl gibt es keine Aufgaben — hake wieder etwas an oder lockere die Schwierigkeit.";
      los.disabled = !pool.length;
    }
    inAnz.oninput = stand;
    selStufe.onchange = () => { wahl.stufen = selStufe.value ? [+selStufe.value] : []; stand(); };
    selZeit.onchange = stand;
    stand();

    los.onclick = () => {
      stand();
      const pool = gewaehlteVorlagen();
      if (!pool.length) return;
      store.set(SK.letzte, {
        modus: wahl.modus, themenAus: wahl.themenAus, subsAus: wahl.subsAus,
        anzahl: wahl.anzahl, stufen: wahl.stufen, zeit: wahl.zeit
      });
      const opt = { anzahl: wahl.anzahl, stufen: wahl.stufen, zeit: wahl.zeit };
      /* Im Zufallsmodus keine Filter — dann fällt später auch Neues automatisch rein. */
      if (wahl.modus === "gezielt" && (wahl.themenAus.length || wahl.subsAus.length)) {
        opt.ids = pool.map(v => v.id);
        opt.titel = titelAusWahl();
      }
      erzeugeBlatt(opt);
    };
  }

  /* Neu zeichnen, ohne die drei Eingabefelder oben zu verlieren */
  function zeichneAssistentErhalten(inAnz, selStufe, selZeit) {
    wahl.anzahl = Math.max(1, Math.min(60, +inAnz.value || 10));
    wahl.stufen = selStufe.value ? [+selStufe.value] : [];
    wahl.zeit = +selZeit.value;
    zeichneAssistent();
  }

  function titelAusWahl() {
    const themen = G.themenBaum().filter(t => !wahl.themenAus.includes(t.key));
    if (!themen.length) return "Arbeitsblatt";
    if (themen.length <= 2) return themen.map(t => t.label).join(" + ");
    if (themen.length >= G.themenBaum().length) return "Alles gemischt";
    return themen.length + " Themen gemischt";
  }

  /** Vorlagen-IDs, bei denen die Quote unter 70 % liegt */
  function schwacheIds() {
    return Object.keys(STAT).map(id => {
      const s = STAT[id], v = G.vorlageVon(id);
      if (!v || !s.max || !s.versuche) return null;
      return { id, quote: s.punkte / s.max };
    }).filter(Boolean).filter(x => x.quote < 0.7).sort((a, b) => a.quote - b.quote).slice(0, 12).map(x => x.id);
  }

  /* ======================= Blatt erzeugen =============================== */
  function erzeugeBlatt(opt) {
    /* opt.liste = fertige [{vorlageId, saat}] — daran hängt die
       Prüfungssimulation, die ihre Aufgaben selbst nach BE zusammenstellt. */
    const res = opt.liste && opt.liste.length
      ? (function () {
          const auf = opt.liste.map(x => G.erzeuge(x.vorlageId, x.saat));
          return { aufgaben: auf, maxPoints: G.runde(auf.reduce((s, a) => s + a.maxPoints, 0), 2) };
        })()
      : G.erzeugeBlatt(opt);
    if (!res.aufgaben.length) { window.toast(res.fehler || "Keine passenden Aufgaben."); return; }
    const themen = [...new Set(res.aufgaben.map(a => a.themaLabel))];
    const b = {
      id: "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      titel: opt.titel || (themen.length === 1 ? themen[0] : (themen.length > 2 ? "Gemischtes Blatt" : themen.join(" · "))),
      themenLabel: themen.join(" · "),
      erstellt: heute(),
      opt: { themen: opt.themen || [], subs: opt.subs || [], stufen: opt.stufen || [], anzahl: res.aufgaben.length, ids: opt.ids || [] },
      aufgaben: res.aufgaben.map(a => ({ vorlageId: a.vorlageId, saat: a.saat })),
      maxPoints: res.maxPoints,
      punkte: 0, bewertet: false,
      antworten: {}, ergebnisse: {}, selbst: {},
      zeit: opt.zeit == null ? 1 : opt.zeit,
      sekunden: 0,
      pruefung: !!opt.pruefung,        /* Prüfungssimulation: Lösungen gesperrt */
      minuten: opt.minuten || 0
    };
    BLAETTER.unshift(b); sichern();
    oeffne(b.id);
  }

  function oeffne(id) {
    const b = BLAETTER.find(x => x.id === id);
    if (!b) return;
    BLATT = b;
    AUFG = b.aufgaben.map(x => G.erzeuge(x.vorlageId, x.saat));
    b.maxPoints = G.runde(AUFG.reduce((s, a) => s + a.maxPoints, 0), 2);
    schirmGen();
    zeichne();
    uhrStart();
  }

  /* ======================= Blatt zeichnen =============================== */
  function zeichne() {
    kopfTitel("Arbeitsblatt · " + AUFG.length + " Aufgaben", BLATT.titel);
    const w = $("genInhalt"); w.innerHTML = "";
    w.appendChild(leiste());
    const liste = el("div");
    liste.id = "genListe";
    AUFG.forEach((a, i) => liste.appendChild(aufgabeEl(a, i)));
    w.appendChild(liste);
    w.appendChild(zusammenfassung());
    standAktualisieren();
  }

  function leiste() {
    const l = el("div", "gen-leiste");
    const stand = el("div", "stand"); stand.id = "genStand";
    l.appendChild(stand);
    const uhr = el("div", "gen-uhr"); uhr.id = "genUhr"; uhr.textContent = "--:--";
    uhr.hidden = !BLATT.zeit;
    l.appendChild(uhr);
    l.appendChild(el("span", "weit"));

    const knopf = (txt, cls, fn) => { const b = el("button", "btn " + cls, txt); b.onclick = fn; return b; };

    /* Prüfungssimulation: bis zur Abgabe gibt es weder Prüfen noch Lösungen —
       sonst ist es keine Prüfung, sondern wieder eine Übung.               */
    if (BLATT.pruefung && !BLATT.abgegeben) {
      l.appendChild(knopf("Abgeben und auswerten", "primary", () => {
        if (!confirm("Prüfung abgeben? Danach werden alle Aufgaben bewertet und die Lösungen freigegeben.")) return;
        abgeben();
      }));
      /* Drucken gehört auch in die laufende Simulation: In der echten Prüfung
         liegt der Bogen auf Papier, und viele rechnen lieber daneben als im
         Textfeld. Der Bogen wird ohne Lösungen gesetzt — gesperrt bleibt nur,
         was die Prüfung entwerten würde.                                  */
      l.appendChild(knopf("Bogen drucken", "", () => {
        if (window.GENDRUCK) window.GENDRUCK.zeige(BLATT, AUFG, { loesung: false });
        else window.print();
      }));
      const hin = el("span");
      hin.style.cssText = "font-size:12.5px;color:var(--muted)";
      hin.textContent = "Lösungen und Einzelprüfung sind bis zur Abgabe gesperrt.";
      l.appendChild(hin);
      l.appendChild(knopf("abbrechen", "ghost", () => { uhrStop(); window.schirm("scStart"); window.renderStart(); }));
      return l;
    }

    l.appendChild(knopf("Alles prüfen", "primary", () => { AUFG.forEach((_, i) => pruefe(i, true)); standAktualisieren(); abschluss(); }));
    l.appendChild(knopf("Alle Lösungen", "", () => AUFG.forEach((_, i) => loesungZeigen(i))));
    l.appendChild(knopf("Neues Blatt, gleiche Themen", "", () => {
      const o = BLATT.opt;
      erzeugeBlatt({ themen: o.themen, subs: o.subs, stufen: o.stufen, anzahl: o.anzahl, ids: o.ids, zeit: BLATT.zeit });
    }));
    l.appendChild(knopf("Prüfungsbogen (PDF)", "", () => {
      if (window.GENDRUCK) window.GENDRUCK.zeige(BLATT, AUFG, { loesung: false });
      else window.print();
    }));
    l.appendChild(knopf("Papiermodus", "", () => {
      if (!window.GENDRUCK) return window.toast("Druckmodul nicht geladen.");
      window.GENDRUCK.papierStart(BLATT, AUFG);
    }));
    l.appendChild(knopf("Markdown", "ghost klein", markdownExport));
    l.appendChild(knopf("← Übersicht", "ghost", () => { uhrStop(); window.schirm("scStart"); window.renderStart(); }));
    return l;
  }

  function aufgabeEl(a, i) {
    const karte = el("article", "gaufgabe");
    karte.id = "gauf-" + i;
    const gitter = el("div", "gaufgabe-in");
    const haupt = el("div", "haupt");

    /* Kopfzeile */
    const nr = el("div", "tk-nr");
    nr.appendChild(el("span", null, "Aufgabe " + (i + 1) + " · " + a.titel));
    const th = el("span", "thema", a.themaLabel); nr.appendChild(th);
    const sb = el("span", "thema", a.sub); nr.appendChild(sb);
    if (a.stufe === 3) { const s = el("span", "marke-katalog reduziert", "knifflig"); nr.appendChild(s); }
    haupt.appendChild(nr);

    if (a.katalog && a.katalog.status === "veraltet") {
      const hw = el("div", "katalog-hinweis");
      hw.innerHTML = "<div><b>Kannst du überspringen.</b> " + esc((a.katalog.themen || []).join(", ")) +
        " — " + esc(a.katalog.grund || "") + "</div>";
      haupt.appendChild(hw);
    }

    if (a.situation) haupt.appendChild(el("div", "gsituation", a.situation));
    if (a.code) haupt.appendChild(el("pre", "gcode", a.code));
    (a.tabellen || []).forEach(t => haupt.appendChild(datenTabelle(t)));
    haupt.appendChild(el("div", "gfrage", a.prompt));
    if (a.hinweis) haupt.appendChild(el("div", "hinweis", a.hinweis));

    /* Felder */
    const fbox = el("div");
    fbox.id = "gfelder-" + i;
    a.felder.forEach(f => fbox.appendChild(feldEl(f, i)));
    haupt.appendChild(fbox);

    /* Werkzeuge */
    const wz = el("div", "gwerkzeug");
    if (!(BLATT.pruefung && !BLATT.abgegeben)) {
      const bp = el("button", "btn primary klein", "Prüfen");
      bp.onclick = () => { pruefe(i); standAktualisieren(); };
      const bl = el("button", "btn klein", "Lösung zeigen");
      bl.onclick = () => loesungZeigen(i);
      const bn = el("button", "btn ghost klein", "↻ Neu würfeln");
      bn.onclick = () => neuWuerfeln(i);
      wz.append(bp, bl, bn);
    }
    haupt.appendChild(wz);

    const rueck = el("div"); rueck.id = "grueck-" + i;
    haupt.appendChild(rueck);

    const merk = el("div", "gmerksatz"); merk.id = "gmerk-" + i; merk.hidden = true;
    if (a.merksatz) merk.innerHTML = "<b>Merksatz</b>" + esc(a.merksatz);
    haupt.appendChild(merk);

    if (!(BLATT.pruefung && !BLATT.abgegeben)) {
      const det = el("details", "gloesung"); det.id = "gloes-" + i;
      det.appendChild(el("summary", null, "Musterlösung mit Rechenweg"));
      /* Bei einem gezeichneten Diagramm ist die Musterlösung das fertige
         Bild — eine Liste von Kanten sagt einem nichts.               */
      const fb = (a.felder || []).find(x => x.typ === "flussbild");
      if (fb && window.GENFLUSS) det.appendChild(window.GENFLUSS.bau(fb, {}, () => { }, true));
      det.appendChild(el("div", "txt", a.loesung));
      haupt.appendChild(det);
    }

    /* Randspalte */
    const rand = el("div", "rand"); rand.id = "grand-" + i;
    rand.appendChild(el("div", "rand-lbl", "Punkte"));
    const wert = el("div", "wert");
    wert.innerHTML = "—<small>von " + nz(a.maxPoints) + " BE</small>";
    rand.appendChild(wert);

    gitter.append(haupt, rand);
    karte.appendChild(gitter);
    return karte;
  }

  function datenTabelle(t) {
    const wrap = el("div", "gtab-rollen");
    const tab = el("table", "gdaten");
    if (t.titel) { const c = el("caption", null, t.titel); tab.appendChild(c); }
    const thead = el("thead"), trh = el("tr");
    (t.kopf || []).forEach(h => trh.appendChild(el("th", null, h)));
    thead.appendChild(trh); tab.appendChild(thead);
    const tb = el("tbody");
    (t.zeilen || []).forEach(z => {
      const tr = el("tr");
      z.forEach(c => tr.appendChild(el("td", null, c)));
      tb.appendChild(tr);
    });
    tab.appendChild(tb); wrap.appendChild(tab);
    return wrap;
  }

  /* ======================= Felder ======================================= */
  function antwortSetzen(i, nr, wert) {
    BLATT.antworten[i] = BLATT.antworten[i] || {};
    BLATT.antworten[i][nr] = wert;
    clearTimeout(antwortSetzen._t);
    antwortSetzen._t = setTimeout(sichern, 500);
  }
  function antwortLesen(i, nr) {
    return (BLATT.antworten[i] || {})[nr];
  }

  /* Welche Tastatur soll auf dem Handy aufgehen?
     Rasterzellen sind entweder Rechenergebnisse (haben `loesung`/`dez`) oder
     Text (haben `text` mit den erlaubten Formulierungen). Bisher stand überall
     inputMode="decimal" — bei „Wofür stehen die fünf Buchstaben?“ kam damit
     ein Ziffernblock, auf dem sich „spezifisch“ nicht tippen lässt.
     Reine Zahlen-mit-Trennzeichen (IP-Adressen, Subnetzmasken, Uhrzeiten)
     bekommen trotzdem den Ziffernblock — dort ist er die schnellere Tastatur. */
  const NUR_ZIFFERN = /^[\d\s.,:%/+-]+$/;
  function tastatur(zelle) {
    if (zelle.loesung != null || zelle.dez != null) return "decimal";
    const t = zelle.text || zelle.erwartet;
    if (Array.isArray(t) && t.length && t.every(x => NUR_ZIFFERN.test(String(x)))) return "decimal";
    return "text";
  }

  function feldEl(f, i) {
    const box = el("div", "gfeld");
    box.dataset.nr = f.nr;
    /* Beschriftung und Eingabefeld werden über for/id verknüpft. Das ist
       nicht nur für Screenreader wichtig: ein Klick auf die Beschriftung
       springt dann ins Feld, und das trifft man mit dem Daumen leichter
       als ein schmales Eingabefeld. Bei Auswahlfeldern umschließt das
       label seinen Knopf ohnehin schon — dort ist nichts zu tun.        */
    const fid = "gf-" + i + "-" + f.nr;
    const lab = el("label", "gl");
    lab.htmlFor = fid;
    lab.innerHTML = "<b>" + esc(f.label) + "</b> " +
      (f.typ === "rechenweg"
        ? "<span class=\"be weg\">zählt über die Folgefehlerregel</span>"
        : "<span class=\"be\">(" + nz(f.be) + " BE)</span>");
    box.appendChild(lab);
    const alt = antwortLesen(i, f.nr);

    /* Das erste echte Eingabefeld im Kasten bekommt die id des labels.
       Felder, die aus vielen Teilen bestehen (Tabelle, Zuordnung), lassen
       das label als Gruppenüberschrift stehen und beschriften ihre Teile
       selbst — dafür ist unten aria-label gesetzt.                      */
    const idGeben = e => { if (e && !e.id) e.id = fid; return e; };

    if (f.typ === "rechenweg") {
      box.classList.add("gweg");
      if (f.hilfe) box.appendChild(el("div", "gweg-hilfe", f.hilfe));
      const ta = idGeben(el("textarea", "gweg-feld"));
      ta.rows = f.zeilen || 6;
      ta.spellcheck = false;
      ta.placeholder =
        "1.299,00 € ÷ 36 = 36,08 €\n" +
        "36,08 + 3,94 = 40,02 €\n" +
        "40,02 × 24 Plätze = 960,48 €\n…";
      ta.value = alt == null ? "" : alt;
      ta.oninput = () => antwortSetzen(i, f.nr, ta.value);
      box.appendChild(ta);

    } else if (f.typ === "zahl") {
      const zeile = el("div", "geingabe");
      const inp = idGeben(el("input")); inp.type = "text"; inp.inputMode = "decimal";
      inp.placeholder = "Ergebnis eintragen";
      inp.value = alt == null ? "" : alt;
      inp.oninput = () => antwortSetzen(i, f.nr, inp.value);
      zeile.appendChild(inp);
      if (f.einheit) zeile.appendChild(el("span", "einheit", f.einheit));
      box.appendChild(zeile);

    } else if (f.typ === "auswahl") {
      const g = el("div", "gwahl");
      f.optionen.forEach((o, k) => {
        const l = el("label");
        const r = el("input"); r.type = "radio"; r.name = "g" + i + "-" + f.nr; r.value = o;
        if (String(alt) === String(o)) r.checked = true;
        r.onchange = () => antwortSetzen(i, f.nr, o);
        l.append(r, el("span", null, o));
        g.appendChild(l);
      });
      box.appendChild(g);

    } else if (f.typ === "mehrfachwahl") {
      const g = el("div", "gwahl");
      const gew = Array.isArray(alt) ? alt.slice() : [];
      f.optionen.forEach(o => {
        const l = el("label");
        const r = el("input"); r.type = "checkbox"; r.value = o;
        if (gew.includes(o)) r.checked = true;
        r.onchange = () => {
          const now = [...g.querySelectorAll("input:checked")].map(x => x.value);
          antwortSetzen(i, f.nr, now);
        };
        l.append(r, el("span", null, o));
        g.appendChild(l);
      });
      box.appendChild(g);

    } else if (f.typ === "aussagen") {
      const t = el("table", "gwf");
      t.innerHTML = "<thead><tr><th>Aussage</th><th>richtig / falsch</th></tr></thead>";
      const tb = el("tbody");
      const gew = alt || {};
      f.aussagen.forEach((a, k) => {
        const tr = el("tr"); tr.dataset.k = k;
        tr.appendChild(el("td", null, a.text));
        const td = el("td");
        const wf = el("div", "wf");
        [["w", "richtig"], ["f", "falsch"]].forEach(([v, txt]) => {
          const l = el("label");
          const r = el("input"); r.type = "radio"; r.name = "wf" + i + "-" + f.nr + "-" + k; r.value = v;
          if (gew[k] === v) r.checked = true;
          r.onchange = () => {
            const o = Object.assign({}, antwortLesen(i, f.nr) || {});
            o[k] = v; antwortSetzen(i, f.nr, o);
          };
          l.append(r, el("span", null, txt));
          wf.appendChild(l);
        });
        td.appendChild(wf); tr.appendChild(td); tb.appendChild(tr);
      });
      t.appendChild(tb); box.appendChild(t);

    } else if (f.typ === "zuordnung") {
      const t = el("table", "gzuo");
      const tb = el("tbody");
      const gew = alt || {};
      f.paare.forEach((p, k) => {
        const tr = el("tr"); tr.dataset.k = k;
        tr.appendChild(el("td", null, p[0]));
        const td = el("td"); td.style.width = "38%";
        const s = el("select");
        const leer = el("option", null, "— wählen —"); leer.value = ""; s.appendChild(leer);
        f.optionen.forEach(o => { const op = el("option", null, o); op.value = o; s.appendChild(op); });
        if (gew[k]) s.value = gew[k];
        s.onchange = () => {
          const o = Object.assign({}, antwortLesen(i, f.nr) || {});
          o[k] = s.value; antwortSetzen(i, f.nr, o);
        };
        td.appendChild(s); tr.appendChild(td); tb.appendChild(tr);
      });
      t.appendChild(tb); box.appendChild(t);

    } else if (f.typ === "raster") {
      const wrap = el("div", "gtab-rollen");
      const t = el("table", "graster");
      if (f.kopf) {
        const thead = el("thead"), tr = el("tr");
        f.kopf.forEach(h => tr.appendChild(el("th", null, h)));
        thead.appendChild(tr); t.appendChild(thead);
      }
      const tb = el("tbody");
      const gew = alt || {};
      f.zeilen.forEach((z, zi) => {
        const tr = el("tr");
        z.zellen.forEach((c, ci) => {
          const td = el("td");
          if (c.eingabe) {
            const inp = el("input"); inp.type = "text";
            inp.inputMode = tastatur(c);
            if (inp.inputMode === "text") { inp.autocapitalize = "sentences"; inp.autocomplete = "off"; }
            inp.dataset.zelle = zi + "-" + ci;
            inp.value = gew[zi + "-" + ci] || "";
            inp.oninput = () => {
              const o = Object.assign({}, antwortLesen(i, f.nr) || {});
              o[zi + "-" + ci] = inp.value; antwortSetzen(i, f.nr, o);
            };
            td.appendChild(inp);
          } else td.textContent = c.t == null ? "" : c.t;
          tr.appendChild(td);
        });
        tb.appendChild(tr);
      });
      t.appendChild(tb); wrap.appendChild(t); box.appendChild(wrap);

    } else if (f.typ === "flussbild" && window.GENFLUSS) {
      /* Gezeichnetes Aktivitätsdiagramm mit Lücken — siehe gen/flussbild.js */
      const werte = (alt && typeof alt === "object" && !Array.isArray(alt)) ? Object.assign({}, alt) : {};
      const bild = window.GENFLUSS.bau(f, werte, (nr, wert) => {
        werte[nr] = wert;
        antwortSetzen(i, f.nr, Object.assign({}, werte));
      }, false);
      bild.id = "gfb-" + i + "-" + f.nr;
      box.appendChild(bild);
      const hin = el("div", "fb-hinweis",
        "Die Struktur des Ablaufs ist vorgegeben. Zu ergänzen sind die gestrichelt umrandeten " +
        "Stellen: Knotentyp, Bezeichnung und die Bedingungen an den Ausgängen der Entscheidung. " +
        "Ein Kasten nimmt seine Form an, sobald der Typ gewählt ist.");
      box.appendChild(hin);

    } else if (f.typ === "knoten") {
      const wrap = el("div", "gtab-rollen");
      const t = el("table", "gknoten");
      const thead = el("thead"), trh = el("tr");
      (f.spalten || ["Knoten", "Typ", "Kante zeigt auf", "Bedingung"]).forEach(h => trh.appendChild(el("th", null, h)));
      trh.appendChild(el("th", null, ""));
      thead.appendChild(trh); t.appendChild(thead);
      const tb = el("tbody"); t.appendChild(tb);

      const daten = Array.isArray(alt) ? alt.slice() : [];
      while (daten.length < Math.max(4, (f.zeilen || 6))) daten.push({ name: "", typ: "", nach: "", bed: "" });

      function speichere() {
        const raus = [...tb.querySelectorAll("tr")].map(tr => ({
          name: tr.querySelector('[data-sp="name"]').value,
          typ: tr.querySelector('[data-sp="typ"]').value,
          nach: tr.querySelector('[data-sp="nach"]').value,
          bed: tr.querySelector('[data-sp="bed"]').value
        }));
        antwortSetzen(i, f.nr, raus);
      }
      function zeileEl(d) {
        const tr = el("tr");
        const mk = (sp, ph) => {
          const td = el("td");
          const inp = el("input"); inp.type = "text"; inp.dataset.sp = sp;
          inp.placeholder = ph; inp.value = d[sp] || "";
          inp.oninput = speichere;
          td.appendChild(inp); return td;
        };
        tr.appendChild(mk("name", "Bezeichnung"));
        const tdTyp = el("td");
        const sel = el("select"); sel.dataset.sp = "typ";
        const leer = el("option", null, "— Typ —"); leer.value = ""; sel.appendChild(leer);
        (f.typen || []).forEach(o => { const op = el("option", null, o); op.value = o; sel.appendChild(op); });
        sel.value = d.typ || "";
        sel.onchange = speichere;
        tdTyp.appendChild(sel); tr.appendChild(tdTyp);
        tr.appendChild(mk("nach", "Ziel, Ziel …"));
        tr.appendChild(mk("bed", "[ja] / [nein]"));
        const tdW = el("td"); tdW.className = "weg";
        const w = el("button", "btn ghost klein", "×");
        w.title = "Zeile entfernen";
        w.onclick = () => { tr.remove(); speichere(); };
        tdW.appendChild(w); tr.appendChild(tdW);
        return tr;
      }
      daten.forEach(d => tb.appendChild(zeileEl(d)));
      wrap.appendChild(t);
      const plus = el("button", "btn ghost klein", "+ Zeile");
      plus.style.marginTop = "6px";
      plus.onclick = () => { tb.appendChild(zeileEl({ name: "", typ: "", nach: "", bed: "" })); speichere(); };
      wrap.appendChild(plus);
      box.appendChild(wrap);

    } else if (f.typ === "modell") {
      const wrap = el("div", "gtab-rollen");
      const t = el("table", "gmodell");
      const thead = el("thead"), trh = el("tr");
      (f.spalten || []).forEach(sp => trh.appendChild(el("th", null, sp.label)));
      trh.appendChild(el("th", null, ""));
      thead.appendChild(trh); t.appendChild(thead);
      const tb = el("tbody"); t.appendChild(tb);

      const daten = Array.isArray(alt) ? alt.slice() : [];
      const soll = (f.soll || []).length;
      while (daten.length < Math.max(3, soll + 1)) daten.push({});

      function speichere() {
        const raus = [...tb.querySelectorAll("tr")].map(tr => {
          const o = {};
          (f.spalten || []).forEach(sp => {
            const c = tr.querySelector('[data-sp="' + sp.key + '"]');
            o[sp.key] = c ? c.value : "";
          });
          return o;
        });
        antwortSetzen(i, f.nr, raus);
      }
      function zeileEl(d) {
        const tr = el("tr");
        (f.spalten || []).forEach(sp => {
          const td = el("td");
          let c;
          if (sp.optionen) {
            c = el("select");
            const leer = el("option", null, "—"); leer.value = ""; c.appendChild(leer);
            sp.optionen.forEach(o => { const op = el("option", null, o); op.value = o; c.appendChild(op); });
          } else {
            c = el("input"); c.type = "text"; c.placeholder = sp.platzhalter || "";
          }
          c.dataset.sp = sp.key;
          c.value = d[sp.key] || "";
          c.oninput = speichere; c.onchange = speichere;
          td.appendChild(c); tr.appendChild(td);
        });
        const tdW = el("td"); tdW.className = "weg";
        const w = el("button", "btn ghost klein", "×");
        w.title = "Zeile entfernen";
        w.onclick = () => { tr.remove(); speichere(); };
        tdW.appendChild(w); tr.appendChild(tdW);
        return tr;
      }
      daten.forEach(d => tb.appendChild(zeileEl(d)));
      wrap.appendChild(t);
      const plus = el("button", "btn ghost klein", "+ Zeile");
      plus.style.marginTop = "6px";
      plus.onclick = () => { tb.appendChild(zeileEl({})); speichere(); };
      wrap.appendChild(plus);
      if (f.regeln && f.regeln.length) {
        const hin = el("div", "gmodell-regeln");
        hin.innerHTML = "<b>Notation</b>" + f.regeln.map(x => "<div>· " + esc(x) + "</div>").join("");
        wrap.appendChild(hin);
      }
      box.appendChild(wrap);

    } else {
      /* text / liste */
      const zeilen = f.zeilen || (f.typ === "liste" ? 4 : 2);
      if (zeilen <= 1) {
        const zeile = el("div", "geingabe");
        const inp = idGeben(el("input")); inp.type = "text";
        inp.value = alt == null ? "" : alt;
        inp.oninput = () => antwortSetzen(i, f.nr, inp.value);
        zeile.appendChild(inp);
        box.appendChild(zeile);
      } else {
        const ta = idGeben(el("textarea"));
        ta.rows = zeilen;
        ta.placeholder = f.typ === "liste"
          ? "eine Nennung je Zeile — mit Begründung („…, weil …“)"
          : "vollständiger Satz mit Begründung";
        ta.value = alt == null ? "" : alt;
        ta.oninput = () => antwortSetzen(i, f.nr, ta.value);
        box.appendChild(ta);
        /* Operatorenhilfe: was verlangt „Erläutern“, „Begründen“, „Beurteilen“?
           Erkannt wird das Verb aus Feldbezeichnung und Aufgabenstellung.     */
        if (window.GENOP) {
          const a = AUFG[i];
          /* Die Feldbezeichnung schlägt die Aufgabenstellung: in „… begründen Sie“
             steckt sonst auch für das reine Nennen-Feld der falsche Operator. */
          let op = window.GENOP.erkenne(f.label) || window.GENOP.erkenne((a && a.prompt) || "");
          /* Verlangt das Feld ganze Sätze (satzbau), ist „Nennen“ untertrieben —
             dann zeigen wir die Hilfe zum Erläutern, denn so wird auch bewertet. */
          if (op && op.key === "nennen" && f.satzbau) {
            op = window.GENOP.OPERATOREN.find(o => o.key === "erlaeutern") || op;
          }
          if (op && op.key !== "nennen") box.appendChild(window.GENOP.hilfeEl(op, ta));
        }
      }
    }

    const r = el("div", "grueck");
    r.id = "gfr-" + i + "-" + f.nr;
    box.appendChild(r);
    return box;
  }

  /* ======================= Prüfen ======================================= */
  /* --------------------------------------------------------------------
     Selbstbewertung bei Freitext
     --------------------------------------------------------------------
     Die automatische Prüfung erkennt Synonyme, Tippfehler und umgestellte
     Sätze — aber nicht alles. Wer „die Firewall lässt nur das durch, was
     ausdrücklich erlaubt ist“ schreibt, hat das Whitelist-Prinzip erklärt,
     ohne das Wort zu benutzen. In der echten Prüfung gäbe es dafür den
     Punkt. Deshalb kann jedes Freitextfeld nachträglich selbst gewertet
     werden — so, wie man es beim Korrigieren mit dem Lösungsblatt neben
     sich auch täte. Die Entscheidung hängt am Blatt und bleibt erhalten.

     Bewusst NICHT für Ankreuz-, Zuordnungs- und Rechenfelder: dort ist
     richtig eindeutig, und sich selbst Punkte zu schenken hilft nicht.  */
  const SELBST_TYPEN = { text: 1, liste: 1, rechenweg: 1 };

  function selbstSchluessel(i, nr) { return i + ":" + nr; }
  function selbstWert(i, nr) {
    const s = BLATT && BLATT.selbst;
    return s ? s[selbstSchluessel(i, nr)] : undefined;
  }
  function selbstSetzen(i, nr, punkte) {
    if (!BLATT.selbst) BLATT.selbst = {};
    const k = selbstSchluessel(i, nr);
    if (punkte == null) delete BLATT.selbst[k]; else BLATT.selbst[k] = punkte;
    pruefe(i, true, true);
    standAktualisieren();
  }

  function pruefe(i, still, ohneStat) {
    const a = AUFG[i];
    const erg = G.pruefeAufgabe(a, BLATT.antworten[i] || {});
    /* eigene Wertung drüberlegen, bevor irgendetwas gezählt wird */
    erg.felder.forEach(r => {
      const p = selbstWert(i, r.nr);
      if (p == null) return;
      r.selbst = true;
      r.punkte = p;
      r.status = p >= (r.be || 0) - 0.001 ? "richtig" : (p > 0 ? "teil" : "falsch");
      r.text = "selbst gewertet";
    });
    if (Object.keys((BLATT.selbst) || {}).some(k => k.indexOf(i + ":") === 0)) {
      erg.punkte = G.runde(erg.felder.reduce((s, r) => s + (r.punkte || 0), 0), 2);
    }
    /* Wie viel davon kam aus Ankreuz- und Zuordnungsaufgaben? In der echten
       Prüfung sind das nur rund 2 % der Punkte — hier deutlich mehr. Für die
       ehrliche Hochrechnung nach der Simulation wird es getrennt gezählt.  */
    const KLICK = { auswahl: 1, mehrfachwahl: 1, aussagen: 1, zuordnung: 1 };
    let kBe = 0, kP = 0;
    erg.felder.forEach(r => { if (KLICK[r.typ]) { kBe += r.be || 0; kP += r.punkte || 0; } });

    /* -------------------------------------------------------------------
       Drei Töpfe statt einem.

       Die Wortprüfung kann „richtig gesagt, nur anders formuliert“ nicht
       von „falsch“ unterscheiden. Sie hat es trotzdem getan, und zwar mit
       null Punkten — auf einem Blatt mit viel Freitext kam so ein Ergebnis
       von 2 von 28 BE heraus, obwohl die Antworten weitgehend stimmten.
       Diese Zahl ist danach als IHK-Note ausgewiesen worden, und sie ist
       in die Statistik eingeflossen. Beides war falsch.

       Deshalb:
         sicher  — eindeutig maschinell prüfbar (Zahlen, Ankreuzen,
                   Zuordnen) plus vollständig erkannter Freitext plus
                   alles, was selbst gewertet wurde
         offen   — Freitext, den die Wortprüfung nicht voll anerkannt hat
                   und der noch nicht selbst gewertet ist
         leer    — nichts eingetragen; zählt in der Übung gar nicht mit,
                   in der Simulation dagegen als null
       ---------------------------------------------------------------- */
    let sicherBe = 0, sicherP = 0, offenBe = 0, offenVorschlag = 0, bearbeitetBe = 0;
    erg.felder.forEach(r => {
      const be = r.be || 0;
      if (r.status === "leer") return;
      bearbeitetBe += be;
      const unsicher = SELBST_TYPEN[r.typ] && !r.selbst && (r.punkte || 0) < be - 0.001;
      if (unsicher) { offenBe += be; offenVorschlag += r.punkte || 0; r.unsicher = true; }
      else { sicherBe += be; sicherP += r.punkte || 0; }
    });

    BLATT.ergebnisse[i] = {
      punkte: erg.punkte, max: erg.max,
      klickBe: G.runde(kBe, 2), klickPunkte: G.runde(kP, 2),
      bearbeitetBe: G.runde(bearbeitetBe, 2),
      sicherBe: G.runde(sicherBe, 2), sicherPunkte: G.runde(sicherP, 2),
      offenBe: G.runde(offenBe, 2), offenVorschlag: G.runde(offenVorschlag, 2)
    };

    const box = $("gfelder-" + i);
    erg.felder.forEach(r => {
      const f = a.felder[r.nr];
      const feldBox = box.querySelector('[data-nr="' + r.nr + '"]');
      if (!feldBox) return;
      markiereFeld(feldBox, f, r, a);
    });

    const karte = $("gauf-" + i);
    karte.classList.remove("richtig", "teil", "falsch");
    const rand = $("grand-" + i);
    rand.classList.remove("ok", "halb", "nein");
    if (erg.offen === a.felder.length) {
      rand.querySelector(".wert").innerHTML = "—<small>von " + nz(a.maxPoints) + " BE</small>";
    } else {
      const q = erg.punkte / a.maxPoints;
      karte.classList.add(q > 0.99 ? "richtig" : (q > 0 ? "teil" : "falsch"));
      rand.classList.add(q > 0.99 ? "ok" : (q > 0 ? "halb" : "nein"));
      rand.querySelector(".wert").innerHTML = nz(erg.punkte) + "<small>von " + nz(a.maxPoints) + " BE</small>";
      /* In die Statistik geht nur, was wirklich beurteilt ist: leere Felder
         und noch nicht bewerteter Freitext würden die Quote sonst nach
         unten ziehen, ohne dass jemand etwas falsch gemacht hat.        */
      const s = BLATT.ergebnisse[i];
      if (!ohneStat && s.sicherBe > 0) statMerken(a.vorlageId, s.sicherPunkte, s.sicherBe);
    }

    const rueck = $("grueck-" + i);
    rueck.innerHTML = "";
    if (erg.offen === a.felder.length) {
      rueck.innerHTML = '<span class="mittel">Noch nichts eingetragen.</span>';
    } else {
      const q = erg.punkte / a.maxPoints;
      rueck.innerHTML = "<b>" + nz(erg.punkte) + " von " + nz(a.maxPoints) + " BE</b> " +
        (q > 0.99 ? '<span class="gut">— vollständig.</span>'
          : (q > 0 ? '<span class="mittel">— teilweise. Sieh dir die rot markierten Felder an.</span>'
            : '<span class="schlecht">— das passt noch nicht. Musterlösung ansehen und neu würfeln.</span>')) +
        (erg.offen ? " · " + erg.offen + " Feld(er) leer" : "") +
        (erg.folgefehler
          ? '<div class="gweg-folge"><b>Folgefehler anerkannt:</b> dein Rechenweg ist ' +
            'nachvollziehbar, nur das Ergebnis stimmt nicht. In der Prüfung gibt es dafür ' +
            'die halbe Punktzahl — deshalb <b>immer</b> den Rechenweg hinschreiben, auch ' +
            'wenn du dir unsicher bist.</div>'
          : (erg.rechenweg && erg.rechenweg.gesamt && !erg.rechenweg.tragfaehig &&
             erg.felder.some(x => x.typ === "zahl" && x.status === "falsch")
              ? '<div class="gweg-folge warn">Ohne nachvollziehbaren Rechenweg gibt es ' +
                'für ein falsches Ergebnis keine Teilpunkte. Schreib die Zwischenschritte auf.</div>'
              : ""));
      if (a.merksatz && q < 0.99) $("gmerk-" + i).hidden = false;
    }
    sichern();
    if (!still) $("gauf-" + i).scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function markiereFeld(feldBox, f, r, a) {
    const ziel = $("gfr-" + AUFG.indexOf(a) + "-" + f.nr) || feldBox.querySelector(".grueck");
    const klasse = r.status === "richtig" ? "richtig" : (r.status === "teil" ? "teil" : (r.status === "falsch" ? "falsch" : ""));

    feldBox.querySelectorAll("input[type=text], textarea, select").forEach(x => x.classList.remove("richtig", "falsch", "teil"));
    feldBox.querySelectorAll(".gwahl label, table.gwf tr").forEach(x => x.classList.remove("richtig", "falsch", "soll"));
    /* Reste einer früheren Prüfung wegräumen, sonst stehen zwei Sollwerte
       übereinander, sobald man ein zweites Mal prüft.                    */
    feldBox.querySelectorAll(".gsoll").forEach(x => x.remove());

    /* -------------------------------------------------------------------
       „Rotes Feld und sonst nichts“ war die häufigste Rückfrage: man sieht,
       DASS es falsch ist, aber nicht, was dagestanden hätte — und wer die
       Lösung aufklappt, verliert die eigene Antwort aus dem Blick. Deshalb
       wird der Sollwert jetzt direkt neben die eigene Eingabe geschrieben
       und die richtige Option zusätzlich markiert. Überschrieben wird nie
       etwas: der Vergleich ist der ganze Zweck.
       ---------------------------------------------------------------- */
    const sollChip = (wohin, text) => {
      if (!wohin || text == null || text === "") return;
      const s = el("div", "gsoll");
      s.append(el("span", "gsoll-lbl", "richtig:"), el("span", "gsoll-wert", String(text)));
      wohin.appendChild(s);
    };

    if (f.typ === "zahl" || f.typ === "text" || f.typ === "liste" || f.typ === "rechenweg") {
      const inp = feldBox.querySelector("input[type=text], textarea");
      if (inp && klasse) inp.classList.add(klasse);
    }
    /* Zahl: der Sollwert mit Einheit. Bei „teil“ genauso — dann war meist
       die Einheit oder die Rundung das Problem, und ohne den Vergleich
       sieht man nicht, welches von beidem.                              */
    if (f.typ === "zahl" && r.status !== "richtig" && r.status !== "leer" && f.loesung != null) {
      sollChip(feldBox, G.fmt.kurz(f.loesung) + (f.einheit ? " " + f.einheit : ""));
    }
    /* Rechenweg: die Zwischenwerte der Musterlösung anzeigen und markieren,
       welche in der eigenen Rechnung vorkommen — das zeigt die Bruchstelle. */
    if (f.typ === "rechenweg" && r.weg) {
      const alt = feldBox.querySelector(".gweg-spur");
      if (alt) alt.remove();
      if (r.status !== "leer") {
        const spur = el("div", "gweg-spur");
        spur.appendChild(el("div", "gweg-titel", "Zwischenwerte der Musterlösung"));
        const kette = el("div", "gweg-kette");
        f.soll.forEach((sv, k) => {
          const da = !r.weg.fehlt.includes(sv.roh);
          const chip = el("span", "gweg-wert " + (da ? "da" : "weg") +
            (k === r.weg.ersteLuecke ? " bruch" : ""), sv.roh);
          chip.title = da ? "steht in deinem Rechenweg" : "fehlt in deinem Rechenweg";
          kette.appendChild(chip);
        });
        spur.appendChild(kette);
        feldBox.appendChild(spur);
      }
    }
    if (f.typ === "auswahl") {
      let daneben = false;
      feldBox.querySelectorAll(".gwahl label").forEach(l => {
        const inp = l.querySelector("input");
        if (!inp.checked) return;
        const gut = String(inp.value) === String(f.loesung);
        l.classList.add(gut ? "richtig" : "falsch");
        if (!gut) daneben = true;
      });
      /* Die richtige Antwort steht mit in der Liste — sie muss nur gezeigt
         werden. Angekreuzt wird nichts, die eigene Wahl bleibt stehen.  */
      if (daneben) feldBox.querySelectorAll(".gwahl label").forEach(l => {
        const inp = l.querySelector("input");
        if (String(inp.value) === String(f.loesung)) {
          l.classList.add("soll");
          l.title = "Das wäre richtig gewesen.";
        }
      });
    }
    if (f.typ === "mehrfachwahl") {
      const soll = (f.loesung || []).map(String);
      let daneben = false;
      feldBox.querySelectorAll(".gwahl label").forEach(l => {
        const inp = l.querySelector("input");
        if (!inp.checked) return;
        const gut = soll.includes(String(inp.value));
        l.classList.add(gut ? "richtig" : "falsch");
        if (!gut) daneben = true;
      });
      const fehlend = [...feldBox.querySelectorAll(".gwahl label")]
        .filter(l => { const i2 = l.querySelector("input"); return soll.includes(String(i2.value)) && !i2.checked; });
      fehlend.forEach(l => { l.classList.add("soll"); l.title = "Das hätte auch angekreuzt gehört."; });
      if (daneben || fehlend.length) { /* Markierung reicht — kein zweiter Text */ }
    }
    if (f.typ === "aussagen") {
      feldBox.querySelectorAll("table.gwf tbody tr").forEach(tr => {
        const k = +tr.dataset.k;
        const gew = (feldBox.querySelector('input[name="wf' + AUFG.indexOf(a) + "-" + f.nr + "-" + k + '"]:checked') || {}).value;
        if (!gew) return;
        const gut = (gew === "w") === !!f.aussagen[k].wahr;
        tr.classList.add(gut ? "richtig" : "falsch");
        if (!gut) {
          const zelle = tr.querySelector("td:last-child") || tr.lastElementChild;
          sollChip(zelle, f.aussagen[k].wahr ? "richtig" : "falsch");
        }
      });
    }
    if (f.typ === "zuordnung") {
      feldBox.querySelectorAll("table.gzuo tbody tr").forEach(tr => {
        const k = +tr.dataset.k, s = tr.querySelector("select");
        if (!s.value) return;
        const gut = s.value === f.paare[k][1];
        s.classList.add(gut ? "richtig" : "falsch");
        /* title für die Maus, Chip für das Telefon — auf dem Handy gibt es
           kein Darüberfahren.                                          */
        if (!gut) {
          s.title = "richtig: " + f.paare[k][1];
          sollChip(s.parentElement, f.paare[k][1]);
        } else s.removeAttribute("title");
      });
    }
    if (f.typ === "flussbild" && window.GENFLUSS) {
      window.GENFLUSS.markiere(feldBox.querySelector(".fb"), r.luecken);
    }
    if (f.typ === "knoten" && r.zeilen) {
      feldBox.querySelectorAll("table.gknoten tbody tr").forEach((tr, k) => {
        const inp = tr.querySelector('[data-sp="name"]');
        inp.classList.remove("richtig", "falsch");
        if (!inp.value.trim()) return;
        const st = r.zeilen[k];
        if (!st) return;
        inp.classList.add(st.treffer && st.typOk && st.nachOk ? "richtig" : (st.treffer ? "teil" : "falsch"));
        const sel = tr.querySelector('[data-sp="typ"]');
        sel.classList.remove("richtig", "falsch");
        if (st.treffer) sel.classList.add(st.typOk ? "richtig" : "falsch");
        const nach = tr.querySelector('[data-sp="nach"]');
        nach.classList.remove("richtig", "falsch");
        if (st.treffer) nach.classList.add(st.nachOk ? "richtig" : "falsch");
      });
    }
    if (f.typ === "modell" && r.zeilen) {
      feldBox.querySelectorAll("table.gmodell tbody tr").forEach((tr, k) => {
        tr.querySelectorAll("input, select").forEach(x => x.classList.remove("richtig", "falsch", "teil"));
        const erste = tr.querySelector("input, select");
        if (!erste || !erste.value.trim()) return;
        const st = r.zeilen[k];
        if (!st) return;
        if (!st.treffer) { erste.classList.add("falsch"); return; }
        erste.classList.add("richtig");
        Object.keys(st.spalten || {}).forEach(key => {
          const c = tr.querySelector('[data-sp="' + key + '"]');
          if (c) c.classList.add(st.spalten[key]);
        });
      });
    }
    if (f.typ === "raster" && r.zellen) {
      feldBox.querySelectorAll("input[data-zelle]").forEach(inp => {
        const z = r.zellen[inp.dataset.zelle];
        if (z === "richtig" || z === "falsch") inp.classList.add(z);
        if (z !== "falsch") { inp.removeAttribute("title"); return; }
        const [zi, ci] = inp.dataset.zelle.split("-").map(Number);
        const c = ((f.zeilen || [])[zi] || { zellen: [] }).zellen[ci];
        if (!c) return;
        /* Textzellen haben mehrere erlaubte Formulierungen — die erste ist
           die aus der Musterlösung und reicht als Anhalt.               */
        const soll = c.text != null
          ? (Array.isArray(c.text) ? c.text[0] : c.text)
          : (c.loesung != null ? G.fmt.kurz(c.loesung) : null);
        if (soll == null) return;
        inp.title = "richtig: " + soll;
        sollChip(inp.parentElement, soll);
      });
    }

    if (!ziel) return;
    ziel.innerHTML = "";
    if (r.status === "leer") return;
    const kopf = el("div");
    kopf.innerHTML = (r.status === "richtig" ? '<span class="gut">✓ richtig</span>'
      : r.status === "teil" ? '<span class="mittel">teilweise — ' + nz(r.punkte) + " von " + nz(f.be) + " BE</span>"
        : '<span class="schlecht">✗ noch nicht richtig</span>') +
      (r.text ? " · " + esc(r.text) : "");
    ziel.appendChild(kopf);

    if ((f.typ === "text" || f.typ === "liste") && (r.gefunden.length || r.fehlt.length)) {
      const chips = el("div", "gchips");
      r.gefunden.forEach(g => { const s = el("span", "ja", "✓ " + g); chips.appendChild(s); });
      const nochOffen = (f.noetig || f.erwartet.length) - r.gefunden.length;
      const zeigeFehlt = nochOffen > 0 ? r.fehlt.slice(0, Math.max(3, nochOffen)) : [];
      zeigeFehlt.forEach(g => { const s = el("span", "nein", "fehlt: " + g); chips.appendChild(s); });
      if (nochOffen <= 0 && r.fehlt.length) {
        r.fehlt.slice(0, 4).forEach(g => { const s = el("span", "offen", "auch möglich: " + g); chips.appendChild(s); });
      }
      ziel.appendChild(chips);
    }

    /* Selbstbewertung anbieten — nur bei Freitext und nur, wenn etwas
       dasteht. Zwei Knöpfe: voller Punkt oder halber, wie bei einer
       inhaltlich richtigen, aber unvollständigen Antwort.              */
    if (SELBST_TYPEN[f.typ] && r.status !== "leer") {
      const i = AUFG.indexOf(a);
      const eigen = selbstWert(i, f.nr);
      const zeile = el("div", "gselbst");
      if (eigen != null) {
        zeile.appendChild(el("span", "gselbst-an", "eigene Wertung: " + nz(eigen) + " von " + nz(f.be) + " BE"));
        const weg = el("button", "gselbst-k", "zurücknehmen");
        weg.type = "button";
        weg.onclick = () => selbstSetzen(i, f.nr, null);
        zeile.appendChild(weg);
      } else if (r.status !== "richtig") {
        zeile.appendChild(el("span", "gselbst-frage", "Inhaltlich doch richtig?"));
        const halb = G.runde((f.be || 1) / 2, 2);
        const b1 = el("button", "gselbst-k", "ganz (" + nz(f.be) + " BE)");
        b1.type = "button"; b1.onclick = () => selbstSetzen(i, f.nr, f.be || 1);
        zeile.appendChild(b1);
        if (halb > 0 && halb < (f.be || 1)) {
          const b2 = el("button", "gselbst-k", "halb (" + nz(halb) + " BE)");
          b2.type = "button"; b2.onclick = () => selbstSetzen(i, f.nr, halb);
          zeile.appendChild(b2);
        }
      }
      if (zeile.childNodes.length) ziel.appendChild(zeile);
    }
  }

  function loesungZeigen(i) {
    const d = $("gloes-" + i);
    if (d) d.open = true;
    const m = $("gmerk-" + i);
    if (m && AUFG[i].merksatz) m.hidden = false;
    /* richtige Werte in leere Felder eintragen? Nein — nur zeigen, wie im Netzplan-Trainer. */
  }

  function neuWuerfeln(i) {
    const neuSaat = (Math.random() * 2147483647) >>> 0;
    BLATT.aufgaben[i] = { vorlageId: AUFG[i].vorlageId, saat: neuSaat };
    AUFG[i] = G.erzeuge(AUFG[i].vorlageId, neuSaat);
    delete BLATT.antworten[i];
    delete BLATT.ergebnisse[i];
    /* neue Aufgabe, alte Selbstwertung ungültig */
    Object.keys(BLATT.selbst || {}).forEach(k => { if (k.indexOf(i + ":") === 0) delete BLATT.selbst[k]; });
    BLATT.maxPoints = G.runde(AUFG.reduce((s, a) => s + a.maxPoints, 0), 2);
    const alt = $("gauf-" + i);
    const neu = aufgabeEl(AUFG[i], i);
    alt.replaceWith(neu);
    sichern(); standAktualisieren();
    neu.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function statMerken(id, punkte, max) {
    const s = STAT[id] || { versuche: 0, punkte: 0, max: 0 };
    s.versuche++; s.punkte += punkte; s.max += max;
    STAT[id] = s; store.set(SK.stat, STAT);
  }

  /* ---------------------------------------------------------------------
     Die Bilanz eines Blatts an EINER Stelle. Alles, was eine Prozentzahl
     zeigt — Stand, Abschluss, Archiv, Statistik —, rechnet ab hier gleich.

       modus "uebung"   Nenner = beurteilte BE (leer zählt nicht mit)
       modus "pruefung" Nenner = das ganze Blatt (leer zählt als null,
                        denn in der Prüfung ist ein leeres Feld null)
     -------------------------------------------------------------------- */
  function bilanz(blatt) {
    const b = blatt || BLATT;
    const erg = b.ergebnisse || {};
    const keys = Object.keys(erg);
    let sicherBe = 0, sicherP = 0, offenBe = 0, offenVor = 0, bearbeitet = 0, roh = 0, rohMax = 0;
    keys.forEach(k => {
      const e = erg[k];
      /* Ältere Blätter kennen die Aufteilung noch nicht — dort gilt alles
         Geprüfte als sicher, damit sie weiter auswertbar bleiben.      */
      const hat = e.sicherBe != null;
      sicherBe += hat ? e.sicherBe : (e.max || 0);
      sicherP  += hat ? e.sicherPunkte : (e.punkte || 0);
      offenBe  += hat ? e.offenBe : 0;
      offenVor += hat ? e.offenVorschlag : 0;
      bearbeitet += hat ? e.bearbeitetBe : (e.max || 0);
      roh += e.punkte || 0; rohMax += e.max || 0;
    });
    const gesamtBe = b.maxPoints || rohMax;
    const pruefung = !!b.pruefung;
    const nenner = pruefung ? gesamtBe : sicherBe;
    const zaehler = pruefung ? (sicherP + offenVor) : sicherP;
    return {
      modus: pruefung ? "pruefung" : "uebung",
      sicherBe: G.runde(sicherBe, 2), sicherPunkte: G.runde(sicherP, 2),
      offenBe: G.runde(offenBe, 2), offenVorschlag: G.runde(offenVor, 2),
      bearbeitetBe: G.runde(bearbeitet, 2), gesamtBe: G.runde(gesamtBe, 2),
      geprueft: keys.length, aufgaben: (b.aufgaben || []).length,
      quote: nenner > 0 ? zaehler / nenner : null,
      zaehler: G.runde(zaehler, 2), nenner: G.runde(nenner, 2),
      teilweise: bearbeitet < gesamtBe - 0.001,
      /* Ab wann ist eine Note überhaupt aussagekräftig? Wenn mehr als ein
         Zehntel des Bearbeiteten noch auf die eigene Wertung wartet,
         steht die Zahl auf zu dünnem Eis.                              */
      /* … und aus zu wenigen Punkten lässt sich ohnehin keine Note ableiten.
         Zehn BE sind etwa eine große Prüfungsaufgabe — darunter ist die
         Zahl Zufall.                                                     */
      belastbar: offenBe <= 0.1 * Math.max(1, bearbeitet) && sicherBe >= 10
    };
  }

  function standAktualisieren() {
    const erz = Object.keys(BLATT.ergebnisse);
    const b = bilanz();
    BLATT.punkte = b.sicherPunkte;
    BLATT.bearbeitetBe = b.bearbeitetBe;
    BLATT.sicherBe = b.sicherBe;
    BLATT.offenBe = b.offenBe;
    BLATT.bewertet = erz.length === AUFG.length && b.offenBe <= 0.001;
    const st = $("genStand");
    if (st) st.innerHTML = erz.length
      ? nz(b.sicherPunkte) + " / " + nz(b.sicherBe) + " BE <small>bewertet · " +
        erz.length + " von " + AUFG.length + " Aufgaben" +
        (b.offenBe > 0 ? ' · <b class="gst-offen">' + nz(b.offenBe) + " BE selbst bewerten</b>" : "") +
        "</small>"
      : "<small>" + AUFG.length + " Aufgaben · " + nz(BLATT.maxPoints) + " BE gesamt</small>";
    sichern();
  }

  function zusammenfassung() {
    const z = el("div", "gzusammen");
    z.id = "genAbschluss"; z.hidden = true;
    return z;
  }

  function abschluss() {
    const b = bilanz();
    const proz = b.quote == null ? null : Math.round(b.quote * 100);
    const n = (proz != null && window.note) ? window.note(proz) : { note: "—", text: "" };

    /* schwächste Themen dieses Blatts — auch hier nur über Beurteiltes */
    const proThema = {};
    AUFG.forEach((a, i) => {
      const e = BLATT.ergebnisse[i]; if (!e) return;
      const t = proThema[a.themaLabel] || (proThema[a.themaLabel] = { p: 0, m: 0 });
      t.p += (e.sicherPunkte != null ? e.sicherPunkte : e.punkte);
      t.m += (e.sicherBe != null ? e.sicherBe : e.max);
    });
    const schwach = Object.keys(proThema).filter(k => proThema[k].m > 0)
      .map(k => ({ k, q: proThema[k].p / proThema[k].m }))
      .sort((a, b2) => a.q - b2.q).slice(0, 3);

    const z = $("genAbschluss");
    z.hidden = false;

    const zeigeNote = proz != null && b.belastbar;
    z.innerHTML =
      '<div><span class="eyebrow">Ergebnis</span><div class="zahl">' +
        (proz == null ? "—" : proz + " %") + '</div></div>' +
      '<div><span class="eyebrow">IHK-Note</span><div class="zahl">' +
        (zeigeNote ? n.note : "—") + '</div></div>' +
      '<div class="txt">' + bilanzText(b, zeigeNote ? n : null) +
      (schwach.length ? "<br>Schwächstes Thema hier: <b>" + esc(schwach[0].k) + "</b> (" +
        Math.round(schwach[0].q * 100) + " %)." : "") + "</div>" +
      (BLATT.pruefung ? quotenKasten() + zeitAuswertung(b.zaehler, b.nenner) : "");

    offeneLeiste(z, b);
    z.scrollIntoView({ behavior: "smooth", block: "center" });
    sichern();
  }

  /** Der erklärende Satz unter den beiden großen Zahlen. */
  function bilanzText(b, n) {
    const t = [];
    if (b.modus === "pruefung") {
      t.push("<b>" + nz(b.zaehler) + " von " + nz(b.gesamtBe) + " BE</b> — in der Simulation " +
             "zählt das ganze Blatt, ein leeres Feld ist null Punkte.");
    } else {
      t.push("<b>" + nz(b.sicherPunkte) + " von " + nz(b.sicherBe) + " bewerteten BE</b>" +
             (n ? " — " + esc(n.text) + "." : "."));
      if (b.teilweise)
        t.push("Teilbearbeitung: " + nz(b.bearbeitetBe) + " von " + nz(b.gesamtBe) +
               " BE des Blattes angefasst. Was du nicht angefasst hast, zählt hier nicht " +
               "gegen dich — im Prüfungsmodus dagegen schon.");
    }
    if (b.offenBe > 0)
      t.push('<b class="gst-offen">' + nz(b.offenBe) + " BE warten auf deine Wertung.</b> " +
             "Die Wortprüfung vergleicht Formulierungen; wo du dieselbe Sache anders gesagt " +
             "hast, kann sie das nicht sehen. Solange das offen ist, " +
             (b.belastbar ? "verschiebt sich die Zahl noch." : "steht hier keine Note."));
    t.push("Bestanden ist ab 50 %.");
    return t.join("<br>");
  }

  /* ---------------------------------------------------------------------
     Die offenen Freitextfelder in einer Liste, mit drei Knöpfen je Zeile.
     Vorher musste man dafür durch das ganze Blatt scrollen und jedes Feld
     einzeln suchen — entsprechend selten ist es passiert, und entsprechend
     falsch waren die Zahlen danach.
     -------------------------------------------------------------------- */
  function offeneLeiste(z, b) {
    if (!b.offenBe) return;
    const kasten = el("div", "goffen");
    kasten.appendChild(el("h4", null, "Selbst bewerten — " + nz(b.offenBe) + " BE"));
    kasten.appendChild(el("p", "goffen-hin",
      "Vergleiche deine Antwort mit der Musterlösung und entscheide. Halb heißt: " +
      "die Sache ist getroffen, aber Begründung oder Fachbegriff fehlen."));

    AUFG.forEach((a, i) => {
      const e = BLATT.ergebnisse[i];
      if (!e || !e.offenBe) return;
      const erg = G.pruefeAufgabe(a, BLATT.antworten[i] || {});
      erg.felder.forEach(r => {
        const be = r.be || 0;
        if (!SELBST_TYPEN[r.typ] || r.status === "leer") return;
        if (selbstWert(i, r.nr) != null) return;
        if ((r.punkte || 0) >= be - 0.001) return;
        const zeile = el("div", "goffen-zeile");
        const txt = el("div", "goffen-txt");
        txt.appendChild(el("div", "goffen-frage",
          (i + 1) + ". " + (r.label || a.titel || "Freitext") + " · " + nz(be) + " BE"));
        const meine = String((BLATT.antworten[i] || {})[r.nr] || "").trim();
        txt.appendChild(el("div", "goffen-meine", meine.length > 160 ? meine.slice(0, 160) + " …" : meine));
        if (r.fehlt && r.fehlt.length)
          txt.appendChild(el("div", "goffen-soll", "erwartet: " + r.fehlt.slice(0, 3).join(" · ")));
        zeile.appendChild(txt);

        const knopfe = el("div", "goffen-knopfe");
        const halb = G.runde(be / 2, 2);
        [["ganz", be], ["halb", halb], ["null", 0]].forEach(([name, wert]) => {
          if (name === "halb" && !(halb > 0 && halb < be)) return;
          const k = el("button", "goffen-k", name);
          k.type = "button";
          k.onclick = () => { selbstSetzen(i, r.nr, wert); abschluss(); };
          knopfe.appendChild(k);
        });
        const hin = el("button", "goffen-k goffen-hinweg", "↗ ansehen");
        hin.type = "button";
        hin.title = "Zur Aufgabe springen und die Musterlösung aufklappen";
        hin.onclick = () => { loesungZeigen(i); $("gauf-" + i).scrollIntoView({ behavior: "smooth", block: "center" }); };
        knopfe.appendChild(hin);
        zeile.appendChild(knopfe);
        kasten.appendChild(zeile);
      });
    });
    z.appendChild(kasten);
  }

  /**
   * Ehrliche Hochrechnung: der Generator vergibt rund 20 % der Punkte über
   * Ankreuzen und Zuordnen, die echte AP1 nur 2 %. Wer hier 68 % holt, holt
   * dort weniger — also rechnen wir das Ergebnis auf den Prüfungsmix um.
   */
  function echteQuote() {
    let kBe = 0, kP = 0, ges = 0, p = 0;
    AUFG.forEach((a, i) => {
      const e = BLATT.ergebnisse[i]; if (!e) return;
      ges += e.max || 0; p += e.punkte || 0;
      kBe += e.klickBe || 0; kP += e.klickPunkte || 0;
    });
    const freiBe = ges - kBe, freiP = p - kP;
    if (!ges || freiBe <= 0) return null;
    const klickQ = kBe ? kP / kBe : 0;
    const freiQ = freiP / freiBe;
    /* Prüfungsmix: 2 % Ankreuzen, 98 % selbst formulieren und rechnen */
    const echt = 0.02 * klickQ + 0.98 * freiQ;
    return {
      roh: p / ges, echt,
      klickBe: G.runde(kBe, 1), klickAnteil: kBe / ges,
      freiBe: G.runde(freiBe, 1), freiQ, klickQ
    };
  }

  function quotenKasten() {
    const q = echteQuote();
    if (!q || q.klickAnteil < 0.06) return "";
    const roh = Math.round(q.roh * 100), echt = Math.round(q.echt * 100);
    if (echt >= roh) return "";
    return '<div class="txt sim-echt"><b>Realistischer Wert: ' + echt + ' %</b> statt ' + roh + ' %.<br>' +
      nz(q.klickBe) + ' der ' + nz(q.klickBe + q.freiBe) + ' BE kamen hier aus Ankreuz- und ' +
      'Zuordnungsaufgaben (' + Math.round(q.klickAnteil * 100) + ' %). In den zehn echten Prüfungen ' +
      'sind das zusammen nur 2 % — dort musst du fast alles selbst formulieren und rechnen. ' +
      'Deine Quote im freien Teil: <b>' + Math.round(q.freiQ * 100) + ' %</b>. ' +
      (echt >= 50
        ? 'Auch umgerechnet liegst du über der Bestehensgrenze.'
        : 'Umgerechnet liegst du <b>unter</b> 50 % — das ist der Wert, an dem du dich orientieren solltest.') +
      '</div>';
  }

  /** Zeitbilanz nach einer Prüfungssimulation */
  function zeitAuswertung(punkte, max) {
    const min = Math.round((BLATT.dauer || BLATT.sekunden || 0) / 60);
    const grenze = BLATT.minuten || 90;
    const leer = AUFG.filter((a, i) => {
      const e = BLATT.ergebnisse[i];
      return !e || e.punkte === 0;
    }).length;
    const proBE = max ? (BLATT.dauer || 1) / 60 / max : 0;
    const hoch = Math.round(proBE * 100);
    return '<div class="txt sim-zeit"><b>Zeit:</b> ' + min + " von " + grenze + " Minuten" +
      (min >= grenze
        ? " — die Zeit war komplett aufgebraucht."
        : " · " + (grenze - min) + " Minuten übrig") +
      " · Hochrechnung auf 100 BE: <b>" + hoch + " Minuten</b>." +
      (hoch > grenze
        ? " In diesem Tempo bliebest du rund <b>" + Math.round((hoch - grenze) / Math.max(0.1, proBE * 100) * 100) +
          " BE</b> liegen. Nimm dir die teuren Aufgaben zuerst vor."
        : " Das Tempo reicht.") +
      (leer ? " <b>" + leer + " Aufgabe(n)</b> ohne einen einzigen Punkt — die zuerst durchsehen." : "") +
      "</div>";
  }

  /** Prüfungssimulation abgeben: bewerten, Lösungen freigeben, Zeit auswerten */
  /* Ein Arbeitsblatt in dieselbe Form bringen, in der das Archiv die echten
     Prüfungen ablegt — dann steht beides in einer Liste und lässt sich
     miteinander vergleichen. */
  function archivieren(quelle, blatt) {
    const B = blatt || BLATT;
    if (!window.GENARCHIV || !B) return null;
    /* Ohne offenes Blatt die Aufgaben aus Vorlage und Saat neu erzeugen —
       der Zufallskeim macht sie identisch mit denen beim Ausfüllen. */
    const A = (B === BLATT && AUFG.length) ? AUFG
            : B.aufgaben.map(x => G.erzeuge(x.vorlageId, x.saat));
    const aufgaben = A.map((a, i) => {
      const ant = (B.antworten || {})[i] || {};
      const teile = (a.felder || []).map(f => {
        const w = ant[f.nr];
        if (w == null || w === "") return null;
        const wert = typeof w === "object" ? JSON.stringify(w) : String(w);
        return (f.label ? f.label + ": " : "") + wert;
      }).filter(Boolean);
      const e = (B.ergebnisse || {})[i] || {};
      return {
        k: B.id + ":" + i,
        label: "Aufgabe " + (i + 1) + " · " + (a.titel || a.vorlageId),
        frage: (a.prompt || "").replace(/\s+/g, " ").trim().slice(0, 400),
        antwort: teile.join("\n"),
        punkte: e.punkte == null ? null : G.runde(e.punkte, 2),
        be: a.maxPoints || 0,
        loesung: (a.loesung || "").replace(/\s+/g, " ").trim().slice(0, 600)
      };
    });
    if (!aufgaben.some(x => x.antwort.trim())) return null;
    const max = aufgaben.reduce((s, x) => s + x.be, 0);
    const got = aufgaben.reduce((s, x) => s + (x.punkte || 0), 0);
    return window.GENARCHIV.sichern({
      id: "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      datum: new Date().toISOString(),
      examId: "blatt:" + (B.opt && B.opt.themen ? B.opt.themen.join("+") : "gemischt"),
      titel: (B.pruefung ? "Simulation · " : "Arbeitsblatt · ") + B.titel,
      modus: B.pruefung ? "simulation" : "uebung",
      quelle: quelle || "abgegeben",
      punkte: G.runde(got, 2), maxPunkte: G.runde(max, 2),
      prozent: max ? Math.round(got / max * 100) : 0,
      beantwortet: aufgaben.filter(x => x.antwort.trim()).length,
      anzahl: aufgaben.length,
      minuten: B.sekunden ? Math.round(B.sekunden / 60) : null,
      aufgaben
    }, true);
  }

  function abgeben() {
    if (BLATT.abgegeben) return;
    uhrStop();
    BLATT.abgegeben = true;
    BLATT.dauer = BLATT.sekunden || 0;
    AUFG.forEach((_, i) => pruefe(i, true));
    sichern();
    /* Simulation ins Archiv — dort liegt sie neben den Prüfungsdurchgängen
       und überlebt auch das Löschen des Arbeitsblatts.                   */
    try { archivieren("abgegeben"); } catch (e) { console.error("Archiv:", e); }
    zeichne();                       // neu zeichnen: Lösungen sind jetzt frei
    standAktualisieren();
    abschluss();
  }

  /* ======================= Uhr ========================================== */
  function uhrStart() {
    uhrStop();
    if (!BLATT.zeit) { const u = $("genUhr"); if (u) u.hidden = true; return; }
    const grenze = BLATT.minuten ? BLATT.minuten * 60
                 : (BLATT.zeit === 2 ? Math.round(BLATT.maxPoints * 0.9 * 60) : 0);
    UHR = setInterval(() => {
      BLATT.sekunden = (BLATT.sekunden || 0) + 1;
      const u = $("genUhr");
      if (!u) return uhrStop();
      const s = grenze ? Math.max(0, grenze - BLATT.sekunden) : BLATT.sekunden;
      u.textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
      u.classList.toggle("warn", !!grenze && s < 300);
      if (BLATT.sekunden % 15 === 0) sichern();
      /* Prüfungssimulation: bei Null ist Schluss, wie im echten Saal */
      if (grenze && BLATT.pruefung && !BLATT.abgegeben && BLATT.sekunden >= grenze) {
        uhrStop();
        window.toast("Zeit abgelaufen — die Prüfung wird ausgewertet.");
        abgeben();
      }
    }, 1000);
  }
  function uhrStop() { if (UHR) clearInterval(UHR); UHR = null; }

  /* ======================= Export ======================================= */
  function markdownExport() {
    const L = ["# " + BLATT.titel, "", "_Generiertes Arbeitsblatt · " + BLATT.erstellt +
      " · " + nz(BLATT.maxPoints) + " BE_", ""];
    AUFG.forEach((a, i) => {
      const e = BLATT.ergebnisse[i];
      L.push("## Aufgabe " + (i + 1) + " — " + a.titel + "  (" + nz(a.maxPoints) + " BE" +
        (e ? ", erreicht " + nz(e.punkte) : "") + ")");
      L.push("_" + a.themaLabel + " · " + a.sub + " · Vorlage `" + a.vorlageId + "`, Saat `" + a.saat + "`_", "");
      if (a.situation) L.push("**Ausgangssituation**", "", a.situation, "");
      (a.tabellen || []).forEach(t => {
        L.push("| " + t.kopf.join(" | ") + " |");
        L.push("|" + t.kopf.map(() => "---").join("|") + "|");
        t.zeilen.forEach(z => L.push("| " + z.join(" | ") + " |"));
        L.push("");
      });
      L.push("**Aufgabe**", "", a.prompt, "");
      a.felder.forEach(f => {
        const w = (BLATT.antworten[i] || {})[f.nr];
        L.push("- **" + f.label + "** (" + nz(f.be) + " BE): " +
          (w == null || w === "" ? "_(leer)_" : (typeof w === "object" ? JSON.stringify(w) : String(w).replace(/\n/g, " / "))));
      });
      L.push("", "<details><summary>Musterlösung</summary>", "", "```", a.loesung, "```", "</details>", "");
    });
    if (window.download) window.download(
      "arbeitsblatt_" + new Date().toISOString().slice(0, 10) + ".md", L.join("\n"), "text/markdown");
    if (window.toast) window.toast("Markdown gespeichert.");
  }

  /* ======================= Einhängen ==================================== */
  function einhaengen() {
    seiteAnlegen();

    const altSchirm = window.schirm;
    window.schirm = function (name) {
      altSchirm(name);
      const g = $("scGen");
      if (g) g.hidden = (name !== "scGen");
      if (name !== "scGen") uhrStop();
      if (name === "scGen") {
        $("kopfTitel").hidden = false;
        $("schalterKatalog").hidden = true;
        $("mwPunkte").hidden = true;
        $("mwUhr").hidden = true;
        $("btnUhr").hidden = true;
        $("fuss").hidden = true;
        window.scrollTo(0, 0);
      }
    };

    const altStart = window.renderStart;
    window.renderStart = function () { altStart.apply(null, arguments); try { startBox(); } catch (e) { console.error(e); } };

    startBox();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { erzeugeBlatt, oeffne, assistent, startBox, speichern: sichern, abgeben, archivieren,
           bilanz, blaetter: () => BLAETTER };
})();
