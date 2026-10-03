extends TextEdit
## Draw server cells; the native text layer retains focus, selection and copying.
const Painter = preload("res://ui/terminal_painter.gd")
var grid: RefCounted
var original_grid := false
var capture_grid := false
var cell_size := Vector2(7.5, 20)
var cell_origin := Vector2.ZERO
var font_faces: Array[Font] = []
var selecting := false
var selection_start := Vector2i.ZERO
var blink_timer := 0.0
var blink_visible := true
var has_blink := false
var used_rows := 1

func _ready() -> void:
	editable = false
	wrap_mode = LINE_WRAPPING_NONE
	for bold in [false, true]:
		for italic in [false, true]:
			var face := SystemFont.new()
			face.font_names = PackedStringArray(["Menlo", "Monaco", "monospace"])
			face.font_weight = 700 if bold else 400
			face.font_italic = italic
			font_faces.append(face)
	add_theme_font_override("font", font_faces[0])
	add_theme_font_size_override("font_size", 13)
	add_theme_constant_override("line_spacing", maxi(0, int(20 - font_faces[0].get_height(13))))
	for key in ["font_color", "font_readonly_color", "font_selected_color", "caret_color", "selection_color"]: add_theme_color_override(key, Color.TRANSPARENT)
	cell_size.x = font_faces[0].get_string_size("M", HORIZONTAL_ALIGNMENT_LEFT, -1, 1000).x * 12.5 / 1000
	caret_changed.connect(queue_redraw)
	focus_entered.connect(queue_redraw)
	resized.connect(update_origin)
	focus_exited.connect(func() -> void: selecting = false)
	update_origin()

func set_grid(value: RefCounted, full_grid: bool) -> void:
	grid = value
	original_grid = full_grid
	var source := "\n".join(grid.lines())
	if text != source:
		var selection := [get_selection_from_line(), get_selection_from_column(), get_selection_to_line(), get_selection_to_column()] if has_selection() else []
		var scroll := Vector2(get_h_scroll(), get_v_scroll())
		text = source
		set_h_scroll(int(scroll.x))
		set_v_scroll(scroll.y)
		if not selection.is_empty(): select(selection[0], selection[1], selection[2], selection[3])
	used_rows = preload("res://ui/terminal_layout.gd").used_rows(grid, original_grid)
	has_blink = false
	for row in grid.cells:
		for cell in row:
			if cell.blink: has_blink = true; break
	update_origin()
	queue_redraw()

func update_origin() -> void:
	if not is_instance_valid(grid): return
	var panel := get_theme_stylebox("normal")
	var left := panel.get_content_margin(SIDE_LEFT)
	var top := panel.get_content_margin(SIDE_TOP)
	var bottom := panel.get_content_margin(SIDE_BOTTOM)
	var used := used_rows
	cell_origin = Vector2(left - get_h_scroll(), top - get_v_scroll() * cell_size.y)
	if not original_grid: cell_origin.y += maxf(0, size.y - top - bottom - used * cell_size.y)

func _process(delta: float) -> void:
	var previous := cell_origin
	update_origin()
	if cell_origin != previous: queue_redraw()
	if not has_blink: return
	blink_timer += delta
	if blink_timer >= 0.5:
		blink_timer = 0
		blink_visible = not blink_visible
		queue_redraw()

func _draw() -> void:
	if is_instance_valid(grid) and not font_faces.is_empty(): Painter.draw(self)

func cell_at_point(point: Vector2) -> Vector2i:
	var local := point - cell_origin
	return Vector2i(clampi(int(floor(local.x / cell_size.x)), 0, grid.cols - 1), clampi(int(floor(local.y / cell_size.y)), 0, grid.rows - 1))

func text_column(point: Vector2i) -> int:
	var column := 0
	for cell in range(mini(point.x, grid.cols)):
		column += str(grid.cells[point.y][cell].glyph).length()
	return column

func cell_column(line: int, column: int) -> int:
	var chars := 0
	for cell in range(grid.cols):
		if chars >= column: return cell
		chars += str(grid.cells[line][cell].glyph).length()
	return grid.cols

func selected(column: int, row: int) -> bool:
	if not has_selection(): return false
	var first := Vector2i(cell_column(get_selection_from_line(), get_selection_from_column()), get_selection_from_line())
	var last := Vector2i(cell_column(get_selection_to_line(), get_selection_to_column()), get_selection_to_line())
	return (row > first.y or (row == first.y and column >= first.x)) and (row < last.y or (row == last.y and column < last.x))

func _gui_input(event: InputEvent) -> void:
	if not is_instance_valid(grid): return
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed and (event.shift_pressed or not capture_grid):
			selection_start = cell_at_point(event.position)
			selecting = true
			grab_focus()
			deselect()
			accept_event()
		elif not event.pressed and selecting:
			update_selection(cell_at_point(event.position))
			selecting = false
			accept_event()
	elif event is InputEventMouseMotion and selecting:
		update_selection(cell_at_point(event.position))
		accept_event()

func update_selection(point: Vector2i) -> void:
	select(selection_start.y, text_column(selection_start), point.y, text_column(point))
	queue_redraw()

func dimensions() -> Vector2i:
	var panel := get_theme_stylebox("normal")
	var available := size - Vector2(panel.get_content_margin(SIDE_LEFT) + panel.get_content_margin(SIDE_RIGHT), panel.get_content_margin(SIDE_TOP) + panel.get_content_margin(SIDE_BOTTOM))
	return Vector2i(maxi(2, int(available.x / cell_size.x)), maxi(1, int(available.y / cell_size.y)))

func set_plain(source: String, colors: Dictionary = {}) -> void:
	var projection := preload("res://ui/terminal_grid.gd").new()
	var lines := source.split("\n")
	projection.cols = 512
	projection.rows = maxi(1, lines.size())
	projection.reset()
	var width := 2
	for row in range(lines.size()):
		projection.cursor = Vector2i(0, row)
		for character in lines[row]: projection.write(character)
		width = maxi(width, projection.cursor.x)
	projection.resize(width, projection.rows)
	for row in colors:
		if int(row) >= projection.rows: continue
		var foreground := Color("e4ebdc")
		for column in range(projection.cols):
			if colors[row].has(column): foreground = colors[row][column]
			projection.cells[int(row)][column].fg = foreground
	set_grid(projection, original_grid)
