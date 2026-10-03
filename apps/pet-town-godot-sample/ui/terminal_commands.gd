extends RefCounted
const Attributes = preload("res://ui/terminal_attributes.gd")
var owner: WeakRef
var grid: RefCounted:
	get: return owner.get_ref()
	set(value): owner = weakref(value)

func csi(parameters: String, command: String) -> void:
	var private_mode := parameters.begins_with("?")
	var text := parameters.trim_prefix("?").trim_prefix(">").trim_suffix(" ")
	var values := text.split(";")
	var value := int(values[0]) if not values.is_empty() else 0
	var amount := maxi(1, value)
	var cursor: Vector2i = grid.cursor
	match command:
		"m": grid.style = Attributes.apply(text, grid.style)
		"q":
			if parameters.ends_with(" "): grid.cursor_style = clampi(value, 0, 6)
		"H", "f":
			grid.cursor.y = clampi(amount - 1 + (grid.scroll_top if grid.origin_mode else 0), grid.scroll_top if grid.origin_mode else 0, grid.scroll_bottom if grid.origin_mode else grid.rows - 1)
			grid.cursor.x = clampi(maxi(1, int(values[1])) - 1, 0, grid.cols - 1) if values.size() > 1 else 0
		"A": grid.cursor.y = maxi(grid.scroll_top if grid.origin_mode else 0, cursor.y - amount)
		"B", "e": grid.cursor.y = mini(grid.scroll_bottom if grid.origin_mode else grid.rows - 1, cursor.y + amount)
		"C", "a": grid.cursor.x = mini(grid.cols - 1, cursor.x + amount)
		"D": grid.cursor.x = maxi(0, cursor.x - amount)
		"E": grid.cursor = Vector2i(0, mini(grid.rows - 1, cursor.y + amount))
		"F": grid.cursor = Vector2i(0, maxi(0, cursor.y - amount))
		"G", "`": grid.cursor.x = clampi(amount - 1, 0, grid.cols - 1)
		"d": grid.cursor.y = clampi(amount - 1, 0, grid.rows - 1)
		"I", "Z":
			for index in range(amount): tab(command == "Z")
		"J":
			if value in [2, 3]:
				for line in range(grid.rows): grid.erase(line, 0, grid.cols)
			elif value == 0:
				grid.erase(cursor.y, cursor.x, grid.cols)
				for line in range(cursor.y + 1, grid.rows): grid.erase(line, 0, grid.cols)
			elif value == 1:
				for line in range(cursor.y): grid.erase(line, 0, grid.cols)
				grid.erase(cursor.y, 0, cursor.x + 1)
		"K": grid.erase(cursor.y, 0 if value in [1, 2] else cursor.x, cursor.x + 1 if value == 1 else grid.cols)
		"X": grid.erase(cursor.y, cursor.x, cursor.x + amount)
		"@":
			for index in range(mini(amount, grid.cols - cursor.x)):
				grid.cells[cursor.y].insert(cursor.x, grid.blank())
				grid.cells[cursor.y].pop_back()
		"P":
			for index in range(mini(amount, grid.cols - cursor.x)):
				grid.cells[cursor.y].remove_at(cursor.x)
				grid.cells[cursor.y].append(grid.blank())
		"L", "M":
			if cursor.y >= grid.scroll_top and cursor.y <= grid.scroll_bottom:
				for index in range(mini(amount, grid.scroll_bottom - cursor.y + 1)):
					grid.cells.remove_at(grid.scroll_bottom if command == "L" else cursor.y)
					grid.cells.insert(cursor.y if command == "L" else grid.scroll_bottom, grid.blank_row())
		"S": grid.scroll(mini(amount, grid.scroll_bottom - grid.scroll_top + 1))
		"T": grid.scroll(-mini(amount, grid.scroll_bottom - grid.scroll_top + 1))
		"r":
			var bottom: int = int(values[1]) - 1 if values.size() > 1 and int(values[1]) > 0 else grid.rows - 1
			if amount - 1 < bottom:
				grid.scroll_top = clampi(amount - 1, 0, grid.rows - 1)
				grid.scroll_bottom = clampi(bottom, 0, grid.rows - 1)
				grid.cursor = Vector2i(0, grid.scroll_top if grid.origin_mode else 0)
		"s": save()
		"u": restore()
		"b":
			for index in range(mini(amount, 4096)): grid.write(grid.previous_glyph)
		"g":
			if value == 3: grid.tabs.clear()
			elif value == 0: grid.tabs.erase(cursor.x)
		"h", "l":
			for mode in values: set_mode(int(mode), command == "h", private_mode)

func set_mode(mode: int, active: bool, private_mode: bool) -> void:
	if not private_mode:
		if mode == 4: grid.insert_mode = active
		return
	match mode:
		6:
			grid.origin_mode = active
			grid.cursor = Vector2i(0, grid.scroll_top if active else 0)
		7: grid.wrap = active
		25: grid.cursor_visible = active
		47, 1047, 1049:
			if active and grid.alternate.is_empty():
				grid.alternate = grid.cells.duplicate(true)
				grid.alternate_cursor = grid.cursor
				grid.cells = []
				for line in range(grid.rows): grid.cells.append(grid.blank_row())
				grid.cursor = Vector2i.ZERO
			elif not active and not grid.alternate.is_empty():
				grid.cells = grid.alternate
				grid.alternate = []
				grid.cursor = grid.alternate_cursor
		1048:
			if active: save()
			else: restore()

func tab(back := false) -> void:
	var point: int = mini(grid.cols - 1, grid.cursor.x)
	var step := -1 if back else 1
	point = clampi(point + step, 0, grid.cols - 1)
	while point > 0 and point < grid.cols - 1 and not grid.tabs.has(point): point += step
	grid.cursor.x = point

func save() -> void:
	grid.saved = grid.cursor
	grid.saved_style = grid.style.duplicate()
	grid.saved_charset = grid.charsets.duplicate()
	grid.saved_charset_index = grid.charset_index

func restore() -> void:
	grid.cursor = Vector2i(clampi(grid.saved.x, 0, grid.cols - 1), clampi(grid.saved.y, 0, grid.rows - 1))
	grid.style = grid.saved_style.duplicate()
	grid.charsets = grid.saved_charset.duplicate()
	grid.charset_index = grid.saved_charset_index

func dec_character(character: String) -> String:
	var mapping := {"`":"◆", "a":"▒", "f":"°", "g":"±", "j":"┘", "k":"┐", "l":"┌", "m":"└", "n":"┼", "o":"⎺", "p":"⎻", "q":"─", "r":"⎼", "s":"⎽", "t":"├", "u":"┤", "v":"┴", "w":"┬", "x":"│", "y":"≤", "z":"≥", "{":"π", "|":"≠", "}":"£", "~":"·"}
	return mapping.get(character, character)
