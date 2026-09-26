extends "res://scripts/main_avatar.gd"

const MODE_FILE := "town-mode.json"
var town_mode := "chill"

func _share_ocean_between_modes() -> void:
	var ocean := get_node_or_null("TownDecorations/ReferenceGardens/BlenderAuthoredDetails/Calm open ocean") as MeshInstance3D
	if ocean == null:
		return
	ocean.reparent(self, true)
	ocean.name = "CalmOpenOcean"

func _mode_path() -> String:
	var test_dir := OS.get_environment("PET_TOWN_TEST_DATA_DIR")
	if not test_dir.is_empty():
		return test_dir.path_join(MODE_FILE)
	return OS.get_environment("HOME").path_join(".pet-town").path_join(MODE_FILE)

func _initialize_town_mode() -> void:
	var saved := "chill"
	if FileAccess.file_exists(_mode_path()):
		var file := FileAccess.open(_mode_path(), FileAccess.READ)
		var parsed = JSON.parse_string(file.get_as_text()) if file != null else null
		if parsed is Dictionary and parsed.get("mode") in ["chill", "build"]:
			saved = parsed["mode"]
	_set_town_mode(saved, false)

func _set_town_mode(value: String, persist := true) -> void:
	if value not in ["chill", "build"]:
		return
	town_mode = value
	var building := town_mode == "build"
	get_node("BuildLand").visible = building
	get_node("IslandRenderSections").visible = not building
	get_node("TownDecorations").visible = not building
	get_node("TownLife").visible = not building
	get_node("LiveAgents").visible = not building
	(get_node("TownCollision") as StaticBody3D).collision_layer = 0 if building else 1
	(get_node("TownGround") as StaticBody3D).collision_layer = 0 if building else 16
	(get_node("BuildLandCollision") as StaticBody3D).collision_layer = 17 if building else 0
	(get_node("WalkableTown") as NavigationRegion3D).enabled = not building
	for node in get_node("TownDecorations").find_children("*", "CollisionShape3D", true, false):
		(node as CollisionShape3D).disabled = building
	var editor := get_node("UserTrees")
	editor.call("set_build_mode", building)
	for node in get_tree().get_nodes_in_group("editable_trees"):
		var object := node as UserTree
		if object != null and object.is_authored:
			object.pick_area.collision_layer = 0 if building or not object.visible else 4
	if building:
		following_pet = false
		if is_instance_valid(controlled_pet):
			call("_release_control")
		if _details_are_open():
			call("_close_details")
		if _help_is_open():
			call("_toggle_help", false)
		_set_notice("")
	if has_method("_refresh_command_hint"):
		call("_refresh_command_hint")
	if persist:
		DirAccess.make_dir_recursive_absolute(_mode_path().get_base_dir())
		var file := FileAccess.open(_mode_path(), FileAccess.WRITE)
		if file != null:
			file.store_string(JSON.stringify({"version": 1, "mode": town_mode}, "  ") + "\n")

func _set_notice(message: String) -> void:
	super._set_notice("" if town_mode == "build" else message)

func _update_speaking_wave() -> void:
	if town_mode == "build":
		if is_instance_valid(speaking_wave):
			speaking_wave.visible = false
		return
	super._update_speaking_wave()
