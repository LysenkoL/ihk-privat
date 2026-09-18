/* ============================================================================
   gen/merkblatt.js — eine Seite, die nur aus meinen eigenen Fehlern besteht
   ----------------------------------------------------------------------------
   Das Formelblatt sammelt, was in der Prüfung gebraucht wird. Dieses Blatt
   sammelt etwas anderes: was DU in den letzten Wochen falsch gemacht hast.

   Der Unterschied ist nicht kosmetisch. Die Auswertung der Übungssätze zeigt
   immer dasselbe Muster: die meisten verlorenen BE sind keine Wissenslücken,
   sondern sechs, sieben Handgriffe, die fehlen — Einheit nicht hingeschrieben,
   nur ein Stichwort statt eines Satzes, den zweiten Teil der Frage übersehen,
   Rechenweg weggelassen. Gegen Wissenslücken hilft lernen; dagegen hilft nur,
   es kurz vor der Prüfung noch einmal gelesen zu haben.

   Deshalb entsteht das Blatt aus vier eigenen Quellen:

     Fehlerjournal      welche Fehlerart wie oft, mit dem Gegenmittel dazu
     Gesamtstatistik    welche Themen am meisten Punkte kosten
     Satzbau-Training   genau die Musterantworten, die noch nicht saßen
     die harten Regeln  die fünf, die in jeder Prüfung Punkte bringen

   Eine A4-Seite, zwei Spalten, druckbar. Gedacht für die letzten drei Tage:
   an die Wand, morgens einmal durchlesen, mehr nicht.
   ========================================================================== */
"use strict";

window.GENMERKBLATT = (function () {
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  const TERMIN = (window.GENSTART && window.GENSTART.TERMIN) || new Date(2026, 8, 30);
  const tageBis = () => {
    const h = new Date(); h.setHours(0, 0, 0, 0);
    const t = new Date(TERMIN); t.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((t - h) / 864e5));
  };

  /* Die Regeln, die nicht aus den Daten kommen — sie gelten immer und
     stehen deshalb auch dann da, wenn das Journal noch leer ist.        */
  const REGELN = [
    { f: "Jedes Ergebnis: Zahl + Einheit + Bezug",
      h: "„Die laufenden Kosten betragen 616,00 € pro Monat für alle zehn Arbeitsplätze.“ Eine nackte Zahl ist ein halber Punkt." },
    { f: "Verben in der Aufgabe zählen, bevor du schreibst",
      h: "„Nennen Sie zwei … und begründen Sie“ sind vier Antworten. Die Zeile über dem Feld sagt dir, wie viele verlangt sind." },
    { f: "Nach jedem Fachbegriff ein „weil / dadurch / damit“",
      h: "Ein Stichwort allein zählt nicht. Zwei kurze Sätze reichen — einfaches Deutsch ist erlaubt." },
    { f: "Rechenweg hinschreiben, auch wenn das Ergebnis stimmt",
      h: "Ohne Weg gibt es für ein richtiges Ergebnis nur Teilpunkte, mit Weg für ein falsches noch welche." },
    { f: "Empfehlung aussprechen und mit einer Zahl belegen",
      h: "„Ich empfehle Angebot B, weil es um 412,50 € günstiger ist.“ Ohne Satz kein Urteil, ohne Zahl keine Begründung." },
    { f: "Runden: kaufmännisch auf zwei Stellen, wenn nichts anderes dasteht",
      h: "Stückzahlen und Pakete aufrunden, Reichweiten und Laufzeiten abrunden." }
  ];

  const ABLAUF = [
    { f: "Erst blättern, dann schreiben",
      h: "Zwei Minuten durch alle Aufgaben. Dann mit der leichtesten anfangen — nicht mit Nummer 1." },
    { f: "Pro BE knapp eine Minute",
      h: "100 BE in 90 Minuten. Bei einer Aufgabe, die länger als das Doppelte braucht: Kreuz an den Rand und weiter." },
    { f: "Nichts leer lassen",
      h: "Eine halbe Antwort ist mehr als keine. Für ein leeres Feld gibt es sicher null." },
    { f: "Letzte zehn Minuten: Kontrollgang",
      h: "Alle Ergebnisfelder: steht eine Einheit dran? Alle angekreuzten Aufgaben noch einmal ansehen." }
  ];

  /* ------------------------------------------------------------- Quellen */

  /** Fehlerarten nach Häufigkeit, mit dem Gegenmittel aus dem Journal. */
  function fehlerarten(tage) {
    const F = window.GENFEHLER;
    if (!F) return { zeilen: [], gesamt: 0, verloren: 0, offen: 0 };
    let v = { zaehler: {}, gesamt: 0, verloren: 0 };
    try { v = F.verteilung(tage || 30); } catch (e) { }
    const zeilen = (F.GRUENDE || [])
      .map(g => ({ key: g.key, lang: g.lang, rat: g.rat, n: v.zaehler[g.key] || 0 }))
      .filter(x => x.n > 0)
      .sort((a, b) => b.n - a.n);
    let offen = 0;
    try { offen = F.liste().filter(x => !x.erledigt).length; } catch (e) { }
    return { zeilen, gesamt: v.gesamt || 0, verloren: v.verloren || 0, offen };
  }

  /** Die teuersten Themen — Gewicht mal Lücke, wie in der Gesamtstatistik. */
  function themen(max) {
    let z = [];
    try {
      z = (window.GENGESAMT.daten().zeilen || [])
        .filter(x => x.gewicht && x.quote !== null)
        .sort((a, b) => (b.risiko || 0) - (a.risiko || 0));
    } catch (e) { }
    return z.slice(0, max || 6).map(x => ({
      label: x.label,
      quote: Math.round(x.quote * 100),
      gewicht: Math.round(x.gewicht),
      verlust: Math.round(x.risiko * 10) / 10
    }));
  }

  /** Musterantworten, die im Satzbau-Training noch nicht gesessen haben. */
  function saetze(max) {
    const pool = window.SATZ_POOL || [];
    if (!pool.length) return [];
    let stat = {};
    try { stat = JSON.parse(localStorage.getItem("ihk2:gen:satz")) || {}; } catch (e) { }
    /* Die Themen, in denen die meisten Punkte fehlen, zuerst */
    const schwach = themen(8).map(t => String(t.label).toLowerCase());
    const rang = k => {
      const s = stat[k.id];
      const best = s ? (s.bestPunkte || 0) : -1;          /* nie geübt zuerst */
      const th = String(k.thema || "").toLowerCase();
      const tr = schwach.findIndex(x => th.includes(x) || x.includes(th));
      return best * 10 + (tr < 0 ? 5 : tr);
    };
    return pool.slice().sort((a, b) => rang(a) - rang(b)).slice(0, max || 6)
      .map(k => ({ f: k.thema + ": " + (k.stichwort || ""), h: k.muster }));
  }

  /* --------------------------------------------------------------- Bauen */
  function block(titel, zeilen) {
    const box = el("div", "fo-block");
    box.appendChild(el("h3", null, titel));
    zeilen.forEach(z => {
      const zeile = el("div", "fo-zeile");
      zeile.appendChild(el("div", "fo-f", z.f));
      if (z.h) zeile.appendChild(el("div", "fo-h", z.h));
      box.appendChild(zeile);
    });
    return box;
  }

  function zeigen() {
    if (!window.GENDRUCK) return;
    window.GENDRUCK.zeige({ titel: "Merkblatt", erstellt: "" }, [], { loesung: false });

    const fa = fehlerarten(30);
    const th = themen(6);
    const sa = saetze(6);
    const n = tageBis();

    /* --------------------------------------------------------- Leiste --- */
    const leiste = $("druckLeiste");
    leiste.innerHTML = "";
    const info = el("div", "dr-info");
    info.innerHTML = "<b>Merkblatt</b> — deine eigenen Fehler auf einer Seite. " +
      "Nicht zum Lernen, zum Erinnern: die letzten drei Tage jeden Morgen einmal durchlesen.";
    leiste.appendChild(info);
    leiste.appendChild(el("span", "weit"));
    const dr = el("button", "btn primary", "Drucken / als PDF speichern");
    dr.onclick = () => window.print();
    leiste.appendChild(dr);
    const zu = el("button", "btn ghost", "zurück");
    zu.onclick = () => window.GENDRUCK.schliessen();
    leiste.appendChild(zu);

    /* ---------------------------------------------------------- Blatt --- */
    const b = $("druckBogen");
    b.innerHTML = "";
    const s = el("section", "dr-formeln");

    const kopf = el("div", "dr-deckkopf");
    kopf.appendChild(el("div", "dr-klein", "IHK AP1 · " +
      (n === 0 ? "heute" : n === 1 ? "noch 1 Tag" : "noch " + n + " Tage")));
    kopf.appendChild(el("h1", null, "Mein Merkblatt"));
    kopf.appendChild(el("div", "dr-klein",
      fa.gesamt
        ? "Aus " + fa.gesamt + " Fehlern der letzten 30 Tage — dabei sind " +
          fa.verloren + " BE liegen geblieben. Fast nichts davon war fehlendes Wissen."
        : "Noch keine Fehler im Journal. Die Regeln unten gelten trotzdem — sie kosten " +
          "in jeder Prüfung zweistellige Punktzahlen."));
    s.appendChild(kopf);

    const sp = el("div", "fo-spalten");

    if (fa.zeilen.length) {
      sp.appendChild(block("Was mir am häufigsten passiert",
        fa.zeilen.map(z => ({ f: z.n + "× " + z.lang, h: z.rat }))));
    }

    sp.appendChild(block("Die sechs Regeln", REGELN));

    if (th.length) {
      sp.appendChild(block("Wo die Punkte fehlen",
        th.map(t => ({
          f: t.label + " — " + t.quote + " %",
          h: t.gewicht + " BE Gewicht pro Prüfung, davon gehen im Schnitt " +
             t.verlust + " BE verloren."
        }))));
    }

    if (sa.length) {
      sp.appendChild(block("Sätze, die noch nicht saßen", sa));
    }

    sp.appendChild(block("Ablauf am Prüfungstag", ABLAUF));

    if (window.SATZ_MUSTER && window.SATZ_MUSTER.length) {
      const m = el("div", "fo-block");
      m.appendChild(el("h3", null, "Satzanfänge, die immer gehen"));
      const z = el("div", "fo-zeile");
      z.appendChild(el("div", "fo-f", window.SATZ_MUSTER.slice(0, 10).join("   ·   ")));
      m.appendChild(z);
      sp.appendChild(m);
    }

    s.appendChild(sp);

    const fuss = el("div", "dr-klein");
    fuss.style.marginTop = "8pt";
    fuss.textContent = fa.offen
      ? fa.offen + " Fehler im Journal sind noch nicht eingeordnet — je mehr davon einen " +
        "Grund haben, desto genauer wird dieses Blatt."
      : "Gebaut aus Fehlerjournal, Gesamtstatistik und Satzbau-Training. Nach jeder " +
        "Simulation neu aufrufen — die Seite rechnet sich jedes Mal neu.";
    s.appendChild(fuss);

    b.appendChild(s);
    window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------ Einbauen */
  function knopfEinbauen() {
    const ziel = $("satzBox") || $("genStartBox");
    if (!ziel || $("btnMerkblatt")) return;
    const zeile = el("div", "gen-knopfzeile");
    zeile.style.marginTop = "10px";
    const k = el("button", "btn"); k.id = "btnMerkblatt";
    k.textContent = "Merkblatt (A4): meine eigenen Fehler";
    k.onclick = zeigen;
    zeile.appendChild(k);
    const hin = el("span");
    hin.style.cssText = "font-size:13px;color:var(--muted)";
    const fa = fehlerarten(30);
    hin.textContent = fa.gesamt
      ? fa.gesamt + " Fehler der letzten 30 Tage, " + fa.verloren + " BE."
      : "Fehlerarten, schwache Themen, offene Satzmuster — auf einer Seite.";
    zeile.appendChild(hin);
    ziel.appendChild(zeile);
  }

  function einhaengen() {
    const alt = window.renderStart;
    if (typeof alt === "function" && !alt.__mb) {
      const neu = function () {
        const r = alt.apply(this, arguments);
        try { knopfEinbauen(); } catch (e) { console.error("Merkblatt:", e); }
        return r;
      };
      neu.__mb = true; window.renderStart = neu;
    }
    setTimeout(() => { try { knopfEinbauen(); } catch (e) { } }, 450);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { zeigen, fehlerarten, themen, saetze, REGELN, ABLAUF };
})();
