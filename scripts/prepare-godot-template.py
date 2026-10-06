"""Cache the official, version-matched macOS game-only release executable."""

import hashlib
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BINARY = "godot_macos_release.universal"


def digest(path):
    with path.open("rb") as source:
        return hashlib.file_digest(source, "sha512").hexdigest()


def download(url, destination):
    subprocess.run(
        [
            "curl",
            "--fail",
            "--location",
            "--retry",
            "3",
            "--connect-timeout",
            "15",
            "--max-time",
            "900",
            url,
            "--output",
            str(destination),
        ],
        check=True,
        stdout=sys.stderr,
    )


def prepare(editor):
    version = subprocess.check_output([str(editor), "--version"], text=True).strip()
    match = re.match(r"^(\d+\.\d+(?:\.\d+)?)\.stable\.official(?:\.|$)", version)
    if not match:
        raise ValueError("Release packaging requires an official stable Godot editor")
    number = match[1]
    template_version = f"{number}.stable"
    cache = ROOT / "var/godot-runtime/export-templates" / template_version
    cache.mkdir(parents=True, exist_ok=True)
    executable = cache / BINARY
    checksum = cache / f"{BINARY}.sha512"
    if (
        executable.is_file()
        and checksum.is_file()
        and digest(executable) == checksum.read_text().strip()
    ):
        return executable

    release = f"https://github.com/godotengine/godot-builds/releases/download/{number}-stable"
    name = f"Godot_v{number}-stable_export_templates.tpz"
    with tempfile.TemporaryDirectory(prefix=".download-", dir=cache) as temporary:
        work = Path(temporary)
        archive = work / name
        sums = work / "SHA512-SUMS.txt"
        download(f"{release}/{name}", archive)
        download(f"{release}/SHA512-SUMS.txt", sums)
        records = [line.split() for line in sums.read_text().splitlines()]
        expected = [
            parts[0] for parts in records if len(parts) == 2 and parts[1].lstrip("*") == name
        ]
        if expected != [digest(archive)]:
            raise ValueError("Official Godot export-template archive checksum mismatch")
        macos = work / "macos.zip"
        with zipfile.ZipFile(archive) as templates:
            if templates.read("templates/version.txt").decode().strip() != template_version:
                raise ValueError("Godot editor and export-template versions differ")
            with templates.open("templates/macos.zip") as source, macos.open("wb") as output:
                shutil.copyfileobj(source, output)
        staged = work / BINARY
        with zipfile.ZipFile(macos) as bundle:
            member = f"macos_template.app/Contents/MacOS/{BINARY}"
            with bundle.open(member) as source, staged.open("wb") as output:
                shutil.copyfileobj(source, output)
        staged.chmod(0o755)
        staged_checksum = work / checksum.name
        staged_checksum.write_text(digest(staged) + "\n")
        staged.replace(executable)
        staged_checksum.replace(checksum)
    return executable


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: prepare-godot-template.py /path/to/editor/Contents/MacOS/Godot")
    print(prepare(Path(sys.argv[1])))
