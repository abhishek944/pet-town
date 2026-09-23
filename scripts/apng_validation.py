"""Validate animated and still pet PNG assets."""

import binascii
import struct
from fractions import Fraction
from pathlib import Path

from apng_core import chunks, clear_frame_area, fail, frame_payload, normalized_canvas, render_frame


def validate_apng(
    path: Path, expected_duration_ms: int | None = None, require_sleep_z_trail: bool = False
) -> None:
    canvas = None
    animation = None
    frames: list[dict] = []
    seen_data = False
    seen_fdat = False
    seen_idat = False
    idat_closed = False
    next_sequence = 0
    for chunk_index, (kind, data) in enumerate(chunks(path)):
        if chunk_index == 0 and kind != b"IHDR":
            fail(path, "IHDR must be the first chunk")
        if seen_idat and kind != b"IDAT":
            idat_closed = True
        if kind == b"IHDR":
            if canvas is not None:
                fail(path, "duplicate IHDR")
            if len(data) != 13:
                fail(path, "IHDR payload length is invalid")
            width, height, depth, color, compression, filter_method, interlace = struct.unpack(
                ">IIBBBBB", data
            )
            canvas = (width, height)
            if depth != 8 or color != 6:
                fail(path, "assets must use 8-bit RGBA pixels")
            if compression != 0 or filter_method != 0 or interlace != 0:
                fail(path, "assets must use standard compression, filtering, and no interlace")
            if width < 1 or height < 1 or width > 2048 or height > 2048:
                fail(path, "canvas dimensions are outside 1..2048")
        elif kind == b"acTL":
            if animation is not None or seen_data or len(data) != 8:
                fail(path, "acTL must appear once before image data with a valid payload")
            animation = struct.unpack(">II", data)
        elif kind == b"fcTL":
            if animation is None or len(data) != 26 or (frames and not frames[-1]["data"]):
                fail(path, "frame control ordering or payload is invalid")
            control = struct.unpack(">IIIIIHHBB", data)
            sequence, width, height, x, y, _, _, disposal, blend = control
            if not frames and canvas != (width, height) or (not frames and (x != 0 or y != 0)):
                fail(path, "the default first APNG frame must fill the canvas")
            if sequence != next_sequence:
                fail(path, f"expected APNG sequence {next_sequence}, found {sequence}")
            if disposal not in (0, 1, 2) or blend not in (0, 1):
                fail(path, "invalid APNG disposal or blend operation")
            next_sequence += 1
            frames.append({"control": control, "data": []})
        elif kind == b"IDAT":
            if animation is None or len(frames) != 1 or seen_fdat or idat_closed:
                fail(path, "IDAT is allowed only in one consecutive first-frame run")
            seen_data = True
            seen_idat = True
            frames[0]["data"].append(data)
        elif kind == b"fdAT":
            if not frames or len(frames) < 2 or len(data) < 5:
                fail(path, "frame data appears before frame control")
            sequence = struct.unpack(">I", data[:4])[0]
            if sequence != next_sequence:
                fail(path, f"expected APNG sequence {next_sequence}, found {sequence}")
            next_sequence += 1
            seen_data = True
            seen_fdat = True
            frames[-1]["data"].append(data[4:])
        elif kind == b"IEND" and frames and not frames[-1]["data"]:
            fail(path, "final frame has no image data")
    if canvas is None or animation is None:
        fail(path, "asset is not an APNG")
    declared_frames, plays = animation
    if declared_frames < 2 or declared_frames != len(frames):
        fail(path, "APNG frame count is invalid")
    if require_sleep_z_trail and (canvas != (320, 320) or declared_frames != 8):
        fail(path, "sleep APNG must use the selected 320x320 eight-frame visual contract")
    if plays != 0:
        fail(path, "APNG must loop indefinitely")
    canvas_width, canvas_height = canvas
    canvas_payload = bytearray(canvas_width * canvas_height * 4)
    frame_signatures = set()
    previous_display = None
    total_duration = Fraction(0)
    for index, frame in enumerate(frames, 1):
        control = frame["control"]
        _, width, height, x, y, numerator, denominator, disposal, _ = control
        if width < 1 or height < 1 or x + width > canvas_width or y + height > canvas_height:
            fail(path, f"frame {index} exceeds the canvas")
        if numerator == 0:
            fail(path, f"frame {index} has zero duration")
        visible, payload = frame_payload(path, width, height, frame["data"])
        if visible < max(16, width * height // 1000):
            fail(path, f"frame {index} is effectively blank ({visible} visible pixels)")
        before_frame = canvas_payload.copy()
        render_frame(canvas_payload, canvas_width, control, payload)
        displayed = normalized_canvas(canvas_payload)
        alphas = displayed[3::4]
        transparent = sum(alpha == 0 for alpha in alphas)
        if transparent < max(16, canvas_width * canvas_height // 100):
            fail(path, f"frame {index} lacks a meaningful fully transparent area")
        if require_sleep_z_trail:
            upper = displayed[: canvas_width * 90 * 4]
            cyan_signal = sum(
                upper[offset + 3] > 100
                and upper[offset + 2] > 180
                and upper[offset + 1] > 110
                and upper[offset + 2] - upper[offset] > 60
                for offset in range(0, len(upper), 4)
            )
            if cyan_signal < 100:
                fail(path, f"frame {index} lacks the electric rising Z signal")
            lower_alphas = displayed[canvas_width * (canvas_height // 2) * 4 :][3::4]
            if sum(alpha > 16 for alpha in lower_alphas) < 1_000:
                fail(path, f"frame {index} loses the sleeping character body")
        if previous_display is not None:
            changed = sum(
                displayed[offset : offset + 4] != previous_display[offset : offset + 4]
                for offset in range(0, len(displayed), 4)
            )
            if changed < max(16, canvas_width * canvas_height // 5000):
                fail(path, f"frame {index} has too little visible change ({changed} pixels)")
        frame_signatures.add(binascii.crc32(displayed))
        previous_display = displayed
        total_duration += Fraction(numerator * 1000, denominator or 100)
        if disposal == 1:
            clear_frame_area(canvas_payload, canvas_width, control)
        elif disposal == 2:
            canvas_payload = before_frame
    if len(frame_signatures) < 2:
        fail(path, "APNG displayed frames do not change")
    if expected_duration_ms is not None and total_duration != expected_duration_ms:
        fail(
            path,
            f"APNG duration {float(total_duration):g}ms does not match clip duration {expected_duration_ms}ms",
        )


def validate_still_png(path: Path) -> None:
    canvas = None
    compressed = []
    seen_idat = False
    idat_closed = False
    for chunk_index, (kind, data) in enumerate(chunks(path)):
        if chunk_index == 0 and kind != b"IHDR":
            fail(path, "IHDR must be the first chunk")
        if seen_idat and kind != b"IDAT":
            idat_closed = True
        if kind == b"IHDR":
            if canvas is not None or len(data) != 13:
                fail(path, "static PNG has an invalid IHDR")
            width, height, depth, color, compression, filter_method, interlace = struct.unpack(
                ">IIBBBBB", data
            )
            if (
                depth != 8
                or color != 6
                or compression != 0
                or filter_method != 0
                or interlace != 0
                or width < 1
                or height < 1
                or width > 2048
                or height > 2048
            ):
                fail(path, "static PNG must use safe non-interlaced 8-bit RGBA dimensions")
            canvas = (width, height)
        elif kind == b"IDAT":
            if idat_closed:
                fail(path, "static PNG IDAT chunks must be consecutive")
            seen_idat = True
            compressed.append(data)
        elif kind in (b"acTL", b"fcTL", b"fdAT"):
            fail(path, "hold asset must be a static PNG")
    if canvas is None or not compressed:
        fail(path, "static PNG has no image payload")
    width, height = canvas
    visible, payload = frame_payload(path, width, height, compressed)
    if visible < max(16, width * height // 1000):
        fail(path, "static PNG is effectively blank")
    transparent = sum(alpha == 0 for alpha in payload[3::4])
    if transparent < max(16, width * height // 100):
        fail(path, "static PNG lacks a meaningful fully transparent area")
