/* ============================================================================
   sw.js — Service Worker für den IHK AP1 Prüfungssimulator
   ----------------------------------------------------------------------------
   Aufgabe: die App auch ohne Netz startklar halten. Ohne Netz heißt hier:
   in der Bahn, im Wartezimmer, im Flugzeug — genau dort, wo die letzten
   Wochen vor der Prüfung sonst verloren gehen.

   Drei Strategien, je nach Art der Datei:

   1. Die Seite selbst (index.html)      → NETZ ZUERST, Cache als Rückfall.
      So kommt eine neue Version sofort an, sobald Netz da ist.
   2. Programm und Prüfungsdaten (js/css/json) → CACHE ZUERST, im Hintergrund
      aktualisieren (stale-while-revalidate). Startet sofort, holt sich die
      neue Fassung für das nächste Mal.
   3. Bilder (assets/*.png)              → CACHE ZUERST, sonst laden und
      behalten. Was einmal angesehen wurde, ist offline da. Zusätzlich kann
      eine ganze Prüfung im Voraus geladen werden (siehe gen/offline.js).

   Die Bilder liegen bewusst in einem EIGENEN Cache: beim Versionswechsel
   wird der Programm-Cache geleert, die mühsam geladenen 20 MB Prüfungsbilder
   bleiben aber erhalten.
   ========================================================================== */
"use strict";

/* Bei jeder Veröffentlichung hochzählen — dann wirft der Worker den alten
   Programm-Cache weg und holt alles frisch. Die Bilder bleiben davon
   unberührt.                                                              */
const VERSION   = "ihk-ap1-v18";
const CACHE_APP = VERSION + "-app";
const CACHE_BILD = "ihk-ap1-bilder";       /* ohne Version — bleibt bestehen */

/* Ohne diese Dateien startet nichts. Alles andere kommt beim ersten Besuch
   von selbst in den Cache, weil index.html es ohnehin nachlädt.           */
const GRUNDGERUEST = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./exams/exams.js"
];

const MAX_BILDER = 260;   /* rund fünf komplette Prüfungen */

/* ------------------------------------------------------------- Installieren */
self.addEventListener("install", ev => {
  ev.waitUntil((async () => {
    const c = await caches.open(CACHE_APP);
    /* einzeln, damit eine fehlende Datei nicht die ganze Installation kippt */
    await Promise.all(GRUNDGERUEST.map(u =>
      c.add(new Request(u, { cache: "reload" })).catch(() => { })));
  })());
});

/* --------------------------------------------------------------- Aktivieren */
self.addEventListener("activate", ev => {
  ev.waitUntil((async () => {
    const namen = await caches.keys();
    await Promise.all(namen.map(n => {
      if (n === CACHE_APP || n === CACHE_BILD) return null;
      return caches.delete(n);            /* alte Programmstände wegräumen */
    }));
    await self.clients.claim();
  })());
});

/* ------------------------------------------------------------------ Abrufen */
const istBild = url => /\.(png|jpe?g|webp|gif|svg)$/i.test(url.pathname);
const istCode = url => /\.(js|css|json|webmanifest)$/i.test(url.pathname);

self.addEventListener("fetch", ev => {
  const req = ev.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   /* Fremde Hosts: durchlassen */

  /* 1. Seitenaufruf: Netz zuerst */
  if (req.mode === "navigate") {
    ev.respondWith((async () => {
      try {
        const netz = await fetch(req);
        const c = await caches.open(CACHE_APP);
        c.put("./index.html", netz.clone());
        return netz;
      } catch (e) {
        const c = await caches.open(CACHE_APP);
        return (await c.match("./index.html")) || (await c.match("./")) ||
               new Response("Offline und nichts im Cache.", { status: 503 });
      }
    })());
    return;
  }

  /* 2. Bilder: Cache zuerst, sonst holen und behalten */
  if (istBild(url)) {
    ev.respondWith((async () => {
      const c = await caches.open(CACHE_BILD);
      const da = await c.match(req);
      if (da) return da;
      try {
        const netz = await fetch(req);
        if (netz && netz.ok) { c.put(req, netz.clone()); aufraeumen(); }
        return netz;
      } catch (e) {
        return new Response("", { status: 504 });
      }
    })());
    return;
  }

  /* 3. Programm und Daten: aus dem Cache antworten, im Hintergrund erneuern.

     Der Haken an dieser Strategie: die neue Fassung liegt erst beim NÄCHSTEN
     Aufruf vor. Wer gerade etwas geändert hat, sieht die Änderung nicht und
     hält sie für nicht angekommen — genau das ist passiert, als der Knopf
     „Bogen drucken“ da war, aber nicht erschien: index.html kam frisch aus
     dem Netz (Strategie 1), gen/blatt.js aber aus dem Cache.

     Deshalb wird hier verglichen: unterscheidet sich das Geholte von dem,
     was im Cache lag, erfahren die offenen Seiten davon und können einen
     Hinweis zeigen. Das hängt nicht an der Versionsnummer unten und
     funktioniert damit auch dann, wenn jemand vergisst, sie hochzuzählen. */
  if (istCode(url)) {
    /* Der Hintergrund-Abruf braucht ein waitUntil.
       Ohne das darf der Browser den Worker abschalten, sobald die Antwort
       aus dem Cache raus ist — und genau das tut er. Die versprochene
       Erneuerung „für das nächste Mal“ fand deshalb NIE statt: die Datei
       blieb im Cache liegen, egal wie oft man neu lud. Sichtbar wurde es
       an „Bogen drucken“: die Datei lag längst auf dem Server, im Browser
       kam sie nie an.                                                    */
    const arbeit = (async () => {
      const c = await caches.open(CACHE_APP);
      const da = await c.match(req);
      let neu = null;
      try {
        /* „no-cache“ heißt: beim Server rückfragen. Sonst antwortet der
           HTTP-Cache des Browsers aus seinem eigenen Vorrat, und der
           Worker sieht die neue Datei nie.                              */
        neu = await fetch(new Request(req, { cache: "no-cache" }));
      } catch (e) { neu = null; }
      if (neu && neu.ok) {
        const zumVergleich = da ? da.clone() : null;
        await c.put(req, neu.clone());
        if (zumVergleich) {
          try {
            const [altT, neuT] = await Promise.all([zumVergleich.text(), neu.clone().text()]);
            if (altT !== neuT) inhaltGeaendert(url.pathname);
          } catch (e) { }
        }
      }
      return { da, neu };
    })();

    ev.waitUntil(arbeit);
    ev.respondWith((async () => {
      const { da, neu } = await arbeit;
      return da || neu || new Response("", { status: 504 });
    })());
  }
});

/* Einmal je Sitzung Bescheid geben — nicht einmal je Datei, sonst blinkt
   nach einer größeren Änderung ein Dutzend Hinweise auf.                 */
let gemeldet = false;
async function inhaltGeaendert(datei) {
  if (gemeldet) return;
  gemeldet = true;
  try {
    const alle = await self.clients.matchAll({ type: "window" });
    alle.forEach(cl => cl.postMessage({ typ: "inhalt-neu", datei: datei }));
  } catch (e) { }
}

/* Bilder-Cache begrenzen: die ältesten Einträge fliegen zuerst */
let raeumtGerade = false;
async function aufraeumen() {
  if (raeumtGerade) return;
  raeumtGerade = true;
  try {
    const c = await caches.open(CACHE_BILD);
    const keys = await c.keys();
    if (keys.length > MAX_BILDER) {
      for (let i = 0; i < keys.length - MAX_BILDER; i++) await c.delete(keys[i]);
    }
  } catch (e) { } finally { raeumtGerade = false; }
}

/* ---------------------------------------------------------------- Nachrichten */
self.addEventListener("message", ev => {
  const d = ev.data || {};
  if (d.typ === "sofort") self.skipWaiting();          /* Update übernehmen */
  if (d.typ === "version" && ev.source) ev.source.postMessage({ typ: "version", version: VERSION });
});
