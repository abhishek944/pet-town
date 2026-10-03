extends Control

var hour := 10.5

func _ready() -> void:
	mouse_filter = MOUSE_FILTER_IGNORE
	custom_minimum_size = Vector2(40, 40)

func set_hour(value: float) -> void:
	hour = value
	queue_redraw()

func _draw() -> void:
	var day := hour >= 5.5 and hour < 19
	var sky := Color("9cddf2") if day else Color("38395b")
	if hour > 16 and hour < 19:
		sky = sky.lerp(Color("efa1a0"), (hour - 16) / 3)
	draw_circle(Vector2(20, 20), 20, sky)
	if not day:
		for point in [Vector2(8, 12), Vector2(28, 8), Vector2(19, 5), Vector2(34, 17)]:
			draw_circle(point, 0.8, Color.WHITE)
	var phase := ((hour - 5.5) / 13.5 if day else fmod(hour - 19 + 24, 24) / 10.5) * PI
	var orb := Vector2(20 - cos(phase) * 14.4, 28 - sin(phase) * 18.4)
	draw_circle(orb, 6, Color("ffdb50") if day else Color("fff3c7"))
	if day:
		for i in range(8):
			var direction := Vector2.from_angle(float(i) * TAU / 8)
			draw_line(orb + direction * 8, orb + direction * 10, Color("efa928"), 1.5, true)
	var brightness := 1.0 if day else 0.55
	draw_colored_polygon(PackedVector2Array([Vector2(3, 29), Vector2(8, 25), Vector2(18, 27), Vector2(29, 26), Vector2(37, 30), Vector2(32, 36), Vector2(20, 40), Vector2(10, 37)]), Color("8fdc6f") * brightness)
	draw_line(Vector2(12, 23), Vector2(12, 34), Color("9b8150"), 2)
	draw_circle(Vector2(12, 23), 4, Color("4f9d42") * brightness)
