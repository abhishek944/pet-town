extends "res://scripts/ui_settings_pages.gd"

func open_settings(page := 0) -> void:
	agent_panel.visible = false
	if inspector.visible:
		_dismiss_object_editor()
	settings_page = clampi(page, 0, 3)
	selected_companion = -1
	selected_agent_id = ""
	selected_object_id = ""
	settings_overlay.visible = true
	_show_settings_page()

func close_settings() -> void:
	settings_overlay.visible = false

func _build_settings() -> void:
	settings_overlay = Control.new()
	settings_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	settings_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(settings_overlay)
	settings_panel = PanelContainer.new()
	var panel_style := _style(Color("192f25"), 0, Color("192f25"))
	panel_style.set_content_margin_all(0)
	settings_panel.add_theme_stylebox_override("panel", panel_style)
	settings_overlay.add_child(settings_panel)
	var body := HBoxContainer.new()
	body.add_theme_constant_override("separation", 0)
	settings_panel.add_child(body)
	var sidebar := PanelContainer.new()
	sidebar.custom_minimum_size.x = 180
	var rail_style := _style(Color("0b2119"), 0, Color("0b2119"))
	rail_style.set_content_margin_all(15)
	sidebar.add_theme_stylebox_override("panel", rail_style)
	body.add_child(sidebar)
	var rail := VBoxContainer.new()
	rail.add_theme_constant_override("separation", 7)
	sidebar.add_child(rail)
	rail.add_child(_label("PET TOWN", 13, GOLD))
	var rail_gap := Control.new()
	rail_gap.custom_minimum_size.y = 18
	rail.add_child(rail_gap)
	settings_tabs = VBoxContainer.new()
	settings_tabs.add_theme_constant_override("separation", 7)
	rail.add_child(settings_tabs)
	for index in 4:
		var tab := _button(["⌂   Town", "♞   Companions", "◉   Camera", "◇   Objects"][index])
		tab.alignment = HORIZONTAL_ALIGNMENT_LEFT
		tab.custom_minimum_size.y = 48
		tab.pressed.connect(_select_settings_page.bind(index))
		settings_tabs.add_child(tab)
	var rail_spacer := Control.new()
	rail_spacer.size_flags_vertical = Control.SIZE_EXPAND_FILL
	rail.add_child(rail_spacer)
	rail.add_child(_label("Your island", 12, MUTED))
	rail.add_child(_label("Settings", 12, MUTED))
	var column := VBoxContainer.new()
	column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	column.add_theme_constant_override("separation", 0)
	body.add_child(column)
	settings_header = HBoxContainer.new()
	settings_header.custom_minimum_size.y = 64
	column.add_child(settings_header)
	var lead := Control.new()
	lead.custom_minimum_size.x = 40
	settings_header.add_child(lead)
	settings_breadcrumb = _label("YOUR ISLAND", 12, GOLD)
	settings_breadcrumb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	settings_header.add_child(settings_breadcrumb)
	var close := _button("×")
	close.custom_minimum_size = Vector2(42, 42)
	close.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	close.pressed.connect(close_settings)
	settings_header.add_child(close)
	var tail := Control.new()
	tail.custom_minimum_size.x = 40
	settings_header.add_child(tail)
	settings_margin = MarginContainer.new()
	settings_margin.size_flags_vertical = Control.SIZE_EXPAND_FILL
	settings_margin.add_theme_constant_override("margin_left", 40)
	settings_margin.add_theme_constant_override("margin_right", 40)
	column.add_child(settings_margin)
	settings_scroll = ScrollContainer.new()
	settings_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	settings_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	settings_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	settings_margin.add_child(settings_scroll)
	settings_content = VBoxContainer.new()
	settings_content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	settings_content.add_theme_constant_override("separation", 16)
	settings_scroll.add_child(settings_content)
	settings_footer = _label("Esc closes settings", 12, MUTED)
	settings_footer.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	settings_footer.custom_minimum_size.y = 36
	column.add_child(settings_footer)
	settings_overlay.visible = false

func _select_settings_page(page: int) -> void:
	settings_page = page
	selected_companion = -1
	selected_agent_id = ""
	selected_object_id = ""
	_show_settings_page()

func _show_settings_page(reset_scroll := true) -> void:
	if not is_instance_valid(settings_content):
		return
	var previous_scroll := settings_scroll.scroll_vertical
	_clear(settings_content)
	settings_agent_message = null
	var object_gallery := settings_page == 3 and selected_object_id.is_empty()
	settings_breadcrumb.text = ["YOUR ISLAND", "YOUR ISLAND / COMPANIONS", "YOUR ISLAND / CAMERA", "YOUR ISLAND / OBJECTS"][settings_page]
	settings_header.visible = not object_gallery
	settings_footer.visible = not object_gallery
	settings_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED if object_gallery else ScrollContainer.SCROLL_MODE_AUTO
	settings_margin.add_theme_constant_override("margin_left", 8 if object_gallery else 40)
	settings_margin.add_theme_constant_override("margin_right", 8 if object_gallery else 40)
	for index in settings_tabs.get_child_count():
		var tab := settings_tabs.get_child(index) as Button
		tab.add_theme_color_override("font_color", GOLD if index == settings_page else CREAM)
		tab.add_theme_stylebox_override("normal", _style(Color("3b5740") if index == settings_page else Color("0b2119"), 9, Color("3b5740") if index == settings_page else Color("0b2119")))
	match settings_page:
		0: _town_page()
		1: _companions_page()
		2: _camera_page()
		3: _objects_page()
	settings_scroll.set_deferred("scroll_vertical", 0 if reset_scroll else previous_scroll)
	call_deferred("_layout")

func _place_from_settings(asset_id: String) -> void:
	close_settings()
	place_requested.emit(asset_id)

func _companions_page() -> void:
	pass

func _objects_page() -> void:
	pass
