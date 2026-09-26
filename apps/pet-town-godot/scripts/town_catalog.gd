class_name TownCatalog
extends RefCounted

const OPTIONS := [
	{"id": "round-tree", "name": "Round tree", "category": "Trees", "price": 1200, "variant": "round"},
	{"id": "pine-tree", "name": "Pine tree", "category": "Trees", "price": 1500, "variant": "pine"},
	{"id": "fir-tree", "name": "Fir tree", "category": "Trees", "price": 1500, "variant": "fir"},
	{"id": "apple-tree", "name": "Apple tree", "category": "Trees", "price": 2200, "variant": "apple"},
	{"id": "flower-patch", "name": "Flower patch", "category": "Gardens", "price": 400, "prefix": "flower:"},
	{"id": "garden-detail-stone", "name": "Garden detail stone", "category": "Gardens", "price": 180, "prefix": "reference:", "needle": "Garden detail stone"},
	{"id": "garden-fence", "name": "Garden fence", "category": "Gardens", "price": 350, "prefix": "reference:", "needle": "Garden detail fence"},
	{"id": "heather-clump", "name": "Heather clump", "category": "Gardens", "price": 180, "prefix": "object:", "needle": "Heather clump"},
	{"id": "forest-fern", "name": "Forest fern", "category": "Gardens", "price": 160, "prefix": "object:", "needle": "Forest floor fern"},
	{"id": "paving-stone", "name": "Paving stone", "category": "Paths", "price": 80, "prefix": "paver:", "needle": "Garden detail paver ["},
	{"id": "light-paving-stone", "name": "Light paving stone", "category": "Paths", "price": 80, "prefix": "paver:", "needle": "Garden detail paver light ["},
	{"id": "garden-bench", "name": "Garden bench", "category": "Furniture", "price": 900, "needle": "NeighborhoodBench"},
	{"id": "camp-bench", "name": "Camp bench", "category": "Furniture", "price": 750, "prefix": "decoration:", "needle": "CampBench_"},
	{"id": "fishing-crate", "name": "Fishing crate", "category": "Furniture", "price": 420, "prefix": "object:", "needle": "Slatted fishing crate"},
	{"id": "harbor-barrel", "name": "Harbor barrel", "category": "Furniture", "price": 380, "prefix": "object:", "needle": "Harbor barrel"},
	{"id": "street-lantern", "name": "Street lantern", "category": "Lights", "price": 1100, "needle": "StreetLantern"},
	{"id": "hanging-lantern", "name": "Hanging lantern", "category": "Lights", "price": 650, "prefix": "object:", "needle": "LANTERN - hanging Camp shelter"},
	{"id": "trail-lantern", "name": "Trail lantern", "category": "Lights", "price": 850, "prefix": "object:", "needle": "LANTERN - trail"},
	{"id": "camp-string-lights", "name": "Camp string lights", "category": "Lights", "price": 1200, "prefix": "decoration:", "needle": "CampFestoon_"},
	{"id": "campfire", "name": "Campfire", "category": "Furniture", "price": 1500, "needle": "GatheringFire"},
	{"id": "camp-seat", "name": "Camp seat", "category": "Furniture", "price": 550, "prefix": "object:", "needle": "Campfire log seat"},
	{"id": "cooking-tripod", "name": "Cooking tripod", "category": "Furniture", "price": 700, "prefix": "object:", "needle": "Camp cooking tripod"},
	{"id": "canvas-tent", "name": "Canvas tent", "category": "Furniture", "price": 2400, "prefix": "object:", "needle": "Canvas camping tent"},
	{"id": "rose-cottage", "name": "Rose cottage", "category": "Homes", "price": 14000, "prefix": "object:", "needle": "Rose Cottage"},
	{"id": "fisher-house", "name": "Fisher's house", "category": "Homes", "price": 15000, "prefix": "object:", "needle": "Fishermans House"},
	{"id": "fernwood-chalet", "name": "Fernwood chalet", "category": "Homes", "price": 15000, "prefix": "object:", "needle": "Fernwood Chalet"},
	{"id": "lighthouse-keeper-home", "name": "Lighthouse keeper's home", "category": "Homes", "price": 17000, "prefix": "object:", "needle": "Lighthouse Keeper"},
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
	{"id": "woodland-rowboat", "name": "Woodland rowboat", "category": "Waterfront", "price": 1900, "prefix": "object:", "needle": "ANIM woodland rowboat"},
	{"id": "blue-trawler", "name": "Blue trawler", "category": "Waterfront", "price": 4200, "prefix": "object:", "needle": "ANIM moored blue trawler"},
	{"id": "coral-sailboat", "name": "Coral sailboat", "category": "Waterfront", "price": 4200, "prefix": "object:", "needle": "ANIM moored coral sailboat"},
	{"id": "coastal-granite", "name": "Coastal granite", "category": "Waterfront", "price": 220, "prefix": "reference:", "needle": "Coastal detail coastal granite"},
	{"id": "shore-boulder", "name": "Shore boulder", "category": "Waterfront", "price": 330, "prefix": "object:", "needle": "Shore boulder"},
	{"id": "coastal-rock", "name": "Coastal rock formation", "category": "Waterfront", "price": 540, "prefix": "object:", "needle": "Faceted coastal rock formation"},
	{"id": "small-coastal-stone", "name": "Small coastal stone", "category": "Waterfront", "price": 140, "prefix": "object:", "needle": "Small grounded coastal stone"},
	{"id": "mooring-rope", "name": "Mooring rope", "category": "Waterfront", "price": 180, "prefix": "object:", "needle": "Coiled mooring rope"},
	{"id": "windmill", "name": "Windmill", "category": "Landmarks", "price": 18000, "prefix": "object:", "needle": "Windmill fixed base"},
	{"id": "lighthouse", "name": "Lighthouse", "category": "Landmarks", "price": 30000, "prefix": "object:", "needle": "Lighthouse fixed architecture"},
]

static func available(authored: Dictionary) -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for option in OPTIONS:
		var source_id := ""
		for key in authored:
			var source := authored[key] as UserTree
			if not is_instance_valid(source) or not source.visible:
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
	if not source.tree_variant.is_empty():
		return source.tree_variant
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
