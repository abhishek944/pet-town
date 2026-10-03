extends RefCounted

const INK := Color("4c402f")
const BODY = preload("res://ui/fonts/nunito-800.ttf")
const HEAVY = preload("res://ui/fonts/nunito-900.ttf")
const TITLE = preload("res://ui/fonts/fraunces-700.ttf")

static func panel(color: String = "fff8e9", radius: int = 18, border: String = "e9d7b5", shadow: bool = true) -> StyleBoxFlat:
	var box := StyleBoxFlat.new()
	box.bg_color = Color(color)
	box.border_color = Color(border)
	box.set_border_width_all(1)
	box.set_corner_radius_all(radius)
	box.content_margin_left = 15
	box.content_margin_right = 15
	box.content_margin_top = 10
	box.content_margin_bottom = 10
	if shadow:
		box.shadow_color = Color("62492f99")
		box.shadow_size = 1
		box.shadow_offset = Vector2(0, 3)
	return box

static func theme() -> Theme:
	var value := Theme.new()
	value.default_font = BODY
	value.default_font_size = 14
	value.set_color("font_color", "Label", INK)
	value.set_color("font_color", "Button", INK)
	value.set_color("font_hover_color", "Button", INK)
	value.set_color("font_pressed_color", "Button", INK)
	value.set_stylebox("normal", "Button", panel("fff9e9", 14, "dec49a"))
	value.set_stylebox("hover", "Button", panel("ffffff", 14, "bda173"))
	value.set_stylebox("pressed", "Button", panel("eedab6", 14, "bda173", false))
	value.set_stylebox("disabled", "Button", panel("fff9e980", 14, "dec49a80", false))
	value.set_color("font_disabled_color", "Button", Color("4c402f80"))
	var focus := StyleBoxFlat.new()
	focus.bg_color = Color.TRANSPARENT
	focus.border_color = Color("355b43")
	focus.set_border_width_all(2)
	focus.set_corner_radius_all(9)
	value.set_stylebox("focus", "Button", focus)
	value.set_constant("separation", "VBoxContainer", 12)
	return value

static func label(text: String, font_size: int = 14) -> Label:
	var node := Label.new()
	node.text = text
	node.add_theme_font_size_override("font_size", font_size)
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return node

static func button(text: String, minimum: Vector2 = Vector2.ZERO) -> Button:
	var node := Button.new()
	node.text = text
	node.custom_minimum_size = minimum
	node.focus_mode = Control.FOCUS_ALL
	node.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	return node

static func position(node: Control, rectangle: Rect2) -> void:
	node.position = rectangle.position
	node.size = rectangle.size

static func icon(name: String) -> Texture2D:
	return load("res://ui/icons/%s.svg" % name)

static func title(text: String, size: int = 25, color: String = "4c402f") -> Label:
	var node := label(text, size)
	node.add_theme_font_override("font", TITLE)
	node.add_theme_color_override("font_color", Color(color))
	return node

static func text(text: String, size: int = 12, color: String = "716449") -> Label:
	var node := label(text, size)
	node.add_theme_color_override("font_color", Color(color))
	return node

static func clear(node: Node) -> void:
	for child in node.get_children():
		node.remove_child(child)
		child.queue_free()

static func flat_button(text: String, background: String = "fff8e7", border: String = "d8c39e") -> Button:
	var node := button(text)
	node.add_theme_font_size_override("font_size", 12)
	for state in ["normal", "hover", "pressed"]:
		node.add_theme_stylebox_override(state, panel(background, 9, border, false))
	var disabled := panel(background, 9, border, false)
	disabled.bg_color.a *= 0.5
	disabled.border_color.a *= 0.5
	node.add_theme_stylebox_override("disabled", disabled)
	node.add_theme_color_override("font_disabled_color", Color("4c402f80"))
	return node

static func scrim(node: ColorRect, tint: Color, blur: float = 1.5) -> void:
	var effect := ShaderMaterial.new()
	effect.shader = load("res://ui/dialog_scrim.gdshader")
	effect.set_shader_parameter("tint", tint)
	effect.set_shader_parameter("blur_lod", blur)
	node.material = effect

static func slider(node: HSlider) -> void:
	for slot in ["grabber", "grabber_highlight", "grabber_disabled"]:
		node.add_theme_icon_override(slot, icon("slider-knob"))
	for slot in ["slider", "grabber_area", "grabber_area_highlight"]:
		var track := panel("ded9cb" if slot == "slider" else "426448", 4, "aaa99d" if slot == "slider" else "426448", false)
		track.set_content_margin_all(0)
		track.content_margin_top = 3
		track.content_margin_bottom = 3
		node.add_theme_stylebox_override(slot, track)

static func portrait(entry: Dictionary, minimum := Vector2(43, 43)) -> TextureRect:
	var picture := TextureRect.new()
	picture.texture = portrait_texture(entry)
	picture.custom_minimum_size = minimum
	picture.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	picture.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	picture.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return picture

static func portrait_texture(entry: Dictionary) -> Texture2D:
	var is_mayor: bool = entry.get("isMayor", false) or entry.get("source", "") == "mayor" or entry.get("id", "") == "pet-town-mayor"
	var pet_id := text_or(entry.get("petId"), "mayor" if is_mayor else "maple")
	var path := "res://assets/companion-%s.png" % pet_id
	if ResourceLoader.exists(path): return load(path)
	return icon("companion-mayor") if is_mayor else load("res://assets/companion-maple.png")

static func text_or(value: Variant, fallback := "") -> String:
	return fallback if value == null or str(value).is_empty() else str(value)
