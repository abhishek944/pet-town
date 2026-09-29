from pathlib import Path
from math import sin, pi
from PIL import Image, ImageDraw

root = Path(__file__).parent
source = root.parent / 'round2'
pets = Image.open(source / 'round2-neighbors.png').convert('RGBA')
word = Image.open(root / 'wordmark-standard-t.png').convert('RGBA')
word = word.crop(word.getchannel('A').getbbox())

W, H = 1400, 1500
logo = Image.new('RGBA', (W, H), (0, 0, 0, 0))
navy = '#051b47'
green = '#689a38'
dark_green = '#447e30'

# One shared grassy sign: a shallow arch at the top and bottom, wide enough
# for the actual B lettering without shrinking it to illegibility.
left, right = 85, 1315
points_top = []
points_bottom = []
for x in range(left, right + 1, 4):
    t = (x - left) / (right - left)
    points_top.append((x, round(1040 - 58 * sin(pi * t))))
    points_bottom.append((x, round(1437 - 35 * sin(pi * t))))
shape = points_top + list(reversed(points_bottom))
d = ImageDraw.Draw(logo)
d.polygon(shape, fill=green)
d.line(points_top, fill=navy, width=18, joint='curve')
d.line(points_bottom, fill=navy, width=18, joint='curve')
d.line([points_top[0], points_bottom[0]], fill=navy, width=18)
d.line([points_top[-1], points_bottom[-1]], fill=navy, width=18)

# Let the two tufts identify the band as the same little patch of grass.
for base_x, flip in ((114, 1), (1286, -1)):
    leaves = [
        [(base_x, 1053), (base_x - 55*flip, 995), (base_x - 24*flip, 1002), (base_x - 2*flip, 1025)],
        [(base_x, 1058), (base_x - 22*flip, 973), (base_x + 1*flip, 999), (base_x + 14*flip, 1033)],
        [(base_x, 1070), (base_x + 41*flip, 1008), (base_x + 43*flip, 1048)],
    ]
    for leaf in leaves:
        d.polygon(leaf, fill=green)
        d.line(leaf + [leaf[0]], fill=navy, width=10, joint='curve')

# Curve the original outlined wordmark subtly with the grassy band.
word = word.resize((965, 337), Image.Resampling.LANCZOS)
warped = Image.new('RGBA', (W, H), (0, 0, 0, 0))
start_x, baseline_y = 218, 1060
for column in range(word.width):
    t = column / max(1, word.width - 1)
    y = round(baseline_y - 41 * sin(pi * t))
    strip = word.crop((column, 0, column + 1, word.height))
    warped.paste(strip, (start_x + column, y))
logo.alpha_composite(warped)

# Keep the original companions and their paws above the nameplate; discard
# only the bottom of the old thin grass curve where it would double the base.
pets = pets.crop((0, 0, pets.width, 1035))
pet_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
pet_layer.paste(pets, (73, 0), pets)
logo.alpha_composite(pet_layer)

out = root / 'pet-town-integrated-curve-standard-t.png'
logo.save(out)
print(out)
