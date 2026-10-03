extends RefCounted
const Attributes = preload("res://ui/terminal_attributes.gd")
var unicode := preload("res://ui/terminal_unicode.gd").new()
var commands := preload("res://ui/terminal_commands.gd").new()
var parser := preload("res://ui/terminal_parser.gd").new()
var cols := 80
var rows := 24
var cells: Array = []
var cursor := Vector2i.ZERO
var saved := Vector2i.ZERO
var style := Attributes.defaults()
var saved_style := Attributes.defaults()
var scroll_top := 0
var scroll_bottom := 23
var wrap := true
var insert_mode := false
var origin_mode := false
var cursor_visible := true
var cursor_style := 0
var sequence := -1
var alternate: Array = []
var alternate_cursor := Vector2i.ZERO
var tabs: Dictionary = {}
var previous_glyph := " "
var charsets := ["B", "B", "B", "B"]
var charset_index := 0
var saved_charset := ["B", "B", "B", "B"]
var saved_charset_index := 0
var error := ""

func _init() -> void:
	commands.grid = self
	parser.grid = self
	reset()

func blank() -> Dictionary:
	var result := Attributes.defaults()
	result.bg = style.bg
	result.glyph = " "
	result.width = 1
	return result

func blank_row() -> Array:
	var row: Array = []
	for column in range(cols): row.append(blank())
	return row

func reset() -> void:
	style = Attributes.defaults()
	cursor = Vector2i.ZERO
	saved = Vector2i.ZERO
	scroll_top = 0
	scroll_bottom = rows - 1
	wrap = true
	insert_mode = false
	origin_mode = false
	cursor_visible = true
	cursor_style = 0
	charsets = ["B", "B", "B", "B"]
	charset_index = 0
	cells.clear()
	alternate.clear()
	tabs.clear()
	for column in range(8, cols, 8): tabs[column] = true
	for line in range(rows): cells.append(blank_row())
	parser.reset()

func feed(frame: Dictionary) -> void:
	var seq := int(frame.get("seq", -1))
	if seq <= sequence: return
	if not frame.get("full", false) and sequence < 0:
		error = "Terminal output lost its place. Reconnect before typing."
		return
	var width := int(frame.get("width", 0))
	var height := int(frame.get("height", 0))
	var bytes := str(frame.get("bytes", ""))
	if width < 2 or width > 512 or height < 1 or height > 256 or bytes.length() > 1398104:
		error = "Terminal output exceeded the supported frame limits."
		return
	sequence = seq
	error = ""
	if frame.get("full", false):
		cols = width
		rows = height
		reset()
	else: resize(width, height)
	parser.feed(Marshalls.base64_to_raw(bytes))

func resize(width: int, height: int) -> void:
	if width == cols and height == rows: return
	cols = width
	rows = height
	for row in cells:
		while row.size() < cols: row.append(blank())
		row.resize(cols)
	while cells.size() < rows: cells.append(blank_row())
	cells.resize(rows)
	cursor.x = mini(cursor.x, cols - 1)
	cursor.y = mini(cursor.y, rows - 1)
	scroll_top = 0
	scroll_bottom = rows - 1

func write(character: String) -> void:
	if charsets[charset_index] == "0": character = commands.dec_character(character)
	var width: int = unicode.width(character.unicode_at(0))
	if width == 0:
		var x := mini(cols - 1, cursor.x - 1)
		if x >= 0:
			if cells[cursor.y][x].width == 0: x = maxi(0, x - 1)
			cells[cursor.y][x].glyph += character
		return
	if cursor.x >= cols or (width == 2 and cursor.x == cols - 1):
		if wrap:
			cursor.x = 0
			linefeed()
		else:
			cursor.x = cols - 1
			if width == 2: return
	var row: Array = cells[cursor.y]
	if insert_mode:
		for index in range(width): row.insert(cursor.x, blank()); row.pop_back()
	if row[cursor.x].width == 0 and cursor.x > 0: row[cursor.x - 1] = blank()
	if row[cursor.x].width == 2 and cursor.x + 1 < cols: row[cursor.x + 1] = blank()
	var cell := style.duplicate()
	cell.glyph = character
	cell.width = width
	row[cursor.x] = cell
	if width == 2:
		if row[cursor.x + 1].width == 2 and cursor.x + 2 < cols: row[cursor.x + 2] = blank()
		var continuation := cell.duplicate()
		continuation.glyph = ""
		continuation.width = 0
		row[cursor.x + 1] = continuation
	cursor.x += width
	previous_glyph = character

func linefeed() -> void:
	if cursor.y == scroll_bottom: scroll(1)
	else: cursor.y = mini(rows - 1, cursor.y + 1)

func scroll(amount: int) -> void:
	for index in range(absi(amount)):
		if amount > 0:
			cells.remove_at(scroll_top)
			cells.insert(scroll_bottom, blank_row())
		else:
			cells.remove_at(scroll_bottom)
			cells.insert(scroll_top, blank_row())

func erase(line: int, start: int, end: int) -> void:
	for column in range(maxi(0, start), mini(cols, end)):
		if cells[line][column].width == 0 and column > 0: cells[line][column - 1] = blank()
		if cells[line][column].width == 2 and column + 1 < cols: cells[line][column + 1] = blank()
		cells[line][column] = blank()

func lines() -> Array[String]:
	var result: Array[String] = []
	for row in cells:
		var text := ""
		for cell in row: text += cell.glyph
		result.append(text)
	return result
