/* ============================================================================
   gen/er-canvas.js — das ER-Modell mit der Maus bauen
   ----------------------------------------------------------------------------
   Bis hierher wurde das ER-Modell getippt: zwei Tabellen, daraus eine
   Zeichnung. Auf dem Telefon ist das die schnellere Eingabe und bleibt
   deshalb erhalten. Am großen Bildschirm ist es die langsamere: dort denkt
   man in Kästen und Linien, nicht in Zeilen und Spalten.

   Diese Datei legt eine zweite Eingabeart daneben. Entscheidend dabei:

     Es gibt weiterhin NUR EIN Datenmodell.

   Die Zeichenfläche verändert dieselben Listen `ent` und `bez`, die auch die
   Tabellen verändern. Deshalb gilt der vorhandene Prüfer unverändert, das
   Speichern gilt unverändert, die Musterlösung gilt unverändert — und wer
   mitten in der Aufgabe umschaltet, findet alles wieder. Gespeichert wird
   zusätzlich nur, WO ein Kasten liegt (`geo`); das ist reine Optik, und
   fehlt es, wird von selbst eine vernünftige Anordnung gerechnet.

   Bedienung, bewusst mit wenigen Regeln:
     • Knoten anfassen und ziehen — Raster 10 px, abschaltbar
     • angetippter Knoten ist ausgewählt; die Leiste zeigt, was damit geht
     • „+ Attribut" hängt ein Attribut an den ausgewählten Kasten oder
       an die ausgewählte Raute
     • „Verbinden" klickt Raute → Entität → Entität
     • Doppelklick benennt um, Entf löscht, Strg+Z nimmt zurück

   Kardinalitäten werden nicht gezeichnet, sondern an der ausgewählten Raute
   gesetzt — zwei kleine Felder. Alles andere wäre Malen statt Modellieren.
   ========================================================================== */
"use strict";

window.GENERCANVAS = (function () {
  const NS = "http://www.w3.org/2000/svg";
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const sv = (t, a) => { const e = document.createElementNS(NS, t);
    if (a) Object.keys(a).forEach(k => e.setAttribute(k, a[k])); return e; };
  const putz = s => String(s == null ? "" : s).trim();
  const KARD = ["1", "n", "m"];

  /* ------------------------------------------------------- Hilfsrechnung */

  /* Die Attribute einer Entität liegen im Datenmodell als „pk" und als
     Komma-Liste vor. Auf der Fläche ist jedes ein eigener Knoten, deshalb
     hier hin und zurück.                                                  */
  function attrsVon(e) {
    const raus = [];
    putz(e.pk).split(",").map(putz).filter(Boolean).forEach(n => raus.push({ name: n, pk: true }));
    putz(e.attr).split(",").map(putz).filter(Boolean).forEach(n => raus.push({ name: n, pk: false }));
    return raus;
  }
  function attrsNach(e, liste) {
    e.pk = liste.filter(a => a.pk).map(a => a.name).join(", ");
    e.attr = liste.filter(a => !a.pk).map(a => a.name).join(", ");
  }
  function bezAttrs(b) {
    return putz(b.attr).split(",").map(putz).filter(Boolean).map(n => ({ name: n, pk: false }));
  }
  function bezAttrsNach(b, liste) { b.attr = liste.map(a => a.name).join(", "); }

  const breiteVon = (s, prof) => Math.max(72, putz(s).length * (prof || 8) + 26);

  /* ------------------------------------------------------------ Aufbau -- */

  /**
   * @param daten     { ent:[…], bez:[…], geo?:{} } — wird direkt verändert
   * @param geaendert Rückruf nach jeder Änderung (speichert und zeichnet neu)
   * @param loes      Musterlösung, nur für „vorgegeben"-Markierung
   */
  function bau(daten, geaendert, loes) {
    if (!daten.geo) daten.geo = {};
    const G = daten.geo;

    let auswahl = null;          /* id des ausgewählten Knotens */
    let verbindModus = false;    /* Raute → Entität → Entität */
    let verbindRaute = null;
    let raster = G.__raster !== false;
    const stapel = [];           /* Rückgängig */

    const wurzel = el("div", "ec-wurzel");
    const leiste = el("div", "ec-leiste");
    const flaeche = el("div", "ec-flaeche");
    const fuss = el("div", "ec-fuss");
    wurzel.append(leiste, flaeche, fuss);

    /* ------------------------------------------------------ Datenzugriff */
    const entName = i => putz((daten.ent[i] || {}).name);
    function findeEntIndex(name) {
      const n = putz(name).toLowerCase();
      return daten.ent.findIndex(e => putz(e.name).toLowerCase() === n && n !== "");
    }
    /* Eine vorgegebene Entität darf nicht gelöscht oder umbenannt werden —
       sie steht so in der Aufgabe.                                       */
    function istFest(i) {
      const n = entName(i).toLowerCase();
      return (loes && (loes.entitaeten || []).some(x => x.gegeben && putz(x.name).toLowerCase() === n));
    }

    function merken() {
      stapel.push(JSON.stringify({ ent: daten.ent, bez: daten.bez, geo: daten.geo }));
      if (stapel.length > 40) stapel.shift();
    }
    function zurueck() {
      const s = stapel.pop();
      if (!s) return;
      const o = JSON.parse(s);
      daten.ent.length = 0; o.ent.forEach(x => daten.ent.push(x));
      daten.bez.length = 0; o.bez.forEach(x => daten.bez.push(x));
      Object.keys(daten.geo).forEach(k => delete daten.geo[k]);
      Object.assign(daten.geo, o.geo);
      auswahl = null;
      raus();
    }

    function raus() { zeichne(); geaendert(); }

    /* --------------------------------------------------------- Anordnung */
    /* Wo noch nichts gespeichert ist, wird einmal vernünftig verteilt:
       Entitäten in einer Reihe, Rauten zwischen ihren beiden Enden,
       Attribute fächerförmig über dem Kasten.                           */
    const SP = 260, YE = 300;
    function ort(id, standard) {
      if (!G[id]) G[id] = { x: standard.x, y: standard.y };
      return G[id];
    }
    function entOrt(i) { return ort("e" + i, { x: 140 + i * SP, y: YE }); }
    function bezOrt(j) {
      const b = daten.bez[j] || {};
      const vi = findeEntIndex(b.von), ni = findeEntIndex(b.nach);
      const a = vi >= 0 ? entOrt(vi) : { x: 140 + j * SP, y: YE };
      const c = ni >= 0 ? entOrt(ni) : { x: 140 + (j + 1) * SP, y: YE };
      return ort("b" + j, { x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 + (vi >= 0 && ni >= 0 ? 0 : 120) });
    }
    function attrOrt(besitzerId, k, anzahl, mitte) {
      const proReihe = Math.min(3, Math.max(1, anzahl));
      const zeile = Math.floor(k / proReihe), inReihe = k % proReihe;
      const spanne = (proReihe - 1) * 132;
      return ort(besitzerId + "#" + k, {
        x: mitte.x - spanne / 2 + inReihe * 132,
        y: mitte.y - 108 - zeile * 62
      });
    }

    /* ----------------------------------------------------------- Knoten */
    /* Eine flache Liste aller sichtbaren Knoten — daraus entstehen sowohl
       die Zeichnung als auch die Treffererkennung beim Ziehen.          */
    function knoten() {
      const liste = [];
      daten.ent.forEach((e, i) => {
        if (!putz(e.name) && !attrsVon(e).length) return;
        const p = entOrt(i);
        liste.push({ id: "e" + i, typ: "ent", i: i, name: putz(e.name) || "?", x: p.x, y: p.y,
                     w: breiteVon(e.name, 9), h: 48, fest: istFest(i) });
        const as = attrsVon(e);
        as.forEach((a, k) => {
          const q = attrOrt("e" + i, k, as.length, p);
          liste.push({ id: "e" + i + "#" + k, typ: "attr", besitzer: "e" + i, i: i, k: k,
                       name: a.name, pk: a.pk, x: q.x, y: q.y,
                       w: breiteVon(a.name, 6.4), h: 34 });
        });
      });
      daten.bez.forEach((b, j) => {
        /* Die Tabellen halten immer eine leere Zeile zum Weiterschreiben
           bereit. Auf der Fläche wäre das eine namenlose Raute im Nichts —
           die wird übersprungen und beim Anlegen wiederverwendet.       */
        if (!putz(b.von) && !putz(b.nach) && !putz(b.name)) return;
        const p = bezOrt(j);
        liste.push({ id: "b" + j, typ: "bez", j: j, name: putz(b.name) || "?", x: p.x, y: p.y,
                     w: Math.max(96, breiteVon(b.name, 7)), h: 52 });
        const as = bezAttrs(b);
        as.forEach((a, k) => {
          const q = attrOrt("b" + j, k, as.length, { x: p.x, y: p.y + 220 });
          liste.push({ id: "b" + j + "#" + k, typ: "attr", besitzer: "b" + j, j: j, k: k,
                       name: a.name, pk: false, x: q.x, y: q.y,
                       w: breiteVon(a.name, 6.4), h: 34 });
        });
      });
      return liste;
    }

    const holen = (liste, id) => liste.find(n => n.id === id);

    /* --------------------------------------------------------- Zeichnen */
    /* Die <svg> selbst bleibt bestehen, nur ihr Inhalt wird ersetzt.
       Grund: beim Ziehen wird nach jeder Mausbewegung neu gezeichnet. Hing
       der Zuhörer am Knoten, war er nach dem ersten Neuzeichnen weg — der
       Kasten blieb beim ersten Bildpunkt stehen und rührte sich nicht mehr.
       Jetzt hängen pointermove und pointerup am Fenster und überleben das
       Neuzeichnen; die <svg> überlebt es auch, damit die Umrechnung von
       Bildschirm- in Zeichenkoordinaten stabil bleibt.                  */
    const svg = sv("svg", { class: "ec-svg" });
    flaeche.appendChild(svg);

    function zeichne() {
      const liste = knoten();
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      /* Ausmaße aus den Knoten, mit Rand — die Fläche wächst mit. */
      let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      liste.forEach(n => {
        minX = Math.min(minX, n.x - n.w / 2); maxX = Math.max(maxX, n.x + n.w / 2);
        minY = Math.min(minY, n.y - n.h / 2); maxY = Math.max(maxY, n.y + n.h / 2);
      });
      if (!liste.length) { minX = 0; maxX = 900; minY = 0; maxY = 520; }
      const R = 70;
      const bx = minX - R, by = minY - R;
      const bw = Math.max(640, maxX - minX + 2 * R), bh = Math.max(420, maxY - minY + 2 * R);

      svg.setAttribute("viewBox", bx + " " + by + " " + bw + " " + bh);
      svg.style.width = Math.max(640, bw) + "px";
      svg.style.height = Math.max(420, bh) + "px";

      /* Raster als Hintergrund — hilft beim geraden Ausrichten */
      if (raster) {
        const muster = sv("pattern", { id: "ecRaster", width: 20, height: 20,
          patternUnits: "userSpaceOnUse", x: bx, y: by });
        muster.appendChild(sv("path", { d: "M 20 0 L 0 0 0 20", class: "ec-raster" }));
        const defs = sv("defs"); defs.appendChild(muster); svg.appendChild(defs);
        svg.appendChild(sv("rect", { x: bx, y: by, width: bw, height: bh, fill: "url(#ecRaster)" }));
      }

      /* --- Linien zuerst, damit sie hinter den Formen liegen --- */
      daten.bez.forEach((b, j) => {
        const r = holen(liste, "b" + j); if (!r) return;
        [["von", b.von], ["nach", b.nach]].forEach(([seite, name]) => {
          const i = findeEntIndex(name);
          if (i < 0) return;
          const e = holen(liste, "e" + i); if (!e) return;
          svg.appendChild(sv("line", { x1: r.x, y1: r.y, x2: e.x, y2: e.y, class: "ec-linie" }));
          /* Kardinalität auf die Linie, ein Stück vor den Kasten */
          const k = putz(b.kard).split(":");
          const wert = seite === "von" ? k[0] : k[1];
          if (wert) {
            const t = 0.72;
            svg.appendChild(beschriftung(r.x + (e.x - r.x) * t, r.y + (e.y - r.y) * t - 12,
                                         wert, "ec-t-kard"));
          }
        });
      });
      liste.filter(n => n.typ === "attr").forEach(a => {
        const b = holen(liste, a.besitzer); if (!b) return;
        svg.appendChild(sv("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: "ec-linie" }));
      });

      /* --- Formen --- */
      liste.forEach(n => {
        const g = sv("g", { class: "ec-knoten" + (auswahl === n.id ? " ec-gewaehlt" : "") +
                                   (n.fest ? " ec-fest" : "") });
        g.dataset.id = n.id;
        if (n.typ === "ent") {
          g.appendChild(sv("rect", { x: n.x - n.w / 2, y: n.y - n.h / 2, width: n.w, height: n.h,
                                     class: "ec-kasten" }));
          g.appendChild(beschriftung(n.x, n.y, n.name, "ec-t-ent"));
        } else if (n.typ === "bez") {
          const p = [[n.x, n.y - n.h / 2], [n.x + n.w / 2, n.y],
                     [n.x, n.y + n.h / 2], [n.x - n.w / 2, n.y]].map(q => q.join(",")).join(" ");
          g.appendChild(sv("polygon", { points: p, class: "ec-raute" }));
          g.appendChild(beschriftung(n.x, n.y, n.name, "ec-t-bez"));
        } else {
          g.appendChild(sv("ellipse", { cx: n.x, cy: n.y, rx: n.w / 2, ry: n.h / 2,
                                        class: "ec-ellipse" + (n.pk ? " ec-pk" : "") }));
          g.appendChild(beschriftung(n.x, n.y, n.name, "ec-t-attr" + (n.pk ? " ec-t-pk" : "")));
        }
        zieheAn(g, n);
        svg.appendChild(g);
      });

      leisteZeichnen();
      fussZeichnen(liste);
    }

    function beschriftung(x, y, txt, klasse) {
      const t = sv("text", { x: x, y: y, class: klasse, "text-anchor": "middle",
                             "dominant-baseline": "central" });
      t.textContent = txt;
      return t;
    }

    /* ------------------------------------------------------------ Ziehen */
    function svgPunkt(ev) {
      const p = svg.createSVGPoint();
      p.x = ev.clientX; p.y = ev.clientY;
      const m = svg.getScreenCTM();
      if (!m) return { x: 0, y: 0 };
      const q = p.matrixTransform(m.inverse());
      return { x: q.x, y: q.y };
    }

    function zieheAn(g, n) {
      g.addEventListener("pointerdown", ev => {
        ev.preventDefault();
        ev.stopPropagation();
        if (verbindModus) { verbindKlick(n); return; }
        auswahl = n.id;
        const geo = G[n.id] || (G[n.id] = { x: n.x, y: n.y });
        const start = { p: svgPunkt(ev), x: geo.x, y: geo.y };
        let gezogen = false;

        /* Die Zuhörer hängen am Fenster, nicht am Knoten: der Knoten wird
           beim Neuzeichnen ersetzt, das Fenster nicht.                  */
        const bewegen = e2 => {
          const p = svgPunkt(e2);
          const dx = p.x - start.p.x, dy = p.y - start.p.y;
          if (!gezogen && Math.abs(dx) + Math.abs(dy) < 3) return;
          if (!gezogen) { gezogen = true; merken(); }
          geo.x = raster ? Math.round((start.x + dx) / 10) * 10 : start.x + dx;
          geo.y = raster ? Math.round((start.y + dy) / 10) * 10 : start.y + dy;
          zeichne();
        };
        const ende = () => {
          window.removeEventListener("pointermove", bewegen);
          window.removeEventListener("pointerup", ende);
          window.removeEventListener("pointercancel", ende);
          if (gezogen) geaendert(); else zeichne();
        };
        window.addEventListener("pointermove", bewegen);
        window.addEventListener("pointerup", ende);
        window.addEventListener("pointercancel", ende);
        zeichne();
      });
      g.addEventListener("dblclick", ev => { ev.stopPropagation(); umbenennen(n); });
    }

    /* ------------------------------------------------------- Verbinden -- */
    function verbindKlick(n) {
      /* Der Index der ersten Raute ist 0 — mit „if (!verbindRaute)" war das
         dasselbe wie „keine Raute gewählt", und die erste Beziehung ließ
         sich nie verbinden. Deshalb ausdrücklich gegen null prüfen.     */
      if (verbindRaute === null || verbindRaute === undefined) {
        if (n.typ !== "bez") { melde("Zuerst die Raute anklicken, dann die zwei Entitäten."); return; }
        verbindRaute = n.j; melde("Jetzt die erste Entität anklicken."); zeichne(); return;
      }
      if (n.typ !== "ent") { melde("Jetzt eine Entität anklicken."); return; }
      const b = daten.bez[verbindRaute];
      merken();
      if (!putz(b.von)) { b.von = entName(n.i); melde("Und jetzt die zweite Entität."); }
      else if (!putz(b.nach)) { b.nach = entName(n.i); verbindModus = false; verbindRaute = null; melde(""); }
      else { b.von = entName(n.i); b.nach = ""; melde("Neu begonnen — jetzt die zweite Entität."); }
      raus();
    }

    let meldung = "";
    function melde(t) { meldung = t; leisteZeichnen(); }

    /* -------------------------------------------------------- Umbenennen */
    function umbenennen(n) {
      const alt = n.name === "?" ? "" : n.name;
      const neu = window.prompt(
        n.typ === "ent" ? "Name der Entität:" :
        n.typ === "bez" ? "Name der Beziehung (Verb):" : "Name des Attributs:", alt);
      if (neu == null) return;
      const wert = putz(neu);
      merken();
      if (n.typ === "ent") {
        if (n.fest) { melde("Diese Entität ist vorgegeben und behält ihren Namen."); return; }
        const vorher = entName(n.i);
        daten.ent[n.i].name = wert;
        /* Beziehungen zeigen über den Namen auf die Entität — mitziehen,
           sonst hängt die Linie nach dem Umbenennen in der Luft.        */
        daten.bez.forEach(b => {
          if (putz(b.von).toLowerCase() === vorher.toLowerCase()) b.von = wert;
          if (putz(b.nach).toLowerCase() === vorher.toLowerCase()) b.nach = wert;
        });
      } else if (n.typ === "bez") {
        daten.bez[n.j].name = wert;
      } else {
        aendereAttr(n, a => { a.name = wert; });
      }
      raus();
    }

    function aendereAttr(n, tun) {
      if (n.besitzer[0] === "e") {
        const e = daten.ent[n.i];
        const liste = attrsVon(e);
        if (!liste[n.k]) return;
        tun(liste[n.k], liste);
        attrsNach(e, liste.filter(a => putz(a.name)));
      } else {
        const b = daten.bez[n.j];
        const liste = bezAttrs(b);
        if (!liste[n.k]) return;
        tun(liste[n.k], liste);
        bezAttrsNach(b, liste.filter(a => putz(a.name)));
      }
    }

    /* ----------------------------------------------------------- Anlegen */
    /* Eine leere Zeile wird wiederverwendet statt eine zweite anzulegen —
       sonst wüchse die Tabelle bei jedem Klick um eine Leerzeile.       */
    function freierEnt() {
      const i = daten.ent.findIndex(e => !putz(e.name) && !putz(e.pk) && !putz(e.attr));
      if (i >= 0) return i;
      daten.ent.push({ name: "", pk: "", attr: "" });
      return daten.ent.length - 1;
    }
    function freierBez() {
      const j = daten.bez.findIndex(b => !putz(b.von) && !putz(b.nach) && !putz(b.name));
      if (j >= 0) return j;
      daten.bez.push({ von: "", nach: "", name: "", kard: "", attr: "" });
      return daten.bez.length - 1;
    }

    function neueEntitaet() {
      merken();
      const i = freierEnt();
      const zahl = daten.ent.filter(e => putz(e.name)).length + 1;
      daten.ent[i] = { name: "Entität " + zahl, pk: "", attr: "" };
      G["e" + i] = { x: 140 + (i % 4) * SP, y: YE + Math.floor(i / 4) * 210 };
      auswahl = "e" + i;
      raus();
    }
    function neueBeziehung() {
      merken();
      const j = freierBez();
      daten.bez[j] = { von: "", nach: "", name: "Beziehung", kard: "1:n", attr: "" };
      G["b" + j] = { x: 240 + j * 190, y: YE + 180 };
      auswahl = "b" + j;
      verbindModus = true; verbindRaute = j;
      melde("Raute gesetzt — jetzt die erste Entität anklicken.");
      raus();
    }
    function neuesAttribut() {
      if (!auswahl) { melde("Erst einen Kasten oder eine Raute auswählen."); return; }
      const id = auswahl.split("#")[0];
      merken();
      if (id[0] === "e") {
        const i = +id.slice(1);
        const liste = attrsVon(daten.ent[i]);
        liste.push({ name: "Attribut", pk: false });
        attrsNach(daten.ent[i], liste);
        auswahl = id + "#" + (liste.length - 1);
      } else {
        const j = +id.slice(1);
        const liste = bezAttrs(daten.bez[j]);
        liste.push({ name: "Attribut" });
        bezAttrsNach(daten.bez[j], liste);
        auswahl = id + "#" + (liste.length - 1);
      }
      raus();
    }
    function loeschen() {
      if (!auswahl) return;
      const liste = knoten();
      const n = holen(liste, auswahl);
      if (!n) { auswahl = null; return; }
      merken();
      if (n.typ === "attr") {
        aendereAttr(n, (a, l) => { l.splice(n.k, 1); });
        if (n.besitzer[0] === "e") attrsNach(daten.ent[n.i], attrsVon(daten.ent[n.i]).filter((_, k) => k !== n.k));
      } else if (n.typ === "ent") {
        if (n.fest) { melde("Vorgegebene Entitäten bleiben stehen."); return; }
        const name = entName(n.i);
        daten.ent.splice(n.i, 1);
        daten.bez.forEach(b => {
          if (putz(b.von).toLowerCase() === name.toLowerCase()) b.von = "";
          if (putz(b.nach).toLowerCase() === name.toLowerCase()) b.nach = "";
        });
        versetzeGeo("e", n.i);
      } else {
        daten.bez.splice(n.j, 1);
        versetzeGeo("b", n.j);
      }
      auswahl = null;
      raus();
    }
    /* Nach dem Löschen rutschen die Indizes — die gespeicherten Orte müssen
       mitrutschen, sonst springt plötzlich alles.                        */
    function versetzeGeo(praefix, ab) {
      const neu = {};
      Object.keys(G).forEach(k => {
        if (k.indexOf("__") === 0) { neu[k] = G[k]; return; }
        if (k[0] !== praefix) { neu[k] = G[k]; return; }
        const m = k.match(/^([eb])(\d+)(#\d+)?$/);
        if (!m) return;
        const i = +m[2];
        if (i === ab) return;                       /* fällt weg */
        neu[m[1] + (i > ab ? i - 1 : i) + (m[3] || "")] = G[k];
      });
      Object.keys(G).forEach(k => delete G[k]);
      Object.assign(G, neu);
    }

    /* ------------------------------------------------------------ Leiste */
    function leisteZeichnen() {
      leiste.innerHTML = "";
      const knopf = (txt, tun, klasse, titel) => {
        const b = el("button", "ec-k" + (klasse ? " " + klasse : ""), txt);
        b.type = "button";
        if (titel) b.title = titel;
        b.onclick = tun;
        leiste.appendChild(b);
        return b;
      };
      knopf("+ Entität", neueEntitaet, "ec-prim", "Neues Rechteck");
      knopf("+ Beziehung", neueBeziehung, "ec-prim", "Neue Raute — danach die beiden Entitäten anklicken");
      knopf("+ Attribut", neuesAttribut, null, "Hängt ein Attribut an den ausgewählten Kasten oder die ausgewählte Raute");
      knopf(verbindModus ? "Verbinden … (Abbruch)" : "Verbinden",
        () => { verbindModus = !verbindModus; verbindRaute = null;
                melde(verbindModus ? "Raute anklicken, dann die zwei Entitäten." : ""); zeichne(); },
        verbindModus ? "ec-an" : null,
        "Raute mit zwei Entitäten verbinden");
      knopf("Löschen", loeschen, null, "Ausgewählten Knoten entfernen (Entf)");
      knopf("↶", zurueck, null, "Rückgängig (Strg+Z)");
      knopf(raster ? "Raster an" : "Raster aus",
        () => { raster = !raster; G.__raster = raster; zeichne(); geaendert(); },
        raster ? "ec-an" : null, "Beim Ziehen auf 10 px einrasten");

      if (meldung) leiste.appendChild(el("span", "ec-meldung", meldung));
    }

    /* -------------------------------------------------------------- Fuß */
    /* Was mit dem ausgewählten Knoten geht: Schlüssel setzen, Kardinalität
       wählen. Das gehört nicht auf die Fläche, sondern darunter.        */
    function fussZeichnen(liste) {
      fuss.innerHTML = "";
      const n = auswahl ? holen(liste, auswahl) : null;
      if (!n) {
        fuss.appendChild(el("span", "ec-hilfe",
          "Knoten anfassen und ziehen · Doppelklick benennt um · " +
          "Auswahl zeigt hier ihre Einstellungen"));
        return;
      }
      fuss.appendChild(el("span", "ec-was",
        (n.typ === "ent" ? "Entität" : n.typ === "bez" ? "Beziehung" : "Attribut") + ": " + n.name));

      const um = el("button", "ec-k", "umbenennen");
      um.type = "button"; um.onclick = () => umbenennen(n);
      fuss.appendChild(um);

      if (n.typ === "attr" && n.besitzer[0] === "e") {
        const s = el("button", "ec-k" + (n.pk ? " ec-an" : ""), n.pk ? "Primärschlüssel ✓" : "als Primärschlüssel");
        s.type = "button";
        s.title = "Unterstrichen gezeichnet — genau das verlangt die Aufgabe";
        s.onclick = () => { merken(); aendereAttr(n, a => { a.pk = !a.pk; }); raus(); };
        fuss.appendChild(s);
      }

      if (n.typ === "bez") {
        const b = daten.bez[n.j];
        const teile = putz(b.kard).split(":");
        fuss.appendChild(el("span", "ec-hilfe", "Kardinalität:"));
        [0, 1].forEach(seite => {
          const s = el("select", "ec-kard");
          KARD.forEach(o => { const op = document.createElement("option");
                              op.value = o; op.textContent = o; s.appendChild(op); });
          s.value = teile[seite] || (seite === 0 ? "1" : "n");
          s.setAttribute("aria-label", seite === 0 ? "Kardinalität bei " + (b.von || "links")
                                                   : "Kardinalität bei " + (b.nach || "rechts"));
          s.onchange = () => {
            merken();
            const t = putz(daten.bez[n.j].kard).split(":");
            t[seite] = s.value;
            daten.bez[n.j].kard = (t[0] || "1") + ":" + (t[1] || "n");
            raus();
          };
          fuss.appendChild(s);
          if (seite === 0) fuss.appendChild(el("span", "ec-doppel", ":"));
        });
        fuss.appendChild(el("span", "ec-hilfe",
          "links " + (putz(b.von) || "—") + ", rechts " + (putz(b.nach) || "—")));
      }
    }

    /* ------------------------------------------------------- Tastatur -- */
    function taste(ev) {
      if (!wurzel.isConnected || wurzel.offsetParent === null) return;
      const ziel = ev.target;
      if (ziel && /input|textarea|select/i.test(ziel.tagName)) return;
      if (ev.key === "Delete" || ev.key === "Backspace") {
        if (!auswahl) return;
        ev.preventDefault(); loeschen();
      } else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z") {
        ev.preventDefault(); zurueck();
      } else if (ev.key === "Escape") {
        auswahl = null; verbindModus = false; verbindRaute = null; melde(""); zeichne();
      } else if (ev.key.toLowerCase() === "e") { neueEntitaet(); }
      else if (ev.key.toLowerCase() === "b") { neueBeziehung(); }
      else if (ev.key.toLowerCase() === "a") { neuesAttribut(); }
    }
    document.addEventListener("keydown", taste);

    /* Klick ins Leere hebt die Auswahl auf */
    flaeche.addEventListener("pointerdown", ev => {
      if (ev.target.closest && ev.target.closest(".ec-knoten")) return;
      auswahl = null; zeichne();
    });

    zeichne();
    return wurzel;
  }

  return { bau, attrsVon, attrsNach };
})();
