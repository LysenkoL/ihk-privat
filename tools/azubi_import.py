#!/usr/bin/env python3
"""
tools/azubi_import.py — Azubi-Navigator-Export → privat/azubi-daten.js
======================================================================

Der Azubi-Navigator (u-form, ausbildung.io) speichert angefangene Prüfungen
nicht zuverlässig. Dieses Skript macht aus einem Export der Inhalte
(azubi-navigator-export.json, im Browser aus dem eigenen Konto gezogen) ein
Datenpaket für den Simulator:

    python tools/azubi_import.py ~/Downloads/azubi-navigator-export.json

Ergebnis: privat/azubi-daten.js  (window.IHK_AZUBI = {...})

WICHTIG: Die Inhalte sind lizenziertes Lernmaterial von u-form. Der Ordner
privat/ steht in .gitignore und geht NICHT auf GitHub Pages. Aufs Handy kommt
das Paket über „Paket laden“ im Azubi-Bereich der App (bleibt dann nur im
Speicher des Geräts).

Was das Skript macht:
- HTML auf eine kleine Liste erlaubter Tags reduzieren (keine Styles, keine
  Skripte, keine Links),
- Aufgabentypen in wenige Eingabeformen übersetzen (offen, Werte, Tabelle,
  Zuordnung, Auswahl, Mehrfachauswahl) — mit Soll-Werten für die
  automatische Kontrolle,
- Bilder als WebP verkleinern und doppelte zusammenlegen.
"""
import base64
import hashlib
import html
import io
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ZIEL = ROOT / "privat" / "azubi-daten.js"
BISHER = ROOT / "privat" / "azubi-bisher.json"

# ------------------------------------------------------------------ HTML ---
ERLAUBT = {"p", "div", "br", "b", "strong", "i", "em", "u", "s", "sub", "sup",
           "ul", "ol", "li", "table", "thead", "tbody", "tfoot", "tr", "td", "th",
           "pre", "code", "h3", "h4", "hr", "img"}
LEER = {"br", "hr", "img"}
WEG_MIT_INHALT = {"script", "style", "iframe", "object", "embed", "svg", "math", "head", "title"}


class Saeuberer(HTMLParser):
    def __init__(self, bild_von_src):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.stapel = []
        self.weg = 0
        self.bild_von_src = bild_von_src

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag in WEG_MIT_INHALT:
            self.weg += 1
            return
        if self.weg or tag not in ERLAUBT:
            return
        a = dict((k.lower(), v or "") for k, v in attrs)
        if tag == "img":
            bid = self.bild_von_src(a.get("src", ""), a.get("alt", ""))
            if bid:
                self.out.append('<img data-bild="%s" alt="">' % bid)
            return
        extra = ""
        if tag in ("td", "th"):
            for k in ("colspan", "rowspan"):
                if re.fullmatch(r"\d{1,2}", a.get(k, "")):
                    extra += ' %s="%s"' % (k, a[k])
        self.out.append("<%s%s>" % (tag, extra))
        if tag not in LEER:
            self.stapel.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag.lower() in self.stapel and tag.lower() not in LEER:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag in WEG_MIT_INHALT:
            self.weg = max(0, self.weg - 1)
            return
        if self.weg or tag not in ERLAUBT or tag in LEER:
            return
        if tag in self.stapel:
            while self.stapel:
                t = self.stapel.pop()
                self.out.append("</%s>" % t)
                if t == tag:
                    break

    def handle_data(self, data):
        if not self.weg:
            self.out.append(html.escape(data, quote=False))

    def ergebnis(self):
        while self.stapel:
            self.out.append("</%s>" % self.stapel.pop())
        s = "".join(self.out)
        s = re.sub(r"(<br>\s*){3,}", "<br><br>", s)
        s = re.sub(r"<div>\s*(<br>)?\s*</div>", "<br>", s)
        s = re.sub(r"^(\s|<br>)+|(\s|<br>)+$", "", s)
        return s.strip()


# ---------------------------------------------------------------- Bilder ---
class Bilder:
    def __init__(self, roh):
        self.roh = roh or {}
        self.daten = {}      # schlüssel -> data-URI
        self.alias = {}      # alte id -> schlüssel
        self.fehlt = set()

    def _webp(self, raw):
        try:
            from PIL import Image
        except ImportError:
            return None
        im = Image.open(io.BytesIO(raw))
        w, h = im.size
        im = im.convert("RGBA") if im.mode in ("P", "LA", "RGBA") else im.convert("RGB")
        if w > 1200:
            im = im.resize((1200, int(h * 1200 / w)), Image.LANCZOS)
        o = io.BytesIO()
        im.save(o, "WEBP", quality=82, method=6)
        return "data:image/webp;base64," + base64.b64encode(o.getvalue()).decode()

    def _ablegen(self, raw, typ):
        k = hashlib.sha1(raw).hexdigest()[:12]
        if k not in self.daten:
            uri = None
            try:
                uri = self._webp(raw)
            except Exception:
                uri = None
            self.daten[k] = uri or ("data:%s;base64,%s" % (typ or "image/png", base64.b64encode(raw).decode()))
        return k

    def von_id(self, bid):
        bid = str(bid)
        if bid in self.alias:
            return self.alias[bid]
        b = self.roh.get(bid)
        raw = b""
        if b and "," in (b.get("data") or ""):
            raw = base64.b64decode(b["data"].split(",", 1)[1])
        if not raw:
            self.fehlt.add(bid)
            self.alias[bid] = "fehlt"
            return "fehlt"
        k = self._ablegen(raw, b.get("typ"))
        self.alias[bid] = k
        return k

    def von_src(self, src, alt=""):
        m = re.match(r"data:(image/[a-z+.-]+);base64,(.+)$", src or "", re.S)
        if not m:
            return None
        return self._ablegen(base64.b64decode(m.group(2)), m.group(1))


# -------------------------------------------------------------- Umbauen ---
def code_aus(name):
    """„UV 750 26 P02 - 04da“ → („4“, „da“); „UV 750 26 VÜ1 - A5ab,ac“ → („5“, „ab, ac“)"""
    teil = name.split(" - ", 1)[1].strip() if " - " in name else ""
    m = re.match(r"^A?0?(\d+)\s*([a-z][a-z,\s]*)?$", teil)
    if not m:
        return None, teil
    buchst = (m.group(2) or "").replace(" ", "")
    return m.group(1), ", ".join(x for x in buchst.split(",") if x)


def ist_zahl(s):
    return bool(re.fullmatch(r"-?\d+([.,]\d+)?", (s or "").strip()))


class Umbau:
    def __init__(self, bilder):
        self.bilder = bilder

    def h(self, s):
        if not s:
            return ""
        p = Saeuberer(self.bilder.von_src)
        p.feed(s)
        p.close()
        return p.ergebnis()

    def bild(self, obj):
        if isinstance(obj, dict) and obj.get("id") and (obj.get("path") or obj.get("name")):
            return '<img data-bild="%s" alt="">' % self.bilder.von_id(obj["id"])
        return ""

    def block(self, eintraege):
        """erlaeuterung / anlagen.items: Liste aus {text} und {image}"""
        teile = []
        for e in eintraege or []:
            if e.get("text"):
                teile.append(self.h(e["text"]))
            if e.get("image"):
                teile.append(self.bild(e["image"]))
        return "".join(t for t in teile if t)

    def aufgabentext(self, q):
        teile = []
        for sc in sorted(q.get("scenarios") or [], key=lambda x: x.get("pos", 0)):
            if sc.get("scenariotext"):
                teile.append(self.h(sc["scenariotext"]))
            if sc.get("image"):
                teile.append(self.bild(sc["image"]))
            for im in sc.get("images") or []:
                teile.append(self.bild(im))
        return "".join(t for t in teile if t)

    def anlagen(self, q):
        out = []
        for a in q.get("anlagen") or []:
            inhalt = self.block(a.get("items"))
            if inhalt:
                out.append({"titel": self.h(a.get("title") or "Anlage"), "html": inhalt})
        return out

    # ---- Eingabeformen
    def feld(self, antworten, einheit=None):
        typen = {a.get("answerfieldtype") for a in antworten}
        soll = [str(a.get("defaultvalue")).strip() for a in antworten if a.get("defaultvalue") not in (None, "")]
        f = {"id": str(antworten[0].get("id")), "soll": soll}
        f["art"] = "zahl" if typen == {5} and soll and all(ist_zahl(x) for x in soll) else "text"
        if einheit and einheit not in ("fragenoffenL", "fragenoffenM") and not re.fullmatch(r"\d+", einheit):
            f["einheit"] = einheit
        return f

    def eingabe(self, q):
        tpl = q.get("templateid")
        items = q.get("items") or []
        if tpl == 15 and q.get("spaltezahl") and q.get("zeilezahl"):
            zellen = []
            for it in items:
                ans = it.get("answers") or []
                if ans and ans[0].get("answerfieldtype") in (1, 5):
                    if ans[0].get("answerfieldtype") == 5 and len(ans) > 1:
                        zellen.append({"f": self.feld(ans[:1], it.get("einheit"))})
                    else:
                        zellen.append({"f": self.feld(ans, it.get("einheit"))})
                else:
                    t = self.h(it.get("itemtext"))
                    zellen.append({"h": t} if t else None)
            return {"typ": "raster", "spalten": q["spaltezahl"], "zeilen": q["zeilezahl"], "zellen": zellen}
        if tpl == 4 and q.get("options"):
            return {"typ": "zuordnung",
                    "optionen": [self.h(o.get("text")) for o in q["options"]],
                    "otitel": self.h(q.get("optionenTitle")) or "Auswahl",
                    "ftitel": self.h(q.get("fragenTitle")) or "",
                    "zeilen": [{"h": self.h(it.get("itemtext")), "id": str((it.get("answers") or [{}])[0].get("id")),
                                "soll": str((it.get("answers") or [{}])[0].get("defaultvalue", "")).strip()}
                               for it in items if it.get("answers")]}
        if tpl == 6:
            zeilen = []
            for it in items:
                ans = it.get("answers") or []
                if not ans:
                    continue
                try:
                    soll = int(str(ans[0].get("defaultvalue", "")).strip())
                except ValueError:
                    soll = None
                zeilen.append({"h": self.h(it.get("itemtext")), "id": str(it.get("id")),
                               "optionen": [self.h(a.get("fieldlabel")) for a in ans], "soll": soll})
            return {"typ": "wahl", "ftitel": self.h(q.get("fragenTitle")) or "", "zeilen": zeilen}
        if tpl == 21 and q.get("options"):
            ans = [a for it in items for a in (it.get("answers") or [])]
            soll = sorted({int(a["defaultvalue"]) for a in ans if str(a.get("defaultvalue", "")).strip().isdigit()})
            return {"typ": "mehrfach", "optionen": [self.h(o.get("text")) for o in q["options"]],
                    "soll": soll, "anzahl": len(soll)}
        # Standard: Zeilen mit Text, Wertfeldern oder freien Antworten
        zeilen = []
        for it in items:
            ans = it.get("answers") or []
            text = self.h(it.get("itemtext"))
            if text in ("Eingabefeld", "<b>Ihre Lösung</b>", "Ihre Lösung", "Ihre Lösung:", "<b>Ihre Lösung:</b>"):
                text = ""
            frei = [a for a in ans if a.get("answerfieldtype") == 7]
            werte = [a for a in ans if a.get("answerfieldtype") in (1, 5)]
            if frei:
                zeilen.append({"h": text, "frei": str(frei[0].get("id")),
                               "gross": it.get("einheit") != "fragenoffenM"})
            elif werte:
                if all(a.get("answerfieldtype") == 1 for a in werte):
                    zeilen.append({"h": text, "felder": [self.feld(werte, it.get("einheit"))]})
                else:
                    zeilen.append({"h": text, "felder": [self.feld([a], it.get("einheit")) for a in werte]})
            elif text:
                zeilen.append({"h": text})
        if not any(z.get("frei") or z.get("felder") for z in zeilen):
            zeilen.append({"h": "", "frei": "1", "gross": True})
        return {"typ": "zeilen", "zeilen": zeilen}

    def teil(self, q):
        nr, buchst = code_aus(q.get("name", ""))
        t = {
            "id": str(q["id"]),
            "nr": nr,
            "label": (buchst + ")") if buchst else "",
            "titel": self.h(q.get("anzeigename")),
            "punkte": q.get("points") or 0,
            "sek": q.get("timeInSeconds") or 0,
            "text": self.aufgabentext(q),
            "eingabe": self.eingabe(q),
            "loesung": self.block(q.get("erlaeuterung")),
        }
        an = self.anlagen(q)
        if an:
            t["anlagen"] = an
        if q.get("musterBemerkung"):
            t["hinweis"] = self.h(q["musterBemerkung"])
        return t

    def modul(self, c):
        name = c.get("name", "").strip()
        m = re.match(r"Prüfung\s+(\d+):\s*(.+)$", name)
        if m:
            art, nr, titel = "pruefung", int(m.group(1)), m.group(2).strip()
            kurz = "Prüfung %02d" % nr
        else:
            m = re.match(r"Vertiefende Übung(?:en)?\s+(\d+):\s*(.+)$", name)
            if not m:
                return None
            art, nr, titel = "vertiefung", int(m.group(1)), m.group(2).strip()
            kurz = "Vertiefung %d" % nr
        einleitung, aufgaben = [], {}
        reihenfolge = []
        for ts in c.get("timesections") or []:
            for s in ts.get("sections") or []:
                for q in s.get("questions") or []:
                    if not q.get("points"):
                        txt = self.aufgabentext(q)
                        an = self.anlagen(q)
                        if txt or an:
                            einleitung.append({"titel": self.h(q.get("anzeigename")), "html": txt, "anlagen": an})
                        continue
                    t = self.teil(q)
                    sn = re.match(r"Aufgabe\s+(\d+)", s.get("name", ""))
                    anr = t["nr"] or (sn.group(1) if sn else "1")
                    if anr not in aufgaben:
                        aufgaben[anr] = {"nr": anr, "titel": "Aufgabe " + anr, "teile": []}
                        reihenfolge.append(anr)
                    aufgaben[anr]["teile"].append(t)
        auf = [aufgaben[k] for k in reihenfolge]
        return {
            "id": "az%d" % c["id"],
            "quelleId": c["id"],
            "art": art, "nr": nr, "kurz": kurz, "titel": titel,
            "minuten": round((c.get("overalltime") or 0) / 60),
            "punkte": sum(t["punkte"] for a in auf for t in a["teile"]),
            "intro": self.h(c.get("greeting")),
            "einleitung": einleitung,
            "aufgaben": auf,
        }


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    quelle = json.loads(Path(sys.argv[1]).expanduser().read_text(encoding="utf-8"))
    bilder = Bilder(quelle.get("bilder"))
    u = Umbau(bilder)
    module = [m for m in (u.modul(c) for c in quelle.get("inhalte") or []) if m]
    module.sort(key=lambda m: (m["art"] != "pruefung", m["nr"]))
    bisher = {}
    if BISHER.exists():
        bisher = json.loads(BISHER.read_text(encoding="utf-8"))
    paket = {
        "format": 1,
        "quelle": "Azubi-Navigator (u-form) · " + (quelle.get("quelle") or ""),
        "stand": (quelle.get("exportiert") or "")[:10],
        "bisher": bisher,
        "module": module,
        "bilder": bilder.daten,
    }
    ZIEL.parent.mkdir(parents=True, exist_ok=True)
    js = ("/* Azubi-Navigator (u-form) — privates Datenpaket, NICHT veröffentlichen (privat/ steht in .gitignore). */\n"
          "window.IHK_AZUBI = " + json.dumps(paket, ensure_ascii=False, separators=(",", ":")) + ";\n")
    ZIEL.write_text(js, encoding="utf-8")
    n = sum(len(a["teile"]) for m in module for a in m["aufgaben"])
    print("%d Module, %d Teilaufgaben, %d Bilder (%d fehlen) → %s (%.1f MB)" % (
        len(module), n, len(bilder.daten), len(bilder.fehlt), ZIEL.relative_to(ROOT), ZIEL.stat().st_size / 1e6))


if __name__ == "__main__":
    main()
