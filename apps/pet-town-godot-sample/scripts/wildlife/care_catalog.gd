extends RefCounted
## Species definitions come from the same export as the living wildlife.

static func entries() -> Array:
	var manifest = JSON.parse_string(FileAccess.get_file_as_string("res://assets/wildlife-manifest.json"))
	var result: Array = []
	var seen := {}
	if not manifest is Dictionary: return result
	for actor in manifest.get("actors", []):
		var id := str(actor.get("species", ""))
		if id.is_empty() or seen.has(id): continue
		seen[id] = true
		var definition: Dictionary = actor.get("definition", {})
		var biomes: Array = definition.get("biomes", [])
		result.append({"id": id, "name": str(definition.get("name", actor.get("name", id))),
			"blurb": str(definition.get("blurb", "")), "habitat": ", ".join(biomes).capitalize(),
			"path": "res://assets/%s.glb" % str(actor.get("model", ""))})
	return result

static func mood(score: int) -> String:
	return "Happy" if score >= 80 else "Content" if score >= 40 else "Feeling low"
