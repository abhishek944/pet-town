"""Standalone camp, furniture, and lantern objects."""

import math
from modeling import beam, cone, cube, cylinder, ico, roof


def camp_bench():
    for x in (-.85, .85):
        beam("Camp bench leg", (x, -.22, 0), (x, .13, .7), .16, "wood")
        beam("Camp bench leg", (x, .22, 0), (x, -.13, .7), .16, "wood")
    cube("Camp bench seat", (0, 0, .72), (2.1, .67, .15), "wood_light", .035)


def fishing_crate():
    cube("Crate floor", (0, 0, .09), (1.2, .9, .18), "wood")
    for z in (.26, .49, .72):
        for y in (-.42, .42):
            cube("Crate long slat", (0, y, z), (1.2, .11, .16), "wood_light")
        for x in (-.56, .56):
            cube("Crate end slat", (x, 0, z), (.1, .8, .16), "wood_light")
    for x in (-.56, .56):
        for y in (-.42, .42):
            cube("Crate corner", (x, y, .42), (.13, .13, .84), "wood")


def barrel():
    cylinder("Barrel body", (0, 0, .52), .42, .96, "wood", 10)
    for z in (.12, .48, .88):
        cylinder("Iron barrel band", (0, 0, z), .44, .065, "metal", 10)
    cylinder("Barrel lid", (0, 0, 1.02), .39, .07, "wood_light", 10)


def hanging_lantern():
    beam("Hanging hook", (0, 0, 1.25), (0, 0, 1.8), .07, "metal")
    cylinder("Lantern lower rim", (0, 0, .18), .31, .13, "metal", 8)
    cube("Lantern glass", (0, 0, .55), (.47, .47, .64), "glass")
    roof("Lantern roof", (0, 0, .94), .74, .74, .3, "metal")
    for x in (-.27, .27):
        for y in (-.27, .27):
            beam("Lantern frame", (x, y, .18), (x, y, .88), .045, "metal")


def trail_lantern():
    cube("Lantern foot", (0, 0, .06), (.37, .37, .12), "metal")
    cylinder("Short trail post", (0, 0, .62), .06, 1.14, "metal", 8)
    cube("Warm lantern pane", (0, 0, 1.37), (.42, .42, .42), "glass")
    roof("Trail lantern cap", (0, 0, 1.58), .62, .62, .24, "metal")


def string_lights():
    for x in (-2.4, 2.4):
        cylinder("Festoon post", (x, 0, 1.4), .075, 2.8, "wood", 8)
    for i in range(9):
        x = -2.4 + i * .6
        z = 2.78 - .38 * (1 - (x / 2.4) ** 2)
        if i:
            px = x - .6
            pz = 2.78 - .38 * (1 - (px / 2.4) ** 2)
            beam("Festoon cord", (px, 0, pz), (x, 0, z), .025, "metal")
        ico("Festoon bulb", (x, 0, z - .13), .12, "glass", 1)


def campfire():
    for i in range(9):
        a = i * math.tau / 9
        ico("Fire ring stone", (math.cos(a) * .76, math.sin(a) * .76, .18), .23, "stone", 1, (1, .8, .65))
    for a in (0, math.pi / 3, -math.pi / 3):
        beam("Campfire log", (-math.cos(a) * .48, -math.sin(a) * .48, .2), (math.cos(a) * .48, math.sin(a) * .48, .2), .18, "wood")
    for x, y, z, r in [(0, 0, .6, .37), (-.12, .07, .9, .23), (.1, 0, 1.03, .18)]:
        cone("Fire flame", (x, y, z), r, 0, r * 2, "roof" if z < .8 else "glass", 6)


def camp_seat():
    cylinder("Log seat", (0, 0, .3), .45, .6, "wood", 10)
    cylinder("Cut wood top", (0, 0, .61), .42, .025, "wood_light", 10)


def cooking_tripod():
    for i in range(3):
        a = i * math.tau / 3
        beam("Tripod pole", (math.cos(a) * .67, math.sin(a) * .67, 0), (0, 0, 1.85), .075, "wood")
    beam("Pot chain", (0, 0, 1.68), (0, 0, .82), .025, "metal")
    cylinder("Cooking pot", (0, 0, .67), .37, .3, "metal", 12)


def canvas_tent():
    cube("Tent floor", (0, 0, .05), (3.1, 2.6, .1), "wood_light")
    roof("Canvas shelter", (0, 0, .1), 3.2, 2.8, 2.3, "cream")
    for x in (-1.58, 1.58):
        beam("Tent ridge support", (x, 0, .1), (x, 0, 2.4), .08, "wood")
    cube("Tent entrance flap", (0, -1.42, .65), (1.0, .07, 1.1), "wood")


ASSETS = [
    ("camp-bench", "Camp bench", "Furniture", 750, camp_bench, "rectangle"),
    ("fishing-crate", "Fishing crate", "Furniture", 420, fishing_crate, "rectangle"),
    ("harbor-barrel", "Harbor barrel", "Furniture", 380, barrel, "circle"),
    ("hanging-lantern", "Hanging lantern", "Lights", 650, hanging_lantern, "rectangle"),
    ("trail-lantern", "Trail lantern", "Lights", 850, trail_lantern, "rectangle"),
    ("camp-string-lights", "Camp string lights", "Lights", 1200, string_lights, "rectangle"),
    ("campfire", "Campfire", "Furniture", 1500, campfire, "circle"),
    ("camp-seat", "Camp seat", "Furniture", 550, camp_seat, "circle"),
    ("cooking-tripod", "Cooking tripod", "Furniture", 700, cooking_tripod, "circle"),
    ("canvas-tent", "Canvas tent", "Furniture", 2400, canvas_tent, "rectangle"),
]
