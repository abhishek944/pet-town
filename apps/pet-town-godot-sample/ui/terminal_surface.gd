extends TextEdit
## Draw server cells; the native text layer retains focus, selection and copying.
const Painter = preload("res://ui/terminal_painter.gd")
const WrapGeometry = preload("res://ui/terminal_wrap_geometry.gd")
var grid: RefCounted
var capture_grid := false
var cell_size := Vector2(7.5, 20)
var font_faces: Array[Font] = []
var selecting := false
var selection_start := Vector2i.ZERO
var blink_timer := 0.0
var blink_visible := true
var has_blink := false
var last_v_scroll := -1.0
var cell_text_columns: Array = []
var display_columns := PackedInt32Array()
var advance_cache := {}
var wrap_geometry := WrapGeometry.new()
var projected_sequence := -1

func _ready() -> void:
	editable = false
	wrap_mode = LINE_WRAPPING_BOUNDARY
	for bold in [false, true]:
		for italic in [false, true]:
			var face := SystemFont.new()
			face.font_names = PackedStringArray(["Menlo", "Monaco", "monospace"])
			face.font_weight = 700 if bold else 400
			face.font_italic = italic
			var cjk := SystemFont.new()
			cjk.font_names = PackedStringArray(["Arial Unicode MS"])
			cjk.font_weight = face.font_weight
			cjk.font_italic = face.font_italic
			var fallback_fonts: Array[Font] = [cjk]
			face.fallbacks = fallback_fonts
			font_faces.append(face)
	add_theme_font_override("font", font_faces[0])
	add_theme_font_size_override("font_size", 13)
	add_theme_constant_override("line_spacing", maxi(0, int(20 - font_faces[0].get_height(13))))
	for key in ["font_color", "font_readonly_color", "font_selected_color", "caret_color", "selection_color"]: add_theme_color_override(key, Color.TRANSPARENT)
	var focus_style := StyleBoxFlat.new()
	focus_style.bg_color = Color.TRANSPARENT
	focus_style.border_color = Color("426448")
	focus_style.set_border_width_all(2)
	focus_style.set_expand_margin_all(0)
	focus_style.set_content_margin_all(0)
	add_theme_stylebox_override("focus", focus_style)
	cell_size.x = font_faces[0].get_string_size("M", HORIZONTAL_ALIGNMENT_LEFT, -1, 1000).x * 12.5 / 1000
	caret_changed.connect(queue_redraw)
	focus_entered.connect(queue_redraw)
	resized.connect(func() -> void: wrap_geometry.invalidate(); queue_redraw())
	text_changed.connect(wrap_geometry.invalidate)
	focus_exited.connect(func() -> void: selecting = false; queue_redraw())

func glyph_advance(glyph: String) -> float:
	if advance_cache.has(glyph): return advance_cache[glyph]
	var advance: float = font_faces[0].get_string_size(glyph, HORIZONTAL_ALIGNMENT_LEFT, -1, 13).x
	advance_cache[glyph] = advance
	return advance

func set_grid(value: RefCounted, _full_grid: bool) -> void:
	if grid == value and value.sequence >= 0 and projected_sequence == value.sequence: return
	grid = value
	projected_sequence = grid.sequence
	wrap_geometry.invalidate()
	var source := cache_projection()
	if text != source:
		var selection := [get_selection_from_line(), get_selection_from_column(), get_selection_to_line(), get_selection_to_column()] if has_selection() else []
		var scroll := get_v_scroll()
		text = source
		set_h_scroll(0)
		set_v_scroll(scroll)
		if not selection.is_empty(): select(selection[0], selection[1], selection[2], selection[3])
	has_blink = false
	for row in grid.cells:
		for cell in row:
			if cell.blink: has_blink = true; break
		if has_blink: break
	queue_redraw()

func cache_projection() -> String:
	cell_text_columns.clear()
	display_columns = PackedInt32Array()
	var lines: Array[String] = []
	for row in range(grid.rows):
		var columns := PackedInt32Array()
		var content := ""
		var visible := 0
		for column in range(grid.cols):
			columns.append(content.length())
			var cell: Dictionary = grid.cells[row][column]
			content += str(cell.glyph)
			if meaningful(cell): visible = maxi(visible, column + (2 if cell.width == 2 else 1))
		columns.append(content.length())
		if grid.cursor_visible and grid.cursor.y == row: visible = maxi(visible, mini(grid.cols, grid.cursor.x + 1))
		display_columns.append(visible)
		cell_text_columns.append(columns)
		lines.append(content.substr(0, columns[visible]))
	return "\n".join(lines)

func meaningful(cell: Dictionary) -> bool:
	var glyph := str(cell.glyph)
	return (not glyph.is_empty() and glyph != " ") or cell.bg.a > 0 or cell.inverse or cell.underline > 0 or cell.overline or cell.strike

func _process(delta: float) -> void:
	if get_h_scroll() != 0: set_h_scroll(0)
	var scroll := get_v_scroll()
	if scroll != last_v_scroll: last_v_scroll = scroll; queue_redraw()
	if not has_blink: return
	blink_timer += delta
	if blink_timer >= 0.5:
		blink_timer = 0
		blink_visible = not blink_visible
		queue_redraw()

func _notification(what: int) -> void:
	if what == NOTIFICATION_THEME_CHANGED:
		wrap_geometry.invalidate()
		advance_cache.clear()

func _draw() -> void:
	if is_instance_valid(grid) and not font_faces.is_empty(): Painter.draw(self)
	if has_focus(): draw_style_box(get_theme_stylebox("focus"), Rect2(Vector2.ZERO, size))

func cell_at_point(point: Vector2) -> Vector2i:
	return WrapGeometry.hit_cell(self, point, false)

func selection_cell_at_point(point: Vector2) -> Vector2i:
	return WrapGeometry.hit_cell(self, point, true)

func text_column(point: Vector2i) -> int:
	var row := clampi(point.y, 0, grid.rows - 1)
	var cell := clampi(point.x, 0, display_columns[row])
	return cell_text_columns[row][cell]

func cell_column(line: int, column: int) -> int:
	var row := clampi(line, 0, grid.rows - 1)
	for cell in range(display_columns[row]):
		if grid.cells[row][cell].width == 0: continue
		var start: int = cell_text_columns[row][cell]
		if column < start + str(grid.cells[row][cell].glyph).length(): return cell
	return display_columns[row]

func display_cell_count(row: int) -> int:
	return display_columns[row]

func selected(column: int, row: int) -> bool:
	if not has_selection(): return false
	var first := Vector2i(cell_column(get_selection_from_line(), get_selection_from_column()), get_selection_from_line())
	var last := Vector2i(cell_column(get_selection_to_line(), get_selection_to_column()), get_selection_to_line())
	return (row > first.y or (row == first.y and column >= first.x)) and (row < last.y or (row == last.y and column < last.x))

func _gui_input(event: InputEvent) -> void:
	if not is_instance_valid(grid): return
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed and (event.shift_pressed or not capture_grid):
			selection_start = selection_cell_at_point(event.position)
			selecting = true
			grab_focus()
			deselect()
			accept_event()
		elif not event.pressed and selecting:
			update_selection(selection_cell_at_point(event.position))
			selecting = false
			accept_event()
	elif event is InputEventMouseMotion and selecting:
		update_selection(selection_cell_at_point(event.position))
		accept_event()

func update_selection(point: Vector2i) -> void:
	select(selection_start.y, text_column(selection_start), point.y, text_column(point))
	queue_redraw()

func dimensions() -> Vector2i:
	var panel := get_theme_stylebox("normal")
	var available := size - Vector2(panel.get_content_margin(SIDE_LEFT) + panel.get_content_margin(SIDE_RIGHT), panel.get_content_margin(SIDE_TOP) + panel.get_content_margin(SIDE_BOTTOM))
	var cell_width: float = get_theme_font("font").get_string_size("M", HORIZONTAL_ALIGNMENT_LEFT, -1, 13).x
	var scrollbar_width: float = get_v_scroll_bar().get_combined_minimum_size().x
	return Vector2i(maxi(2, int((available.x - scrollbar_width) / cell_width)), maxi(1, int(available.y / cell_size.y)))

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
		var foreground := Color("eeeeec")
		for column in range(projection.cols):
			if colors[row].has(column): foreground = colors[row][column]
			projection.cells[int(row)][column].fg = foreground
	set_grid(projection, true)
