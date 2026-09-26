"""Turn authored color batches into movable flower patches without moving vertices."""

import collections
import math

import bpy


PLANT_WORDS = (" cream ", " lavender ", " leaf ", " leaf light ", " pink ", " red ", " white ", " meadow ", " fir ", " fir tips ", " wood ")
FAMILIES = ("Garden detail ", "Woodland detail ", "Coastal detail ")
GRID_SIZE = 0.35


def _family_and_tile(name):
    if not name.startswith(FAMILIES) or "[" not in name or "]" not in name:
        return None
    if not any(word in name for word in PLANT_WORDS):
        return None
    return name.split(" detail ", 1)[0], name.rsplit("[", 1)[-1].split("]", 1)[0]


def _connected_cells(occupied):
    remaining = set(occupied)
    components = []
    while remaining:
        start = remaining.pop()
        queue = [start]
        cells = [start]
        while queue:
            x, y = queue.pop()
            for neighbor in ((x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1)):
                if neighbor in remaining:
                    remaining.remove(neighbor)
                    queue.append(neighbor)
                    cells.append(neighbor)
        components.append(cells)
    return components


def split_detail_patches(source_objects, staging, make_fragment, link_mesh):
    grouped = collections.defaultdict(list)
    for obj in source_objects:
        key = _family_and_tile(obj.name)
        if key is not None:
            grouped[key].append(obj)
    removed = set()
    roots = []
    for key, sources in sorted(grouped.items()):
        cells = collections.defaultdict(list)
        locations = {}
        for source in sources:
            for face in source.data.polygons:
                center = source.matrix_world @ face.center
                cell = (math.floor(center.x / GRID_SIZE), math.floor(center.y / GRID_SIZE))
                cells[cell].append((source, face.index))
                locations[(source, face.index)] = center
        clusters = _connected_cells(cells)
        clusters.sort(key=lambda group: min(group))
        tile = key[1].replace(",", "_").replace("-", "m")
        for index, cluster in enumerate(clusters):
            faces_by_source = collections.defaultdict(list)
            centers = []
            for cell in cluster:
                for source, face_index in cells[cell]:
                    faces_by_source[source].append(face_index)
                    centers.append(locations[(source, face_index)])
            center = sum(centers, centers[0] * 0) / len(centers)
            root_name = "FlowerPatch_%s_%s_%03d" % (key[0], tile, index)
            root = bpy.data.objects.new(root_name, None)
            root.location = center
            root["pet_town_object_kind"] = "flower_patch"
            staging.objects.link(root)
            roots.append(root)
            for source, face_indices in faces_by_source.items():
                mesh = make_fragment(source, face_indices, root.location, root_name + "_" + source.name)
                link_mesh(mesh, source.name, staging, root)
        removed.update(sources)
    print("DETAIL PATCHES", len(roots), "from", len(removed), "authored color batches")
    return removed, roots
