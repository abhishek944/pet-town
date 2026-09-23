"""Negative APNG fixture construction and rejection checks."""

import binascii
import struct
import zlib
from pathlib import Path

from apng_core import PNG_SIGNATURE
from apng_validation import validate_apng, validate_still_png


def mutate_chunk(payload: bytes, target: bytes, mutate) -> bytes:
    output = bytearray(payload)
    offset = len(PNG_SIGNATURE)
    while offset < len(output):
        length = struct.unpack(">I", output[offset : offset + 4])[0]
        kind = bytes(output[offset + 4 : offset + 8])
        if kind == target:
            data_start = offset + 8
            data = mutate(bytes(output[data_start : data_start + length]))
            output[data_start : data_start + length] = data
            crc = binascii.crc32(kind + data) & 0xFFFFFFFF
            output[data_start + length : data_start + length + 4] = struct.pack(">I", crc)
            return bytes(output)
        offset += 12 + length
    raise ValueError(f"fixture has no {target.decode()} chunk")


def expect_rejected(path: Path) -> None:
    try:
        validate_apng(path)
    except ValueError:
        return
    raise ValueError(f"negative APNG fixture was accepted: {path.name}")


def expect_still_rejected(path: Path) -> None:
    try:
        validate_still_png(path)
    except ValueError:
        return
    raise ValueError(f"negative static PNG fixture was accepted: {path.name}")


def fixture_chunk(kind: bytes, data: bytes) -> bytes:
    checksum = binascii.crc32(kind + data) & 0xFFFFFFFF
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", checksum)


def fixture_frame(width: int, height: int, pixel) -> bytes:
    rows = []
    for y in range(height):
        rows.append(b"\0" + b"".join(bytes(pixel(x, y)) for x in range(width)))
    return zlib.compress(b"".join(rows))


def insert_chunk_after(payload: bytes, target: bytes, kind: bytes, data: bytes = b"") -> bytes:
    offset = len(PNG_SIGNATURE)
    while offset < len(payload):
        length = struct.unpack(">I", payload[offset : offset + 4])[0]
        end = offset + 12 + length
        if payload[offset + 4 : offset + 8] == target:
            return payload[:end] + fixture_chunk(kind, data) + payload[end:]
        offset = end
    raise ValueError(f"fixture has no {target.decode()} chunk")


def write_fixture_still(path: Path, split_idat: bool) -> None:
    width = height = 16
    pixel = lambda x, y: (255, 0, 0, 255) if y == 0 else (0, 0, 0, 0)
    compressed = fixture_frame(width, height, pixel)
    midpoint = len(compressed) // 2
    payload = PNG_SIGNATURE + fixture_chunk(
        b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    )
    payload += fixture_chunk(b"IDAT", compressed[:midpoint] if split_idat else compressed)
    if split_idat:
        payload += fixture_chunk(b"tEXt", b"gap") + fixture_chunk(b"IDAT", compressed[midpoint:])
    payload += fixture_chunk(b"IEND", b"")
    path.write_bytes(payload)


def write_fixture_apng(path: Path, first_pixel, second_pixel, split_idat: bool = False) -> None:
    width = height = 16
    payload = PNG_SIGNATURE
    payload += fixture_chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
    payload += fixture_chunk(b"acTL", struct.pack(">II", 2, 0))
    payload += fixture_chunk(
        b"fcTL", struct.pack(">IIIIIHHBB", 0, width, height, 0, 0, 1, 10, 0, 0)
    )
    first_payload = fixture_frame(width, height, first_pixel)
    if split_idat:
        midpoint = len(first_payload) // 2
        payload += fixture_chunk(b"IDAT", first_payload[:midpoint])
        payload += fixture_chunk(b"tEXt", b"gap")
        payload += fixture_chunk(b"IDAT", first_payload[midpoint:])
    else:
        payload += fixture_chunk(b"IDAT", first_payload)
    payload += fixture_chunk(
        b"fcTL", struct.pack(">IIIIIHHBB", 1, width, height, 0, 0, 1, 10, 0, 0)
    )
    payload += fixture_chunk(
        b"fdAT", struct.pack(">I", 2) + fixture_frame(width, height, second_pixel)
    )
    payload += fixture_chunk(b"IEND", b"")
    path.write_bytes(payload)


def mutate_chunk_kind(payload: bytes, target: bytes, replacement: bytes) -> bytes:
    output = bytearray(payload)
    offset = len(PNG_SIGNATURE)
    while offset < len(output):
        length = struct.unpack(">I", output[offset : offset + 4])[0]
        kind_start = offset + 4
        if bytes(output[kind_start : kind_start + 4]) == target:
            data = bytes(output[offset + 8 : offset + 8 + length])
            output[kind_start : kind_start + 4] = replacement
            checksum = binascii.crc32(replacement + data) & 0xFFFFFFFF
            output[offset + 8 + length : offset + 12 + length] = struct.pack(">I", checksum)
            return bytes(output)
        offset += 12 + length
    raise ValueError(f"fixture has no {target.decode()} chunk")
