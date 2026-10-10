extends RefCounted
const Style = preload("res://ui/hud_style.gd")

static func panel(parent: Control, rectangle: Rect2, anchor := Vector2.ZERO) -> Panel:
	var node := Panel.new()
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	node.add_theme_stylebox_override("panel", Style.panel("fff8e9ef", 18, "dec49a"))
	parent.add_child(node)
	node.anchor_left = anchor.x
	node.anchor_right = anchor.x
	node.anchor_top = anchor.y
	node.anchor_bottom = anchor.y
	node.offset_left = rectangle.position.x
	node.offset_top = rectangle.position.y
	node.offset_right = rectangle.end.x
	node.offset_bottom = rectangle.end.y
	return node

static func label(parent: Control, text: String, rectangle: Rect2, size := 14, heading := false) -> Label:
	var node := Style.title(text, size) if heading else Style.label(text, size)
	parent.add_child(node)
	Style.position(node, rectangle)
	return node

static func button(parent: Control, text: String, action: String, callback: Callable, primary := false) -> Button:
	var node := Style.button(text, Vector2(0, 44))
	if primary:
		for state in ["normal", "hover", "pressed"]: node.add_theme_stylebox_override(state, Style.panel("426448" if state == "normal" else "355b43", 12, "355b43"))
		for state in ["font_color", "font_hover_color", "font_pressed_color"]: node.add_theme_color_override(state, Color("fff8e9"))
	node.pressed.connect(func(): callback.call(action))
	parent.add_child(node)
	return node

static func text(parent: Control, value: String, size := 16) -> Label:
	var node := Style.label(value, size)
	node.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	node.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	parent.add_child(node)
	return node

static func full(parent: Control) -> void:
	parent.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

static func bar(parent: Control, value: float, rectangle: Rect2) -> ProgressBar:
	var node := ProgressBar.new()
	node.show_percentage = false
	node.value = value
	node.mouse_filter = Control.MOUSE_FILTER_IGNORE
	node.add_theme_stylebox_override("background", Style.panel("eadac1", 5, "eadac1", false))
	node.add_theme_stylebox_override("fill", Style.panel("587853", 5, "587853", false))
	parent.add_child(node)
	Style.position(node, rectangle)
	return node
