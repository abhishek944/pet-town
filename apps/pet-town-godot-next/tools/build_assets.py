"""Author standalone shop objects with independent ground pivots."""

import json
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(__file__))
from modeling import beam, bounds, clear, cone, cube, cylinder, ico, normalize_ground, roof
from assets_nature import ASSETS as NATURE_ASSETS
from assets_camp import ASSETS as CAMP_ASSETS
from assets_buildings import ASSETS as BUILDING_ASSETS
from assets_waterfront import ASSETS as WATERFRONT_ASSETS
from assets_landmarks import ASSETS as LANDMARK_ASSETS

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "assets")
OBJECT_OUT = os.path.join(OUT, "objects")


def pine():
    cylinder("Trunk", (0, 0, 1.15), 0.19, 2.3, "wood", 9)
    for z, r, h, color in [(1.7, 1.1, 1.7, "pine"), (2.35, 0.88, 1.55, "pine_light"), (2.95, 0.61, 1.35, "pine")]:
        cone("Evergreen boughs", (0, 0, z), r, 0.04, h, color, 9)


def apple():
    cylinder("Orchard trunk", (0, 0, 1.18), 0.22, 2.36, "wood", 9)
    for x, y, z, r in [(-0.55, 0, 2.35, 0.78), (0.5, 0.1, 2.5, 0.84), (0, -0.35, 2.85, 0.75)]:
        ico("Leaf crown", (x, y, z), r, "leaf", 2)
    for x, y, z in [(-0.7, -0.55, 2.1), (0.6, -0.47, 2.38), (0.3, 0.7, 2.55), (-0.3, 0.6, 2.8)]:
        ico("Apple", (x, y, z), 0.12, "roof", 1)


def cottage():
    cube("Stone foundation", (0, 0, 0.16), (4.4, 3.7, 0.32), "stone", 0.05)
    cube("Cream walls", (0, 0, 1.55), (4.1, 3.4, 2.5), "cream", 0.06)
    roof("Terracotta gable", (0, 0, 2.78), 4.75, 4.0, 1.48, "roof")
    cube("Cottage door", (0, -1.75, 1.07), (0.85, 0.12, 1.85), "wood", 0.03)
    cylinder("Door knob", (0.3, -1.84, 1.12), 0.045, 0.08, "metal", 8)
    for x in (-1.28, 1.28):
        cube("Window frame", (x, -1.76, 1.63), (0.98, 0.12, 1.05), "wood_light", 0.02)
        cube("Warm window", (x, -1.84, 1.63), (0.73, 0.05, 0.8), "glass")
        cube("Window crossbar", (x, -1.9, 1.63), (0.08, 0.08, 0.82), "cream")
    cube("Chimney", (1.17, 0.65, 3.78), (0.53, 0.53, 1.1), "stone", 0.03)
    cube("Porch step", (0, -2.05, 0.13), (1.34, 0.65, 0.26), "wood_light")


def bakery():
    cube("Bakery foundation", (0, 0, 0.16), (4.8, 4.0, 0.32), "stone", 0.05)
    cube("Mint shopfront", (0, 0, 1.68), (4.55, 3.78, 2.8), "teal", 0.06)
    roof("Bakery roof", (0, 0, 3.07), 5.15, 4.36, 1.35, "roof")
    cube("Bakery door", (0, -1.97, 1.14), (0.89, 0.12, 2.0), "wood", 0.03)
    for x in (-1.43, 1.43):
        cube("Shop window frame", (x, -1.96, 1.75), (1.2, 0.13, 1.38), "cream", 0.02)
        cube("Shop window", (x, -2.05, 1.75), (0.99, 0.06, 1.17), "glass")
    cube("Bakery signboard", (0, -2.07, 2.87), (2.38, 0.14, 0.48), "wood_light", 0.08)
    for x in (-1.85, -1.1, -0.35, 0.4, 1.15, 1.9):
        cube("Striped awning", (x, -2.38, 2.48), (0.74, 0.88, 0.1), "cream" if round(x * 100) % 2 else "roof")
    cube("Shop step", (0, -2.3, 0.13), (1.45, 0.75, 0.26), "wood_light")


def bench():
    for x in (-0.82, 0.82):
        for y in (-0.25, 0.25):
            cube("Bench leg", (x, y, 0.42), (0.13, 0.13, 0.84), "metal")
    for y in (-0.3, 0, 0.3):
        cube("Seat slat", (0, y, 0.9), (2.05, 0.25, 0.13), "wood_light", 0.03)
    for z in (1.24, 1.53):
        cube("Back slat", (0, 0.48, z), (2.05, 0.14, 0.22), "wood_light", 0.03)
    for x in (-0.82, 0.82):
        beam("Back support", (x, 0.39, 0.86), (x, 0.52, 1.68), 0.12, "metal")


def lantern():
    cube("Foot", (0, 0, 0.08), (0.45, 0.45, 0.16), "stone", 0.03)
    cylinder("Iron post", (0, 0, 1.15), 0.08, 2.2, "metal", 10)
    cube("Lantern frame", (0, 0, 2.43), (0.55, 0.55, 0.77), "metal", 0.03)
    cube("Warm glass", (0, -0.29, 2.44), (0.42, 0.03, 0.56), "glass")
    cube("Warm glass", (-0.29, 0, 2.44), (0.03, 0.42, 0.56), "glass")
    roof("Lantern cap", (0, 0, 2.87), 0.82, 0.82, 0.34, "metal")


def flowers():
    cube("Planter", (0, 0, 0.24), (1.7, 1.0, 0.48), "wood_light", 0.06)
    cube("Soil", (0, 0, 0.48), (1.5, 0.82, 0.04), "wood")
    for i, (x, y) in enumerate([(-0.56, -0.21), (-0.22, 0.17), (0.2, -0.2), (0.55, 0.16), (-0.58, 0.18), (0.57, -0.18)]):
        h = 0.51 + 0.08 * (i % 3)
        cylinder("Flower stem", (x, y, h + 0.14), 0.025, 0.28, "leaf", 6)
        ico("Flower blossom", (x, y, h + 0.31), 0.13, "pink" if i % 2 else "lavender", 1)


def granite():
    ico("Faceted coastal stone", (0, 0, 0.52), 1.0, "stone", 1, (1.13, 0.83, 0.6))
    ico("Sunlit stone crest", (-0.19, -0.14, 0.82), 0.56, "stone_light", 1, (1.2, 0.85, 0.58))


def paver():
    cube("Single paving tile", (0, 0, 0.07), (0.9, 0.9, 0.14), "stone_light", 0.06)


def fountain():
    cylinder("Stone base", (0, 0, 0.18), 1.28, 0.36, "stone", 16)
    cylinder("Lower basin", (0, 0, 0.57), 1.12, 0.43, "stone_light", 16)
    cylinder("Water pool", (0, 0, 0.8), 0.91, 0.05, "water", 16)
    cylinder("Center column", (0, 0, 1.22), 0.17, 0.9, "stone", 12)
    cylinder("Upper bowl", (0, 0, 1.7), 0.48, 0.15, "stone_light", 12)
    ico("Water crown", (0, 0, 1.81), 0.26, "water", 1, (1, 1, 0.52))


ASSETS = [
    ("pine-tree", "Pine tree", "Trees", 1500, pine, "circle"),
    ("apple-tree", "Apple tree", "Trees", 2200, apple, "circle"),
    ("cottage", "Rose cottage", "Homes", 14000, cottage, "rectangle"),
    ("bakery", "Harbor bakery", "Shops", 19000, bakery, "rectangle"),
    ("garden-bench", "Garden bench", "Furniture", 900, bench, "rectangle"),
    ("street-lantern", "Street lantern", "Lights", 1100, lantern, "rectangle"),
    ("flower-planter", "Flower planter", "Gardens", 400, flowers, "rectangle"),
    ("coastal-granite", "Coastal granite", "Waterfront", 220, granite, "rectangle"),
    ("paving-tile", "Paving tile", "Paths", 80, paver, "rectangle"),
    ("fountain", "Garden fountain", "Landmarks", 5200, fountain, "circle"),
]


def export_asset(asset, new=False):
    asset_id, name, category, price, make, shape = asset[:6]
    surface = asset[6] if len(asset) > 6 else "land"
    prefix = "objects/" if new else ""
    directory = OBJECT_OUT if new else OUT
    clear()
    make()
    objects = list(bpy.context.scene.objects)
    size = normalize_ground(objects)
    assert max(size[:2]) < 12, (asset_id, size)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=os.path.join(directory, asset_id + ".glb"), export_format="GLB", use_selection=True, export_apply=True)
    render_thumbnail(asset_id, size, directory)
    return {"id": asset_id, "name": name, "category": category, "price": price, "scene": "res://assets/%s%s.glb" % (prefix, asset_id), "thumbnail": "res://assets/%s%s.png" % (prefix, asset_id), "shape": shape, "width": size[0], "depth": size[1], "height": size[2], "surface": surface}


def render_thumbnail(asset_id, size, directory):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 256
    scene.render.resolution_y = 256
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = os.path.join(directory, asset_id + ".png")
    scene.world.color = (0.32, 0.40, 0.36)
    bpy.ops.object.camera_add(location=(max(size[0], size[1]) * 1.55, -max(size[0], size[1]) * 1.75, size[2] * 1.2 + 1.4))
    camera = bpy.context.object
    target = Vector((0, 0, size[2] * 0.43))
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = max(size[0], size[1], size[2]) * 1.68
    scene.camera = camera
    bpy.ops.object.light_add(type="AREA", location=(-4, -5, 8))
    light = bpy.context.object
    light.data.energy = 850
    light.data.shape = "DISK"
    light.data.size = 7
    light.rotation_euler = (target - light.location).to_track_quat("-Z", "Y").to_euler()
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    os.makedirs(OBJECT_OUT, exist_ok=True)
    with open(os.path.join(OUT, "catalog.json"), encoding="utf-8") as source:
        catalog = json.load(source)["assets"]
    existing = {item["id"] for item in catalog}
    for asset in NATURE_ASSETS + CAMP_ASSETS + BUILDING_ASSETS + WATERFRONT_ASSETS + LANDMARK_ASSETS:
        if asset[0] not in existing:
            catalog.append(export_asset(asset, new=True))
            existing.add(asset[0])
    with open(os.path.join(OUT, "catalog.json"), "w", encoding="utf-8") as out:
        json.dump({"version": 1, "assets": catalog}, out, indent=2)
    print("NEW_TOWN_ASSETS", len(catalog))
