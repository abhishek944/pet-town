#!/usr/bin/env python3
"""Compute the agent-review fingerprint without buffering large binary diffs."""
import argparse
import hashlib
import json
import os
import posixpath
import stat
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("--base", default="HEAD")
parser.add_argument("--scope", action="append", default=[])
parser.add_argument("--format", choices=("hash", "json"), default="hash")
args = parser.parse_args()
root = Path(subprocess.check_output(["git", "rev-parse", "--show-toplevel"], text=True).strip())
base = subprocess.check_output(["git", "rev-parse", "--verify", f"{args.base}^{{commit}}"], text=True).strip()
scopes = sorted(set(posixpath.normpath(p.replace("\\", "/").strip() or ".") for p in (args.scope or ["."])))
if any(p.startswith("/") or p == ".." or p.startswith("../") for p in scopes):
    raise SystemExit("FAIL: review scope must stay inside the repository")

def update_process(digest, command):
    process = subprocess.Popen(command, stdout=subprocess.PIPE)
    assert process.stdout is not None
    for chunk in iter(lambda: process.stdout.read(1024 * 1024), b""):
        digest.update(chunk)
    if process.wait() != 0:
        raise SystemExit("FAIL: could not compute review diff")

digest = hashlib.sha256()
digest.update(b"BASE\0" + base.encode() + b"\0TARGET\0WORKTREE")
for scope in scopes:
    digest.update(b"\0SCOPE\0" + scope.encode())
digest.update(b"\0DIFF\0")
binary_scopes = {"bin/macos-arm64/pet-village", "bin/macos-x64/pet-village"}
diff_scopes = [scope for scope in scopes if scope not in binary_scopes]
pathspec = ["--", *diff_scopes]
update_process(digest, ["git", "-C", str(root), "diff", "--binary", "--no-ext-diff", base, *pathspec])
untracked = subprocess.check_output(["git", "-C", str(root), "ls-files", "--others", "--exclude-standard", "-z", *pathspec]).split(b"\0")
for raw_path in sorted(path for path in untracked if path):
    path = raw_path.decode("utf-8", "surrogateescape")
    info = os.lstat(root / path)
    digest.update(b"\0UNTRACKED\0" + raw_path + b"\0")
    digest.update(oct(stat.S_IFMT(info.st_mode) | stat.S_IMODE(info.st_mode)).encode() + b"\0")
    if stat.S_ISLNK(info.st_mode):
        digest.update(os.readlink(root / path).encode("utf-8", "surrogateescape"))
    elif stat.S_ISREG(info.st_mode):
        with open(root / path, "rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
    else:
        raise SystemExit(f"FAIL: unsupported untracked file type: {path}")
for path in sorted(binary_scopes.intersection(scopes)):
    info = os.lstat(root / path)
    if not stat.S_ISREG(info.st_mode):
        raise SystemExit(f"FAIL: shipped binary must be a regular file: {path}")
    digest.update(b"\0EXACT_BINARY\0" + path.encode() + b"\0")
    digest.update(oct(stat.S_IMODE(info.st_mode)).encode() + b"\0")
    with open(root / path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
result = {"fingerprint": digest.hexdigest(), "base_ref": args.base, "base_sha": base, "target_ref": "WORKTREE", "target_sha": None, "scope": scopes, "streamedBinaryDiff": True, "exactBinaryPaths": sorted(binary_scopes.intersection(scopes))}
print(result["fingerprint"] if args.format == "hash" else json.dumps(result, sort_keys=True))
