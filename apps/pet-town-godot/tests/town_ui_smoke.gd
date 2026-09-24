extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var town := load("res://main.tscn").instantiate() as Node3D
	root.add_child(town)
	town.set_process(false)
	town.call("_set_town_mode", "chill", false)
	var settings := town.get("settings_window") as Control
	var errors: Array[String] = []
	if not (town.get("notice") as Label).text.is_empty():
		errors.append("empty town blocks exploration")
	for child in town.get_node("UserTrees").get_children():
		if child is UserTree and child.visible:
			var ring: MeshInstance3D = child.selection_crown_ring
			if ring != null and ring.scale.x > 3.5:
				errors.append("selection ring is too large")
	settings.call("open_settings", 1)
	await process_frame
	var pet_previews := settings.find_children("*", "SubViewportContainer", true, false).size()
	if pet_previews < 8:
		errors.append("missing 3D companion previews: %d" % pet_previews)
	settings.call("open_settings", 3)
	await process_frame
	var object_previews := settings.find_children("*", "SubViewportContainer", true, false).size()
	if object_previews < 20:
		errors.append("missing 3D object previews: %d" % object_previews)
	settings.call("close_settings")
	town.call("_open_command_palette")
	if not (town.get("command_panel") as Control).visible:
		errors.append("command palette did not open")
	town.call("_run_town_command", "/settings")
	if not settings.visible:
		errors.append("/settings did not open town studio")
	print("TOWN UI pet_previews=", pet_previews, " object_previews=", object_previews, " errors=", errors)
	town.free()
	quit(0 if errors.is_empty() else 1)
