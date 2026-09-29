extends "res://scripts/ui_gallery.gd"

func set_agents(records: Array) -> void:
	var next_agents: Array[Dictionary] = []
	for record in records:
		if record is Dictionary:
			next_agents.append(record)
	if next_agents == agents:
		return
	agents = next_agents
	if is_instance_valid(settings_overlay) and settings_overlay.visible and settings_page == 1:
		var key := _settings_focus_key()
		_show_settings_page(false)
		call_deferred("_restore_settings_focus", key)

func set_companion_scenes(names: Array[String], scenes: Array[PackedScene]) -> void:
	companion_names = names.duplicate()
	companion_scenes = scenes.duplicate()
	if is_instance_valid(settings_overlay) and settings_overlay.visible and settings_page == 1:
		var key := _settings_focus_key()
		_show_settings_page(false)
		call_deferred("_restore_settings_focus", key)

func _settings_focus_key() -> String:
	var focused := get_viewport().gui_get_focus_owner()
	return String(focused.get_meta("focus_key", "")) if is_instance_valid(focused) else ""

func _restore_settings_focus(key: String) -> void:
	if key.is_empty() or not settings_overlay.visible or settings_page != 1:
		return
	for node in settings_content.find_children("*", "Control", true, false):
		if String(node.get_meta("focus_key", "")) == key:
			(node as Control).grab_focus()
			return

func show_agent_details(record: Dictionary) -> void:
	var agent_id := String(record.get("id", ""))
	if agent_id.is_empty():
		return
	if settings_overlay.visible:
		close_settings()
	if inspector.visible:
		_dismiss_object_editor()
	agent_record_id = agent_id
	_clear(agent_content)
	var card_style := _style(Color("14231ef5"), 18, Color("f8d47c99"))
	card_style.set_content_margin_all(22)
	agent_panel.add_theme_stylebox_override("panel", card_style)
	agent_content.add_theme_constant_override("separation", 12)
	var heading := HBoxContainer.new()
	heading.add_theme_constant_override("separation", 15)
	agent_content.add_child(heading)
	if not companion_scenes.is_empty():
		var model_index := clampi(int(record.get("appearance_index", 0)), 0, companion_scenes.size() - 1)
		var preview := PREVIEW_SCRIPT.new() as WorkshopModelPreview
		preview.custom_minimum_size = Vector2(86, 86)
		preview.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
		heading.add_child(preview)
		preview.show_scene(companion_scenes[model_index])
	var names := VBoxContainer.new()
	names.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	names.add_theme_constant_override("separation", 3)
	heading.add_child(names)
	names.add_child(_label("LIVE COMPANION", 11, GOLD))
	var name_label := _label(String(record.get("label", "Companion")), 23, CREAM)
	name_label.clip_text = true
	name_label.autowrap_mode = TextServer.AUTOWRAP_OFF
	names.add_child(name_label)
	var status_chip := PanelContainer.new()
	status_chip.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	status_chip.custom_minimum_size.x = 100
	status_chip.add_theme_stylebox_override("panel", _style(Color("2e6651"), 12, Color("2e6651")))
	names.add_child(status_chip)
	agent_status_label = _label(String(record.get("status", "—")).capitalize(), 12, CREAM)
	agent_status_label.autowrap_mode = TextServer.AUTOWRAP_OFF
	status_chip.add_child(agent_status_label)
	var close := _button("×")
	close.custom_minimum_size = Vector2(34, 34)
	close.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	close.tooltip_text = "Close companion details"
	close.pressed.connect(func() -> void: agent_panel.visible = false)
	heading.add_child(close)
	agent_content.add_child(HSeparator.new())
	var facts := HBoxContainer.new()
	facts.add_theme_constant_override("separation", 12)
	agent_content.add_child(facts)
	agent_camera_label = _agent_fact(facts, "Camera", "")
	_agent_fact(facts, "Source", String(record.get("source", "—")).capitalize())
	if not companion_scenes.is_empty():
		var model_index := clampi(int(record.get("appearance_index", 0)), 0, companion_scenes.size() - 1)
		var look := companion_names[model_index] if model_index < companion_names.size() else "—"
		_agent_fact(facts, "Look", look)
	var actions := HBoxContainer.new()
	actions.add_theme_constant_override("separation", 7)
	agent_content.add_child(actions)
	agent_follow_button = _button("", true)
	agent_follow_button.custom_minimum_size.y = 46
	agent_follow_button.pressed.connect(func() -> void: agent_follow_requested.emit(agent_id))
	agent_follow_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	actions.add_child(agent_follow_button)
	if String(record.get("source", "")) != "mayor" or bool(record.get("firstmate_mode", false)):
		var is_herdr := String(record.get("source", "")) == "herdr" or bool(record.get("firstmate_mode", false))
		var open := _button("Open in Herdr ↗" if is_herdr else "Open agent ↗")
		open.custom_minimum_size.y = 46
		open.pressed.connect(func() -> void: agent_open_requested.emit(agent_id))
		open.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		actions.add_child(open)
		if is_herdr:
			agent_content.add_child(_label("Opens this companion's current Herdr pane", 11, MUTED))
	agent_view_button = _button("", true)
	agent_view_button.custom_minimum_size.y = 42
	agent_view_button.pressed.connect(func() -> void: agent_view_requested.emit(agent_id))
	agent_content.add_child(agent_view_button)
	agent_content.add_child(_label("V switches view · C drives the companion", 11, MUTED))
	agent_message = _label("", 12, MUTED)
	agent_message.visible = false
	agent_content.add_child(agent_message)
	agent_panel.visible = true
	set_followed_agent(followed_agent_id)
	call("_layout")

func _agent_fact(parent: HBoxContainer, title: String, value: String) -> Label:
	var column := VBoxContainer.new()
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	column.add_theme_constant_override("separation", 5)
	parent.add_child(column)
	column.add_child(_label(title, 11, MUTED))
	var value_label := _label(value, 13, CREAM)
	value_label.autowrap_mode = TextServer.AUTOWRAP_OFF
	column.add_child(value_label)
	return value_label

func update_agent_status(record: Dictionary) -> void:
	if agent_panel.visible and agent_record_id == String(record.get("id", "")) and is_instance_valid(agent_status_label):
		agent_status_label.text = String(record.get("status", "—")).capitalize()

func set_followed_agent(id: String) -> void:
	followed_agent_id = id
	if not agent_panel.visible or not is_instance_valid(agent_follow_button):
		return
	var following := id == agent_record_id
	agent_follow_button.text = "Stop following" if following else "Follow companion"
	set_camera_view(first_person_view)

func set_camera_view(value: bool) -> void:
	first_person_view = value
	if not agent_panel.visible or not is_instance_valid(agent_view_button):
		return
	var following := followed_agent_id == agent_record_id
	agent_camera_label.text = ("First-person" if value else "Following") if following else "Free view"
	agent_view_button.text = "Return to third-person · V" if value and following else "See through companion's eyes · V"

func show_focus_result(id: String, ok: bool, message: String) -> void:
	if agent_panel.visible and agent_record_id == id and is_instance_valid(agent_message):
		agent_message.text = "" if ok else (message if not message.is_empty() else "Could not open this agent right now.")
		agent_message.visible = not ok
		call("_layout")
	if settings_overlay.visible and selected_agent_id == id and is_instance_valid(settings_agent_message):
		settings_agent_message.text = "" if ok else (message if not message.is_empty() else "Could not open this agent right now.")
		settings_agent_message.visible = not ok
