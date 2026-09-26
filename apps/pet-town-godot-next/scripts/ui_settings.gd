extends "res://scripts/ui_components.gd"

func open_settings(page := 0) -> void:
	settings_page = clampi(page, 0, 3)
	settings_overlay.visible = true
	_show_settings_page()

func close_settings() -> void:
	settings_overlay.visible = false

func _build_settings() -> void:
	settings_overlay = Control.new()
	settings_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	settings_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(settings_overlay)
	var shade := ColorRect.new()
	shade.color = Color("07110dc9")
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	settings_overlay.add_child(shade)
	settings_panel = PanelContainer.new()
	settings_panel.add_theme_stylebox_override("panel", _style(Color("14231ff8"), 20, Color("d6aa6166")))
	settings_overlay.add_child(settings_panel)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 0)
	settings_panel.add_child(column)
	var header := HBoxContainer.new()
	header.custom_minimum_size.y = 96
	column.add_child(header)
	var titles := VBoxContainer.new()
	titles.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(titles)
	titles.add_child(_label("PET TOWN  /  YOUR ISLAND", 12, GOLD))
	titles.add_child(_label("Town studio", 29, CREAM))
	titles.add_child(_label("Explore, meet companions, and make the island yours.", 14, MUTED))
	var close := _button("×")
	close.custom_minimum_size = Vector2(44, 44)
	close.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	close.pressed.connect(close_settings)
	header.add_child(close)
	var divider := HSeparator.new()
	column.add_child(divider)
	var body := HBoxContainer.new()
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	column.add_child(body)
	var sidebar := PanelContainer.new()
	sidebar.custom_minimum_size.x = 190
	sidebar.add_theme_stylebox_override("panel", _style(Color("0d1a16"), 0, Color("0d1a16")))
	body.add_child(sidebar)
	settings_tabs = VBoxContainer.new()
	settings_tabs.add_theme_constant_override("separation", 9)
	sidebar.add_child(settings_tabs)
	for index in 4:
		var tab := _button(["Town", "Companions", "Camera", "Objects"][index])
		tab.alignment = HORIZONTAL_ALIGNMENT_LEFT
		tab.custom_minimum_size.y = 47
		tab.pressed.connect(_select_settings_page.bind(index))
		settings_tabs.add_child(tab)
	settings_scroll = ScrollContainer.new()
	settings_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	settings_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	settings_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	body.add_child(settings_scroll)
	settings_content = VBoxContainer.new()
	settings_content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	settings_content.add_theme_constant_override("separation", 13)
	settings_scroll.add_child(settings_content)
	var footer := HBoxContainer.new()
	footer.custom_minimum_size.y = 46
	column.add_child(footer)
	var footer_label := _label("Changes take effect immediately  ·  Esc closes this view", 12, MUTED)
	footer_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	footer.add_child(footer_label)
	var done := _button("Done", true)
	done.pressed.connect(close_settings)
	footer.add_child(done)
	settings_overlay.visible = false

func _select_settings_page(page: int) -> void:
	settings_page = page
	_show_settings_page()

func _show_settings_page() -> void:
	if not is_instance_valid(settings_content):
		return
	_clear(settings_content)
	for index in settings_tabs.get_child_count():
		var tab := settings_tabs.get_child(index) as Button
		tab.add_theme_color_override("font_color", GOLD if index == settings_page else CREAM)
		tab.add_theme_stylebox_override("normal", _style(Color("352f20") if index == settings_page else Color("0d1a16"), 9, Color("352f20") if index == settings_page else Color("0d1a16")))
	match settings_page:
		0: _town_page()
		1: _companions_page()
		2: _camera_page()
		3: _objects_page()
	settings_scroll.scroll_vertical = 0
	call_deferred("_layout")

func _heading(title: String, summary: String) -> void:
	settings_content.add_child(_label(title, 25, CREAM))
	settings_content.add_child(_label(summary, 14, MUTED))

func _town_page() -> void:
	_heading("Your island", "Explore, meet companions, and make the island yours.")
	var status := _card(settings_content)
	status.add_child(_label("CURRENT MODE", 12, GOLD))
	status.add_child(_label("%s island" % town_mode.capitalize(), 23, CREAM))
	status.add_child(_label("The same island and tools in either mode. Build begins with open land; Chill begins decorated.", 14, MUTED))
	var commands := _card(settings_content)
	commands.add_child(_label("TOWN COMMANDS", 12, GOLD))
	commands.add_child(_label("Press / anywhere in town, type a command, then press Return.", 14, MUTED))
	commands.add_child(_label("/chill   Visit the decorated island and arrange objects freely.", 15, CREAM))
	commands.add_child(_label("/build   Begin with open land and buy objects with credits.", 15, CREAM))
	var guide := _card(settings_content)
	guide.add_child(_label("CONTROLS", 12, GOLD))
	guide.add_child(_label("Double-click an object to edit · Left drag to move across the island", 14, CREAM))
	guide.add_child(_label("Middle or Alt-left drag to orbit · Scroll or +/- to zoom · R resets", 14, CREAM))
	guide.add_child(_label("W/A/S/D or arrow keys change angle · Q/E rotate objects · Delete removes", 14, MUTED))

func _camera_page() -> void:
	_heading("Set your point of view", "Move closer to inspect an object, or pull back for the whole island.")
	var card := _card(settings_content)
	card.add_child(_label("Camera distance", 18, CREAM))
	var slider := HSlider.new()
	slider.min_value = 18
	slider.max_value = 150
	slider.step = 1
	slider.value = float(editor.camera.get("distance")) if is_instance_valid(editor) and is_instance_valid(editor.camera) else 72
	slider.value_changed.connect(func(value: float) -> void:
		if is_instance_valid(editor) and is_instance_valid(editor.camera):
			editor.camera.set("distance", value)
			editor.camera.call("_update_pose")
	)
	card.add_child(slider)
	var reset := _button("Reset to island view")
	reset.pressed.connect(func() -> void:
		if is_instance_valid(editor) and is_instance_valid(editor.camera):
			editor.camera.set("distance", 72)
			editor.camera.set("yaw", deg_to_rad(28))
			editor.camera.set("elevation", deg_to_rad(49))
			editor.camera.call("_update_pose")
			slider.value = 72
	)
	card.add_child(reset)

func _companions_page() -> void:
	_heading("Meet the town's companions", "Select a companion to see its 3D appearance and live agent details.")
	if companion_scenes.is_empty() and agents.is_empty():
		settings_content.add_child(_label("Companions will appear here when they visit the island.", 14, MUTED))
	for index in companion_scenes.size():
		var card := _card(settings_content)
		card.add_child(_label(companion_names[index] if index < companion_names.size() else "Companion %d" % (index + 1), 19, CREAM))
		var preview := PREVIEW_SCRIPT.new() as WorkshopModelPreview
		preview.custom_minimum_size = Vector2(260, 180)
		card.add_child(preview)
		preview.show_scene(companion_scenes[index])
	for record in agents:
		var card := _card(settings_content)
		card.add_child(_label(String(record.get("label", "Companion")), 18, CREAM))
		card.add_child(_label(String(record.get("status", "Visiting the island")), 13, MUTED))
		var button := _button("View agent details", true)
		button.pressed.connect(_open_agent_record.bind(record))
		card.add_child(button)

func _objects_page() -> void:
	_heading("Find a place for everything", "Preview each piece in 3D, then place it on your island.")
	for item in catalog.items:
		var card := _card(settings_content)
		card.add_child(_label(String(item["name"]), 18, CREAM))
		var preview := PREVIEW_SCRIPT.new() as WorkshopModelPreview
		preview.custom_minimum_size = Vector2(260, 165)
		card.add_child(preview)
		preview.show_scene(catalog.scenes.get(String(item["id"])) as PackedScene)
		var label := String(item["category"])
		if town_mode == "build":
			label += "  ·  %s credits" % _number(int(item["price"]))
		card.add_child(_label(label, 13, GOLD))
		var button := _button("Buy & place" if town_mode == "build" else "Place on island", true)
		button.disabled = town_mode == "build" and wallet.balance() < int(item["price"])
		if button.disabled:
			button.tooltip_text = "Earn more credits to buy this object"
		button.pressed.connect(_place_from_settings.bind(String(item["id"])))
		card.add_child(button)

func _place_from_settings(asset_id: String) -> void:
	close_settings()
	place_requested.emit(asset_id)

func _open_agent_record(record: Dictionary) -> void:
	close_settings()
	call("show_agent_details", record)
