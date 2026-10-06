extends RefCounted

const Style = preload("res://ui/hud_style.gd")

static func build(host: Control) -> Dictionary:
	host.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	host.mouse_filter = Control.MOUSE_FILTER_STOP
	var blocker := ColorRect.new()
	blocker.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	blocker.color = Color.TRANSPARENT
	blocker.mouse_filter = Control.MOUSE_FILTER_STOP
	host.add_child(blocker)

	var card := PanelContainer.new()
	card.mouse_filter = Control.MOUSE_FILTER_STOP
	var panel := Style.panel("fff6e6", 22, "d4b78c")
	panel.content_margin_left = 15
	panel.content_margin_right = 15
	panel.content_margin_top = 14
	panel.content_margin_bottom = 12
	panel.shadow_size = 6
	panel.shadow_offset = Vector2(0, 6)
	host.add_child(card)
	card.add_theme_stylebox_override("panel", panel)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 8)
	card.add_child(column)

	var header := HBoxContainer.new()
	header.add_theme_constant_override("separation", 8)
	header.custom_minimum_size.y = 44
	column.add_child(header)
	var heading := HBoxContainer.new()
	heading.add_theme_constant_override("separation", 6)
	heading.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(heading)
	heading.add_child(Style.title("Companions", 23))
	var count_label := Style.title("0", 23, "7c8b60")
	heading.add_child(count_label)
	var close_button := Style.flat_button("×", "f5e8d0", "d7c09a")
	close_button.custom_minimum_size = Vector2(44, 44)
	close_button.add_theme_font_size_override("font_size", 22)
	close_button.accessibility_name = "Close Companions"
	header.add_child(close_button)

	var subtitle := Style.text("Choose someone to follow.", 11)
	subtitle.custom_minimum_size.y = 18
	column.add_child(subtitle)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.follow_focus = true
	column.add_child(scroll)
	var rows := VBoxContainer.new()
	rows.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rows.add_theme_constant_override("separation", 8)
	scroll.add_child(rows)

	var footer := PanelContainer.new()
	footer.custom_minimum_size.y = 54
	var footer_style := Style.panel("f4e9d3", 0, "deccac", false)
	footer_style.set_border_width_all(0)
	footer_style.border_width_top = 1
	footer_style.set_content_margin_all(0)
	footer.add_theme_stylebox_override("panel", footer_style)
	column.add_child(footer)
	var footer_row := HBoxContainer.new()
	footer_row.add_theme_constant_override("separation", 8)
	footer_row.alignment = BoxContainer.ALIGNMENT_CENTER
	footer.add_child(footer_row)
	var cycle_hint := Style.text("⌥ A  Cycle companions", 10)
	cycle_hint.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	cycle_hint.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	footer_row.add_child(cycle_hint)
	var settings_button := Style.flat_button("Companion settings  H", "f4e9d3", "d7c09a")
	settings_button.custom_minimum_size = Vector2(44, 44)
	settings_button.add_theme_font_size_override("font_size", 10)
	settings_button.accessibility_name = "Companion settings"
	settings_button.accessibility_description = "Open the selected companion settings."
	footer_row.add_child(settings_button)
	return {"card": card, "scroll": scroll, "rows": rows, "count_label": count_label,
		"close_button": close_button, "settings_button": settings_button}
