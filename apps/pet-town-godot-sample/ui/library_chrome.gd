extends RefCounted

const Style = preload("res://ui/hud_style.gd")
const Preview = preload("res://ui/library_preview.gd")

static func build(host) -> void:
	host.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	host.color = Color("263f3255")
	Style.scrim(host, host.color, 2.0)
	host.card = PanelContainer.new()
	var box := Style.panel("fff8e9", 26, "e9d8b5")
	box.set_content_margin_all(24)
	host.card.add_theme_stylebox_override("panel", box)
	host.add_child(host.card)

	var content := VBoxContainer.new()
	content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content.size_flags_vertical = Control.SIZE_EXPAND_FILL
	content.add_theme_constant_override("separation", 12)
	host.card.add_child(content)

	var header := HBoxContainer.new()
	header.add_theme_constant_override("separation", 16)
	content.add_child(header)
	var titles := VBoxContainer.new()
	titles.add_theme_constant_override("separation", 4)
	titles.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	titles.add_child(Style.text("MAKE A PLACE YOUR OWN", 10, "6e7a5d"))
	titles.add_child(Style.title("Asset library", 26, "3d613f"))
	header.add_child(titles)
	var close := Style.button("×", Vector2(44, 44))
	close.accessibility_name = "Close Asset library"
	close.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	close.add_theme_font_size_override("font_size", 21)
	for state in ["normal", "hover", "pressed", "disabled"]:
		var close_style := Style.panel("fffaf0", 22, "d5ddc4", false)
		close_style.set_content_margin_all(4)
		close.add_theme_stylebox_override(state, close_style)
	close.pressed.connect(func() -> void: host.closed.emit())
	header.add_child(close)

	var body_scroll := ScrollContainer.new()
	body_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	body_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	body_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	content.add_child(body_scroll)

	host.split = HFlowContainer.new()
	host.split.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.split.size_flags_vertical = Control.SIZE_EXPAND_FILL
	host.split.add_theme_constant_override("h_separation", 24)
	host.split.add_theme_constant_override("v_separation", 14)
	body_scroll.add_child(host.split)

	host.left_column = VBoxContainer.new()
	host.left_column.custom_minimum_size.x = 310
	host.left_column.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	host.left_column.add_theme_constant_override("separation", 10)
	host.split.add_child(host.left_column)
	host.catalog_note = Style.text("Loading available assets…", 11, "777b64")
	host.catalog_note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	host.left_column.add_child(host.catalog_note)
	host.catalog_scroll = ScrollContainer.new()
	host.catalog_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	host.catalog_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	host.catalog_scroll.follow_focus = true
	host.catalog_scroll.custom_minimum_size = Vector2(310, 400)
	host.catalog_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.catalog_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	host.left_column.add_child(host.catalog_scroll)
	host.cards = VBoxContainer.new()
	host.cards.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.cards.add_theme_constant_override("separation", 9)
	host.catalog_scroll.add_child(host.cards)

	host.right_column = VBoxContainer.new()
	host.right_column.custom_minimum_size.x = 370
	host.right_column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.right_column.add_theme_constant_override("separation", 8)
	host.split.add_child(host.right_column)
	var detail_heading := VBoxContainer.new()
	detail_heading.add_theme_constant_override("separation", 3)
	host.right_column.add_child(detail_heading)
	host.name_label = Style.title("Choose an asset", 22, "3d613f")
	host.name_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	detail_heading.add_child(host.name_label)
	host.note = Style.text("", 11, "777b64")
	host.note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	detail_heading.add_child(host.note)
	host.preview = Preview.new()
	host.preview.corner_radius = 15.0
	host.preview.fit_to_stage = true
	host.preview.custom_minimum_size = Vector2(370, 158)
	host.preview.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.preview.clip_contents = true
	host.right_column.add_child(host.preview)

	var controls := VBoxContainer.new()
	controls.add_theme_constant_override("separation", 8)
	host.right_column.add_child(controls)
	var placement_row := HFlowContainer.new()
	placement_row.add_theme_constant_override("h_separation", 8)
	placement_row.add_theme_constant_override("v_separation", 8)
	controls.add_child(placement_row)
	host.turn = Style.flat_button("Turn 90°")
	host.turn.accessibility_name = "Turn selected asset 90 degrees"
	host.turn.custom_minimum_size = Vector2(146, 44)
	host.turn.pressed.connect(host._turn_asset)
	placement_row.add_child(host.turn)
	host.angle_label = Style.text("0°", 12)
	host.angle_label.custom_minimum_size.x = 38
	host.angle_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	placement_row.add_child(host.angle_label)
	var distance_column := VBoxContainer.new()
	distance_column.custom_minimum_size.x = 160
	distance_column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	distance_column.add_theme_constant_override("separation", 3)
	placement_row.add_child(distance_column)
	host.distance_label = Style.text("Distance ahead · 12 m", 11, "556747")
	distance_column.add_child(host.distance_label)
	host.distance_slider = HSlider.new()
	Style.slider(host.distance_slider)
	host.distance_slider.min_value = 5
	host.distance_slider.max_value = 24
	host.distance_slider.value = host.distance
	host.distance_slider.custom_minimum_size.y = 22
	host.distance_slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.distance_slider.focus_mode = Control.FOCUS_ALL
	host.distance_slider.accessibility_name = "Placement distance"
	host.distance_slider.accessibility_description = "Choose 5 to 24 metres ahead."
	host.distance_slider.value_changed.connect(host._distance_changed)
	distance_column.add_child(host.distance_slider)

	var action_row := HBoxContainer.new()
	action_row.add_theme_constant_override("separation", 8)
	controls.add_child(action_row)
	host.add = Style.flat_button("Add to this spot", "e7efd8", "c3d4ae")
	host.add.custom_minimum_size.y = 44
	host.add.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.add.pressed.connect(func() -> void: host.place_requested.emit(host.selected_id, host.angle, host.distance))
	action_row.add_child(host.add)
	var undo := Style.flat_button("Undo latest asset change")
	undo.custom_minimum_size.y = 44
	undo.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	undo.pressed.connect(func() -> void: host.undo_requested.emit())
	action_row.add_child(undo)

	host.targets = preload("res://ui/asset_targets.gd").new()
	host.targets.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	host.targets.replace_requested.connect(func(target: String) -> void: host.replace_requested.emit(host.selected_id, target, host.angle))
	host.targets.restore_requested.connect(func(target: String) -> void: host.restore_requested.emit(target))
	host.targets.target_changed.connect(host._target_changed)
	controls.add_child(host.targets)
	host.result = Style.text("", 10, "777b64")
	host.result.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	host.result.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	controls.add_child(host.result)

	var footer := Style.text("Walk to a new spot before opening the library. K or Escape closes. H opens help; P takes a photo.", 11, "6e7a5d")
	footer.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content.add_child(footer)
	# Catalog has its own focus-follow; only right-side controls move the outer body.
	for field in [host.turn, host.distance_slider, host.add, undo, host.targets.picker, host.targets.replace, host.targets.restore]:
		field.focus_entered.connect(func() -> void: body_scroll.ensure_control_visible(field))
		if field is Button:
			for state in ["font_focus_color", "font_hover_color", "font_pressed_color"]:
				field.add_theme_color_override(state, Style.INK)
	host.resized.connect(host.resize_card)
	host.card.minimum_size_changed.connect(func() -> void: host.call_deferred("resize_card"))
	host.resize_card()
	host.hide()
