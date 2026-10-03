extends RefCounted
const Attributes = preload("res://ui/terminal_attributes.gd")

static func draw(surface: TextEdit) -> void:
	var grid: RefCounted = surface.grid
	var size: Vector2 = surface.cell_size
	var origin: Vector2 = surface.cell_origin
	var scale := 12.5 / 13
	for row in range(grid.rows):
		var y := origin.y + row * size.y
		if y + size.y < 0 or y > surface.size.y: continue
		for column in range(grid.cols):
			var cell: Dictionary = grid.cells[row][column]
			if cell.width == 0: continue
			var point := Vector2(origin.x + column * size.x, y)
			var extent := Vector2(size.x * cell.width, size.y)
			if point.x + extent.x < 0 or point.x > surface.size.x: continue
			var foreground: Color = cell.fg
			if cell.bold and cell.fg_index >= 0 and cell.fg_index < 8: foreground = Attributes.indexed(cell.fg_index + 8)
			var background: Color = cell.bg
			if cell.inverse:
				var swap := foreground
				foreground = background if background.a > 0 else Color.BLACK
				background = swap
			if surface.selected(column, row):
				background = Color("7f987a")
				foreground = Color("ffffff")
			if background.a > 0: surface.draw_rect(Rect2(point, extent), background)
			if cell.invisible or (cell.blink and not surface.blink_visible) or (cell.glyph == " " and cell.underline == 0 and not cell.strike and not cell.overline): continue
			if cell.dim: foreground.a *= 0.5
			var face: Font = surface.font_faces[(2 if cell.bold else 0) + (1 if cell.italic else 0)]
			var baseline: float = face.get_ascent(13) * scale + (size.y - face.get_height(13) * scale) / 2
			surface.draw_set_transform(point, 0, Vector2.ONE * scale)
			surface.draw_string(face, Vector2(0, baseline / scale), cell.glyph, HORIZONTAL_ALIGNMENT_LEFT, -1, 13, foreground)
			surface.draw_set_transform(Vector2.ZERO)
			var underline: Color = cell.get("underline_color", foreground)
			if cell.underline > 0: decoration(surface, point + Vector2(0, size.y - 3), extent.x, underline, cell.underline)
			if cell.overline: surface.draw_line(point + Vector2(0,2),point + Vector2(extent.x,2),foreground,1)
			if cell.strike: surface.draw_line(point + Vector2(0, size.y / 2), point + Vector2(extent.x, size.y / 2), foreground, 1)
	if grid.cursor_visible: cursor(surface, grid, origin, size)

static func decoration(surface: Control, point: Vector2, width: float, color: Color, style: int) -> void:
	if style in [1, 2]:
		surface.draw_line(point, point + Vector2(width, 0), color, 1)
		if style == 2: surface.draw_line(point + Vector2(0, 2), point + Vector2(width, 2), color, 1)
	elif style == 3:
		var wave := PackedVector2Array()
		for x in range(int(ceil(width)) + 1): wave.append(point + Vector2(x, sin(x * PI / 3)))
		surface.draw_polyline(wave, color, 1, true)
	else:
		var segment := 1 if style == 4 else 3
		for x in range(0, int(ceil(width)), segment + 2): surface.draw_line(point + Vector2(x, 0), point + Vector2(minf(width, x + segment), 0), color, 1)

static func cursor(surface: TextEdit, grid: RefCounted, origin: Vector2, size: Vector2) -> void:
	var column: int = mini(grid.cols - 1, grid.cursor.x)
	var point := origin + Vector2(column * size.x, grid.cursor.y * size.y)
	var color := Color("c5dac0")
	if not surface.has_focus(): surface.draw_rect(Rect2(point, size), color, false, 1); return
	if grid.cursor_style in [3, 4]: surface.draw_rect(Rect2(point + Vector2(0,size.y - 2),Vector2(size.x,2)),color)
	elif grid.cursor_style in [5, 6]: surface.draw_rect(Rect2(point,Vector2(1,size.y)),color)
	else:
		surface.draw_rect(Rect2(point,size),color)
		var cell: Dictionary = grid.cells[grid.cursor.y][column]
		if cell.width == 0 or cell.glyph == " ": return
		var face: Font = surface.font_faces[(2 if cell.bold else 0) + (1 if cell.italic else 0)]
		var scale := 12.5 / 13
		var baseline: float = face.get_ascent(13) * scale + (size.y - face.get_height(13) * scale) / 2
		surface.draw_set_transform(point,0,Vector2.ONE * scale)
		surface.draw_string(face,Vector2(0,baseline / scale),cell.glyph,HORIZONTAL_ALIGNMENT_LEFT,-1,13,Color.BLACK)
		surface.draw_set_transform(Vector2.ZERO)
