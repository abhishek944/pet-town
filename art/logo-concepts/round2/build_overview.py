from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parent
OUT = ROOT / 'round2-overview.png'
W, H = 1740, 1040
canvas = Image.new('RGB', (W, H), '#f9f5eb')
d = ImageDraw.Draw(canvas)
font_path = '/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf'
regular_path = '/System/Library/Fonts/Supplemental/Arial.ttf'
large = ImageFont.truetype(font_path, 49)
heading = ImageFont.truetype(font_path, 35)
body = ImageFont.truetype(regular_path, 23)
small = ImageFont.truetype(regular_path, 18)

d.text((60, 33), 'Pet Town  /  a more playful direction', font=large, fill='#10244a')
d.text((62, 101), 'Character, color and warmth from the world already in the repo', font=body, fill='#56677a')
cards = [
    ('A', 'Little Dragon', 'round2-dragon.png', 'A friendly face for the dock and the town.', 'Character-led / compact icon', True),
    ('B', 'Town Letters', 'round2-lettering.png', 'The name itself becomes a playful game sign.', 'Wordmark-led / needs a companion icon', False),
    ('C', 'Neighbors', 'round2-neighbors.png', 'Two little companions make a community.', 'Ensemble / best at larger sizes', False),
]
for i, (letter, title, filename, note, type_label, recommended) in enumerate(cards):
    x = 59 + 560 * i
    y = 164
    d.rounded_rectangle((x, y, x + 526, y + 820), radius=28, fill='#ffffff', outline='#d8dce1', width=2)
    d.rounded_rectangle((x + 18, y + 18, x + 508, y + 520), radius=20, fill='#e7f1ef' if i == 0 else '#f0f1f5' if i == 1 else '#fff1e4')
    original = Image.open(ROOT / filename).convert('RGBA')
    bbox = original.getchannel('A').getbbox()
    artwork = original.crop(bbox)
    if i == 1:
        artwork.thumbnail((470, 320), Image.Resampling.LANCZOS)
    else:
        artwork.thumbnail((432, 446), Image.Resampling.LANCZOS)
    px = x + 263 - artwork.width // 2
    py = y + 255 - artwork.height // 2
    canvas.paste(artwork, (px, py), artwork)
    d.text((x + 28, y + 547), f'{letter}  {title}', font=heading, fill='#10244a')
    d.text((x + 28, y + 602), type_label, font=small, fill='#007c85')
    d.text((x + 28, y + 640), note, font=body, fill='#344253')
    d.text((x + 28, y + 705), 'AT SMALL SIZES', font=small, fill='#69798a')
    for n, size in enumerate((64, 32, 16)):
        thumb = original.copy()
        thumb.thumbnail((size, size), Image.Resampling.LANCZOS)
        cx = x + 62 + n * 124
        cy = y + 756
        canvas.paste(thumb, (cx - thumb.width // 2, cy - thumb.height // 2), thumb)
        d.text((cx + 35, cy - 11), f'{size}px', font=small, fill='#69798a')
    if recommended:
        d.rounded_rectangle((x + 350, y + 544, x + 497, y + 580), radius=18, fill='#ffdf91')
        d.text((x + 367, y + 552), 'MY PICK', font=small, fill='#583c16')
canvas.save(OUT)
print(OUT)
