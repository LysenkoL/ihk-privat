#!/usr/bin/env python3
"""Проверка редакционного качества статей компендия."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

EMPTY_ANSWER = re.compile(
    r"<h5[^>]*>\s*Musterantwort\s*</h5>\s*"
    r"(?:<p[^>]*>\s*</p>\s*)*(?=<(?:h[1-6]|hr)\b|$)",
    re.IGNORECASE,
)

RUNTIME_REWRITTEN = {
    "sql-grundlagen",
    "virtualisierung",
    "cloud-modelle-iaas-paas-saas",
    "algorithmen-ablaufdiagramme",
    "datensicherungskonzepte",
    "bedrohungsszenarien",
}

OUTDATED_WITH_AP1 = re.compile(
    r"(?:SQL|RAID|Struktogramm|Programmablaufplan|\bPAP\b).{0,45}\bAP1\b|"
    r"\bAP1\b.{0,45}(?:SQL|RAID|Struktogramm|Programmablaufplan|\bPAP\b)",
    re.IGNORECASE,
)

SOURCE_PLACEHOLDER = re.compile(
    r"(?:Kursunterlagen aus\s*:|Vorhandene Workspace-Seite\s*:)(?:\s|<[^>]+>)*"
    r"(?:Die Seite\s*)?(?:wurde|<|$)",
    re.IGNORECASE,
)


def empty_answer_count(html: str) -> int:
    return len(EMPTY_ANSWER.findall(html or ""))


def unclassified_ap1_claims(slug: str, html: str) -> list[str]:
    result = []
    for match in OUTDATED_WITH_AP1.finditer(html or ""):
        claim = match.group(0)[:180]
        if re.search(r"nicht mehr|historisch|Vertiefung|AP2", claim, re.IGNORECASE):
            continue
        result.append(claim)
    return result


def scan(root: Path) -> tuple[int, int, list[tuple[str, str]]]:
    empty = 0
    placeholders = 0
    stale: list[tuple[str, str]] = []
    for path in sorted((root / "gen" / "komp").glob("*.js")):
        text = path.read_text(encoding="utf-8")
        slug = path.stem
        empty += empty_answer_count(text)
        placeholders += len(SOURCE_PLACEHOLDER.findall(text))
        # Эти статьи намеренно исправляются при показе, чтобы не менять
        # импортированный исходник. Их итоговый текст проверяет Node-тест ниже.
        if slug not in RUNTIME_REWRITTEN:
            for claim in unclassified_ap1_claims(slug, text):
                stale.append((path.name, re.sub(r"\s+", " ", claim)))
    return empty, placeholders, stale


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    root = Path(__file__).resolve().parents[1]
    empty, placeholders, stale = scan(root)
    print(f"Kompendium: {empty} leere Musterantworten (im UI gekennzeichnet)")
    print(f"Kompendium: {placeholders} unvollstaendige Quellen-Platzhalter (im UI ausgeblendet)")
    if stale:
        print("Nicht klassifizierte veraltete AP1-Aussagen:")
        for filename, claim in stale:
            print(f"  {filename}: {claim}")
        return 1
    rendered = subprocess.run(
        ["node", str(root / "tests" / "kompendium-status.test.js")],
        cwd=root,
        capture_output=True,
        text=True,
    )
    if rendered.returncode:
        print("Fehler in der Laufzeit-Katalogpruefung:")
        print(rendered.stdout)
        print(rendered.stderr)
        return 1
    print("Kompendium: Laufzeit-Katalogtexte geprueft")
    return 0


if __name__ == "__main__":
    sys.exit(main())
