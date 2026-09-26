"""Standalone coastal landmarks."""

import math
from modeling import beam, cone, cube, cylinder, roof


def windmill():
    cylinder("Windmill stone footing", (0, 0, .25), 2, .5, "stone", 12)
    cone("Windmill tapered tower", (0, 0, 3.3), 1.65, 1.12, 5.9, "cream", 12)
    cone("Windmill roof", (0, 0, 6.55), 1.52, .18, .9, "roof", 12)
    cube("Windmill entry", (0, -1.55, 1.2), (.85, .1, 1.9), "wood")
    for z in (2.55, 4.45):
        cube("Windmill window", (0, -1.35 + z * .07, z), (.62, .08, .72), "glass")
    cylinder("Sail hub", (0, -1.54, 5.65), .32, .3, "metal", 12)
    for i in range(4):
        a = i * math.pi / 2 + math.pi / 4
        x, z = math.sin(a), math.cos(a)
        beam("Windmill spar", (0, -1.75, 5.65), (x * 2.4, -1.75, 5.65 + z * 2.4), .11, "wood")
        cube("Windmill sail", (x * 1.58 - z * .24, -1.78, 5.65 + z * 1.58 + x * .24), (.53, .08, 1.32), "cream")


def lighthouse():
    cylinder("Lighthouse stone base", (0, 0, .27), 2.25, .54, "stone", 12)
    cone("Lighthouse tower", (0, 0, 4.65), 1.92, 1.35, 8.3, "cream", 12)
    for z in (2.0, 4.6, 7.2):
        cylinder("Coral lighthouse stripe", (0, 0, z), 1.88 - z * .05, .35, "roof", 12)
    cylinder("Lantern gallery", (0, 0, 9.2), 1.72, .28, "stone", 12)
    cylinder("Beacon glass", (0, 0, 9.85), 1.15, 1.15, "glass", 12)
    for i in range(8):
        a = i * math.tau / 8
        x, y = math.cos(a) * 1.2, math.sin(a) * 1.2
        beam("Beacon frame", (x, y, 9.25), (x, y, 10.43), .07, "metal")
    cone("Beacon cap", (0, 0, 10.6), 1.4, .1, .68, "roof", 12)
    cube("Lighthouse door", (0, -1.93, 1.05), (.85, .12, 1.8), "wood")


ASSETS = [
    ("windmill", "Windmill", "Landmarks", 18000, windmill, "circle"),
    ("lighthouse", "Lighthouse", "Landmarks", 30000, lighthouse, "circle"),
]
