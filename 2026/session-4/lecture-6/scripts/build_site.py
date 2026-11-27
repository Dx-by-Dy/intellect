#!/usr/bin/env python3
"""Generate the Markdown lecture for the shared Pages builder."""

import subprocess
import sys
from pathlib import Path


def main() -> int:
    lesson = Path(__file__).resolve().parent.parent
    result = subprocess.run(
        [sys.executable, "-m", "zensical", "build", "--clean"],
        cwd=lesson,
        check=False,
    )
    if result.returncode == 0:
        # GitHub Pages uses 404.html at the root of the combined artifact.
        (lesson / "docs" / "404.html").unlink(missing_ok=True)
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
