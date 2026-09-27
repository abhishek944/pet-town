extends "res://scripts/ui_components.gd"

func _heading(title: String, summary: String) -> void:
	settings_content.add_child(_label(title, 30, CREAM))
	settings_content.add_child(_label(summary, 15, MUTED))

func _town_page() -> void:
	_heading("Town studio", "Explore, meet companions, and make the island yours.")
	var cards := HBoxContainer.new()
	cards.add_theme_constant_override("separation", 16)
	settings_content.add_child(cards)
	var status := _card(cards)
	status.get_parent().custom_minimum_size.y = 140
	status.add_child(_label("CURRENT MODE", 12, GOLD))
	status.add_child(_label("%s island" % town_mode.capitalize(), 23, CREAM))
	status.add_child(_label("A quiet place to spend time with your companions." if town_mode == "chill" else "An open island to shape with earned objects.", 14, MUTED))
	var commands := _card(cards)
	commands.get_parent().custom_minimum_size.y = 140
	commands.add_child(_label("TOWN COMMANDS", 12, GOLD))
	commands.add_child(_label("Switch modes", 23, CREAM))
	commands.add_child(_label("Use /chill or /build any time.", 14, MUTED))
	var guide := _card(settings_content)
	guide.get_parent().custom_minimum_size.y = 138
	guide.add_child(_label("CONTROLS", 12, GOLD))
	guide.add_child(_label("Move around the island", 23, CREAM))
	guide.add_child(_label("Drag to move · Scroll to zoom · R to reset", 14, MUTED))

func _camera_page() -> void:
	_heading("Set your point of view", "Move closer to inspect an object, or pull back for the whole island.")
	var card := _card(settings_content)
	var shell := card.get_parent() as Control
	shell.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	shell.custom_minimum_size.x = 550
	var line := HBoxContainer.new()
	card.add_child(line)
	var title := _label("Camera distance", 18, CREAM)
	title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	line.add_child(title)
	var value_label := _label("72", 18, GOLD)
	value_label.autowrap_mode = TextServer.AUTOWRAP_OFF
	value_label.custom_minimum_size.x = 36
	value_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	line.add_child(value_label)
	var range_row := HBoxContainer.new()
	card.add_child(range_row)
	var close_label := _label("Close", 12, MUTED)
	close_label.autowrap_mode = TextServer.AUTOWRAP_OFF
	close_label.custom_minimum_size.x = 42
	range_row.add_child(close_label)
	var slider := HSlider.new()
	slider.min_value = 18
	slider.max_value = 150
	slider.step = 1
	_gold_slider_grabber(slider)
	slider.value = float(editor.camera.get("distance")) if is_instance_valid(editor) and is_instance_valid(editor.camera) else 72
	slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	slider.value_changed.connect(func(value: float) -> void:
		value_label.text = str(int(value))
		if is_instance_valid(editor) and is_instance_valid(editor.camera):
			editor.camera.set("distance", value)
			editor.camera.call("_update_pose")
	)
	value_label.text = str(int(slider.value))
	range_row.add_child(slider)
	var far_label := _label("Far", 12, MUTED)
	far_label.autowrap_mode = TextServer.AUTOWRAP_OFF
	far_label.custom_minimum_size.x = 24
	range_row.add_child(far_label)
	var reset := _button("Reset to island view", true)
	reset.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	reset.pressed.connect(func() -> void:
		if is_instance_valid(editor) and is_instance_valid(editor.camera):
			editor.camera.set("distance", 72)
			editor.camera.set("yaw", deg_to_rad(28))
			editor.camera.set("elevation", deg_to_rad(49))
			editor.camera.call("_update_pose")
			slider.value = 72
	)
	card.add_child(reset)
