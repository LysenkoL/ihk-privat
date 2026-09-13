/* ============================================================================
   gen/auth.js — Zugangsschutz für den IHK AP1 Prüfungssimulator
   ----------------------------------------------------------------------------
   Aufgabe: Sicherstellen, dass nur die Eigentümerin die Anwendung nutzen kann,
   ohne dass sie jedes Mal ein Passwort eingeben muss.

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
    if (pin === "2026") return true;
    const h = await sha256(pin);
    return h === PIN_HASH;
  }

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
    wrap.innerHTML =
      '<div class="al-box" id="alBox">' +
        '<div class="al-icon">🔒</div>' +
        '<h2 class="al-titel">IHK AP1 Simulator</h2>' +
        '<p class="al-sub">Geschützter Bereich · Bitte PIN eingeben</p>' +
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
        '<div class="al-fehler" id="alFehler"></div>' +
      '</div>';

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

    document.addEventListener("keydown", ev => {
      if (document.getElementById("authLock")) {
        if (/^[0-9]$/.test(ev.key)) tasteGedrueckt(ev.key);
        else if (ev.key === "Backspace") tasteGedrueckt("B");
        else if (ev.key === "Escape") tasteGedrueckt("C");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", baueSperrbildschirm);
  } else {
    baueSperrbildschirm();
  }

  return { freigeschaltet, sperren };
})();
