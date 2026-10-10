extends Control

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE

func _draw() -> void:
	var center := size / 2
	var radius := minf(size.x, size.y) / 2 - 1
	draw_circle(center, radius, Color("efd48d"))
	draw_arc(center, radius, 0, TAU, 64, Color("b98a39"), 1.3, true)
	draw_arc(center, radius - 3, 0, TAU, 64, Color("fff5d6"), 1, true)
	var points := PackedVector2Array()
	for i in range(8):
		var angle := -PI / 2 + i * PI / 4
		points.append(center + Vector2.from_angle(angle) * radius * (0.64 if i % 2 == 0 else 0.28))
	draw_colored_polygon(points, Color("8b6520"))
