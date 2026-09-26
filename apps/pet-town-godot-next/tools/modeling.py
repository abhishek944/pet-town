"""Small, deterministic Blender primitives for the ten standalone town assets."""

import math

import bpy
from mathutils import Vector


def material(name, color, roughness=0.82, metallic=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = (*color, 1.0)
    node.inputs["Roughness"].default_value = roughness
    node.inputs["Metallic"].default_value = metallic
    return mat


M = {
    "grass": material("Meadow sage", (0.32, 0.46, 0.33)),
    "sand": material("Warm shore", (0.75, 0.65, 0.47)),
    "cliff": material("Slate cliff", (0.31, 0.37, 0.35)),
    "pine": material("Pine needle", (0.13, 0.30, 0.23)),
    "pine_light": material("Pine highlight", (0.19, 0.39, 0.29)),
    "leaf": material("Orchard leaf", (0.34, 0.48, 0.29)),
    "wood": material("Honey wood", (0.42, 0.25, 0.14)),
    "wood_light": material("Weathered wood", (0.59, 0.39, 0.24)),
    "cream": material("Cottage cream", (0.85, 0.78, 0.60)),
    "roof": material("Terracotta roof", (0.54, 0.27, 0.20)),
    "teal": material("Harbor teal", (0.23, 0.46, 0.43)),
    "stone": material("Coastal granite", (0.46, 0.50, 0.49)),
    "stone_light": material("Stone highlight", (0.63, 0.66, 0.58)),
    "glass": material("Warm window", (1.0, 0.81, 0.48), 0.22),
    "metal": material("Iron", (0.22, 0.27, 0.27), 0.36, 0.35),
    "pink": material("Rose pink", (0.81, 0.40, 0.53)),
    "lavender": material("Lavender", (0.56, 0.43, 0.70)),
    "water": material("Lagoon", (0.12, 0.35, 0.39), 0.3),
}


def finish(obj, name, mat):
    obj.name = name
    obj.data.materials.append(M[mat])
    return obj


def cube(name, location, size, mat, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = obj.modifiers.new("Soft edges", "BEVEL")
        mod.width = bevel
        mod.segments = 1
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
        obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    return finish(obj, name, mat)


def cylinder(name, location, radius, depth, mat, vertices=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    return finish(bpy.context.object, name, mat)


def cone(name, location, radius1, radius2, depth, mat, vertices=10):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices, radius1=radius1, radius2=radius2, depth=depth, location=location)
    return finish(bpy.context.object, name, mat)


def ico(name, location, radius, mat, subdivisions=1, scale=None):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=radius, location=location)
    obj = bpy.context.object
    if scale is not None:
        obj.scale = scale
    return finish(obj, name, mat)


def beam(name, start, end, width, mat):
    a, b = Vector(start), Vector(end)
    obj = cube(name, (a + b) / 2, (width, width, (b - a).length), mat)
    obj.rotation_euler = (b - a).to_track_quat("Z", "Y").to_euler()
    return obj


def roof(name, center, width, depth, rise, mat):
    x, y, z = center
    w, d = width / 2, depth / 2
    verts = [(-w, -d, 0), (w, -d, 0), (-w, d, 0), (w, d, 0), (0, -d, rise), (0, d, rise)]
    faces = [(0, 2, 5, 4), (4, 5, 3, 1), (0, 4, 1), (2, 3, 5)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(M[mat])
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = (x, y, z)
    return obj


def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def bounds(objects):
    points = [obj.matrix_world @ Vector(corner) for obj in objects if obj.type == "MESH" for corner in obj.bound_box]
    return [min(point[i] for point in points) for i in range(3)], [max(point[i] for point in points) for i in range(3)]


def normalize_ground(objects):
    bpy.context.view_layer.update()
    low, high = bounds(objects)
    x = (low[0] + high[0]) * 0.5
    y = (low[1] + high[1]) * 0.5
    for obj in objects:
        obj.location.x -= x
        obj.location.y -= y
        obj.location.z -= low[2]
    bpy.context.view_layer.update()
    low, high = bounds(objects)
    assert abs(low[2]) < 0.001, (low, high)
    return [round(high[i] - low[i], 3) for i in range(3)]
