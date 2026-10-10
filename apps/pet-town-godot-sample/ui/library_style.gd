extends RefCounted
# Local Asset Library presentation tokens from the approved library:B1 source.
# They stay local so the shared hud_style.gd and unrelated panels keep their
# existing palette while the library matches its selected design.

const Style = preload("res://ui/hud_style.gd")

const CREAM := "fffdf7"
const INK := "343b30"
const QUIET := "59634f"
const NAV := "f2f4eb"
const SAGE := "eaf0df"
const SAGE_INK := "45623c"
const SAGE_BORDER := "a0b38e"
const BORDER := "cbd0c1"
const DIVIDER := "e1e6d8"
const FOOTER_BORDER := "dfe4d5"
const PREVIEW_BG := "e8eddb"
const PREVIEW_BORDER := "d8e0ca"
const CONTROL_BORDER := "c9d0be"
const ERROR_BG := "fff2df"
const ERROR_INK := "855523"
const ERROR_BORDER := "d4b489"
const FOCUS := "355b43"

static func panel(color: String, radius: int, border: String, border_width: int = 1) -> StyleBoxFlat:
	var value := StyleBoxFlat.new()
	value.bg_color = Color(color)
	if border_width > 0:
		value.border_color = Color(border)
		value.set_border_width_all(border_width)
	value.set_corner_radius_all(radius)
	return value

static func card_box() -> StyleBoxFlat:
	var value := panel(CREAM, 16, BORDER)
	value.shadow_color = Color("283e2530")
	value.shadow_size = 12
	value.shadow_offset = Vector2(0, 8)
	return value

static func header_box() -> StyleBoxFlat:
	var value := panel(CREAM, 0, DIVIDER, 0)
	value.border_color = Color(DIVIDER)
	value.border_width_bottom = 1
	value.corner_radius_top_left = 15
	value.corner_radius_top_right = 15
	return value

static func catalog_box(compact: bool) -> StyleBoxFlat:
	var value := panel(NAV, 0, DIVIDER, 0)
	value.border_color = Color(DIVIDER)
	if compact:
		value.border_width_bottom = 1
	else:
		value.border_width_right = 1
	return value

static func footer_box() -> StyleBoxFlat:
	var value := panel(NAV, 0, FOOTER_BORDER, 0)
	value.border_color = Color(FOOTER_BORDER)
	value.border_width_top = 1
	value.corner_radius_bottom_left = 15
	value.corner_radius_bottom_right = 15
	return value

static func action_box(primary: bool, pad_h: int, pad_v: int) -> StyleBoxFlat:
	var value := panel(SAGE if primary else CREAM, 10, SAGE_BORDER if primary else CONTROL_BORDER)
	value.content_margin_left = pad_h
	value.content_margin_right = pad_h
	value.content_margin_top = pad_v
	value.content_margin_bottom = pad_v
	return value

static func select_box() -> StyleBoxFlat:
	var value := panel(CREAM, 10, CONTROL_BORDER)
	value.content_margin_left = 10
	value.content_margin_right = 8
	value.content_margin_top = 8
	value.content_margin_bottom = 8
	return value

static func validation_box(error: bool) -> StyleBoxFlat:
	var value := panel(ERROR_BG if error else NAV, 10, ERROR_BORDER if error else NAV, 1 if error else 0)
	value.content_margin_left = 12
	value.content_margin_right = 12
	value.content_margin_top = 12
	value.content_margin_bottom = 12
	return value

static func preview_box() -> StyleBoxFlat:
	return panel(PREVIEW_BG, 12, PREVIEW_BORDER)

static func focus_box(radius: int) -> StyleBoxFlat:
	var value := panel(FOCUS, radius, FOCUS, 3)
	value.bg_color = Color(0, 0, 0, 0)
	value.expand_margin_left = 3
	value.expand_margin_right = 3
	value.expand_margin_top = 3
	value.expand_margin_bottom = 3
	return value

static func style_action(button: Button, primary: bool = false, font_size: int = 12, pad_h: int = 12, pad_v: int = 10) -> void:
	button.add_theme_font_size_override("font_size", font_size)
	for state in ["normal", "hover", "pressed"]:
		button.add_theme_stylebox_override(state, action_box(primary, pad_h, pad_v))
	var disabled := action_box(primary, pad_h, pad_v)
	disabled.bg_color.a *= 0.5
	disabled.border_color.a *= 0.5
	button.add_theme_stylebox_override("disabled", disabled)
	var ink := Color(SAGE_INK if primary else INK)
	for state in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
		button.add_theme_color_override(state, ink)
	var faint := Color(INK)
	faint.a = 0.5
	button.add_theme_color_override("font_disabled_color", faint)
	button.add_theme_stylebox_override("focus", focus_box(10))

static func style_close(button: Button) -> void:
	button.add_theme_font_size_override("font_size", 24)
	for state in ["normal", "hover", "pressed", "disabled"]:
		var value := panel(CREAM, 10, CONTROL_BORDER)
		value.content_margin_left = 4
		value.content_margin_right = 4
		value.content_margin_top = 4
		value.content_margin_bottom = 4
		if state == "normal":
			value.bg_color = Color(0, 0, 0, 0)
		button.add_theme_stylebox_override(state, value)
	for state in ["font_color", "font_hover_color", "font_pressed_color"]:
		button.add_theme_color_override(state, Color(INK))
	button.add_theme_stylebox_override("focus", focus_box(10))

static func title_label(text: String, size: int) -> Label:
	return Style.title(text, size, INK)

static func note(text: String) -> Label:
	var value := Style.text(text, 12, QUIET)
	value.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	value.add_theme_constant_override("line_spacing", 5)
	value.custom_minimum_size.y = 20
	value.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	return value

static func heading(text: String) -> Label:
	return Style.text(text, 13, INK)

static func metric(text: String) -> Label:
	return Style.text(text, 12, INK)

static func hint(text: String) -> Label:
	var value := Style.text(text, 11, QUIET)
	value.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	value.add_theme_constant_override("line_spacing", 6)
	value.custom_minimum_size.y = 20
	value.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	return value

static func validation_label(text: String) -> Label:
	var value := Style.text(text, 12, SAGE_INK)
	value.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	value.add_theme_constant_override("line_spacing", 7)
	value.custom_minimum_size.y = 22
	value.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	value.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return value

static func spacer(height: int) -> Control:
	var value := Control.new()
	value.custom_minimum_size.y = height
	value.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return value

static func box_edges(value: StyleBoxFlat, top: int, left: int, bottom: int, right: int) -> StyleBoxFlat:
	value.content_margin_top = top
	value.content_margin_left = left
	value.content_margin_bottom = bottom
	value.content_margin_right = right
	return value

static func edges(node: Control, top: int, left: int, bottom: int, right: int) -> void:
	node.add_theme_constant_override("margin_top", top)
	node.add_theme_constant_override("margin_left", left)
	node.add_theme_constant_override("margin_bottom", bottom)
	node.add_theme_constant_override("margin_right", right)
