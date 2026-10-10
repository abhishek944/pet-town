"""Validate looping and static bundled WebP assets without dependencies."""

import struct
from pathlib import Path

from apng_core import fail


def webp_chunks(path: Path):
    data = path.read_bytes()
    if data[0:4] != b"RIFF" or data[8:12] != b"WEBP":
        fail(path, "asset is not a WebP file")
    offset = 12
    while offset < len(data):
        if offset + 8 > len(data):
            fail(path, "truncated WebP chunk header")
        kind = data[offset : offset + 4]
        (size,) = struct.unpack("<I", data[offset + 4 : offset + 8])
        start = offset + 8
        if start + size > len(data):
            fail(path, f"truncated WebP chunk {kind!r}")
        yield kind, data[start : start + size]
        offset = start + size + (size & 1)
    if offset != len(data):
        fail(path, "trailing bytes after WebP chunks")


def parse_canvas(payload: bytes) -> tuple[int, int]:
    if len(payload) < 10:
        raise ValueError("short VP8X")
    width = struct.unpack("<I", payload[4:7] + b"\0")[0] + 1
    height = struct.unpack("<I", payload[7:10] + b"\0")[0] + 1
    return width, height


def validate_animated_webp(path: Path, expected_duration_ms: int | None = None) -> None:
    canvas = None
    animated = False
    alpha = False
    looped = False
    durations: list[int] = []
    frame_count = 0
    for kind, payload in webp_chunks(path):
        if kind == b"VP8X":
            if canvas is not None:
                fail(path, "duplicate VP8X")
            flags = payload[0]
            animated = bool(flags & 0x02)
            alpha = bool(flags & 0x10)
            canvas = parse_canvas(payload)
            if not (1 <= canvas[0] <= 2048 and 1 <= canvas[1] <= 2048):
                fail(path, "canvas dimensions are outside 1..2048")
        elif kind == b"ANIM":
            if len(payload) < 6:
                fail(path, "short ANIM chunk")
            (loop,) = struct.unpack("<H", payload[4:6])
            if loop != 0:
                fail(path, "WebP animation must loop indefinitely")
            looped = True
        elif kind == b"ANMF":
            if len(payload) < 16:
                fail(path, "short ANMF chunk")
            (duration,) = struct.unpack("<I", payload[12:15] + b"\0")
            if duration == 0:
                fail(path, "frame has zero duration")
            durations.append(duration)
            frame_count += 1
        elif kind == b"ALPH":
            alpha = True
    if canvas is None:
        fail(path, "WebP has no canvas header")
    if not animated or not looped:
        fail(path, "clip asset must be a looping animated WebP")
    if frame_count < 2:
        fail(path, "clip asset must have at least 2 frames")
    if not alpha:
        fail(path, "clip asset must carry an alpha channel")
    if path.name == "sleep.webp" and (canvas != (320, 320) or frame_count != 8):
        fail(path, "sleep WebP must use the selected 320x320 eight-frame visual contract")
    if expected_duration_ms is not None and sum(durations) != expected_duration_ms:
        fail(
            path,
            f"WebP duration {sum(durations)}ms does not match clip duration "
            f"{expected_duration_ms}ms",
        )


def validate_still_webp(path: Path) -> None:
    canvas = None
    alpha = False
    animated = False
    image_data = False
    for kind, payload in webp_chunks(path):
        if kind == b"VP8X":
            flags = payload[0]
            animated = bool(flags & 0x02)
            alpha = alpha or bool(flags & 0x10)
            canvas = parse_canvas(payload)
        elif kind == b"ANIM":
            fail(path, "hold asset must be a static WebP")
        elif kind in (b"VP8 ", b"VP8L"):
            image_data = True
            if kind == b"VP8L":
                alpha = True
        elif kind == b"ALPH":
            alpha = True
    if canvas is None or not image_data:
        fail(path, "static WebP has no image payload")
    if not (1 <= canvas[0] <= 2048 and 1 <= canvas[1] <= 2048):
        fail(path, "canvas dimensions are outside 1..2048")
    if animated:
        fail(path, "hold asset must be a static WebP")
    if not alpha:
        fail(path, "hold asset must carry an alpha channel")
