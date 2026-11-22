"""Render the site's root index.html: every page grouped by year and session.

All visible text comes from site.toml at the repository root (see the comments
there); this module only lays it out. Without site.toml the page still
renders, using folder names and page <title>s.

Grouping follows the folder layout <year>/<session>/<lecture>: the first path
part is a year section, the page's parent folder is a group inside it.
Years and groups are listed newest first, pages inside a group in order.
"""
import html
import re
import tomllib
from pathlib import Path
from typing import Callable

Report = Callable[..., None]


def load_config(path: Path, report: Report) -> dict:
    """Read site.toml. A broken file must not break the deploy: warn and use defaults."""
    if not path.exists():
        return {}
    try:
        with path.open("rb") as f:
            return tomllib.load(f)
    except (tomllib.TOMLDecodeError, OSError) as e:
        report("warning", f"site.toml ignored, using defaults: {e}", path)
        return {}


def _text(value) -> str:
    return value.strip() if isinstance(value, str) else ""


def _table(value) -> dict:
    return value if isinstance(value, dict) else {}


def _natural(s: str) -> list:
    """Sort key that puts session-10 after session-9."""
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]


def _safe_url(url: str) -> str:
    return url if re.match(r"https?://", url) else ""


def _href(rel: Path) -> str:
    return "/".join(p.replace("%", "%25").replace("#", "%23").replace("?", "%3F") for p in rel.parts) + "/"


class Index:
    def __init__(self, config: dict, report: Report, config_path: Path):
        self.cfg = config
        self.report = report
        self.config_path = config_path
        self.groups = _table(config.get("groups"))
        self.pages = _table(config.get("pages"))
        self.labels = _table(config.get("labels"))

    def name(self, rel: Path) -> str:
        """Display name of a folder: explicit name, else a label pattern, else the folder name."""
        explicit = _text(_table(self.groups.get(rel.as_posix())).get("name")) or \
            _text(_table(self.pages.get(rel.as_posix())).get("label"))
        if explicit:
            return explicit
        m = re.fullmatch(r"([A-Za-z]+)-(\d+)", rel.name)
        pattern = _text(self.labels.get(m.group(1))) if m else ""
        return pattern.replace("{n}", m.group(2)) if pattern else rel.name

    def page_card(self, rel: Path, title: str, meta_desc: str) -> str:
        entry = _table(self.pages.get(rel.as_posix()))
        title = _text(entry.get("title")) or title or rel.name
        desc = _text(entry.get("description")) or meta_desc
        return self._card(_href(rel), self.name(rel), title, desc, external=False)

    def link_cards(self, group: str) -> list[str]:
        links = _table(self.groups.get(group)).get("links", [])
        cards = []
        for i, link in enumerate(links if isinstance(links, list) else []):
            link = _table(link)
            url = _safe_url(_text(link.get("url")))
            title = _text(link.get("title"))
            if not url or not title:
                self.report("warning", f'site.toml: groups."{group}".links[{i}] needs "title" and an http(s) "url"; skipped',
                            self.config_path)
                continue
            label = _text(link.get("label")) or re.sub(r"^https?://(www\.)?([^/]+).*", r"\2", url)
            cards.append(self._card(url, label, title, _text(link.get("description")), external=True))
        return cards

    @staticmethod
    def _card(href: str, label: str, title: str, desc: str, external: bool) -> str:
        e = html.escape
        attrs = ' target="_blank" rel="noopener"' if external else ""
        arrow = "↗" if external else "→"
        desc_html = f'<span class="card-desc">{e(desc)}</span>' if desc else ""
        return (f'<a class="card{" ext" if external else ""}" href="{e(href)}"{attrs}>'
                f'<span class="card-label">{e(label)}</span>'
                f'<span class="card-title">{e(title)}</span>{desc_html}'
                f'<span class="card-go" aria-hidden="true">{arrow}</span></a>')

    def render(self, pages: list[tuple[Path, str, str]]) -> str:
        e = html.escape
        # group path -> cards; pages first (in order), then the group's external links
        cards: dict[str, list[tuple[tuple, str]]] = {}
        for rel, title, desc in pages:
            group = rel.parent.as_posix() if len(rel.parts) > 1 else rel.as_posix()
            cards.setdefault(group, []).append(((0, _natural(rel.name)), self.page_card(rel, title, desc)))
        for group in self.groups:
            links = self.link_cards(group)
            if links:
                cards.setdefault(group, []).extend(((1, [i]), c) for i, c in enumerate(links))  # after pages

        years: dict[str, list[str]] = {}
        for group in cards:
            years.setdefault(group.split("/")[0], []).append(group)

        sections = []
        for year in sorted(years, key=_natural, reverse=True):
            blocks = []
            for group in sorted(years[year], key=_natural, reverse=True):
                body = "".join(c for _, c in sorted(cards[group], key=lambda x: x[0]))
                head = ""
                if group != year:
                    desc = _text(_table(self.groups.get(group)).get("description"))
                    head = (f'<div class="group-head"><h3>{e(self.name(Path(group)))}</h3>'
                            + (f"<p>{e(desc)}</p>" if desc else "") + "</div>")
                blocks.append(f'<div class="group">{head}<div class="cards">{body}</div></div>')
            sections.append(f'<section class="year"><h2>{e(self.name(Path(year)))}</h2>{"".join(blocks)}</section>')

        title = _text(self.cfg.get("title")) or "intellect"
        eyebrow = _text(self.cfg.get("eyebrow"))
        lead = _text(self.cfg.get("lead"))
        footer = _text(self.cfg.get("footer"))
        footer_url = _safe_url(_text(self.cfg.get("footer_url")))
        footer_html = ""
        if footer:
            inner = f'<a href="{e(footer_url)}">{e(footer)}</a>' if footer_url else e(footer)
            footer_html = f'<footer><div class="wrap">{inner}</div></footer>'

        return TEMPLATE.format(
            lang=e(_text(self.cfg.get("lang")) or "ru"),
            title=e(title),
            meta_desc=f'<meta name="description" content="{e(lead)}">\n' if lead else "",
            eyebrow=f'<div class="eyebrow">{e(eyebrow)}</div>' if eyebrow else "",
            lead=f'<p class="lead">{e(lead)}</p>' if lead else "",
            sections="\n".join(sections),
            footer=footer_html,
        )


def render_index(pages: list[tuple[Path, str, str]], config_path: Path, report: Report) -> str:
    """pages: (path relative to repo root, page <title>, page meta description)."""
    return Index(load_config(config_path, report), report, config_path).render(pages)


# Colors, fonts and spacing follow the lecture pages, so the site reads as one.
TEMPLATE = """<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
{meta_desc}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600&family=Unbounded:wght@500;700&display=swap">
<style>
:root {{
  --paper: #f5f6f8; --surface: #ffffff; --ink: #1a2230; --muted: #586276; --line: #d7dce5;
  --accent: #2c56c9; --accent-soft: #dfe6fa;
  --f-display: "Unbounded", "Golos Text", system-ui, sans-serif;
  --f-body: "Golos Text", system-ui, -apple-system, "Segoe UI", sans-serif;
  --radius: 12px;
  color-scheme: light;
}}
@media (prefers-color-scheme: dark) {{
  :root {{
    --paper: #10141b; --surface: #171d26; --ink: #e5e9f1; --muted: #9aa4b6; --line: #2b3442;
    --accent: #7f9ef5; --accent-soft: #212e4d;
    color-scheme: dark;
  }}
}}
* {{ box-sizing: border-box; }}
body {{
  margin: 0; background: var(--paper); color: var(--ink);
  font-family: var(--f-body); font-size: 17px; line-height: 1.6;
  min-height: 100vh; display: flex; flex-direction: column;
}}
.wrap {{
  width: 100%; max-width: 1040px; margin: 0 auto;
  padding-left: max(20px, env(safe-area-inset-left, 0px));
  padding-right: max(20px, env(safe-area-inset-right, 0px));
}}
main {{ flex: 1; padding-bottom: 64px; }}
h1, h2, h3 {{ font-family: var(--f-display); line-height: 1.2; margin: 0; text-wrap: balance; }}

header.hero {{ padding-block: 72px 40px; }}
.eyebrow {{ font-size: 13px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); font-weight: 600; }}
h1 {{ font-size: clamp(34px, 6vw, 56px); font-weight: 700; letter-spacing: -0.01em; margin-top: 12px; }}
.lead {{ font-size: 19px; color: var(--muted); max-width: 60ch; margin: 16px 0 0; }}

section.year {{ border-top: 1px solid var(--line); padding-top: 32px; margin-top: 8px; }}
section.year + section.year {{ margin-top: 48px; }}
section.year > h2 {{ font-size: clamp(22px, 3vw, 28px); font-weight: 700; color: var(--accent); }}
.group {{ margin-top: 28px; }}
.group-head h3 {{ font-size: 19px; font-weight: 500; }}
.group-head p {{ margin: 6px 0 0; color: var(--muted); max-width: 70ch; font-size: 16px; }}
.cards {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; margin-top: 14px; }}

.card {{
  position: relative; display: flex; flex-direction: column; gap: 6px;
  padding: 20px 52px 20px 20px; min-height: 128px;
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius);
  color: inherit; text-decoration: none;
  transition: border-color .15s, transform .15s, box-shadow .15s;
}}
.card:hover, .card:focus-visible {{
  border-color: var(--accent); transform: translateY(-2px);
  box-shadow: 0 6px 20px -12px var(--accent); outline: none;
}}
.card-label {{ font-size: 13px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--accent); }}
.card-title {{ font-family: var(--f-display); font-size: 18px; font-weight: 500; line-height: 1.3; }}
.card-desc {{ font-size: 15px; color: var(--muted); }}
.card-go {{
  position: absolute; top: 18px; right: 18px; width: 28px; height: 28px; border-radius: 50%;
  display: grid; place-items: center; font-size: 15px;
  background: var(--accent-soft); color: var(--accent); transition: transform .15s;
}}
.card:hover .card-go {{ transform: translateX(2px); }}
.card.ext {{ background: transparent; border-style: dashed; }}
.card.ext:hover {{ border-style: solid; }}
.card.ext:hover .card-go {{ transform: translate(2px, -2px); }}

footer {{ border-top: 1px solid var(--line); padding-block: 20px; font-size: 14px; color: var(--muted); }}
footer a {{ color: inherit; }}
footer a:hover {{ color: var(--accent); }}
@media (prefers-reduced-motion: reduce) {{ * {{ transition: none !important; }} }}
</style>
</head>
<body>
<header class="hero wrap">{eyebrow}<h1>{title}</h1>{lead}</header>
<main class="wrap">
{sections}
</main>
{footer}
</body>
</html>
"""
