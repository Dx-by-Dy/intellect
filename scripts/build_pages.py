#!/usr/bin/env python3
"""Assemble the GitHub Pages site from every <path>/docs/ folder in the repo.

Each folder <path>/docs/ that contains index.html is a page. Its files are
copied to <out>/<path>/, so the page is served at
https://<owner>.github.io/<repo>/<path>/. A root index.html listing all pages
is generated as well.

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
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_LIMIT = 1024**3  # GitHub Pages rejects sites over 1 GB
ABS_LINK = re.compile(rb"""(?:href|src)\s*=\s*["']/(?!/)""", re.I)
IN_ACTIONS = os.environ.get("GITHUB_ACTIONS") == "true"


def report(level: str, msg: str, file: Path | None = None) -> None:
    if IN_ACTIONS:
        loc = f" file={file.relative_to(ROOT).as_posix()}" if file else ""
        print(f"::{level}{loc}::{msg}")
    else:
        print(f"{level}: {msg}", file=sys.stderr)


def find_pages() -> list[Path]:
    """Return page paths relative to ROOT, shallow ones first."""
    pages = []
    for index in ROOT.rglob("docs/index.html"):
        docs = index.parent
        rel = docs.parent.relative_to(ROOT)
        # Hidden and underscore folders: .git, .check, _site and the like.
        if any(part.startswith((".", "_")) for part in docs.relative_to(ROOT).parts):
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


def page_title(index: Path) -> str:
    data = index.read_bytes()
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        report("warning", "index.html is not valid UTF-8; the page is published, but text may look garbled", index)
        text = data.decode("utf-8", errors="replace")
    m = re.search(r"<title>(.*?)</title>", text, re.S | re.I)
    return html.unescape(m.group(1).strip()) if m else ""


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

    # Plan first: decide which pages go in and where each file lands.
    owner: dict[Path, Path] = {}  # site path of a file -> page that owns it
    dirs: dict[Path, Path] = {}   # site path of a directory -> first page that needs it
    published: list[tuple[Path, list[Path]]] = []
    for rel in find_pages():
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
    items = []
    for rel, files in published:
        docs = ROOT / rel / "docs"
        for f in files:
            (out / rel / f).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(docs / f, out / rel / f)
        check_links(rel, files)
        title = page_title(docs / "index.html")
        path = rel.as_posix()
        label = html.escape(f"{path} — {title}" if title else path)
        href = html.escape("/".join(map(lambda s: s.replace("%", "%25").replace("#", "%23").replace("?", "%3F"), rel.parts)))
        items.append((path, f'<li><a href="{href}/">{label}</a></li>'))
        print(f"page: {path}/ ({len(files)} files)")

    (out / "index.html").write_text(
        "<!doctype html>\n<html>\n<head>\n<meta charset=\"utf-8\">\n"
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        "<title>intellect</title>\n"
        "<style>body{font:16px/1.6 system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem}</style>\n"
        "</head>\n<body>\n<h1>intellect</h1>\n<ul>\n" + "\n".join(li for _, li in sorted(items)) + "\n</ul>\n</body>\n</html>\n",
        encoding="utf-8",
    )
    print(f"wrote {out} ({len(published)} pages, {total / 1024**2:.1f} MB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
