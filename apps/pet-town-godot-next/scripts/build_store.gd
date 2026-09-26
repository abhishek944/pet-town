class_name WorkshopStore
extends RefCounted

const VERSION := 1
const CHILL_LAYOUT := "res://assets/chill_layout.json"
var mode := "build"

func path() -> String:
	var test_dir := OS.get_environment("PET_TOWN_TEST_DATA_DIR")
	var file_name := "%s-layout.json" % mode
	return test_dir.path_join(file_name) if not test_dir.is_empty() else "user://" + file_name

func load_records() -> Array:
	if not FileAccess.file_exists(path()):
		if mode == "chill":
			var starter := FileAccess.open(CHILL_LAYOUT, FileAccess.READ)
			if starter != null:
				var authored = JSON.parse_string(starter.get_as_text())
				if authored is Dictionary and int(authored.get("version", 0)) == VERSION and authored.get("objects") is Array:
					return authored["objects"]
		return []
	var file := FileAccess.open(path(), FileAccess.READ)
	if file == null:
		return []
	var parsed = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary or int(parsed.get("version", 0)) != VERSION:
		return []
	var records = parsed.get("objects", [])
	return records if records is Array else []

func save_records(records: Array) -> bool:
	var location := ProjectSettings.globalize_path(path())
	if DirAccess.make_dir_recursive_absolute(location.get_base_dir()) != OK:
		return false
	var temporary := location + ".tmp"
	var file := FileAccess.open(temporary, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify({"version": VERSION, "objects": records}, "  ") + "\n")
	file.flush()
	file.close()
	return DirAccess.rename_absolute(temporary, location) == OK

func populate(editor: Node3D, catalog: WorkshopCatalog, limit: int) -> int:
	var next_id := 1
	var projecting_seed := mode == "chill" and not FileAccess.file_exists(path())
	for raw in load_records():
		if not raw is Dictionary or editor.get_child_count() >= limit:
			continue
		var item: Dictionary = raw
		var object_id := String(item.get("id", ""))
		var asset_id := String(item.get("asset_id", ""))
		var position_value = item.get("position", [])
		if not object_id.begins_with("object-") or catalog.get_item(asset_id).is_empty() or not position_value is Array or position_value.size() != 3:
			continue
		var placed := editor.call("create_object", asset_id, object_id) as WorkshopObject
		if placed == null:
			continue
		placed.position = Vector3(float(position_value[0]), float(position_value[1]), float(position_value[2]))
		if projecting_seed:
			var start := placed.global_position + Vector3.UP * 100.0
			var surface_layer := 8 if String(placed.definition.get("surface", "land")) == "water" else 16
			var hit := editor.get_world_3d().direct_space_state.intersect_ray(PhysicsRayQueryParameters3D.create(start, start + Vector3.DOWN * 200.0, surface_layer))
			if not hit.is_empty():
				placed.global_position = hit.position
		placed.rotation.y = float(item.get("rotation_y", 0.0))
		placed.scale = Vector3.ONE * clampf(float(item.get("scale", 1.0)), 0.5, 2.0)
		next_id = maxi(next_id, int(object_id.trim_prefix("object-")) + 1)
	return next_id
