/* ============================================================================
   gen/fehleranalyse.js — Fehler durchgehen: einer nach dem anderen
   ----------------------------------------------------------------------------
   Im Fehlerjournal stand jeder Fehler als Zeile mit Kürzeln („du: 12 ·
   richtig: 1,2“), sechs Knöpfen und einem Hinweis — auf dem Handy war das
   nicht zu lesen, und die eigentliche Frage blieb offen: WAS genau war an
   meiner Antwort falsch, und was hätte dastehen müssen?

   Hier bekommt jeder Fehler einen eigenen Bildschirm:

     1. die ganze Aufgabe
     2. je Feld: „Du“ ↔ „Richtig“ mit ✓ / ✗
        Fehlt      = gehört noch hinein
        Weg damit  = falsch angekreuzt / zu viel
        Passt      = das war schon richtig
     3. die ganze Musterlösung
     4. Sitzt ✓ · Nochmal morgen · Weiter →

   Quellen (alle Stellen, an denen Punkte verloren gingen und eine Antwort
   gespeichert ist): Prognose-Prüfungen und Azubi-Navigator (gen/azubi.js),
   die echten IHK-Prüfungen (eigene Bewertung unter voller Punktzahl) und der
   Generator (gen/fehlerjournal.js). Die Kennungen sind dieselben wie in
   „Fehler wiederholen“ (gen/wiederholen.js): ihk:…, az:…, gen:….

   Speicher: ihk2:analyse — { k: { id: { s: "sitzt"|"morgen", f: "JJJJ-MM-TT", t } } }
             ihk2:analyse:ui — Filter (bleibt auf dem Gerät)
   ========================================================================== */
"use strict";

(function (root) {
  const hatDom = typeof document !== "undefined" && typeof document.createElement === "function";
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  const SK = "ihk2:analyse";
  const SK_UI = "ihk2:analyse:ui";
  const lies = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const schreib = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };

  let S = Object.assign({ k: {} }, lies(SK, {}));
  if (!S.k || typeof S.k !== "object") S.k = {};
  const sichern = () => schreib(SK, S);

  /* ------------------------------------------------------------ Datum --- */
  const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const heuteIso = jetzt => iso(jetzt || new Date());
  function morgenIso(jetzt) {
    const W = root.GENWIEDER;
    if (W && W.plusTage) { try { return W.plusTage(1, jetzt); } catch (e) { } }
    const d = new Date(jetzt || new Date()); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 1);
    return iso(d);
  }

  /* ---------------------------------------------------------- Helfer --- */
  const ENT = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", shy: "", ndash: "–", mdash: "—", bdquo: "„", ldquo: "“", rdquo: "”", hellip: "…", euro: "€", auml: "ä", ouml: "ö", uuml: "ü", Auml: "Ä", Ouml: "Ö", Uuml: "Ü", szlig: "ß" };
  /** HTML → eine Zeile Klartext (für Beschriftungen) */
  function klar(html) {
    return String(html == null ? "" : html)
      .replace(/<br\s*\/?>/gi, " ").replace(/<\/(p|div|li|tr|h\d)>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)))
      .replace(/&([a-z]+);/gi, (m, n) => (n in ENT ? ENT[n] : m))
      .replace(/\s+/g, " ").trim();
  }
  const zahl = n => {
    const G = root.GEN;
    if (G && G.fmt && G.fmt.kurz) return G.fmt.kurz(n);
    return String(Math.round(Number(n || 0) * 100) / 100).replace(".", ",");
  };
  /** Sollwert lesbar: Geld immer mit zwei Stellen, große Zahlen mit Tausenderpunkt */
  function sollZahl(n, f) {
    const G = root.GEN;
    if (!G || !G.fmt || n == null || !isFinite(n)) return zahl(n);
    if (/€|eur/i.test((f && f.einheit) || "")) return G.fmt.zahl(n, 2);
    const g = Math.round(n * 1000) / 1000;
    return Number.isInteger(g) ? G.fmt.zahl(g, 0) : G.fmt.kurz(g);
  }
  const normS = s => String(s || "").toLowerCase().replace(/[^a-z0-9äöüß]+/g, " ").trim();

  /** Kommt der Begriff in der Antwort vor? Tolerant (Synonyme, Tippfehler) über den Generator-Abgleich. */
  function trifft(antwort, begriff) {
    const G = root.GEN;
    if (G && G.enthaelt) { try { return !!G.enthaelt(String(antwort || ""), String(begriff || "")); } catch (e) { } }
    const n = normS(begriff), a = normS(antwort);
    if (!n) return false;
    return a.indexOf(n.length > 7 ? n.slice(0, n.length - 2) : n) >= 0;
  }

  /** Status aus einer Liste von Unterzeilen */
  function sammelStatus(sub) {
    if (!sub.length || sub.every(s => s.leer)) return "leer";
    const ok = sub.filter(s => s.ok).length;
    return ok === sub.length ? "richtig" : (ok ? "teil" : "falsch");
  }

  /* ======================================================================
     Zeilen je Quelle — reine Funktionen (tests/fehleranalyse.test.js)
     Eine Zeile: { label, status, be?, punkte?, du, richtig, passt[], fehlt[],
                   weg[], hinweis, info, sub[{label, du, richtig, ok, leer}],
                   mono, frei }
     status: richtig | teil | falsch | leer | offen (selbst vergleichen) | info
     ====================================================================== */
  function zeile(o) {
    return Object.assign({ label: "", status: "offen", du: "", richtig: "", passt: [], fehlt: [], weg: [], hinweis: "", info: "", sub: null, mono: false, frei: false }, o);
  }

  /** Generator-Aufgabe: `erg` aus GEN.pruefeAufgabe, `ein` = Eingaben je Feldnummer */
  function zeilenGen(a, erg, ein) {
    ein = ein || {};
    const out = [];
    (a.felder || []).forEach(f => {
      const r = ((erg && erg.felder) || []).find(x => x.nr === f.nr) || { status: "leer", punkte: 0, gefunden: [], fehlt: [], text: "" };
      const v = ein[f.nr];
      const s = v == null ? "" : (typeof v === "string" ? v.trim() : v);
      const z = zeile({ label: f.label || "", be: f.be, punkte: r.punkte, status: r.status || "leer", hinweis: r.text || "" });

      if (f.typ === "zahl") {
        z.du = s ? s + (f.einheit && !/[a-zA-Z€%$]\s*$/.test(s) ? " " + f.einheit : "") : "";
        z.richtig = sollZahl(f.loesung, f) + (f.einheit ? " " + f.einheit : "");
      } else if (f.typ === "auswahl") {
        z.du = s === "" ? "" : String(s);
        z.richtig = String(f.loesung);
      } else if (f.typ === "mehrfachwahl") {
        const gew = Array.isArray(v) ? v.map(String) : [];
        const soll = (f.loesung || []).map(String);
        z.du = gew.join(" · ");
        z.richtig = soll.join(" · ");
        z.passt = gew.filter(x => soll.indexOf(x) >= 0);
        z.fehlt = soll.filter(x => gew.indexOf(x) < 0);
        z.weg = gew.filter(x => soll.indexOf(x) < 0);
      } else if (f.typ === "aussagen") {
        const gew = v || {};
        const wort = w => (w === "w" || w === true) ? "richtig" : ((w === "f" || w === false) ? "falsch" : "");
        z.sub = (f.aussagen || []).map((x, i) => {
          const du = wort(gew[i]);
          return { label: x.text || x.t || "", du, richtig: x.wahr ? "richtig" : "falsch", ok: du !== "" && (du === "richtig") === !!x.wahr, leer: du === "" };
        });
      } else if (f.typ === "zuordnung") {
        const gew = v || {};
        z.sub = (f.paare || []).map((p, i) => ({
          label: String(p[0]), du: gew[i] ? String(gew[i]) : "", richtig: String(p[1]),
          ok: !!gew[i] && String(gew[i]) === String(p[1]), leer: !gew[i]
        }));
      } else if (f.typ === "raster") {
        const gew = v || {};
        const sub = [];
        (f.zeilen || []).forEach((zl, zi) => {
          const kopf = (zl.zellen || []).find(c => !c.eingabe && c.t != null && String(c.t).trim());
          (zl.zellen || []).forEach((c, ci) => {
            if (!c.eingabe) return;
            const k = zi + "-" + ci;
            const du = String(gew[k] == null ? "" : gew[k]).trim();
            const sp = f.kopf && f.kopf[ci] ? String(f.kopf[ci]) : "";
            const lab = (kopf ? String(kopf.t) : "Zeile " + (zi + 1)) + (sp ? " · " + sp : "");
            const soll = c.text != null ? (Array.isArray(c.text) ? c.text[0] : c.text) : sollZahl(c.loesung, c) + (c.einheit ? " " + c.einheit : "");
            const st = r.zellen ? r.zellen[k] : null;
            sub.push({ label: lab, du, richtig: String(soll), ok: st === "richtig", leer: !du });
          });
        });
        z.sub = sub;
      } else if (f.typ === "rechenweg") {
        z.du = typeof s === "string" ? s : "";
        /* leer und 0 BE: die Zwischenwerte stehen ohnehin in der Musterlösung */
        if (!z.du) return;
        z.mono = true;
        const soll = (f.soll || []).map(x => x.roh);
        const fehlt = ((r.weg && r.weg.fehlt) || r.fehlt || []).map(String);
        z.richtig = soll.join(" → ");
        if (z.du) {
          z.passt = soll.filter(x => fehlt.indexOf(x) < 0);
          z.fehlt = fehlt;
          z.info = "Zwischenwerte der Musterlösung";
        }
      } else if (f.typ === "knoten") {
        const zl = Array.isArray(v) ? v.filter(x => x && String(x.name || "").trim()) : [];
        z.du = zl.map(x => x.name + (x.typ ? " (" + x.typ + ")" : "") + (x.nach ? " → " + x.nach : "")).join("\n");
        z.passt = (r.gefunden || []).map(String);
        z.fehlt = (r.fehlt || []).map(String);
        z.info = "Knoten der Musterlösung";
      } else if (f.typ === "modell") {
        const zl = Array.isArray(v) ? v.filter(x => x && Object.keys(x).some(k => String(x[k] || "").trim())) : [];
        const sp = f.spalten || [];
        z.du = zl.map(x => sp.map(c => String(x[c.key] || "").trim()).filter(Boolean).join(" | ")).join("\n");
        z.passt = (r.gefunden || []).map(String);
        z.fehlt = (r.fehlt || []).map(String);
        z.info = "Einträge der Musterlösung";
      } else if (f.typ === "flussbild") {
        const w = v && typeof v === "object" ? Object.keys(v).map(k => String(v[k] || "").trim()).filter(Boolean) : [];
        z.du = w.join(" · ");
        z.richtig = "siehe Diagramm in der Musterlösung";
      } else {
        /* text / liste */
        z.du = typeof s === "string" ? s : "";
        const erw = f.erwartet || [];
        const noetig = Math.max(1, f.noetig || erw.length);
        const alle = erw.map(e => (Array.isArray(e) ? e[0] : e));
        z.richtig = alle.join(" · ");
        if (noetig < alle.length) z.richtigLabel = "Richtig (" + noetig + " davon)";
        z.passt = (r.gefunden || []).map(String);
        /* Bei „2 von 5 nennen“ fehlt nichts mehr, sobald zwei getroffen sind —
           vorher fehlen nicht alle drei übrigen, sondern nur noch so viele */
        z.fehlt = z.passt.length >= noetig ? [] : (r.fehlt || []).map(String);
        if (z.fehlt.length && noetig < alle.length) z.fehltLabel = "Noch " + (noetig - z.passt.length) + ", z. B.";
        z.frei = true;
      }
      if (z.sub) z.status = r.status && r.status !== "leer" ? r.status : sammelStatus(z.sub);
      out.push(z);
    });
    return out;
  }

  /** Azubi-/Prognose-Teilaufgabe: `t` = Teil, `a` = Antworten (z.a[t.id]) */
  function zeilenAzubi(t, a, A) {
    A = A || root.GENAZUBI;
    a = a || {};
    const E = t.eingabe || {};
    const w = k => (a[k] == null ? "" : String(a[k]).trim());
    const richtigOk = (f, v) => { try { return !!(A && A.feldRichtig && A.feldRichtig(f, v)); } catch (e) { return false; } };
    const soll = f => (f.soll || []).slice(0, 3).join(" / ") + (f.einheit ? " " + f.einheit : "");
    const mitE = (v, f) => (v && f.einheit && v.toLowerCase().slice(-f.einheit.length) !== f.einheit.toLowerCase() ? v + " " + f.einheit : v);
    const out = [];

    if (E.typ === "raster") {
      const Z = E.zellen || [], sp = E.spalten || 1, zn = E.zeilen || Math.ceil(Z.length / sp);
      const zelle = (r, c) => Z[r * sp + c];
      const txt = (r, c) => { const y = zelle(r, c); return y && !y.f ? klar(y.h) : ""; };
      /* Kopfzeilen: alle Zeilen ohne Eingabefeld über der ersten Feldzeile.
         Verbundene Zellen („Angebot 1“ über „Punkte | gewichtet“) stehen nur
         in der linken Spalte — dann gilt der Text links daneben.           */
      let ersteFeldzeile = 0;
      while (ersteFeldzeile < zn && ![...Array(sp).keys()].some(c => { const y = zelle(ersteFeldzeile, c); return y && y.f; })) ersteFeldzeile++;
      const spaltenKopf = c => {
        const teile = [];
        for (let r = 0; r < ersteFeldzeile; r++) {
          let t = txt(r, c);
          if (!t && c > 1) t = txt(r, c - 1);
          if (t && /^[\d.,]+$/.test(t) && c > 0 && txt(r, 0)) t = txt(r, 0) + " " + t;
          if (t && teile.indexOf(t) < 0) teile.push(t);
        }
        return teile.join(" ");
      };
      const sub = [];
      for (let r = 0; r < zn; r++) {
        let zlab = "";
        for (let c = 0; c < sp; c++) { const y = zelle(r, c); if (y && !y.f && klar(y.h)) { zlab = klar(y.h); break; } }
        for (let c = 0; c < sp; c++) {
          const x = zelle(r, c);
          if (!x || !x.f) continue;
          const kopf = spaltenKopf(c);
          const v = w("f" + x.f.id);
          sub.push({ label: (zlab || "Zeile " + (r + 1)) + (kopf && kopf !== zlab ? " · " + kopf : ""),
                     du: mitE(v, x.f), richtig: soll(x.f), ok: richtigOk(x.f, v), leer: !v });
        }
      }
      out.push(zeile({ label: "Tabelle", status: sammelStatus(sub), sub }));
    } else if (E.typ === "zuordnung") {
      const opt = n => { if (!n) return ""; const x = (E.optionen || [])[Number(n) - 1]; return n + (x ? " – " + klar(x) : ""); };
      const sub = (E.zeilen || []).map(zl => {
        const v = w("z" + zl.id);
        return { label: klar(zl.h), du: opt(v), richtig: opt(zl.soll), ok: !!v && String(v) === String(zl.soll), leer: !v };
      });
      out.push(zeile({ label: klar(E.ftitel) || "Zuordnung", status: sammelStatus(sub), sub }));
    } else if (E.typ === "wahl") {
      const sub = (E.zeilen || []).map(zl => {
        const v = a["w" + zl.id];
        const hat = v != null && v !== "";
        return { label: klar(zl.h), du: hat ? klar((zl.optionen || [])[Number(v)]) : "", richtig: klar((zl.optionen || [])[zl.soll]),
                 ok: hat && Number(v) === Number(zl.soll), leer: !hat };
      });
      out.push(zeile({ label: klar(E.ftitel) || "Auswahl", status: sammelStatus(sub), sub }));
    } else if (E.typ === "mehrfach") {
      const gew = Array.isArray(a.m) ? a.m.map(Number) : [];
      const S0 = (E.soll || []).map(Number);
      const txt = i => klar((E.optionen || [])[i - 1]) || String(i);
      const z = zeile({
        label: "Ankreuzen", du: gew.map(txt).join(" · "), richtig: S0.map(txt).join(" · "),
        passt: gew.filter(i => S0.indexOf(i) >= 0).map(txt),
        fehlt: S0.filter(i => gew.indexOf(i) < 0).map(txt),
        weg: gew.filter(i => S0.indexOf(i) < 0).map(txt)
      });
      z.status = !gew.length ? "leer" : (!z.fehlt.length && !z.weg.length ? "richtig" : (z.passt.length ? "teil" : "falsch"));
      out.push(z);
    } else {
      (E.zeilen || []).forEach(zl => {
        const label = klar(zl.h).replace(/:\s*$/, "") || "Antwort";
        const fe = zl.felder || [];
        fe.forEach((f, j) => {
          const v = w("f" + f.id);
          const ok = richtigOk(f, v);
          out.push(zeile({ label: label + (fe.length > 1 ? " (" + (j + 1) + ")" : ""), status: !v ? "leer" : (ok ? "richtig" : "falsch"),
                           du: mitE(v, f), richtig: soll(f) }));
        });
        if (zl.frei) {
          const v = w("t" + zl.frei);
          out.push(zeile({ label, status: v ? "offen" : "leer", du: v, frei: true }));
        }
      });
      if (w("rw")) out.push(zeile({ label: "Rechenweg", status: "offen", du: w("rw"), mono: true, frei: true }));
    }
    return out;
  }

  /**
   * Freitext gegen die Musterlösung: welche Begriffe stehen drin, welche fehlen?
   * Begriffe, die schon in der Aufgabe stehen, zählen nicht — die abzuschreiben
   * beweist nichts. Dazu die Warnungen des Kurzchecks (Begründung fehlt, zu
   * wenige Punkte genannt …) als Hinweis.
   */
  function abgleich(frage, antwort, loesung, begriffe) {
    const P = root.GENPRUEFEN;
    let liste = (begriffe && begriffe.length) ? begriffe.slice() : (P && P.stichworte ? P.stichworte(loesung, 14) : []);
    const fn = " " + normS(frage) + " ";
    const gesehen = new Set();
    liste = liste.filter(b => {
      const n = normS(b);
      if (!n || gesehen.has(n)) return false;
      gesehen.add(n);
      return fn.indexOf(" " + n + " ") < 0;
    });
    const passt = [], fehlt = [];
    liste.forEach(b => (trifft(antwort, b) ? passt : fehlt).push(b));
    let hinweis = "";
    if (P && P.analyse) {
      try {
        hinweis = P.analyse({ frage, antwort, loesung, mitLoesung: false }).hinweise
          .filter(h => h.art === "warn").map(h => h.text).join(" ");
      } catch (e) { }
    }
    return zeile({
      label: "Abgleich mit der Musterlösung", status: "info", passt, fehlt: fehlt.slice(0, 8), hinweis,
      info: "Begriffe aus der Musterlösung — ein Wortvergleich, keine Bewertung."
    });
  }

  /* ======================================================================
     Einsammeln
     ====================================================================== */
  const ARTEN = {
    prognose: { name: "Prognose", reihe: 1 },
    ihk: { name: "IHK-Prüfungen", reihe: 2 },
    azubi: { name: "Azubi", reihe: 3 },
    gen: { name: "Generator", reihe: 4 }
  };

  function sammeln() {
    const out = [];
    let kand = [];
    try { kand = root.GENWIEDER && root.GENWIEDER.kandidaten ? root.GENWIEDER.kandidaten() : []; } catch (e) { kand = []; }
    const A = root.GENAZUBI;
    const sc = (typeof SCORES !== "undefined" && SCORES) ? SCORES : {};
    kand.forEach(x => {
      if (x.quelle === "ihk") {
        const it = x.it, ex = it.exam || {}, m = ex.meta || {};
        out.push({ id: x.id, quelle: "ihk", art: "ihk", ref: it, titel: x.titel, wo: x.wo, verlust: x.verlust,
                   erreicht: sc[it.k], max: it.maxPoints || 0,
                   gruppe: { key: "ihk:" + ex.examId, name: "IHK " + [m.season, m.year].filter(Boolean).join(" ") } });
      } else if (x.quelle === "azubi") {
        const m = A && A.modul ? A.modul(x.mid) : null;
        if (!m) return;
        const t = A.teileVon(m).find(y => y.id === x.tid);
        const z = A.zustand(m.id);
        const art = m.virtuell ? "prognose" : "azubi";
        out.push({ id: x.id, quelle: "azubi", art, ref: { mid: x.mid, tid: x.tid }, titel: x.titel, wo: x.wo, verlust: x.verlust,
                   erreicht: z.p[x.tid], max: (t && t.punkte) || 0, leer: x.leer,
                   gruppe: { key: "az:" + m.id, name: m.virtuell ? "Prognose-Prüfung " + m.nr : "Azubi · " + (m.kurz || m.titel || m.id) } });
      }
    });
    /* Generator: alle Einträge — auch die abgehakten (die stehen unter „sitzt“) */
    try {
      const F = root.GENFEHLER;
      if (F) F.liste().forEach(e => {
        if (e.quelle !== "gen" || !e.vorlageId) return;
        out.push({ id: "gen:" + e.schluessel, quelle: "gen", art: "gen", ref: e, titel: e.titel || "Generator-Aufgabe",
                   wo: "Generator" + (e.thema ? " · " + e.thema : ""), verlust: Math.max(0.5, (e.be || 0) - (e.erreicht || 0)),
                   erreicht: e.erreicht || 0, max: e.be || 0, erledigt: !!e.erledigt,
                   gruppe: { key: "gen", name: "Generator" } });
      });
    } catch (e) { console.error("Fehler durchgehen/Generator:", e); }
    return ordnen(out);
  }

  /** Gruppen in fester Reihenfolge (Prognose, IHK, Azubi, Generator), darin wie gesammelt */
  function ordnen(items) {
    const erst = {};
    items.forEach((x, i) => { x._i = i; if (!(x.gruppe.key in erst)) erst[x.gruppe.key] = i; });
    return items.slice().sort((a, b) =>
      (ARTEN[a.art].reihe - ARTEN[b.art].reihe) || (erst[a.gruppe.key] - erst[b.gruppe.key]) || (a._i - b._i));
  }

  /** offen | sitzt | morgen */
  function statusVon(x, heute) {
    const st = S.k[x.id];
    if (st && st.s === "sitzt") return "sitzt";
    if (x.erledigt && !(st && st.s === "morgen")) return "sitzt";
    if (st && st.s === "morgen" && st.f > (heute || heuteIso())) return "morgen";
    return "offen";
  }

  function setzen(x, wert) {
    const F = root.GENFEHLER;
    if (wert === "offen") delete S.k[x.id];
    else if (wert === "sitzt") S.k[x.id] = { s: "sitzt", t: Date.now() };
    else if (wert === "morgen") S.k[x.id] = { s: "morgen", f: morgenIso(), t: Date.now() };
    sichern();
    /* Fehlerjournal mitziehen: „sitzt“ = abgehakt */
    try {
      if (F && F.abhaken) {
        if (x.quelle === "gen") F.abhaken(x.ref.schluessel, wert === "sitzt");
        if (x.quelle === "ihk") F.abhaken("p|" + x.ref.k, wert === "sitzt");
      }
      if (x.quelle === "gen") x.erledigt = wert === "sitzt";
    } catch (e) { }
  }

  function zaehlen(items, heute) {
    const z = { offen: 0, sitzt: 0, morgen: 0, verlust: 0 };
    items.forEach(x => { const s = statusVon(x, heute); z[s]++; if (s === "offen") z.verlust += x.verlust || 0; });
    z.verlust = Math.round(z.verlust * 10) / 10;
    return z;
  }

  /* ======================================================================
     Details je Quelle (braucht die Seite: Aufgabentext als DOM)
     ====================================================================== */
  function pruefeStill(a, ein) {
    const G = root.GEN, F = root.GENFEHLER;
    const tu = () => G.pruefeAufgabe(a, ein || {});
    return F && F.still ? F.still(tu) : tu();
  }

  /** Eingaben und Selbstwertung zu einer Generator-Aufgabe finden */
  function genEingaben(e, a) {
    let ein = e.eingaben && typeof e.eingaben === "object" ? e.eingaben : null;
    let woher = ein ? "journal" : "";
    const selbst = {};
    const bl = lies("ihk2:gen:blaetter", []);
    (Array.isArray(bl) ? bl : []).some(b => (b.aufgaben || []).some((y, i) => {
      if (!y || y.vorlageId !== a.vorlageId || ((y.saat >>> 0) !== (a.saat >>> 0))) return false;
      Object.keys(b.selbst || {}).forEach(k => {
        const p = k.split(":");
        if (Number(p[0]) === i && selbst[p[1]] == null) selbst[p[1]] = b.selbst[k];
      });
      const an = (b.antworten || {})[i];
      if (!ein && an && Object.keys(an).length) { ein = an; woher = "blatt"; }
      return !!ein;
    }));
    return { eingaben: ein || {}, selbst, woher: woher || "keine" };
  }

  function detailGen(x) {
    const G = root.GEN, e = x.ref;
    const saat = e.saat != null ? e.saat : Number(String(e.schluessel).split("|")[2]);
    let a = null;
    try { a = G.erzeuge(e.vorlageId, saat); } catch (err) { a = null; }
    if (!a) return { fehler: "Diese Aufgabe lässt sich nicht mehr aufbauen (Vorlage „" + e.vorlageId + "“ fehlt)." };
    const q = genEingaben(e, a);
    const erg = pruefeStill(a, q.eingaben);
    erg.felder.forEach(r => {
      const p = q.selbst[r.nr];
      if (p == null) return;
      r.punkte = p;
      r.status = p >= (r.be || 0) - 0.001 ? "richtig" : (p > 0 ? "teil" : "falsch");
      r.text = "selbst gewertet: " + zahl(p) + " von " + zahl(r.be) + " BE";
    });
    const zeilen = zeilenGen(a, erg, q.eingaben);
    return { a, erg, zeilen, woher: q.woher, alt: e.meine || "" };
  }

  function antwortIhk(it) {
    const A = (typeof ANSWERS !== "undefined" && ANSWERS) ? ANSWERS : {};
    const zeilen = [];
    if (it.felder && it.felder.length) {
      it.felder.forEach((f, i) => zeilen.push(zeile({ label: f.label || ("Feld " + (i + 1)), be: f.maxPoints, du: String(A[it.k + "#" + i] || "").trim(), frei: true })));
      const frei = String(A[it.k] || "").trim();
      if (frei) zeilen.push(zeile({ label: "Nebenrechnung / Ergänzung", du: frei, frei: true, mono: true }));
    } else {
      zeilen.push(zeile({ label: "Deine Antwort", du: String(A[it.k] || "").trim(), frei: true }));
    }
    zeilen.forEach(z => { z.status = z.du ? "offen" : "leer"; });
    return zeilen;
  }

  function detailIhk(x) {
    const it = x.ref;
    const zeilen = antwortIhk(it);
    const alles = zeilen.map(z => z.du).filter(Boolean).join("\n");
    const loesung = ((it.solution || {}).text || "").trim();
    const frage = [it.groupIntro, it.prompt].filter(Boolean).join("\n");
    if (alles && loesung) {
      const pr = it.pruefung || {};
      let begriffe = (pr.begriffe || []).slice();
      if (typeof begriffZaehlt === "function") begriffe = begriffe.filter(b => begriffZaehlt(b, [it.prompt, it.groupIntro, it.situation].filter(Boolean).join(" ")));
      const z = abgleich(frage, alles, loesung, begriffe.length ? begriffe : null);
      /* Zahlen der Lösungsseite: welche stehen in der Antwort? */
      const zahlen = (pr.zahlen || []).filter(n => !/\b(punkte?|be|bewertungseinheit)\b/i.test(n.text || ""));
      if (zahlen.length) {
        const G = root.GEN;
        const meine = typeof zahlenAus === "function" ? zahlenAus(alles) : (G && G.leseZahlen ? G.leseZahlen(alles) : []);
        const schon = new Set();
        zahlen.forEach(n => {
          if (schon.has(n.wert)) return; schon.add(n.wert);
          const da = meine.some(v => Math.abs(v - n.wert) < Math.max(0.01, Math.abs(n.wert) * 0.005));
          (da ? z.passt : z.fehlt).push(n.text);
        });
        z.fehlt = z.fehlt.slice(0, 10);
      }
      zeilen.push(z);
    }
    return { zeilen, loesung };
  }

  function detailAzubi(x) {
    const A = root.GENAZUBI;
    const v = A && A.ansicht ? A.ansicht(x.ref.mid, x.ref.tid) : null;
    if (!v) return { fehler: "Das Azubi-Paket ist auf diesem Gerät nicht geladen — auf dem Gerät öffnen, auf dem es liegt." };
    const z = A.zustand(x.ref.mid);
    const a = z.a[x.ref.tid] || {};
    const zeilen = zeilenAzubi(v.t, a, A);
    const frei = zeilen.filter(y => y.frei && y.du).map(y => y.du).join("\n");
    if (frei && v.t.loesung) {
      const md = h => (A.htmlZuMd ? A.htmlZuMd(h) : klar(h));
      zeilen.push(abgleich(md(v.t.text), frei, md(v.t.loesung)));
    }
    return { v, zeilen, a };
  }

  /* ======================================================================
     Oberfläche
     ====================================================================== */
  let VIEW = "liste";               /* liste | karte | ende */
  let ITEMS = [];
  let LAUF = null;                  /* { ids:[], i, zaehl:{sitzt, morgen, weiter} } */
  let UI = Object.assign({ filter: "alle" }, lies(SK_UI, {}));
  let herkunft = "scStart";

  const QNAME = { prognose: "Prognose", ihk: "IHK-Prüfung", azubi: "Azubi", gen: "Generator" };
  const ICON = { richtig: "✓", teil: "◐", falsch: "✗", leer: "○", offen: "✎", info: "i" };
  const fmtP = n => String(Math.round((n || 0) * 10) / 10).replace(".", ",");

  function seite() {
    let s = $("scAnalyse");
    if (s) return s;
    s = el("div", "seite fa-seite"); s.id = "scAnalyse"; s.hidden = true;
    const start = $("scStart");
    if (start && start.parentNode) start.parentNode.insertBefore(s, start.nextSibling);
    else document.body.appendChild(s);
    s.addEventListener("click", ev => {
      const img = ev.target.closest && ev.target.closest("img.fa-bild");
      if (img && typeof root.zeigeLupe === "function") root.zeigeLupe(img.src);
    });
    return s;
  }

  function zeigen() {
    const s = seite();
    const vorher = ["scBogen", "scAuswertung", "scKatalog", "scAzubi", "scWieder", "scRadar", "scGen"].find(id => $(id) && !$(id).hidden) || "scStart";
    if (vorher !== "scAnalyse") herkunft = vorher;
    document.querySelectorAll("div.seite[id^='sc'], #scBogen").forEach(e => { if (e.id !== "scAnalyse") e.hidden = true; });
    s.hidden = false;
    const f = $("fuss"); if (f) f.hidden = true;
    const kt = $("kopfTitel"); if (kt) kt.hidden = false;
    if ($("kTitel")) $("kTitel").textContent = "Fehler durchgehen";
    if ($("kEyebrow")) $("kEyebrow").textContent = "einer nach dem anderen";
    if (root.GENZURUECK) {
      try { root.GENZURUECK.hoeher && root.GENZURUECK.hoeher("scAnalyse", "scStart"); } catch (e) { }
      try { root.GENZURUECK.knopfPflegen(); } catch (e) { }
    }
    try {
      if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: herkunft }, "");
      if (history.state.seite !== "scAnalyse") history.pushState({ ihk: 1, seite: "scAnalyse" }, "", location.hash || "");
    } catch (e) { }
  }

  /** Öffnen. opt: { filter, id } — id öffnet direkt diesen Fehler */
  function oeffnen(opt) {
    opt = opt || {};
    const los = () => {
      ITEMS = sammeln();
      if (opt.filter) { UI.filter = opt.filter; schreib(SK_UI, UI); }
      zeigen();
      if (opt.id) {
        const x = ITEMS.find(y => y.id === opt.id);
        if (x) { laufStarten(x.id); return; }
        if (root.toast) root.toast("Dieser Fehler ist erledigt — die Aufgabe hat inzwischen volle Punkte.");
      }
      VIEW = "liste"; zeichnen(); root.scrollTo(0, 0);
    };
    const A = root.GENAZUBI;
    if (A && A.laden) A.laden().then(los, los); else los();
  }

  const gefiltert = () => ITEMS.filter(x => UI.filter === "alle" || x.art === UI.filter);

  function laufStarten(startId) {
    const h = heuteIso();
    const offen = gefiltert().filter(x => statusVon(x, h) === "offen").map(x => x.id);
    let ids = offen, i = 0;
    if (startId) {
      i = offen.indexOf(startId);
      if (i < 0) { ids = [startId].concat(offen); i = 0; }
    }
    LAUF = { ids, i, zaehl: { sitzt: 0, morgen: 0, weiter: 0 } };
    VIEW = ids.length ? "karte" : "ende";
    try {
      if (history.state && history.state.seite === "scAnalyse" && !history.state.an)
        history.pushState({ ihk: 1, seite: "scAnalyse", an: "karte" }, "", location.hash || "");
    } catch (e) { }
    zeichnen(); root.scrollTo(0, 0);
  }

  function zurListe() {
    if (history.state && history.state.an === "karte") { history.back(); return; }
    ITEMS = sammeln();
    VIEW = "liste"; zeichnen(); root.scrollTo(0, 0);
  }

  function zeichnen() {
    const s = seite();
    s.innerHTML = "";
    const box = el("div", "fa-wrap");
    s.appendChild(box);
    if (VIEW === "karte" && LAUF && LAUF.i < LAUF.ids.length) karteZeichnen(box);
    else if (VIEW === "karte" || VIEW === "ende") endeZeichnen(box);
    else listeZeichnen(box);
  }

  /* ------------------------------------------------------------- Liste -- */
  function listeZeichnen(box) {
    const h = heuteIso();
    const L = gefiltert();
    const z = zaehlen(L, h);
    const kopf = el("div", "fa-karte fa-kopfkarte");
    kopf.appendChild(el("h2", null, "Fehler durchgehen"));
    kopf.appendChild(el("p", "fa-sub", "Jeder Fehler einzeln: die Aufgabe, deine Antwort, was richtig ist und was fehlt. " +
      "Dann entscheidest du: sitzt — oder morgen noch einmal."));
    const fakten = el("div", "fa-fakten");
    [[z.offen, "offen", z.offen ? "rot" : ""], [z.sitzt, "sitzen", z.sitzt ? "gruen" : ""], [z.morgen, "morgen wieder", ""],
     ["−" + fmtP(z.verlust), "Punkte offen", ""]].forEach(([n, t, c]) => {
      const f = el("div", "fa-fakt" + (c ? " " + c : "")); f.appendChild(el("b", null, String(n))); f.appendChild(el("span", null, t)); fakten.appendChild(f);
    });
    kopf.appendChild(fakten);

    /* Filter */
    const chips = el("div", "fa-filter");
    const anz = { alle: ITEMS.length };
    ITEMS.forEach(x => { anz[x.art] = (anz[x.art] || 0) + 1; });
    [["alle", "Alle"]].concat(Object.keys(ARTEN).map(k => [k, ARTEN[k].name])).forEach(([k, t]) => {
      if (k !== "alle" && !anz[k]) return;
      const b = el("button", "fa-chip" + (UI.filter === k ? " an" : ""), t + " " + (anz[k] || 0));
      b.type = "button";
      b.onclick = () => { UI.filter = k; schreib(SK_UI, UI); zeichnen(); };
      chips.appendChild(b);
    });
    kopf.appendChild(chips);

    const st = el("div", "fa-steuer");
    const los = el("button", "btn primary fa-los", z.offen ? "Los: " + z.offen + " Fehler durchgehen" : "Alles durch");
    los.type = "button"; los.disabled = !z.offen;
    los.onclick = () => laufStarten();
    st.appendChild(los);
    kopf.appendChild(st);
    if (z.offen) kopf.appendChild(el("p", "fa-klein", "≈ 2–3 Minuten je Fehler. Du kannst jederzeit aufhören — was du entschieden hast, bleibt gespeichert."));
    box.appendChild(kopf);

    if (!ITEMS.length) {
      const k = el("div", "fa-karte");
      k.appendChild(el("p", "fa-sub", "Noch keine Fehler mit gespeicherter Antwort. Sobald du in einer Prognose-Prüfung, im Azubi-Navigator, " +
        "in einer echten Prüfung oder auf einem Arbeitsblatt Punkte verlierst, stehen sie hier."));
      box.appendChild(k);
      return;
    }

    /* Gruppen */
    const gruppen = [];
    L.forEach(x => {
      let g = gruppen.find(y => y.key === x.gruppe.key);
      if (!g) { g = { key: x.gruppe.key, name: x.gruppe.name, art: x.art, items: [] }; gruppen.push(g); }
      g.items.push(x);
    });
    gruppen.forEach(g => {
      const gz = zaehlen(g.items, h);
      const d = el("details", "fa-gruppe");
      d.open = gz.offen > 0;
      const sum = el("summary");
      sum.appendChild(el("span", "fa-g-name", g.name));
      sum.appendChild(el("span", "fa-g-n", gz.offen ? gz.offen + " offen" : (gz.morgen ? gz.morgen + " morgen" : "✓ alles durch")));
      if (gz.verlust) sum.appendChild(el("span", "fa-g-p", "−" + fmtP(gz.verlust) + " P."));
      d.appendChild(sum);
      const ul = el("ul", "fa-liste");
      g.items.forEach(x => {
        const s = statusVon(x, h);
        const li = el("li", "fa-li s-" + s);
        const bt = el("button", "fa-zeile");
        bt.type = "button";
        bt.appendChild(el("span", "fa-punkt", s === "sitzt" ? "✓" : (s === "morgen" ? "↻" : "")));
        const t = el("span", "fa-z-t");
        t.appendChild(el("b", null, x.wo));
        t.appendChild(el("span", null, x.titel));
        bt.appendChild(t);
        bt.appendChild(el("span", "fa-z-r", s === "morgen" ? "morgen" : (s === "sitzt" ? "sitzt" : "−" + fmtP(x.verlust) + " P.")));
        bt.onclick = () => laufStarten(x.id);
        li.appendChild(bt);
        ul.appendChild(li);
      });
      d.appendChild(ul);
      box.appendChild(d);
    });
  }

  /* ------------------------------------------------------------- Karte -- */
  function leiste(box) {
    const l = el("div", "fa-leiste");
    const zur = el("button", "fa-mini", "← Liste");
    zur.type = "button"; zur.onclick = zurListe;
    l.appendChild(zur);
    const n = LAUF.ids.length;
    l.appendChild(el("span", "fa-zahl", Math.min(LAUF.i + 1, n) + " / " + n));
    const bar = el("span", "fa-bar"); const i = el("i"); i.style.width = (n ? LAUF.i / n * 100 : 0) + "%"; bar.appendChild(i);
    l.appendChild(bar);
    const vor = el("button", "fa-mini", "‹");
    vor.type = "button"; vor.title = "Vorheriger Fehler"; vor.setAttribute("aria-label", "Vorheriger Fehler");
    vor.disabled = LAUF.i === 0;
    vor.onclick = () => { LAUF.i = Math.max(0, LAUF.i - 1); zeichnen(); root.scrollTo(0, 0); };
    l.appendChild(vor);
    box.appendChild(l);
  }

  function block(titel, klasse, offen) {
    const d = el("details", "fa-block " + (klasse || ""));
    d.open = offen !== false;
    d.appendChild(el("summary", null, titel));
    const inn = el("div", "fa-block-in");
    d.appendChild(inn);
    return { d, inn };
  }

  function zeileEl(z) {
    const kurz = z.status === "richtig" && !z.sub && !z.fehlt.length && !z.weg.length;
    const d = el("div", "fa-z st-" + z.status + (kurz ? " kurz" : ""));
    const k = el("div", "fa-z-kopf");
    k.appendChild(el("span", "fa-ic", ICON[z.status] || "?"));
    k.appendChild(el("b", "fa-z-label", z.label || "Antwort"));
    if (z.be != null && z.punkte != null) k.appendChild(el("span", "fa-be", zahl(z.punkte) + " / " + zahl(z.be) + " BE"));
    else if (z.be) k.appendChild(el("span", "fa-be", zahl(z.be) + " BE"));
    d.appendChild(k);

    if (kurz) {
      if (z.du) k.appendChild(el("span", "fa-kurzwert", z.du));
      return d;
    }
    const paar = (lbl, cls, wert, mono) => {
      const p = el("div", "fa-paar " + cls);
      p.appendChild(el("span", "fa-l", lbl));
      const w = el("span", "fa-w" + (mono ? " mono" : "") + (wert ? "" : " leer"), wert || "— leer —");
      p.appendChild(w);
      d.appendChild(p);
    };
    /* leer gelassen: nur die richtige Antwort, ohne „Du: — leer —“ */
    if (z.status === "leer" && !z.sub) {
      d.classList.add("kurz");
      k.appendChild(el("span", "fa-leer", "leer gelassen"));
      if (z.richtig) paar(z.richtigLabel || "Richtig", "ri", z.richtig, z.mono);
      if (z.hinweis) d.appendChild(el("p", "fa-hin", z.hinweis));
      return d;
    }
    if (!z.sub && z.status !== "info") paar("Du", "du", z.du, z.mono);
    if (!z.sub && z.richtig) paar(z.richtigLabel || "Richtig", "ri", z.richtig, z.mono);
    if (z.info && (z.passt.length || z.fehlt.length)) d.appendChild(el("p", "fa-info", z.info));
    const chips = (lbl, cls, arr) => {
      if (!arr || !arr.length) return;
      const c = el("div", "fa-chips " + cls);
      c.appendChild(el("span", "fa-l", lbl));
      arr.forEach(w => c.appendChild(el("span", "fa-c", w)));
      d.appendChild(c);
    };
    chips(z.fehltLabel || "Fehlt", "fehlt", z.fehlt);
    chips("Weg damit", "weg", z.weg);
    chips("Passt", "passt", z.passt);

    if (z.sub) {
      const falsch = z.sub.filter(s => !s.ok);
      const ok = z.sub.length - falsch.length;
      const ul = el("ul", "fa-subl");
      falsch.forEach(s => {
        const li = el("li", s.leer ? "leer" : "falsch");
        li.appendChild(el("span", "fa-ic", s.leer ? "○" : "✗"));
        const t = el("div", "fa-sub-t");
        t.appendChild(el("span", "fa-sub-l", s.label));
        const w = el("span", "fa-sub-w");
        const du = el("span", "fa-sub-du", "Du: " + (s.du || "leer"));
        const ri = el("span", "fa-sub-ri", "Richtig: " + s.richtig);
        w.append(du, ri);
        t.appendChild(w);
        li.appendChild(t);
        ul.appendChild(li);
      });
      d.appendChild(ul);
      if (ok) d.appendChild(el("p", "fa-sub-ok", "✓ " + ok + (ok === 1 ? " weitere Zeile richtig" : " weitere Zeilen richtig")));
    }
    if (z.hinweis) d.appendChild(el("p", "fa-hin", z.hinweis));
    return d;
  }

  function aufgabeGen(inn, a) {
    if (a.situation) inn.appendChild(el("div", "gsituation", a.situation));
    if (a.code) inn.appendChild(el("pre", "gcode", a.code));
    (a.tabellen || []).forEach(t => {
      const wrap = el("div", "gtab-rollen");
      const tab = el("table", "gdaten");
      if (t.titel) tab.appendChild(el("caption", null, t.titel));
      const thead = el("thead"), trh = el("tr");
      (t.kopf || []).forEach(x => trh.appendChild(el("th", null, x)));
      thead.appendChild(trh); tab.appendChild(thead);
      const tb = el("tbody");
      (t.zeilen || []).forEach(zl => { const tr = el("tr"); zl.forEach(c => tr.appendChild(el("td", null, c))); tb.appendChild(tr); });
      tab.appendChild(tb); wrap.appendChild(tab); inn.appendChild(wrap);
    });
    inn.appendChild(el("div", "gfrage", a.prompt));
    if (a.hinweis) inn.appendChild(el("div", "hinweis", a.hinweis));
  }

  function aufgabeIhk(inn, it) {
    if (it.groupIntro) inn.appendChild(el("p", "fa-intro", it.groupIntro));
    inn.appendChild(el("div", "fa-text", it.prompt || "—"));
    (it.assets || []).slice(0, 4).forEach(a => {
      if (!a || !a.file) return;
      const img = el("img", "fa-bild"); img.src = a.file; img.alt = ""; img.loading = "lazy";
      inn.appendChild(img);
    });
    if (it.pageImage && typeof root.zeigeLupe === "function") {
      const b = el("button", "fa-link", "Ganze Seite ansehen (S. " + (it.sourcePage || "?") + ")");
      b.type = "button"; b.onclick = () => root.zeigeLupe(it.pageImage);
      inn.appendChild(b);
    }
  }

  function originalOeffnen(x) {
    if (x.quelle === "ihk") {
      if (typeof root.oeffnePruefung === "function") {
        root.oeffnePruefung(x.ref.exam);
        if (typeof root.springeZu === "function") setTimeout(() => root.springeZu(x.ref.k), 80);
      }
    } else if (x.quelle === "azubi") {
      root.GENAZUBI && root.GENAZUBI.oeffnen(x.ref.mid, { ziel: x.ref.tid });
    } else if (x.quelle === "gen" && root.GENUI) {
      const e = x.ref;
      root.GENUI.erzeugeBlatt({ liste: [{ vorlageId: e.vorlageId, saat: e.saat != null ? e.saat : Number(String(e.schluessel).split("|")[2]) }],
                                titel: "Nochmal: " + (e.titel || ""), zeit: 1 });
    }
  }

  function claudeKasten(x, det) {
    const P = root.GENPRUEFEN;
    if (!P || !P.kasten) return null;
    const gruppe = { id: "analyse", name: "Fehler durchgehen" };
    try {
      if (x.quelle === "azubi" && det.v) {
        const A = root.GENAZUBI, t = det.v.t;
        if (!det.zeilen.some(z => z.frei)) return null;
        return P.kasten({ klartext: true, frage: A.htmlZuMd(t.text), loesung: A.htmlZuMd(t.loesung), hinweis: A.htmlZuMd(t.hinweis),
                          punkte: t.punkte, gruppe, antwort: () => A.antwortMd(t, det.a) });
      }
      if (x.quelle === "ihk") {
        const it = x.ref;
        const txt = det.zeilen.filter(z => z.status !== "info" && z.du).map(z => (det.zeilen.length > 2 ? z.label + ": " : "") + z.du).join("\n");
        if (!txt) return null;
        return P.kasten({ frage: [it.groupIntro, it.prompt].filter(Boolean).join("\n"), loesung: det.loesung, punkte: it.maxPoints, gruppe, antwort: () => txt });
      }
      if (x.quelle === "gen" && det.a) {
        const a = det.a;
        if (!det.zeilen.some(z => z.frei && z.du)) return null;
        const txt = det.zeilen.filter(z => z.du).map(z => z.label + ": " + z.du).join("\n");
        return P.kasten({ frage: [a.situation, a.prompt].filter(Boolean).join("\n\n"), loesung: a.loesung, punkte: a.maxPoints, gruppe, antwort: () => txt });
      }
    } catch (e) { console.error("Fehler durchgehen/Claude:", e); }
    return null;
  }

  function karteZeichnen(box) {
    leiste(box);
    const id = LAUF.ids[LAUF.i];
    const x = ITEMS.find(y => y.id === id);
    if (!x) { LAUF.ids.splice(LAUF.i, 1); zeichnen(); return; }
    const status = statusVon(x);
    const k = el("article", "fa-karte fa-fehler a-" + x.art);

    const kopf = el("div", "fa-kopf");
    kopf.appendChild(el("span", "fa-quelle a-" + x.art, QNAME[x.art]));
    kopf.appendChild(el("span", "fa-wo", x.wo));
    kopf.appendChild(el("span", "fa-pkt", (x.erreicht == null ? "?" : zahl(x.erreicht)) + " / " + zahl(x.max) + " P."));
    k.appendChild(kopf);
    k.appendChild(el("h3", "fa-titel", x.titel));
    if (status !== "offen") {
      const n = el("p", "fa-stand", status === "sitzt" ? "✓ Hast du als „sitzt“ markiert." : "↻ Steht für morgen wieder an.");
      const auf = el("button", "fa-link", "wieder offen");
      auf.type = "button";
      auf.onclick = () => { setzen(x, "offen"); zeichnen(); };
      n.appendChild(auf);
      k.appendChild(n);
    }

    let det = null;
    try {
      det = x.quelle === "gen" ? detailGen(x) : (x.quelle === "ihk" ? detailIhk(x) : detailAzubi(x));
    } catch (e) {
      console.error("Fehler durchgehen:", e);
      det = { fehler: "Diese Aufgabe konnte nicht aufgebaut werden." };
    }

    if (det.fehler) {
      k.appendChild(el("p", "fa-hin", det.fehler));
    } else {
      /* 1. Aufgabe */
      if (x.quelle === "azubi" && det.v.situation) {
        const sit = block(det.v.m.art === "pruefung" ? "Ausgangssituation" : "Einleitung", "fa-sit", false);
        sit.inn.appendChild(det.v.situation);
        k.appendChild(sit.d);
      }
      /* Wer die Aufgabe zuklappt, will sie meist auch bei den nächsten zu haben */
      const auf = block("Aufgabe", "fa-auf", !UI.aufZu);
      auf.d.addEventListener("toggle", () => { UI.aufZu = !auf.d.open; schreib(SK_UI, UI); });
      if (x.quelle === "gen") aufgabeGen(auf.inn, det.a);
      else if (x.quelle === "ihk") aufgabeIhk(auf.inn, x.ref);
      else auf.inn.appendChild(det.v.frage);
      k.appendChild(auf.d);

      /* 2. Vergleich */
      const vg = el("section", "fa-vergleich");
      vg.appendChild(el("h4", null, "Deine Antwort ↔ richtig"));
      if (x.quelle === "gen" && det.woher === "keine") {
        vg.appendChild(el("p", "fa-hin", "Deine Eingaben zu dieser Aufgabe sind nicht mehr gespeichert (nur die letzten 40 Blätter bleiben). " +
          (det.alt ? "Im Journal stand: „" + det.alt + "“." : "")));
      }
      if (x.leer) vg.appendChild(el("p", "fa-hin", "Damals leer gelassen."));
      const zl = el("div", "fa-zeilen");
      det.zeilen.forEach(z => zl.appendChild(zeileEl(z)));
      vg.appendChild(zl);
      if (det.zeilen.some(z => z.status === "offen" && z.du))
        vg.appendChild(el("p", "fa-info", "✎ = Text, den die App nicht selbst bewerten kann: vergleiche ihn mit der Musterlösung darunter."));
      k.appendChild(vg);

      /* 3. Lösung */
      const lo = el("section", "fa-loesung");
      lo.appendChild(el("h4", null, "So ist es richtig"));
      if (x.quelle === "gen") {
        const a = det.a;
        const fb = (a.felder || []).find(f => f.typ === "flussbild");
        if (fb && root.GENFLUSS) { try { lo.appendChild(root.GENFLUSS.bau(fb, {}, () => { }, true)); } catch (e) { } }
        lo.appendChild(el("div", "fa-text", a.loesung || ""));
        if (a.merksatz) {
          const m = el("div", "fa-merk"); m.appendChild(el("b", null, "Merksatz: ")); m.appendChild(document.createTextNode(a.merksatz));
          lo.appendChild(m);
        }
      } else if (x.quelle === "ihk") {
        const it = x.ref;
        lo.appendChild(el("div", "fa-text" + ((it.solution || {}).mono ? " mono" : ""), det.loesung || "Zu dieser Aufgabe gibt es keine Musterlösung im Text."));
        if (it.solution && it.solution.image && typeof root.zeigeLupe === "function") {
          const b = el("button", "fa-link", "Lösungsseite ansehen (S. " + (it.solution.solutionPage || "?") + ")");
          b.type = "button"; b.onclick = () => root.zeigeLupe(it.solution.image);
          lo.appendChild(b);
        }
      } else {
        lo.appendChild(det.v.loesung);
      }
      k.appendChild(lo);

      /* Warum daneben? (nur Generator — fließt ins Fehlerjournal) */
      if (x.quelle === "gen" && root.GENFEHLER && root.GENFEHLER.GRUENDE) {
        const F = root.GENFEHLER;
        const gw = el("div", "fa-grund");
        gw.appendChild(el("span", "fa-l", "Warum daneben?"));
        const chips = el("div", "fa-grund-chips");
        F.GRUENDE.forEach(g => {
          const b = el("button", "fa-chip klein" + (x.ref.grund === g.key ? " an" : ""), g.kurz);
          b.type = "button"; b.title = g.lang;
          b.onclick = () => {
            x.ref.grund = x.ref.grund === g.key ? null : g.key;
            if (F.grundSetzen) F.grundSetzen(x.ref.schluessel, x.ref.grund);
            zeichnen();
          };
          chips.appendChild(b);
        });
        gw.appendChild(chips);
        const g = x.ref.grund && F.GRUENDE.find(y => y.key === x.ref.grund);
        if (g) gw.appendChild(el("p", "fa-rat", g.rat));
        k.appendChild(gw);
      }

      /* Mit Claude prüfen — zugeklappt */
      const kl = claudeKasten(x, det);
      if (kl) {
        const b = block("Mit Claude prüfen lassen", "fa-claude", false);
        b.inn.appendChild(kl);
        k.appendChild(b.d);
      }
    }

    const links = el("div", "fa-links");
    const orig = el("button", "fa-link", x.quelle === "gen" ? "Dieselbe Aufgabe neu rechnen" : "Im Original öffnen");
    orig.type = "button"; orig.onclick = () => originalOeffnen(x);
    links.appendChild(orig);
    if (x.quelle === "gen" && root.GENUI) {
      const typ = el("button", "fa-link", "Diesen Typ mit neuen Zahlen üben");
      typ.type = "button";
      typ.onclick = () => root.GENUI.erzeugeBlatt({ ids: [x.ref.vorlageId], anzahl: 3, titel: (x.ref.titel || "") + " — gezielt" });
      links.appendChild(typ);
    }
    k.appendChild(links);
    box.appendChild(k);

    /* Entscheiden — bleibt unten am Bildschirm stehen */
    const akt = el("div", "fa-aktion");
    [["sitzt", "Sitzt ✓", "ok"], ["morgen", "Nochmal morgen", "morgen"], ["weiter", "Weiter →", "weiter"]].forEach(([w, t, c]) => {
      const b = el("button", "fa-ak " + c, t);
      b.type = "button";
      b.onclick = () => entscheiden(x, w);
      akt.appendChild(b);
    });
    box.appendChild(akt);
  }

  function entscheiden(x, wert) {
    if (wert === "sitzt" || wert === "morgen") setzen(x, wert);
    LAUF.zaehl[wert] = (LAUF.zaehl[wert] || 0) + 1;
    LAUF.i++;
    if (LAUF.i >= LAUF.ids.length) VIEW = "ende";
    zeichnen();
    root.scrollTo(0, 0);
    blockLeise();
  }

  function endeZeichnen(box) {
    const z = LAUF ? LAUF.zaehl : { sitzt: 0, morgen: 0, weiter: 0 };
    const k = el("div", "fa-karte fa-ende");
    k.appendChild(el("h2", null, LAUF && LAUF.ids.length ? "Durch!" : "Nichts offen"));
    const f = el("div", "fa-fakten");
    [[z.sitzt || 0, "sitzen", "gruen"], [z.morgen || 0, "morgen wieder", ""], [z.weiter || 0, "übersprungen", ""]].forEach(([n, t, c]) => {
      const d = el("div", "fa-fakt" + (c ? " " + c : "")); d.appendChild(el("b", null, String(n))); d.appendChild(el("span", null, t)); f.appendChild(d);
    });
    k.appendChild(f);
    ITEMS = sammeln();
    const rest = zaehlen(gefiltert()).offen;
    k.appendChild(el("p", "fa-sub", rest ? "Noch " + rest + " offen (übersprungene zählen mit)." :
      "In dieser Auswahl ist alles entschieden. „Nochmal morgen“ kommt morgen wieder in die Liste."));
    const st = el("div", "fa-steuer");
    if (rest) { const b = el("button", "btn primary", "Weitermachen (" + rest + ")"); b.type = "button"; b.onclick = () => laufStarten(); st.appendChild(b); }
    const li = el("button", "btn", "Zur Liste"); li.type = "button"; li.onclick = zurListe; st.appendChild(li);
    k.appendChild(st);
    box.appendChild(k);
  }

  /* -------------------------------------------------------- Startseite --- */
  function startBlock() {
    if (!hatDom) return;
    const s = $("scStart");
    if (!s) return;
    let b = $("analyseBox");
    if (!b) { b = el("div", "abschnitt"); b.id = "analyseBox"; s.appendChild(b); }
    b.innerHTML = "";
    b.appendChild(el("h2", null, "Fehler durchgehen"));
    const L = sammeln();
    const z = zaehlen(L);
    b.appendChild(el("p", null, "Einer nach dem anderen: Aufgabe, deine Antwort, was richtig ist, was fehlt — dann „sitzt“ oder „morgen nochmal“. " +
      "Aus Prognose-Prüfungen, Azubi-Navigator, echten Prüfungen und Generator."));
    const reihe = el("div", "fa-fakten");
    [[z.offen, "offen", z.offen ? "rot" : ""], [z.sitzt, "sitzen", z.sitzt ? "gruen" : ""], ["−" + fmtP(z.verlust), "Punkte offen", ""]].forEach(([n, t, c]) => {
      const f = el("div", "fa-fakt" + (c ? " " + c : "")); f.appendChild(el("b", null, String(n))); f.appendChild(el("span", null, t)); reihe.appendChild(f);
    });
    b.appendChild(reihe);
    const st = el("div", "steuer");
    const los = el("button", "btn primary", z.offen ? "Durchgehen (" + z.offen + ")" : "Liste ansehen");
    los.type = "button"; los.onclick = () => oeffnen();
    st.appendChild(los);
    b.appendChild(st);
    const d = document.querySelector('details.st-block[data-key="analyse"] .st-zahl');
    if (d) d.textContent = z.offen ? z.offen + " offen" : (L.length ? "alles durch" : "");
  }
  let leiseT = null;
  function blockLeise() { clearTimeout(leiseT); leiseT = setTimeout(() => { try { startBlock(); } catch (e) { } }, 50); }

  /* -------------------------------------------------------- Einhängen --- */
  function einhaengen() {
    seite();
    const altSchirm = root.schirm;
    if (typeof altSchirm === "function" && !altSchirm.__fa) {
      const neu = function (name) {
        if (name === "scAnalyse") { oeffnen(); return; }
        const s = $("scAnalyse"); if (s) s.hidden = true;
        return altSchirm.apply(this, arguments);
      };
      neu.__fa = true; root.schirm = neu;
    }
    const altStart = root.renderStart;
    if (typeof altStart === "function" && !altStart.__fa) {
      const neu = function () {
        const r = altStart.apply(this, arguments);
        try { startBlock(); } catch (e) { console.error("Fehler durchgehen:", e); }
        return r;
      };
      neu.__fa = true; root.renderStart = neu;
    }
    if (root.MutationObserver) {
      new MutationObserver(muts => {
        const k = $("scAnalyse");
        if (!k || k.hidden) return;
        for (const m of muts) {
          const z = m.target;
          if (z !== k && z.id && /^sc/.test(z.id) && z.classList && (z.classList.contains("seite") || z.classList.contains("blatt")) && !z.hidden) { k.hidden = true; return; }
        }
      }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
    }
    /* Zurück-Taste zwischen Karte und Liste (gleiche Seite, anderer Zustand) */
    root.addEventListener("popstate", ev => {
      const s = $("scAnalyse");
      if (!s || s.hidden) return;
      const st = ev.state || {};
      if (st.seite !== "scAnalyse") return;
      if (!st.an && VIEW !== "liste") { ITEMS = sammeln(); VIEW = "liste"; zeichnen(); root.scrollTo(0, 0); }
      else if (st.an === "karte" && VIEW === "liste" && LAUF) { VIEW = "karte"; zeichnen(); root.scrollTo(0, 0); }
    });
    try { startBlock(); } catch (e) { console.error("Fehler durchgehen:", e); }
    /* Azubi-Paket kommt später dazu */
    const A = root.GENAZUBI;
    if (A && A.laden) A.laden().then(blockLeise, () => { });
    setTimeout(blockLeise, 900);
  }

  const api = {
    oeffnen, startBlock, sammeln, ordnen, zaehlen, statusVon, setzen,
    zeilenGen, zeilenAzubi, abgleich, klar, genEingaben, morgenIso, sollZahl,
    get S() { return S; }, setzeStand(neu) { S = Object.assign({ k: {} }, neu || {}); sichern(); }
  };
  root.GENANALYSE = api;
  if (typeof module === "object" && module.exports) module.exports = api;
  if (hatDom) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
    else einhaengen();
  }
})(typeof window !== "undefined" ? window : globalThis);
