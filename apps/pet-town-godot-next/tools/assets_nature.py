"""Standalone trees and garden details, centered before export."""

import math
from modeling import beam, cone, cube, cylinder, ico


def round_tree():
    cylinder("Round tree trunk", (0, 0, 1), .2, 2, "wood", 9)
    for x, y, z, r in [(-.5, 0, 2.45, .85), (.45, .1, 2.5, .88), (0, -.3, 2.9, .82)]:
        ico("Round leafy crown", (x, y, z), r, "leaf", 2)


def fir_tree():
    cylinder("Fir trunk", (0, 0, 1.1), .18, 2.2, "wood", 9)
    for z, r in [(1.5, 1.05), (2.08, .84), (2.65, .61), (3.15, .38)]:
        cone("Fir tier", (0, 0, z), r, .02, 1.35, "pine_light", 10)


def flower_patch():
    ico("Soil mound", (0, 0, .07), .72, "wood", 1, (1.25, .8, .15))
    for i in range(11):
        angle = i * 2.39996
        x, y = math.cos(angle) * .58, math.sin(angle) * .38
        cylinder("Flower stem", (x, y, .31), .026, .4, "leaf", 6)
        ico("Flower bloom", (x, y, .53), .12, "pink" if i % 2 else "lavender", 1)


def detail_stone():
    ico("Garden detail stone", (0, 0, .26), .54, "stone_light", 1, (1.1, .8, .56))


def garden_fence():
    for x in (-1.25, 0, 1.25):
        cube("Fence post", (x, 0, .57), (.14, .14, 1.14), "wood_light", .02)
        cone("Picket cap", (x, 0, 1.18), .105, 0, .2, "wood_light", 4)
    for z in (.38, .82):
        cube("Fence rail", (0, 0, z), (2.65, .1, .12), "wood")


def heather():
    for i in range(9):
        a = i * 2.39996
        x, y = math.cos(a) * .36, math.sin(a) * .28
        beam("Heather stalk", (x, y, .04), (x * 1.3, y * 1.3, .5 + .12 * (i % 3)), .035, "leaf")
        ico("Heather blossom", (x * 1.3, y * 1.3, .53 + .12 * (i % 3)), .095, "lavender", 1)


def fern():
    for i in range(7):
        a = i * math.tau / 7
        x, y = math.cos(a), math.sin(a)
        beam("Fern frond", (0, 0, .13), (x * .62, y * .62, .47), .04, "leaf")
        for j in (1, 2, 3):
            t = j / 4
            cx, cy, cz = x * .62 * t, y * .62 * t, .13 + .34 * t
            for side in (-1, 1):
                ico("Fern leaflet", (cx - y * side * .13, cy + x * side * .13, cz), .15, "pine_light", 1, (1, .55, .2))


def paving(light=False):
    cube("Light paving stone" if light else "Paving stone", (0, 0, .07), (.91, .84, .14), "cream" if light else "stone", .06)


ASSETS = [
    ("round-tree", "Round tree", "Trees", 1200, round_tree, "circle"),
    ("fir-tree", "Fir tree", "Trees", 1500, fir_tree, "circle"),
    ("flower-patch", "Flower patch", "Gardens", 400, flower_patch, "circle"),
    ("garden-detail-stone", "Garden detail stone", "Gardens", 180, detail_stone, "circle"),
    ("garden-fence", "Garden fence", "Gardens", 350, garden_fence, "rectangle"),
    ("heather-clump", "Heather clump", "Gardens", 180, heather, "circle"),
    ("forest-fern", "Forest fern", "Gardens", 160, fern, "circle"),
    ("paving-stone", "Paving stone", "Paths", 80, lambda: paving(False), "rectangle"),
    ("light-paving-stone", "Light paving stone", "Paths", 80, lambda: paving(True), "rectangle"),
]
