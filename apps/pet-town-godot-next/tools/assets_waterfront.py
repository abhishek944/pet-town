"""Single-object boats, shore stones, and mooring details."""

import math
from modeling import beam, cone, cube, cylinder, ico


def boat(length=4.4, color="cream", sail=False, cabin=False, oars=False):
    ico("Faceted boat hull", (0, 0, .45), 1, color, 1, (length / 2, .86, .5))
    cube("Boat deck", (0, 0, .85), (length * .72, 1.35, .11), "wood_light", .08)
    for y in (-.68, .68):
        cube("Gunwale", (0, y, .85), (length * .8, .1, .22), "wood")
    if sail:
        cylinder("Mast", (0, 0, 2.1), .065, 3.2, "wood", 8)
        beam("Sail boom", (0, 0, 1.15), (1.25, 0, 1.15), .05, "wood")
        cone("Canvas sail", (.45, 0, 2.45), 1.15, 0, 2.55, "cream", 3)
    if cabin:
        cube("Wheelhouse", (-.55, 0, 1.36), (1.35, 1.2, .92), "cream")
        cube("Wheelhouse pane", (-.55, -.64, 1.48), (.72, .04, .42), "glass")
        cube("Funnel", (-.6, .3, 2.0), (.35, .35, .62), "metal")
    if oars:
        for side in (-1, 1):
            beam("Wood oar", (-.25, side * .25, 1.02), (.75, side * 1.75, .62), .08, "wood_light")


def shore_boulder():
    ico("Shore boulder", (0, 0, .6), 1, "stone", 1, (1.45, 1.15, .68))
    ico("Pale rock face", (-.3, -.15, .95), .55, "stone_light", 1, (1.3, .7, .6))


def coastal_rock():
    for x, y, z, r, s in [(-.7, .1, .62, 1.05, (1, .8, .7)), (.4, -.2, .8, 1.1, (.8, .9, .8)), (1, .3, .39, .65, (.8, 1, .55))]:
        ico("Coastal rock formation", (x, y, z), r, "stone" if x < 0 else "stone_light", 1, s)


def small_stone():
    ico("Small grounded coastal stone", (0, 0, .22), .48, "stone", 1, (1.15, .83, .5))


def mooring_rope():
    for i in range(3):
        radius = .58 - i * .12
        for j in range(14):
            a = j * math.tau / 14
            b = (j + 1) * math.tau / 14
            beam("Coiled mooring rope", (math.cos(a) * radius, math.sin(a) * radius, .09 + i * .08), (math.cos(b) * radius, math.sin(b) * radius, .09 + i * .08), .075, "wood_light")
    beam("Loose rope end", (.35, 0, .24), (1, .33, .06), .075, "wood_light")


ASSETS = [
    ("fishing-boat", "Fishing boat", "Waterfront", 3500, lambda: boat(5.1, "cream", cabin=True), "rectangle", "water"),
    ("sailboat", "Sailboat", "Waterfront", 4200, lambda: boat(5.0, "wood_light", sail=True), "rectangle", "water"),
    ("rowboat", "Rowboat", "Waterfront", 1900, lambda: boat(3.2, "wood", oars=True), "rectangle", "water"),
    ("woodland-rowboat", "Woodland rowboat", "Waterfront", 1900, lambda: boat(3.4, "teal", oars=True), "rectangle", "water"),
    ("blue-trawler", "Blue trawler", "Waterfront", 4200, lambda: boat(5.8, "teal", cabin=True), "rectangle", "water"),
    ("coral-sailboat", "Coral sailboat", "Waterfront", 4200, lambda: boat(5.1, "roof", sail=True), "rectangle", "water"),
    ("shore-boulder", "Shore boulder", "Waterfront", 330, shore_boulder, "circle"),
    ("coastal-rock", "Coastal rock formation", "Waterfront", 540, coastal_rock, "circle"),
    ("small-coastal-stone", "Small coastal stone", "Waterfront", 140, small_stone, "circle"),
    ("mooring-rope", "Mooring rope", "Waterfront", 180, mooring_rope, "circle"),
]
