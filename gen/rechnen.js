/* ============================================================================
   gen/rechnen.js — die Rechenaufgaben als eigener Bereich
   ----------------------------------------------------------------------------
   Rechnen ist der größte zusammenhängende Block der AP1: über die zehn
   Prüfungen kommen rund 40 Teilaufgaben mit etwa 150 BE zusammen — mehr als
   jedes einzelne Fachthema. Bisher lagen sie verstreut in zehn Bögen: wer
   nur rechnen üben wollte, musste sich durch Netzwerkfragen und
   Vertragsrecht scrollen.

   Diese Datei sammelt sie an einer Stelle. Sie baut dafür KEINE zweite
   Aufgabenansicht — das wäre eine zweite Stelle, an der Rechenweg,
   Antwortprüfung, Tabellen und Musterlösung gepflegt werden müssten.
   Stattdessen stellt sie eine Auswahl zusammen und startet damit den
   vorhandenen Übungsmodus. Alles, was im Prüfungsbogen funktioniert,
   funktioniert damit hier von selbst.

   Ausgewählt wird über GENEXAMWEG.istRechenaufgabe — dieselbe Erkennung, die
   auch entscheidet, wo ein Rechenweg-Feld erscheint. Dadurch kann der
   Bereich nicht mit den Rechenweg-Feldern auseinanderlaufen.

   Vier Wege hinein:
     alle · nach Thema · nur ungelöste · zehn zufällige
   dazu der eigene Stand: wie viele BE von wie vielen schon geholt sind.
   ========================================================================== */
"use strict";

window.GENRECHNEN = (function () {
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  const REW = () => window.GENEXAMWEG || null;
  const T = () => (typeof TLABEL !== "undefined" ? TLABEL : {});

  /* ------------------------------------------------------------ Auswahl */

  let zwischen = null;
  function alle() {
    if (zwischen) return zwischen;
    const rew = REW();
    if (!rew || typeof ALLE === "undefined") return [];
    zwischen = ALLE.filter(it => {
      if (typeof aktiv === "function" && !aktiv(it)) return false;
      try { return rew.istRechenaufgabe(it); } catch (e) { return false; }
    });
    return zwischen;
  }

  const punkte = it => (typeof SCORES !== "undefined" && SCORES[it.k] != null) ? SCORES[it.k] : null;
  const bearbeitet = it => punkte(it) != null;

  /** Rechenaufgaben nach Thema gruppiert, größte Gruppe zuerst. */
  function themen() {
    const z = {};
    alle().forEach(it => {
      (it.topics || ["sonst"]).forEach(t => {
        z[t] = z[t] || { key: t, label: T()[t] || t, n: 0, be: 0 };
        z[t].n++; z[t].be += it.maxPoints || 0;
      });
    });
    return Object.values(z).sort((a, b) => b.be - a.be);
  }

  function stand(liste) {
    const be = liste.reduce((s, it) => s + (it.maxPoints || 0), 0);
    const fertig = liste.filter(bearbeitet);
    const geholt = fertig.reduce((s, it) => s + (punkte(it) || 0), 0);
    const moeglich = fertig.reduce((s, it) => s + (it.maxPoints || 0), 0);
    return { n: liste.length, be: be, fertig: fertig.length, geholt: geholt, moeglich: moeglich };
  }

  /* ------------------------------------------------------------- Starten */

  function starte(liste, titel) {
    if (!liste.length) { if (window.toast) window.toast("Für diese Auswahl gibt es keine Aufgaben."); return; }
    if (typeof VIEW === "undefined") return;
    /* Der vorhandene Übungsmodus übernimmt: Rechenweg, Antwortprüfung,
       Tabellen, Auftragszeile und Musterlösung gelten dort schon.      */
    VIEW = { modus: "uebung", exam: null, items: liste.slice(), titel: "Rechnen · " + titel };
    if (typeof SHOW_SOL !== "undefined") SHOW_SOL = false;
    if (typeof zeigeBogen === "function") zeigeBogen();
    if (typeof schirm === "function") schirm("scBogen");
  }

  const mischen = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);

  /* --------------------------------------------------------- Startblock */

  function block() {
    const liste = alle();
    if (!liste.length) return null;
    const s = stand(liste);

    const det = el("details", "st-block");
    det.id = "rechnenBlock";
    const sum = el("summary");
    sum.append(el("span", null, "Rechenaufgaben — alle Prüfungen"),
      el("span", "st-zahl", s.n + " Aufgaben · " + s.be + " BE"));
    det.appendChild(sum);

    const innen = el("div", "re-innen");

    const satz = el("p", "re-satz");
    satz.textContent = s.fertig
      ? "Bearbeitet: " + s.fertig + " von " + s.n + " · dabei " + s.geholt +
        " von " + s.moeglich + " BE geholt."
      : "Noch keine davon bewertet. Rechnen ist der größte zusammenhängende " +
        "Block der Prüfung — hier liegen " + s.be + " BE.";
    innen.appendChild(satz);

    const reihe = el("div", "re-knopfe");
    const knopf = (txt, cls, fn) => { const b = el("button", "btn " + cls, txt); b.onclick = fn; return b; };

    reihe.appendChild(knopf("alle " + s.n + " rechnen", "primary",
      () => starte(liste, "alle Prüfungen")));
    reihe.appendChild(knopf("10 zufällige", "",
      () => starte(mischen(liste).slice(0, 10), "zehn zufällige")));
    const offen = liste.filter(it => !bearbeitet(it));
    reihe.appendChild(knopf("nur ungelöste (" + offen.length + ")", "",
      () => starte(offen, "noch nicht bewertet")));
    const schwach = liste.filter(it => bearbeitet(it) && punkte(it) < (it.maxPoints || 1) * 0.6);
    if (schwach.length)
      reihe.appendChild(knopf("verhauen (" + schwach.length + ")", "",
        () => starte(schwach, "unter 60 %")));
    innen.appendChild(reihe);

    /* --- nach Thema --- */
    innen.appendChild(el("div", "re-unter", "nach Thema"));
    const chips = el("div", "re-chips");
    themen().forEach(t => {
      const b = el("button", "re-chip");
      b.append(el("span", "re-chip-name", t.label),
               el("span", "re-chip-zahl", t.n + " · " + t.be + " BE"));
      b.onclick = () => starte(liste.filter(it => (it.topics || []).indexOf(t.key) >= 0), t.label);
      chips.appendChild(b);
    });
    innen.appendChild(chips);

    /* --- nach Prüfung --- */
    innen.appendChild(el("div", "re-unter", "nach Prüfung"));
    const jahre = el("div", "re-chips");
    const nachExam = {};
    liste.forEach(it => {
      const id = it.exam.examId;
      nachExam[id] = nachExam[id] || { exam: it.exam, items: [] };
      nachExam[id].items.push(it);
    });
    Object.values(nachExam)
      .sort((a, b) => (b.exam.meta.year - a.exam.meta.year))
      .forEach(g => {
        const name = (g.exam.meta.season || "") + " " + (g.exam.meta.year || "");
        const b = el("button", "re-chip");
        const be = g.items.reduce((x, it) => x + (it.maxPoints || 0), 0);
        b.append(el("span", "re-chip-name", name),
                 el("span", "re-chip-zahl", g.items.length + " · " + be + " BE"));
        b.onclick = () => starte(g.items, name);
        jahre.appendChild(b);
      });
    innen.appendChild(jahre);

    innen.appendChild(el("p", "re-fuss",
      "Ausgewählt ist, wo die Aufgabe eine Rechnung verlangt und die Musterlösung " +
      "Zahlen enthält — dieselbe Erkennung, die auch das Rechenweg-Feld setzt. " +
      "Geübt wird im normalen Übungsmodus, mit Rechenweg und Zahlenprüfung."));

    det.appendChild(innen);
    return det;
  }

  /* ------------------------------------------------------------ Einbauen */

  function einbauen() {
    const start = $("scStart");
    if (!start) return;
    const alt = $("rechnenBlock");
    if (alt) alt.remove();
    zwischen = null;                     /* Stand kann sich geändert haben */
    const b = block();
    if (!b) return;
    /* Hinter den Spickzettel-/Kompendium-Block, vor die Arbeitsblätter:
       dort suchen wir nach Übungsstoff, nicht nach Nachschlagewerken.  */
    const marke = [...start.querySelectorAll("details.st-block > summary")]
      .find(s => /Arbeitsblätter|Übungsmodus/i.test(s.textContent));
    const ziel = marke ? marke.parentElement : null;
    if (ziel && ziel.parentElement === start) start.insertBefore(b, ziel);
    else start.appendChild(b);
  }

  function einhaengen() {
    const alt = window.renderStart;
    if (typeof alt === "function" && !alt.__re) {
      const neu = function () {
        const r = alt.apply(this, arguments);
        try { einbauen(); } catch (e) { console.error("Rechnen:", e); }
        return r;
      };
      neu.__re = true; window.renderStart = neu;
    }
    /* Die Startseite wird beim Laden EINMAL gebaut — und zwar bevor die
       Module ihre Umhüllung setzen. Ohne diesen ersten Aufruf erschiene
       der Block erst, wenn man die Startseite ein zweites Mal öffnet. */
    setTimeout(einbauen, 60);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { alle, themen, stand, starte, einbauen };
})();
