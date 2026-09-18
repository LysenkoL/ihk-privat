/* ============================================================================
   gen/version.js — welche Fassung läuft hier gerade?
   ----------------------------------------------------------------------------
   Anlass: der Gantt-Trainer war längst auf Kalendertage umgestellt, auf der
   Platte lag die richtige Datei — und im Browser stand trotzdem noch „Tag 0“.
   Schuld war nicht die Änderung, sondern der Service Worker: er hatte die
   alte Seite im Vorrat und gab sie weiter aus. Von außen ist das nicht zu
   unterscheiden von „die Änderung ist nie angekommen“, und man sucht den
   Fehler an der falschen Stelle.

   Deshalb steht die Fassung jetzt sichtbar unten auf der Startseite:

       Fassung ihk-ap1-v17 · geladen 18.09. 21:04     [nach Update suchen]

   Die Nummer kommt aus dem Service Worker selbst (er antwortet auf eine
   Nachricht mit seiner VERSION). Steht dort eine ältere Nummer als die, die
   gerade ausgeliefert wurde, ist klar: es liegt am Vorrat, nicht am Code.

   Der Knopf fragt beim Server nach, übernimmt eine wartende Fassung sofort
   und lädt neu — das ersetzt „Strg+Shift+R“, das auf dem Telefon ohnehin
   niemand drücken kann.
   ========================================================================== */
"use strict";

window.GENVERSION = (function () {
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  let swVersion = null;

  /* Die Version aus dem laufenden Service Worker erfragen. */
  function fragen() {
    return new Promise(res => {
      if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) return res(null);
      let fertig = false;
      const hoerer = ev => {
        const d = ev.data || {};
        if (d.typ === "version") {
          fertig = true;
          navigator.serviceWorker.removeEventListener("message", hoerer);
          res(d.version || null);
        }
      };
      navigator.serviceWorker.addEventListener("message", hoerer);
      try { navigator.serviceWorker.controller.postMessage({ typ: "version" }); } catch (e) { }
      setTimeout(() => { if (!fertig) { navigator.serviceWorker.removeEventListener("message", hoerer); res(null); } }, 1500);
    });
  }

  const geladen = () => {
    const d = new Date(performance.timeOrigin || Date.now());
    return String(d.getDate()).padStart(2, "0") + "." + String(d.getMonth() + 1).padStart(2, "0") +
           ". " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  };

  /** Update erzwingen: nachfragen, wartende Fassung übernehmen, neu laden. */
  async function aktualisieren(knopf) {
    if (knopf) { knopf.disabled = true; knopf.textContent = "suche …"; }
    let neu = false;
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) {
          await r.update();
          if (r.waiting) { neu = true; try { r.waiting.postMessage({ typ: "sofort" }); } catch (e) { } }
          if (r.installing) neu = true;
        }
      }
    } catch (e) { }
    /* Auch ohne wartenden Worker neu laden: die Seite selbst kommt über
       „Netz zuerst“, damit ist ein Neuladen die verlässlichste Kur.    */
    if (knopf) knopf.textContent = neu ? "gefunden — lade neu …" : "lade neu …";
    setTimeout(() => location.reload(true), neu ? 700 : 250);
  }

  async function zeile() {
    const s = $("scStart");
    if (!s) return;
    let box = $("versionZeile");
    if (!box) {
      box = el("div", "ver-zeile"); box.id = "versionZeile";
      s.appendChild(box);
    }
    box.innerHTML = "";

    if (swVersion === null) swVersion = await fragen();

    const txt = el("span", "ver-txt");
    txt.textContent = (swVersion ? "Fassung " + swVersion : "Fassung unbekannt (kein Offline-Speicher aktiv)") +
                      " · geladen " + geladen();
    box.appendChild(txt);

    const k = el("button", "ver-knopf", "nach Update suchen");
    k.type = "button";
    k.title = "Beim Server nachfragen und die Seite neu laden — ersetzt Strg+Shift+R";
    k.onclick = () => aktualisieren(k);
    box.appendChild(k);
  }

  function einhaengen() {
    const alt = window.renderStart;
    if (typeof alt === "function" && !alt.__ver) {
      const neu = function () {
        const r = alt.apply(this, arguments);
        try { zeile(); } catch (e) { }
        return r;
      };
      neu.__ver = true; window.renderStart = neu;
    }
    setTimeout(() => { try { zeile(); } catch (e) { } }, 400);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { fragen, aktualisieren, zeile };
})();
