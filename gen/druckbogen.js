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
    const txt = String(ta.value || "").replace(/\s+$/, "");

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
    d.textContent = String(ta.value || "").trim();
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

  /* --------------------------------------------------------- Anstoßen --- */
  function vorbereiten() {
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

  return { vorbereiten, zeilen, bilderLaden };
})();
