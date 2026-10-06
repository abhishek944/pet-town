extends RefCounted

const Style = preload("res://ui/hud_style.gd")

static func show_reset(host) -> void:
	if is_instance_valid(host.confirmation): return
	host.confirmation = ColorRect.new()
	host.confirmation.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	host.confirmation.color = Color("3c281e47")
	host.confirmation.mouse_filter = Control.MOUSE_FILTER_STOP
	host.add_child(host.confirmation)
	var box := PanelContainer.new()
	var paper := Style.panel("fff8e9", 24, "d9c39c", false)
	paper.set_content_margin_all(22)
	paper.shadow_color = Color("1b291f22")
	paper.shadow_size = 12
	paper.shadow_offset = Vector2(0, 12)
	box.add_theme_stylebox_override("panel", paper)
	host.confirmation.add_child(box)
	host.confirmation.gui_input.connect(func(event: InputEvent) -> void:
		if event is InputEventMouseButton and event.pressed and not box.get_global_rect().has_point(event.global_position): host.dismiss_confirmation())
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 12)
	box.add_child(column)
	var warning_scroll := ScrollContainer.new()
	warning_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	warning_scroll.size_flags_vertical = Control.SIZE_FILL
	warning_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	column.add_child(warning_scroll)
	var warning := VBoxContainer.new()
	warning.add_theme_constant_override("separation", 12)
	warning.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	warning_scroll.add_child(warning)
	var title := Style.title("Start the world over?", 23)
	title.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	warning.add_child(title)
	var note := Style.text("Every block you placed or broke goes back to how the island began. This can't be undone.", 14)
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	warning.add_child(note)
	var row := HFlowContainer.new()
	row.add_theme_constant_override("h_separation", 10)
	row.add_theme_constant_override("v_separation", 8)
	column.add_child(row)
	var keep := Style.flat_button("Keep my world  Esc", "e7efd8", "bdcfac")
	keep.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	keep.custom_minimum_size.y = 44
	keep.add_theme_font_size_override("font_size", 12)
	for state in ["font_color", "font_focus_color", "font_hover_color", "font_pressed_color"]:
		keep.add_theme_color_override(state, Color("405d42"))
	keep.call_deferred("grab_focus")
	keep.pressed.connect(host.dismiss_confirmation)
	row.add_child(keep)
	var reset := Style.flat_button("Reset  ↵", "fff1e1", "d8b994")
	reset.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	reset.custom_minimum_size.y = 44
	reset.add_theme_font_size_override("font_size", 12)
	for state in ["font_color", "font_focus_color", "font_hover_color", "font_pressed_color"]:
		reset.add_theme_color_override(state, Color("87533e"))
	reset.pressed.connect(host.confirm_reset)
	row.add_child(reset)
	var fit := func() -> void:
		if not is_instance_valid(box) or not is_instance_valid(host.confirmation) or box.get_parent() != host.confirmation: return
		var available: Vector2 = host.confirmation.size - Vector2(32, 32)
		var dialog_width := minf(460, maxf(1, available.x))
		for button in [keep, reset]: button.custom_minimum_size.x = minf(203, maxf(1, dialog_width - 44))
		var height := maxf(244, warning.get_combined_minimum_size().y + row.get_combined_minimum_size().y + 56)
		var dialog_height := minf(height, maxf(1, available.y))
		warning_scroll.custom_minimum_size.y = minf(warning.get_combined_minimum_size().y, maxf(0, dialog_height - row.get_combined_minimum_size().y - 56))
		box.size = Vector2(dialog_width, dialog_height)
		box.position = (host.confirmation.size - box.size) * 0.5
	host.confirmation.resized.connect(fit)
	box.minimum_size_changed.connect(fit.call_deferred)
	warning.minimum_size_changed.connect(fit.call_deferred)
	fit.call()
