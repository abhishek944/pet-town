extends RefCounted

const Style = preload("res://ui/hud_style.gd")

# Local Journal palette from the selected B1=F Adventure workspace source.
const PAPER := "fffdf7"
const INK := "343b30"
const QUIET := "59634f"
const SAGE := "eaf0df"
const SAGE_EDGE := "a0b38e"
const GREEN := "45623c"
const NAV := "f2f4eb"
const EDGE := "cbd0c1"
const HAIRLINE := "e1e6d8"
const DIVIDER := "dfe4d5"
const HEADING := "40593d"
const CLEAR := "00000000"

static func box(background: String, radius: int, border: String, widths: Vector4i) -> StyleBoxFlat:
	var value := StyleBoxFlat.new()
	value.bg_color = Color(background)
	value.border_color = Color(border)
	value.border_width_left = widths.x
	value.border_width_top = widths.y
	value.border_width_right = widths.z
	value.border_width_bottom = widths.w
	value.set_corner_radius_all(radius)
	value.content_margin_left = 0
	value.content_margin_right = 0
	value.content_margin_top = 0
	value.content_margin_bottom = 0
	return value

static func pad(value: StyleBoxFlat, left: float, top: float, right: float, bottom: float) -> StyleBoxFlat:
	value.content_margin_left = left
	value.content_margin_top = top
	value.content_margin_right = right
	value.content_margin_bottom = bottom
	return value

static func margins(node: MarginContainer, left: float, top: float, right: float, bottom: float) -> void:
	node.add_theme_constant_override("margin_left", int(left))
	node.add_theme_constant_override("margin_top", int(top))
	node.add_theme_constant_override("margin_right", int(right))
	node.add_theme_constant_override("margin_bottom", int(bottom))

static func spacer(height: float) -> Control:
	var node := Control.new()
	node.custom_minimum_size.y = height
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return node

static func lines(node: Label, spacing: int) -> Label:
	node.add_theme_constant_override("line_spacing", spacing)
	return node

static func ink(node: Button, color: String) -> Button:
	for state in ["font_color", "font_hover_color", "font_pressed_color"]:
		node.add_theme_color_override(state, Color(color))
	node.add_theme_color_override("font_disabled_color", Color(color, 0.5))
	return node

static func frame() -> StyleBoxFlat:
	var value := box(PAPER, 16, EDGE, Vector4i(1, 1, 1, 1))
	value.content_margin_left = 1
	value.content_margin_right = 1
	value.content_margin_top = 1
	value.content_margin_bottom = 1
	value.shadow_color = Color("283e2530")
	value.shadow_size = 16
	value.shadow_offset = Vector2(0, 10)
	return value

static func nav_box(active: bool) -> StyleBoxFlat:
	var value := box(SAGE if active else CLEAR, 10, CLEAR, Vector4i(0, 0, 0, 0))
	value.content_margin_left = 12
	value.content_margin_right = 12
	return value

static func action_button(text: String, primary: bool, font_size := 11, side := 10.0) -> Button:
	var button := Style.flat_button(text, SAGE if primary else PAPER, SAGE_EDGE if primary else EDGE)
	button.add_theme_font_size_override("font_size", font_size)
	button.custom_minimum_size.y = 44
	ink(button, GREEN if primary else INK)
	for state in ["normal", "hover", "pressed", "disabled"]:
		var value := button.get_theme_stylebox(state) as StyleBoxFlat
		pad(value, side, 0, side, 0)
		value.set_corner_radius_all(9 if font_size < 12 else 10)
	return button

static func nav_button(text: String) -> Button:
	var button := Style.button(text)
	button.add_theme_font_size_override("font_size", 13)
	button.custom_minimum_size.y = 44
	button.alignment = HORIZONTAL_ALIGNMENT_LEFT
	ink(button, INK)
	for state in ["normal", "hover", "pressed"]:
		button.add_theme_stylebox_override(state, nav_box(false))
	return button

static func close_button() -> Button:
	var button := Style.button("×", Vector2(44, 44))
	button.add_theme_font_size_override("font_size", 24)
	button.accessibility_name = "Close Journal"
	ink(button, INK)
	for state in ["normal", "hover", "pressed"]:
		button.add_theme_stylebox_override(state, box(CLEAR, 10, EDGE, Vector4i(1, 1, 1, 1)))
	return button
