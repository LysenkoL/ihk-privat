import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
index = (ROOT / "index.html").read_text(encoding="utf-8")
worker = (ROOT / "sw.js").read_text(encoding="utf-8")

refs = set(re.findall(r'(?:src|href)="([^"]+)"', index))
shell = sorted(
    ref for ref in refs
    if not ref.startswith(("http:", "https:", "#"))
    and ref.split("?", 1)[0].endswith((".js", ".css", ".png", ".webmanifest"))
)
missing = [ref for ref in shell if f'"./{ref}"' not in worker]

assert not missing, "not precached: " + ", ".join(missing)
assert 'const VERSION   = "ihk-ap1-v31"' in worker
install = worker[worker.index('self.addEventListener("install"'):worker.index('self.addEventListener("activate"')]
assert ".catch(" not in install
assert "await app.match(req)" in worker

print(f"pwa-shell: {len(shell)} startup resources precached")
