"""Reject incomplete source exports and nested dependencies before packaging."""

import base64
import json
import re
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORLD = ROOT / "apps/pet-town-godot-sample"
ASSETS = WORLD / "assets"
EXTENSIONS = r"(?:json|glb|png|jpg|jpeg|webp|ogg|wav|mp3|svg)"
PETS = {"maple", "clover", "juniper", "scout", "puddle", "moss", "mossback", "fern"}
ADVENTURERS = {"knight", "mage", "barbarian", "rogue", "ranger"}
CLIPS = {"idle", "walk", "run", "jump", "glide", "swim"}
SIZES = {
    "Float32Array": 4,
    "Uint32Array": 4,
    "Uint16Array": 2,
    "Uint8Array": 1,
    "Int8Array": 1,
    "Int16Array": 2,
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def asset_path(name):
    require(isinstance(name, str) and bool(name), "Asset filename must be nonempty")
    name = name.removeprefix("res://assets/")
    relative = Path(name)
    require(
        not relative.is_absolute() and ".." not in relative.parts,
        f"Unsafe native asset reference: {name}",
    )
    path = (ASSETS / relative).resolve()
    require(path.is_relative_to(ASSETS.resolve()), f"Asset escapes export directory: {name}")
    require(path.is_file() and path.stat().st_size > 0, f"Missing native source asset: {name}")
    return path


def read(name):
    data = json.loads(asset_path(name).read_text())
    require(isinstance(data, dict), f"Invalid native JSON object: {name}")
    return data


def gltf(path):
    with path.open("rb") as stream:
        header = stream.read(20)
        require(len(header) == 20, f"Truncated GLB: {path.name}")
        magic, version, length, chunk, kind = struct.unpack("<5I", header)
        expected = (0x46546C67, 2, path.stat().st_size, 0x4E4F534A)
        require((magic, version, length, kind) == expected, f"Invalid GLB: {path.name}")
        require(chunk <= length - 20, f"Truncated GLB JSON: {path.name}")
        return json.loads(stream.read(chunk))


def dependencies(value, visited):
    if isinstance(value, dict):
        for key, child in value.items():
            if (key == "file" or key.endswith("File")) and child is not None:
                visit(child, visited)
            else:
                dependencies(child, visited)
    elif isinstance(value, list):
        for child in value:
            dependencies(child, visited)
    elif isinstance(value, str) and not value.startswith("data:"):
        reference = re.fullmatch(rf"(?:res://assets/)?[^\s]+\.{EXTENSIONS}", value)
        if reference:
            visit(value, visited)


def visit(name, visited):
    path = asset_path(name)
    if path in visited:
        return
    visited.add(path)
    if path.suffix == ".json":
        dependencies(read(name), visited)
    elif path.suffix == ".glb":
        dependencies(gltf(path), visited)


def packed(data, count, size, label):
    require(data["count"] == count and data["itemSize"] == size, f"Wrong buffer count: {label}")
    length = len(base64.b64decode(data["base64"], validate=True))
    require(length == count * size * SIZES[data["type"]], f"Truncated buffer: {label}")


def validate():
    manifest = read("region-manifest.json")
    coverage, bounds = manifest["coverage"], manifest["bounds"]
    dry = coverage["totalDryLandCells"]
    require(coverage["includedDryLandCells"] == dry > 0, "Incomplete source dry land")
    require(bounds == manifest["sourceBounds"], "Godot bounds differ from source world")
    require(coverage["percent"] == 100, "Godot coverage must be 100%")
    visited = set()
    visit("region-manifest.json", visited)
    for name in ["wildlife-manifest.json", "manifest.json", "explorer.glb"]:
        visit(name, visited)
    for name in ["region-vegetation-ranks.json", "region-shadow-mask.png"]: visit(name, visited)
    catalog = json.loads((WORLD / "scripts/actions/source-data.json").read_text())
    dependencies(catalog, visited)
    cells = read(manifest["groundFile"])["cells"]
    width, depth = int(bounds["maxX"] - bounds["minX"]), int(bounds["maxZ"] - bounds["minZ"])
    require(len(cells) == width * depth, "Ground export does not cover all source columns")
    require(sum(not cell[3] for cell in cells) == dry, "Ground coverage differs")
    voxels = read(manifest["voxels"]["file"])
    require((voxels["width"], voxels["depth"]) == (width, depth), "Voxel dimensions differ")
    require(voxels["bounds"] == bounds, "Voxel bounds differ")
    packed(voxels["cells"], width * depth * voxels["height"], 1, "voxels")
    chunks = manifest["terrain"]["chunks"]
    require(bool(chunks) and bool(manifest["terrain"]["layers"]), "Terrain or atlas is empty")
    require(len({chunk["file"] for chunk in chunks}) == len(chunks), "Duplicate terrain chunks")
    for chunk in chunks:
        geometry = read(chunk["file"])
        packed(geometry["attributes"]["position"], chunk["vertexCount"], 3, chunk["file"])
        packed(geometry["index"], int(chunk["triangles"] * 3), 1, chunk["file"])
    fields = manifest["vegetation"]["fields"]
    require(
        sum(field["count"] for field in fields) == manifest["vegetation"]["instanceCount"] > 0,
        "Vegetation instance total differs from exported fields",
    )
    for field in fields:
        instances = read(field["instanceFile"])
        require(
            instances["count"] == field["count"] and bool(field["lods"]),
            "Incomplete vegetation field",
        )
        packed(instances["matrices"], field["count"], 16, field["instanceFile"])
        packed(instances["colors"], field["count"], 3, field["instanceFile"])
    ranks = read("region-vegetation-ranks.json")["fields"]
    require(
        sum(len(field["items"]) for field in ranks) == manifest["vegetation"]["instanceCount"],
        "Vegetation rank metadata differs from instance count",
    )
    expected = {entry["id"] for entry in catalog["assets"]}
    placed = {
        prop.get("entry", {}).get("assetId")
        for prop in manifest["props"]
        if isinstance(prop.get("entry"), dict) and prop.get("file")
    }
    require(expected <= placed, f"Source library assets missing: {sorted(expected - placed)}")
    companions = read(manifest["companionsFile"])
    require(
        len(companions["catalog"]) == len(PETS)
        and {entry["id"] for entry in companions["catalog"]} == PETS,
        "Incomplete original pet catalog",
    )
    extras = read("adventurer-companions.json")["catalog"]
    require(len(extras) == 5 and {entry["id"] for entry in extras} == ADVENTURERS, "Incomplete Adventurers catalog")
    dependencies(extras, visited)
    for entry in [*companions["catalog"], companions["mayor"], *extras]:
        model = gltf(asset_path(entry["modelFile"]))
        require(
            {clip["name"] for clip in model.get("animations", [])} >= CLIPS,
            f"Missing companion animations: {entry['id']}",
        )
    wildlife = read("wildlife-manifest.json")
    models = {entry["name"] for entry in wildlife["assets"]}
    require(
        bool(models)
        and bool(wildlife["actors"])
        and all(actor["model"] in models for actor in wildlife["actors"]),
        "Incomplete wildlife models",
    )
    for model in models:
        visit(f"{model}.glb", visited)
    for icon in ["heart", "sparkle", "question", "exclaim", "note"]:
        visit(f"wildlife-{icon}.png", visited)
    basic = read("manifest.json")
    require(len(basic["icons"]) == 12, "Block palette requires all 12 original icons")
    for icon in basic["icons"]:
        visit(f"icon-{icon['index']}.png", visited)
    for item in basic["assets"]:
        visit(f"{item['name']}.glb", visited)
    ocean = read(manifest["oceanFile"])
    ocean_counts = {"places": 5, "experiences": 7, "schools": 3, "wildlife": 5}
    require(all(len(ocean[key]) == n for key, n in ocean_counts.items()), "Incomplete ocean")
    require(
        all(school["count"] == 18 for school in ocean["schools"]),
        "Incomplete original fish schools",
    )
    require(
        ocean["scenery"] and ocean["boat"]["file"] and ocean["boat"]["dockFile"],
        "Ocean scenery, launch or dock is missing",
    )
    print(
        f"Full Godot source coverage: {coverage['totalDryLandCells']} dry cells, 100%; "
        f"{len(visited)} dependencies, {len(expected)} library assets, {len(PETS) + len(extras)} companion appearances"
    )

if __name__ == "__main__":
    validate()
