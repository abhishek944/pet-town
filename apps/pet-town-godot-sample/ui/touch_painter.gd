extends RefCounted

static func gradient(surface: Control, center: Vector2, radius: float, top: Color, bottom: Color) -> void:
	for layer in range(28):
		var value := float(layer) / 27
		var y := radius * (2 * value - 1)
		var x := sqrt(maxf(0, radius * radius - y * y))
		surface.draw_line(center + Vector2(-x,y), center + Vector2(x,y), top.lerp(bottom,value), radius / 12 + 1, true)

static func draw(surface: Control) -> void:
	var stick: Rect2 = surface.stick
	var center := stick.get_center()
	var radius := stick.size.x / 2
	surface.draw_circle(center + Vector2(0,4), radius, Color("c8aa8273"))
	surface.draw_circle(center, radius, Color("ffffffd9"))
	surface.draw_circle(center, radius - 3, Color("fffaf080"))
	surface.draw_circle(center, radius * 0.55, Color("fffaf048"))
	for dash in range(16): surface.draw_arc(center, radius * 0.48, dash * TAU / 16, (dash + 0.55) * TAU / 16, 4, Color("8b6f5859"),2,true)
	var thumb: Vector2 = center + surface.thumb
	var thumb_radius := 25.0 if surface.size.y <= 540 else 29.0
	surface.draw_circle(thumb + Vector2(0,4), thumb_radius, Color("c6a674"))
	surface.draw_circle(thumb, thumb_radius, Color.WHITE)
	gradient(surface, thumb, thumb_radius - 3, Color("ffe08a" if surface.running else "fffdf8"), Color("ffc94a" if surface.running else "fff0d6"))
	var jump: Rect2 = surface.jump
	var jump_center := jump.get_center() + (Vector2(0,4) if surface.jump_id >= 0 else Vector2.ZERO)
	var jump_radius := jump.size.x / 2 * (0.94 if surface.jump_id >= 0 else 1.0)
	surface.draw_circle(jump_center + Vector2(0,1 if surface.jump_id >= 0 else 5), jump_radius, Color("43a585"))
	surface.draw_circle(jump_center, jump_radius, Color.WHITE)
	gradient(surface,jump_center,jump_radius - 3, Color("8fe0c0"),Color("5fcaa4"))
	var icon := PackedVector2Array([jump_center+Vector2(-10,1),jump_center+Vector2(0,-9),jump_center+Vector2(10,1)])
	surface.draw_polyline(icon,Color.WHITE,5,true)
	surface.draw_line(jump_center+Vector2(0,-8),jump_center+Vector2(0,14),Color.WHITE,5,true)
