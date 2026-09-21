/* ============================================================================
   gen/auth.js — lokale Gerätesperre für den IHK AP1 Prüfungssimulator
   ----------------------------------------------------------------------------
   Aufgabe: Versehentliches Öffnen auf demselben Gerät erschweren, ohne den
   lokalen Offline-Betrieb zu beeinträchtigen. Dies ist keine Server-Anmeldung.

   Funktionsweise:
   1. Einmalige Freischaltung über PIN (2026) oder geheimen Link (?key=2026).
   2. Der Freischaltstatus wird dauerhaft in localStorage gemerkt ("ihk:auth").
   3. Ist die Freischaltung aktiv, läuft alles wie bisher — keine Abfragen,
      keine Verzögerung, volle Offline- und PWA-Funktion.
   4. Ohne Freischaltung wird ein Sperrbildschirm mit PIN-Eingabe angezeigt,
      der alle Prüfungen, Spickzettel und Kompendium-Inhalte blockiert.
   ========================================================================== */
"use strict";

window.GENAUTH = (function () {
  const SK = "ihk:auth";
  const PIN_HASH = "158a323a7ba44870f23d96f1516dd70aa48e9a72db4ebb026b0a89e212a208ab"; // SHA-256 von "2026"

  async function sha256(str) {
    try {
      if (window.crypto && crypto.subtle && window.TextEncoder) {
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
      }
    } catch (e) { }
    return null;
  }

  async function pruefePin(pin) {
    const h = await sha256(pin);
    return h === PIN_HASH;
  }

  let vorherigerFokus = null;
  let keydownHandler = null;

  function freigeschaltet() {
    try { return localStorage.getItem(SK) === "1"; } catch (e) { return false; }
  }

  function sperren() {
    try { localStorage.removeItem(SK); } catch (e) { }
    location.reload();
  }

  function autorisieren() {
    try { localStorage.setItem(SK, "1"); } catch (e) { }
    document.documentElement.classList.remove("gesperrt");
    const lock = document.getElementById("authLock");
    if (lock) lock.remove();
    if (keydownHandler) {
      document.removeEventListener("keydown", keydownHandler);
      keydownHandler = null;
    }
    if (vorherigerFokus && typeof vorherigerFokus.focus === "function") {
      try { vorherigerFokus.focus(); } catch (e) { }
    }
    if (typeof window.renderStart === "function") {
      try { window.renderStart(); } catch (e) { }
    }
  }

  /* ------------------------------------------------ Schnellstart per Link */
  let passend = false;
  try {
    const sp = new URLSearchParams(location.search);
    const k = sp.get("key") || sp.get("pin");
    if (k === "2026" || location.hash === "#2026") {
      passend = true;
      try { history.replaceState(null, "", location.pathname); } catch (e) { }
    }
  } catch (e) { }

  if (passend || freigeschaltet()) {
    try { localStorage.setItem(SK, "1"); } catch (e) { }
    return { freigeschaltet: () => true, sperren };
  }

  /* Nicht autorisiert: sofort sperren */
  document.documentElement.classList.add("gesperrt");

  /* ---------------------------------------------------- Sperrbildschirm */
  let eingegeben = "";

  function baueSperrbildschirm() {
    if (freigeschaltet() || document.getElementById("authLock")) return;

    const wrap = document.createElement("div");
    wrap.id = "authLock";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-labelledby", "alTitel");
    wrap.setAttribute("aria-describedby", "alSub");
    wrap.innerHTML =
      '<div class="al-box" id="alBox">' +
        '<div class="al-icon" aria-hidden="true">🔒</div>' +
        '<h2 class="al-titel" id="alTitel">IHK AP1 Simulator</h2>' +
        '<p class="al-sub" id="alSub">Lokale Gerätesperre · PIN eingeben</p>' +
        '<p class="al-hinweis">Schützt vor versehentlichem Öffnen auf diesem Gerät, nicht vor technischem Zugriff.</p>' +
        '<div class="al-pin-dots" id="alDots">' +
          '<div class="al-dot"></div><div class="al-dot"></div>' +
          '<div class="al-dot"></div><div class="al-dot"></div>' +
        '</div>' +
        '<div class="al-pad">' +
          '<button type="button" class="al-key" data-k="1">1</button>' +
          '<button type="button" class="al-key" data-k="2">2</button>' +
          '<button type="button" class="al-key" data-k="3">3</button>' +
          '<button type="button" class="al-key" data-k="4">4</button>' +
          '<button type="button" class="al-key" data-k="5">5</button>' +
          '<button type="button" class="al-key" data-k="6">6</button>' +
          '<button type="button" class="al-key" data-k="7">7</button>' +
          '<button type="button" class="al-key" data-k="8">8</button>' +
          '<button type="button" class="al-key" data-k="9">9</button>' +
          '<button type="button" class="al-key al-del" data-k="C">C</button>' +
          '<button type="button" class="al-key" data-k="0">0</button>' +
          '<button type="button" class="al-key al-del" data-k="B">⌫</button>' +
        '</div>' +
        '<div class="al-fehler" id="alFehler" aria-live="assertive" aria-atomic="true"></div>' +
      '</div>';

    vorherigerFokus = document.activeElement;
    document.body.appendChild(wrap);

    const dots = wrap.querySelectorAll(".al-dot");
    const fehler = wrap.querySelector("#alFehler");
    const box = wrap.querySelector("#alBox");

    function updateDots() {
      dots.forEach((d, i) => {
        if (i < eingegeben.length) d.classList.add("voll");
        else d.classList.remove("voll");
      });
    }

    async function tasteGedrueckt(k) {
      if (fehler) fehler.textContent = "";
      if (k === "C") {
        eingegeben = "";
        updateDots();
        return;
      }
      if (k === "B") {
        eingegeben = eingegeben.slice(0, -1);
        updateDots();
        return;
      }
      if (/^[0-9]$/.test(k) && eingegeben.length < 4) {
        eingegeben += k;
        updateDots();
        if (eingegeben.length === 4) {
          const ok = await pruefePin(eingegeben);
          if (ok) {
            autorisieren();
          } else {
            box.classList.add("al-shake");
            if (fehler) fehler.textContent = "Falscher PIN-Code";
            setTimeout(() => {
              box.classList.remove("al-shake");
              eingegeben = "";
              updateDots();
            }, 500);
          }
        }
      }
    }

    wrap.querySelectorAll(".al-key").forEach(btn => {
      btn.addEventListener("click", () => tasteGedrueckt(btn.getAttribute("data-k")));
    });

    keydownHandler = ev => {
      if (document.getElementById("authLock")) {
        if (ev.key === "Tab") {
          const controls = Array.from(wrap.querySelectorAll("button:not([disabled])"));
          if (!controls.length) return;
          const first = controls[0], last = controls[controls.length - 1];
          if (ev.shiftKey && document.activeElement === first) {
            ev.preventDefault(); last.focus();
          } else if (!ev.shiftKey && document.activeElement === last) {
            ev.preventDefault(); first.focus();
          }
          return;
        }
        if (/^[0-9]$/.test(ev.key)) tasteGedrueckt(ev.key);
        else if (ev.key === "Backspace") tasteGedrueckt("B");
        else if (ev.key === "Escape") tasteGedrueckt("C");
      }
    };
    document.addEventListener("keydown", keydownHandler);
    const ersteTaste = wrap.querySelector(".al-key");
    if (ersteTaste) ersteTaste.focus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", baueSperrbildschirm);
  } else {
    baueSperrbildschirm();
  }

  return { freigeschaltet, sperren };
})();
