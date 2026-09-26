extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var town := load("res://main.tscn").instantiate() as Node3D
	root.add_child(town)
	town.call("_set_town_mode", "chill", false)
	var arguments := OS.get_cmdline_user_args()
	if not arguments.is_empty() and arguments[0] == "chill-view":
		print("TOWN UI VISUAL chill-view")
		return
	if not arguments.is_empty() and arguments[0] == "build-view":
		town.call("_set_town_mode", "build", false)
		print("TOWN UI VISUAL build-view")
		return
	if not arguments.is_empty() and arguments[0] in ["selected", "moving", "move-check", "tea-house"]:
		var editor := town.get_node("UserTrees")
		var object_id := "IslandObject_0798" if arguments[0] == "tea-house" else "IslandObject_0803"
		var object := town.get_node("IslandRenderSections/EditableObjects/" + object_id) as UserTree
		assert(object.get_node_or_null("CrownLarge") == null, "Authored objects still contain the default green crown")
		editor.set("tree_editor_open", true)
		editor.call("_select_user_tree", object)
		if arguments[0] == "moving":
			editor.call("_start_moving_selected_tree")
		var marker := UserTree.shared_ring
		town.set("camera_at_overview", false)
		town.set("camera_target", marker.global_position)
		town.set("camera_distance", 22.0)
		town.call("_update_camera")
		editor.call("_update_tree_customization")
		if arguments[0] == "move-check":
			var start := object.global_position
			editor.call("_start_moving_selected_tree")
			editor.call("_update_tree_placement_preview", Vector2(900, 650))
			assert(editor.get("placement_has_surface"), "Move preview did not find land")
			assert(object.global_position.distance_to(start) > 0.1, "Move preview did not reposition object")
			assert(marker.visible, "Move marker is hidden")
			editor.call("_cancel_tree_placement")
			assert(object.global_position.is_equal_approx(start), "Cancel did not restore object")
			print("TOWN UI VISUAL move-check passed")
			quit()
			return
		town.set_process(false)
		print("TOWN UI VISUAL ", arguments[0], " marker=", marker.global_position, " visible=", marker.visible)
		return
	if not arguments.is_empty() and arguments[0] == "command":
		town.call("_open_command_palette")
		print("TOWN UI VISUAL command")
		return
	if not arguments.is_empty() and arguments[0] == "help":
		town.call("_toggle_help", true)
		print("TOWN UI VISUAL help")
		return
	if not arguments.is_empty() and arguments[0] == "details":
		town.set_process(false)
		town.set("selected_id", "preview-companion")
		town.set("agents_by_id", {"preview-companion": {"label": "Willow", "status": "working", "source": "herdr"}})
		town.call("_open_details")
		print("TOWN UI VISUAL details")
		return
	if not arguments.is_empty() and arguments[0] == "companion-detail":
		town.call("_open_settings_section", 1)
		var settings := town.get("settings_window") as Control
		settings.call("_view_companion", 0)
		print("TOWN UI VISUAL companion-detail")
		return
	var section := int(arguments[0]) if not arguments.is_empty() else 0
	town.call("_open_settings_section", section)
	print("TOWN UI VISUAL section=", section)
