/* ============================================================================
   gen/kompendium.js — das AP1-Kompendium als eigenes Kapitel der Anwendung
   ----------------------------------------------------------------------------
   Inhalt: 52 ausgearbeitete Themenseiten aus einer geteilten Notion-Sammlung
   („Prüfungsvorbereitung“, Kurs FIAE). In Notion ist jede Seite ein eigener
   Eintrag mit eigener URL — zum Lernen unterwegs heißt das: einloggen,
   suchen, warten, blättern.

   Hier stattdessen: ein Verzeichnis, nach den sieben AP1-Themengebieten
   geordnet, und genau eine Seite auf einmal.

   Warum der Text nicht in einer einzigen Datei liegt:
   die 52 Seiten sind zusammen rund 1,3 MB HTML. Das beim Start der Anwendung
   mitzuladen wäre auf dem Telefon spürbar. Deshalb steht in
   gen/kompendium-daten.js nur das Verzeichnis (ein paar Kilobyte), und der
   Text eines Themas wird erst geholt, wenn man es öffnet — als
   gen/komp/<id>.js. Das funktioniert auch offline und beim Öffnen der
   index.html direkt von der Festplatte (kein fetch, sondern ein Script-Tag).

   Die Suche braucht alle Texte. Sie lädt deshalb beim ersten Suchlauf
   einmalig alles nach und sagt das auch.
   ========================================================================== */
"use strict";

window.GENKOMP = (function () {
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const SK = "ihk2:komp";

  /* Achtung: `ALLE` heißt in index.html die Liste aller Teilaufgaben.
     Der Themenspeicher hier heißt deshalb THEMEN — sonst verdeckt die
     lokale Deklaration die globale, und die Verknüpfung mit den Aufgaben
     findet nichts mehr. */
  const THEMEN = () => (window.KOMP_THEMEN || []);
  const TEXT = () => (window.KOMP_TEXT || (window.KOMP_TEXT = {}));

  let stand = { thema: null, suche: "", filter: "alle" };
  try { stand = Object.assign(stand, JSON.parse(localStorage.getItem(SK) || "{}")); } catch (e) { }
  const merken = () => { try { localStorage.setItem(SK, JSON.stringify(stand)); } catch (e) { } };

  /* ------------------------------------------------------- eigener Stand ---
     Der Stand in der Notion-Sammlung ist der Stand der Kollegin — er sagt,
     was SIE bearbeitet hat, nicht was Lena gelesen hat. Beides getrennt zu
     halten ist der ganze Witz: die Spalte der Kollegin bleibt als Hinweis
     stehen, gefiltert und gezählt wird nach dem eigenen Stand.

     Gespeichert wird unter demselben Schlüssel wie der Rest (ihk2:komp),
     also lokal im Browser des Geräts. Auf dem Telefon ist das genau richtig;
     mitgenommen wird es über „Fortschritt sichern“ (gen/fortschritt.js).   */
  const MEIN = [
    ["neu", "neu", "○"],
    ["gelesen", "gelesen", "✓"],
    ["verstanden", "verstanden", "★"],
    ["wiederholen", "nochmal", "↻"]
  ];
  const meinName = w => (MEIN.find(m => m[0] === w) || MEIN[0])[1];
  const meinZeichen = w => (MEIN.find(m => m[0] === w) || MEIN[0])[2];
  /* Eigener Stand in einem eigenen Schlüssel: „wo war ich zuletzt“ ist
     Bedienung und darf verlorengehen, der Lernstand nicht. Getrennt
     gespeichert lässt er sich auch sauber sichern und zurückspielen —
     gen/fortschritt.js nimmt ihn beim Export mit.                        */
  const MK = SK + ":mein";
  let mein = {};
  try { mein = JSON.parse(localStorage.getItem(MK) || "{}") || {}; } catch (e) { }
  const meinStand = id => mein[id] || "neu";
  function setzeStand(id, wert) {
    if (wert === "neu") delete mein[id]; else mein[id] = wert;
    try { localStorage.setItem(MK, JSON.stringify(mein)); } catch (e) { }
  }
  const zaehle = w => THEMEN().filter(t => meinStand(t.id) === w).length;

  /* Die sieben Themengebiete der AP1 (plus „0 Praktisches“ für alles,
     was die Sammlung nicht einsortiert hat). Kurzformen fürs Verzeichnis. */
  const GEBIETE = [
    ["1", "Projekte planen & durchführen"],
    ["2", "Informieren & Beraten"],
    ["3", "Marktgängige IT-Systeme"],
    ["4", "IT-Lösungen entwickeln"],
    ["5", "Qualitätssicherung"],
    ["6", "IT-Sicherheit"],
    ["7", "Auftragsabschluss"],
    ["0", "Praktisches & Sonstiges"]
  ];
  const gebietVon = t => {
    const n = String(t.ap || "").trim().slice(0, 1);
    return GEBIETE.some(g => g[0] === n) ? n : "0";
  };
  const gebietName = n => (GEBIETE.find(g => g[0] === n) || ["0", "Sonstiges"])[1];

  /* ---------------------------------------------------------- Nachladen --- */
  const geladen = {};
  function laden(id) {
    if (TEXT()[id]) return Promise.resolve(TEXT()[id]);
    if (geladen[id]) return geladen[id];
    geladen[id] = new Promise(fertig => {
      const s = document.createElement("script");
      s.src = "gen/komp/" + id + ".js";
      s.onload = () => fertig(TEXT()[id] || "");
      s.onerror = () => fertig("<p class=\"hint\">Der Text zu diesem Thema wurde nicht gefunden " +
        "(gen/komp/" + id + ".js).</p>");
      document.head.appendChild(s);
    });
    return geladen[id];
  }
  const alleLaden = () => Promise.all(THEMEN().map(t => laden(t.id)));

  /* ------------------------------------------------------------- Seite --- */
  function seite() {
    let s = $("scKomp");
    if (s) return s;
    s = el("div", "seite"); s.id = "scKomp"; s.hidden = true;
    s.innerHTML = '<div class="abschnitt kp-wrap">' +
      '<div class="kp-leiste" id="kpLeiste"></div>' +
      '<div id="kpInhalt"></div></div>';
    const start = $("scStart");
    start.parentNode.insertBefore(s, start.nextSibling);
    return s;
  }

  function zeigen() {
    seite();
    /* Jede andere Seite verschwindet — auch die, die erst später von einem
       anderen Modul angelegt wurde. Deshalb nicht nach einer festen Liste,
       sondern nach allem, was wie eine Seite aussieht. */
    document.querySelectorAll("div.seite[id^='sc']").forEach(e => {
      if (e.id !== "scKomp") e.hidden = true;
    });
    $("scKomp").hidden = false;
    const f = $("fuss"); if (f) f.hidden = true;
    const kt = $("kopfTitel"); if (kt) kt.hidden = false;
    if (window.GENZURUECK) window.GENZURUECK.knopfPflegen();
  }

  /* --------------------------------------------------------- Suchhilfe --- */
  const norm = s => String(s || "").toLowerCase()
    .replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");

  const BLOCK = /^(P|DIV|LI|UL|OL|TR|TD|TH|H1|H2|H3|H4|H5|BR|SECTION|TABLE|THEAD|TBODY|PRE|FIGURE|FIGCAPTION|SUMMARY|DETAILS|BLOCKQUOTE)$/;
  function nurText(h) {
    const d = document.createElement("div");
    d.innerHTML = h || "";
    const teile = [];
    (function lauf(n) {
      n.childNodes.forEach(k => {
        if (k.nodeType === 3) teile.push(k.nodeValue);
        else if (k.nodeType === 1) {
          if (/^(SCRIPT|STYLE)$/.test(k.nodeName)) return;
          if (BLOCK.test(k.nodeName)) teile.push(" ");
          lauf(k);
          if (BLOCK.test(k.nodeName)) teile.push(" ");
        }
      });
    })(d);
    return teile.join("").replace(/\s+/g, " ").trim();
  }

  function markieren(wurzel, wort) {
    const w = norm(wort).trim();
    if (w.length < 2) return 0;
    let n = 0;
    const lauf = document.createTreeWalker(wurzel, NodeFilter.SHOW_TEXT, {
      acceptNode: kn => (kn.parentNode && /^(SCRIPT|STYLE|MARK)$/.test(kn.parentNode.nodeName))
        ? NodeFilter.FILTER_REJECT
        : (norm(kn.nodeValue).includes(w) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
    });
    const knoten = [];
    while (lauf.nextNode()) knoten.push(lauf.currentNode);
    knoten.forEach(kn => {
      const txt = kn.nodeValue, nt = norm(txt);
      const teile = document.createDocumentFragment();
      let pos = 0, i = nt.indexOf(w);
      while (i >= 0) {
        if (i > pos) teile.appendChild(document.createTextNode(txt.slice(pos, i)));
        teile.appendChild(el("mark", "kp-treffer", txt.slice(i, i + w.length))); n++;
        pos = i + w.length; i = nt.indexOf(w, pos);
      }
      if (pos < txt.length) teile.appendChild(document.createTextNode(txt.slice(pos)));
      kn.parentNode.replaceChild(teile, kn);
    });
    return n;
  }

  function treffer(wort) {
    const w = norm(wort).trim();
    if (w.length < 2) return [];
    return THEMEN().map(t => {
      const txt = nurText((t.titel || "") + " " + (t.unter || "") + " " + (TEXT()[t.id] || ""));
      const n = norm(txt);
      const stellen = []; let i = n.indexOf(w), anzahl = 0;
      while (i >= 0) {
        anzahl++;
        if (stellen.length < 3) stellen.push(txt.slice(Math.max(0, i - 55), i + w.length + 80).trim());
        i = n.indexOf(w, i + w.length);
      }
      return { t, anzahl, stellen };
    }).filter(x => x.anzahl > 0).sort((a, b) => b.anzahl - a.anzahl);
  }

  /* ------------------------------------------------------------ Leiste --- */
  function leiste(modus, thema, liste) {
    const l = $("kpLeiste");
    l.innerHTML = "";
    const reihe = el("div", "kp-leiste-reihe");

    if (modus === "thema") {
      const zur = el("button", "btn ghost klein", "☰ Themen");
      zur.onclick = () => verzeichnis();
      reihe.appendChild(zur);
      const reihenfolge = liste || gefiltert();
      const i = reihenfolge.findIndex(x => x.id === thema.id);
      const vor = el("button", "btn ghost klein", "‹");
      vor.title = "vorheriges Thema"; vor.setAttribute("aria-label", "vorheriges Thema");
      vor.disabled = i <= 0;
      vor.onclick = () => oeffnen(reihenfolge[i - 1].id);
      const nach = el("button", "btn ghost klein", "›");
      nach.title = "nächstes Thema"; nach.setAttribute("aria-label", "nächstes Thema");
      nach.disabled = i < 0 || i >= reihenfolge.length - 1;
      nach.onclick = () => oeffnen(reihenfolge[i + 1].id);
      reihe.append(vor, el("span", "kp-zaehler", (i + 1) + " / " + reihenfolge.length), nach);
    } else {
      reihe.appendChild(el("span", "kp-titel-klein", "Kompendium · " + THEMEN().length + " Themen"));
    }

    /* Auf dem Telefon frisst das Suchfeld eine ganze Zeile der Leiste, und
       gesucht wird beim Lesen selten. Deshalb steckt es dort hinter einer
       Lupe; am Schreibtisch (ab 640 px) steht es wie bisher offen da.   */
    const lupe = el("button", "btn ghost klein kp-lupe", "🔍");
    lupe.type = "button";
    lupe.title = "suchen"; lupe.setAttribute("aria-label", "im Kompendium suchen");
    lupe.onclick = () => {
      l.classList.toggle("suche-offen");
      if (l.classList.contains("suche-offen")) { const i = $("kpSuche"); if (i) i.focus(); }
    };
    reihe.appendChild(lupe);

    const such = el("div", "kp-suche");
    const lab = el("label", "sr-only", "Im Kompendium suchen"); lab.htmlFor = "kpSuche";
    const inp = el("input"); inp.type = "search"; inp.id = "kpSuche";
    inp.placeholder = "suchen: Subnetting, RAID, DSGVO …";
    inp.value = stand.suche || ""; inp.autocomplete = "off";
    let warte = null;
    inp.oninput = () => {
      clearTimeout(warte);
      warte = setTimeout(() => {
        stand.suche = inp.value; merken();
        if (inp.value.trim().length >= 2) suchseite(inp.value);
        else if (modus === "thema") oeffnen(thema.id, true);
        else verzeichnis(true);
      }, 250);
    };
    such.append(lab, inp);
    reihe.appendChild(such);
    l.appendChild(reihe);
    if (stand.suche && stand.suche.trim()) l.classList.add("suche-offen");
  }

  /* ------------------------------------------------------- Verzeichnis --- */
  function gefiltert() {
    const f = stand.filter || "alle";
    const l = THEMEN().slice();
    if (f === "alle") {
      const rang = n => (n === "0" ? 9 : Number(n));
      return l.sort((a, b) => rang(gebietVon(a)) - rang(gebietVon(b)) || a.titel.localeCompare(b.titel, "de"));
    }
    if (f.slice(0, 5) === "mein:") {
      const w = f.slice(5);
      return l.filter(t => meinStand(t.id) === w)
              .sort((a, b) => a.titel.localeCompare(b.titel, "de"));
    }
    return l.filter(t => gebietVon(t) === f).sort((a, b) => a.titel.localeCompare(b.titel, "de"));
  }

  function zeile(t) {
    const w = meinStand(t.id);
    const a = el("button", "kp-zeile"); a.type = "button";
    a.dataset.mein = w;
    const punkt = el("span", "kp-punkt", meinZeichen(w));
    punkt.title = "eigener Stand: " + meinName(w);
    a.appendChild(punkt);
    const txt = el("span", "kp-text");
    txt.appendChild(el("b", null, t.titel));
    const unten = [gebietVon(t) === "0" ? "" : "AP " + gebietVon(t), t.unter || t.thema]
      .filter(Boolean).join(" · ");
    if (unten) txt.appendChild(el("span", "kp-unter", unten));
    a.appendChild(txt);
    if (w !== "neu") {
      const s = el("span", "kp-stand ist-" + w, meinName(w));
      a.appendChild(s);
    } else if (/nicht gelernt/i.test(t.stand || "")) {
      const s = el("span", "kp-stand ist-duenn", "dünn");
      s.title = "Die Kollegin hat diese Seite selbst als „Nicht gelernt“ markiert — sie ist fast leer.";
      a.appendChild(s);
    }
    a.appendChild(el("span", "kp-pfeil", "›"));
    a.onclick = () => oeffnen(t.id);
    return a;
  }

  function verzeichnis(ohneFokus) {
    seite();
    leiste("liste");
    const box = $("kpInhalt");
    box.innerHTML = "";

    const kopf = el("div", "kp-kopf");
    kopf.appendChild(el("h2", null, "AP1 Kompendium"));
    kopf.appendChild(el("p", "hint",
      "Ausgearbeitete Themenseiten zu allen sieben Prüfungsgebieten. Der Stand hier " +
      "ist dein eigener: beim Lesen unten am Thema auf „gelesen“, „verstanden“ oder " +
      "„nochmal“ tippen. Die Suche geht über alle Themen."));

    const gesamt = THEMEN().length;
    const nGelesen = zaehle("gelesen"), nVerstanden = zaehle("verstanden"),
          nNochmal = zaehle("wiederholen"), nNeu = zaehle("neu");
    const angefasst = gesamt - nNeu;

    const balken = el("div", "kp-balken");
    balken.title = angefasst + " von " + gesamt + " Themen angefasst";
    const b1 = el("div", "kp-balken-teil ist-verstanden");
    b1.style.width = (nVerstanden / gesamt * 100) + "%";
    const b2 = el("div", "kp-balken-teil ist-gelesen");
    b2.style.width = (nGelesen / gesamt * 100) + "%";
    const b3 = el("div", "kp-balken-teil ist-wiederholen");
    b3.style.width = (nNochmal / gesamt * 100) + "%";
    balken.append(b1, b2, b3);
    kopf.appendChild(balken);

    const zahlen = el("div", "kp-fakten");
    [[String(nNeu), "neu"], [String(nGelesen), "gelesen"],
     [String(nVerstanden), "verstanden"], [String(nNochmal), "nochmal"]]
      .forEach(([a, b]) => {
        const f = el("div", "kp-fakt");
        f.append(el("b", null, a), el("span", null, b));
        zahlen.appendChild(f);
      });
    kopf.appendChild(zahlen);

    const filter = el("div", "kp-filter");
    const setzen = (wert, beschriftung) => {
      const c = el("button", "kp-chip", beschriftung); c.type = "button";
      c.setAttribute("aria-pressed", String((stand.filter || "alle") === wert));
      c.onclick = () => { stand.filter = wert; merken(); verzeichnis(true); };
      filter.appendChild(c);
    };
    setzen("alle", "alle (" + gesamt + ")");
    if (nNeu) setzen("mein:neu", "○ neu (" + nNeu + ")");
    if (nNochmal) setzen("mein:wiederholen", "↻ nochmal (" + nNochmal + ")");
    if (nGelesen) setzen("mein:gelesen", "✓ gelesen (" + nGelesen + ")");
    if (nVerstanden) setzen("mein:verstanden", "★ verstanden (" + nVerstanden + ")");
    GEBIETE.forEach(([n, name]) => {
      const anzahl = THEMEN().filter(t => gebietVon(t) === n).length;
      if (anzahl) setzen(n, n + " " + name + " (" + anzahl + ")");
    });
    kopf.appendChild(filter);
    box.appendChild(kopf);

    const liste = gefiltert();
    if ((stand.filter || "alle") === "alle") {
      GEBIETE.forEach(([n, name]) => {
        const teil = liste.filter(t => gebietVon(t) === n);
        if (!teil.length) return;
        const g = el("div", "kp-gruppe");
        g.appendChild(el("h3", null, n === "0" ? name : n + " · " + name));
        const ul = el("div", "kp-liste");
        teil.forEach(t => ul.appendChild(zeile(t)));
        g.appendChild(ul);
        box.appendChild(g);
      });
    } else {
      const g = el("div", "kp-gruppe");
      const ul = el("div", "kp-liste");
      liste.forEach(t => ul.appendChild(zeile(t)));
      g.appendChild(ul);
      box.appendChild(g);
    }

    const quelle = el("p", "kp-quelle");
    quelle.innerHTML = "Inhalt aus einer geteilten Notion-Sammlung „Prüfungsvorbereitung“ " +
      "(Notizen einer Kurskollegin, FIAE). Übernommen als Lesekopie — die Originalseiten " +
      "bleiben unverändert.";
    box.appendChild(quelle);

    stand.thema = null; merken();
    zeigen();
    if (!ohneFokus) window.scrollTo(0, 0);
  }

  /* --------------------------------------------- Aufgaben zum Thema --- */
  /* Die Verknüpfung läuft über die Themenschlüssel der Anwendung
     (netzwerk, itsicherheit, kalkulation …), die in jedem Kompendium-Thema
     unter `themen` stehen. Die Wörter unter `worte` filtern NICHT — in den
     zehn echten Prüfungen kommen Lehrbuchbegriffe wie „Scrum“ oder
     „Blackbox“ schlicht nicht vor. Sie sortieren nur: Aufgaben, in denen
     ein Wort des Themas auftaucht, stehen vorn.                          */
  const HOECHSTENS = 20;   /* mehr passt in keine Lerneinheit am Telefon */
  const MINDESTENS = 8;    /* darunter lohnt der Sprung in die Übung nicht */

  function aufgabenZu(t) {
    try {
      if (typeof ALLE === "undefined" || !Array.isArray(ALLE) || !ALLE.length) return [];
      const themen = new Set(t.themen || []);
      if (!themen.size) return [];
      const durchlassen = (typeof aktiv === "function") ? aktiv : function () { return true; };
      const worte = (t.worte || []).map(w => String(w).toLowerCase());
      const rang = it => {
        const txt = ((it.prompt || "") + " " +
                     ((it.solution && it.solution.text) || "")).toLowerCase();
        let n = 0; worte.forEach(w => { if (txt.indexOf(w) >= 0) n++; });
        return n;
      };
      const passend = ALLE.filter(durchlassen)
        .filter(it => (it.topics || []).some(x => themen.has(x)))
        .map(it => ({ it: it, r: rang(it) }))
        .sort((a, b) => b.r - a.r);
      /* Die Aufgaben mit Worttreffer sind die eigentlichen. Der Rest des
         Themengebiets kommt nur dazu, wenn es sonst zu wenige wären —
         sieben Aufgaben zu „Kosten-Nutzen“ sind mehr wert als zwanzig,
         von denen die Hälfte über Konstruktoren geht.                    */
      const genau = passend.filter(x => x.r > 0);
      const liste = genau.length >= MINDESTENS ? genau : passend.slice(0, MINDESTENS);
      return liste.slice(0, HOECHSTENS).map(x => x.it);
    } catch (e) { return []; }
  }

  function uebungStarten(t) {
    const items = aufgabenZu(t);
    if (!items.length) return;
    try {
      VIEW = { modus: "uebung", exam: null, items: items, titel: "Kompendium · " + t.titel };
      SHOW_SOL = false;
      zeigeBogen();
      if (typeof toast === "function")
        toast(items.length + " Aufgaben zum Thema — die passendsten zuerst.");
    } catch (e) {
      if (typeof toast === "function") toast("Die Aufgaben lassen sich gerade nicht öffnen.");
    }
  }

  /* ------------------------------------------------------------- Thema --- */
  /** Vier Knöpfe für den eigenen Stand. Sie stehen zweimal auf der Seite:
   *  oben, wo man das Thema wiedererkennt, und unten, wo man mit dem Lesen
   *  fertig ist — auf dem Telefon will niemand dafür zurückscrollen.     */
  function standLeiste(t, untenDrunter) {
    const box = el("div", "kp-standleiste" + (untenDrunter ? " ist-unten" : ""));
    box.appendChild(el("span", "kp-standlabel", "Mein Stand:"));
    const knoepfe = el("div", "kp-standknoepfe");
    MEIN.forEach(([wert, name, zeichen]) => {
      const b = el("button", "kp-chip ist-" + wert, zeichen + " " + name);
      b.type = "button";
      b.setAttribute("aria-pressed", String(meinStand(t.id) === wert));
      b.onclick = () => {
        setzeStand(t.id, wert);
        document.querySelectorAll(".kp-standleiste").forEach(l => {
          l.querySelectorAll(".kp-chip").forEach((c, k) =>
            c.setAttribute("aria-pressed", String(MEIN[k][0] === meinStand(t.id))));
        });
      };
      knoepfe.appendChild(b);
    });
    box.appendChild(knoepfe);
    return box;
  }

  function oeffnen(id, stillHalten) {
    seite();
    const t = THEMEN().find(x => x.id === id) || THEMEN()[0];
    if (!t) return;
    const liste = gefiltert().some(x => x.id === t.id) ? gefiltert() : THEMEN();
    leiste("thema", t, liste);
    const box = $("kpInhalt");
    box.innerHTML = "";

    const kopf = el("div", "kp-kopf");
    kopf.appendChild(el("h2", null, t.titel));
    const meta = el("div", "kp-meta");
    [t.ap, t.thema, t.unter].filter(Boolean).forEach(m =>
      meta.appendChild(el("span", "kp-marke", m)));
    if (t.stand) {
      const k = el("span", "kp-marke ist-fremd", "Kollegin: " + t.stand);
      k.title = "Stand in der Notion-Sammlung der Kollegin — nicht dein eigener.";
      meta.appendChild(k);
    }
    if (meta.childNodes.length) kopf.appendChild(meta);
    if (t.notiz) kopf.appendChild(el("p", "hint", t.notiz));
    kopf.appendChild(standLeiste(t));
    box.appendChild(kopf);

    const inhalt = el("div", "kp-inhalt");
    inhalt.appendChild(el("p", "kp-laden", "Thema wird geladen …"));
    box.appendChild(inhalt);

    laden(t.id).then(h => {
      inhalt.innerHTML = h || "<p class=\"hint\">Diese Seite ist in der Sammlung noch leer.</p>";
      inhalt.querySelectorAll("table").forEach(tab => {
        if (tab.closest(".k-tab")) return;
        const w = el("div", "k-tab");
        tab.parentNode.insertBefore(w, tab); w.appendChild(tab);
      });
      if (stand.suche && stand.suche.trim().length >= 2) markieren(inhalt, stand.suche);
      /* Die Abbildungen sind Tabellen und Schaubilder aus den Notizen —
         auf 390 px Breite unlesbar. Antippen zeigt sie groß, mit den
         Zoom-Gesten des Browsers; noch einmal tippen schließt.          */
      inhalt.querySelectorAll("img").forEach(bild => {
        bild.classList.add("ist-tippbar");
        bild.onclick = () => grossansicht(bild.getAttribute("src"), bild.alt);
      });
    });

    const i = liste.findIndex(x => x.id === t.id);
    box.appendChild(standLeiste(t, true));
    const fuss = el("div", "kp-fuss");
    if (i > 0) {
      const b = el("button", "btn ghost klein", "‹ " + liste[i - 1].titel);
      b.onclick = () => oeffnen(liste[i - 1].id);
      fuss.appendChild(b);
    }
    if (i >= 0 && i < liste.length - 1) {
      const b = el("button", "btn klein", liste[i + 1].titel + " ›");
      b.onclick = () => oeffnen(liste[i + 1].id);
      fuss.appendChild(b);
    }
    const zurListe = el("button", "btn ghost klein", "☰ alle Themen");
    zurListe.onclick = () => verzeichnis();
    fuss.appendChild(zurListe);

    /* Gelesen ist nicht geübt: von hier direkt in den Übungsmodus mit den
       Aufgaben, die dieses Thema betreffen. */
    const wieviele = aufgabenZu(t).length;
    if (wieviele) {
      const u = el("button", "btn primary klein", "Aufgaben dazu üben (" + wieviele + ")");
      u.onclick = () => uebungStarten(t);
      fuss.insertBefore(u, fuss.firstChild);
    }
    box.appendChild(fuss);

    stand.thema = t.id; merken();
    zeigen();
    if (!stillHalten) window.scrollTo(0, 0);
  }

  /* -------------------------------------------------------- Großansicht --- */
  function grossansicht(quelle, text) {
    const alt = $("kpLupe"); if (alt) alt.remove();
    const box = el("div", "kp-gross"); box.id = "kpLupe";
    const bild = el("img"); bild.src = quelle; bild.alt = text || "Abbildung";
    const zu = el("button", "btn klein kp-gross-zu", "✕ schließen"); zu.type = "button";
    const schliessen = () => { box.remove(); document.removeEventListener("keydown", taste); };
    const taste = e => { if (e.key === "Escape") schliessen(); };
    zu.onclick = schliessen;
    box.onclick = e => { if (e.target === box || e.target === bild) schliessen(); };
    document.addEventListener("keydown", taste);
    box.append(bild, zu);
    document.body.appendChild(box);
  }

  /* ------------------------------------------------------- Suchergebnis --- */
  function suchseite(wort) {
    seite();
    stand.suche = wort; merken();
    leiste("liste");
    const box = $("kpInhalt");
    box.innerHTML = "";
    const kopf = el("div", "kp-kopf");
    kopf.appendChild(el("h2", null, "„" + wort.trim() + "“"));
    const info = el("p", "hint", "Es wird in allen " + THEMEN().length + " Themen gesucht …");
    kopf.appendChild(info);
    box.appendChild(kopf);
    zeigen();

    alleLaden().then(() => {
      if (norm(stand.suche) !== norm(wort)) return;   /* inzwischen weitergetippt */
      const tr = treffer(wort);
      info.textContent = tr.length
        ? tr.length + (tr.length === 1 ? " Thema enthält" : " Themen enthalten") + " das Wort."
        : "Kein Treffer. Andere Schreibweise oder kürzeres Wort versuchen.";
      const liste = el("div", "kp-liste");
      tr.forEach(x => {
        const a = el("button", "kp-fund"); a.type = "button";
        a.style.cssText = "display:block;width:100%;text-align:left;background:none;border:0;font:inherit;color:inherit;cursor:pointer";
        const kopfzeile = el("div");
        kopfzeile.appendChild(el("b", null, x.t.titel));
        kopfzeile.appendChild(el("span", "kp-unter", (x.t.ap || "") + " · " + x.anzahl + "×"));
        a.appendChild(kopfzeile);
        x.stellen.forEach(s => a.appendChild(el("div", "kp-stelle", "… " + s + " …")));
        a.onclick = () => oeffnen(x.t.id);
        liste.appendChild(a);
      });
      box.appendChild(liste);
    });
  }

  /* --------------------------------------------------------- Startblock --- */
  function block() {
    const start = $("scStart");
    if (!start || !THEMEN().length) return;
    let box = $("kompBox");
    if (!box) {
      box = el("div", "abschnitt"); box.id = "kompBox";
      box.appendChild(el("h2", null, "Kompendium"));
      const p = el("p", "hint"); p.id = "kompHinweis";
      box.appendChild(p);
      const inhalt = el("div"); inhalt.id = "kompInhalt";
      box.appendChild(inhalt);
      const anker = $("spickBox") || $("archivBox") || $("gesamtBox");
      const ziel = anker ? (anker.closest("details.st-block") || anker) : null;
      if (ziel && ziel.parentNode) ziel.parentNode.insertBefore(box, ziel.nextSibling);
      else start.appendChild(box);
    }
    const hinweis = $("kompHinweis");
    if (hinweis) {
      const g = THEMEN().length, neu = zaehle("neu");
      hinweis.textContent = g + " Themenseiten zu allen sieben AP1-Gebieten. " +
        (neu === g
          ? "Noch nichts davon gelesen."
          : (g - neu) + " angefasst, davon " + zaehle("verstanden") + " verstanden" +
            (zaehle("wiederholen") ? ", " + zaehle("wiederholen") + " zum Wiederholen" : "") + ".");
    }

    const inhalt = $("kompInhalt");
    inhalt.innerHTML = "";

    const reihe = el("div", "kp-schnell");
    GEBIETE.forEach(([n, name]) => {
      const anzahl = THEMEN().filter(t => gebietVon(t) === n).length;
      if (!anzahl) return;
      const b = el("button", "btn ghost klein", n + " " + name + " (" + anzahl + ")");
      b.onclick = () => { stand.filter = n; merken(); verzeichnis(); };
      reihe.appendChild(b);
    });
    inhalt.appendChild(reihe);

    const steuer = el("div", "steuer");
    steuer.style.marginTop = "10px";
    const auf = el("button", "btn primary klein", "Kompendium öffnen");
    auf.onclick = () => { stand.filter = "alle"; merken(); verzeichnis(); };
    steuer.appendChild(auf);
    if (stand.thema) {
      const t = THEMEN().find(x => x.id === stand.thema);
      if (t) {
        const w = el("button", "btn klein", "weiter bei „" + t.titel + "“");
        w.onclick = () => oeffnen(t.id);
        steuer.appendChild(w);
      }
    }
    const nochmal = THEMEN().filter(t => meinStand(t.id) === "wiederholen");
    if (nochmal.length) {
      const w = el("button", "btn klein", "↻ nochmal (" + nochmal.length + ")");
      w.onclick = () => { stand.filter = "mein:wiederholen"; merken(); verzeichnis(); };
      steuer.appendChild(w);
    }
    const naechstesNeue = THEMEN().find(t => meinStand(t.id) === "neu");
    if (naechstesNeue) {
      const w = el("button", "btn ghost klein", "nächstes neues Thema");
      w.onclick = () => oeffnen(naechstesNeue.id);
      steuer.appendChild(w);
    }
    inhalt.appendChild(steuer);
  }

  /* ---------------------------------------------------------- Einhängen --- */
  function einhaengen() {
    seite();
    const altStart = window.renderStart;
    if (typeof altStart === "function" && !altStart.__kp) {
      const neu = function () {
        const r = altStart.apply(this, arguments);
        try { block(); } catch (e) { console.error("Kompendium:", e); }
        return r;
      };
      neu.__kp = true; window.renderStart = neu;
    }
    const altSchirm = window.schirm;
    if (typeof altSchirm === "function" && !altSchirm.__kp) {
      const neu = function () {
        const s = $("scKomp"); if (s) s.hidden = true;
        return altSchirm.apply(this, arguments);
      };
      neu.__kp = true; window.schirm = neu;
    }
    /* Andere Kapitel (Spickzettel, Archiv, Generator …) blenden ihre eigene
       Seite selbst ein und kennen diese hier nicht — ihre Umschaltfunktion
       liegt in einem Modul und lässt sich von außen nicht zuverlässig
       umwickeln. Deshalb wird schlicht zugesehen: sobald irgendeine andere
       Seite sichtbar wird, verschwindet das Kompendium. */
    if (!window.__kpWache && window.MutationObserver) {
      window.__kpWache = new MutationObserver(muts => {
        const k = $("scKomp");
        if (!k || k.hidden) return;
        for (const m of muts) {
          const z = m.target;
          if (z !== k && z.classList && z.classList.contains("seite") &&
              /^sc/.test(z.id || "") && !z.hidden) { k.hidden = true; return; }
        }
      });
      window.__kpWache.observe(document.body,
        { subtree: true, attributes: true, attributeFilter: ["hidden"] });
    }
    try { block(); } catch (e) { }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { verzeichnis, oeffnen, suchseite, block, zeigen, laden };
})();
