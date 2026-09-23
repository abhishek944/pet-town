class_name TownCatalog
extends RefCounted

const OPTIONS := [
	{"id": "round-tree", "name": "Round tree", "category": "Trees", "price": 1200, "variant": "round"},
	{"id": "pine-tree", "name": "Pine tree", "category": "Trees", "price": 1500, "variant": "pine"},
	{"id": "fir-tree", "name": "Fir tree", "category": "Trees", "price": 1500, "variant": "fir"},
	{"id": "apple-tree", "name": "Apple tree", "category": "Trees", "price": 2200, "variant": "apple"},
	{"id": "flower-patch", "name": "Flower patch", "category": "Gardens", "price": 400, "prefix": "flower:"},
	{"id": "garden-bench", "name": "Garden bench", "category": "Furniture", "price": 900, "needle": "NeighborhoodBench"},
	{"id": "street-lantern", "name": "Street lantern", "category": "Lights", "price": 1100, "needle": "StreetLantern"},
	{"id": "hanging-lantern", "name": "Hanging lantern", "category": "Lights", "price": 650, "prefix": "object:", "needle": "LANTERN - hanging Camp shelter"},
	{"id": "campfire", "name": "Campfire", "category": "Furniture", "price": 1500, "needle": "GatheringFire"},
	{"id": "camp-seat", "name": "Camp seat", "category": "Furniture", "price": 550, "prefix": "object:", "needle": "Campfire log seat"},
	{"id": "cooking-tripod", "name": "Cooking tripod", "category": "Furniture", "price": 700, "prefix": "object:", "needle": "Camp cooking tripod"},
	{"id": "canvas-tent", "name": "Canvas tent", "category": "Furniture", "price": 2400, "prefix": "object:", "needle": "Canvas camping tent"},
	{"id": "rose-cottage", "name": "Rose cottage", "category": "Homes", "price": 14000, "prefix": "object:", "needle": "Rose Cottage"},
	{"id": "fisher-house", "name": "Fisher's house", "category": "Homes", "price": 15000, "prefix": "object:", "needle": "Fishermans House"},
	{"id": "cedar-cabin", "name": "Cedar cabin", "category": "Homes", "price": 12000, "prefix": "object:", "needle": "BUILDING - Cedar A Frame"},
	{"id": "fisher-longhouse", "name": "Fisher's longhouse", "category": "Homes", "price": 21000, "prefix": "object:", "needle": "BUILDING - Fishermans Longhouse"},
	{"id": "keepers-cottage", "name": "Keeper's cottage", "category": "Homes", "price": 17000, "prefix": "object:", "needle": "BUILDING - Octagonal Keepers Cottage"},
	{"id": "pottery-studio", "name": "Pottery studio", "category": "Shops", "price": 19000, "prefix": "object:", "needle": "Pottery Studio"},
	{"id": "honeycomb-bakery", "name": "Honeycomb bakery", "category": "Shops", "price": 20000, "prefix": "object:", "needle": "Honeycomb Bakery"},
	{"id": "harbor-tea-house", "name": "Harbor tea house", "category": "Shops", "price": 20000, "prefix": "object:", "needle": "Harbor Tea House"},
	{"id": "hearth-bakery", "name": "Hearth bakery", "category": "Shops", "price": 23000, "prefix": "object:", "needle": "BUILDING - Hearth Bakery"},
	{"id": "tide-tea-house", "name": "Tide tea house", "category": "Shops", "price": 23000, "prefix": "object:", "needle": "BUILDING - Tide Tea House"},
	{"id": "fishing-boat", "name": "Fishing boat", "category": "Waterfront", "price": 3500, "prefix": "object:", "needle": "ANIM cream fishing boat"},
	{"id": "sailboat", "name": "Sailboat", "category": "Waterfront", "price": 4200, "prefix": "object:", "needle": "ANIM cruising sailboat"},
	{"id": "rowboat", "name": "Rowboat", "category": "Waterfront", "price": 1900, "prefix": "object:", "needle": "ANIM little rowboat"},
	{"id": "windmill", "name": "Windmill", "category": "Landmarks", "price": 18000, "prefix": "object:", "needle": "Windmill fixed base"},
	{"id": "lighthouse", "name": "Lighthouse", "category": "Landmarks", "price": 30000, "prefix": "object:", "needle": "Lighthouse fixed architecture"},
]

static func available(authored: Dictionary) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for option in OPTIONS:
		var source_id := ""
		for key in authored:
			var source := authored[key] as UserTree
			if not is_instance_valid(source):
				continue
			if option.has("prefix") and not String(key).begins_with(option["prefix"]):
				continue
			if option.has("needle") and option["needle"] in String(key):
				source_id = key
				break
			if option.has("variant") and String(key).begins_with("island:") and _tree_variant(source) == option["variant"]:
				source_id = key
				break
			if option.has("prefix") and not option.has("needle"):
				source_id = key
				break
		if not source_id.is_empty():
			var item: Dictionary = option.duplicate()
			item["source_id"] = source_id
			result.append(item)
	return result

static func _tree_variant(source: UserTree) -> String:
	var names := ""
	for part in source.find_children("*", "MeshInstance3D", true, false):
		names += String(part.name).to_lower() + " "
	if "faceted apple tree crown" in names:
		return "apple"
	if "layered evergreen crown" in names:
		return "pine"
	if "low-poly fir foliage" in names:
		return "fir"
	return "round"
