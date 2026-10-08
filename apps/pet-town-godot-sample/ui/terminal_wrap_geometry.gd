extends RefCounted

var positions := {}
var row_layouts := {}
var layout_size := Vector2(-1, -1)
var vertical_scroll := -1.0
var horizontal_scroll := -1.0
var scrollbar_visible := false
var validated_frame := -1

func invalidate() -> void:
	positions.clear()
	row_layouts.clear()
	validated_frame = -1

func prepare(surface: TextEdit, force := false) -> void:
	var vertical := surface.get_v_scroll()
	var horizontal := surface.get_h_scroll()
	var scrollbar := surface.get_v_scroll_bar().visible
	if layout_size != surface.size or vertical_scroll != vertical or horizontal_scroll != horizontal or scrollbar_visible != scrollbar:
		invalidate()
		layout_size = surface.size
		vertical_scroll = vertical
		horizontal_scroll = horizontal
		scrollbar_visible = scrollbar
	var frame := Engine.get_process_frames()
	if not force and validated_frame == frame: return
	validated_frame = frame
	# TextEdit can settle wrapping/scroll origins after its public values change.
	# Also validate at paint/hit boundaries if native drawing settled in this frame.
	for row in row_layouts:
		var layout: Dictionary = row_layouts[row]
		var changed: bool = layout.fragments != surface.get_line_wrapped_text(row)
		if not changed:
			for index in layout.anchors:
				if layout.anchors[index] != surface.get_rect_at_line_column(row, layout.starts[index]):
					changed = true
					break
		if changed:
			invalidate()
			validated_frame = frame
			return

static func cell_position(surface: TextEdit, row: int, column: int) -> Vector2:
	var cache: RefCounted = surface.wrap_geometry
	cache.prepare(surface)
	var key := Vector2i(column, row)
	if not cache.positions.has(key): cache.positions[key] = cache.measure(surface, row, column)
	return cache.positions[key]

func measure(surface: TextEdit, row: int, column: int) -> Vector2:
	var grid: RefCounted = surface.grid
	var source_column := column
	var continuation: bool = column < grid.cols and column > 0 and grid.cells[row][column].width == 0 and grid.cells[row][column - 1].width == 2
	if continuation: source_column -= 1
	var text_column: int = surface.text_column(Vector2i(source_column, row))
	if not row_layouts.has(row):
		var fragments: PackedStringArray = surface.get_line_wrapped_text(row)
		var starts := PackedInt32Array()
		var offset := 0
		for fragment in fragments:
			starts.append(offset)
			offset += fragment.length()
		row_layouts[row] = {"fragments":fragments, "starts":starts, "anchors":{}}
	var layout: Dictionary = row_layouts[row]
	var wrap_index: int = surface.get_line_wrap_index_at_column(row, text_column)
	if wrap_index < 0 or wrap_index >= layout.fragments.size(): return Vector2(-1, -1)
	var fragment_start: int = layout.starts[wrap_index]
	var fragment: String = layout.fragments[wrap_index]
	# Anchor at the native fragment's first glyph, including singleton fragments.
	if not layout.anchors.has(wrap_index): layout.anchors[wrap_index] = surface.get_rect_at_line_column(row, fragment_start)
	var anchor: Rect2i = layout.anchors[wrap_index]
	if anchor.position.x == -1 or anchor.position.y == -1: return Vector2(-1, -1)
	var prefix_length := clampi(text_column - fragment_start, 0, fragment.length())
	var prefix := fragment.substr(0, prefix_length)
	var font: Font = surface.get_theme_font("font")
	var point := Vector2(anchor.position.x + font.get_string_size(prefix, HORIZONTAL_ALIGNMENT_LEFT, -1, 13).x, anchor.position.y)
	if continuation:
		var glyph: String = grid.cells[row][source_column].glyph
		point.x += font.get_string_size(glyph, HORIZONTAL_ALIGNMENT_LEFT, -1, 13).x / 2
	point.x += 3
	return point

static func hit_cell(surface: TextEdit, point: Vector2, selection_endpoint: bool) -> Vector2i:
	surface.wrap_geometry.prepare(surface, true)
	var grid: RefCounted = surface.grid
	var text_position: Vector2i = surface.get_line_column_at_pos(Vector2i(point))
	var row := clampi(text_position.y, 0, grid.rows - 1)
	var font: Font = surface.get_theme_font("font")
	for cell_column in range(surface.display_cell_count(row)):
		var cell: Dictionary = grid.cells[row][cell_column]
		if cell.width == 0: continue
		var origin := cell_position(surface, row, cell_column)
		if origin.x == -1 or origin.y == -1: continue
		var advance: float = font.get_string_size(cell.glyph, HORIZONTAL_ALIGNMENT_LEFT, -1, 13).x
		if point.y >= origin.y and point.y < origin.y + surface.cell_size.y and point.x >= origin.x and point.x < origin.x + advance:
			var half := 1 if cell.width == 2 and point.x >= origin.x + advance / 2 else 0
			return Vector2i(cell_column + half, row)
	var column: int = surface.cell_column(row, text_position.x)
	var end_column: int = surface.text_column(Vector2i(surface.display_cell_count(row), row))
	if text_position.x >= end_column:
		var end_point := cell_position(surface, row, surface.display_cell_count(row))
		var width: float = font.get_string_size("M", HORIZONTAL_ALIGNMENT_LEFT, -1, 13).x
		if end_point.x != -1 and end_point.y != -1 and point.x > end_point.x and width > 0: column += int((point.x - end_point.x) / width)
	var max_column: int = grid.cols if selection_endpoint else grid.cols - 1
	return Vector2i(clampi(column, 0, max_column), row)
