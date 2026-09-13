/* ============================================================================
   gen/pwa.js — die Seite als App auf dem Telefon
   ----------------------------------------------------------------------------
   Meldet den Service Worker an, bietet die Installation an, weist auf neue
   Versionen hin und wertet die Verknüpfungen aus dem Manifest aus
   (?start=simulation | blatt | satzbau).

   Von der Festplatte geöffnet (file://) passiert hier gar nichts: Service
   Worker gibt es nur über http(s). Die Seite läuft dann wie bisher.
   ========================================================================== */
"use strict";

window.GENPWA = (function () {
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  const moeglich = "serviceWorker" in navigator && /^https?:$/.test(location.protocol);
  const installiert = () =>
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const istIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  let installEreignis = null;
  let REG = null;

  /* ------------------------------------------------------------- Anmelden */
  function anmelden() {
    if (!moeglich) return;
    navigator.serviceWorker.register("./sw.js").then(reg => {
      REG = reg;
      /* Wartet schon eine neue Fassung? */
      if (reg.waiting && navigator.serviceWorker.controller) neueVersion(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const neu = reg.installing;
        if (!neu) return;
        neu.addEventListener("statechange", () => {
          if (neu.state === "installed" && navigator.serviceWorker.controller) neueVersion(neu);
        });
      });
      /* alle sechs Stunden nach einer neuen Fassung sehen */
      setInterval(() => { try { reg.update(); } catch (e) { } }, 6 * 3600 * 1000);
    }).catch(e => console.warn("Service Worker:", e));

    let laedtNeu = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (laedtNeu) return;
      laedtNeu = true;
      location.reload();
    });

    /* Der Worker meldet, wenn er im Hintergrund eine geänderte Programmdatei
       geholt hat. Das ist der häufigere Fall: sw.js selbst bleibt gleich,
       aber gen/blatt.js oder index.html haben sich geändert. Ohne diesen
       Hinweis sieht man die Änderung erst beim übernächsten Aufruf und
       hält sie für nicht angekommen.                                    */
    navigator.serviceWorker.addEventListener("message", ev => {
      const d = ev.data || {};
      if (d.typ === "inhalt-neu") inhaltNeu(d.datei);
    });
  }

  function inhaltNeu(datei) {
    if ($("pwaNeu") || $("pwaInhalt")) return;
    const bar = el("div", "pwa-bar"); bar.id = "pwaInhalt";
    bar.appendChild(el("span", null,
      "Eine neuere Fassung ist geladen" + (datei ? " (" + datei.split("/").pop() + ")" : "") +
      " — sie wirkt erst nach dem Neuladen."));
    const j = el("button", "btn primary klein", "Neu laden");
    j.onclick = () => location.reload();
    const s = el("button", "btn ghost klein", "später");
    s.onclick = () => bar.remove();
    bar.append(j, s);
    document.body.appendChild(bar);
  }

  function neueVersion(worker) {
    if ($("pwaNeu")) return;
    const bar = el("div", "pwa-bar"); bar.id = "pwaNeu";
    bar.appendChild(el("span", null, "Eine neue Fassung liegt bereit."));
    const j = el("button", "btn primary klein", "Jetzt laden");
    j.onclick = () => { try { worker.postMessage({ typ: "sofort" }); } catch (e) { location.reload(); } };
    const s = el("button", "btn ghost klein", "später");
    s.onclick = () => bar.remove();
    bar.append(j, s);
    document.body.appendChild(bar);
  }

  /* ---------------------------------------------------- Installieren anbieten */
  function installKasten() {
    if (!moeglich || installiert()) return;
    const ziel = $("genStartBox");
    if (!ziel || $("pwaBox")) return;
    /* Nicht aufdrängen: einmal weggeklickt bleibt es weg. */
    try { if (localStorage.getItem("ihk2:pwa:weg") === "1") return; } catch (e) { }

    const k = el("div", "pwa-box"); k.id = "pwaBox";
    const links = el("div");
    links.appendChild(el("h3", null, "Auf dem Handy als App"));
    const p = el("p");
    p.innerHTML = istIOS()
      ? "In <b>Safari</b> unten auf <b>Teilen</b> tippen und <b>„Zum Home-Bildschirm“</b> wählen. " +
        "Danach startest du den Simulator wie eine App — ohne Adressleiste und <b>ohne Netz</b>: " +
        "alle zehn Prüfungen, alle Generatoren und die Simulation laufen offline weiter."
      : "Einmal installieren, dann läuft der Simulator wie eine App — ohne Adressleiste und " +
        "<b>ohne Netz</b>: alle zehn Prüfungen, alle Generatoren und die Simulation laufen offline weiter.";
    links.appendChild(p);
    if (istIOS()) {
      const hin = el("p", "pwa-klein",
        "Wichtig: die App auf dem Home-Bildschirm hat auf dem iPhone einen eigenen Speicher. " +
        "Dein Stand aus Safari kommt nicht automatisch mit — nimm ihn über „Fortschritt exportieren“ " +
        "als Datei mit und importiere ihn dort einmal.");
      links.appendChild(hin);
    }
    k.appendChild(links);

    const rechts = el("div", "pwa-knoepfe");
    if (installEreignis) {
      const b = el("button", "btn primary", "App installieren");
      b.onclick = async () => {
        const e = installEreignis; installEreignis = null;
        b.disabled = true;
        try { e.prompt(); await e.userChoice; } catch (err) { }
        k.remove();
      };
      rechts.appendChild(b);
    }
    const weg = el("button", "btn ghost klein", "nicht mehr anzeigen");
    weg.onclick = () => { try { localStorage.setItem("ihk2:pwa:weg", "1"); } catch (e) { } k.remove(); };
    rechts.appendChild(weg);
    k.appendChild(rechts);

    const nach = $("simBox");
    if (nach) ziel.insertBefore(k, nach); else ziel.appendChild(k);
  }

  /* ------------------------------------------- Verknüpfungen aus dem Manifest */
  function schnellstart() {
    let ziel = null;
    try { ziel = new URLSearchParams(location.search).get("start"); } catch (e) { }
    if (!ziel) return;
    /* die Adresszeile wieder sauber machen, damit ein Reload nichts wiederholt */
    try { history.replaceState(null, "", location.pathname); } catch (e) { }
    setTimeout(() => {
      try {
        if (ziel === "simulation" && window.GENSIM) window.GENSIM.starten();
        else if (ziel === "blatt" && window.GENUI) window.GENUI.assistent();
        else if (ziel === "satzbau" && window.GENSATZ) window.GENSATZ.starten();
        else if (ziel === "spick" && window.GENSPICK) window.GENSPICK.verzeichnis();
        else if (ziel === "komp" && window.GENKOMP) window.GENKOMP.verzeichnis();
      } catch (e) { console.warn("Schnellstart:", e); }
    }, 400);
  }

  /* ------------------------------------------------------------- Einhängen */
  window.addEventListener("beforeinstallprompt", ev => {
    ev.preventDefault();
    installEreignis = ev;
    try { installKasten(); } catch (e) { }
  });
  window.addEventListener("appinstalled", () => { const b = $("pwaBox"); if (b) b.remove(); });

  function einhaengen() {
    anmelden();
    const alt = window.renderStart;
    if (typeof alt === "function") {
      window.renderStart = function () {
        alt.apply(null, arguments);
        try { installKasten(); } catch (e) { }
      };
    }
    try { installKasten(); } catch (e) { }
    schnellstart();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
  else einhaengen();

  return { moeglich, installiert, istIOS, anmelden, installKasten };
})();
