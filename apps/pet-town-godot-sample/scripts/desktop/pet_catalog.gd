extends RefCounted
## Native additions stay separate from the regenerated browser-source catalog.
const ORIGINAL_IDS := ["maple", "clover", "juniper", "scout", "puddle", "moss", "mossback", "fern"]
const ADVENTURER_IDS := ["knight", "mage", "barbarian", "rogue", "ranger"]
const IDS := ORIGINAL_IDS + ADVENTURER_IDS

static func entries() -> Array:
	var result: Array = []
	for path in ["res://assets/companion-manifest.json", "res://assets/adventurer-companions.json"]:
		if not FileAccess.file_exists(path): continue
		var manifest = JSON.parse_string(FileAccess.get_file_as_string(path))
		if not manifest is Dictionary: continue
		for item in manifest.get("catalog", []):
			if not item is Dictionary or str(item.get("id", "")) not in IDS: continue
			var definition: Dictionary = item.duplicate(true)
			definition.path = "res://assets/" + str(definition.get("modelFile", ""))
			result.append(definition)
	return result
