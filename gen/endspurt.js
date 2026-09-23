/* ============================================================================
   gen/endspurt.js — die letzten Tage, einmal festgelegt
   ----------------------------------------------------------------------------
   Der Lernplan in plan.js rechnet jeden Tag neu: Prüfungsgewicht mal Lücke,
   und der Tag bekommt das Thema mit dem höchsten Risiko. Das ist über Wochen
   richtig. In den letzten zwei Wochen ist es falsch — aus zwei Gründen.

   Erstens ändert sich die Reihenfolge noch, während man sie abarbeitet. Wer
   morgens aufmacht und etwas anderes vorfindet als gestern, fängt wieder von
   vorne an zu entscheiden; genau das sollte der Plan abnehmen.

   Zweitens ist kurz vor der Prüfung nicht mehr die Themenauswahl die
   Stellschraube, sondern der Rhythmus:

       Tag 1   ganze Prüfung, 90 Minuten, auf Papier — und direkt danach
               auswerten: Punkte eintragen, Fehler einordnen
       Tag 2   die eine Schwachstelle, die dabei herausgekommen ist

   Eine Simulation ohne Auswertung ist ein verschenkter Vormittag: sie zeigt
   eine Zahl und sonst nichts. Die Auswertung stand hier erst als eigener Tag
   — sie gehört aber an die Simulation, solange man noch weiß, warum man was
   geschrieben hat. Der Tag danach schließt dann die Lücke, die sie gefunden
   hat.

   Deshalb steht dieser Plan EINMAL fest. Er wird gebaut, gespeichert und
   danach nicht mehr umsortiert — abgehakt wird er, nicht neu verhandelt.
   Neu gebaut wird nur auf Knopfdruck oder wenn der gespeicherte Plan den
   heutigen Tag gar nicht mehr enthält.

   Die letzten Tage sind bewusst leer:

       3 Tage vorher   Rechenaufgaben quer durch alle Prüfungen
       2 Tage vorher   Merkblatt, Satzbau, Fehlerjournal — nichts Neues
       1 Tag  vorher   Formelblatt, Tasche packen, früh Schluss
       Prüfungstag     Checkliste

   Was jetzt noch nicht sitzt, sitzt auch nicht mehr; was man am letzten Abend
   neu anfängt, verdrängt eher etwas, das schon saß.
   ========================================================================== */
"use strict";

window.GENENDSPURT = (function () {
  const SK = "ihk2:endspurt";
  const AB_TAGEN = 16;                 /* ab wann der Endspurt übernimmt */

  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  const TERMIN = (window.GENSTART && window.GENSTART.TERMIN) || new Date(2026, 8, 30);
  const tag0 = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const WOCHENTAG = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  function tageBis() { return Math.max(0, Math.round((tag0(TERMIN) - tag0(new Date())) / 864e5)); }

  /* ------------------------------------------------------------ Speicher */
  let S = { gebaut: null, tage: [], erledigt: {}, planOffen: false };
  try { Object.assign(S, JSON.parse(localStorage.getItem(SK)) || {}); } catch (e) { }
  function sichern() { try { localStorage.setItem(SK, JSON.stringify(S)); } catch (e) { } }

  /* --------------------------------------------------------- Bausteine --- */

  /* Welche Prüfung als nächste? Erst die, die noch nie bewertet wurde —
     neueste zuerst, weil sie am nächsten am heutigen Katalog liegt. Danach
     die mit dem schlechtesten Ergebnis, denn dort ist am meisten zu holen. */
  function warteschlange() {
    if (typeof EXAMS === "undefined" || !EXAMS.length) return [];
    const versuche = (typeof ATTEMPTS === "undefined") ? [] : ATTEMPTS;
    const best = {};
    versuche.forEach(a => {
      if (!a || !a.examId) return;
      if (best[a.examId] == null || a.prozent > best[a.examId]) best[a.examId] = a.prozent;
    });
    const frisch = [], alt = [];
    EXAMS.forEach(ex => {
      const p = best[ex.examId];
      (p == null ? frisch : alt).push({ ex: ex, prozent: p == null ? null : p });
    });
    alt.sort((a, b) => a.prozent - b.prozent);
    return frisch.concat(alt).map(x => x.ex.examId);
  }

  function examVon(id) {
    if (typeof EXAMS === "undefined") return null;
    return EXAMS.find(e => e.examId === id) || null;
  }
  function examName(id) {
    const ex = examVon(id);
    if (!ex) return "Prüfung";
    const m = ex.meta || {};
    return (m.season || "") + " " + (m.year || "");
  }

  /* Die riskantesten Themen — dieselbe Rechnung wie im Lernplan, aber nur
     einmal, beim Bauen. Danach steht sie fest.                            */
  function schwachstellen() {
    let t = [];
    try { t = (window.GENPLAN.lage().themen || []).slice(0, 8); } catch (e) { }
    if (!t.length) {
      try {
        t = (window.GENGESAMT.daten().zeilen || [])
          .filter(z => z.gewicht)
          .sort((a, b) => (b.risiko || 0) - (a.risiko || 0)).slice(0, 8);
      } catch (e) { }
    }
    return t.map(x => ({ key: x.key, label: x.label, gewicht: Math.round(x.gewicht || 0),
                         quote: x.quote == null ? null : Math.round(x.quote * 100) }));
  }

  /* -------------------------------------------------------------- Bauen --- */
  function bauen() {
    const n = tageBis();
    const heute = tag0(new Date());
    const q = warteschlange();
    const schwach = schwachstellen();
    const tage = [];
    let qi = 0, ti = 0, zyklus = 0, letzteSim = null;

    for (let i = 0; i <= n; i++) {
      const d = new Date(heute.getTime() + i * 864e5);
      const rest = n - i;
      const e = { key: iso(d), rest: rest };

      if (rest === 0) {
        e.art = "pruefungstag"; e.minuten = 90;
        e.titel = "Prüfungstag";
        e.text = "Ausweis, zwei Kugelschreiber, Bleistift, Lineal, Taschenrechner " +
                 "(nicht programmierbar), Ersatzbatterie, Wasser. Im Heft zuerst alles " +
                 "einmal durchblättern, dann mit der Aufgabe anfangen, die am leichtesten " +
                 "aussieht — nicht mit Nummer 1.";
      } else if (rest === 1) {
        e.art = "ruhe"; e.minuten = 30;
        e.titel = "Formelblatt und Tasche";
        e.text = "Einmal das Formelblatt laut durchgehen, Merkblatt danebenlegen, Tasche " +
                 "packen, Wecker stellen. Danach Schluss — der Abend vorher bringt keine " +
                 "Punkte mehr, aber schlechter Schlaf kostet welche.";
      } else if (rest === 2) {
        e.art = "wiederholen"; e.minuten = 45;
        e.titel = "Merkblatt, Satzbau, Fehlerjournal";
        e.text = "Nichts Neues mehr. Das eigene Merkblatt lesen, zehn Satzbau-Karten, " +
                 "die offenen Fehler im Journal einordnen. Das ist die letzte Stelle, " +
                 "an der noch Punkte umsonst zu holen sind.";
      } else if (rest === 3) {
        e.art = "rechnen"; e.minuten = 45;
        e.titel = "Rechenaufgaben quer durch alle Prüfungen";
        e.text = "Rechnen ist der größte zusammenhängende Block und deine Stärke — " +
                 "einmal quer durch, damit die Umrechnungen am Prüfungstag von selbst " +
                 "kommen. Immer mit Einheit hinschreiben.";
      } else {
        const phase = zyklus % 2; zyklus++;
        if (phase === 0) {
          e.art = "sim"; e.minuten = 135;
          e.examId = q.length ? q[qi % q.length] : null; qi++;
          letzteSim = e.examId;
          e.titel = "Prüfung " + examName(e.examId) + " — 90 Minuten + Auswertung";
          e.text = "Ausdrucken, auf Papier schreiben, Uhr mitlaufen lassen, keine Lösungen " +
                   "aufklappen. Direkt danach auswerten: Punkte eintragen, jede halbe Antwort " +
                   "mit der Musterlösung vergleichen, jeden Fehler im Journal einordnen.";
          e.zusatz = { art: "nach", examId: e.examId, titel: "Auswertung" };
        } else {
          const s = schwach.length ? schwach[ti % schwach.length] : null; ti++;
          e.art = "thema"; e.minuten = 40;
          e.thema = s ? s.key : null;
          e.titel = "Arbeitsblatt: " + (s ? s.label : "schwächstes Thema");
          e.text = s
            ? (s.quote == null ? "Noch nie bewertet" : s.quote + " % erreicht") +
              " bei " + s.gewicht + " BE Prüfungsgewicht — das ist der teuerste offene Punkt."
            : "Acht Aufgaben aus dem Generator.";
        }
      }
      tage.push(e);
    }
    S.gebaut = iso(heute);
    S.tage = tage;
    sichern();
    return tage;
  }

  /** Gibt es einen gültigen Plan, der den heutigen Tag noch enthält? */
  function plan() {
    const heute = iso(tag0(new Date()));
    if (!S.tage || !S.tage.length || !S.tage.some(t => t.key === heute)) bauen();
    /* Vergangene Tage verschwinden, bleiben aber abgehakt gespeichert. */
    return S.tage.filter(t => t.key >= heute);
  }

  /* ------------------------------------------------------------ Starten --- */
  function starte(t) {
    if (t.art === "sim") {
      const ex = examVon(t.examId);
      if (ex && typeof oeffnePruefung === "function") {
        oeffnePruefung(ex);
        if (typeof schirm === "function") schirm("scBogen");
      } else if (window.GENSIM) window.GENSIM.starten();
    } else if (t.art === "nach") {
      const ex = examVon(t.examId);
      if (ex && typeof oeffnePruefung === "function") {
        oeffnePruefung(ex);
        if (typeof zeigeAuswertung === "function") zeigeAuswertung();
        else if (typeof schirm === "function") schirm("scBogen");
      }
    } else if (t.art === "thema") {
      if (window.GENUI && t.thema)
        window.GENUI.erzeugeBlatt({ themen: [t.thema], anzahl: 8, zeit: 1,
                                    titel: "Endspurt: " + t.titel.replace(/^Arbeitsblatt: /, "") });
    } else if (t.art === "rechnen") {
      if (window.GENRECHNEN) {
        const a = window.GENRECHNEN.alle();
        window.GENRECHNEN.starte(a, "alle Prüfungen");
      }
    } else if (t.art === "wiederholen") {
      if (window.GENMERKBLATT) window.GENMERKBLATT.zeigen();
      else if (window.GENSATZ) window.GENSATZ.starten();
    } else if (t.art === "ruhe") {
      if (window.GENFORMELN) window.GENFORMELN.zeigen();
    }
  }

  /* ------------------------------------------------------------ Anzeige --- */
  function aktiv() { const n = tageBis(); return n >= 0 && n <= AB_TAGEN; }

  /* Zwei Pläne nebeneinander sind schlimmer als keiner. Solange der Endspurt
     läuft, ist der täglich neu rechnende Lernplan eingeklappt — ein Klick
     holt ihn zurück.                                                       */
  function planVerstecken(verstecken) {
    const p = $("planBox");
    if (!p) return;
    const huelle = p.closest("details.st-block") || p;
    huelle.hidden = !!verstecken;
  }

  function box() {
    const s = $("scStart");
    if (!s) return;
    let b = $("endspurtBox");

    if (!aktiv()) { if (b) b.remove(); planVerstecken(false); return; }

    if (!b) {
      b = el("div", "abschnitt es-box"); b.id = "endspurtBox";
      /* direkt hinter den Kopf der Startseite (Countdown, Heute, Kacheln) —
         als eigenes Kind von scStart, damit ein Neuzeichnen des Kopfes den
         Plan nicht mitreißt. start.js sortiert ohnehin nach.             */
      const kopf = $("stKopf");
      if (kopf && kopf.parentNode === s) s.insertBefore(b, kopf.nextSibling);
      else s.insertBefore(b, s.firstChild);
    }
    b.innerHTML = "";

    const n = tageBis();
    const tage = plan();
    planVerstecken(!S.planOffen);

    const kopf = el("div", "es-kopf");
    kopf.appendChild(el("h2", null, $("stKopf") ? "Endspurt · nächste Tage" : "Endspurt"));
    const fertig = tage.filter(t => S.erledigt[t.key]).length;
    kopf.appendChild(el("span", "es-stand", fertig + " von " + tage.length + " erledigt"));
    kopf.appendChild(el("span", "es-zahl", n === 0 ? "heute" : n === 1 ? "noch 1 Tag" : "noch " + n + " Tage"));
    b.appendChild(kopf);

    /* Die Begründung des Rhythmus ist wichtig, aber einmal gelesen reicht —
       sie steht hinter einer Klappe statt jeden Tag über dem Plan.      */
    const warum = el("details", "es-warum");
    warum.appendChild(el("summary", null, n === 0 ? "Heute ist Prüfungstag." : "Warum dieser Rhythmus?"));
    warum.appendChild(el("p", "es-satz",
      "Dieser Plan steht fest und wird nicht mehr umsortiert. Der Rhythmus ist " +
      "Prüfung → Auswertung → Schwachstelle: eine Simulation ohne Auswertung am " +
      "nächsten Tag bringt nichts außer einer Zahl. Tipp auf einen Tag zeigt, was zu tun ist."));
    b.appendChild(warum);

    /* Der heutige Tag steht ausführlich oben unter „Heute“ (start.js) —
       hier nur, wenn es diese Karte nicht gibt.                        */
    const obenHeute = !!$("stKopf");
    const rest = obenHeute ? tage.slice(1) : tage;
    const liste = el("ol", "es-liste");
    const offen = b.dataset.alle === "1";
    (offen ? rest : rest.slice(0, 4)).forEach(t => liste.appendChild(tagEl(t, t === tage[0])));
    if (rest.length) b.appendChild(liste);

    const fuss = el("div", "es-fuss");
    if (rest.length > 4) {
      const mehr = el("button", "es-link", offen ? "nur die nächsten Tage" : "alle " + rest.length + " Tage");
      mehr.type = "button";
      mehr.onclick = () => { b.dataset.alle = offen ? "0" : "1"; box(); };
      fuss.appendChild(mehr);
    }
    const neu = el("button", "es-link", "neu planen");
    neu.type = "button";
    neu.title = "Baut den Endspurt aus dem heutigen Stand noch einmal — abgehakte Tage bleiben abgehakt.";
    neu.onclick = () => { bauen(); box(); kopfNeu(); };
    fuss.appendChild(neu);

    const pl = el("button", "es-link", S.planOffen ? "rechnenden Lernplan ausblenden" : "rechnenden Lernplan anzeigen");
    pl.type = "button";
    pl.onclick = () => { S.planOffen = !S.planOffen; sichern(); box(); };
    fuss.appendChild(pl);
    b.appendChild(fuss);
  }

  /* „Heute“ oben auf der Startseite liest denselben Plan — nach jedem
     Abhaken dort mitziehen.                                             */
  function kopfNeu() {
    try { window.GENSTART && window.GENSTART.kopfAktualisieren(); } catch (e) { }
  }

  function erledigt(key) { return !!S.erledigt[key]; }
  function abhaken(key) {
    const t = (S.tage || []).find(x => x.key === key);
    if (S.erledigt[key]) delete S.erledigt[key];
    else S.erledigt[key] = { art: t ? t.art : null, thema: t && t.thema || null,
                             examId: t && t.examId || null, zeit: Date.now() };
    sichern();
  }

  /* Ein Tag als EINE Zeile: Haken · Datum + Titel + Minuten · Los.
     Der erklärende Text und der Zweitknopf (Auswertung) erscheinen erst
     nach einem Tipp auf die Zeile — der heutige Tag steht ohnehin
     ausführlich oben unter „Heute“.                                     */
  function tagEl(t, heute) {
    const fertig = !!S.erledigt[t.key];
    const z = el("li", "es-tag es-" + t.art + (heute ? " heute" : "") + (fertig ? " fertig" : ""));

    const hak = el("button", "es-hak" + (fertig ? " an" : ""));
    hak.type = "button";
    hak.setAttribute("aria-pressed", fertig ? "true" : "false");
    hak.setAttribute("aria-label", fertig ? "als nicht erledigt markieren" : "als erledigt abhaken");
    hak.innerHTML = window.GENIKON ? window.GENIKON.svg("check", 15) : "✓";
    hak.onclick = () => { abhaken(t.key); box(); kopfNeu(); };
    z.appendChild(hak);

    const d = new Date(t.key + "T00:00:00");
    const info = el("button", "es-info");
    info.type = "button";
    info.setAttribute("aria-expanded", "false");
    const zeile1 = el("span", "es-tzeile");
    zeile1.appendChild(el("span", "es-datum",
      (heute ? "Heute · " : "") + WOCHENTAG[d.getDay()] + " " +
      String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + "."));
    zeile1.appendChild(el("span", "es-min", t.art === "pruefungstag" ? "Prüfung" : t.minuten + " min"));
    info.appendChild(zeile1);
    info.appendChild(el("span", "es-btitel", t.titel));
    z.appendChild(info);

    if (t.art !== "pruefungstag") {
      const k = el("button", "es-los" + (heute && !fertig ? " primaer" : ""));
      k.type = "button";
      k.setAttribute("aria-label", "starten: " + t.titel);
      k.innerHTML = (window.GENIKON ? window.GENIKON.svg("play", 14) : "") + "<span>los</span>";
      k.onclick = () => starte(t);
      z.appendChild(k);
    }

    const mehr = el("div", "es-mehr");
    mehr.hidden = true;
    mehr.appendChild(el("p", "es-bwarum", t.text));
    if (t.zusatz) {
      const k2 = el("button", "btn ghost klein", "→ " + t.zusatz.titel);
      k2.type = "button";
      k2.onclick = () => starte(t.zusatz);
      mehr.appendChild(k2);
    }
    z.appendChild(mehr);
    info.onclick = () => {
      mehr.hidden = !mehr.hidden;
      info.setAttribute("aria-expanded", mehr.hidden ? "false" : "true");
      z.classList.toggle("auf", !mehr.hidden);
    };
    return z;
  }

  /* --------------------------------------------------------- Einhängen --- */
  function einhaengen() {
    const alt = window.renderStart;
    if (typeof alt === "function" && !alt.__es) {
      const neu = function () {
        const r = alt.apply(this, arguments);
        try { setTimeout(box, 30); } catch (e) { }
        return r;
      };
      neu.__es = true; window.renderStart = neu;
    }
    /* Die Startseite ist einmal fertig gebaut, bevor die Module sie umhängen —
       deshalb zusätzlich einmal von Hand, etwas später als plan.js.        */
    setTimeout(() => { try { box(); } catch (e) { console.error("Endspurt:", e); } }, 420);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { plan, bauen, box, starte, tageBis, aktiv, warteschlange, schwachstellen, erledigt, abhaken };
})();
