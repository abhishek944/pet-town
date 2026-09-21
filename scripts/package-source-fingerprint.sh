#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
python3 - "$ROOT" <<'PY'
import hashlib
import os
import sys
from pathlib import Path

root = Path(sys.argv[1])
app = root / "apps" / "pet-town"
files = []
directories = [
    app / "src",
    app / "src-tauri",
    app / "public",
    root / "packages" / "pet-town-agent-broker",
]
for directory in directories:
    for path in directory.rglob("*"):
        relative = path.relative_to(root).parts
        if not path.is_file() or "target" in relative or "resources" in relative:
            continue
        files.append(path)
for path in (
    app / "index.html",
    app / "settings.html",
    app / "assistant.html",
    app / "playroom.html",
    app / "package.json",
    app / "tsconfig.json",
    app / "vite.config.ts",
    root / "package.json",
    root / "pnpm-lock.yaml",
    root / "pnpm-workspace.yaml",
    root / "turbo.json",
    root / "scripts" / "build.sh",
    root / "scripts" / "check-packaged.sh",
    root / "scripts" / "check-dmg.sh",
    root / "scripts" / "prepare-pi-runtime.sh",
    root / "scripts" / "pi-runtime-package-lock.json",
):
    if path.is_file():
        files.append(path)
digest = hashlib.sha256()
for path in sorted(set(files), key=lambda item: item.relative_to(root).as_posix()):
    relative = path.relative_to(root).as_posix().encode()
    digest.update(relative + b"\0")
    digest.update(oct(os.stat(path).st_mode & 0o777).encode() + b"\0")
    digest.update(path.read_bytes())
    digest.update(b"\0")
print(digest.hexdigest())
PY
