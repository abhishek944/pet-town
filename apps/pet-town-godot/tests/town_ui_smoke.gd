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
			if child.selection_ring_radius > 3.5:
				errors.append("selection ring is too large")
	town.call("_open_settings_section", 1)
	if (town.get("command_hint") as Control).visible:
		errors.append("command hint overlaps studio")
	await process_frame
	var pet_previews := settings.find_children("*", "SubViewportContainer", true, false).size()
	if pet_previews < 8:
		errors.append("missing 3D companion previews: %d" % pet_previews)
	var details_button: Button
	for candidate in settings.find_children("*", "Button", true, false):
		if (candidate as Button).text == "View details":
			details_button = candidate as Button
			break
	if details_button == null:
		errors.append("companion cards cannot open details")
	else:
		details_button.pressed.emit()
		if int(settings.get("selected_pet")) != 0:
			errors.append("companion details did not open")
	var mayor := load("res://scenes/companion.tscn").instantiate() as CharacterBody3D
	mayor.call("configure", "pet-town-mayor", "Mayor", "working", "Knight")
	var mayor_model := load("res://assets/kaykit/Knight.glb").instantiate() as Node3D
	mayor_model.name = "Model"
	mayor.get_node("Visual").add_child(mayor_model)
	town.get_node("LiveAgents").add_child(mayor)
	town.set("agents_by_id", {"pet-town-mayor": {"label": "Mayor", "status": "working", "source": "herdr"}})
	town.set("pets_by_id", {"pet-town-mayor": mayor})
	settings.call("_view_companion", 0)
	var live_details: Button
	for candidate in settings.find_children("*", "Button", true, false):
		if (candidate as Button).text == "Open Mayor's agent details":
			live_details = candidate as Button
			break
	if live_details == null:
		errors.append("live companion has no agent details action")
	else:
		live_details.pressed.emit()
		if not (town.get("details_panel") as Control).visible:
			errors.append("live companion agent details did not open")
		town.call("_close_details")
	town.call("_open_settings_section", 3)
	await process_frame
	var object_previews := settings.find_children("*", "SubViewportContainer", true, false).size()
	if object_previews < 20:
		errors.append("missing 3D object previews: %d" % object_previews)
	for candidate in settings.find_children("*", "Label", true, false):
		if (candidate as Label).text == "Free in Chill mode":
			errors.append("removed Chill price text is visible")
	settings.call("close_settings")
	town.call("_toggle_help", true)
	if (town.get("command_hint") as Control).visible:
		errors.append("command hint overlaps help")
	town.call("_toggle_help", false)
	town.call("_open_command_palette")
	if not (town.get("command_panel") as Control).visible:
		errors.append("command palette did not open")
	if (town.get("command_hint") as Control).visible:
		errors.append("command hint overlaps palette")
	town.call("_run_town_command", "/settings")
	if not settings.visible:
		errors.append("/settings did not open town studio")
	print("TOWN UI pet_previews=", pet_previews, " object_previews=", object_previews, " errors=", errors)
	town.free()
	quit(0 if errors.is_empty() else 1)
