extends "res://scripts/ui_settings.gd"

func _detail_back(page: int) -> void:
	var back := _button("← All companions" if page == 1 else "← All objects")
	back.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	back.set_meta("focus_key", "back")
	back.add_theme_stylebox_override("normal", _style(Color.TRANSPARENT, 0, Color.TRANSPARENT))
	back.add_theme_color_override("font_color", GOLD)
	back.pressed.connect(func() -> void:
		selected_agent_id = ""
		selected_companion = -1
		selected_object_id = ""
		if page == 3:
			object_category = "All objects"
		_show_settings_page()
	)
	settings_content.add_child(back)

func _detail_showcase(scene: PackedScene) -> VBoxContainer:
	var row := HBoxContainer.new()
	row.custom_minimum_size.y = maxf(290, minf(540, get_viewport_rect().size.y - 180))
	row.add_theme_constant_override("separation", 22)
	settings_content.add_child(row)
	var frame := PanelContainer.new()
	frame.custom_minimum_size.x = maxf(240, minf(550, get_viewport_rect().size.x - 532))
	frame.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var normal := _style(Color("2b4a37"), 15, Color("698569"))
	var focused := _style(Color("2b4a37"), 15, GOLD)
	frame.add_theme_stylebox_override("panel", normal)
	row.add_child(frame)
	var preview := PREVIEW_SCRIPT.new() as WorkshopModelPreview
	preview.custom_minimum_size.y = row.custom_minimum_size.y - 20
	preview.size_flags_vertical = Control.SIZE_EXPAND_FILL
	preview.set_meta("focus_key", "preview")
	preview.focus_entered.connect(func() -> void: frame.add_theme_stylebox_override("panel", focused))
	preview.focus_exited.connect(func() -> void: frame.add_theme_stylebox_override("panel", normal))
	frame.add_child(preview)
	preview.show_scene(scene)
	var facts := VBoxContainer.new()
	facts.custom_minimum_size.x = 250
	facts.add_theme_constant_override("separation", 13)
	row.add_child(facts)
	var top_gap := Control.new()
	top_gap.custom_minimum_size.y = 35
	facts.add_child(top_gap)
	return facts

func _companion_detail(record: Dictionary) -> void:
	_detail_back(1)
	var scene: PackedScene
	if not companion_scenes.is_empty():
		var index := clampi(int(record.get("appearance_index", 0)), 0, companion_scenes.size() - 1)
		scene = companion_scenes[index]
	var facts := _detail_showcase(scene)
	facts.add_child(_label("VISITING COMPANION", 12, GOLD))
	facts.add_child(_label(String(record.get("label", "Companion")), 31, CREAM))
	facts.add_child(_label("Status: %s" % String(record.get("status", "—")).capitalize(), 16, CREAM))
	facts.add_child(_label("Source: %s" % String(record.get("source", "—")).capitalize(), 15, CREAM))
	var camera_state := ("First-person" if first_person_view else "Following") if followed_agent_id == String(record.get("id", "")) else "Free view"
	facts.add_child(_label("Camera: %s" % camera_state, 15, CREAM))
	var id := String(record.get("id", ""))
	var follow := _button("Stop following" if followed_agent_id == id else "Follow companion", true)
	follow.set_meta("focus_key", "follow")
	follow.pressed.connect(func() -> void:
		agent_follow_requested.emit(id)
		_show_settings_page()
	)
	facts.add_child(follow)
	var view := _button("Return to third-person" if first_person_view and followed_agent_id == id else "See through companion's eyes")
	view.set_meta("focus_key", "view")
	view.pressed.connect(func() -> void:
		close_settings()
		agent_view_requested.emit(id)
	)
	facts.add_child(view)
	if String(record.get("source", "")) != "mayor":
		var open := _button("Open in Herdr" if String(record.get("source", "")) == "herdr" else "Open agent")
		open.set_meta("focus_key", "open")
		open.pressed.connect(func() -> void: agent_open_requested.emit(id))
		facts.add_child(open)
	settings_agent_message = _label("", 13, MUTED)
	settings_agent_message.visible = false
	facts.add_child(settings_agent_message)

func _character_detail(index: int) -> void:
	_detail_back(1)
	var name := companion_names[index] if index < companion_names.size() else "Companion %d" % (index + 1)
	var facts := _detail_showcase(companion_scenes[index])
	facts.add_child(_label("CHARACTER · %d OF %d" % [index + 1, companion_scenes.size()], 12, GOLD))
	facts.add_child(_label(name, 32, CREAM))
	facts.add_child(_label("This character is available to visiting companions. Characters are assigned automatically.", 15, MUTED))
	facts.add_child(_label("3D character available", 14, GOLD))

func _object_detail(item: Dictionary) -> void:
	_detail_back(3)
	var facts := _detail_showcase(catalog.scenes.get(String(item["id"])) as PackedScene)
	facts.add_child(_label(String(item["category"]).to_upper(), 12, GOLD))
	facts.add_child(_label(String(item["name"]), 32, CREAM))
	facts.add_child(_label("For %s" % String(item["surface"]), 14, MUTED))
	if town_mode == "build":
		facts.add_child(_label("%s credits" % _number(int(item["price"])), 15, GOLD))
	var place := _button("Buy & place" if town_mode == "build" else "Place on island", true)
	place.set_meta("focus_key", "place")
	place.disabled = town_mode == "build" and wallet.balance() < int(item["price"])
	if place.disabled:
		place.tooltip_text = "Earn more credits to buy this object"
	place.pressed.connect(_place_from_settings.bind(String(item["id"])))
	facts.add_child(place)
