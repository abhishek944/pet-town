from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).parent
word = Image.open(root / 'round2-lettering.png').convert('RGBA')
crew = Image.open(root / 'round2-neighbors.png').convert('RGBA')
word = word.crop(word.getchannel('A').getbbox())
crew = crew.crop(crew.getchannel('A').getbbox())
font = '/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf'
body_font = '/System/Library/Fonts/Supplemental/Arial.ttf'
canvas = Image.new('RGB', (1600, 1080), '#f8f4ec')
d = ImageDraw.Draw(canvas)
d.text((64, 35), 'B + C  /  one Pet Town identity', font=ImageFont.truetype(font, 47), fill='#10244a')
d.text((65, 98), 'The expressive wordmark and the little neighborhood together', font=ImageFont.truetype(body_font, 24), fill='#586679')

def paste_fit(src, box):
    x, y, w, h = box
    im = src.copy()
    im.thumbnail((w, h), Image.Resampling.LANCZOS)
    canvas.paste(im, (x + (w - im.width)//2, y + (h - im.height)//2), im)

# Tall lockup: character pair is secondary to the legible title.
d.rounded_rectangle((56, 160, 761, 970), radius=32, fill='#fff7e8', outline='#ded5c7', width=2)
paste_fit(crew, (145, 193, 528, 460))
paste_fit(word, (99, 644, 620, 248))
d.text((88, 924), 'STACKED  /  splash, website, poster', font=ImageFont.truetype(body_font, 20), fill='#647086')

# Horizontal variant: narrower mascot and full title.
d.rounded_rectangle((790, 160, 1544, 596), radius=32, fill='#e9f3f2', outline='#c7dcd9', width=2)
paste_fit(crew, (818, 215, 250, 310))
paste_fit(word, (1054, 263, 450, 204))
d.text((820, 549), 'HORIZONTAL  /  site header, settings', font=ImageFont.truetype(body_font, 20), fill='#647086')

# Small-size honesty check.
d.rounded_rectangle((790, 625, 1544, 970), radius=32, fill='#ffffff', outline='#ded5c7', width=2)
d.text((820, 655), 'SMALL-ICON CHECK', font=ImageFont.truetype(font, 28), fill='#10244a')
for x, n in ((916, 96), (1120, 48), (1324, 24)):
    paste_fit(crew, (x-n//2, 725, n, n))
    d.text((x-22, 845), f'{n}px', font=ImageFont.truetype(body_font, 20), fill='#647086')
d.text((820, 909), 'Needs a simpler companion icon at tiny sizes.', font=ImageFont.truetype(body_font, 20), fill='#647086')
out = root / 'bc-combination-preview.png'
canvas.save(out)
print(out)
