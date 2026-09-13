/* ============================================================================
   gen/fortschritt.js — Export und Import nehmen den Generator mit
   ----------------------------------------------------------------------------
   „Fortschritt exportieren“ sicherte bisher nur die Prüfungsseite: Antworten,
   Punkte, Zeiten, Durchgänge, Karteikarten. Alles, was der Generator über
   Lena weiß, blieb draußen — die Quoten zu 101 Aufgabentypen, die
   Arbeitsblätter, das Satzbau-Training und das Fehlerjournal. Beim Wechsel
   aufs Handy oder nach einer Browser-Bereinigung war das weg.

   Diese Datei hängt sich in den vorhandenen Export und Import ein, statt sie
   zu ersetzen: der Download bekommt einen Block `gen` dazu, und beim Import
   werden diese Schlüssel zurückgeschrieben.
   ========================================================================== */
"use strict";

window.GENFORTSCHRITT = (function () {

  /* Alle localStorage-Schlüssel des Generators */
  const SCHLUESSEL = [
    "ihk2:gen:blaetter",     // erzeugte Arbeitsblätter samt Antworten
    "ihk2:gen:stat",         // Quote je Aufgabentyp
    "ihk2:gen:satz",         // Satzbau-Training
    "ihk2:gen:fehler",       // Fehlerjournal
    "ihk2:gen:letzteWahl",   // zuletzt gewählte Themen im Assistenten
    "ihk2:marker",           // Textmarkierungen in den Aufgabentexten
    "ihk2:zeit",             // gemessenes Tempo je Aufgabentyp
    "ihk2:plan",             // Lernplan: Minuten pro Tag, abgehakte Tage
    "ihk2:pseudo",           // Pseudocode-Trainer
    "ihk2:archiv",           // Archiv der Durchgänge samt Antworten
    "ihk2:komp:mein",        // eigener Lernstand je Kompendium-Thema
    "ihk2:spick"             // zuletzt gelesenes Kapitel im Spickzettel
  ];

  function einsammeln() {
    const out = {};
    SCHLUESSEL.forEach(k => {
      try {
        const r = localStorage.getItem(k);
        if (r != null) out[k] = JSON.parse(r);
      } catch (e) { }
    });
    return out;
  }

  function zurueckschreiben(gen, zusammenfuehren) {
    if (!gen) return 0;
    let n = 0;
    Object.keys(gen).forEach(k => {
      if (SCHLUESSEL.indexOf(k) < 0) return;
      try {
        const neu = gen[k];
        if (neu == null) return;
        if (zusammenfuehren) {
          const altRoh = localStorage.getItem(k);
          const alt = altRoh ? JSON.parse(altRoh) : null;
          localStorage.setItem(k, JSON.stringify(mische(alt, neu)));
        } else {
          localStorage.setItem(k, JSON.stringify(neu));
        }
        n++;
      } catch (e) { }
    });
    return n;
  }

  /** Arrays aneinanderhängen (ohne Dubletten), Objekte flach vereinigen */
  function mische(alt, neu) {
    if (alt == null) return neu;
    if (Array.isArray(alt) && Array.isArray(neu)) {
      const kenn = x => (x && (x.id || x.schluessel)) || JSON.stringify(x);
      const da = new Set(alt.map(kenn));
      return alt.concat(neu.filter(x => !da.has(kenn(x))));
    }
    if (typeof alt === "object" && typeof neu === "object") {
      /* Die eigenen, aktuelleren Werte gewinnen */
      return Object.assign({}, neu, alt);
    }
    return alt;
  }

  function zusammenfassung(gen) {
    if (!gen) return "";
    const b = (gen["ihk2:gen:blaetter"] || []).length;
    const s = Object.keys(gen["ihk2:gen:stat"] || {}).length;
    const f = (gen["ihk2:gen:fehler"] || []).length;
    const t = [];
    if (b) t.push(b + " Arbeitsblätter");
    if (s) t.push(s + " Aufgabentypen mit Quote");
    if (f) t.push(f + " Journaleinträge");
    if (gen["ihk2:gen:satz"]) t.push("Satzbau-Fortschritt");
    const m = Object.keys(gen["ihk2:marker"] || {}).length;
    if (m) t.push(m + " markierte Absätze");
    const k = Object.keys(gen["ihk2:komp:mein"] || {}).length;
    if (k) t.push(k + " Kompendium-Themen mit Stand");
    return t.join(" · ");
  }

  /* ------------------------------------------------------------ Einhängen */
  function einhaengen() {

    /* 1. Export: die Datei wird von download() geschrieben — dort greifen
          wir sie ab und ergänzen den Generator-Block.                    */
    const altDownload = window.download;
    if (typeof altDownload === "function" && !altDownload.__gf) {
      const neu = function (name, text, mime) {
        try {
          if (/json/i.test(mime || "") && /fortschritt/i.test(name || "")) {
            const d = JSON.parse(text);
            if (d && d.typ === "ihk-ap1-fortschritt") {
              d.gen = einsammeln();
              d.genVersion = 1;
              text = JSON.stringify(d, null, 2);
            }
          }
        } catch (e) { console.error("Fortschritt:", e); }
        return altDownload.call(this, name, text, mime);
      };
      neu.__gf = true;
      window.download = neu;
    }

    /* 2. Import: in der CAPTURE-Phase mitlesen, bevor index.html das
          Dateifeld zurücksetzt. Danach die Seite neu laden, damit die
          Module ihre Daten frisch einlesen.                             */
    const feld = document.getElementById("importDatei");
    if (feld && !feld.__gf) {
      feld.__gf = true;
      feld.addEventListener("change", ev => {
        const f = ev.target && ev.target.files && ev.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          let d;
          try { d = JSON.parse(r.result); } catch (e) { return; }
          if (!d || d.typ !== "ihk-ap1-fortschritt" || !d.gen) return;
          /* Ab Dateiversion 3 trägt index.html ohnehin JEDEN ihk2-Schlüssel
             zurück und lädt danach selbst neu. Dann hier nichts tun — sonst
             schreiben zwei Stellen dieselben Daten und laden zweimal neu. */
          if (d.speicher && typeof d.speicher === "object") return;
          const info = zusammenfassung(d.gen);
          /* Die Nachfrage „zusammenführen oder ersetzen“ stellt index.html.
             Diese Datei hier läuft in der Capture-Phase und ist damit schon
             fertig, bevor die Antwort feststeht — also kurz darauf warten.
             Wird der Import dort abgebrochen, passiert hier auch nichts;
             ohne Antwort (alte Fassung von index.html) wird wie bisher
             zusammengeführt, denn das kann nichts zerstören.            */
          const losGehts = () => {
            const w = window.__ihkImport;
            if (w === "abbruch") return;
            const n = zurueckschreiben(d.gen, w !== "ersetzen");
            if (!n) return;
            setTimeout(() => {
              if (window.toast) window.toast("Generator-Daten übernommen: " + info + " — Seite wird neu geladen.");
              setTimeout(() => location.reload(), 900);
            }, 400);
          };
          let warten = 0;
          (function pruefe(){
            if (window.__ihkImport || warten > 40) return losGehts();
            warten++; setTimeout(pruefe, 50);
          })();
        };
        r.readAsText(f, "utf-8");
      }, true);   /* capture */
    }

    /* 3. Hinweis im Datenbereich, damit klar ist, was mitgeht */
    const knopf = document.getElementById("btnExport");
    if (knopf && knopf.parentNode && !document.getElementById("gfHinweis")) {
      const p = document.createElement("p");
      p.id = "gfHinweis";
      p.style.cssText = "font-size:12.5px;color:var(--muted);line-height:1.6;margin:8px 0 0";
      const info = zusammenfassung(einsammeln());
      p.innerHTML = "Die Datei enthält auch den Generator: " +
        (info || "Arbeitsblätter, Quoten je Aufgabentyp, Satzbau und Fehlerjournal") +
        ". Damit lässt sich der Stand zwischen Rechner und Handy übertragen — " +
        "im Browser des Handys ist der Fortschritt sonst ein eigener.";
      knopf.parentNode.appendChild(p);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { SCHLUESSEL, einsammeln, zurueckschreiben, zusammenfassung };
})();
