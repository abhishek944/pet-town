"""PNG chunk and pixel helpers for pet asset validation."""

import binascii
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PETS = ROOT / "apps" / "pet-town" / "src" / "pets"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
KNOWN_CRITICAL_CHUNKS = {b"IHDR", b"PLTE", b"IDAT", b"IEND"}


def fail(path: Path, message: str) -> None:
    try:
        display = path.relative_to(ROOT)
    except ValueError:
        display = path
    raise ValueError(f"{display}: {message}")


def chunks(path: Path):
    payload = path.read_bytes()
    if not payload.startswith(PNG_SIGNATURE):
        fail(path, "invalid PNG signature")
    offset = len(PNG_SIGNATURE)
    seen_iend = False
    while offset < len(payload):
        if seen_iend:
            fail(path, "data appears after IEND")
        if offset + 12 > len(payload):
            fail(path, "truncated PNG chunk")
        length = struct.unpack(">I", payload[offset : offset + 4])[0]
        kind = payload[offset + 4 : offset + 8]
        end = offset + 12 + length
        if end > len(payload):
            fail(path, "truncated PNG payload")
        data = payload[offset + 8 : offset + 8 + length]
        expected = struct.unpack(">I", payload[offset + 8 + length : end])[0]
        actual = binascii.crc32(kind + data) & 0xFFFFFFFF
        if actual != expected:
            fail(path, f"invalid {kind.decode('ascii', 'replace')} checksum")
        if any(byte not in range(65, 91) and byte not in range(97, 123) for byte in kind):
            fail(path, "chunk type must contain only ASCII letters")
        if kind[2] & 0x20:
            fail(path, f"chunk {kind.decode()} uses the reserved lowercase bit")
        if not kind[0] & 0x20 and kind not in KNOWN_CRITICAL_CHUNKS:
            fail(path, f"unknown critical chunk {kind.decode()}")
        if kind == b"IEND":
            if data:
                fail(path, "IEND must be empty")
            seen_iend = True
        yield kind, data
        offset = end
    if not seen_iend:
        fail(path, "missing IEND")


def paeth(left: int, above: int, upper_left: int) -> int:
    estimate = left + above - upper_left
    distances = (abs(estimate - left), abs(estimate - above), abs(estimate - upper_left))
    return (left, above, upper_left)[distances.index(min(distances))]


def frame_payload(
    path: Path, width: int, height: int, compressed: list[bytes]
) -> tuple[int, bytes]:
    try:
        raw = zlib.decompress(b"".join(compressed))
    except zlib.error as error:
        fail(path, f"invalid compressed frame: {error}")
    stride = width * 4
    if len(raw) != (stride + 1) * height:
        fail(path, "unexpected RGBA frame payload size")
    previous = bytearray(stride)
    visible = 0
    decoded = bytearray()
    for row_index in range(height):
        start = row_index * (stride + 1)
        filter_type = raw[start]
        source = raw[start + 1 : start + 1 + stride]
        row = bytearray(stride)
        for index, value in enumerate(source):
            left = row[index - 4] if index >= 4 else 0
            above = previous[index]
            upper_left = previous[index - 4] if index >= 4 else 0
            if filter_type == 0:
                prediction = 0
            elif filter_type == 1:
                prediction = left
            elif filter_type == 2:
                prediction = above
            elif filter_type == 3:
                prediction = (left + above) // 2
            elif filter_type == 4:
                prediction = paeth(left, above, upper_left)
            else:
                fail(path, f"unsupported PNG filter {filter_type}")
            row[index] = (value + prediction) & 0xFF
        visible += sum(alpha > 0 for alpha in row[3::4])
        decoded.extend(row)
        previous = row
    return visible, bytes(decoded)


def composite_over(destination: bytes, source: bytes) -> bytes:
    source_alpha = source[3]
    if source_alpha == 0:
        return destination
    if source_alpha == 255:
        return source
    destination_alpha = destination[3]
    output_alpha = source_alpha + destination_alpha * (255 - source_alpha) // 255
    if output_alpha == 0:
        return b"\0\0\0\0"
    channels = [
        (
            source[index] * source_alpha * 255
            + destination[index] * destination_alpha * (255 - source_alpha)
        )
        // (output_alpha * 255)
        for index in range(3)
    ]
    return bytes((*channels, output_alpha))


def normalized_canvas(canvas: bytearray) -> bytes:
    output = bytearray(canvas)
    for index in range(0, len(output), 4):
        if output[index + 3] == 0:
            output[index : index + 3] = b"\0\0\0"
    return bytes(output)


def render_frame(canvas: bytearray, canvas_width: int, control: tuple, payload: bytes) -> None:
    _, width, height, x, y, _, _, _, blend = control
    for row in range(height):
        for column in range(width):
            source_index = (row * width + column) * 4
            target_index = ((y + row) * canvas_width + x + column) * 4
            source = payload[source_index : source_index + 4]
            if blend == 0:
                canvas[target_index : target_index + 4] = source
            else:
                destination = bytes(canvas[target_index : target_index + 4])
                canvas[target_index : target_index + 4] = composite_over(destination, source)


def clear_frame_area(canvas: bytearray, canvas_width: int, control: tuple) -> None:
    _, width, height, x, y, _, _, _, _ = control
    clear_row = b"\0" * (width * 4)
    for row in range(height):
        start = ((y + row) * canvas_width + x) * 4
        canvas[start : start + len(clear_row)] = clear_row
