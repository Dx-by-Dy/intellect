#!/usr/bin/env python3
"""Assemble the GitHub Pages site from every <path>/docs/ folder in the repo.

A lesson folder may generate its docs/ instead of committing it: if
<path>/scripts/build_site.py exists, it is run first (from <path>/, with the
same Python) and is expected to write <path>/docs/. If it fails, the page is
skipped with an error, so a stale or half-written docs/ is never published.

Each folder <path>/docs/ that contains index.html is a page. Its files are
copied to <out>/<path>/, so the page is served at
https://<owner>.github.io/<repo>/<path>/. The root index.html lists all pages
grouped by year and session; its texts come from site.toml (scripts/site_index.py).

One bad page must not take the whole site down, so problems are reported and
the page is skipped instead of aborting:
  - a page that cannot be read or copied is skipped with a warning;
  - a page whose files would land on another page's files is skipped with an
    error that names both folders (shallower pages win);
  - a page that is not valid UTF-8 or uses root-absolute links ("/x") is still
    published, with a warning.
The script fails only when no page could be published or the site is too big
for GitHub Pages.

Inside GitHub Actions the messages are printed as workflow annotations, so
they show up on the run summary page.

Usage: python3 scripts/build_pages.py [out_dir]    (default: _site)
"""
import html
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

from site_index import render_index

ROOT = Path(__file__).resolve().parent.parent
SITE_LIMIT = 1024**3  # GitHub Pages rejects sites over 1 GB
ABS_LINK = re.compile(rb"""(?:href|src)\s*=\s*["']/(?!/)""", re.I)
IN_ACTIONS = os.environ.get("GITHUB_ACTIONS") == "true"
BUILD_SCRIPT = Path("scripts") / "build_site.py"  # per-lesson page generator
BUILD_TIMEOUT = 300  # seconds per build script


def report(level: str, msg: str, file: Path | None = None) -> None:
    if IN_ACTIONS:
        loc = f" file={file.relative_to(ROOT).as_posix()}" if file else ""
        print(f"::{level}{loc}::{msg}")
    else:
        print(f"{level}: {msg}", file=sys.stderr)


def hidden(rel: Path) -> bool:
    """Hidden and underscore folders: .git, .check, _site and the like."""
    return any(part.startswith((".", "_")) for part in rel.parts)


def run_builders() -> set[Path]:
    """Run every <path>/scripts/build_site.py. Return lesson paths whose build failed."""
    failed = set()
    for script in sorted(ROOT.rglob(BUILD_SCRIPT.as_posix())):
        lesson = script.parent.parent
        rel = lesson.relative_to(ROOT)
        if rel == Path(".") or hidden(rel):  # the root scripts/ is this shared code
            continue
        try:
            res = subprocess.run([sys.executable, str(script)], cwd=lesson, capture_output=True,
                                 text=True, errors="replace", timeout=BUILD_TIMEOUT)
        except (OSError, subprocess.TimeoutExpired) as e:
            reason = f"timed out after {BUILD_TIMEOUT} s" if isinstance(e, subprocess.TimeoutExpired) else str(e)
            report("error", f"page {rel.as_posix()}/ skipped: {BUILD_SCRIPT.as_posix()} {reason}", script)
            failed.add(rel)
            continue
        out = (res.stdout + res.stderr).strip()
        if res.returncode != 0:
            tail = " | ".join(out.splitlines()[-5:]) or "no output"
            report("error", f"page {rel.as_posix()}/ skipped: {BUILD_SCRIPT.as_posix()} exited with code "
                   f"{res.returncode}: {tail}", script)
            failed.add(rel)
            continue
        print(f"built: {rel.as_posix()}/ via {BUILD_SCRIPT.as_posix()}")
        for line in out.splitlines():
            print(f"  {line}")
        if not (lesson / "docs" / "index.html").is_file():
            report("warning", f"{BUILD_SCRIPT.as_posix()} succeeded but wrote no docs/index.html, "
                   "so there is no page to publish", script)
    return failed


def find_pages() -> list[Path]:
    """Return page paths relative to ROOT, shallow ones first."""
    pages = []
    for index in ROOT.rglob("docs/index.html"):
        docs = index.parent
        rel = docs.parent.relative_to(ROOT)
        if hidden(docs.relative_to(ROOT)):
            continue
        if rel == Path("."):
            report("warning", "docs/ at the repository root is ignored: the site root is the generated page list", index)
            continue
        pages.append(rel)
    return sorted(pages, key=lambda p: (len(p.parts), p.as_posix()))


def page_files(rel: Path) -> list[Path]:
    """Files of a page relative to its docs/ folder. Raises OSError on unreadable entries."""
    docs = ROOT / rel / "docs"
    def fail(err: OSError) -> None:
        raise err

    files = []
    for dirpath, _dirs, names in os.walk(docs, onerror=fail):
        for name in names:
            path = Path(dirpath) / name
            if not path.is_file():  # broken symlink, socket, ...
                raise OSError(f"not a regular file: {path.relative_to(ROOT)}")
            files.append(path.relative_to(docs))
    return files


def page_meta(index: Path) -> tuple[str, str]:
    """Return the page's <title> and <meta name="description">."""
    data = index.read_bytes()
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        report("warning", "index.html is not valid UTF-8; the page is published, but text may look garbled", index)
        text = data.decode("utf-8", errors="replace")
    m = re.search(r"<title>(.*?)</title>", text, re.S | re.I)
    title = html.unescape(m.group(1).strip()) if m else ""
    m = re.search(r"""<meta\s+name=["']description["']\s+content=["'](.*?)["']""", text, re.S | re.I)
    desc = html.unescape(m.group(1).strip()) if m else ""
    return title, desc


def check_links(rel: Path, files: list[Path]) -> None:
    docs = ROOT / rel / "docs"
    for f in files:
        if f.suffix.lower() not in (".html", ".htm", ".css", ".js"):
            continue
        if ABS_LINK.search((docs / f).read_bytes()):
            report("warning", f'root-absolute link (href="/..." or src="/...") will not resolve: '
                   f"the page is served under /<repo>/{rel.as_posix()}/, use relative links", docs / f)


def main() -> int:
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "_site"
    out = out.resolve()
    if out == ROOT or ROOT.is_relative_to(out):
        print(f"error: refusing to use {out} as output dir", file=sys.stderr)
        return 1

    failed = run_builders()

    # Plan first: decide which pages go in and where each file lands.
    owner: dict[Path, Path] = {}  # site path of a file -> page that owns it
    dirs: dict[Path, Path] = {}   # site path of a directory -> first page that needs it
    published: list[tuple[Path, list[Path]]] = []
    for rel in find_pages():
        if rel in failed:
            continue
        index = ROOT / rel / "docs" / "index.html"
        try:
            files = page_files(rel)
        except OSError as e:
            report("warning", f"page {rel.as_posix()}/ skipped: {e}", index)
            continue
        clash = None
        for f in files:
            dest = rel / f
            if dest in owner or dest in dirs:
                clash = owner.get(dest) or dirs[dest]
            else:
                clash = next((owner[p] for p in dest.parents if p in owner), None)
            if clash is not None:
                break
        if clash is not None:
            report("error", f"page {rel.as_posix()}/ skipped: its file {dest.as_posix()} collides with page "
                   f"{clash.as_posix()}/ (from {clash.as_posix()}/docs/); rename one of the folders", index)
            continue
        for f in files:
            owner[rel / f] = rel
            for p in (rel / f).parents:
                dirs.setdefault(p, rel)
        published.append((rel, files))

    if not published:
        print("error: no page to publish (expected <path>/docs/index.html)", file=sys.stderr)
        return 1
    total = sum((ROOT / rel / "docs" / f).stat().st_size for rel, files in published for f in files)
    if total > SITE_LIMIT:
        print(f"error: site is {total / 1024**2:.0f} MB, GitHub Pages allows at most 1024 MB", file=sys.stderr)
        return 1

    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    pages = []
    for rel, files in published:
        docs = ROOT / rel / "docs"
        for f in files:
            (out / rel / f).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(docs / f, out / rel / f)
        check_links(rel, files)
        pages.append((rel, *page_meta(docs / "index.html")))
        print(f"page: {rel.as_posix()}/ ({len(files)} files)")

    (out / "index.html").write_text(render_index(pages, ROOT / "site.toml", report), encoding="utf-8")
    print(f"wrote {out} ({len(published)} pages, {total / 1024**2:.1f} MB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
