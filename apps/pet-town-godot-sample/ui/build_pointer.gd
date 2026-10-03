extends Control

var state := "hide"
var target := Vector2.ZERO
var initialized := false

func _ready() -> void:
	mouse_filter = MOUSE_FILTER_IGNORE
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)

func set_target(point: Vector2, kind: String) -> void:
	target = point
	if state != kind and kind in ["idle", "aim", "bad"]:
		Input.set_custom_mouse_cursor(load("res://ui/icons/build-cursor-%s.svg" % kind), Input.CURSOR_ARROW, Vector2(16, 16))
	state = kind
	if not initialized or position.distance_to(point) > 260:
		position = point
		initialized = true
	queue_redraw()

func _process(delta: float) -> void:
	position = position.lerp(target, 1.0 - exp(-delta * 22))
	queue_redraw()

func _draw() -> void:
	if state in ["hide", "idle"] or Input.mouse_mode != Input.MOUSE_MODE_CAPTURED: return
	var tint := Color("ffb2a3") if state == "bad" else Color.WHITE
	if state == "pet":
		draw_texture_rect(load("res://ui/icons/heart.svg"), Rect2(-15, -15, 30, 30), false)
		return
	draw_circle(Vector2.ZERO, 5, Color("5a423259"))
	draw_circle(Vector2.ZERO, 3, Color.WHITE)
	for x in [-1, 1]:
		for y in [-1, 1]:
			var corner := Vector2(x * 16, y * 16)
			draw_line(corner, corner - Vector2(x * 10, 0), tint, 3.5, true)
			draw_line(corner, corner - Vector2(0, y * 10), tint, 3.5, true)
