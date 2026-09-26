"""Split the 225 baked reference-garden trees and preserve individual garden details.

Run from the repository root with:
  blender -b var/large-cozy-town/grand-moonhaven-reference-garden.blend \
    --python apps/pet-town-godot/tools/export_editable_reference_gardens.py -- \
    --output apps/pet-town-godot/assets/cozy-island/reference-gardens-editable.glb
"""
import argparse
import bmesh
import bpy
import collections
import json
import math
import os
import struct
import sys
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from reference_tree_geometry import TREE_BATCH_PREFIXES, batch_objects, find_tree_roots
from reference_detail_patches import split_detail_patches

EXPECTED_POLYGONS = {"wood": 2031, "fir": 2700, "tips": 1350, "leaf": 7900}
EXPECTED_REFERENCE_SOURCE_OBJECTS = 1737
SUPPLEMENTAL_STATIC_OBJECTS = ("Calm open ocean",)
TREE_MATERIALS = {
    "wood": "Reference wood",
    "fir": "Reference fir.001",
    "tips": "Reference fir tips.001",
    "leaf": "Reference leaf",
}


def parse_args():
    raw = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="apps/pet-town-godot/assets/cozy-island/reference-gardens-editable.glb")
    return parser.parse_args(raw)


def nearest_tree(point, roots, kinds=None):
    candidates = [(index, tree) for index, tree in enumerate(roots) if kinds is None or tree["kind"] in kinds]
    return min(((math.hypot(point.x - tree["center"][0], point.y - tree["center"][1]), index, tree) for index, tree in candidates), key=lambda item: item[0])


def face_assignments(obj, category, roots):
    candidates = {"fir": {"fir"}, "tips": {"fir"}, "leaf": {"broadleaf"}}.get(category)
    assigned = collections.defaultdict(list)
    residual = []
    for polygon in obj.data.polygons:
        center = obj.matrix_world @ polygon.center
        distance_to_tree, index, tree = nearest_tree(center, roots, candidates)
        if category == "wood":
            keep = distance_to_tree <= 0.85
        elif category == "leaf":
            keep = distance_to_tree <= 4.5 and center.z >= tree["z_max"] - 1.0
        else:
            keep = distance_to_tree <= 1.25
        if keep:
            assigned[index].append(polygon.index)
        else:
            residual.append(polygon.index)
    return assigned, residual


def make_fragment(source, face_indices, offset, name):
    bm = bmesh.new()
    bm.from_mesh(source.data)
    bm.faces.ensure_lookup_table()
    bm.faces.index_update()
    keep = set(face_indices)
    discard = [face for face in bm.faces if face.index not in keep]
    if discard:
        bmesh.ops.delete(bm, geom=discard, context="FACES_ONLY")
    loose_edges = [edge for edge in bm.edges if not edge.link_faces]
    if loose_edges:
        bmesh.ops.delete(bm, geom=loose_edges, context="EDGES")
    loose_verts = [vert for vert in bm.verts if not vert.link_edges]
    if loose_verts:
        bmesh.ops.delete(bm, geom=loose_verts, context="VERTS")
    bm.transform(source.matrix_world)
    if offset is not None:
        bm.transform(Matrix.Translation(-Vector(offset)))
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for slot in source.material_slots:
        mesh.materials.append(slot.material)
    mesh.update()
    return mesh


def link_mesh(mesh, name, collection, parent=None):
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    if parent is not None:
        obj.parent = parent
        obj.matrix_parent_inverse = Matrix.Identity(4)
    return obj


def validate_export(output_path, static_objects, roots, detail_roots):
    with open(output_path, "rb") as glb_file:
        data = glb_file.read()
    assert data[:4] == b"glTF", "Export is not a GLB file"
    version, declared_length = struct.unpack_from("<II", data, 4)
    assert version == 2 and declared_length == len(data), "Invalid GLB header or length"
    offset = 12
    document = None
    while offset < len(data):
        chunk_length, chunk_type = struct.unpack_from("<II", data, offset)
        offset += 8
        chunk = data[offset:offset + chunk_length]
        offset += chunk_length
        if chunk_type == 0x4E4F534A:
            document = json.loads(chunk.rstrip(b" \\t\\r\\n\\0"))
            break
    assert document is not None, "GLB is missing its JSON scene"
    exported_names = {node.get("name", "") for node in document.get("nodes", [])}
    expected_static_names = {obj.name for obj in static_objects}
    missing_static = sorted(expected_static_names - exported_names)
    assert not missing_static, "Static source meshes missing from GLB: %s" % missing_static
    expected_tree_names = {tree["object"].name for tree in roots}
    missing_trees = sorted(expected_tree_names - exported_names)
    assert not missing_trees, "Editable tree roots missing from GLB: %s" % missing_trees
    missing_details = sorted({obj.name for obj in detail_roots} - exported_names)
    assert not missing_details, "Editable flower patches missing from GLB: %s" % missing_details
    print("STATIC INVENTORY VERIFIED", len(expected_static_names), "source meshes; supplemental", list(SUPPLEMENTAL_STATIC_OBJECTS), "editable roots", len(expected_tree_names))


def build_export(roots, output_path):
    source_collection = bpy.data.collections.get("REFERENCE - Gardens cobbles fences and village details")
    assert source_collection is not None, "Missing original reference garden collection"
    source_objects = list(source_collection.objects)
    assert len(source_objects) == EXPECTED_REFERENCE_SOURCE_OBJECTS, "Unexpected source inventory"
    tree_batches = {category: batch_objects(prefix) for category, prefix in TREE_BATCH_PREFIXES.items()}
    staging = bpy.data.collections.new("PET TOWN EDITABLE TREE EXPORT")
    bpy.context.scene.collection.children.link(staging)
    for index, tree in enumerate(roots):
        root = bpy.data.objects.new("EditableTree_%03d" % index, None)
        root.empty_display_type = "PLAIN_AXES"
        root.location = (*tree["center"], tree["z_min"])
        root["pet_town_tree_id"] = root.name
        staging.objects.link(root)
        tree["object"] = root
    moved_counts = collections.Counter()
    for category in TREE_MATERIALS:
        for source in tree_batches[category]:
            assigned, residual = face_assignments(source, category, roots)
            for tree_index, face_indices in assigned.items():
                mesh = make_fragment(source, face_indices, roots[tree_index]["object"].location, "TreePart_%s_%03d" % (category, tree_index))
                link_mesh(mesh, "TreePart_%s_%s" % (category, source.name), staging, roots[tree_index]["object"])
                moved_counts[category] += len(face_indices)
            if residual:
                mesh = make_fragment(source, residual, None, source.name + " Static")
                link_mesh(mesh, source.name + " Static", staging)
    assert dict(moved_counts) == EXPECTED_POLYGONS, "Unexpected extracted tree geometry: %s" % dict(moved_counts)
    detail_sources, detail_roots = split_detail_patches(source_objects, staging, make_fragment, link_mesh)
    output_scene = bpy.data.scenes.new("Pet Town Editable Reference Export")
    output_collection = bpy.data.collections.new("Pet Town Export Objects")
    output_scene.collection.children.link(output_collection)
    # Keep the optimized tree materials because their edited geometry differs
    # from the older source collection. Other materials retain authored names.
    split_sources = {obj for obj in source_objects if obj.data.materials and obj.data.materials[0].name in TREE_MATERIALS.values()}
    static_objects = [obj for obj in source_objects if obj not in split_sources and obj not in detail_sources]
    for object_name in SUPPLEMENTAL_STATIC_OBJECTS:
        supplemental = bpy.data.objects.get(object_name)
        assert supplemental is not None and supplemental.type == "MESH", "Missing supplemental static mesh: " + object_name
        if supplemental not in static_objects:
            static_objects.append(supplemental)
    for obj in static_objects:
        output_collection.objects.link(obj)
    output_collection.children.link(staging)
    if bpy.context.window is not None:
        bpy.context.window.scene = output_scene
    print("EXPORT SCENE", output_scene.name, "objects", len(output_scene.objects), "static meshes", len(static_objects), "source batches split", len(split_sources), "supplemental static meshes", list(SUPPLEMENTAL_STATIC_OBJECTS))
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    result = bpy.ops.export_scene.gltf(
        filepath=os.path.abspath(output_path), export_format="GLB", use_selection=False,
        use_active_scene=True, use_visible=False, export_yup=True, export_apply=False,
        export_animations=False, export_cameras=False,
        export_lights=False, export_materials="EXPORT", export_extras=True,
    )
    assert "FINISHED" in result and os.path.isfile(output_path), "Blender GLB export failed"
    validate_export(output_path, static_objects, roots, detail_roots)
    print("EXPORTED", len(roots), "editable trees; polygons", dict(moved_counts), "file", output_path)


args = parse_args()
build_export(find_tree_roots(), args.output)
