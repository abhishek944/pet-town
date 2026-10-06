"""Store byte-identical resources once in an unencrypted standalone Godot PCK v4.

Every resource path, size, checksum and decoded byte remains unchanged. Godot's
PCK reader resolves each path independently using its payload offset and size.
"""

import hashlib
import os
import stat
import struct
import sys
import tempfile
from pathlib import Path

HEADER = struct.Struct("<6I2Q")
MAGIC = 0x43504447


def exact(stream, size):
    data = stream.read(size)
    if len(data) != size:
        raise ValueError("Truncated PCK")
    return data


def directory(stream):
    stream.seek(0, os.SEEK_END)
    length = stream.tell()
    stream.seek(0)
    header = HEADER.unpack(exact(stream, HEADER.size))
    magic, version, _, _, _, flags, base, index = header
    if magic != MAGIC or version != 4 or flags != 2:
        raise ValueError("Only standalone, unencrypted, nonsparse PCK v4 is supported")
    if not HEADER.size <= base <= index <= length - 4:
        raise ValueError("Invalid PCK header offsets")
    stream.seek(index)
    count = struct.unpack("<I", exact(stream, 4))[0]
    if count > (length - index - 4) // 40:
        raise ValueError("Invalid PCK resource count")
    entries, names = [], set()
    for _ in range(count):
        size = struct.unpack("<I", exact(stream, 4))[0]
        if not 0 < size <= length - stream.tell() - 36:
            raise ValueError("Invalid PCK path length")
        path = exact(stream, size)
        name = path.rstrip(b"\0").decode("utf-8")
        if not name or "\0" in name or name in names:
            raise ValueError("Invalid or duplicate PCK path")
        names.add(name)
        offset, size = struct.unpack("<2Q", exact(stream, 16))
        digest = exact(stream, 16)
        file_flags = struct.unpack("<I", exact(stream, 4))[0]
        if file_flags or base + offset + size > index:
            raise ValueError("Unsupported PCK resource flags or invalid payload bounds")
        entries.append((path, offset, size, digest))
    if stream.tell() != length:
        raise ValueError("Unexpected data after PCK directory")
    return header, entries


def payload(stream, base, entry):
    _, offset, size, digest = entry
    stream.seek(base + offset)
    data = exact(stream, size)
    if hashlib.md5(data).digest() != digest:
        raise ValueError("PCK resource checksum mismatch")
    return data


def equivalent(source, candidate):
    """Validate the complete real artifact before replacing it, not only hashes."""
    with source.open("rb") as original, candidate.open("rb") as packed:
        old_header, old_entries = directory(original)
        new_header, new_entries = directory(packed)
        if old_header[:7] != new_header[:7] or len(old_entries) != len(new_entries):
            raise ValueError("PCK header or resource count changed")
        for old, new in zip(old_entries, new_entries, strict=True):
            if (old[0], old[2:]) != (new[0], new[2:]):
                raise ValueError("PCK resource path or metadata changed")
            if payload(original, old_header[6], old) != payload(packed, new_header[6], new):
                raise ValueError("PCK resource bytes changed")


def deduplicate(path):
    original_size = path.stat().st_size
    temporary = None
    try:
        with (
            path.open("rb") as source,
            tempfile.NamedTemporaryFile(
                mode="w+b", prefix=f".{path.name}.", dir=path.parent, delete=False
            ) as output,
        ):
            temporary = Path(output.name)
            os.fchmod(output.fileno(), stat.S_IMODE(path.stat().st_mode))
            header, entries = directory(source)
            base = header[6]
            source.seek(0)
            output.write(exact(source, base))
            locations, rewritten = {}, []
            duplicates = 0
            for entry in entries:
                data = payload(source, base, entry)
                key = (len(data), hashlib.sha256(data).digest())
                if key in locations:
                    offset = locations[key]
                    end = output.tell()
                    output.seek(base + offset)
                    if exact(output, len(data)) != data:
                        raise ValueError("PCK content hash collision")
                    output.seek(end)
                    duplicates += 1
                else:
                    offset = output.tell() - base
                    locations[key] = offset
                    output.write(data)
                    output.write(b"\0" * (-output.tell() % 16))
                rewritten.append((entry[0], offset, entry[2], entry[3]))
            index = output.tell()
            output.write(struct.pack("<I", len(rewritten)))
            for name, offset, size, digest in rewritten:
                output.write(struct.pack("<I", len(name)))
                output.write(name)
                output.write(struct.pack("<2Q", offset, size))
                output.write(digest)
                output.write(struct.pack("<I", 0))
            output.seek(32)
            output.write(struct.pack("<Q", index))
            output.flush()
            os.fsync(output.fileno())
        equivalent(path, temporary)
        packed_size = temporary.stat().st_size
        if packed_size > original_size:
            raise ValueError("Deduplicated PCK unexpectedly grew")
        temporary.replace(path)
        print(
            f"PCK deduplication: {len(entries)} paths unchanged, {duplicates} shared payloads; "
            f"{original_size / 1e6:.3f} -> {packed_size / 1e6:.3f} MB"
        )
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("usage: deduplicate-godot-pack.py /path/to/generated-world.pck")
    deduplicate(Path(sys.argv[1]))
