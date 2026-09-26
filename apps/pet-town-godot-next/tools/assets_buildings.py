"""Individually exported houses and shops with distinct silhouettes."""

from modeling import beam, cone, cube, cylinder, roof


def _windows(width, front_y, wall_h, count, trim="wood_light"):
    for i in range(count):
        x = (i - (count - 1) / 2) * (width - 1.2) / max(count - 1, 1)
        if abs(x) < .6:
            continue
        cube("Window trim", (x, front_y - .08, wall_h * .55), (.8, .14, .85), trim, .025)
        cube("Warm pane", (x, front_y - .17, wall_h * .55), (.59, .04, .65), "glass")
        cube("Window cross", (x, front_y - .2, wall_h * .55), (.06, .05, .67), "cream")


def _gable(name, width=4.4, depth=3.8, wall_h=2.65, wall="cream", top="roof", porch=False, chimney=False):
    cube(name + " stone footing", (0, 0, .16), (width + .3, depth + .3, .32), "stone", .04)
    cube(name + " walls", (0, 0, wall_h / 2 + .3), (width, depth, wall_h), wall, .05)
    roof(name + " pitched roof", (0, 0, wall_h + .3), width + .7, depth + .5, 1.45, top)
    fy = -depth / 2
    cube(name + " front door", (0, fy - .08, 1.13), (.85, .14, 1.83), "wood", .03)
    _windows(width, fy, wall_h, 4)
    if porch:
        cube("Timber porch", (0, fy - .68, .13), (2.2, 1.1, .25), "wood_light")
        for x in (-.96, .96):
            beam("Porch post", (x, fy - 1.1, .25), (x, fy - 1.1, 2.8), .1, "wood")
        roof("Porch awning", (0, fy - .65, 2.65), 2.5, 1.6, .45, top)
    if chimney:
        cube("Chimney", (width * .27, depth * .16, wall_h + 1.4), (.47, .52, 1.4), "stone")


def _shop(name, width=5.0, depth=4.2, wall="teal", roof_color="roof", awning="cream", tower=False):
    cube(name + " plinth", (0, 0, .15), (width + .3, depth + .3, .3), "stone")
    cube(name + " shop walls", (0, 0, 1.7), (width, depth, 2.9), wall, .04)
    roof(name + " roof", (0, 0, 3.12), width + .65, depth + .5, 1.28, roof_color)
    fy = -depth / 2
    cube("Shop door", (0, fy - .08, 1.15), (.92, .13, 1.9), "wood")
    for x in (-width * .3, width * .3):
        cube("Display window frame", (x, fy - .09, 1.7), (1.2, .14, 1.35), "wood_light")
        cube("Display glass", (x, fy - .18, 1.7), (.98, .04, 1.12), "glass")
    cube("Store sign", (0, fy - .14, 2.8), (2.5, .13, .48), "wood_light", .06)
    for x in (-1.8, -.9, 0, .9, 1.8):
        cube("Striped shop canopy", (x, fy - .6, 2.45), (.88, .95, .1), awning if int(x * 10) % 2 else "cream")
    if tower:
        cylinder("Corner cupola", (width * .34, depth * .2, 4.1), .55, 1.1, "cream", 8)
        cone("Cupola cap", (width * .34, depth * .2, 4.9), .76, .04, .65, roof_color, 8)


def a_frame():
    cube("Cedar platform", (0, 0, .18), (4.6, 4.1, .36), "wood")
    roof("Tall cedar A frame", (0, 0, .36), 4.6, 4.1, 4.5, "wood")
    cube("A frame glazed front", (0, -2.08, 1.32), (1.9, .08, 2.0), "glass")
    cube("A frame entry", (0, -2.16, .96), (.88, .12, 1.8), "wood_light")
    for x in (-1.85, 1.85):
        beam("A frame trim", (x, -2.13, .4), (0, -2.13, 4.84), .12, "wood_light")


def keeper_octagon():
    cylinder("Octagonal stone base", (0, 0, .2), 2.6, .4, "stone", 8)
    cylinder("Octagonal cream walls", (0, 0, 1.65), 2.35, 2.7, "cream", 8)
    cone("Octagonal roof", (0, 0, 3.35), 2.8, .18, 1.3, "roof", 8)
    cube("Keeper door", (0, -2.36, 1.05), (.92, .13, 1.75), "wood")
    for x in (-1.4, 1.4):
        cube("Keeper window", (x, -1.82, 1.8), (.7, .1, .87), "glass")


ASSETS = [
    ("rose-cottage", "Rose cottage", "Homes", 14000, lambda: _gable("Rose cottage", porch=True, chimney=True), "rectangle"),
    ("fisher-house", "Fisher's house", "Homes", 15000, lambda: _gable("Fisher house", width=4.8, wall="teal", top="stone", porch=True), "rectangle"),
    ("fernwood-chalet", "Fernwood chalet", "Homes", 15000, lambda: _gable("Fernwood chalet", width=5.2, depth=4.8, wall="wood_light", top="pine", chimney=True), "rectangle"),
    ("lighthouse-keeper-home", "Lighthouse keeper's home", "Homes", 17000, lambda: _gable("Keeper home", width=4.7, depth=4.3, wall="cream", top="teal", porch=True), "rectangle"),
    ("cedar-cabin", "Cedar cabin", "Homes", 12000, a_frame, "rectangle"),
    ("fisher-longhouse", "Fisher's longhouse", "Homes", 21000, lambda: _gable("Fisher longhouse", width=7.8, depth=4.6, wall="wood_light", top="stone", porch=True), "rectangle"),
    ("keepers-cottage", "Keeper's cottage", "Homes", 17000, keeper_octagon, "circle"),
    ("pottery-studio", "Pottery studio", "Shops", 19000, lambda: _shop("Pottery studio", wall="cream", roof_color="teal", awning="roof"), "rectangle"),
    ("honeycomb-bakery", "Honeycomb bakery", "Shops", 20000, lambda: _shop("Honeycomb bakery", wall="wood_light", roof_color="roof", awning="glass"), "rectangle"),
    ("harbor-tea-house", "Harbor tea house", "Shops", 20000, lambda: _shop("Harbor tea house", width=5.7, wall="teal", roof_color="stone", awning="cream"), "rectangle"),
    ("hearth-bakery", "Hearth bakery", "Shops", 23000, lambda: _shop("Hearth bakery", width=5.5, wall="roof", roof_color="wood", awning="cream", tower=True), "rectangle"),
    ("tide-tea-house", "Tide tea house", "Shops", 23000, lambda: _shop("Tide tea house", width=6.0, wall="cream", roof_color="teal", awning="roof", tower=True), "rectangle"),
]
