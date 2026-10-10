extends RefCounted

## Local Settings presentation only. Uses the existing native fonts and controls
## with the Time & weather palette; hud_style.gd is not modified.

const Style = preload("res://ui/hud_style.gd")

const CREAM := "fff9eb"
const INK := "4c402f"
const QUIET := "716449"
const NAV := "f4ead7"
const SAGE := "edf1df"
const SAGE_BORDER := "668554"
const SAGE_INK := "355b43"
const BORDER := "dac5a1"
const DIVIDER := "ead9b9"
const ROW_DIVIDER := "ead9b9"
const FOOTER_DIVIDER := "deccac"
const CONTROL_BORDER := "dac5a1"
const RESET_BORDER := "d7c09a"
const RESET_INK := "8b4c36"

static func box(background: String, border: String, radius: int, left := 15, right := 15, top := 10, bottom := 10) -> StyleBoxFlat:
	var value := StyleBoxFlat.new()
	value.bg_color = Color(background) if not background.is_empty() else Color(0, 0, 0, 0)
	if border.is_empty():
		value.set_border_width_all(0)
	else:
		value.border_color = Color(border)
		value.set_border_width_all(1)
	value.set_corner_radius_all(radius)
	value.content_margin_left = left
	value.content_margin_right = right
	value.content_margin_top = top
	value.content_margin_bottom = bottom
	return value

static func card() -> StyleBoxFlat:
	var value := box(CREAM, BORDER, 16, 0, 0, 0, 0)
	value.shadow_color = Color("283e2526")
	value.shadow_size = 30
	value.shadow_offset = Vector2(0, 16)
	return value

static func nav_panel(horizontal: bool) -> StyleBoxFlat:
	var value := box(NAV, "", 0, 0, 0, 0, 0)
	if horizontal:
		value.border_width_bottom = 1
	else:
		value.border_width_right = 1
	value.border_color = Color(DIVIDER)
	return value

static func footer() -> StyleBoxFlat:
	var value := box(NAV, "", 0, 0, 0, 0, 0)
	value.border_width_top = 1
	value.border_color = Color(FOOTER_DIVIDER)
	value.corner_radius_bottom_left = 15
	value.corner_radius_bottom_right = 15
	return value

static func line(size: int) -> float:
	return {24: 29.0, 19: 26.0, 18: 24.0, 14: 19.0, 13: 18.0, 12: 20.0, 11: 19.0}.get(size, size + 4.0)

static func ink_label(text: String, size: int, color := INK) -> Label:
	var node := Style.label(text, size)
	node.add_theme_color_override("font_color", Color(color))
	return node

static func block(label: Label, height: float) -> Control:
	var holder := Control.new()
	holder.custom_minimum_size.y = height
	holder.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	holder.add_child(label)
	label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	return holder

static func heading(text: String, size := 22, gap := 8) -> Control:
	return block(Style.title(text, size, INK), line(size) + gap)

static func paragraph(text: String, size := 11, gap := 14) -> Control:
	var node := ink_label(text, size, QUIET)
	node.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return block(node, line(size) + gap)

static func line_label(text: String, size: int, height: float, color := INK) -> Control:
	return block(ink_label(text, size, color), height)

static func identity_label(text: String, size := 19, height := 26.0) -> Control:
	var node := Style.title(text, size, INK)
	node.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS; node.clip_text = true
	node.accessibility_name = text
	return block(node, height)

static func divider(color := ROW_DIVIDER) -> ColorRect:
	var node := ColorRect.new()
	node.color = Color(color)
	node.custom_minimum_size.y = 1
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return node

static func spacer(height: float) -> Control:
	var node := Control.new()
	node.custom_minimum_size.y = height
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return node

static func action(text: String, primary := false, padding := 12, font_size := 12) -> Button:
	var node := Style.button(text)
	node.custom_minimum_size.y = 44
	node.add_theme_font_size_override("font_size", font_size)
	var background := "426448" if primary else CREAM
	var border := "426448" if primary else CONTROL_BORDER
	for state in ["normal", "hover", "pressed"]:
		node.add_theme_stylebox_override(state, box(background, border, 10, padding, padding, 10, 10))
	var disabled := box(background, border, 10, padding, padding, 10, 10)
	disabled.bg_color.a *= 0.45
	disabled.border_color.a *= 0.45
	node.add_theme_stylebox_override("disabled", disabled)
	var ink := "fff9e9" if primary else INK
	for state in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
		node.add_theme_color_override(state, Color(ink))
	node.add_theme_color_override("font_disabled_color", Color(ink, 0.45))
	return node

static func switch_button(text: String) -> Button:
	return action(text, true, 14)

static func reset_button(text: String) -> Button:
	var node := action(text, false, 14)
	for state in ["normal", "hover", "pressed", "disabled"]:
		node.add_theme_stylebox_override(state, box("", RESET_BORDER, 10, 14, 14, 10, 10))
	for state in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
		node.add_theme_color_override(state, Color(RESET_INK))
	return node

static func close_button(text := "×") -> Button:
	var node := action(text, false, 5)
	node.add_theme_font_size_override("font_size", 24)
	for state in ["normal", "hover", "pressed", "disabled"]:
		var style := node.get_theme_stylebox(state).duplicate() as StyleBoxFlat
		style.content_margin_top = 5
		style.content_margin_bottom = 5
		node.add_theme_stylebox_override(state, style)
	return node

static func nav_button(text: String) -> Button:
	var node := Style.button(text)
	node.custom_minimum_size.y = 44
	return node

static func style_tab(tab: Button, selected: bool, compact: bool) -> void:
	tab.add_theme_font_size_override("font_size", 10 if compact else 12)
	tab.alignment = HORIZONTAL_ALIGNMENT_CENTER if compact else HORIZONTAL_ALIGNMENT_LEFT
	for state in ["normal", "hover", "pressed", "disabled"]:
		var left := 0 if compact else 12
		var right := 0 if compact else 8
		tab.add_theme_stylebox_override(state, box("e3ebd5" if selected else NAV, "b5c6a0" if selected else NAV, 10, left, right, 8, 8))
	for state in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
		tab.add_theme_color_override(state, Color(SAGE_INK if selected else INK))

static func picker(node: OptionButton, width := 140) -> void:
	node.custom_minimum_size = Vector2(width, 44)
	node.fit_to_longest_item = false; node.clip_text = true
	node.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	node.add_theme_font_size_override("font_size", 12)
	for state in ["normal", "hover", "pressed", "disabled"]:
		node.add_theme_stylebox_override(state, box(CREAM, CONTROL_BORDER, 10, 8, 8, 10, 10))
	for state in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
		node.add_theme_color_override(state, Color(INK))

static func slider(node: HSlider) -> void:
	node.custom_minimum_size.y = 44
	for slot in ["grabber", "grabber_highlight", "grabber_disabled"]:
		node.add_theme_icon_override(slot, Style.icon("slider-knob"))
	for slot in ["slider", "grabber_area", "grabber_area_highlight"]:
		node.add_theme_stylebox_override(slot, box("ded9cb" if slot == "slider" else "426448", "", 4, 0, 0, 3, 3))

static func setting(parent: Control, label_text: String, hint_text: String, minimum := 0.0, label_size := 14, hint_size := 12, gap := 6) -> HBoxContainer:
	var pad := MarginContainer.new()
	pad.add_theme_constant_override("margin_top", 12)
	pad.add_theme_constant_override("margin_bottom", 12)
	if minimum > 0.0:
		pad.custom_minimum_size.y = minimum
	parent.add_child(pad)
	var row := HBoxContainer.new()
	row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_theme_constant_override("separation", 20)
	pad.add_child(row)
	var copy := VBoxContainer.new()
	copy.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	copy.add_theme_constant_override("separation", 0)
	row.add_child(copy)
	copy.add_child(line_label(label_text, label_size, line(label_size)))
	if not hint_text.is_empty():
		copy.add_child(spacer(gap))
		copy.add_child(line_label(hint_text, hint_size, line(hint_size), QUIET))
	return row
