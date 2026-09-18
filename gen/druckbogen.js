/* ============================================================================
   gen/druckbogen.js — den Bogen druckfertig machen
   ----------------------------------------------------------------------------
   Drei Dinge, die nur beim Drucken auffallen:

   1. Ein <textarea> druckt nur seinen sichtbaren Ausschnitt. Wer zwölf
      Zeilen geschrieben hat, findet auf dem Papier vier — der Rest fehlt
      wortlos. Deshalb wird vor dem Druck neben jedes Feld ein Textblock
      gelegt, der den ganzen Inhalt zeigt.

   2. Ein leeres Feld braucht auf Papier Schreiblinien, und zwar so viele,
      wie die Aufgabe wert ist: zwei Zeilen für 1 BE, acht für 10 BE. Vorher
      bekam jede Aufgabe denselben Kasten von 70 pt — bei kleinen Aufgaben
      verschenkt, bei großen zu knapp.

   3. Abbildungen haben loading="lazy". Was beim Drucken noch nicht geladen
      war, druckt als leerer Rahmen. Deshalb werden die Bilder des offenen
      Bogens in einer ruhigen Minute nachgeladen und vor dem Druck auf
      „sofort“ gestellt.

   Angestoßen wird das über das beforeprint-Ereignis — damit wirkt es auch
   bei Strg+P und beim Drucken aus dem Browsermenü, nicht nur über den
   Knopf in der Kopfzeile.
   ========================================================================== */
"use strict";

window.GENDRUCKBOGEN = (function () {

  /* ---------------------------------------------------------------------
     Zwei Sorten Ausdruck, und man merkt erst am Papier, welche man hatte.

     Zum Üben braucht man den LEEREN Bogen: Schreiblinien, keine eigenen
     Antworten, keine Lösungen. Zum Nacharbeiten braucht man das Gegenteil —
     alles, was man geschrieben hat, damit man es neben die Musterlösung
     legen kann. Bisher entschied das der Zufall: was im Feld stand, wurde
     gedruckt. Wer eine Prüfung ein zweites Mal auf Papier schreiben wollte,
     bekam seine alten Antworten mit ausgedruckt.

     Deshalb fragt der Druckknopf jetzt einmal nach. Die Wahl wird gemerkt,
     und der Kasten zeigt sie beim nächsten Mal vorausgewählt an — ein Klick
     mehr, dafür nie wieder zehn Blatt für den falschen Zweck.
     ------------------------------------------------------------------ */
  const OSK = "ihk2:druck:opt";
  const OPT = { modus: "leer", bilder: "klein" };
  try { Object.assign(OPT, JSON.parse(localStorage.getItem(OSK)) || {}); } catch (e) { }
  function optSichern() { try { localStorage.setItem(OSK, JSON.stringify(OPT)); } catch (e) { } }
  function optAnwenden() {
    const d = document.documentElement.dataset;
    d.druckModus = OPT.modus;
    d.druckBilder = OPT.bilder;
  }
  optAnwenden();

  /* Wie viele Schreiblinien für wie viele Bewertungseinheiten?
     Eine IHK-Antwortzeile fasst grob einen Halbsatz; erfahrungsgemäß
     entspricht ein BE etwa einer Zeile, mit zwei als Untergrenze, damit
     auch die 1-BE-Aufgabe Platz zum Streichen und Korrigieren hat.      */
  function zeilen(be, gedrungen) {
    const n = Number(be) || 0;
    if (gedrungen) return 2;            /* darunter steht schon eine Tabelle */
    if (n <= 1) return 2;
    if (n >= 10) return 9;
    return Math.max(2, Math.min(9, Math.round(n * 1.1)));
  }

  function block(ta) {
    let d = ta.nextElementSibling;
    if (!d || !d.classList || !d.classList.contains("dr-antwort")) {
      d = document.createElement("div");
      d.className = "dr-antwort";
      ta.parentNode.insertBefore(d, ta.nextSibling);
    }
    return d;
  }

  /* Eine Karte gilt als „gedrungen“, wenn oben schon eine ausfüllbare
     Tabelle oder eine Feldliste steht: dann ist das freie Feld nur noch
     für Nebenrechnungen da und braucht keine acht Linien.               */
  function istGedrungen(karte, ta) {
    if (!karte) return false;
    if (karte.querySelector(".tb-block, .ex-dia, .fb-bild")) return true;
    const felder = karte.querySelector(".felder");
    return !!(felder && !felder.contains(ta));
  }

  function feldVorbereiten(ta) {
    const karte = ta.closest(".tk");
    const d = block(ta);
    d.innerHTML = "";
    /* Im leeren Bogen bleibt der eigene Text weg — auch wenn er dasteht. */
    const txt = OPT.modus === "leer" ? "" : String(ta.value || "").replace(/\s+$/, "");

    if (txt) {
      d.classList.remove("dr-leer");
      const m = document.createElement("div");
      m.className = "dr-marke";
      m.textContent = "Deine Antwort";
      const p = document.createElement("div");
      p.textContent = txt;
      d.append(m, p);
      return;
    }

    d.classList.add("dr-leer");
    /* Die Punktzahl steht am Feld selbst (Teilfeld) oder an der Karte. */
    let be = ta.dataset.be;
    if (be == null || be === "") {
      const r = karte && karte.querySelector(".rand-be small");
      be = r ? (r.textContent.match(/\d+/) || [0])[0] : 0;
    }
    const n = zeilen(be, istGedrungen(karte, ta));
    for (let i = 0; i < n; i++) {
      const l = document.createElement("div");
      l.className = "dr-linie";
      d.appendChild(l);
    }
  }

  /* Dasselbe Problem in klein: die Textzellen der Tabellen sind ebenfalls
     textarea. Auf dem Bildschirm wachsen sie mit, auf Papier ist die
     Spalte schmaler — dort passte der Satz dann nicht mehr hinein und
     endete mitten im Wort. Deshalb steht beim Drucken ein einfacher
     Textblock in der Zelle.                                            */
  function zelleVorbereiten(ta) {
    let d = ta.nextElementSibling;
    if (!d || !d.classList || !d.classList.contains("tb-druck")) {
      d = document.createElement("div");
      d.className = "tb-druck";
      ta.parentNode.insertBefore(d, ta.nextSibling);
    }
    d.textContent = OPT.modus === "leer" ? "" : String(ta.value || "").trim();
  }

  /* ---------------------------------------------------------- Bilder --- */
  function bilderLaden(wurzel) {
    const bilder = (wurzel || document).querySelectorAll("#scBogen img[loading='lazy']");
    bilder.forEach(i => { i.loading = "eager"; });
    return bilder.length;
  }

  let geplant = false;
  function bilderSpaeterLaden() {
    if (geplant) return;
    geplant = true;
    const tun = () => { geplant = false; bilderLaden(); };
    if (window.requestIdleCallback) requestIdleCallback(tun, { timeout: 4000 });
    else setTimeout(tun, 2500);
  }

  /* ------------------------------------------------------- Der Kasten --- */
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  function wahlZeile(feld, wert, titel, text) {
    const k = el("button", "dk-wahl" + (OPT[feld] === wert ? " an" : ""));
    k.type = "button";
    k.appendChild(el("span", "dk-wahl-t", titel));
    k.appendChild(el("span", "dk-wahl-h", text));
    k.onclick = () => { OPT[feld] = wert; optSichern(); optAnwenden(); kasten(); };
    return k;
  }

  function kastenZu() {
    const k = document.getElementById("druckWahl");
    if (k) k.remove();
    document.removeEventListener("keydown", aufEsc, true);
  }
  function aufEsc(ev) { if (ev.key === "Escape") { ev.stopPropagation(); kastenZu(); } }

  function kasten() {
    kastenZu();
    const h = el("div", "dk-huelle"); h.id = "druckWahl";
    h.onclick = ev => { if (ev.target === h) kastenZu(); };

    const k = el("div", "dk-kasten");
    k.setAttribute("role", "dialog");
    k.setAttribute("aria-label", "Was soll gedruckt werden?");
    k.appendChild(el("h3", "dk-titel", "Was soll aufs Papier?"));

    const g1 = el("div", "dk-gruppe");
    g1.appendChild(wahlZeile("modus", "leer", "Leerer Bogen zum Schreiben",
      "Schreiblinien statt Antworten — so viele, wie die Aufgabe BE hat. " +
      "Deine Eingaben bleiben gespeichert, sie werden nur nicht mitgedruckt."));
    g1.appendChild(wahlZeile("modus", "antworten", "Mit meinen Antworten",
      "Alles, was du geschrieben hast, vollständig — zum Vergleichen mit der Musterlösung."));
    k.appendChild(g1);

    const g2 = el("div", "dk-gruppe");
    g2.appendChild(wahlZeile("bilder", "klein", "Abbildungen kompakt",
      "Höhe auf 10,5 cm begrenzt. Spart Seiten."));
    g2.appendChild(wahlZeile("bilder", "gross", "Abbildungen groß",
      "Volle Breite ohne Höhengrenze — für feine Netzpläne und Tabellen, die sonst nicht lesbar sind."));
    k.appendChild(g2);

    const f = el("div", "dk-fuss");
    const ab = el("button", "btn ghost", "abbrechen");
    ab.type = "button"; ab.onclick = kastenZu;
    const los = el("button", "btn primary", "Drucken");
    los.type = "button";
    los.onclick = () => { kastenZu(); setTimeout(() => window.print(), 60); };
    f.append(ab, los);
    k.appendChild(f);

    h.appendChild(k);
    document.body.appendChild(h);
    document.addEventListener("keydown", aufEsc, true);
    los.focus();
  }

  /* ------------------------------------------------- Vorschau am Handy --- */
  /* Die Vorschau ist ein echtes A4-Blatt: 210 mm sind bei 96 dpi 794 px. Auf
     einem 390 px breiten Telefon ragt davon die Hälfte aus dem Bild — man
     sieht die linke Spalte und ahnt den Rest. Betroffen ist alles, was
     diesen Behälter benutzt: Prüfungsbogen, Lösungsbogen, Formelblatt,
     Merkblatt.

     Skaliert wird mit `zoom`, nicht mit `transform`: transform verkleinert
     nur das Bild, der Platzbedarf bleibt — der Balken zum Seitwärtsrollen
     wäre also geblieben. Vor dem Drucken muss der Wert wieder weg, sonst
     landet die Verkleinerung mit auf dem Papier.                          */
  const A4_PX = 794;
  let zoomAus = null;

  function vorschauAnpassen() {
    const b = document.getElementById("druckBogen");
    if (!b || !b.parentElement) return;
    const platz = b.parentElement.clientWidth - 16;
    if (platz <= 0) return;
    const f = Math.min(1, platz / A4_PX);
    b.style.zoom = f < 0.995 ? String(Math.max(0.4, Math.round(f * 100) / 100)) : "";
  }
  function zoomWeg() {
    const b = document.getElementById("druckBogen");
    if (!b) return;
    zoomAus = b.style.zoom;
    b.style.zoom = "";
  }
  function zoomZurueck() {
    const b = document.getElementById("druckBogen");
    if (!b || zoomAus == null) return;
    b.style.zoom = zoomAus; zoomAus = null;
  }
  window.addEventListener("resize", () => { try { vorschauAnpassen(); } catch (e) { } });
  window.addEventListener("afterprint", () => { try { zoomZurueck(); } catch (e) { } });

  /* Den vorhandenen Druckknopf abfangen: der Zuhörer in index.html hängt in
     der Blasenphase, dieser in der Einfangphase — damit kommt er zuerst
     und kann das direkte window.print() unterdrücken.                     */
  function knopfAbfangen() {
    const b = document.getElementById("btnDrucken");
    if (!b || b.dataset.dkAbgefangen) return;
    b.dataset.dkAbgefangen = "1";
    b.addEventListener("click", ev => {
      ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
      kasten();
    }, true);
  }

  /* --------------------------------------------------------- Anstoßen --- */
  function vorbereiten() {
    optAnwenden();
    zoomWeg();
    bilderLaden();
    document.querySelectorAll("#scBogen .tk textarea:not(.tb-feld)").forEach(feldVorbereiten);
    document.querySelectorAll("#scBogen .tb-rollen textarea.tb-feld").forEach(zelleVorbereiten);
  }

  window.addEventListener("beforeprint", vorbereiten);
  /* Safari und ältere Browser kennen beforeprint nicht, wohl aber die
     Medienabfrage.                                                      */
  if (window.matchMedia) {
    const mq = window.matchMedia("print");
    const hoer = e => { if (e.matches) vorbereiten(); };
    if (mq.addEventListener) mq.addEventListener("change", hoer);
    else if (mq.addListener) mq.addListener(hoer);
  }

  /* Nach dem Aufbau eines Bogens die Bilder im Hintergrund nachladen,
     damit Strg+P sie fertig vorfindet.                                  */
  const altZeige = window.zeigeBogen;
  if (typeof altZeige === "function" && !altZeige.__drb) {
    const neu = function () {
      const r = altZeige.apply(this, arguments);
      bilderSpaeterLaden();
      return r;
    };
    neu.__drb = true;
    window.zeigeBogen = neu;
  }

  /* Jede Vorschau geht durch GENDRUCK.zeige — dort einmal nachmessen. */
  function druckModulFassen() {
    const D = window.GENDRUCK;
    if (!D || typeof D.zeige !== "function" || D.zeige.__drb) return;
    const alt = D.zeige;
    const neu = function () {
      const r = alt.apply(this, arguments);
      setTimeout(() => { try { vorschauAnpassen(); } catch (e) { } }, 30);
      return r;
    };
    neu.__drb = true; D.zeige = neu;
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", knopfAbfangen);
  else knopfAbfangen();
  setTimeout(() => { knopfAbfangen(); druckModulFassen(); }, 500);
  druckModulFassen();

  return { vorbereiten, zeilen, bilderLaden, kasten, vorschauAnpassen, OPT };
})();
