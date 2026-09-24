extends "res://scripts/town_settings_content.gd"

func _show_section() -> void:
	if not is_instance_valid(content):
		return
	for child in content.get_children():
		content.remove_child(child)
		child.queue_free()
	for index in navigation.get_child_count():
		var button := navigation.get_child(index) as Button
		var active := index == selected_section
		button.add_theme_color_override("font_color", CREAM if active else MUTED)
		button.add_theme_stylebox_override("normal", _box(Color("a7712e") if active else Color("ffffff0a"), 9))
		button.add_theme_stylebox_override("hover", _box(Color("536b55"), 9))
	match selected_section:
		0: _town_page()
		1: call("_companions_page")
		2: _camera_page()
		3: call("_objects_page")
	scroll.scroll_vertical = 0

func _town_page() -> void:
	_heading("YOUR ISLAND", "A town to make your own", "Explore freely, then use a command whenever you want to change how the island works.")
	var mode := String(host.get("town_mode")) if is_instance_valid(host) else "chill"
	var status := _card(content, Color("2d4839"))
	status.add_child(_label("CURRENT MODE", 12, GOLD))
	status.add_child(_label("%s island" % mode.capitalize(), 25, CREAM))
	status.add_child(_note("The complete, lively town is ready to explore." if mode == "chill" else "Your land is ready for the objects you earn and place."))
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	content.add_child(row)
	var chill := _card(row)
	chill.add_child(_label("/chill", 21, GOLD))
	chill.add_child(_note("Visit the complete island, follow live companions, and arrange objects freely."))
	var build := _card(row)
	build.add_child(_label("/build", 21, GOLD))
	build.add_child(_note("Start with open land. Buy objects with credits earned from token usage."))
	var guide := _card(content, Color("1c3027"))
	guide.add_child(_label("COMMANDS", 12, GOLD))
	guide.add_child(_note("Press / anywhere in town, type a command, then press Return."))
	guide.add_child(_label("/objects   Browse and place 3D objects", 15, CREAM))
	guide.add_child(_label("/settings   Open these settings", 15, CREAM))
	guide.add_child(_label("/help   See movement and camera controls", 15, CREAM))

func _camera_page() -> void:
	_heading("VIEW & COMFORT", "Set your point of view", "These controls change the camera immediately. The island stays open for exploration.")
	var card := _card(content)
	card.add_child(_label("Camera distance", 18, CREAM))
	card.add_child(_note("Move closer to inspect a cottage or pull back for the whole island."))
	var distance := HSlider.new()
	distance.min_value = 24
	distance.max_value = 440
	distance.step = 1
	distance.value = float(host.get("camera_distance"))
	distance.custom_minimum_size.y = 30
	distance.value_changed.connect(func(value: float) -> void:
		host.set("camera_distance", value)
		host.set("camera_at_overview", false)
		host.call("_update_camera")
	)
	card.add_child(distance)
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)
	card.add_child(row)
	row.add_child(_button("Reset to island view", func() -> void:
		host.call("_reset_camera")
		distance.set_value_no_signal(float(host.get("camera_distance")))
	))
	row.add_child(_button("Toggle fullscreen", func() -> void: host.call("_toggle_fullscreen")))
	var gestures := _card(content, Color("1c3027"))
	gestures.add_child(_label("EXPLORE", 12, GOLD))
	gestures.add_child(_note("Drag to pan · Option + drag to orbit · Scroll or pinch to zoom"))
	gestures.add_child(_note("R resets the camera · F toggles fullscreen · Escape closes a panel"))

func _note(text: String) -> Label:
	var label := _label(text, 14, MUTED)
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return label
