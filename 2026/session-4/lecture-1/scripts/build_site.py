#!/usr/bin/env python3
"""Build the standalone GitHub Pages copy of the lecture page.

lecture/index.html is written as a claude.ai artifact fragment: no doctype,
<html>, <head> or <body>, because the artifact platform wraps it at publish
time. A regular static host serves the file as is, so this script adds the
same wrapper and writes the result to docs/index.html, which
.github/workflows/pages.yml publishes to GitHub Pages.

Usage: python3 scripts/build_site.py
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "lecture" / "index.html"
OUT_DIR = ROOT / "docs"

# Mirrors the reset the artifact skeleton provides, so the page renders the
# same way here as on claude.ai.
BASE_RESET = """<style>
:root { color-scheme: light; padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
body { margin: 0; font: 14px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
img { max-width: 100%; }
[hidden] { display: none !important; }
</style>"""


def main() -> int:
    src = SRC.read_text(encoding="utf-8")
    if src.lstrip().lower().startswith("<!doctype"):
        print(f"error: {SRC} already has a doctype; expected an artifact fragment", file=sys.stderr)
        return 1
    marker = "</style>"
    cut = src.find(marker)
    if cut == -1:
        print(f"error: no </style> found in {SRC}; cannot split head from body", file=sys.stderr)
        return 1
    cut += len(marker)
    head, body = src[:cut], src[cut:]
    # The claude.ai-specific meta tag means nothing outside the artifact viewer.
    head = "\n".join(l for l in head.split("\n") if 'name="claude:' not in l)

    page = (
        "<!doctype html>\n"
        '<html lang="ru">\n'
        "<head>\n"
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        f"{BASE_RESET}\n"
        f"{head.strip()}\n"
        "</head>\n"
        "<body>\n"
        f"{body.strip()}\n"
        "</body>\n"
        "</html>\n"
    )
    OUT_DIR.mkdir(exist_ok=True)
    (OUT_DIR / "index.html").write_text(page, encoding="utf-8")
    (OUT_DIR / ".nojekyll").write_text("", encoding="utf-8")  # serve files as is, skip Jekyll
    print(f"wrote {OUT_DIR / 'index.html'} ({len(page.encode('utf-8'))} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
