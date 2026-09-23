extends "res://scripts/main_avatar.gd"

const MODE_FILE := "town-mode.json"
var town_mode := "chill"
var mode_bar: HBoxContainer
var chill_button: Button
var build_button: Button
var browse_button: Button

func _mode_path() -> String:
	return OS.get_environment("HOME").path_join(".pet-town").path_join(MODE_FILE)

func _initialize_town_mode() -> void:
	mode_bar = HBoxContainer.new()
	mode_bar.add_theme_constant_override("separation", 6)
	ui_root.add_child(mode_bar)
	chill_button = Button.new()
	chill_button.text = "Chill"
	chill_button.tooltip_text = "Visit the complete island and its live pets"
	chill_button.pressed.connect(func() -> void: _set_town_mode("chill"))
	mode_bar.add_child(chill_button)
	build_button = Button.new()
	build_button.text = "Build"
	build_button.tooltip_text = "Start with open land and earn objects"
	build_button.pressed.connect(func() -> void: _set_town_mode("build"))
	mode_bar.add_child(build_button)
	browse_button = Button.new()
	browse_button.text = "Browse objects"
	browse_button.tooltip_text = "Choose an object for your island"
	browse_button.pressed.connect(func() -> void: get_node("UserTrees").call("_toggle_catalog"))
	mode_bar.add_child(browse_button)
	get_viewport().size_changed.connect(_layout_mode_bar)
	_layout_mode_bar()
	var saved := "chill"
	if FileAccess.file_exists(_mode_path()):
		var file := FileAccess.open(_mode_path(), FileAccess.READ)
		var parsed = JSON.parse_string(file.get_as_text()) if file != null else null
		if parsed is Dictionary and parsed.get("mode") in ["chill", "build"]:
			saved = parsed["mode"]
	_set_town_mode(saved, false)

func _layout_mode_bar() -> void:
	if not is_instance_valid(mode_bar):
		return
	mode_bar.position = Vector2(maxf(8.0, get_viewport().get_visible_rect().size.x - 362.0), 18.0)
	mode_bar.size = Vector2(344.0, 46.0)
	chill_button.custom_minimum_size = Vector2(66.0, 40.0)
	build_button.custom_minimum_size = Vector2(66.0, 40.0)
	browse_button.custom_minimum_size = Vector2(196.0, 40.0)

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
	(get_node("BuildLandCollision") as StaticBody3D).collision_layer = 1 if building else 0
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
	_refresh_mode_buttons()
	if persist:
		DirAccess.make_dir_recursive_absolute(_mode_path().get_base_dir())
		var file := FileAccess.open(_mode_path(), FileAccess.WRITE)
		if file != null:
			file.store_string(JSON.stringify({"version": 1, "mode": town_mode}, "  ") + "\n")

func _refresh_mode_buttons() -> void:
	for button in [chill_button, build_button]:
		var selected: bool = button == build_button if town_mode == "build" else button == chill_button
		var style := StyleBoxFlat.new()
		style.bg_color = Color("bd842e") if selected else Color("334039")
		style.set_corner_radius_all(9)
		style.border_color = Color("f8d47c") if selected else Color("6a746c")
		style.set_border_width_all(1)
		button.add_theme_stylebox_override("normal", style)
		button.add_theme_color_override("font_color", Color("fff9e8") if selected else Color("c8d0c6"))

func _set_notice(message: String) -> void:
	super._set_notice("" if town_mode == "build" else message)

func _update_speaking_wave() -> void:
	if town_mode == "build":
		if is_instance_valid(speaking_wave):
			speaking_wave.visible = false
		return
	super._update_speaking_wave()
