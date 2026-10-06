"""Resize bundled Ocean APNGs to 384px, staging and verifying before replacement.

Run manually after adding 512px artwork. Original working-tree bytes are backed
up under var/download-size/ocean-384-assets; Standard artwork is never resized.
Requires Pillow. Stop other asset writers during conversion. This changes
resolution, not animation timing or availability.
"""

import binascii
import hashlib
import io
import shutil
import struct
import tempfile
from fractions import Fraction
from pathlib import Path

from apng_core import PETS, PNG_SIGNATURE, ROOT, chunks
from apng_validation import validate_apng
from PIL import Image, PngImagePlugin

TARGET = (384, 384)
ALLOWED_CHUNKS = {b"IHDR", b"acTL", b"fcTL", b"IDAT", b"fdAT", b"IEND", b"sRGB"}


def digest(path):
    return hashlib.sha256(path.read_bytes()).digest()


def resize(source, candidate):
    original_chunks = list(chunks(source))
    if any(kind not in ALLOWED_CHUNKS for kind, _ in original_chunks):
        raise ValueError(f"Unsupported PNG metadata: {source}")
    delays = [data[20:24] for kind, data in original_chunks if kind == b"fcTL"]
    duration = sum(
        Fraction(numerator * 1000, denominator or 100)
        for numerator, denominator in (struct.unpack(">HH", delay) for delay in delays)
    )
    metadata = PngImagePlugin.PngInfo()
    for kind, data in original_chunks:
        if kind == b"sRGB":
            metadata.add(kind, data)
    with Image.open(source) as image:
        if image.size != (512, 512) or image.mode != "RGBA" or image.info.get("default_image"):
            raise ValueError(f"Expected 512px RGBA APNG without separate default image: {source}")
        frames, times = [], []
        for index in range(image.n_frames):
            image.seek(index)
            frames.append(image.convert("RGBA").resize(TARGET, Image.Resampling.LANCZOS))
            times.append(image.info["duration"])
        loop = image.info["loop"]
    encoded = io.BytesIO()
    frames[0].save(
        encoded,
        format="PNG",
        save_all=True,
        append_images=frames[1:],
        duration=times,
        loop=loop,
        disposal=0,
        blend=0,
        optimize=True,
        compress_level=9,
        pnginfo=metadata,
    )
    candidate.write_bytes(encoded.getvalue())
    candidate_chunks = list(chunks(candidate))
    if [data for kind, data in original_chunks if kind == b"sRGB"] != [
        data for kind, data in candidate_chunks if kind == b"sRGB"
    ]:
        raise ValueError(f"Color metadata changed: {source}")
    if sum(kind == b"fcTL" for kind, _ in candidate_chunks) != len(delays):
        raise ValueError(f"Encoder merged animation frames: {source}")
    # Preserve the original rational delays, not merely rounded milliseconds.
    output = bytearray(PNG_SIGNATURE)
    delay_index = 0
    for kind, data in candidate_chunks:
        if kind == b"fcTL":
            data = data[:20] + delays[delay_index] + data[24:]
            delay_index += 1
        output.extend(struct.pack(">I", len(data)) + kind + data)
        output.extend(struct.pack(">I", binascii.crc32(kind + data) & 0xFFFFFFFF))
    candidate.write_bytes(output)
    validate_apng(candidate, duration)
    with Image.open(candidate) as image:
        if image.size != TARGET or image.n_frames != len(frames) or image.info["loop"] != loop:
            raise ValueError(f"Animation metadata changed: {source}")
        for index, expected in enumerate(frames):
            image.seek(index)
            if (
                image.info["duration"] != times[index]
                or image.convert("RGBA").tobytes() != expected.tobytes()
            ):
                raise ValueError(f"Resized frame or timing mismatch: {source}, frame {index}")
    return source.stat().st_size, candidate.stat().st_size


def main():
    paths = sorted(PETS.glob("*/ocean-*.png"))
    pending = []
    for path in paths:
        with Image.open(path) as image:
            if image.size != TARGET:
                pending.append(path)
    if not paths:
        raise ValueError("No Ocean assets found")
    if not pending:
        print(f"All {len(paths)} Ocean animations already use 384px canvases")
        return
    # A unique run directory preserves earlier backups, including uncommitted art.
    root = ROOT / "var" / "download-size" / "ocean-384-assets"
    root.mkdir(parents=True, exist_ok=True)
    work = Path(tempfile.mkdtemp(prefix="run-", dir=root))
    unchanged = {path: digest(path) for path in PETS.rglob("*") if path.is_file()}
    originals, candidates = work / "original", work / "candidate"
    totals = [0, 0]
    for index, path in enumerate(pending, 1):
        relative = path.relative_to(PETS)
        backup, candidate = originals / relative, candidates / relative
        backup.parent.mkdir(parents=True, exist_ok=True)
        candidate.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, backup)
        if digest(backup) != unchanged[path]:
            raise ValueError(f"Source changed during backup: {path}")
        sizes = resize(backup, candidate)
        totals = [total + size for total, size in zip(totals, sizes, strict=True)]
        if index % 10 == 0 or index == len(pending):
            print(f"Validated {index}/{len(pending)} Ocean animations", flush=True)
    if any(digest(path) != expected for path, expected in unchanged.items()):
        raise ValueError("Pet assets changed during conversion; nothing replaced")
    # ponytail: per-file atomicity; use versioned bundles if all-at-once activation is needed.
    for path in pending:
        candidate = candidates / path.relative_to(PETS)
        shutil.copymode(path, candidate)
        candidate.replace(path)
    untouched = set(unchanged) - set(pending)
    if any(digest(path) != unchanged[path] for path in untouched):
        raise ValueError("Unexpected change to nonconverted pet assets")
    print(
        f"Resized {len(pending)} Ocean animations: {totals[0] / 1e6:.6f} -> {totals[1] / 1e6:.6f} MB"
    )
    print(f"Original working-tree assets preserved at {originals}")


if __name__ == "__main__":
    main()
