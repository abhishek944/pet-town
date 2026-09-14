#!/usr/bin/env python3
"""Split a reviewed 2x4 transparent sprite sheet into a deterministic APNG."""

import argparse
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

parser = argparse.ArgumentParser()
parser.add_argument("sheet")
parser.add_argument("output")
parser.add_argument("--total-duration-ms", type=int, default=900)
parser.add_argument("--width", type=int, default=320)
parser.add_argument("--height", type=int, default=240)
parser.add_argument("--contact")
parser.add_argument("--remove-light-background", action="store_true")
parser.add_argument("--sleep-z-trail", action="store_true")
args = parser.parse_args()

if args.total_duration_ms < 80 or args.width < 1 or args.height < 1:
    raise SystemExit("duration and output dimensions must be positive")
sheet = Image.open(args.sheet).convert("RGBA")
if args.remove_light_background:
    pixels = sheet.load()
    background = set()
    queue = deque((x, y) for x in range(sheet.width) for y in (0, sheet.height - 1))
    queue.extend((x, y) for y in range(sheet.height) for x in (0, sheet.width - 1))
    while queue:
        x, y = queue.popleft()
        if (x, y) in background:
            continue
        red, green, blue, _ = pixels[x, y]
        if min(red, green, blue) < 210 or max(red, green, blue) - min(red, green, blue) > 18:
            continue
        background.add((x, y))
        queue.extend(
            (nx, ny)
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))
            if 0 <= nx < sheet.width and 0 <= ny < sheet.height
        )
    for x, y in background:
        red, green, blue, _ = pixels[x, y]
        pixels[x, y] = red, green, blue, 0
alpha = sheet.getchannel("A")
transparent = sum(1 for value in alpha.get_flattened_data() if value < 250)
if transparent / (sheet.width * sheet.height) < 0.02:
    raise SystemExit("sheet lacks a meaningful transparent background")


def spans(projection, minimum_gap=8):
    occupied = [index for index, value in enumerate(projection) if value]
    if not occupied:
        return []
    groups, start, previous = [], occupied[0], occupied[0]
    for index in occupied[1:]:
        if index - previous > minimum_gap:
            groups.append((start, previous + 1))
            start = index
        previous = index
    groups.append((start, previous + 1))
    return groups


def reduce_spans(groups, expected):
    if len(groups) < expected:
        raise SystemExit(f"expected {expected} separated figures, found {len(groups)}")
    seeds = sorted(sorted(groups, key=lambda item: item[1] - item[0], reverse=True)[:expected])
    assigned = [[seed] for seed in seeds]
    for group in groups:
        if group in seeds:
            continue
        center = (group[0] + group[1]) / 2
        nearest = min(range(expected), key=lambda index: abs(center - sum(seeds[index]) / 2))
        assigned[nearest].append(group)
    return [
        (min(item[0] for item in cluster), max(item[1] for item in cluster)) for cluster in assigned
    ]


if sheet.width % 2 or sheet.height % 4:
    raise SystemExit("sprite sheet dimensions must divide evenly into a 2x4 grid")
cell_width = sheet.width // 2
cell_height = sheet.height // 4
cells = [
    sheet.crop(
        (column * cell_width, row * cell_height, (column + 1) * cell_width, (row + 1) * cell_height)
    )
    for row in range(4)
    for column in range(2)
]
bounds = [cell.getchannel("A").getbbox() for cell in cells]
if any(box is None for box in bounds):
    raise SystemExit("every sprite-sheet cell must contain a figure")
left = min(box[0] for box in bounds)
top = min(box[1] for box in bounds)
right = max(box[2] for box in bounds)
bottom = max(box[3] for box in bounds)
frames = []
for cell in cells:
    figure = cell.crop((left, top, right, bottom))
    figure.thumbnail((args.width - 8, args.height - 8), Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", (args.width, args.height))
    frame.alpha_composite(
        figure, ((args.width - figure.width) // 2, args.height - figure.height - 4)
    )
    frames.append(frame)
font_paths = [
    Path("/System/Library/Fonts/Supplemental/Arial Black.ttf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
]
font_path = next((path for path in font_paths if path.exists()), None)
font_cache = {}


def electric_z(canvas, position, size, opacity):
    if not font_path:
        raise SystemExit("no heavy sans font found for the sleep Z trail")
    if size not in font_cache:
        font_cache[size] = ImageFont.truetype(font_path, size)
    font = font_cache[size]
    mask = Image.new("L", canvas.size)
    ImageDraw.Draw(mask).text(
        position, "Z", font=font, fill=opacity, stroke_width=5, stroke_fill=opacity, anchor="lt"
    )
    glow = Image.new("RGBA", canvas.size, (35, 190, 255, 0))
    glow.putalpha(mask.filter(ImageFilter.GaussianBlur(8)))
    canvas.alpha_composite(glow)
    glyph = Image.new("RGBA", canvas.size)
    draw = ImageDraw.Draw(glyph)
    draw.text(
        position,
        "Z",
        font=font,
        fill=(248, 253, 255, opacity),
        stroke_width=8,
        stroke_fill=(3, 18, 31, opacity),
        anchor="lt",
    )
    draw.text(
        position,
        "Z",
        font=font,
        fill=(248, 253, 255, opacity),
        stroke_width=4,
        stroke_fill=(41, 184, 242, opacity),
        anchor="lt",
    )
    canvas.alpha_composite(glyph)


if args.sleep_z_trail:
    positions = [(70, 70), (145, 45), (215, 32)]
    sizes = [42, 58, 72]
    lifts = [0, 2, 4, 7, 10, 8, 5, 2]
    opacities = [255, 250, 245, 235, 225, 230, 240, 250]
    composed = []
    for frame_index, frame in enumerate(frames):
        canvas = Image.new("RGBA", (args.width, args.height))
        canvas.alpha_composite(frame)
        for z_index, (position, size) in enumerate(zip(positions, sizes, strict=True)):
            phase = (frame_index - z_index * 2) % len(frames)
            electric_z(canvas, (position[0], position[1] - lifts[phase]), size, opacities[phase])
        composed.append(canvas)
    frames = composed

output = Path(args.output)
output.parent.mkdir(parents=True, exist_ok=True)
base_duration, remainder = divmod(args.total_duration_ms, len(frames))
durations = [base_duration + (1 if index < remainder else 0) for index in range(len(frames))]
frames[0].save(
    output,
    save_all=True,
    append_images=frames[1:],
    format="PNG",
    duration=durations,
    loop=0,
    disposal=1,
    blend=0,
    optimize=False,
)
if args.contact:
    frame_width, frame_height = frames[0].size
    contact = Image.new("RGBA", (frame_width * 4, frame_height * 2), (24, 29, 38, 255))
    for index, frame in enumerate(frames):
        contact.alpha_composite(frame, ((index % 4) * frame_width, (index // 4) * frame_height))
        ImageDraw.Draw(contact).text(
            ((index % 4) * frame_width + 5, (index // 4) * frame_height + 5),
            str(index + 1),
            fill="white",
        )
    contact_path = Path(args.contact)
    contact_path.parent.mkdir(parents=True, exist_ok=True)
    contact.save(contact_path)
print(f"{output}: {len(frames)} frames, {args.total_duration_ms} ms total")
