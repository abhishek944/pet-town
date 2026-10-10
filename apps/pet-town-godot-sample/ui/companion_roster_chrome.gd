extends RefCounted

const Style = preload("res://ui/hud_style.gd")
const CREAM := "fffdf7"
const INK := "343b30"
const QUIET := "59634f"
const SAGE := "eaf0df"
const SAGE_LINE := "a0b38e"
const NAV := "f2f4eb"
const BORDER := "cbd0c1"
const DIVIDER := "e5e8dd"
const FOOTER_LINE := "dfe4d5"
const MUTED := "656654"

static var _crisp_portraits: Dictionary = {}

static func card_rect(viewport: Vector2) -> Rect2:
	var compact := viewport.x <= 700.0 or viewport.y <= 600.0
	var origin := Vector2(14, 14) if compact else Vector2(24, 112)
	var margin := 14.0 if compact else 24.0
	var bottom := 14.0 if compact else 48.0
	var width := minf(400.0, maxf(0.0, viewport.x - origin.x - margin))
	var height := minf(560.0, maxf(0.0, viewport.y - origin.y - bottom))
	return Rect2(origin, Vector2(width, height))

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
	var panel := Style.panel(CREAM, 16, BORDER)
	panel.set_content_margin_all(1)
	panel.shadow_color = Color("283e2520")
	panel.shadow_size = 18
	panel.shadow_offset = Vector2(0, 14)
	host.add_child(card)
	card.add_theme_stylebox_override("panel", panel)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 0)
	card.add_child(column)

	var header := MarginContainer.new()
	header.add_theme_constant_override("margin_left", 24)
	header.add_theme_constant_override("margin_right", 24)
	header.add_theme_constant_override("margin_top", 22)
	header.add_theme_constant_override("margin_bottom", 18)
	column.add_child(header)
	var head_row := HBoxContainer.new()
	head_row.add_theme_constant_override("separation", 12)
	header.add_child(head_row)
	var heading := VBoxContainer.new()
	heading.add_theme_constant_override("separation", 5)
	heading.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head_row.add_child(heading)
	var title_row := HBoxContainer.new()
	title_row.add_theme_constant_override("separation", 6)
	title_row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	heading.add_child(title_row)
	title_row.add_child(Style.title("Companions", 27, INK))
	var count_label := Style.text("0", 13, INK)
	var badge := Style.panel("e7ecdf", 20, "e7ecdf", false)
	badge.content_margin_left = 10
	badge.content_margin_right = 10
	badge.content_margin_top = 5
	badge.content_margin_bottom = 5
	count_label.add_theme_stylebox_override("normal", badge)
	count_label.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	var badge_stack := VBoxContainer.new()
	badge_stack.add_theme_constant_override("separation", 0)
	var badge_gap := Control.new()
	badge_gap.custom_minimum_size.y = 8
	badge_gap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	badge_stack.add_child(badge_gap)
	badge_stack.add_child(count_label)
	title_row.add_child(badge_stack)
	heading.add_child(Style.text("Choose someone to follow.", 13, QUIET))
	var close_stack := VBoxContainer.new()
	close_stack.add_theme_constant_override("separation", 0)
	var close_gap := Control.new()
	close_gap.custom_minimum_size.y = 2
	close_gap.mouse_filter = Control.MOUSE_FILTER_IGNORE
	close_stack.add_child(close_gap)
	var close_button := flat("×", CREAM, "c9d0be", 10, Vector2.ZERO)
	close_button.custom_minimum_size = Vector2(44, 44)
	close_button.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	close_button.add_theme_font_size_override("font_size", 24)
	for slot in ["font_color", "font_hover_color", "font_pressed_color"]:
		close_button.add_theme_color_override(slot, Color(INK))
	close_button.accessibility_name = "Close Companions"
	close_stack.add_child(close_button)
	head_row.add_child(close_stack)

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.follow_focus = true
	column.add_child(scroll)
	var pad := MarginContainer.new()
	pad.add_theme_constant_override("margin_left", 18)
	pad.add_theme_constant_override("margin_right", 18)
	pad.add_theme_constant_override("margin_bottom", 18)
	pad.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(pad)
	var rows := VBoxContainer.new()
	rows.add_theme_constant_override("separation", 0)
	rows.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	pad.add_child(rows)
	var empty := Style.text("No companions are available right now.\nYour explorer can still wander around town.", 14, QUIET)
	empty.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	empty.add_theme_constant_override("line_spacing", 4)
	var empty_box := Style.panel(CREAM, 0, CREAM, false)
	empty_box.content_margin_left = 12
	empty_box.content_margin_right = 12
	empty_box.content_margin_top = 39
	empty_box.content_margin_bottom = 24
	empty.add_theme_stylebox_override("normal", empty_box)
	rows.add_child(empty)

	var footer := PanelContainer.new()
	footer.custom_minimum_size.y = 72
	var footer_style := Style.panel(NAV, 0, FOOTER_LINE, false)
	footer_style.set_content_margin_all(0)
	footer_style.border_width_top = 1
	footer.add_theme_stylebox_override("panel", footer_style)
	column.add_child(footer)
	var footer_pad := MarginContainer.new()
	footer_pad.add_theme_constant_override("margin_left", 20)
	footer_pad.add_theme_constant_override("margin_right", 20)
	footer_pad.add_theme_constant_override("margin_top", 17)
	footer_pad.add_theme_constant_override("margin_bottom", 16)
	footer.add_child(footer_pad)
	var footer_row := HBoxContainer.new()
	footer_row.add_theme_constant_override("separation", 10)
	footer_pad.add_child(footer_row)
	var cycle_hint := Style.text("⌥ A · Cycle companions", 11, MUTED)
	cycle_hint.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	cycle_hint.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	footer_row.add_child(cycle_hint)
	var settings_button := flat("Companion settings · H", CREAM, "b9c6aa", 10, Vector2(12, 12))
	settings_button.custom_minimum_size = Vector2(0, 44)
	settings_button.add_theme_font_size_override("font_size", 12)
	for slot in ["font_color", "font_hover_color", "font_pressed_color"]:
		settings_button.add_theme_color_override(slot, Color(MUTED))
	settings_button.accessibility_name = "Companion settings"
	settings_button.accessibility_description = "Open the selected companion settings."
	footer_row.add_child(settings_button)
	return {"card": card, "scroll": scroll, "rows": rows, "count_label": count_label,
		"close_button": close_button, "settings_button": settings_button, "empty": empty}

static func flat(text: String, background: String, border: String, radius: int, pad: Vector2) -> Button:
	var node := Style.flat_button(text, background, border)
	for state in ["normal", "hover", "pressed"]:
		var box := Style.panel(background, radius, border, false)
		box.content_margin_left = pad.x
		box.content_margin_right = pad.x
		box.content_margin_top = pad.y
		box.content_margin_bottom = pad.y
		node.add_theme_stylebox_override(state, box)
	return node

static func apply_row_style(button: Button, selected: bool) -> void:
	for state in ["normal", "hover", "pressed"]:
		var box := Style.panel(SAGE if selected else CREAM, 12 if selected else 0, SAGE_LINE if selected else DIVIDER, false)
		box.set_content_margin_all(0)
		if not selected:
			box.bg_color = Color(0, 0, 0, 0)
			box.set_border_width_all(0)
			box.border_width_bottom = 1
		button.add_theme_stylebox_override(state, box)

static func status_text(state: String) -> String:
	return {
		"working": "Working",
		"blocked": "Needs you",
		"done": "Completed",
		"completed": "Completed",
		"idle": "Ready",
	}.get(state, "Status unavailable")

static func crisp_portrait(entry: Dictionary) -> Texture2D:
	var source := Style.portrait_texture(entry)
	var key := source.resource_path if not source.resource_path.is_empty() else "id:%d" % source.get_instance_id()
	if not _crisp_portraits.has(key):
		var image := source.get_image()
		image.generate_mipmaps()
		_crisp_portraits[key] = ImageTexture.create_from_image(image)
	return _crisp_portraits[key]
