extends Control

var state := "hide"
var target := Vector2.ZERO
var initialized := false
var captured := false

func _ready() -> void:
	mouse_filter = MOUSE_FILTER_IGNORE
	set_anchors_and_offsets_preset(PRESET_FULL_RECT)

func set_target(point: Vector2, kind: String) -> void:
	var next_captured := Input.mouse_mode == Input.MOUSE_MODE_CAPTURED
	var drawing_changed := state != kind or captured != next_captured
	captured = next_captured
	target = point
	if state != kind and kind in ["idle", "aim", "bad"]:
		Input.set_custom_mouse_cursor(load("res://ui/icons/build-cursor-%s.svg" % kind), Input.CURSOR_ARROW, Vector2(16, 16))
	state = kind
	if not initialized or position.distance_to(point) > 260:
		position = point
		initialized = true
	if drawing_changed: queue_redraw()

func _process(delta: float) -> void:
	position = position.lerp(target, 1.0 - exp(-delta * 22))

func _draw() -> void:
	if state in ["hide", "idle"] or Input.mouse_mode != Input.MOUSE_MODE_CAPTURED: return
	var tint := Color("ffb2a3") if state == "bad" else Color("fffaf0")
	if state == "pet":
		draw_texture_rect(load("res://ui/icons/heart.svg"), Rect2(-15, -15, 30, 30), false)
		return
	var outline := Color("5a423299")
	var corners: Array[PackedVector2Array] = [
		PackedVector2Array([Vector2(-14, -5), Vector2(-14, -14), Vector2(-5, -14)]),
		PackedVector2Array([Vector2(5, -14), Vector2(14, -14), Vector2(14, -5)]),
		PackedVector2Array([Vector2(14, 5), Vector2(14, 14), Vector2(5, 14)]),
		PackedVector2Array([Vector2(-5, 14), Vector2(-14, 14), Vector2(-14, 5)]),
	]
	for points in corners:
		draw_polyline(points, outline, 4.2, true)
		for point in points: draw_circle(point, 2.1, outline)
		draw_polyline(points, tint, 2, true)
		for point in points: draw_circle(point, 1, tint)
	draw_circle(Vector2.ZERO, 3, Color("5a423288"))
	draw_circle(Vector2.ZERO, 1.6, tint)
