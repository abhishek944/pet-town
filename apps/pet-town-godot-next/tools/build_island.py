"""Author the standalone Build island at half the old terrain's linear size."""

import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(__file__))
from modeling import M, clear

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "assets", "half-island.glb")
SEGMENTS = 48
RINGS = [(0.0, 0.0), (0.82, 0.0), (0.94, 0.0), (1.0, -0.18), (1.045, -0.68), (1.03, -3.5)]
RX, RY = 48.0, 36.0


def build():
    clear()
    vertices = []
    faces = []
    materials = []
    for scale, height in RINGS:
        for index in range(SEGMENTS):
            angle = math.tau * index / SEGMENTS
            wobble = 1.0 + 0.018 * math.sin(angle * 7) + 0.012 * math.sin(angle * 13)
            vertices.append((RX * scale * wobble * math.cos(angle), RY * scale * wobble * math.sin(angle), height))
    for ring in range(len(RINGS) - 1):
        for index in range(SEGMENTS):
            neighbor = (index + 1) % SEGMENTS
            lower = ring * SEGMENTS
            upper = (ring + 1) * SEGMENTS
            faces.append((lower + index, upper + index, upper + neighbor, lower + neighbor))
            materials.append(0 if ring == 0 else 1 if ring in (1, 2) else 2)
    mesh = bpy.data.meshes.new("Half island terrain")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.clear()
    for key in ("grass", "sand", "cliff"):
        mesh.materials.append(M[key])
    mesh.update()
    for polygon, material in zip(mesh.polygons, materials):
        polygon.material_index = material
    obj = bpy.data.objects.new("Half island terrain", mesh)
    bpy.context.collection.objects.link(obj)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_apply=True)
    print("NEW_TOWN_ISLAND", RX * 2, RY * 2, len(mesh.polygons))


if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    build()
