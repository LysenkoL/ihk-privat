from pathlib import Path
import importlib.util

MODULE = Path(__file__).parents[1] / "tools" / "check_kompendium.py"
spec = importlib.util.spec_from_file_location("check_kompendium", MODULE)
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)

empty = "<h4>Aufgabe</h4><h5>Musterantwort</h5><p></p><hr>"
filled = "<h4>Aufgabe</h4><h5>Musterantwort</h5><p>Antwort</p>"

assert checker.empty_answer_count(empty) == 1
assert checker.empty_answer_count(filled) == 0
assert checker.unclassified_ap1_claims("sql-grundlagen", "SQL in der AP1")
assert checker.unclassified_ap1_claims("bedrohungsszenarien", "AP1-Falle: RAID")
assert checker.unclassified_ap1_claims("sql-grundlagen", "SQL gehört nicht mehr zum AP1-Kern") == []
assert checker.unclassified_ap1_claims("unknown", "SQL in der AP1")

print("check_kompendium: validator behavior OK")
