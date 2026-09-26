extends "res://scripts/ui_settings.gd"

func set_agents(records: Array) -> void:
	agents.clear()
	for record in records:
		if record is Dictionary:
			agents.append(record)
	if is_instance_valid(settings_overlay) and settings_overlay.visible and settings_page == 1:
		_show_settings_page()

func set_companion_scenes(names: Array[String], scenes: Array[PackedScene]) -> void:
	companion_names = names.duplicate()
	companion_scenes = scenes.duplicate()
	if is_instance_valid(settings_overlay) and settings_overlay.visible and settings_page == 1:
		_show_settings_page()

func show_agent_details(record: Dictionary) -> void:
	_clear(agent_content)
	agent_content.add_child(_label("PET TOWN  /  COMPANION", 12, GOLD))
	agent_content.add_child(_label(String(record.get("label", "Companion")), 24, CREAM))
	if not companion_scenes.is_empty():
		var preview := PREVIEW_SCRIPT.new() as WorkshopModelPreview
		preview.custom_minimum_size = Vector2(285, 180)
		agent_content.add_child(preview)
		var model_index := clampi(int(record.get("appearance_index", 0)), 0, companion_scenes.size() - 1)
		preview.show_scene(companion_scenes[model_index])
	for key in ["status", "source", "camera", "appearance"]:
		var card := _card(agent_content)
		card.add_child(_label(key.capitalize(), 12, GOLD))
		card.add_child(_label(String(record.get(key, "—")), 15, CREAM))
	var agent_id := String(record.get("id", ""))
	if not agent_id.is_empty():
		var follow := _button("Follow companion", true)
		follow.pressed.connect(func() -> void: agent_details_requested.emit(agent_id))
		agent_content.add_child(follow)
	var close := _button("Close details")
	close.pressed.connect(func() -> void: agent_panel.visible = false)
	agent_content.add_child(close)
	agent_panel.visible = true
	call("_layout")
