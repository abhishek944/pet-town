"""Package approved concept art without modifying the production application."""
from pathlib import Path
from shutil import copyfile
from subprocess import run
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parent
CONCEPT = ROOT.parent / 'logo-concepts'
SOURCE = ROOT / 'source'
DIGITAL = ROOT / 'digital'
WEB = ROOT / 'web'
APP = ROOT / 'app'
SOCIAL = ROOT / 'social'
for folder in (DIGITAL, WEB, APP, SOCIAL):
    folder.mkdir(parents=True, exist_ok=True)

stacked = Image.open(CONCEPT / 'round3/pet-town-integrated-curve-standard-t.png').convert('RGBA')
crew = Image.open(CONCEPT / 'round2/round2-neighbors.png').convert('RGBA')
word = Image.open(CONCEPT / 'round3/wordmark-standard-t.png').convert('RGBA')
small = Image.open(SOURCE / 'pet-town-small-symbol-1024.png').convert('RGBA')
mono = Image.open(SOURCE / 'pet-town-small-symbol-mono-1024.png').convert('RGBA')


def crop_with_padding(im, pad):
    box = im.getchannel('A').getbbox()
    x0, y0, x1, y1 = box
    out = Image.new('RGBA', (x1-x0+pad*2, y1-y0+pad*2), (0,0,0,0))
    out.alpha_composite(im.crop(box), (pad,pad))
    return out


# The illustrated master remains a pixel-based PNG; no fake vector wrapper.
copyfile(CONCEPT / 'round3/pet-town-integrated-curve-standard-t.png', SOURCE / 'pet-town-approved-raster-master.png')
primary = crop_with_padding(stacked, 56)
primary.save(DIGITAL / 'pet-town-stacked-color.png')
symbol = crop_with_padding(crew, 48)
symbol.save(DIGITAL / 'pet-town-companions-color.png')
wordmark = crop_with_padding(word, 52)
wordmark.save(DIGITAL / 'pet-town-wordmark-color.png')

# A separate, wide lockup; the integrated curved sign is the primary identity.
horizontal = Image.new('RGBA', (1940, 690), (0, 0, 0, 0))
left = symbol.copy()
left.thumbnail((620, 640), Image.Resampling.LANCZOS)
horizontal.alpha_composite(left, (45, (690-left.height)//2))
right = wordmark.copy()
right.thumbnail((1170, 470), Image.Resampling.LANCZOS)
horizontal.alpha_composite(right, (710, (690-right.height)//2))
horizontal.save(DIGITAL / 'pet-town-horizontal-color.png')

# Designed small icon (not a shrunken two-character illustration).
copyfile(SOURCE / 'pet-town-small-symbol.svg', WEB / 'favicon-symbol.svg')
copyfile(SOURCE / 'pet-town-small-symbol-mono.svg', DIGITAL / 'pet-town-symbol-mono.svg')
for name, rgb in (('ink', (8,33,73)), ('black', (0,0,0)), ('white', (255,255,255))):
    recoloured = Image.new('RGBA', mono.size, rgb+(0,))
    recoloured.putalpha(mono.getchannel('A'))
    recoloured.save(DIGITAL / f'pet-town-symbol-{name}.png')
    # The illustrated lettering's outlines fuse into a dark blob in one ink.
    # Typeset a clearly labelled, readable one-colour fallback instead.
    mono_word = Image.new('RGBA', wordmark.size, (0,0,0,0))
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf', 360)
    mono_draw = ImageDraw.Draw(mono_word)
    box = mono_draw.textbbox((0,0), 'Pet Town', font=font)
    mono_draw.text(((mono_word.width-(box[2]-box[0]))//2-box[0],
                    (mono_word.height-(box[3]-box[1]))//2-box[1]),
                   'Pet Town', font=font, fill=rgb+(255,))
    mono_word.save(DIGITAL / f'pet-town-wordmark-{name}.png')
    mono_lockup = Image.new('RGBA', horizontal.size, (0,0,0,0))
    compact_icon = recoloured.copy()
    compact_icon.thumbnail((540,540), Image.Resampling.LANCZOS)
    mono_lockup.alpha_composite(compact_icon, (75, (690-compact_icon.height)//2))
    compact_word = mono_word.copy()
    compact_word.thumbnail((1170,450), Image.Resampling.LANCZOS)
    mono_lockup.alpha_composite(compact_word, (710, (690-compact_word.height)//2))
    mono_lockup.save(DIGITAL / f'pet-town-horizontal-{name}.png')

# Opaque cream tile makes both faces recognizable on light and dark desktop docks.
cream = (255, 244, 218, 255)
tile = Image.new('RGBA', (1024,1024), cream)
mark = small.copy()
mark.thumbnail((855,855), Image.Resampling.LANCZOS)
tile.alpha_composite(mark, ((1024-mark.width)//2, (1024-mark.height)//2 - 13))
tile.save(APP / 'pet-town-app-icon-1024.png')

# macOS/Tauri-friendly sizes in a standalone kit. Do not overwrite src-tauri/icons.
for size, filename in ((32,'32x32.png'),(128,'128x128.png'),(256,'128x128@2x.png'),(512,'pet-town-app-icon-512.png')):
    tile.resize((size,size),Image.Resampling.LANCZOS).save(APP / filename)

# iconutil requires a complete iconset; keep it for reproducible re-export.
iconset = APP / 'pet-town.iconset'
iconset.mkdir(exist_ok=True)
for size in (16,32,128,256,512):
    tile.resize((size,size),Image.Resampling.LANCZOS).save(iconset / f'icon_{size}x{size}.png')
    tile.resize((size*2,size*2),Image.Resampling.LANCZOS).save(iconset / f'icon_{size}x{size}@2x.png')
run(['iconutil','-c','icns',str(iconset),'-o',str(APP/'pet-town-app-icon.icns')],check=True)

# Browser icons: small-size design, not a downscaled wordmark or grass ribbon.
for size in (16,32,48,64,180,192,512):
    tile.resize((size,size),Image.Resampling.LANCZOS).save(WEB / f'pet-town-{size}.png')
tile.save(SOCIAL / 'pet-town-avatar-1024.png')
maskable = Image.new('RGBA', (512,512), cream)
mask_mark = small.resize((330,330), Image.Resampling.LANCZOS)
maskable.alpha_composite(mask_mark, (91,84))
maskable.save(WEB / 'pet-town-maskable-512.png')
tile.resize((256,256),Image.Resampling.LANCZOS).save(SOCIAL / 'pet-town-avatar-256.png')
# Pillow writes all icon resolutions in one ICO.
tile.save(WEB / 'favicon.ico', format='ICO', sizes=[(16,16),(32,32),(48,48),(64,64)])
(WEB / 'site.webmanifest').write_text('''{\n  "name": "Pet Town",\n  "short_name": "Pet Town",\n  "icons": [\n    {"src": "pet-town-192.png", "sizes": "192x192", "type": "image/png"},\n    {"src": "pet-town-512.png", "sizes": "512x512", "type": "image/png"},\n    {"src": "pet-town-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}\n  ],\n  "theme_color": "#082149",\n  "background_color": "#FFF4DA",\n  "display": "standalone"\n}\n''')
(WEB / 'head-snippet.html').write_text('''<!-- Copy the appropriate files into your site public directory first. -->\n<link rel="icon" type="image/png" sizes="32x32" href="/pet-town-32.png">\n<link rel="apple-touch-icon" href="/pet-town-180.png">\n<link rel="manifest" href="/site.webmanifest">\n''')
print('Built logo kit variants under', ROOT)
