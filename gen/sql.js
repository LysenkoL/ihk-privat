/* ============================================================================
   gen/sql.js — SQL-Trainer (AP2)
   ----------------------------------------------------------------------------
   Echte Datenbank im Browser (sql.js = SQLite als WebAssembly, MIT-Lizenz,
   vendor/sqljs-1.14.2/). Wird erst geladen, wenn der Trainer geöffnet wird,
   danach liegt sie im Offline-Speicher.

   Jede Ausführung startet mit frischen Daten (gen/sql-daten.js). Geprüft
   wird nicht der Text, sondern das Ergebnis:
     select  gleiche Zeilen und Spalten wie die Musterlösung
             (Spaltenreihenfolge und Aliasnamen egal, Zeilenreihenfolge nur
             bei ORDER BY-Aufgaben)
     dml     alle Tabellen danach wie nach der Musterlösung
     ddl     Tabelle, Spalten, Datentypen, Primär- und Fremdschlüssel
     view    Sicht vorhanden und liefert dasselbe

   Damit IHK-Schreibweisen (MySQL) auch hier laufen: YEAR(), MONTH(), DAY(),
   LEFT(), RIGHT(), UCASE(), LCASE(), DATEDIFF(), NOW(), CURDATE();
   AUTO_INCREMENT wird still entfernt, ALTER TABLE … ADD FOREIGN KEY wird
   nachgebildet (SQLite kann es nicht).

   Fortschritt: ihk2:sql = { v:1, a: { id: { ok, n, t, code, gesehen } }, pos }
   ========================================================================== */
"use strict";

(function (root) {
  const hatDom = typeof document !== "undefined";
  const $ = id => document.getElementById(id);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
  const LIB = "vendor/sqljs-1.14.2/";
  const SK = "ihk2:sql";
  const MAX_ZEILEN = 20000;

  const daten = () => root.GENSQLDATEN || (typeof require === "function" ? require("./sql-daten.js") : null);

  /* ======================================================================
     Laden der Datenbank-Bibliothek
     ====================================================================== */
  let SQL = null, ladeVersprechen = null;
  function setzeSQL(s) { SQL = s; }
  function laden() {
    if (SQL) return Promise.resolve(SQL);
    if (ladeVersprechen) return ladeVersprechen;
    ladeVersprechen = new Promise((ok, nein) => {
      const los = () => root.initSqlJs({ locateFile: f => LIB + f }).then(s => { SQL = s; ok(s); }, nein);
      if (typeof root.initSqlJs === "function") { los(); return; }
      /* Als Datei geöffnet (file://) darf der Browser keine .wasm nachladen —
         dann die reine JavaScript-Fassung (größer, gleiche Funktionen). */
      const s = document.createElement("script");
      s.src = LIB + (location.protocol === "file:" ? "sql-asm.js" : "sql-wasm.js");
      s.onload = los;
      s.onerror = () => nein(new Error("Bibliothek nicht geladen"));
      document.head.appendChild(s);
    }).catch(e => { ladeVersprechen = null; throw e; });
    return ladeVersprechen;
  }

  /* ======================================================================
     Text zerlegen und vorbereiten — reine Funktionen
     ====================================================================== */
  /** SQL-Text in einzelne Anweisungen (Kommentare raus, ; in Texten bleibt). */
  function zerlege(sql) {
    const out = []; let cur = "", q = null;
    const s = String(sql || "");
    for (let i = 0; i < s.length; i++) {
      const c = s[i], n = s[i + 1];
      if (q) { cur += c; if (c === q) { if (n === q) { cur += n; i++; } else q = null; } continue; }
      if (c === "'" || c === '"' || c === "`") { q = c; cur += c; continue; }
      if (c === "-" && n === "-") { const e = s.indexOf("\n", i); i = e < 0 ? s.length : e - 1; cur += " "; continue; }
      if (c === "#") { const e = s.indexOf("\n", i); i = e < 0 ? s.length : e - 1; cur += " "; continue; }
      if (c === "/" && n === "*") { const e = s.indexOf("*/", i + 2); i = e < 0 ? s.length : e + 1; cur += " "; continue; }
      if (c === ";") { if (cur.trim()) out.push(cur.trim()); cur = ""; continue; }
      cur += c;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  const RX_FK = /^\s*ALTER\s+TABLE\s+[`"]?(\w+)[`"]?\s+ADD\s+(?:CONSTRAINT\s+[`"]?\w+[`"]?\s+)?FOREIGN\s+KEY\s*\(\s*[`"]?(\w+)[`"]?\s*\)\s*REFERENCES\s+[`"]?(\w+)[`"]?\s*(?:\(\s*[`"]?(\w+)[`"]?\s*\))?\s*(?:ON\s+(?:DELETE|UPDATE)\s+[\w ]+)?$/i;

  /** MySQL-Eigenheiten angleichen. Rückgabe { sql, fk?, notiz? } */
  function vorbereiten(stmt) {
    const m = RX_FK.exec(stmt);
    if (m) return { sql: null, fk: { tabelle: m[1], von: m[2], zu: m[3], spalte: m[4] || null },
      notiz: "ALTER TABLE … ADD FOREIGN KEY kann SQLite nicht ausführen — hier nachgebildet und mitgewertet." };
    let s = stmt, notiz = null;
    if (/\bAUTO_?INCREMENT\b/i.test(s)) {
      s = s.replace(/\s*\bAUTO_?INCREMENT\b(\s*=\s*\d+)?/gi, "");
      notiz = "AUTO_INCREMENT entfernt — in SQLite zählt INTEGER PRIMARY KEY von selbst hoch.";
    }
    s = s.replace(/\)\s*ENGINE\s*=\s*\w+[^)]*$/i, ")");
    return { sql: s, notiz };
  }

  /* ======================================================================
     Fehlermeldungen auf Deutsch, mit dem typischen Grund
     ====================================================================== */
  function fehlerText(msg, stmt) {
    const m = String(msg || "");
    let r;
    if ((r = /no such table: (?:main\.)?(\S+)/.exec(m))) return "Die Tabelle „" + r[1] + "“ gibt es nicht. Tabellennamen im Schema nachsehen (Tippfehler, Mehrzahl?).";
    if ((r = /no such column: (\S+)/.exec(m))) {
      const w = r[1];
      if (/^[A-ZÄÖÜa-zäöüß]+$/.test(w) && stmt && new RegExp("=\\s*" + w + "\\b").test(stmt))
        return "„" + w + "“ wird als Spaltenname gelesen. Texte gehören in einfache Anführungszeichen: '" + w + "'.";
      return "Die Spalte „" + w + "“ gibt es nicht — oder nicht in den Tabellen hinter FROM/JOIN. Bei a.Spalte muss der Alias a vergeben sein.";
    }
    if ((r = /ambiguous column name: (\S+)/.exec(m))) return "„" + r[1] + "“ steht in mehreren Tabellen. Schreib Tabelle.Spalte oder Alias.Spalte (z. B. k." + r[1].replace(/^.*\./, "") + ").";
    if (/near "TOP"/i.test(m) || /syntax error/.test(m) && /^\s*SELECT\s+(DISTINCT\s+)?TOP\s/i.test(stmt || "")) return "TOP gibt es nur in MS SQL. Hier (und in MySQL): … ORDER BY … LIMIT 3.";
    if (/near "FROM": syntax error/i.test(m)) return "Syntaxfehler vor FROM — oft ein Komma zu viel hinter der letzten Spalte.";
    if (/near "(MODIFY|CHANGE)"/i.test(m) || /near "COLUMN"/i.test(m) && /ALTER\s+COLUMN/i.test(stmt || ""))
      return "Spalten nachträglich ändern (MODIFY / ALTER COLUMN) kann SQLite nicht. In MySQL: ALTER TABLE t MODIFY Spalte Typ; — für diese Übung nicht nötig.";
    if ((r = /near "([^"]+)": syntax error/.exec(m))) return "Syntaxfehler bei „" + r[1] + "“. Häufig: Komma fehlt oder ist zu viel, Schlüsselwort falsch geschrieben, Reihenfolge SELECT – FROM – WHERE – GROUP BY – HAVING – ORDER BY.";
    if (/incomplete input/.test(m)) return "Die Anweisung ist unvollständig — fehlt eine Klammer, ein Anführungszeichen oder ein Teil nach WHERE?";
    if (/misuse of aggregate/.test(m)) return "Aggregatfunktion an falscher Stelle: Bedingungen mit COUNT/SUM/AVG gehören in HAVING (nach GROUP BY), nicht in WHERE.";
    if (/GROUP BY clause is required before HAVING/i.test(m)) return "HAVING ohne GROUP BY — erst gruppieren, dann HAVING.";
    if (/FOREIGN KEY constraint failed/.test(m)) return "Fremdschlüssel verletzt (referentielle Integrität): Es gibt noch Datensätze, die auf diese Zeile verweisen — oder der Wert, auf den du verweist, existiert nicht.";
    if ((r = /UNIQUE constraint failed: (\S+)/.exec(m))) return "Schlüssel doppelt: Ein Datensatz mit diesem Wert in " + r[1] + " existiert schon (Primärschlüssel muss eindeutig sein).";
    if ((r = /NOT NULL constraint failed: (\S+)/.exec(m))) return r[1] + " darf nicht leer sein (NOT NULL).";
    if ((r = /table (\S+) already exists/.exec(m))) return "Die Tabelle " + r[1] + " gibt es schon.";
    if ((r = /(\d+) values for (\d+) columns/.exec(m))) return "Anzahl der Werte (" + r[1] + ") passt nicht zur Anzahl der Spalten (" + r[2] + ").";
    if ((r = /table (\S+) has (\d+) columns but (\d+) values were supplied/.exec(m))) return "Die Tabelle " + r[1] + " hat " + r[2] + " Spalten, du gibst " + r[3] + " Werte an. Spalten in Klammern nennen oder alle Werte angeben.";
    if (/more than one primary key/.test(m)) return "Nur EIN Primärschlüssel je Tabelle. Aus zwei Spalten: am Ende PRIMARY KEY (Spalte1, Spalte2).";
    if ((r = /no such function: (\S+)/.exec(m))) return "Die Funktion " + r[1] + " kennt diese Datenbank nicht.";
    if ((r = /wrong number of arguments to function (\S+)/.exec(m))) return "Falsche Anzahl von Angaben in " + r[1] + "(…).";
    if (/cannot (modify|UPDATE|DELETE|INSERT)/i.test(m) && /view/i.test(m)) return "In eine Sicht (VIEW) kann man hier nicht schreiben — ändere die Tabelle dahinter.";
    if (/no such view/.test(m)) return "Diese Sicht gibt es nicht.";
    if (/duplicate column name: (\S+)/.test(m)) return "Die Spalte gibt es schon: " + /duplicate column name: (\S+)/.exec(m)[1] + ".";
    return m;
  }

  /* ======================================================================
     Stolperfallen, die SQLite durchgehen lässt (Warnungen, kein Fehler)
     ====================================================================== */
  const AGG = /\b(COUNT|SUM|AVG|MIN|MAX|GROUP_CONCAT)\s*\(/i;
  function obenPositionen(s) {
    const U = s.toUpperCase(), pos = {};
    const KW = ["SELECT", "FROM", "WHERE", "GROUP BY", "HAVING", "ORDER BY", "LIMIT", "UNION", "EXCEPT", "INTERSECT"];
    let tiefe = 0, q = null;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) { if (c === q) q = null; continue; }
      if (c === "'" || c === '"') { q = c; continue; }
      if (c === "(") { tiefe++; continue; }
      if (c === ")") { tiefe--; continue; }
      if (tiefe) continue;
      for (const kw of KW) {
        if (pos[kw] == null && U.startsWith(kw, i) && !/\w/.test(U[i - 1] || " ") && !/\w/.test(U[i + kw.length] || " ")) pos[kw] = i;
      }
    }
    return pos;
  }
  function obenTeilen(s) {
    const out = []; let tiefe = 0, q = null, cur = "";
    for (const c of s) {
      if (q) { cur += c; if (c === q) q = null; continue; }
      if (c === "'" || c === '"') { q = c; cur += c; continue; }
      if (c === "(") tiefe++;
      if (c === ")") tiefe--;
      if (c === "," && !tiefe) { out.push(cur.trim()); cur = ""; continue; }
      cur += c;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function gruppenWarnung(stmt) {
    const s = stmt.replace(/\s+/g, " ").trim();
    if (!/^SELECT\b/i.test(s)) return null;
    const p = obenPositionen(s);
    if (p.FROM == null || p.UNION != null || p.EXCEPT != null || p.INTERSECT != null) return null;
    const liste = obenTeilen(s.slice(p.SELECT + 6, p.FROM).replace(/^\s*(DISTINCT|ALL)\b/i, ""));
    const ende = k => Math.min(...["HAVING", "ORDER BY", "LIMIT"].map(x => p[x]).filter(x => x != null && x > k).concat([s.length]));
    const gruppe = p["GROUP BY"] != null ? obenTeilen(s.slice(p["GROUP BY"] + 8, ende(p["GROUP BY"])))
      .map(x => x.replace(/^.*\./, "").replace(/[`"]/g, "").toLowerCase()) : null;
    const mitAgg = liste.some(x => AGG.test(x)) || p.HAVING != null;
    if (!gruppe && !mitAgg) return null;
    const lose = [];
    liste.forEach(x => {
      if (AGG.test(x)) return;
      const ohneAlias = x.replace(/\s+AS\s+[\w"`']+$/i, "").replace(/^([\w.]+)\s+\w+$/, "$1").trim();
      if (!/^(\w+\.)?\w+$/.test(ohneAlias) || /^\d/.test(ohneAlias)) return;
      const name = ohneAlias.replace(/^.*\./, "").toLowerCase();
      if (!gruppe || gruppe.indexOf(name) < 0) lose.push(ohneAlias);
    });
    if (!lose.length) return null;
    return gruppe
      ? lose.join(", ") + " steht im SELECT, aber nicht im GROUP BY. SQLite rechnet trotzdem, in der Prüfung (und in vielen Datenbanken) ist das ein Fehler — mit ins GROUP BY aufnehmen."
      : lose.join(", ") + " steht neben einer Aggregatfunktion, aber es gibt kein GROUP BY. SQLite lässt das durch, in der Prüfung ist es falsch.";
  }

  function warnungen(code, namen) {
    const w = [];
    const teile = zerlege(code);
    const bekannt = new Set((namen || []).map(x => String(x).toLowerCase()));
    teile.forEach(t => {
      const ohneTexte = t.replace(/'(?:[^']|'')*'/g, "''");
      if (/(=|<>|!=)\s*NULL\b/i.test(ohneTexte)) w.push("„= NULL“ ist nie wahr. Mit NULL vergleicht man mit IS NULL bzw. IS NOT NULL.");
      if (/^\s*(UPDATE|DELETE)\b/i.test(t) && !/\bWHERE\b/i.test(ohneTexte)) w.push(/^\s*UPDATE/i.test(t) ? "UPDATE ohne WHERE ändert ALLE Zeilen der Tabelle." : "DELETE ohne WHERE löscht ALLE Zeilen der Tabelle.");
      const dq = t.replace(/'(?:[^']|'')*'/g, "''").match(/"[^"]*"/g) || [];
      if (dq.some(x => !bekannt.has(x.slice(1, -1).toLowerCase())))
        w.push("Texte in \"doppelten\" Anführungszeichen: in Standard-SQL sind das Namen. Texte schreibt man in 'einfache' Anführungszeichen.");
      let m;
      const rxLike = /LIKE\s+'([^'%_]*)'/gi;
      while ((m = rxLike.exec(t))) { w.push("LIKE '" + m[1] + "' ohne % sucht genau diesen Text — gemeint ist meist '%" + m[1] + "%'."); break; }
      if (/\bJOIN\s+[`"]?\w+[`"]?(\s+(AS\s+)?\w+)?\s*($|\bWHERE\b|\bJOIN\b|\bGROUP\b|\bORDER\b|\bLEFT\b|\bINNER\b)/i.test(ohneTexte.replace(/\s+/g, " ") + " ") &&
          !/\b(ON|USING|NATURAL|CROSS)\b/i.test(ohneTexte))
        w.push("JOIN ohne ON: jede Zeile wird mit jeder kombiniert (kartesisches Produkt). Verbindung angeben: JOIN … ON a.Schluessel = b.Schluessel.");
      const g = gruppenWarnung(t);
      if (g) w.push(g);
    });
    return Array.from(new Set(w));
  }

  /* ======================================================================
     Datenbank
     ====================================================================== */
  function funktionen(db) {
    const d = v => v == null ? null : String(v);
    const f = (n, fn) => { try { db.create_function(n, fn); } catch (e) { } };
    f("YEAR", v => d(v) ? parseInt(d(v).slice(0, 4), 10) : null);
    f("MONTH", v => d(v) ? parseInt(d(v).slice(5, 7), 10) : null);
    f("DAY", v => d(v) ? parseInt(d(v).slice(8, 10), 10) : null);
    f("UPPER", v => v == null ? null : String(v).toUpperCase());
    f("LOWER", v => v == null ? null : String(v).toLowerCase());
    f("UCASE", v => v == null ? null : String(v).toUpperCase());
    f("LCASE", v => v == null ? null : String(v).toLowerCase());
    f("LEFT", (v, n) => v == null ? null : String(v).slice(0, Math.max(0, n)));
    f("RIGHT", (v, n) => v == null ? null : (n > 0 ? String(v).slice(-n) : ""));
    f("DATEDIFF", (a, b) => (a == null || b == null) ? null : Math.round((Date.parse(String(a).slice(0, 10)) - Date.parse(String(b).slice(0, 10))) / 864e5));
    const heute = () => { const x = new Date(); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
    f("CURDATE", () => heute());
    f("NOW", () => { const x = new Date(); return heute() + " " + String(x.getHours()).padStart(2, "0") + ":" + String(x.getMinutes()).padStart(2, "0") + ":" + String(x.getSeconds()).padStart(2, "0"); });
  }

  function neueDb(vorher) {
    if (!SQL) throw new Error("SQL noch nicht geladen");
    const db = new SQL.Database();
    funktionen(db);
    db.exec(daten().SCHEMA);
    db.run("PRAGMA foreign_keys = ON");
    if (vorher) db.exec(vorher);
    return db;
  }

  /** Anweisungen nacheinander ausführen; beim ersten Fehler stehen bleiben. */
  function ausfuehren(db, code) {
    const lauf = { schritte: [], fehler: null, letztes: null, fk: [], notizen: [] };
    const teile = zerlege(code);
    if (!teile.length) { lauf.fehler = { text: "Noch keine Anweisung eingegeben.", roh: "" }; return lauf; }
    for (let i = 0; i < teile.length; i++) {
      const v = vorbereiten(teile[i]);
      if (v.notiz) lauf.notizen.push(v.notiz);
      const schritt = { nr: i + 1, sql: teile[i], spalten: [], zeilen: [], geaendert: null, zuViel: false };
      if (v.fk) {
        const t = tabelleFinden(db, v.fk.tabelle, "table");
        if (!t) { lauf.fehler = { nr: i + 1, sql: teile[i], text: "Die Tabelle „" + v.fk.tabelle + "“ gibt es nicht.", roh: "" }; break; }
        if (!spaltenVon(db, t).some(s => s.name.toLowerCase() === v.fk.von.toLowerCase())) {
          lauf.fehler = { nr: i + 1, sql: teile[i], text: "Die Spalte „" + v.fk.von + "“ gibt es in " + t + " nicht — erst mit ALTER TABLE … ADD anlegen.", roh: "" }; break;
        }
        lauf.fk.push(v.fk);
        lauf.schritte.push(schritt);
        continue;
      }
      let st = null;
      try {
        st = db.prepare(v.sql);
        schritt.spalten = st.getColumnNames();
        while (st.step()) {
          if (schritt.zeilen.length >= MAX_ZEILEN) { schritt.zuViel = true; break; }
          schritt.zeilen.push(st.get());
        }
        st.free(); st = null;
        if (/^\s*(INSERT|UPDATE|DELETE|REPLACE)\b/i.test(v.sql)) schritt.geaendert = db.getRowsModified();
      } catch (e) {
        try { if (st) st.free(); } catch (x) { }
        lauf.fehler = { nr: i + 1, sql: teile[i], text: fehlerText(e.message, teile[i]), roh: e.message };
        break;
      }
      lauf.schritte.push(schritt);
      if (schritt.spalten.length) lauf.letztes = schritt;
    }
    return lauf;
  }

  function tabelleFinden(db, name, typ) {
    const r = db.exec("SELECT name FROM sqlite_master WHERE type = '" + typ + "' AND lower(name) = lower(?)".replace("?", "'" + String(name).replace(/'/g, "''") + "'"));
    return r.length && r[0].values.length ? r[0].values[0][0] : null;
  }
  const q = n => '"' + String(n).replace(/"/g, '""') + '"';
  function spaltenVon(db, t) {
    const r = db.exec("PRAGMA table_info(" + q(t) + ")");
    return r.length ? r[0].values.map(v => ({ name: v[1], typ: v[2], notnull: !!v[3], pk: v[5] })) : [];
  }
  function fkVon(db, t) {
    const r = db.exec("PRAGMA foreign_key_list(" + q(t) + ")");
    return r.length ? r[0].values.map(v => ({ von: v[3], zu: v[2], spalte: v[4] })) : [];
  }
  function tabellen(db) {
    const r = db.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    return r.length ? r[0].values.map(v => v[0]) : [];
  }
  function schnappschuss(db) {
    const s = {};
    tabellen(db).forEach(t => {
      const r = db.exec("SELECT * FROM " + q(t));
      s[t] = { spalten: spaltenVon(db, t).map(x => x.name), zeilen: r.length ? r[0].values : [] };
    });
    return s;
  }

  /* ======================================================================
     Vergleichen
     ====================================================================== */
  function normWert(v) {
    if (v == null) return "∅";
    if (typeof v === "number") return String(Math.round(v * 100) / 100);
    if (typeof v === "object") return "[blob]";
    const s = String(v).trim();
    if (/^-?\d+(\.\d+)?$/.test(s) && !/^0\d/.test(s)) return String(Math.round(parseFloat(s) * 100) / 100);
    return s;
  }
  const zeileSchl = z => z.map(normWert).join("\u0001");
  const zeigeZeile = z => z.map(v => v == null ? "NULL" : String(v)).join(" | ");

  function mengenDiff(a, b) {
    const zaehl = {};
    b.forEach(z => { const k = zeileSchl(z); zaehl[k] = (zaehl[k] || 0) + 1; });
    const fehlt = [];
    a.forEach(z => { const k = zeileSchl(z); if (zaehl[k]) zaehl[k]--; else fehlt.push(z); });
    return fehlt;
  }

  /** soll/ist: { spalten, zeilen } — Rückgabe { ok, text, fehlt, zuviel } */
  function vergleiche(soll, ist, ordnung) {
    if (!ist) return { ok: false, text: "Keine Ergebnistabelle — die letzte Anweisung muss ein SELECT sein." };
    const sc = soll.spalten.length, ic = ist.spalten.length;
    const sig = (zeilen, j) => zeilen.map(z => normWert(z[j])).sort().join("\u0001");
    const sSig = soll.spalten.map((_, j) => sig(soll.zeilen, j));
    const iSig = ist.spalten.map((_, k) => sig(ist.zeilen, k));
    const frei = new Set(ist.spalten.map((_, k) => k));
    const karte = sSig.map((s, j) => {
      let k = frei.has(j) && iSig[j] === s ? j : -1;
      if (k < 0) for (const x of frei) if (iSig[x] === s) { k = x; break; }
      if (k >= 0) { frei.delete(k); return k; }
      return null;
    });
    const namen = soll.spalten.join(", ");
    if (karte.every(k => k != null)) {
      const proj = ist.zeilen.map(z => karte.map(k => z[k]));
      const fehlt = mengenDiff(soll.zeilen, proj), zuviel = mengenDiff(proj, soll.zeilen);
      if (!fehlt.length && !zuviel.length) {
        if (ic > sc) return { ok: false, text: "Die Werte stimmen, aber du lieferst " + ic + " Spalten statt " + sc + " (" + namen + "). Die zusätzlichen Spalten weglassen." };
        if (ordnung && proj.some((z, i) => zeileSchl(z) !== zeileSchl(soll.zeilen[i])))
          return { ok: false, text: "Die Zeilen stimmen, aber die Reihenfolge nicht. ORDER BY prüfen (Spalte? ASC oder DESC?)." };
        return { ok: true, text: "Richtig! " + soll.zeilen.length + (soll.zeilen.length === 1 ? " Zeile" : " Zeilen") + " wie in der Musterlösung." };
      }
      return { ok: false, text: "Die Spalten passen, aber einzelne Zeilen nicht.", fehlt: fehlt.slice(0, 3), zuviel: zuviel.slice(0, 3) };
    }
    if (ic < sc) return { ok: false, text: "Es fehlen Spalten: erwartet sind " + sc + " (" + namen + "), du lieferst " + ic + "." };
    const is = ist.zeilen.length, ss = soll.zeilen.length;
    const proj = ist.zeilen.map(z => karte.map((k, j) => z[k != null ? k : j]));
    const fehlt = mengenDiff(soll.zeilen, proj).slice(0, 3), zuviel = mengenDiff(proj, soll.zeilen).slice(0, 3);
    if (is !== ss) {
      const grund = is > ss
        ? (is > ss * 3 && is > 30 ? " Viel zu viele — fehlt eine JOIN-Bedingung (ON) oder das WHERE?" : " Ist die Bedingung zu weit, fehlt ein Filter oder ein GROUP BY?")
        : " Ist die Bedingung zu streng? Sollen auch Zeilen ohne Partner erscheinen (LEFT JOIN)?";
      return { ok: false, text: "Du bekommst " + is + (is === 1 ? " Zeile" : " Zeilen") + ", erwartet sind " + ss + "." + grund, fehlt, zuviel };
    }
    const falsch = karte.map((k, j) => k == null ? soll.spalten[j] : null).filter(Boolean);
    return { ok: false, text: "Die Anzahl der Zeilen stimmt, aber die Werte nicht" + (falsch.length ? " — erwartet wird: " + falsch.join(", ") : "") + ".", fehlt, zuviel };
  }

  function vergleicheStand(soll, ist, start) {
    const alle = Array.from(new Set(Object.keys(soll).concat(Object.keys(ist)))).sort();
    const teile = [];
    alle.forEach(t => {
      const s = soll[t], i = ist[t];
      if (!i) { teile.push({ tabelle: t, text: "Tabelle " + t + " fehlt bei dir (gelöscht?)." }); return; }
      if (!s) { teile.push({ tabelle: t, text: "Tabelle " + t + " gibt es bei dir zusätzlich." }); return; }
      const fehlt = mengenDiff(s.zeilen, i.zeilen), zuviel = mengenDiff(i.zeilen, s.zeilen);
      if (fehlt.length || zuviel.length) {
        const n = Math.max(fehlt.length, zuviel.length);
        teile.push({ tabelle: t, spalten: s.spalten, fehlt: fehlt.slice(0, 2), zuviel: zuviel.slice(0, 2),
          text: t + ": " + n + (n === 1 ? " Zeile weicht" : " Zeilen weichen") + " von der Musterlösung ab" +
            (i.zeilen.length !== s.zeilen.length ? " (" + i.zeilen.length + " statt " + s.zeilen.length + " Zeilen)" : "") + "." });
      }
    });
    if (!teile.length) return { ok: true, text: "Richtig! Die Tabellen sehen genau so aus wie nach der Musterlösung." };
    const unveraendert = start && JSON.stringify(start) === JSON.stringify(ist);
    return { ok: false, text: unveraendert ? "Es hat sich nichts geändert — trifft die WHERE-Bedingung keine Zeile?" : "Noch nicht ganz.", teile };
  }

  function familie(typ) {
    const t = String(typ || "").toUpperCase();
    if (!t) return "ohne";
    if (/INT/.test(t)) return "int";
    if (/CHAR|TEXT|CLOB|STRING/.test(t)) return "text";
    if (/DEC|NUMERIC|NUMBER|MONEY/.test(t)) return "dezimal";
    if (/REAL|FLOA|DOUB/.test(t)) return "gleitkomma";
    if (/DATETIME|TIMESTAMP/.test(t)) return "zeitpunkt";
    if (/DATE/.test(t)) return "datum";
    if (/BOOL/.test(t)) return "bool";
    return "anders";
  }
  const FAM_NAME = { int: "ganze Zahl (INT/INTEGER)", text: "Text (VARCHAR(n))", dezimal: "Dezimalzahl (DECIMAL(p,s))", datum: "Datum (DATE)", bool: "Wahrheitswert (BOOLEAN)" };

  function pruefeAufbau(db, spec, fkExtra) {
    const punkte = [];
    const t = tabelleFinden(db, spec.tabelle, "table");
    if (!t) {
      const v = tabelleFinden(db, spec.tabelle, "view");
      return { ok: false, text: v ? spec.tabelle + " ist eine Sicht, keine Tabelle." : "Die Tabelle " + spec.tabelle + " gibt es noch nicht.", punkte };
    }
    const sp = spaltenVon(db, t);
    const von = {};
    sp.forEach(s => { von[s.name.toLowerCase()] = s; });
    let fehler = 0;
    const gut = x => punkte.push({ ok: true, text: x });
    const schlecht = x => { fehler++; punkte.push({ ok: false, text: x }); };
    const info = x => punkte.push({ info: true, text: x });
    Object.keys(spec.spalten).forEach(n => {
      const s = von[n.toLowerCase()], soll = spec.spalten[n];
      if (!s) { schlecht("Spalte " + n + " fehlt."); return; }
      const f = familie(s.typ);
      if (f === soll) {
        const l = /\(\s*(\d+)/.exec(s.typ || "");
        const L = spec.laenge && spec.laenge[n];
        if (L && soll === "text" && l && +l[1] !== L) schlecht(n + ": " + s.typ + " — verlangt waren " + L + " Zeichen.");
        else if (L && soll === "text" && !l) { info(n + ": ohne Länge — besser VARCHAR(" + L + ")."); gut(n + " " + (s.typ || "")); }
        else gut(n + " " + s.typ);
      } else if (f === "ohne") schlecht(n + ": Datentyp fehlt — erwartet " + FAM_NAME[soll] + ".");
      else if (soll === "dezimal" && f === "gleitkomma") schlecht(n + ": " + s.typ + " rundet ungenau. Für Geldbeträge DECIMAL(8,2).");
      else schlecht(n + ": " + s.typ + " passt nicht — erwartet " + (FAM_NAME[soll] || soll) + ".");
    });
    if (spec.alle !== false) {
      const extra = sp.filter(s => !Object.keys(spec.spalten).some(n => n.toLowerCase() === s.name.toLowerCase()));
      if (extra.length) info("Zusätzliche Spalte(n), nicht verlangt: " + extra.map(s => s.name).join(", ") + ".");
    }
    if (spec.pk) {
      const ist = sp.filter(s => s.pk).sort((a, b) => a.pk - b.pk).map(s => s.name.toLowerCase()).sort();
      const soll = spec.pk.map(x => x.toLowerCase()).sort();
      if (ist.join() === soll.join()) gut("Primärschlüssel: " + spec.pk.join(", "));
      else if (!ist.length) schlecht("Kein Primärschlüssel. Verlangt: " + spec.pk.join(" + ") + (spec.pk.length > 1 ? " → PRIMARY KEY (" + spec.pk.join(", ") + ")" : " → PRIMARY KEY") + ".");
      else schlecht("Primärschlüssel ist " + ist.join(" + ") + ", verlangt ist " + spec.pk.join(" + ") + ".");
    }
    (spec.notnull || []).forEach(n => {
      const s = von[n.toLowerCase()];
      if (s && !s.notnull && !s.pk) schlecht(n + " ist ein Pflichtfeld → NOT NULL fehlt.");
      else if (s) gut(n + " NOT NULL");
    });
    if (spec.fk) {
      const liste = fkVon(db, t).concat((fkExtra || []).filter(f => f.tabelle.toLowerCase() === t.toLowerCase()));
      spec.fk.forEach(([vonSp, zu, zuSp]) => {
        const f = liste.find(x => x.von.toLowerCase() === vonSp.toLowerCase());
        if (!f) { schlecht(vonSp + " ist noch kein Fremdschlüssel → REFERENCES " + zu + "(" + zuSp + ")."); return; }
        if (f.zu.toLowerCase() !== zu.toLowerCase()) { schlecht(vonSp + " verweist auf " + f.zu + ", erwartet " + zu + "."); return; }
        if (!tabelleFinden(db, f.zu, "table")) { schlecht("Die Tabelle " + f.zu + " gibt es nicht."); return; }
        if (f.spalte && f.spalte.toLowerCase() !== zuSp.toLowerCase()) { schlecht(vonSp + " verweist auf " + f.zu + "." + f.spalte + ", erwartet " + zu + "." + zuSp + "."); return; }
        gut(vonSp + " → " + zu + "(" + zuSp + ")");
      });
    }
    return { ok: !fehler, text: fehler ? "Noch nicht ganz — " + fehler + (fehler === 1 ? " Punkt fehlt." : " Punkte fehlen.") : "Richtig! Tabelle, Datentypen und Schlüssel stimmen.", punkte };
  }

  /* ======================================================================
     Bewerten
     ====================================================================== */
  const LOES = {};
  function loesungLauf(a) {
    if (LOES[a.id]) return LOES[a.id];
    const db = neueDb(a.vorher);
    try {
      const lauf = ausfuehren(db, a.loesung);
      const r = { lauf, stand: (a.art === "dml") ? schnappschuss(db) : null, sicht: null };
      if (a.art === "view") { const x = ausfuehren(db, "SELECT * FROM " + q(a.view)); r.sicht = x.letztes; }
      LOES[a.id] = r;
      return r;
    } finally { db.close(); }
  }

  function bewerte(a, code) {
    const db = neueDb(a.vorher);
    try {
      const lauf = ausfuehren(db, code);
      if (lauf.fehler) return { ok: false, lauf, text: "Fehler in Anweisung " + lauf.fehler.nr + ": " + lauf.fehler.text };
      const art = a.art || "select";
      const soll = loesungLauf(a);
      let r;
      if (art === "select") r = vergleiche(soll.lauf.letztes, lauf.letztes, !!a.ordnung);
      else if (art === "dml") {
        const start = (() => { const d = neueDb(a.vorher); try { return schnappschuss(d); } finally { d.close(); } })();
        r = vergleicheStand(soll.stand, schnappschuss(db), start);
      } else if (art === "ddl") r = pruefeAufbau(db, a.ddl, lauf.fk);
      else if (art === "view") {
        const v = tabelleFinden(db, a.view, "view");
        if (!v) r = { ok: false, text: tabelleFinden(db, a.view, "table") ? a.view + " ist eine Tabelle — gefragt ist eine Sicht: CREATE VIEW " + a.view + " AS SELECT …" : "Die Sicht " + a.view + " gibt es noch nicht (Name genau so schreiben)." };
        else {
          const x = ausfuehren(db, "SELECT * FROM " + q(v));
          r = vergleiche(soll.sicht, x.letztes, false);
          if (r.ok) r.text = "Richtig! Die Sicht " + v + " liefert dasselbe wie die Musterlösung.";
        }
      }
      r.lauf = lauf;
      return r;
    } finally { db.close(); }
  }

  /* ======================================================================
     Fortschritt
     ====================================================================== */
  const lies = () => { try { const v = JSON.parse(localStorage.getItem(SK)); return v && typeof v === "object" ? v : null; } catch (e) { return null; } };
  let STAND = null;
  function stand() {
    if (!STAND) STAND = Object.assign({ v: 1, a: {}, pos: null }, hatDom ? lies() || {} : {});
    if (!STAND.a) STAND.a = {};
    return STAND;
  }
  let merkTimer = null;
  function merken(sofort) {
    clearTimeout(merkTimer);
    const los = () => { try { localStorage.setItem(SK, JSON.stringify(stand())); } catch (e) { } };
    if (sofort) los(); else merkTimer = setTimeout(los, 500);
  }
  const eintrag = id => stand().a[id] || (stand().a[id] = {});
  function zahlen() {
    const A = daten().AUFGABEN, S = stand().a;
    const geloest = A.filter(a => S[a.id] && S[a.id].ok).length;
    return { gesamt: A.length, geloest, versucht: A.filter(a => S[a.id] && !S[a.id].ok && (S[a.id].n || S[a.id].code)).length };
  }

  /* ======================================================================
     Oberfläche
     ====================================================================== */
  let UI = { ansicht: "liste", thema: "", id: null, sandkasten: null };
  let herkunft = "scStart";

  function seite() {
    let s = $("scSql");
    if (s) return s;
    s = el("div", "seite sq-seite"); s.id = "scSql"; s.hidden = true;
    const start = $("scStart");
    if (start && start.parentNode) start.parentNode.insertBefore(s, start.nextSibling);
    else document.body.appendChild(s);
    return s;
  }
  function zeigen() {
    const s = seite();
    const vorher = ["scBogen", "scAuswertung", "scKatalog", "scAzubi", "scWieder", "scGlossar", "scKomp", "scSpick"].find(id => $(id) && !$(id).hidden) || "scStart";
    if (vorher !== "scSql") herkunft = vorher;
    document.querySelectorAll("div.seite[id^='sc'], #scBogen").forEach(e => { if (e.id !== "scSql") e.hidden = true; });
    s.hidden = false;
    const f = $("fuss"); if (f) f.hidden = true;
    const kt = $("kopfTitel"); if (kt) kt.hidden = false;
    if ($("kTitel")) $("kTitel").textContent = "SQL-Trainer";
    if ($("kEyebrow")) $("kEyebrow").textContent = "AP2 · echte Datenbank, läuft offline";
    if (root.GENZURUECK) {
      try { root.GENZURUECK.hoeher && root.GENZURUECK.hoeher("scSql", "scStart"); } catch (e) { }
      try { root.GENZURUECK.knopfPflegen(); } catch (e) { }
    }
    try {
      if (!history.state || !history.state.ihk) history.replaceState({ ihk: 1, seite: herkunft }, "");
      if (history.state.seite !== "scSql") history.pushState({ ihk: 1, seite: "scSql" }, "", location.hash || "");
    } catch (e) { }
  }

  function oeffnen(opt) {
    opt = opt || {};
    const s = seite();
    zeigen();
    if (!SQL) {
      s.innerHTML = "";
      const k = el("div", "sq-karte sq-laden");
      k.appendChild(el("b", null, "Datenbank wird geladen …"));
      k.appendChild(el("p", "sq-klein", "Einmalig rund 0,7 MB, danach offline verfügbar."));
      s.appendChild(k);
      laden().then(() => oeffnen(opt), e => {
        s.innerHTML = "";
        const f = el("div", "sq-karte sq-fehlerbox");
        f.appendChild(el("b", null, "Die Datenbank konnte nicht geladen werden."));
        f.appendChild(el("p", "sq-klein", location.protocol === "file:"
          ? "Die Datei vendor/sqljs-1.14.2/sql-asm.js fehlt im Ordner. (" + (e && e.message || e) + ")"
          : "Einmal mit Internet öffnen — danach geht es auch offline. (" + (e && e.message || e) + ")"));
        const n = el("button", "btn", "Nochmal versuchen"); n.type = "button"; n.onclick = () => oeffnen(opt);
        f.appendChild(n);
        s.appendChild(f);
      });
      return;
    }
    if (opt.id) { UI.ansicht = "aufgabe"; UI.id = opt.id; }
    else if (opt.sandkasten) UI.ansicht = "frei";
    else if (opt.weiter) { UI.ansicht = "aufgabe"; UI.id = naechste(); }
    else if (!opt.bleiben) UI.ansicht = "liste";
    zeichnen();
    root.scrollTo(0, 0);
  }

  function naechste(nach) {
    const A = daten().AUFGABEN, S = stand().a;
    const ab = nach ? A.findIndex(a => a.id === nach) + 1 : 0;
    const reihe = A.slice(ab).concat(A.slice(0, ab));
    const x = reihe.find(a => !(S[a.id] && S[a.id].ok));
    return (x || A[0]).id;
  }

  function zeichnen() {
    const s = seite();
    s.innerHTML = "";
    const box = el("div", "sq-wrap");
    s.appendChild(box);
    if (UI.ansicht === "aufgabe") aufgabeZeichnen(box);
    else if (UI.ansicht === "frei") freiZeichnen(box);
    else listeZeichnen(box);
  }

  /* ------------------------------------------------------------ Liste --- */
  function listeZeichnen(box) {
    const D = daten(), Z = zahlen(), S = stand().a;
    const kopf = el("div", "sq-karte");
    kopf.appendChild(el("h2", null, "SQL-Trainer"));
    kopf.appendChild(el("p", "sq-info", D.AUFGABEN.length + " Aufgaben im IHK-Stil an einer echten Datenbank (Online-Shop: Kunden, Artikel, Bestellungen, Mitarbeiter). " +
      "Du schreibst SQL, die App führt es aus und vergleicht dein Ergebnis mit der Musterlösung. SQL kommt erst in AP2 dran — für AP1 nicht nötig."));
    const bar = el("div", "sq-balken"); const f = el("span"); f.style.width = Math.round(Z.geloest / Z.gesamt * 100) + "%"; bar.appendChild(f);
    kopf.appendChild(bar);
    kopf.appendChild(el("p", "sq-klein", Z.geloest + " von " + Z.gesamt + " gelöst" + (Z.versucht ? " · " + Z.versucht + " angefangen" : "")));
    const st = el("div", "sq-steuer");
    const w = el("button", "btn primary", Z.geloest ? "Weiter üben" : "Erste Aufgabe"); w.type = "button";
    w.onclick = () => oeffnen({ weiter: true });
    const fr = el("button", "btn", "Freies SQL"); fr.type = "button"; fr.onclick = () => oeffnen({ sandkasten: true });
    st.append(w, fr);
    kopf.appendChild(st);
    box.appendChild(kopf);

    const chips = el("div", "sq-chips");
    [{ key: "", name: "Alle" }].concat(D.THEMEN).forEach(t => {
      const n = D.AUFGABEN.filter(a => !t.key || a.thema === t.key);
      const g = n.filter(a => S[a.id] && S[a.id].ok).length;
      const c = el("button", "sq-chip" + (UI.thema === t.key ? " an" : ""), t.name + " " + g + "/" + n.length); c.type = "button";
      c.onclick = () => { UI.thema = t.key; zeichnen(); };
      chips.appendChild(c);
    });
    box.appendChild(chips);

    const liste = el("div", "sq-liste");
    D.THEMEN.filter(t => !UI.thema || UI.thema === t.key).forEach(t => {
      const auf = D.AUFGABEN.filter(a => a.thema === t.key);
      if (!auf.length) return;
      liste.appendChild(el("h3", "sq-thema", t.name));
      auf.forEach(a => {
        const e = S[a.id] || {};
        const z = el("button", "sq-zeile" + (e.ok ? " ok" : (e.n || e.code) ? " halb" : "")); z.type = "button";
        const pkt = el("span", "sq-status"); pkt.textContent = e.ok ? "✓" : (e.n || e.code) ? "…" : "";
        const txt = el("span", "sq-z-text");
        txt.appendChild(el("b", null, a.titel));
        txt.appendChild(el("span", null, a.text.length > 90 ? a.text.slice(0, 88) + " …" : a.text));
        z.append(pkt, txt, el("span", "sq-stufe s" + a.stufe, "●".repeat(a.stufe)));
        z.onclick = () => oeffnen({ id: a.id });
        liste.appendChild(z);
      });
    });
    box.appendChild(liste);
  }

  /* ------------------------------------------------------------ Schema --- */
  function schemaKasten(offen) {
    const D = daten();
    const d = el("details", "sq-schema");
    if (offen) d.open = true;
    d.appendChild(el("summary", null, "Datenbank-Schema ansehen"));
    let db = null;
    try {
      db = neueDb();
      const inhalt = el("div", "sq-schema-in");
      Object.keys(D.TABELLEN).forEach(t => {
        const k = el("div", "sq-tab");
        const kopf = el("div", "sq-tab-kopf");
        kopf.appendChild(el("b", null, t));
        const r = db.exec("SELECT COUNT(*) FROM " + q(t));
        kopf.appendChild(el("span", "sq-klein", r[0].values[0][0] + " Zeilen"));
        k.appendChild(kopf);
        const fks = fkVon(db, t);
        const sp = el("div", "sq-spalten");
        spaltenVon(db, t).forEach(s => {
          const fk = fks.find(f => f.von === s.name);
          const c = el("span", "sq-sp" + (s.pk ? " pk" : "") + (fk ? " fk" : ""));
          c.textContent = s.name;
          c.title = s.typ + (s.pk ? " · Primärschlüssel" : "") + (fk ? " · verweist auf " + fk.zu + "." + fk.spalte : "");
          if (fk) { const x = el("small", null, " → " + fk.zu); c.appendChild(x); }
          sp.appendChild(c);
        });
        k.appendChild(sp);
        k.appendChild(el("p", "sq-klein", D.TABELLEN[t]));
        const zeig = el("button", "sq-mini", "Daten zeigen"); zeig.type = "button";
        zeig.onclick = () => {
          const vorhanden = k.querySelector(".sq-ergebnis");
          if (vorhanden) { vorhanden.remove(); zeig.textContent = "Daten zeigen"; return; }
          let d2 = null;
          try { d2 = neueDb(); const l = ausfuehren(d2, "SELECT * FROM " + q(t)); k.appendChild(ergebnisTabelle(l.letztes)); }
          finally { if (d2) d2.close(); }
          zeig.textContent = "Daten ausblenden";
        };
        k.appendChild(zeig);
        inhalt.appendChild(k);
      });
      inhalt.appendChild(el("p", "sq-klein", "Unterstrichen = Primärschlüssel, → = Fremdschlüssel. Datum als 'JJJJ-MM-TT'. Groß-/Kleinschreibung von Befehlen und Namen ist egal, von Texten nicht ('Köln')."));
      d.appendChild(inhalt);
    } finally { if (db) db.close(); }
    return d;
  }

  function ergebnisTabelle(r, max) {
    const w = el("div", "sq-ergebnis");
    if (!r) return w;
    const t = el("table", "sq-tabelle");
    const kopf = el("tr");
    const zahlSp = r.spalten.map((_, j) => r.zeilen.length > 0 && r.zeilen.every(z => z[j] == null || typeof z[j] === "number"));
    r.spalten.forEach((s, j) => kopf.appendChild(el("th", zahlSp[j] ? "zahl" : null, s)));
    const th = el("thead"); th.appendChild(kopf); t.appendChild(th);
    const tb = el("tbody");
    const M = max || 200;
    r.zeilen.slice(0, M).forEach(z => {
      const tr = el("tr");
      z.forEach(v => {
        const td = el("td", v == null ? "null" : typeof v === "number" ? "zahl" : null);
        td.textContent = v == null ? "NULL" : typeof v === "number" && !Number.isInteger(v) ? String(Math.round(v * 10000) / 10000) : String(v);
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    w.appendChild(t);
    w.appendChild(el("p", "sq-klein", r.zeilen.length + (r.zeilen.length === 1 ? " Zeile" : " Zeilen") +
      (r.zeilen.length > M ? " — die ersten " + M + " angezeigt" : "") + (r.zuViel ? " — abgebrochen (mehr als " + MAX_ZEILEN + ")" : "")));
    return w;
  }

  /* ------------------------------------------------------------ Editor --- */
  const TASTEN = ["SELECT", "*", "FROM", "WHERE", "AND", "OR", "=", "<>", "'", ",", ";", "(", ")", "JOIN", "LEFT JOIN", "ON",
    "GROUP BY", "HAVING", "ORDER BY", "DESC", "AS", "COUNT(*)", "SUM(", "AVG(", "MAX(", "MIN(", "IN (", "LIKE '%", "IS NULL", "DISTINCT", "LIMIT",
    "INSERT INTO", "VALUES (", "UPDATE", "SET", "DELETE FROM", "CREATE TABLE", "PRIMARY KEY", "REFERENCES", "NOT NULL", "INTEGER", "VARCHAR(", "DECIMAL(8,2)", "DATE"];
  function editor(wert, beiAenderung, ausfuehrenFn) {
    const w = el("div", "sq-editor-w");
    const ta = el("textarea", "sq-editor");
    ta.value = wert || "";
    ta.rows = 6;
    ta.spellcheck = false;
    ["autocapitalize", "autocomplete", "autocorrect"].forEach(a => ta.setAttribute(a, "off"));
    ta.setAttribute("aria-label", "SQL eingeben");
    ta.placeholder = "SELECT …";
    const passen = () => { ta.style.height = "auto"; ta.style.height = Math.min(Math.max(ta.scrollHeight + 2, 130), 420) + "px"; };
    ta.addEventListener("input", () => { passen(); beiAenderung && beiAenderung(ta.value); });
    ta.addEventListener("keydown", ev => {
      if ((ev.ctrlKey || ev.metaKey) && ev.key === "Enter") { ev.preventDefault(); ausfuehrenFn && ausfuehrenFn(); }
      if (ev.key === "Tab" && !ev.shiftKey) { ev.preventDefault(); einfuegen(ta, "  ", beiAenderung); }
    });
    const leiste = el("div", "sq-tasten");
    const namen = [];
    let db = null;
    try { db = neueDb(); tabellen(db).forEach(t => namen.push(t)); } finally { if (db) db.close(); }
    TASTEN.concat(namen).forEach(t => {
      const b = el("button", "sq-taste" + (namen.indexOf(t) >= 0 ? " tab" : ""), t); b.type = "button";
      b.addEventListener("mousedown", ev => ev.preventDefault());
      b.onclick = () => einfuegen(ta, t, beiAenderung);
      leiste.appendChild(b);
    });
    w.append(ta, leiste);
    setTimeout(passen, 0);
    w.ta = ta;
    return w;
  }
  function einfuegen(ta, t, beiAenderung) {
    const a = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
    const vor = v.slice(0, a), nach = v.slice(e);
    const eng = /^[,;()'*=]$|^<>$/.test(t) || /[(%]$/.test(t);
    let ein = t;
    if (!eng && vor && !/[\s(]$/.test(vor)) ein = " " + ein;
    if (!/[(%']$/.test(t) && t !== "'" && !/^\s/.test(nach)) ein += " ";
    if (t === "LIKE '%") ein = (vor && !/\s$/.test(vor) ? " " : "") + "LIKE '%%'";
    ta.value = vor + ein + nach;
    let p = (vor + ein).length;
    if (t === "LIKE '%") p -= 2;
    ta.focus();
    ta.setSelectionRange(p, p);
    ta.dispatchEvent(new Event("input"));
    beiAenderung && beiAenderung(ta.value);
  }

  function laufZeigen(ziel, lauf, a) {
    ziel.innerHTML = "";
    lauf.notizen.forEach(n => ziel.appendChild(el("p", "sq-notiz", n)));
    if (lauf.fehler) {
      const f = el("div", "sq-meldung falsch");
      f.appendChild(el("b", null, "Fehler" + (lauf.schritte.length || lauf.fehler.nr > 1 ? " in Anweisung " + lauf.fehler.nr : "")));
      f.appendChild(el("p", null, lauf.fehler.text));
      if (lauf.fehler.roh && lauf.fehler.roh !== lauf.fehler.text) f.appendChild(el("p", "sq-roh", lauf.fehler.roh));
      ziel.appendChild(f);
    }
    lauf.schritte.forEach(s => {
      if (s.geaendert != null) ziel.appendChild(el("p", "sq-notiz ok", "Anweisung " + s.nr + ": " + s.geaendert + (s.geaendert === 1 ? " Zeile" : " Zeilen") + " betroffen."));
    });
    if (lauf.letztes) ziel.appendChild(ergebnisTabelle(lauf.letztes));
    else if (!lauf.fehler && a && a.art === "dml") {
      const t = (/^\s*(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+[`"]?(\w+)/i.exec(lauf.schritte.length ? lauf.schritte[lauf.schritte.length - 1].sql : "") || [])[1];
      if (t) ziel.appendChild(el("p", "sq-klein", "Tabelle " + t + " nach deiner Änderung:"));
      if (t && lauf.tabelleDanach) ziel.appendChild(ergebnisTabelle(lauf.tabelleDanach));
    } else if (!lauf.fehler && lauf.aufbau) {
      ziel.appendChild(el("p", "sq-klein", "Aufbau von " + lauf.aufbau.name + ":"));
      ziel.appendChild(ergebnisTabelle(lauf.aufbau.r));
    } else if (!lauf.fehler) ziel.appendChild(el("p", "sq-notiz ok", "Ausgeführt."));
  }

  /** Ausführen (ohne Bewertung) — auf frischen Daten, zeigt Ergebnis bzw. geänderte Tabelle */
  function probelauf(a, code) {
    const db = neueDb(a && a.vorher);
    try {
      const lauf = ausfuehren(db, code);
      if (!lauf.fehler && !lauf.letztes && lauf.schritte.length) {
        const letzt = lauf.schritte[lauf.schritte.length - 1].sql;
        const m = /^\s*(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+[`"]?(\w+)/i.exec(letzt);
        if (m) { const x = ausfuehren(db, "SELECT * FROM " + q(m[1])); lauf.tabelleDanach = x.letztes; }
        const c = /^\s*(?:CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?|ALTER\s+TABLE)\s+[`"]?(\w+)/i.exec(letzt);
        if (c) {
          const t = tabelleFinden(db, c[1], "table");
          if (t) {
            const fks = fkVon(db, t).concat(lauf.fk.filter(f => f.tabelle.toLowerCase() === t.toLowerCase()));
            lauf.aufbau = { name: t, r: { spalten: ["Spalte", "Datentyp", "Schlüssel", "NOT NULL"],
              zeilen: spaltenVon(db, t).map(s => {
                const fk = fks.find(f => f.von.toLowerCase() === s.name.toLowerCase());
                return [s.name, s.typ || "—", [s.pk ? "PK" : "", fk ? "FK → " + fk.zu : ""].filter(Boolean).join(", ") || "", s.notnull ? "ja" : ""];
              }) } };
          }
        }
        const v = /^\s*CREATE\s+VIEW\s+[`"]?(\w+)/i.exec(letzt);
        if (v) { const x = ausfuehren(db, "SELECT * FROM " + q(v[1])); lauf.letztes = x.letztes; }
      }
      return lauf;
    } finally { db.close(); }
  }

  /* ----------------------------------------------------------- Aufgabe --- */
  function aufgabeZeichnen(box) {
    const D = daten(), A = D.AUFGABEN;
    const i = Math.max(0, A.findIndex(x => x.id === UI.id));
    const a = A[i];
    UI.id = a.id;
    stand().pos = a.id; merken();
    const e = eintrag(a.id);
    const thema = (D.THEMEN.find(t => t.key === a.thema) || {}).name || "";

    const nav = el("div", "sq-nav");
    const zur = el("button", "sq-mini", "‹ Alle Aufgaben"); zur.type = "button"; zur.onclick = () => { UI.ansicht = "liste"; zeichnen(); };
    const pos = el("span", "sq-klein", "Aufgabe " + (i + 1) + " von " + A.length);
    const vor = el("button", "sq-mini", "‹"); vor.type = "button"; vor.disabled = i === 0; vor.setAttribute("aria-label", "vorherige Aufgabe");
    vor.onclick = () => { UI.id = A[i - 1].id; zeichnen(); root.scrollTo(0, 0); };
    const nach = el("button", "sq-mini", "›"); nach.type = "button"; nach.disabled = i === A.length - 1; nach.setAttribute("aria-label", "nächste Aufgabe");
    nach.onclick = () => { UI.id = A[i + 1].id; zeichnen(); root.scrollTo(0, 0); };
    const rechts = el("span", "sq-nav-r"); rechts.append(pos, vor, nach);
    nav.append(zur, rechts);
    box.appendChild(nav);

    const k = el("div", "sq-karte sq-aufgabe");
    const kopf = el("div", "sq-a-kopf");
    kopf.appendChild(el("span", "sq-marke", thema));
    kopf.appendChild(el("span", "sq-stufe s" + a.stufe, "●".repeat(a.stufe)));
    if (e.ok) kopf.appendChild(el("span", "sq-marke ok", "✓ gelöst"));
    k.appendChild(kopf);
    k.appendChild(el("h2", null, a.titel));
    k.appendChild(el("p", "sq-text", a.text));
    if (a.vorher) k.appendChild(el("p", "sq-klein", "Vorher ausgeführt: " + a.vorher));
    k.appendChild(schemaKasten(false));
    box.appendChild(k);

    const ausgabe = el("div", "sq-ausgabe");
    const urteil = el("div", "sq-urteil");
    const ed = editor(e.code || "", v => { const x = eintrag(a.id); x.code = v; x.t = Date.now(); merken(); }, () => ausfuehrenKnopf.click());
    const knoepfe = el("div", "sq-knoepfe");
    const ausfuehrenKnopf = el("button", "btn", "▶ Ausführen"); ausfuehrenKnopf.type = "button";
    const pruefenKnopf = el("button", "btn primary", "Prüfen"); pruefenKnopf.type = "button";
    const tipp = el("button", "sq-mini", "Tipp"); tipp.type = "button";
    const loes = el("button", "sq-mini", "Lösung"); loes.type = "button";
    knoepfe.append(ausfuehrenKnopf, pruefenKnopf, tipp, loes);

    const namen = () => { const d = neueDb(a.vorher); try { const t = tabellen(d); return t.concat(...t.map(x => spaltenVon(d, x).map(s => s.name))); } finally { d.close(); } };
    const warnZeigen = (ziel, code) => warnungen(code, namen()).forEach(w => ziel.appendChild(el("p", "sq-notiz warn", w)));

    ausfuehrenKnopf.onclick = () => {
      urteil.innerHTML = "";
      const lauf = probelauf(a, ed.ta.value);
      laufZeigen(ausgabe, lauf, a);
      if (!lauf.fehler) warnZeigen(ausgabe, ed.ta.value);
    };
    pruefenKnopf.onclick = () => {
      const x = eintrag(a.id);
      x.n = (x.n || 0) + 1; x.t = Date.now(); x.code = ed.ta.value;
      const r = bewerte(a, ed.ta.value);
      if (r.ok) x.ok = 1;
      merken(true);
      urteilZeigen(urteil, r, a);
      const l = probelauf(a, ed.ta.value);
      laufZeigen(ausgabe, l, a);
      if (!l.fehler) warnZeigen(ausgabe, ed.ta.value);
      if (r.ok) {
        const n = naechste(a.id);
        const w = el("div", "sq-weiter");
        const nb = el("button", "btn primary", n === a.id ? "Alle gelöst — zur Liste" : "Nächste Aufgabe →"); nb.type = "button";
        nb.onclick = () => { if (n === a.id) UI.ansicht = "liste"; else UI.id = n; zeichnen(); root.scrollTo(0, 0); };
        w.appendChild(nb);
        urteil.appendChild(w);
        kopf.querySelector(".sq-marke.ok") || kopf.appendChild(el("span", "sq-marke ok", "✓ gelöst"));
      }
      urteil.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };
    tipp.onclick = () => {
      if (urteil.querySelector(".sq-tipp")) return;
      urteil.prepend(el("p", "sq-tipp", "Tipp: " + a.tipp));
    };
    loes.onclick = () => {
      if (urteil.querySelector(".sq-loesung")) return;
      const x = eintrag(a.id); x.gesehen = 1; x.t = Date.now(); merken(true);
      const d = el("div", "sq-loesung");
      d.appendChild(el("b", null, "Musterlösung"));
      d.appendChild(el("pre", null, a.loesung));
      d.appendChild(el("p", "sq-ru", a.ru));
      const ueb = el("button", "sq-mini", "In den Editor übernehmen"); ueb.type = "button";
      ueb.onclick = () => { ed.ta.value = a.loesung; ed.ta.dispatchEvent(new Event("input")); ed.ta.focus(); };
      d.appendChild(ueb);
      urteil.appendChild(d);
    };

    const arbeit = el("div", "sq-karte sq-arbeit");
    arbeit.append(ed, knoepfe, urteil, ausgabe);
    arbeit.appendChild(el("p", "sq-klein", "Jede Ausführung startet mit frischen Daten — du kannst nichts kaputt machen. Strg+Enter = Ausführen."));
    box.appendChild(arbeit);
  }

  function urteilZeigen(ziel, r, a) {
    ziel.querySelectorAll(".sq-meldung, .sq-weiter").forEach(x => x.remove());
    const m = el("div", "sq-meldung " + (r.ok ? "richtig" : "falsch"));
    m.appendChild(el("b", null, r.ok ? "✓ " + r.text : r.text));
    const zeilen = (titel, liste) => {
      if (!liste || !liste.length) return;
      m.appendChild(el("p", "sq-klein", titel));
      const ul = el("ul", "sq-diff");
      liste.forEach(z => ul.appendChild(el("li", null, zeigeZeile(z))));
      m.appendChild(ul);
    };
    zeilen("Fehlt bei dir (Musterlösung hat diese Zeile):", r.fehlt);
    zeilen("Zu viel bzw. anders bei dir:", r.zuviel);
    (r.teile || []).forEach(t => {
      m.appendChild(el("p", null, t.text));
      if (t.spalten && t.fehlt && t.fehlt.length) { m.appendChild(el("p", "sq-klein", "erwartet (" + t.spalten.join(" | ") + "):")); const ul = el("ul", "sq-diff"); t.fehlt.forEach(z => ul.appendChild(el("li", null, zeigeZeile(z)))); m.appendChild(ul); }
      if (t.zuviel && t.zuviel.length) { m.appendChild(el("p", "sq-klein", "bei dir:")); const ul = el("ul", "sq-diff"); t.zuviel.forEach(z => ul.appendChild(el("li", null, zeigeZeile(z)))); m.appendChild(ul); }
    });
    if (r.punkte && r.punkte.length) {
      const ul = el("ul", "sq-punkte");
      r.punkte.forEach(p => ul.appendChild(el("li", p.ok ? "ok" : p.info ? "info" : "nein", p.text)));
      m.appendChild(ul);
    }
    if (r.ok && a && a.ru) m.appendChild(el("p", "sq-ru", a.ru));
    ziel.appendChild(m);
  }

  /* ---------------------------------------------------- Freies Üben --- */
  let FREI_DB = null;
  function freiZeichnen(box) {
    const nav = el("div", "sq-nav");
    const zur = el("button", "sq-mini", "‹ Alle Aufgaben"); zur.type = "button"; zur.onclick = () => { UI.ansicht = "liste"; zeichnen(); };
    nav.appendChild(zur);
    box.appendChild(nav);
    const k = el("div", "sq-karte");
    k.appendChild(el("h2", null, "Freies SQL"));
    k.appendChild(el("p", "sq-info", "Alles ausprobieren, was du willst. Änderungen bleiben erhalten, bis du die Datenbank zurücksetzt."));
    k.appendChild(schemaKasten(false));
    box.appendChild(k);
    if (!FREI_DB) FREI_DB = neueDb();
    const ausgabe = el("div", "sq-ausgabe");
    const ed = editor(stand().frei || "SELECT * FROM Kunde;", v => { stand().frei = v; merken(); }, () => los.click());
    const knoepfe = el("div", "sq-knoepfe");
    const los = el("button", "btn primary", "▶ Ausführen"); los.type = "button";
    const neu = el("button", "sq-mini", "Datenbank zurücksetzen"); neu.type = "button";
    knoepfe.append(los, neu);
    los.onclick = () => {
      const lauf = ausfuehren(FREI_DB, ed.ta.value);
      laufZeigen(ausgabe, lauf, null);
      if (!lauf.fehler) warnungen(ed.ta.value, tabellen(FREI_DB)).forEach(w => ausgabe.appendChild(el("p", "sq-notiz warn", w)));
    };
    neu.onclick = () => { try { FREI_DB.close(); } catch (e) { } FREI_DB = neueDb(); ausgabe.innerHTML = ""; ausgabe.appendChild(el("p", "sq-notiz ok", "Datenbank ist wieder im Ausgangszustand.")); };
    const arbeit = el("div", "sq-karte sq-arbeit");
    arbeit.append(ed, knoepfe, ausgabe);
    box.appendChild(arbeit);
  }

  /* -------------------------------------------------------- Startseite --- */
  function block() {
    const s = $("scStart");
    if (!s || !daten()) return;
    let b = $("sqlBox");
    if (!b) { b = el("div", "abschnitt"); b.id = "sqlBox"; s.appendChild(b); }
    b.innerHTML = "";
    b.appendChild(el("h2", null, "SQL-Trainer (AP2)"));
    const Z = zahlen();
    b.appendChild(el("p", null, Z.gesamt + " Aufgaben im IHK-Stil an einer echten Datenbank: SELECT, WHERE, GROUP BY, JOIN, Unterabfragen, INSERT/UPDATE/DELETE, CREATE TABLE. " +
      "Dein SQL wird ausgeführt und mit der Musterlösung verglichen. Für AP2 — in AP1 kommt SQL nicht dran."));
    const st = el("div", "steuer");
    const o = el("button", "btn primary", Z.geloest ? "Weiter üben (" + Z.geloest + "/" + Z.gesamt + ")" : "SQL-Trainer öffnen"); o.type = "button";
    o.onclick = () => oeffnen(Z.geloest ? { weiter: true } : {});
    const l = el("button", "btn", "Alle Aufgaben"); l.type = "button"; l.onclick = () => oeffnen();
    st.append(o, l);
    b.appendChild(st);
    const d = document.querySelector('details.st-block[data-key="sql"] .st-zahl');
    if (d) d.textContent = Z.geloest + "/" + Z.gesamt;
  }

  /* -------------------------------------------------------- Einhängen --- */
  function einhaengen() {
    const altStart = root.renderStart;
    if (typeof altStart === "function" && !altStart.__sq) {
      const neu = function () {
        const r = altStart.apply(this, arguments);
        try { block(); } catch (e) { console.error("SQL:", e); }
        return r;
      };
      neu.__sq = true; root.renderStart = neu;
    }
    const altSchirm = root.schirm;
    if (typeof altSchirm === "function" && !altSchirm.__sq) {
      const neu = function (name) {
        if (name === "scSql") { oeffnen({ bleiben: true }); return; }
        const s = $("scSql"); if (s) s.hidden = true;
        return altSchirm.apply(this, arguments);
      };
      neu.__sq = true; root.schirm = neu;
    }
    if (root.MutationObserver) {
      new MutationObserver(muts => {
        const k = $("scSql");
        if (!k || k.hidden) return;
        for (const m of muts) {
          const z = m.target;
          if (z !== k && z.id && /^sc/.test(z.id) && z.classList &&
              (z.classList.contains("seite") || z.classList.contains("blatt")) && !z.hidden) { k.hidden = true; return; }
        }
      }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
    }
    try { block(); } catch (e) { console.error("SQL:", e); }
  }

  const api = { laden, setzeSQL, zerlege, vorbereiten, fehlerText, warnungen, gruppenWarnung, neueDb, ausfuehren,
    vergleiche, vergleicheStand, pruefeAufbau, bewerte, loesungLauf, probelauf, normWert, familie, schnappschuss,
    oeffnen, block, zahlen, get UI() { return UI; } };
  root.GENSQL = api;
  if (typeof module === "object" && module.exports) module.exports = api;
  if (hatDom) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", einhaengen);
    else einhaengen();
  }
})(typeof window !== "undefined" ? window : globalThis);
