from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).parent
im = Image.open(root.parent / 'round2' / 'round2-lettering.png').convert('RGBA')
d = ImageDraw.Draw(im)
# Remove only the coral pennant to the right of lowercase t in Pet. Retain
# the letter's ordinary rounded right-hand crossbar below y=303.
d.rectangle((755, 185, 856, 301), fill=(0, 0, 0, 0))
# Restore the exposed outline on the upper stem, which the pennant obscured.
d.line([(750, 186), (750, 293)], fill='#051536', width=12)
out = root / 'pet-town-lettering-plain-t.png'
im.save(out)
print(out)
