extends "res://scripts/town_settings_content.gd"

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	visible = false
	scrim = ColorRect.new()
	scrim.color = Color("050a08a0")
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	scrim.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(scrim)
	panel = Panel.new()
	panel.add_theme_stylebox_override("panel", _box(Color("101713f2"), 20, Color("ffffff38")))
	panel.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(panel)
	_build_header()
	_build_body()
	_build_footer()
	resized.connect(_layout)
	_layout()
	_show_section()

func set_pet_names(names: Array) -> void:
	pet_names.clear()
	for name in names:
		pet_names.append(str(name))
	selected_pet = 0
	if is_instance_valid(content):
		_show_section()

func open_settings() -> void:
	return_focus = get_viewport().gui_get_focus_owner()
	visible = true
	selected_section = 0
	_show_section()
	close_button.grab_focus()

func close_settings() -> void:
	visible = false
	dismissed.emit()
	if is_instance_valid(return_focus) and return_focus.is_visible_in_tree():
		return_focus.grab_focus()

func _build_header() -> void:
	var eyebrow := _label("GRAND MOONHAVEN", 12, GOLD)
	panel.add_child(eyebrow)
	eyebrow.name = "Eyebrow"
	var heading := _label("3D town settings", 28, CREAM)
	heading.name = "Heading"
	panel.add_child(heading)
	var subtitle := _label("Make this town feel like yours.", 15, MUTED)
	subtitle.name = "Subtitle"
	panel.add_child(subtitle)
	close_button = Button.new()
	close_button.text = "×"
	close_button.tooltip_text = "Close 3D town settings"
	close_button.add_theme_font_size_override("font_size", 24)
	close_button.add_theme_stylebox_override("normal", _box(Color("ffffff12"), 9, Color("ffffff30")))
	close_button.pressed.connect(close_settings)
	panel.add_child(close_button)

func _build_body() -> void:
	var divider := ColorRect.new()
	divider.name = "HeaderDivider"
	divider.color = Color("ffffff24")
	panel.add_child(divider)
	var sidebar := Panel.new()
	sidebar.name = "Sidebar"
	sidebar.add_theme_stylebox_override("panel", _box(Color("080e0b44"), 0))
	panel.add_child(sidebar)
	navigation = VBoxContainer.new()
	navigation.add_theme_constant_override("separation", 7)
	sidebar.add_child(navigation)
	for index in SECTIONS.size():
		var button := Button.new()
		button.text = SECTIONS[index]
		button.alignment = HORIZONTAL_ALIGNMENT_LEFT
		button.add_theme_font_size_override("font_size", 14)
		button.pressed.connect(_select_section.bind(index))
		navigation.add_child(button)
	scroll = ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	panel.add_child(scroll)
	content = VBoxContainer.new()
	content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content.add_theme_constant_override("separation", 14)
	scroll.add_child(content)

func _build_footer() -> void:
	var divider := ColorRect.new()
	divider.name = "FooterDivider"
	divider.color = Color("ffffff24")
	panel.add_child(divider)
	footer_status = _label("No settings to apply yet", 12, MUTED)
	panel.add_child(footer_status)
	apply_button = Button.new()
	apply_button.text = "Apply changes"
	apply_button.tooltip_text = "Settings controls will be added later"
	apply_button.disabled = true
	apply_button.add_theme_stylebox_override("normal", _box(Color("b88643"), 9))
	apply_button.add_theme_stylebox_override("disabled", _box(Color("685a44"), 9))
	panel.add_child(apply_button)

func _layout() -> void:
	if not is_instance_valid(panel):
		return
	var viewport_size := size
	var width := minf(820.0, viewport_size.x - 32.0)
	var height := minf(610.0, viewport_size.y - 32.0)
	panel.position = (viewport_size - Vector2(width, height)) * 0.5
	panel.size = Vector2(width, height)
	var sidebar_width := minf(186.0, width * 0.32)
	panel.get_node("Eyebrow").position = Vector2(23, 21)
	panel.get_node("Heading").position = Vector2(23, 44)
	panel.get_node("Subtitle").position = Vector2(23, 80)
	close_button.position = Vector2(width - 56, 22)
	close_button.size = Vector2(34, 34)
	panel.get_node("HeaderDivider").position = Vector2(0, 111)
	panel.get_node("HeaderDivider").size = Vector2(width, 1)
	var sidebar := panel.get_node("Sidebar") as Panel
	sidebar.position = Vector2(0, 112)
	sidebar.size = Vector2(sidebar_width, height - 112)
	navigation.position = Vector2(11, 17)
	navigation.size = Vector2(sidebar_width - 22, height - 130)
	for button in navigation.get_children():
		button.custom_minimum_size.y = 40
	scroll.position = Vector2(sidebar_width + 20, 125)
	scroll.size = Vector2(width - sidebar_width - 40, height - 206)
	panel.get_node("FooterDivider").position = Vector2(sidebar_width, height - 68)
	panel.get_node("FooterDivider").size = Vector2(width - sidebar_width, 1)
	footer_status.position = Vector2(sidebar_width + 20, height - 43)
	footer_status.size = Vector2(width - sidebar_width - 180, 25)
	apply_button.position = Vector2(width - 145, height - 51)
	apply_button.size = Vector2(125, 36)

func _select_section(index: int) -> void:
	selected_section = index
	_show_section()

func _show_section() -> void:
	if not is_instance_valid(content):
		return
	for child in content.get_children():
		content.remove_child(child)
		child.queue_free()
	for index in navigation.get_child_count():
		var button := navigation.get_child(index) as Button
		button.add_theme_color_override("font_color", GOLD if index == selected_section else MUTED)
		button.add_theme_stylebox_override("normal", _box(Color("b886432c") if index == selected_section else Color.TRANSPARENT, 8))
	match selected_section:
		0:
			_section_heading("TOWN", "Town options will be added here.")
			_note("Lighting and sound controls are coming later.")
		1:
			_section_heading("COMPANIONS", "Choose a 3D pet")
			_note("Each pet has its own place for future settings. This does not change 2D pet animations.")
			_pet_picker()
		2:
			_section_heading("CAMERA & COMFORT", "Camera options will be added here.")
			_note("Camera speed and reduced motion controls are coming later.")
		3:
			_section_heading("DECORATIONS", "Make the town yours")
			_note("Close settings to add trees or select a tree, flower patch, house, bench, or light to move, turn, resize, or remove it. Changes save automatically.")
			var done := Button.new()
			done.text = "Return to town"
			done.pressed.connect(close_settings)
			content.add_child(done)
