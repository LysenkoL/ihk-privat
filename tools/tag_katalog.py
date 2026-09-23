#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tag_katalog.py — помечает задания, которые ушли из Prüfungskatalog AP1 (ab 2025),
и считает, какие НОВЫЕ темы каталога в базе не покрыты.

Источник правил: exams/katalog.json — правь его, не этот скрипт.

Каждой Teilaufgabe проставляется:
  "katalog": { "status": "veraltet" | "umformen" | "grenzfall" | "reduziert" | null,
               "grund": "...", "treffer": ["raid", "san"] }

Побочно пишет exams/luecken.json — новые темы каталога и сколько заданий их
покрывает. Ноль — значит по этой теме тренироваться не на чем.

  python tools/tag_katalog.py
  python tools/tag_katalog.py --report   # только показать, не писать
"""
import json, re, sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
EXAMS = ROOT / "exams"
KATALOG = EXAMS / "katalog.json"
SKIP = (".text.json", ".figures.json", ".report.json", ".loesung.json",
        ".topics.json", ".override.json", "katalog.json",
        "luecken.json", "cards.json", "gewichte.json", "exams.js")


def volltext(s):
    return " ".join(filter(None, [
        s.get("prompt"), s.get("groupIntro"),
        (s.get("solution") or {}).get("text"),
        s.get("placeholder"),
    ])).lower()


def main():
    nur_report = "--report" in sys.argv
    kat = json.loads(KATALOG.read_text(encoding="utf-8"))
    for gruppe in ("veraltet", "umformen", "grenzfall", "reduziert", "neu"):
        for e in kat.get(gruppe, []):
            e["_rx"] = re.compile(e["muster"], re.I)

    dateien = [p for p in sorted(EXAMS.glob("*.json"))
               if not any(p.name.endswith(s) for s in SKIP)]

    abdeckung = {e["key"]: {"label": e["label"], "hinweis": e.get("hinweis"),
                            "n": 0, "be": 0, "beispiele": []} for e in kat["neu"]}
    summe = {"veraltet": [0, 0], "umformen": [0, 0], "grenzfall": [0, 0],
             "reduziert": [0, 0], "aktuell": [0, 0]}

    for p in dateien:
        d = json.loads(p.read_text(encoding="utf-8"))
        for t in d["tasks"]:
            for s in t["subtasks"]:
                txt = volltext(s)
                be = s.get("maxPoints") or 0

                # Rangfolge: veraltet > umformen (Form gestrichen, Inhalt aktuell)
                #            > grenzfall (AP1/AP2) > reduziert
                s["katalog"] = {"status": None}
                for status in ("veraltet", "umformen", "grenzfall", "reduziert"):
                    hit = [e for e in kat.get(status, []) if e["_rx"].search(txt)]
                    if hit:
                        s["katalog"] = {
                            "status": status,
                            "grund": "; ".join(e["grund"] for e in hit),
                            "themen": [e["label"] for e in hit],
                            "treffer": [e["key"] for e in hit],
                        }
                        break

                st = s["katalog"]["status"] or "aktuell"
                summe[st][0] += 1
                summe[st][1] += be

                if st != "veraltet":
                    for e in kat["neu"]:
                        if e["_rx"].search(txt):
                            a = abdeckung[e["key"]]
                            a["n"] += 1
                            a["be"] += be
                            if len(a["beispiele"]) < 4:
                                a["beispiele"].append(f"{d['examId']}:{s['id']}")

        if not nur_report:
            p.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")

    if not nur_report:
        (EXAMS / "luecken.json").write_text(json.dumps({
            "stand": kat.get("stand"),
            "quelle": kat.get("quelle"),
            "themen": [{"key": k, **v} for k, v in
                       sorted(abdeckung.items(), key=lambda x: (x[1]["n"], x[1]["label"]))],
        }, ensure_ascii=False, indent=2), encoding="utf-8")

    for st in ("aktuell", "grenzfall", "umformen", "reduziert"):
        print(f"{st:10} {summe[st][0]:3} Teilaufgaben  {summe[st][1]:4} BE")
    print(f"{'veraltet':10} {summe['veraltet'][0]:3} Teilaufgaben  {summe['veraltet'][1]:4} BE"
          "   ← можно пропускать")
    print()
    luecken = [v for v in abdeckung.values() if v["n"] == 0]
    print(f"Новые темы каталога без единого задания в базе: {len(luecken)} из {len(abdeckung)}")
    for v in luecken:
        h = f"  ({v['hinweis']})" if v.get("hinweis") else ""
        print(f"   · {v['label']}{h}")
    print()
    print("Слабо покрытые (1–2 задания):")
    for v in sorted(abdeckung.values(), key=lambda x: x["n"]):
        if 0 < v["n"] <= 2:
            print(f"   · {v['label']:45} {v['n']} шт, {v['be']} BE")


if __name__ == "__main__":
    main()
