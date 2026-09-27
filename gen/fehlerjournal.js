/* ============================================================================
   gen/fehlerjournal.js — jeder Fehler wird aufgeschrieben und eingeordnet
   ----------------------------------------------------------------------------
   Kurz vor der Prüfung entscheidet nicht mehr, was man noch nicht weiß,
   sondern welche Punkte man aus Unachtsamkeit liegen lässt: Einheit vergessen,
   falsch gerundet, Aufgabe zu schnell gelesen, bei „Erläutern“ nur ein
   Stichwort hingeschrieben. Das sind zweistellige Punktzahlen, und sie kommen
   sofort zurück, sobald man sie sieht.

   Diese Datei sammelt jede falsche oder halbrichtige Antwort — aus dem
   Generator UND aus den echten Prüfungen — schlägt einen Grund vor und zeigt
   auf der Startseite, wie sich die Fehler verteilen.
   ========================================================================== */
"use strict";

window.GENFEHLER = (function () {
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const esc = s => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; };

  const SK = "ihk2:gen:fehler";
  const MAX = 300;

  const lies = () => { try { const r = localStorage.getItem(SK); return r ? JSON.parse(r) : []; } catch { return []; } };
  const schreib = a => { try { localStorage.setItem(SK, JSON.stringify(a.slice(0, MAX))); } catch { } };
  let LISTE = lies();

  /* ---------------------------------------------------------------------
     Die Gründe. Bewusst kurz: sechs Knöpfe, einer davon ist immer richtig.
     `auto` erkennt den Grund aus dem, was die Prüfung ohnehin schon weiß.
     ------------------------------------------------------------------ */
  const GRUENDE = [
    { key: "einheit",   kurz: "Einheit / Rundung",  lang: "Einheit vergessen oder falsch gerundet",
      rat: "Schreib die Einheit direkt beim Ergebnis hin und lies die Rundungsvorgabe laut mit." },
    { key: "gelesen",   kurz: "falsch gelesen",     lang: "Aufgabe zu schnell oder falsch gelesen",
      rat: "Unterstreiche in der Aufgabe die Zahlen und das Verb, bevor du rechnest." },
    { key: "rechenweg", kurz: "Rechenweg fehlte",   lang: "kein oder unvollständiger Rechenweg",
      rat: "Jeder Schritt eine Zeile — dafür gibt es Punkte, auch wenn das Ergebnis kippt." },
    { key: "formuliert",kurz: "zu knapp",           lang: "zu knapp formuliert, Operator verfehlt",
      rat: "Bei Erläutern und Begründen immer ganze Sätze mit „weil“ oder „dadurch“." },
    { key: "gewusst",   kurz: "nicht gewusst",      lang: "Inhalt nicht gewusst",
      rat: "Das ist der einzige Grund, gegen den Lernen hilft — Thema auf die Wiederholungsliste." },
    { key: "zeit",      kurz: "Zeit",               lang: "Zeit hat nicht gereicht",
      rat: "Teuerste Aufgaben zuerst, bei Hängern weitergehen und später zurückkommen." }
  ];
  const gr = k => GRUENDE.find(g => g.key === k);

  /** Grund aus der Rückmeldung der Prüfung raten */
  function autoGrund(r, feld, aufgabe) {
    const t = String((r && r.text) || "");
    if (/Einheit|Größenordnung|groessenordnung/i.test(t)) return "einheit";
    if (/zu knapp|fehlt die Begründung|Erläuterung/i.test(t)) return "formuliert";
    if (/Folgefehler/i.test(t)) return "rechenweg";
    if (feld && feld.typ === "rechenweg") return "rechenweg";
    if (aufgabe && aufgabe.ohneRechenweg && feld && feld.typ === "zahl") return "rechenweg";
    return null;
  }

  /* ------------------------------------------------------- Eintragen ---- */
  /* Während „Fehler durchgehen“ (gen/fehleranalyse.js) eine alte Aufgabe
     nachprüft, wird nichts eingetragen — sonst rutscht der Eintrag mit neuer
     Uhrzeit nach oben.                                                     */
  let STILL = 0;
  function still(fn) { STILL++; try { return fn(); } finally { STILL--; } }

  /** Eingaben für später aufheben — aber nicht beliebig groß */
  function eingabenKopie(ein) {
    try {
      const t = JSON.stringify(ein || {});
      return t.length <= 6000 ? JSON.parse(t) : null;
    } catch (e) { return null; }
  }

  function merken(e) {
    if (!e || !e.schluessel) return;
    const i = LISTE.findIndex(x => x.schluessel === e.schluessel);
    /* Ein schon eingeordneter Fehler behält seinen Grund */
    if (i >= 0) {
      e.grund = LISTE[i].grund || e.grund;
      e.erledigt = LISTE[i].erledigt;
      LISTE.splice(i, 1);
    }
    LISTE.unshift(e);
    schreib(LISTE);
  }

  /**
   * Aus einem Generator-Ergebnis EIN Eintrag je Aufgabe — nicht je Feld.
   * Sonst stehen nach einer schiefgelaufenen Rechenaufgabe sechs fast gleiche
   * Zeilen im Journal und man hakt keine einzige davon ab.
   */
  function ausGenerator(aufgabe, erg) {
    if (!aufgabe || !erg) return;
    const ohneWeg = erg.rechenweg && erg.rechenweg.gesamt && !erg.rechenweg.tragfaehig;

    const schief = erg.felder.filter(r =>
      r.status !== "leer" && r.status !== "richtig" && r.typ !== "rechenweg");
    const wegFeld = erg.felder.find(r => r.typ === "rechenweg");
    const wegSchief = wegFeld && wegFeld.status === "falsch";

    /* Nichts falsch und der Rechenweg trägt: kein Eintrag */
    if (!schief.length && !wegSchief) return;
    /* Gar nichts bearbeitet: auch kein Eintrag */
    if (erg.offen >= aufgabe.felder.filter(f => f.typ !== "rechenweg").length) return;

    const erstes = schief[0] || wegFeld;
    const feld = erstes ? aufgabe.felder[erstes.nr] : null;
    const namen = schief.map(r => r.label).filter(Boolean);
    const feldText = namen.length
      ? (namen.length <= 2 ? namen.join(" · ") : namen.slice(0, 2).join(" · ") + " · +" + (namen.length - 2) + " weitere")
      : "Rechenweg";

    /* Grund raten: der erste Treffer über alle schiefen Felder */
    let grund = null;
    for (const r of schief) {
      grund = autoGrund(r, aufgabe.felder[r.nr], { ohneRechenweg: ohneWeg });
      if (grund) break;
    }
    if (!grund && (wegSchief || ohneWeg)) grund = "rechenweg";

    /* Der aussagekräftigste Hinweis */
    const hinweis = (schief.find(r => r.text) || wegFeld || {}).text || "";

    merken({
      schluessel: "g|" + aufgabe.vorlageId + "|" + aufgabe.saat,
      zeit: Date.now(),
      quelle: "gen",
      vorlageId: aufgabe.vorlageId,
      saat: aufgabe.saat,
      /* alle Eingaben — damit „Fehler durchgehen“ jedes Feld zeigen kann */
      eingaben: eingabenKopie(erg.eingaben),
      titel: aufgabe.titel,
      thema: aufgabe.themaLabel,
      feld: feldText,
      be: erg.max, erreicht: erg.punkte,
      meine: kurzAntwort(feld, (erg.eingaben || {})[erstes && erstes.nr]),
      richtig: kurzSoll(feld),
      hinweis: hinweis,
      grund: grund,
      erledigt: false
    });
  }

  function kurzAntwort(f, v) {
    if (v == null) return "";
    if (typeof v === "string") return v.slice(0, 120);
    return "";
  }
  function kurzSoll(f) {
    if (!f) return "";
    if (f.typ === "zahl") return window.GEN.fmt.kurz(f.loesung) + (f.einheit ? " " + f.einheit : "");
    if (f.typ === "auswahl") return String(f.loesung);
    if (f.typ === "text" || f.typ === "liste")
      return (f.erwartet || []).slice(0, 3).map(s => s[0]).join(" · ");
    return "";
  }

  /** aus einer echten Prüfung: Selbstbewertung unter der vollen Punktzahl */
  function ausPruefung(it, punkte) {
    if (!it || punkte == null) return;
    const max = it.maxPoints || 0;
    if (!max || punkte >= max) return;
    merken({
      schluessel: "p|" + it.k,
      zeit: Date.now(),
      quelle: "exam",
      examId: it.exam && it.exam.examId,
      titel: (it.exam && it.exam.meta ? it.exam.meta.year + " " + it.exam.meta.season : "Prüfung") +
             " · " + (it.fullLabel || it.label || ""),
      thema: (it.topics || [])[0] || "",
      feld: (it.prompt || "").split("\n")[0].slice(0, 110),
      be: max, erreicht: punkte,
      meine: "", richtig: "",
      hinweis: "", grund: null, erledigt: false
    });
  }

  /** abhaken (true) oder wieder öffnen (false) — von „Fehler durchgehen“ */
  function abhaken(schluessel, wert) {
    const x = LISTE.find(y => y.schluessel === schluessel);
    if (!x || !!x.erledigt === !!wert) return false;
    x.erledigt = !!wert;
    schreib(LISTE);
    return true;
  }
  function grundSetzen(schluessel, grund) {
    const x = LISTE.find(y => y.schluessel === schluessel);
    if (!x) return false;
    x.grund = grund || null;
    schreib(LISTE);
    return true;
  }

  /* ------------------------------------------------------- Auswertung --- */
  function offen() { return LISTE.filter(x => !x.erledigt); }

  function verteilung(tage) {
    const grenze = tage ? Date.now() - tage * 864e5 : 0;
    const rel = LISTE.filter(x => x.zeit >= grenze);
    const z = {};
    let eingeordnet = 0, verloren = 0;
    rel.forEach(x => {
      verloren += Math.max(0, (x.be || 0) - (x.erreicht || 0));
      if (!x.grund) return;
      eingeordnet++;
      z[x.grund] = (z[x.grund] || 0) + 1;
    });
    return { gesamt: rel.length, eingeordnet, zaehler: z, verloren: Math.round(verloren * 10) / 10 };
  }

  /* ----------------------------------------------------------- Anzeige -- */
  /*
     Die Liste war unlesbar: je Fehler Kürzel, sechs Knöpfe, Hinweis und Rat
     übereinander. Jetzt steht hier nur noch der Überblick — eine Zeile je
     Fehler. Ein Tipp darauf öffnet „Fehler durchgehen“ (gen/fehleranalyse.js):
     ganze Aufgabe, deine Antwort ↔ richtig je Feld, Musterlösung, Einordnen.
  */
  const durchgehen = id => {
    if (window.GENANALYSE) window.GENANALYSE.oeffnen(id ? { id } : null);
  };
  const idVon = x => x.quelle === "exam" ? "ihk:" + String(x.schluessel).slice(2) : "gen:" + x.schluessel;

  function box() {
    const ziel = $("genStartBox");
    if (!ziel) return;
    let k = $("fehlerBox");
    if (!k) {
      k = el("div", "fj-box"); k.id = "fehlerBox";
      const nach = $("simBox");
      if (nach && nach.nextSibling) ziel.insertBefore(k, nach.nextSibling);
      else ziel.appendChild(k);
    }
    k.innerHTML = "";
    if (!LISTE.length) { k.hidden = true; return; }
    k.hidden = false;

    const v = verteilung(21);
    const nOffen = offen().length;
    const kopf = el("div", "fj-kopf");
    const links = el("div");
    links.appendChild(el("h3", null, "Fehlerjournal"));
    links.appendChild(el("p", null,
      nOffen + " offen · " + window.GEN.fmt.kurz(v.verloren) + " BE liegen gelassen (21 Tage). " +
      "Tippe einen Fehler an: Aufgabe, deine Antwort und die richtige Lösung nebeneinander."));
    kopf.appendChild(links);
    const knoepfe = el("div", "fj-knoepfe");
    if (window.GENANALYSE && nOffen) {
      const los = el("button", "btn primary klein", "Fehler durchgehen →");
      los.type = "button";
      los.onclick = () => durchgehen(null);
      knoepfe.appendChild(los);
    }
    const leeren = el("button", "btn ghost klein", "Journal leeren");
    leeren.type = "button";
    leeren.onclick = () => {
      if (!confirm("Alle " + LISTE.length + " Einträge löschen?")) return;
      LISTE = []; schreib(LISTE); box();
    };
    knoepfe.appendChild(leeren);
    kopf.appendChild(knoepfe);
    k.appendChild(kopf);

    /* Balken je Grund — eingeordnet wird jetzt im Durchgang („Warum daneben?“) */
    if (v.eingeordnet) {
      const bal = el("div", "fj-balken");
      const max = Math.max(...GRUENDE.map(g => v.zaehler[g.key] || 0), 1);
      GRUENDE.forEach(g => {
        const n = v.zaehler[g.key] || 0;
        if (!n) return;
        const z = el("div", "fj-zeile");
        z.appendChild(el("span", "fj-name", g.kurz));
        const spur = el("span", "fj-spur");
        const i = el("i", g.key === "gewusst" ? "wissen" : "");
        i.style.width = (n / max * 100) + "%";
        spur.appendChild(i);
        z.appendChild(spur);
        z.appendChild(el("span", "fj-n", String(n)));
        bal.appendChild(z);
      });
      k.appendChild(bal);

      const wissen = v.zaehler.gewusst || 0;
      const rest = v.eingeordnet - wissen;
      if (v.eingeordnet >= 4) {
        const fazit = el("div", "fj-fazit");
        const anteil = Math.round(rest / v.eingeordnet * 100);
        fazit.innerHTML = anteil >= 50
          ? "<b>" + anteil + " % deiner eingeordneten Fehler sind kein Wissensproblem.</b> " +
            "Das sind die Punkte, die am schnellsten zurückkommen: " +
            esc(GRUENDE.filter(g => g.key !== "gewusst" && v.zaehler[g.key])
              .sort((a, b) => v.zaehler[b.key] - v.zaehler[a.key])[0].rat)
          : "<b>" + Math.round(wissen / v.eingeordnet * 100) + " % sind echte Wissenslücken.</b> " +
            "Hier hilft nur Wiederholen — nimm dir die Themen aus der Liste unten vor.";
        k.appendChild(fazit);
      }
    }

    /* Liste: eine Zeile je Fehler */
    const MAXZ = 8;
    const liste = el("ul", "fj-liste");
    offen().slice(0, MAXZ).forEach(x => liste.appendChild(zeile(x)));
    k.appendChild(liste);

    const rest = nOffen - MAXZ;
    if (rest > 0) k.appendChild(el("div", "fj-mehr", "… und " + rest + " weitere — alle unter „Fehler durchgehen“."));
  }

  function zeile(x) {
    const li = el("li");
    const b = el("button", "fj-eintrag");
    b.type = "button";
    const d = new Date(x.zeit);
    const t = el("span", "fj-et");
    const oben = el("span", "fj-ekopf");
    oben.appendChild(el("span", "fj-datum",
      String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") + "."));
    oben.appendChild(el("span", "fj-titel", x.titel || ""));
    t.appendChild(oben);
    if (x.feld) t.appendChild(el("span", "fj-feld", x.feld));
    b.appendChild(t);
    const verlust = Math.max(0, (x.be || 0) - (x.erreicht || 0));
    b.appendChild(el("span", "fj-be", "−" + window.GEN.fmt.kurz(verlust) + " BE"));
    b.appendChild(el("span", "fj-pfeil", "›"));
    b.onclick = () => durchgehen(idVon(x));
    li.appendChild(b);
    return li;
  }

  /* ------------------------------------------------------------ Einhängen */
  function einhaengen() {
    /* 1. Generator: jede Prüfung einer Aufgabe mitschreiben */
    if (window.GEN && window.GEN.pruefeAufgabe && !window.GEN.pruefeAufgabe.__fj) {
      const alt = window.GEN.pruefeAufgabe;
      const neu = function (aufgabe, eingaben) {
        const erg = alt.apply(this, arguments);
        try {
          erg.eingaben = eingaben || {};
          if (!STILL) ausGenerator(aufgabe, erg);
        } catch (e) { console.error("Fehlerjournal:", e); }
        return erg;
      };
      neu.__fj = true;
      window.GEN.pruefeAufgabe = neu;
    }

    /* 2. Echte Prüfungen: die Selbstbewertung am Aufgabenrand abfangen.
          Der Klick läuft zuerst durch den eigenen Handler von index.html,
          erst danach kommt er hier an — dann steht die Punktzahl schon.  */
    document.addEventListener("click", ev => {
      /* die kleine Skala im Rand UND die Zeile „Punkte geben“ unter der Antwort */
      const b = ev.target && ev.target.closest && ev.target.closest(".punkte-wahl button, .pp-knopf");
      if (!b) return;
      setTimeout(() => {
        try {
          const karte = b.closest(".tk");
          const k = karte && karte.dataset ? karte.dataset.k : null;
          if (!k) return;
          const view = (typeof VIEW !== "undefined" && VIEW) ? VIEW : null;
          const it = view && view.items ? view.items.find(x => x.k === k) : null;
          if (!it) return;
          const p = (typeof SCORES !== "undefined" && SCORES) ? SCORES[k] : null;
          if (p == null) return;
          ausPruefung(it, p);
        } catch (e) { }
      }, 0);
    }, false);

    /* 3. Startseite */
    const altStart = window.renderStart;
    if (typeof altStart === "function") {
      window.renderStart = function () {
        altStart.apply(null, arguments);
        try { box(); } catch (e) { console.error("Fehlerjournal:", e); }
      };
    }
    try { box(); } catch (e) { }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return {
    GRUENDE, merken, ausGenerator, ausPruefung, verteilung, box, still, abhaken, grundSetzen,
    liste: () => LISTE.slice(),
    setzen: a => { LISTE = a || []; schreib(LISTE); }
  };
})();
