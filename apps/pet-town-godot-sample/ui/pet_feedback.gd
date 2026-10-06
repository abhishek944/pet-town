extends Control

signal pet_requested
const Style = preload("res://ui/hud_style.gd")
var prompt: Button
var pet_name: Label
var toast: PanelContainer
var toast_tween: Tween
var pending_toast := ""
var anchor := Vector2.ZERO
var top_toolbar_visible: Callable
var top_toolbar_bottom: Callable

func _ready() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = MOUSE_FILTER_IGNORE
	prompt = Button.new()
	prompt.focus_mode = Control.FOCUS_NONE
	var box := Style.panel("fff7e8", 25, "ffffff")
	box.set_border_width_all(3)
	box.shadow_color = Color("e8d2ad")
	box.shadow_offset = Vector2(0, 4)
	box.shadow_size = 0
	for state in ["normal", "hover", "pressed"]:
		prompt.add_theme_stylebox_override(state, box)
	prompt.pressed.connect(func() -> void: pet_requested.emit())
	add_child(prompt)
	var row := HBoxContainer.new()
	row.mouse_filter = MOUSE_FILTER_IGNORE
	row.add_theme_constant_override("separation", 9)
	row.position = Vector2(10, 7)
	prompt.add_child(row)
	var key := Style.label("F", 14)
	key.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	key.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	key.custom_minimum_size = Vector2(30, 30)
	key.add_theme_color_override("font_color", Color.WHITE)
	var key_box := Style.panel("ff93b3", 9, "ff93b3")
	key_box.set_content_margin_all(0)
	key_box.shadow_color = Color("e2708f")
	key.add_theme_stylebox_override("normal", key_box)
	row.add_child(key)
	row.add_child(Style.label("Pet", 17))
	pet_name = Style.text("", 17, "e0618a")
	row.add_child(pet_name)
	var heart := TextureRect.new()
	heart.texture = Style.icon("heart")
	heart.custom_minimum_size = Vector2(20, 20)
	heart.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	heart.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	heart.mouse_filter = MOUSE_FILTER_IGNORE
	row.add_child(heart)
	prompt.hide()

func set_prompt(name: String, screen_position: Vector2) -> void:
	pet_name.text = name
	var width := 121.0 + Style.BODY.get_string_size(name, HORIZONTAL_ALIGNMENT_LEFT, -1, 17).x
	prompt.size = Vector2(width, 46)
	anchor = Vector2(clampf(screen_position.x, width / 2 + 8, size.x - width / 2 - 8), clampf(screen_position.y, size.y * 0.16 + 46, size.y - 125))
	var target := anchor - Vector2(width / 2, 46)
	prompt.position = prompt.position.lerp(target, 0.25) if prompt.visible else target
	prompt.show()
	queue_redraw()

func clear_prompt() -> void:
	prompt.hide()
	queue_redraw()

func _draw() -> void:
	if prompt and prompt.visible:
		var tail := PackedVector2Array([anchor + Vector2(-10, -3), anchor + Vector2(0, 8), anchor + Vector2(10, -3)])
		draw_colored_polygon(tail, Color("fff1d9"))
		draw_polyline(tail, Color.WHITE, 3, true)

func show_toast(message: String) -> void:
	if not is_visible_in_tree():
		pending_toast = message
		return
	pending_toast = ""
	if toast_tween:
		toast_tween.kill()
	if is_instance_valid(toast):
		toast.queue_free()
	toast = PanelContainer.new()
	toast.mouse_filter = MOUSE_FILTER_IGNORE
	var box := Style.panel("fff8e9", 25, "ffffff")
	box.set_border_width_all(3)
	box.shadow_color = Color("e8d2ad")
	box.content_margin_left = 9
	box.content_margin_top = 6
	box.content_margin_bottom = 6
	toast.add_theme_stylebox_override("panel", box)
	var row := HBoxContainer.new()
	row.mouse_filter = MOUSE_FILTER_IGNORE
	row.add_theme_constant_override("separation", 10)
	var icon := TextureRect.new()
	icon.texture = Style.icon("heart")
	icon.mouse_filter = MOUSE_FILTER_IGNORE
	icon.custom_minimum_size = Vector2(30, 30)
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	var badge := PanelContainer.new()
	badge.mouse_filter = MOUSE_FILTER_IGNORE
	var badge_style := Style.panel("ffd6e2", 17, "ffd6e2", false)
	badge_style.set_content_margin_all(2)
	badge.add_theme_stylebox_override("panel", badge_style)
	badge.add_child(icon)
	row.add_child(badge)
	row.add_child(Style.label(message, 16))
	toast.add_child(row)
	add_child(toast)
	toast.size = toast.get_combined_minimum_size()
	_layout_toast()
	toast.modulate.a = 0
	toast_tween = create_tween()
	toast_tween.tween_property(toast, "modulate:a", 1.0, 0.3)
	toast_tween.tween_interval(3.2)
	toast_tween.tween_property(toast, "modulate:a", 0.0, 0.35)
	toast_tween.tween_callback(toast.queue_free)

func _process(_delta: float) -> void:
	if is_visible_in_tree() and not pending_toast.is_empty(): show_toast(pending_toast)
	if is_instance_valid(toast):
		_layout_toast()
		if toast_tween and toast_tween.is_valid():
			if is_visible_in_tree(): toast_tween.play()
			else: toast_tween.pause()

func _layout_toast() -> void:
	var toolbar := top_toolbar_visible.is_valid() and bool(top_toolbar_visible.call())
	var top: float = maxf(116, float(top_toolbar_bottom.call()) + 20) if toolbar and top_toolbar_bottom.is_valid() else 116 if toolbar else 22
	toast.position = Vector2((size.x - toast.size.x) / 2, top)

func show_response(name: String, message: String, screen_position: Vector2) -> void:
	show_toast(message if not message.is_empty() else name + " looks so happy!")
	for i in range(6):
		var heart := TextureRect.new()
		heart.mouse_filter = MOUSE_FILTER_IGNORE
		heart.texture = Style.icon("heart")
		heart.size = Vector2.ONE * randf_range(19, 33)
		heart.position = screen_position + Vector2(randf_range(-20, 20), randf_range(-10, 10))
		heart.modulate.a = 0
		add_child(heart)
		var tween := create_tween()
		tween.tween_interval(i * 0.07)
		tween.tween_property(heart, "modulate:a", 1.0, 0.15)
		tween.set_parallel(true)
		tween.tween_property(heart, "position", heart.position + Vector2(randf_range(-45, 45), -90), 1.3)
		tween.tween_property(heart, "rotation", randf_range(-0.4, 0.4), 1.3)
		tween.tween_property(heart, "modulate:a", 0.0, 1.3)
		tween.chain().tween_callback(heart.queue_free)
