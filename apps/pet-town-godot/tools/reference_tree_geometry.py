"""Asset-specific topology checks for the 225 baked reference-garden trees."""
import bpy
import collections
import math

TREE_BATCH_PREFIXES = {
    "wood": "Reference render Reference wood ",
    "fir": "Reference render Reference fir.001 ",
    "tips": "Reference render Reference fir tips.001 ",
    "leaf": "Reference render Reference leaf ",
}


def batch_objects(prefix):
    return sorted((obj for obj in bpy.data.objects if obj.type == "MESH" and obj.name.startswith(prefix)), key=lambda obj: obj.name)


def connected_components(objects):
    result = []
    for obj in objects:
        mesh = obj.data
        adjacency = [[] for _ in mesh.vertices]
        for edge in mesh.edges:
            a, b = edge.vertices
            adjacency[a].append(b)
            adjacency[b].append(a)
        seen = bytearray(len(mesh.vertices))
        for start in range(len(mesh.vertices)):
            if seen[start]:
                continue
            seen[start] = 1
            stack = [start]
            ids = []
            while stack:
                index = stack.pop()
                ids.append(index)
                for neighbor in adjacency[index]:
                    if not seen[neighbor]:
                        seen[neighbor] = 1
                        stack.append(neighbor)
            coords = [obj.matrix_world @ mesh.vertices[index].co for index in ids]
            result.append({
                "center": (sum(v.x for v in coords) / len(coords), sum(v.y for v in coords) / len(coords)),
                "z_min": min(v.z for v in coords), "z_max": max(v.z for v in coords), "count": len(ids),
            })
    return result


def cluster_components(components, epsilon):
    buckets = collections.defaultdict(list)
    for index, item in enumerate(components):
        x, y = item["center"]
        buckets[(math.floor(x / epsilon), math.floor(y / epsilon))].append(index)
    visited = set()
    clusters = []
    for start in range(len(components)):
        if start in visited:
            continue
        visited.add(start)
        stack = [start]
        members = []
        while stack:
            index = stack.pop()
            members.append(components[index])
            x, y = components[index]["center"]
            gx, gy = math.floor(x / epsilon), math.floor(y / epsilon)
            for bx in range(gx - 1, gx + 2):
                for by in range(gy - 1, gy + 2):
                    for neighbor in buckets[(bx, by)]:
                        if neighbor in visited:
                            continue
                        nx, ny = components[neighbor]["center"]
                        if (nx - x) ** 2 + (ny - y) ** 2 <= epsilon ** 2:
                            visited.add(neighbor)
                            stack.append(neighbor)
        clusters.append({
            "center": (sum(item["center"][0] for item in members) / len(members),
                       sum(item["center"][1] for item in members) / len(members)),
            "z_min": min(item["z_min"] for item in members),
            "z_max": max(item["z_max"] for item in members), "count": len(members),
        })
    return clusters


def _distance(a, b):
    return math.dist(a["center"], b["center"])


def find_tree_roots():
    fir = cluster_components(connected_components(batch_objects(TREE_BATCH_PREFIXES["fir"])), 0.75)
    wood = cluster_components(connected_components(batch_objects(TREE_BATCH_PREFIXES["wood"])), 1.5)
    assert len(fir) == 150 and all(item["count"] == 18 for item in fir), "Unexpected fir batch topology"
    assert len(wood) == 281, "Unexpected wood batch topology"
    used_wood = set()
    for tree in fir:
        index = min(range(len(wood)), key=lambda i: _distance(tree, wood[i]))
        assert _distance(tree, wood[index]) < 0.002 and index not in used_wood, "Fir trunk positions changed"
        tree["z_min"], tree["z_max"] = wood[index]["z_min"], wood[index]["z_max"]
        tree["kind"] = "fir"
        used_wood.add(index)
    remaining = [item for index, item in enumerate(wood) if index not in used_wood]
    broad = [item for item in remaining if item["count"] == 9]
    assert len(broad) == 73, "Unexpected broadleaf trunk topology"
    extra = [item for item in remaining if item["count"] == 24 and math.dist(item["center"], (7.0, -52.8775)) < 0.1]
    extra += [item for item in remaining if item["count"] == 8 and math.dist(item["center"], (0.0, -58.14)) < 0.1]
    assert len(extra) == 2, "Unexpected lowland broadleaf trunk topology"
    broad += extra
    for tree in broad:
        tree["kind"] = "broadleaf"
    roots = sorted(fir + broad, key=lambda item: (item["center"][0], item["center"][1], item["kind"]))
    assert len(roots) == 225, "Expected 225 individually editable reference trees"
    return roots
