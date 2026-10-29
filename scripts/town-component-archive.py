#!/usr/bin/env python3
"""Build/check the optional component's link-free archive; never extract it."""

import io
import json
import plistlib
import shutil
import stat
import sys
import tarfile
import tempfile
from pathlib import Path, PurePosixPath

APP = "Pet Town.app"
METADATA = "town-component.json"
BUNDLE_ID = "dev.pet.town.native"
MAX_EXPANDED = 4 * 1024**3


def metadata(version, target):
    if target not in ("darwin-aarch64", "darwin-x86_64"):
        raise ValueError("Unsupported component target")
    return dict(formatVersion=1, version=version, target=target, bundleIdentifier=BUNDLE_ID)


def normalize(app):
    """Dereference only internal links, before signing, without following cycles."""
    root = app.resolve(strict=True)

    def copy(source, destination, ancestors):
        resolved = source.resolve(strict=True)
        if not resolved.is_relative_to(root) or resolved in ancestors:
            raise ValueError(f"External or cyclic app link: {source}")
        mode = resolved.stat().st_mode
        if stat.S_ISDIR(mode):
            destination.mkdir()
            for child in sorted(resolved.iterdir()):
                copy(child, destination / child.name, ancestors | {resolved})
            shutil.copystat(resolved, destination)
        elif stat.S_ISREG(mode):
            shutil.copy2(resolved, destination)
        else:
            raise ValueError(f"Special file in app: {source}")

    with tempfile.TemporaryDirectory(dir=app.parent) as stage:
        destination = Path(stage) / APP
        copy(root, destination, set())
        shutil.rmtree(app)
        shutil.move(destination, app)


def create(app, archive, version, target):
    data = json.dumps(metadata(version, target), separators=(",", ":")).encode() + b"\n"
    with tarfile.open(archive, "w:gz", format=tarfile.USTAR_FORMAT) as output:
        info = tarfile.TarInfo(METADATA)
        info.size = len(data)
        info.mode = 0o644
        output.addfile(info, io.BytesIO(data))
        for path in [app, *sorted(app.rglob("*"))]:
            if path.is_symlink() or not (path.is_file() or path.is_dir()):
                raise ValueError(f"Link or special file after signing: {path}")
            output.add(path, arcname=str(Path(APP) / path.relative_to(app)), recursive=False)
    validate(archive, version, target)


def validate(archive, version, target):
    expected = metadata(version, target)
    if Path(archive).stat().st_size > 1024**3:
        raise ValueError("Component download exceeds 1 GiB limit")
    seen = set()
    expanded = 0
    with tarfile.open(archive, "r:gz") as source:
        for entry in source:
            name = entry.name
            path = PurePosixPath(name)
            if (
                path.is_absolute()
                or ".." in path.parts
                or "\\" in name
                or name != str(path)
                or name in seen
                or not (entry.isdir() or entry.isfile())
                or (path.parts[0] != APP and name != METADATA)
            ):
                raise ValueError(f"Unsafe component entry: {name}")
            seen.add(name)
            if len(seen) > 100_000 or (name == METADATA and entry.size > 64 * 1024):
                raise ValueError("Component metadata or entry count exceeds limit")
            expanded += entry.size
            if expanded > MAX_EXPANDED:
                raise ValueError("Component expanded size exceeds limit")
            if name in (METADATA, f"{APP}/Contents/Info.plist"):
                if entry.size > 1024 * 1024 or not entry.isfile():
                    raise ValueError(f"Invalid metadata entry: {name}")
                data = source.extractfile(entry).read()
                if name == METADATA:
                    if json.loads(data) != expected:
                        raise ValueError("Wrong embedded component metadata")
                else:
                    info = plistlib.loads(data)
                    if (
                        info.get("CFBundleIdentifier") != BUNDLE_ID
                        or info.get("CFBundleExecutable") != "Godot"
                        or info.get("CFBundleShortVersionString") != version
                        or info.get("CFBundleVersion") != version
                    ):
                        raise ValueError("Wrong native product identity/version")
            if name in (f"{APP}/Contents/MacOS/Godot", f"{APP}/Contents/Resources/Godot.pck"):
                if not entry.isfile() or entry.size == 0:
                    raise ValueError(f"Missing component payload: {name}")
                if name.endswith("/Godot"):
                    header = source.extractfile(entry).read(8)
                    cpu = 0x100000C if target == "darwin-aarch64" else 0x1000007
                    if (
                        not entry.mode & 0o111
                        or header[:4] != b"\xcf\xfa\xed\xfe"
                        or int.from_bytes(header[4:8], "little") != cpu
                    ):
                        raise ValueError("Wrong native executable architecture or mode")
    required = {
        METADATA,
        f"{APP}/Contents/Info.plist",
        f"{APP}/Contents/MacOS/Godot",
        f"{APP}/Contents/Resources/Godot.pck",
    }
    if not required.issubset(seen):
        raise ValueError("Incomplete component archive")


if __name__ == "__main__":
    command, *args = sys.argv[1:]
    if command == "normalize" and len(args) == 1:
        normalize(Path(args[0]))
    elif command == "create" and len(args) == 4:
        create(Path(args[0]), args[1], args[2], args[3])
    elif command == "validate" and len(args) == 3:
        validate(*args)
    else:
        raise SystemExit(
            "usage: town-component-archive.py normalize APP | create APP ARCHIVE VERSION TARGET | validate ARCHIVE VERSION TARGET"
        )
