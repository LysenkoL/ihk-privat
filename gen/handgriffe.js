/* ============================================================================
   gen/handgriffe.js — die kleinen Dinge, die den Unterschied machen
   ----------------------------------------------------------------------------
   Kein neues Kapitel, keine neue Funktion — nur die Stellen, an denen das
   Programm bisher Arbeit erzeugt hat, die niemand braucht:

   1. LESEZEICHEN. Der Bogen von Frühjahr 2023 ist auf dem Telefon 25 000
      Bildpunkte lang — dreißig Bildschirme. Wer bei Aufgabe 2 c) im
      Spickzettel etwas nachschlägt und zurückkommt, stand wieder ganz oben
      und musste sich hinunterwischen. Die Stelle wird jetzt je Prüfung
      gemerkt und beim Öffnen wiederhergestellt.

   2. WEITER, WO ICH WAR. Ganz oben auf der Startseite steht, welche Prüfung
      zuletzt offen war, wie weit sie ist und ein Knopf, der genau dorthin
      zurückführt. Vorher musste man sich durch siebzehn Abschnitte zur
      richtigen Karte suchen.

   3. SPRUNGLEISTE. Eine Zeile mit allen Teilaufgaben als Kästchen: gefüllt,
      wenn beantwortet, leer, wenn nicht. Ein Tipp springt hin. Damit ist
      „wo habe ich noch Lücken“ eine Blickbewegung statt einer Scrollfahrt.

   4. OFFLINE-ZEICHEN. Ohne Netz läuft alles weiter (dafür ist der Service
      Worker da) — aber man sieht es nirgends und ist sich unsicher, ob die
      Antworten ankommen. Ein kleines Zeichen in der Kopfzeile sagt es.

   5. FELDER WACHSEN MIT, auch beim Öffnen. Die Höhe wurde bisher nur beim
      Tippen angepasst; wer eine lange Antwort gespeichert hatte, fand beim
      nächsten Öffnen ein Feld mit drei sichtbaren Zeilen und Rollbalken.
   ========================================================================== */
"use strict";

window.GENHANDGRIFF = (function () {
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  const SK = "ihk2:lesezeichen";
  const lies = () => { try { return JSON.parse(localStorage.getItem(SK) || "{}"); } catch (e) { return {}; } };
  const schreib = o => { try { localStorage.setItem(SK, JSON.stringify(o)); } catch (e) { } };

  const V = () => (typeof VIEW !== "undefined" ? VIEW : null);
  const imBogen = () => { const s = $("scBogen"); return s && !s.hidden; };

  /* ======================================================= 1. Lesezeichen */

  function schluessel() {
    const v = V();
    if (!v) return null;
    if (v.modus === "pruefung" && v.exam) return v.exam.examId;
    return v.modus === "uebung" ? "uebung" : null;
  }

  let merkUhr = null;
  function merken() {
    if (!imBogen()) return;
    const k = schluessel();
    if (!k) return;
    const o = lies();
    o[k] = { y: Math.round(window.scrollY), zeit: Date.now() };
    /* Nur die letzten zehn behalten — sonst wächst der Eintrag ewig. */
    const namen = Object.keys(o).sort((a, b) => (o[b].zeit || 0) - (o[a].zeit || 0));
    namen.slice(10).forEach(n => delete o[n]);
    schreib(o);
  }

  function wiederherstellen() {
    const k = schluessel();
    if (!k) return;
    const o = lies()[k];
    if (!o || !o.y || o.y < 400) return;
    /* Der Bogen wird in mehreren Wellen aufgebaut (Tabellen, Diagramme,
       Rechenwege). Vor der letzten Welle stimmt die Höhe noch nicht, und
       ein Sprung landet zu tief. Deshalb dreimal nachfassen.           */
    [80, 400, 900].forEach(ms => setTimeout(() => {
      if (!imBogen()) return;
      const max = document.body.scrollHeight - window.innerHeight;
      window.scrollTo(0, Math.min(o.y, Math.max(0, max)));
    }, ms));
  }

  window.addEventListener("scroll", () => {
    if (merkUhr) return;
    merkUhr = setTimeout(() => { merkUhr = null; merken(); }, 700);
  }, { passive: true });
  window.addEventListener("beforeunload", merken);
  document.addEventListener("visibilitychange", () => { if (document.hidden) merken(); });

  /* ================================================= 2. Weiter, wo ich war */

  function stand(ex) {
    const subs = (typeof examSubs === "function") ? examSubs(ex) : [];
    let beantwortet = 0, offen = null;
    subs.forEach(s => {
      const da = (typeof hatAntwort === "function") ? hatAntwort(s)
                 : !!(typeof ANSWERS !== "undefined" && ANSWERS[s.k]);
      if (da) beantwortet++;
      else if (!offen) offen = s;
    });
    return { gesamt: subs.length, beantwortet: beantwortet, offen: offen };
  }

  function weiterKarte() {
    const alt = $("hgWeiter");
    if (alt) alt.remove();
    const marken = lies();
    const namen = Object.keys(marken).filter(n => n !== "uebung")
      .sort((a, b) => (marken[b].zeit || 0) - (marken[a].zeit || 0));
    if (!namen.length) return;
    const liste = (typeof EXAMS !== "undefined" && EXAMS) || [];
    const ex = liste.find(e => e.examId === namen[0]);
    if (!ex) return;

    const s = stand(ex);
    if (!s.gesamt || s.beantwortet === 0) return;   /* nichts, worauf man zurückkäme */

    const box = el("div", "hg-weiter"); box.id = "hgWeiter";
    const txt = el("div", "hg-weiter-txt");
    txt.append(
      el("span", "hg-weiter-titel", (ex.meta.season || "") + " " + (ex.meta.year || "")),
      el("span", "hg-weiter-stand",
        s.beantwortet + " von " + s.gesamt + " beantwortet" +
        (s.offen ? " · offen ab " + (s.offen.fullLabel || s.offen.label) : ""))
    );
    const knopf = el("button", "btn primary", "weiterlesen");
    knopf.onclick = () => {
      if (typeof oeffnePruefung === "function") oeffnePruefung(ex);
      if (typeof zeigeBogen === "function") zeigeBogen();
      if (typeof schirm === "function") schirm("scBogen");
      wiederherstellen();
    };
    box.append(txt, knopf);

    /* Vor das erste Kind von scStart — NICHT vor den ersten .abschnitt:
       der steckt meist noch in einem Zwischencontainer, und insertBefore
       verlangt ein direktes Kind.                                       */
    const ziel = $("scStart");
    if (ziel) ziel.insertBefore(box, ziel.firstElementChild);
  }

  /* ===================================================== 3. Sprungleiste */

  function sprungleiste() {
    if (!imBogen()) return;
    const v = V();
    /* Aus den Karten im Dokument, nicht aus VIEW.items: gefilterte und
       als „veraltet“ markierte Aufgaben stehen im Bogen, fehlten aber in
       der Liste — und waren dann über die Leiste nicht erreichbar.     */
    const karten = [...document.querySelectorAll("#bogenMain .tk")];
    if (karten.length < 6) return;
    const alt = $("hgSprung");
    if (alt) alt.remove();

    const box = el("div", "hg-sprung"); box.id = "hgSprung";
    const auf = el("button", "hg-sprung-auf", "Aufgaben");
    const gitter = el("div", "hg-sprung-gitter");
    box.append(auf, gitter);

    karten.forEach(karte => {
      const it = (v && v.items || []).find(x => x.k === karte.dataset.k);
      const roh = it ? (it.fullLabel || it.label || "")
                     : (karte.querySelector(".tk-nr span") || {}).textContent || "";
      const name = String(roh).replace(/^\s*\d+\.\s*/, "").replace(/^Teilaufgabe\s+/, "").replace(/\)$/, "").trim();
      const b = el("button", "hg-punkt", name || "?");
      b.title = "Teilaufgabe " + name + (it && it.maxPoints ? " · " + it.maxPoints + " BE" : "");
      b.dataset.ziel = karte.id;
      b.onclick = () => {
        const z = document.getElementById(karte.id);
        if (z) z.scrollIntoView({ behavior: "smooth", block: "start" });
        box.classList.remove("offen");
      };
      gitter.appendChild(b);
    });

    auf.onclick = () => { box.classList.toggle("offen"); faerben(); };

    function faerben() {
      gitter.querySelectorAll(".hg-punkt").forEach(b => {
        const karte = document.getElementById(b.dataset.ziel);
        b.classList.toggle("voll", !!(karte && karte.classList.contains("done")));
        b.classList.toggle("bewertet", !!(karte && karte.classList.contains("bewertet")));
      });
    }
    faerben();
    document.addEventListener("input", () => { if (box.classList.contains("offen")) faerben(); });

    /* IN den Hauptbereich, nicht davor: #scBogen ist ein Raster mit den
       Spalten „Rand 320px | Inhalt 880px“. Ein zusätzliches Kind davor
       belegte die Inhaltsspalte, und <main> rutschte in die nächste
       Rasterzeile — auf dem Schreibtisch war der ganze Bogen danach
       320 px schmal. Am Telefon (eine Spalte) fiel das nicht auf.      */
    const haupt = $("bogenMain");
    if (haupt) haupt.insertBefore(box, haupt.firstChild);
  }

  /* ============================================ 3b. Zurück nach oben --- */

  /* Auf dreißig Bildschirmen Bogenlänge ist der Weg zur Übersicht sonst
     eine halbe Minute Wischen.                                          */
  function obenKnopf() {
    let b = $("hgOben");
    if (!b) {
      b = el("button", "hg-oben", "↑"); b.id = "hgOben";
      b.title = "nach oben — zur Aufgabenübersicht";
      b.setAttribute("aria-label", "Nach oben");
      b.onclick = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        const s = $("hgSprung");
        if (s) s.classList.add("offen");
      };
      document.body.appendChild(b);
    }
    b.hidden = !(imBogen() && window.scrollY > 1500);
  }
  window.addEventListener("scroll", obenKnopf, { passive: true });

  /* ======================================================== 4. Offline --- */

  function netzZeichen() {
    let z = $("hgNetz");
    if (!z) {
      z = el("span", "hg-netz", "offline"); z.id = "hgNetz";
      z.title = "Keine Verbindung — die App läuft weiter, alles wird lokal gespeichert.";
      const meta = document.querySelector(".kopf-meta");
      if (meta) meta.insertBefore(z, meta.firstChild); else return;
    }
    z.hidden = navigator.onLine !== false;
  }
  window.addEventListener("online", netzZeichen);
  window.addEventListener("offline", netzZeichen);

  /* ============================================ 5. Felder richtig hoch --- */

  function felderHoch() {
    document.querySelectorAll("#bogenMain textarea").forEach(t => {
      if (t.classList.contains("tb-feld")) return;
      if (!String(t.value || "").trim()) return;
      t.style.height = "auto";
      t.style.height = Math.max(60, t.scrollHeight + 2) + "px";
    });
  }

  /* ----------------------------------------------------------- Einhängen */

  function nachBogen() {
    setTimeout(() => { sprungleiste(); felderHoch(); wiederherstellen(); obenKnopf(); }, 40);
  }

  function einhaengen() {
    netzZeichen();
    obenKnopf();

    /* Auf dem Telefon wird die Seite nicht geschlossen, sondern weggewischt.
       Dabei feuert kein blur und kein beforeunload — nur dieses Ereignis.
       Ohne das konnte die letzte getippte Antwort verloren gehen.       */
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && typeof window.speichern === "function") {
        try { window.speichern(); } catch (e) { }
      }
    });

    const altBogen = window.zeigeBogen;
    if (typeof altBogen === "function" && !altBogen.__hg) {
      const neu = function () {
        const r = altBogen.apply(this, arguments);
        try { nachBogen(); } catch (e) { console.error("Handgriffe:", e); }
        return r;
      };
      neu.__hg = true; window.zeigeBogen = neu;
    }

    const altStart = window.renderStart;
    if (typeof altStart === "function" && !altStart.__hg) {
      const neu = function () {
        const r = altStart.apply(this, arguments);
        try { weiterKarte(); } catch (e) { console.error("Handgriffe:", e); }
        return r;
      };
      neu.__hg = true; window.renderStart = neu;
    }
    /* Auch hier: die Startseite steht schon, wenn dieses Modul lädt. */
    setTimeout(weiterKarte, 60);

    /* Beim Verlassen des Bogens die Stelle festhalten. */
    const altSchirm = window.schirm;
    if (typeof altSchirm === "function" && !altSchirm.__hg) {
      const neu = function (name) {
        if (name !== "scBogen") merken();
        return altSchirm.apply(this, arguments);
      };
      neu.__hg = true; window.schirm = neu;
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { merken, wiederherstellen, sprungleiste, weiterKarte };
})();
