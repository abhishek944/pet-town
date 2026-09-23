"""Enforce the repository's 199-line limit on maintained text files."""

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAX_LINES = 199
EXCLUDED_SUFFIXES = {
    ".tscn",  # Godot scene serialization
    ".css",
    ".scss",
    ".sass",
    ".less",  # Styles
    ".html",
    ".htm",
    ".svg",
    ".xml",  # Markup
    ".md",
    ".mdx",
    ".rst",
    ".txt",  # Documentation
}
LOCK_NAMES = {"pnpm-lock.yaml", "package-lock.json"}


def listed_paths() -> set[Path]:
    result = subprocess.check_output(
        ["git", "-C", str(ROOT), "ls-files", "--cached", "--others", "--exclude-standard", "-z"]
    )
    return {ROOT / name.decode() for name in result.split(b"\0") if name}


def included(path: Path) -> bool:
    if path.suffix.lower() in EXCLUDED_SUFFIXES:
        return False
    name = path.name.lower()
    return not (
        name in LOCK_NAMES
        or path.suffix.lower() == ".lock"
        or name.endswith(("-lock.json", "-lock.yaml", "-lock.yml"))
    )


def main() -> int:
    failures = []
    for path in sorted(listed_paths()):
        if not path.is_file() or not included(path):
            continue
        try:
            contents = path.read_bytes()
            if b"\0" in contents:
                continue
            lines = len(contents.decode("utf-8").splitlines())
        except UnicodeDecodeError:
            continue
        if lines > MAX_LINES:
            failures.append(f"{path.relative_to(ROOT)}: {lines} lines (maximum {MAX_LINES})")
    if failures:
        print("\n".join(failures))
        return 1
    print("Maintained text file line limits: pass")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
