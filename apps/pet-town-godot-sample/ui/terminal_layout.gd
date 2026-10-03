extends RefCounted
## Preserve the original dock's useful rows and uniform background plane.
static func used_rows(grid: RefCounted, original: bool) -> int:
	if original: return grid.rows
	var backgrounds: Dictionary = {}
	for row in grid.cells:
		for cell in row:
			if str(cell.glyph).strip_edges().is_empty():
				var key: String = cell.bg.to_html(true)
				backgrounds[key] = int(backgrounds.get(key, 0)) + 1
	var plane := "00000000"
	var count := -1
	for key in backgrounds:
		if backgrounds[key] > count: count = backgrounds[key]; plane = key
	var used: int = grid.cursor.y + 1
	for row in range(grid.rows - 1, used - 1, -1):
		for cell in grid.cells[row]:
			if not str(cell.glyph).strip_edges().is_empty() or cell.bg.to_html(true) != plane: return row + 1
	return used
