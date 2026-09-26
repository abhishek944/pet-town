class_name WorkshopCatalog
extends RefCounted

const DATA := "res://assets/catalog.json"

var items: Array[Dictionary] = []
var by_id: Dictionary = {}
var scenes: Dictionary = {}

func load_all() -> bool:
	var file := FileAccess.open(DATA, FileAccess.READ)
	if file == null:
		push_error("Workshop catalog is missing")
		return false
	var parsed = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary or int(parsed.get("version", 0)) != 1:
		return false
	var records = parsed.get("assets", [])
	if not records is Array or records.is_empty():
		return false
	items.clear()
	by_id.clear()
	scenes.clear()
	for raw in records:
		if not raw is Dictionary:
			return false
		var item: Dictionary = raw
		var item_id := String(item.get("id", ""))
		if item_id.is_empty() or by_id.has(item_id) or not String(item.get("surface", "")) in ["land", "water"]:
			return false
		if float(item.get("width", 0)) <= 0.0 or float(item.get("depth", 0)) <= 0.0 or float(item.get("height", 0)) <= 0.0:
			return false
		var scene := load(String(item.get("scene", ""))) as PackedScene
		if scene == null:
			return false
		items.append(item)
		by_id[item_id] = item
		scenes[item_id] = scene
	return true

func get_item(item_id: String) -> Dictionary:
	return by_id.get(item_id, {})

func instantiate_model(item_id: String) -> Node3D:
	var scene := scenes.get(item_id) as PackedScene
	return scene.instantiate() as Node3D if scene != null else null
