/* ============================================================================
   gen/exam-diagramme.js — Diagramm-Teilaufgaben der echten Prüfungen bekommen
   eine ordentliche Eingabe statt eines leeren Textfelds.
   ----------------------------------------------------------------------------
   Der Aufgabentyp wird am Text erkannt (Netzplan, Gantt, ER, Klassen-, Use-Case-,
   Aktivitätsdiagramm, Nutzwertanalyse). Dazu gibt es eine Tabelle mit den
   passenden Spalten und einen Knopf, der denselben Diagrammtyp im Generator
   öffnet — dort mit automatischer Prüfung und Punkten.

   Die Tabelle wird in lesbaren Text übersetzt und an die vorhandene Antwort
   angehängt: Markdown-Export, „Antwort prüfen“ und die Auswertung sehen sie.
   ========================================================================== */
"use strict";

window.GENEXAM = (function () {
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  /* ---------------------------------------------------------- Typerkennung */
  const MUSTER = [
    ["netzplan", /netzplan|vorgangsknoten|kritischen? pfad|\bfaz\b|\bsaz\b|gesamtpuffer/i],
    ["gantt", /gantt|balkenplan|balkendiagramm/i],
    ["aktivitaet", /aktivit(ä|a)tsdiagramm/i],
    ["klasse", /klassendiagramm/i],
    ["usecase", /use.?case|anwendungsfalldiagramm|anwendungsfall-diagramm/i],
    ["er", /entity.?relationship|er-?modell|er-?diagramm|\berd\b|datenmodell/i],
    ["nutzwert", /nutzwertanalyse|nutzwerttabelle/i]
  ];

  function typVon(it) {
    const t = [it.prompt, it.groupIntro, it.task && it.task.intro,
      it.solution && it.solution.text].filter(Boolean).join(" ");
    for (const [key, re] of MUSTER) if (re.test(t)) return key;
    return null;
  }

  /* ------------------------------------------------------------- Spalten */
  const FORM = {
    er: {
      titel: "ER-Modell als Tabelle",
      spalten: [
        { key: "ent", label: "Entität" },
        { key: "attr", label: "Attribute (Komma getrennt)" },
        { key: "pk", label: "Primärschlüssel" },
        { key: "bez", label: "Beziehung zu" },
        { key: "kard", label: "Kardinalität", optionen: ["1:1", "1:n", "n:m", "—"] }
      ],
      regel: "Fremdschlüssel gehört auf die n-Seite. n:m wird über eine Zwischentabelle aufgelöst.",
      vorlage: "dia-er-bauen"
    },
    klasse: {
      titel: "Klassendiagramm als Tabelle",
      spalten: [
        { key: "kl", label: "Klasse" },
        { key: "attr", label: "Attribute (mit Datentyp)" },
        { key: "meth", label: "Methoden ()" },
        { key: "erbt", label: "erbt von" },
        { key: "mult", label: "Multiplizität" }
      ],
      regel: "Sichtbarkeit angeben (− privat, + öffentlich), Methoden mit Klammern, geerbte Attribute nicht wiederholen.",
      vorlage: "dia-klasse-bauen"
    },
    usecase: {
      titel: "Use-Case-Diagramm als Tabelle",
      spalten: [
        { key: "fall", label: "Anwendungsfall" },
        { key: "akteur", label: "Akteur" },
        { key: "bez", label: "verbunden mit" },
        { key: "art", label: "Art", optionen: ["—", "«include»", "«extend»", "Generalisierung"] }
      ],
      regel: "Akteure stehen außerhalb der Systemgrenze. «include» läuft immer mit, «extend» nur unter einer Bedingung. " +
        "Generalisierung heißt: der eine kann alles, was der andere kann, und noch mehr.",
      /* Welche Felder bei welcher Beziehung gefüllt werden. Ohne diese vier
         Zeilen ist die Tabelle nicht zu bedienen: eine Generalisierung
         zwischen zwei Akteuren hat gar keinen Anwendungsfall, und der
         Extension Point eines «extend» hat keine eigene Spalte.        */
      hilfe: [
        ["Akteur benutzt eine Funktion", "—", "Anwendungsfall + Akteur"],
        ["Funktion ruft immer eine andere auf", "«include»", "Anwendungsfall + verbunden mit"],
        ["Funktion ruft manchmal eine andere auf", "«extend»", "Anwendungsfall + verbunden mit · Extension Point mit Doppelpunkt anhängen: <code>Türen öffnen : Notfall</code>"],
        ["Einer kann alles, was der andere kann, und mehr", "Generalisierung", "Akteur (der speziellere) + verbunden mit (der allgemeinere)"]
      ],
      /* Ein Satz je Zeile statt „Spalte: Wert | Spalte: Wert“ — den liest
         auch der Wortabgleich in der Auswertung richtig.               */
      satz(z) {
        const fall = (z.fall || "").trim(), akt = (z.akteur || "").trim();
        const roh = (z.bez || "").trim(), art = (z.art || "").trim();
        const dp = roh.split(/\s*:\s*/);
        const ziel = (dp[0] || "").trim(), punkt = (dp[1] || "").trim();
        if (art === "Generalisierung" && (akt || fall) && ziel)
          return (akt || fall) + " generalisiert " + ziel + " (erbt dessen Anwendungsfälle)";
        if ((art === "«include»" || art === "«extend»") && fall && ziel)
          return fall + " " + art + " " + ziel + (punkt ? " [Extension Point: " + punkt + "]" : "");
        if (fall && akt) return akt + " → " + fall + " (Assoziation)";
        if (fall) return fall + (ziel ? " — verbunden mit " + ziel : "");
        if (akt) return "Akteur: " + akt + (ziel ? " — " + ziel : "");
        return "";
      },
      vorlage: "dia-usecase-bauen"
    },
    aktivitaet: {
      titel: "Aktivitätsdiagramm als Knotentabelle",
      spalten: [
        { key: "name", label: "Knoten" },
        { key: "typ", label: "Typ", optionen: ["Startknoten", "Aktion", "Entscheidung", "Zusammenführung",
          "Parallelisierung", "Synchronisation", "Endknoten"] },
        { key: "nach", label: "Kante zeigt auf" },
        { key: "bed", label: "Bedingung [ ]" }
      ],
      regel: "Genau ein Startknoten · aus einer Aktion führt genau eine Kante · Entscheidung hat mindestens zwei Ausgänge mit Bedingungen.",
      vorlage: "dia-aktivitaet"
    },
    netzplan: {
      titel: "Netzplan als Tabelle",
      spalten: [
        { key: "v", label: "Vorgang" }, { key: "d", label: "Dauer" }, { key: "vor", label: "Vorgänger" },
        { key: "faz", label: "FAZ" }, { key: "fez", label: "FEZ" },
        { key: "saz", label: "SAZ" }, { key: "sez", label: "SEZ" }, { key: "gp", label: "GP" }
      ],
      regel: "Vorwärts: FAZ = größter FEZ der Vorgänger, FEZ = FAZ + D. Rückwärts: SEZ = kleinster SAZ der Nachfolger, SAZ = SEZ − D. GP = SAZ − FAZ.",
      vorlage: "dia-netzplan"
    },
    gantt: {
      titel: "Balkenplan als Tabelle",
      spalten: [
        { key: "v", label: "Vorgang" }, { key: "d", label: "Dauer" }, { key: "vor", label: "Vorgänger" },
        { key: "start", label: "Start (Tag)" }, { key: "ende", label: "Ende (Tag)" }
      ],
      regel: "Alle Vorgänge starten so früh wie möglich. Ende = Start + Dauer − 1, wenn Tag 1 der erste Projekttag ist.",
      vorlage: "dia-gantt"
    },
    nutzwert: {
      titel: "Nutzwertanalyse als Tabelle",
      spalten: [
        { key: "krit", label: "Kriterium" }, { key: "gew", label: "Gewichtung" },
        { key: "a", label: "A: Punkte / Nutzwert" }, { key: "b", label: "B: Punkte / Nutzwert" },
        { key: "c", label: "C: Punkte / Nutzwert" }
      ],
      regel: "Teilnutzwert = Gewichtung × Punktwert. Am Ende die Spaltensummen vergleichen.",
      vorlage: "kalk-nutzwertanalyse"
    }
  };

  /* ------------------------------------------------------------- Speicher */
  const schluessel = k => k + "#dia";

  /* ANSWERS, VIEW und hatAntwort sind in index.html mit let/const deklariert —
     sie liegen im globalen Lexical Environment, nicht auf window.            */
  const A = () => (typeof ANSWERS !== "undefined" ? ANSWERS : {});
  const V = () => (typeof VIEW !== "undefined" ? VIEW : null);
  const hatAntw = it => (typeof hatAntwort === "function" ? hatAntwort(it) : true);

  function lesen(k) {
    const roh = A()[schluessel(k)];
    if (!roh) return [];
    try { return typeof roh === "string" ? JSON.parse(roh) : roh; } catch { return []; }
  }
  function schreiben(k, daten) {
    A()[schluessel(k)] = JSON.stringify(daten);
    if (window.speichern) clearTimeout(schreiben._t),
      schreiben._t = setTimeout(window.speichern, 500);
  }

  /** Tabelle als lesbaren Text — das sehen Export, Prüfhilfe und Auswertung */
  function alsText(k, form) {
    const daten = lesen(k).filter(z => form.spalten.some(sp => String(z[sp.key] || "").trim()));
    if (!daten.length) return "";
    const zeilen = daten.map(z => {
      /* Kennt die Form einen Satzbau, dann den — „Administrator generalisiert
         Mitarbeiter“ ist für den Wortabgleich und für einen Menschen lesbar,
         „Akteur: Administrator | verbunden mit: Mitarbeiter“ ist es nicht. */
      if (typeof form.satz === "function") {
        const s = form.satz(z);
        if (s) return s;
      }
      return form.spalten
        .map(sp => sp.label + ": " + (String(z[sp.key] || "").trim() || "—"))
        .join(" | ");
    }).filter(Boolean);
    if (!zeilen.length) return "";
    return form.titel + "\n" + zeilen.join("\n");
  }

  /* ------------------------------------------------------------- Tabelle */
  function tabelle(it, form) {
    const wrap = el("div", "ex-dia");
    const kopf = el("div", "ex-dia-kopf");
    kopf.appendChild(el("span", "eyebrow", form.titel));
    const knopf = el("button", "btn ghost klein", "↗ diesen Typ mit Prüfung üben");
    knopf.title = "Öffnet ein Arbeitsblatt mit demselben Diagrammtyp — dort werden Punkte automatisch vergeben.";
    knopf.onclick = () => {
      if (!window.GENUI) return;
      window.GENUI.erzeugeBlatt({ ids: [form.vorlage], anzahl: 3, titel: form.titel.replace(" als Tabelle", "") + " — üben" });
    };
    kopf.appendChild(knopf);
    wrap.appendChild(kopf);

    const rollen = el("div", "gtab-rollen");
    const t = el("table", "gmodell");
    const thead = el("thead"), trh = el("tr");
    form.spalten.forEach(sp => trh.appendChild(el("th", null, sp.label)));
    trh.appendChild(el("th", null, ""));
    thead.appendChild(trh); t.appendChild(thead);
    const tb = el("tbody"); t.appendChild(tb);

    const daten = lesen(it.k);
    while (daten.length < 4) daten.push({});

    function sichere() {
      const raus = [...tb.querySelectorAll("tr")].map(tr => {
        const o = {};
        form.spalten.forEach(sp => {
          const c = tr.querySelector('[data-sp="' + sp.key + '"]');
          o[sp.key] = c ? c.value : "";
        });
        return o;
      });
      schreiben(it.k, raus);
      const karte = document.getElementById("sub-" + window.safeId(it.k));
      if (karte) karte.classList.toggle("done", hatAntw(it));
      if (window.refresh) window.refresh();
    }

    function zeile(d) {
      const tr = el("tr");
      form.spalten.forEach(sp => {
        const td = el("td");
        let c;
        if (sp.optionen) {
          c = el("select");
          const leer = el("option", null, "—"); leer.value = ""; c.appendChild(leer);
          sp.optionen.forEach(o => { const op = el("option", null, o); op.value = o; c.appendChild(op); });
        } else { c = el("input"); c.type = "text"; }
        c.dataset.sp = sp.key;
        c.value = d[sp.key] || "";
        c.oninput = sichere; c.onchange = sichere;
        td.appendChild(c); tr.appendChild(td);
      });
      const tdW = el("td"); tdW.className = "weg";
      const w = el("button", "btn ghost klein", "×");
      w.onclick = () => { tr.remove(); sichere(); };
      tdW.appendChild(w); tr.appendChild(tdW);
      return tr;
    }
    daten.forEach(d => tb.appendChild(zeile(d)));
    rollen.appendChild(t);
    wrap.appendChild(rollen);

    const plus = el("button", "btn ghost klein", "+ Zeile");
    plus.style.marginTop = "6px";
    plus.onclick = () => { tb.appendChild(zeile({})); sichere(); };
    wrap.appendChild(plus);

    /* Welche Spalten wann gefüllt werden — bei Beziehungstabellen die
       wichtigste Information überhaupt, und sie steht nirgends sonst. */
    if (form.hilfe && form.hilfe.length) {
      const h = el("div", "ex-hilfe");
      h.appendChild(el("div", "ex-hilfe-titel", "Was trage ich wo ein?"));
      const ht = el("table", "ex-hilfe-tab");
      const hh = el("tr");
      ["Situation", "Art", "Ausgefüllt wird"].forEach(x => hh.appendChild(el("th", null, x)));
      ht.appendChild(hh);
      form.hilfe.forEach(r => {
        const tr = el("tr");
        tr.appendChild(el("td", null, r[0]));
        const td2 = el("td", "ex-hilfe-art", r[1]);
        tr.appendChild(td2);
        const td3 = el("td"); td3.innerHTML = r[2];
        tr.appendChild(td3);
        ht.appendChild(tr);
      });
      h.appendChild(ht);
      wrap.appendChild(h);
    }

    const regel = el("div", "gmodell-regeln");
    regel.innerHTML = "<b>Notation</b><div>· " + form.regel + "</div>" +
      "<div>· Die Tabelle wird als Text an deine Antwort angehängt — für Export und Auswertung.</div>";
    wrap.appendChild(regel);
    return wrap;
  }

  /* ------------------------------------------------- Karten nachrüsten */
  function nachruesten() {
    const view = V();
    if (!view || !view.items) return;
    document.querySelectorAll("#bogenMain .tk").forEach(karte => {
      if (karte.dataset.diaFertig) return;
      const k = karte.dataset.k;
      const it = view.items.find(x => x.k === k);
      if (!it) return;
      const typ = it.answerType === "diagram" ? typVon(it) : null;
      if (!typ || !FORM[typ]) return;
      /* Steht die Tabelle schon im Aufgabentext und ist dort ausfüllbar
         (gen/tabellen.js), dann hier keine zweite danebenstellen — sonst
         füllt man dieselben Werte zweimal aus und weiß nicht, welche
         gewertet wird.                                                  */
      if (window.GENTAB && (window.GENTAB.finde(it.prompt || "") || []).length) {
        karte.dataset.diaFertig = "1";
        const doppelt = karte.querySelector(".ex-dia");
        if (doppelt) doppelt.remove();
        return;
      }
      const haupt = karte.querySelector(".tk-haupt");
      const ta = haupt ? haupt.querySelector("textarea") : null;
      if (!haupt) return;
      const box = tabelle(it, FORM[typ]);
      /* Das Textfeld liegt bei mehrteiligen Aufgaben nicht direkt in .tk-haupt,
         sondern in einem Feldkasten darin — insertBefore braucht aber ein
         echtes Kind. Also den Vorfahren suchen, der eines ist. Sonst wirft
         der Aufruf und die Schleife bricht ab: alle folgenden Diagramm-
         karten bekommen dann gar keine Tabelle mehr.                     */
      let anker = ta;
      while (anker && anker.parentNode !== haupt) anker = anker.parentNode;
      if (anker) haupt.insertBefore(box, anker); else haupt.appendChild(box);
      if (ta) ta.placeholder = "Ergänzungen und Erläuterungen in Worten (die Tabelle oben zählt mit) …";
      karte.dataset.diaFertig = "1";
    });
  }

  /* ------------------------------------------------------------ Einhängen */
  function einhaengen() {
    /* Antworttext um die Tabelle erweitern */
    const altText = window.antwortText;
    window.antwortText = function (it) {
      const basis = altText.apply(null, arguments);
      const typ = (it && it.answerType === "diagram") ? typVon(it) : null;
      if (!typ || !FORM[typ]) return basis;
      const zus = alsText(it.k, FORM[typ]);
      if (!zus) return basis;
      return basis ? basis + "\n\n" + zus : zus;
    };

    const altBogen = window.zeigeBogen;
    window.zeigeBogen = function () {
      const r = altBogen.apply(this, arguments);
      try { setTimeout(nachruesten, 0); } catch (e) { console.error("Diagrammeingabe:", e); }
      return r;
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { typVon, nachruesten, FORM };
})();
