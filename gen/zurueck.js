/* ============================================================================
   gen/zurueck.js — ein Weg zurück, und die Zurück-Taste tut, was sie soll
   ----------------------------------------------------------------------------
   Bisher führte aus jedem Bildschirm nur ein Weg heraus: der Klick auf das
   Logo oben links. Dass die Marke gleichzeitig ein Knopf ist, sieht man ihr
   nicht an — sie sieht aus wie eine Überschrift. Und die Zurück-Taste des
   Browsers, auf dem Handy die Wischgeste vom Rand, verlässt die Anwendung
   komplett: mitten in der Simulation ist das ein Schreck.

   Grund: die Anwendung wechselt ihre Bildschirme, ohne dem Browser davon zu
   erzählen. Für ihn gibt es nur eine einzige Seite, und „zurück“ heißt dann
   „weg hier“.

   Diese Datei bringt zweierlei:

     • einen sichtbaren Knopf „← Zurück“ links im Kopf, der immer eine Ebene
       nach oben führt (Auswertung → Bogen → Start),
     • einen Eintrag im Verlauf des Browsers je Bildschirmwechsel. Damit
       führt die Zurück-Taste dorthin, wo man herkam, statt aus der App
       hinaus. Die Escape-Taste tut dasselbe.

   Zwei Dinge sind bewusst so gebaut:

     1. Die Wechsel laufen weiterhin über schirm(); diese Datei hängt sich
        nur davor. Wer schirm() aufruft, muss nichts über den Verlauf wissen.
     2. Ein Wechsel, der VOM Verlauf ausgelöst wird, schreibt keinen neuen
        Verlaufseintrag — sonst käme man nie irgendwo an.
   ========================================================================== */
"use strict";

window.GENZURUECK = (function () {
  const $ = id => document.getElementById(id);

  /* Wohin führt „eine Ebene nach oben“? */
  const HOEHER = {
    scBogen: "scStart",
    scAuswertung: "scBogen",
    scNetz: "scStart",
    scKK: "scStart",
    scModell: "scStart",
    scUml: "scStart",
    scArchiv: "scStart",
    scSpick: "scStart",
    scKomp: "scStart",
    scGen: "scStart"
  };
  const NAMEN = {
    scStart: "Start", scBogen: "Prüfungsbogen", scAuswertung: "Auswertung",
    scNetz: "Netzplan-Trainer", scKK: "Karteikarten", scModell: "Modell-Trainer",
    scUml: "UML-Trainer", scArchiv: "Archiv", scSpick: "Spickzettel", scKomp: "Kompendium", scGen: "Arbeitsblatt"
  };

  let jetzt = "scStart";
  let ausVerlauf = false;     /* gerade durch popstate ausgelöst? */

  /* Die Bildschirme heißen zwar alle „sc…“, tragen aber nicht alle dieselbe
     Klasse: der Prüfungsbogen ist ein .blatt, nicht .seite. Deshalb wird
     nach den bekannten Kennungen gesucht und nicht nach der Klasse — sonst
     bleibt genau der Bildschirm unsichtbar, um den es am meisten geht.   */
  const SCHIRME = ["scStart", "scBogen", "scAuswertung", "scNetz", "scKK",
                   "scModell", "scUml", "scArchiv", "scSpick", "scKomp", "scGen"];
  function sichtbar() {
    for (const id of SCHIRME) { const e = $(id); if (e && !e.hidden) return id; }
    return "scStart";
  }

  function knopfBauen() {
    if ($("btnZurueck")) return;
    const kopfIn = document.querySelector(".kopf .kopf-in");
    const marke = $("btnHome");
    if (!kopfIn || !marke) return;
    const b = document.createElement("button");
    b.id = "btnZurueck";
    b.className = "btn ghost klein zurueck";
    b.type = "button";
    b.innerHTML = "<span aria-hidden=\"true\">←</span> Zurück";
    b.title = "Eine Ebene zurück (Zurück-Taste oder Esc tun dasselbe)";
    b.hidden = true;
    b.onclick = () => zurueck();
    kopfIn.insertBefore(b, marke);
  }

  function knopfPflegen() {
    const b = $("btnZurueck");
    if (!b) return;
    const wo = sichtbar();
    b.hidden = !HOEHER[wo];
    if (!b.hidden) {
      const ziel = HOEHER[wo];
      b.setAttribute("aria-label", "Zurück zu " + (NAMEN[ziel] || ziel));
      b.title = "Zurück zu " + (NAMEN[ziel] || ziel) + " · Zurück-Taste oder Esc";
    }
  }

  /** Eine Ebene nach oben. Nutzt den Verlauf, wenn möglich — dann bleibt die
   *  Zurück-Taste des Browsers und der Knopf im Gleichklang. */
  function zurueck() {
    const wo = sichtbar();
    const ziel = HOEHER[wo];
    if (!ziel) return;
    if (history.state && history.state.ihk) { history.back(); return; }
    wechsle(ziel);
  }

  function wechsle(ziel) {
    if (typeof window.schirm === "function") window.schirm(ziel);
    if (ziel === "scStart" && typeof window.renderStart === "function") {
      try { window.renderStart(); } catch (e) { }
    }
  }

  function einhaengen() {
    knopfBauen();

    /* schirm() umhüllen: Knopf nachziehen und Verlauf mitschreiben */
    const alt = window.schirm;
    if (typeof alt === "function" && !alt.__zk) {
      const neu = function (name) {
        const vorher = sichtbar();
        const r = alt.apply(this, arguments);
        const nachher = sichtbar();
        try {
          knopfPflegen();
          if (!ausVerlauf && nachher !== vorher) {
            /* Erster Eintrag ersetzt den bestehenden, damit die Zurück-Taste
               auf der Startseite weiterhin aus der Anwendung führt. */
            const daten = { ihk: 1, seite: nachher };
            if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: vorher }, "");
            history.pushState(daten, "", location.hash || "");
          }
          jetzt = nachher;
        } catch (e) { console.error("Zurück:", e); }
        return r;
      };
      neu.__zk = true;
      window.schirm = neu;
    }

    window.addEventListener("popstate", ev => {
      const ziel = (ev.state && ev.state.seite) || "scStart";
      if (ziel === sichtbar()) { knopfPflegen(); return; }
      ausVerlauf = true;
      try { wechsle(ziel); } finally { ausVerlauf = false; }
      knopfPflegen();
    });

    /* Esc: dasselbe wie der Knopf — aber nicht, während man schreibt */
    document.addEventListener("keydown", ev => {
      if (ev.key !== "Escape" || ev.altKey || ev.ctrlKey || ev.metaKey) return;
      const a = document.activeElement;
      if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) { a.blur(); return; }
      /* Steht eine Lupe oder ein Dialog offen, gehört Esc dorthin. Die Lupe
         wird per CSS ein- und ausgeblendet, nicht über das hidden-Attribut —
         also wird nachgesehen, ob sie wirklich auf dem Schirm steht.     */
      const offen = [...document.querySelectorAll("dialog[open], .lupe, .modal")]
        .some(x => x.offsetParent !== null || x.getClientRects().length);
      if (offen) return;
      if (HOEHER[sichtbar()]) { ev.preventDefault(); zurueck(); }
    });

    knopfPflegen();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { zurueck, knopfPflegen };
})();
