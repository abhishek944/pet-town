"""Bake the shared, fixed 96 x 72 m island into a Godot-ready GLB.

Run once with Blender: blender -b --python assets/world/build_world.py
The formulas below shape a fixed mesh; the game never scatters scenery at runtime.
"""

import math
import os

import bpy

ROOT = os.path.dirname(__file__)
OUT = os.path.join(ROOT, "world-base.glb")
BLEND = os.path.abspath(os.path.join(ROOT, "..", "..", "..", "..", "art", "pet-town-next", "world-base.blend"))
SEGMENTS = 64
RX, RY = 47.2, 35.2


def material(name, rgb, roughness=0.9):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*rgb, 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*rgb, 1)
    shader.inputs["Roughness"].default_value = roughness
    return mat


MEADOW = material("Mossy meadow", (0.25, 0.37, 0.26))
SHORE = material("Golden shoreline", (0.64, 0.53, 0.36))
CLIFF = material("Lichen cliff", (0.27, 0.33, 0.31))


def radius(angle):
    return 1 + 0.024 * math.sin(5 * angle + 0.4) + 0.014 * math.sin(11 * angle - 0.8)


def height(x, y):
    # Smooth, walkable folds with three broad authored knolls and a soft center.
    hills = ((-23, 14, 0.84, 11), (17, -11, 1.03, 13), (27, 15, 0.45, 10))
    z = -0.14 + 0.13 * math.sin(x * 0.18 + y * 0.12)
    z += 0.09 * math.sin(y * 0.23 - x * 0.05)
    for hx, hy, rise, width in hills:
        z += rise * math.exp(-((x - hx) ** 2 + (y - hy) ** 2) / (2 * width * width))
    return z


def point(scale, angle, depth=0):
    r = radius(angle) * scale
    x, y = RX * r * math.cos(angle), RY * r * math.sin(angle)
    return (x, y, height(x, y) + depth)


def ring_mesh(name, rings, mat, height_offsets=None):
    centered = rings[0] == 0
    verts = [(0, 0, height(0, 0))] if centered else []
    steps = rings[1:] if centered else rings
    for ring_index, scale in enumerate(steps):
        offset = height_offsets[ring_index + int(centered)] if height_offsets else 0
        for i in range(SEGMENTS):
            verts.append(point(scale, math.tau * i / SEGMENTS, offset))
    faces = []
    if centered:
        for i in range(SEGMENTS):
            faces.append((0, 1 + i, 1 + (i + 1) % SEGMENTS))
    for ring_index in range(len(steps) - 1):
        for i in range(SEGMENTS):
            j = (i + 1) % SEGMENTS
            a = int(centered) + ring_index * SEGMENTS
            b = a + SEGMENTS
            faces.append((a + i, b + i, b + j, a + j))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(mat)
    mesh.update()
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def build():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    # Meadow and shore are walkable; the steep cliff remains collision only.
    ring_mesh("WalkableGround", (0, 0.16, 0.32, 0.48, 0.64, 0.76, 0.86, 0.92), MEADOW)
    ring_mesh("Shore", (0.92, 0.98, 1.0), SHORE, (0, -0.14, -0.33))
    ring_mesh("Cliff", (1.0, 1.018, 1.032), CLIFF, (-0.33, -1.15, -3.1))
    os.makedirs(os.path.dirname(BLEND), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_apply=True)
    print("WORLD_BASE", OUT, "bounds approximately", RX * 2, RY * 2)


if __name__ == "__main__":
    build()
