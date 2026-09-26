"""Audit each exported GLB against the catalog. Run with Blender -b --python."""

import json
import os

import bpy
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ASSETS = os.path.join(ROOT, "assets")


def bounds():
    bpy.context.view_layer.update()
    points = [obj.matrix_world @ Vector(corner) for obj in bpy.context.scene.objects if obj.type == "MESH" for corner in obj.bound_box]
    return [min(point[i] for point in points) for i in range(3)], [max(point[i] for point in points) for i in range(3)]


with open(os.path.join(ASSETS, "catalog.json"), encoding="utf-8") as source:
    items = json.load(source)["assets"]

errors = []
seen = set()
for item in items:
    asset_id = item["id"]
    if asset_id in seen:
        errors.append(asset_id + ": duplicate ID")
    seen.add(asset_id)
    for key in ("scene", "thumbnail"):
        path = os.path.join(ROOT, item[key].removeprefix("res://"))
        if not os.path.isfile(path):
            errors.append(asset_id + ": missing " + key)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    model_path = os.path.join(ROOT, item["scene"].removeprefix("res://"))
    if not os.path.isfile(model_path):
        continue
    bpy.ops.import_scene.gltf(filepath=model_path)
    low, high = bounds()
    dimensions = [high[i] - low[i] for i in range(3)]
    for axis, expected in ((0, item["width"]), (1, item["depth"]), (2, item["height"])):
        if abs(dimensions[axis] - expected) > .035:
            errors.append("%s: axis %s dimension %s versus %s" % (asset_id, axis, dimensions[axis], expected))
    if abs(low[2]) > .03:
        errors.append("%s: pivot %.3f above ground" % (asset_id, low[2]))
    if abs((low[0] + high[0]) / 2) > .03 or abs((low[1] + high[1]) / 2) > .03:
        errors.append(asset_id + ": visual footprint is off center")
    if item["surface"] not in ("land", "water"):
        errors.append(asset_id + ": unknown surface")

print("ASSET_AUDIT", len(items), "objects,", len(errors), "errors")
for error in errors:
    print("ASSET_AUDIT_ERROR", error)
if errors:
    raise SystemExit(1)
