extends RefCounted
var owner: WeakRef
var grid: RefCounted:
	get: return owner.get_ref()
	set(value): owner = weakref(value)
var escape := ""
var utf8 := PackedByteArray()
var string_sequence := false

func reset() -> void:
	escape = ""
	utf8.clear()
	string_sequence = false

func feed(bytes: PackedByteArray) -> void:
	utf8.append_array(bytes)
	var index := 0
	while index < utf8.size():
		var first := utf8[index]
		var length := 1 if first < 128 else 2 if first >= 0xc2 and first <= 0xdf else 3 if first >= 0xe0 and first <= 0xef else 4 if first >= 0xf0 and first <= 0xf4 else 1
		if index + length > utf8.size(): break
		var valid := true
		for offset in range(1, length):
			if utf8[index + offset] < 128 or utf8[index + offset] > 191: valid = false
		if not valid:
			character("�")
			index += 1
			continue
		character(utf8.slice(index, index + length).get_string_from_utf8())
		index += length
	utf8 = utf8.slice(index)

func character(value: String) -> void:
	var code := value.unicode_at(0)
	if code >= 0x80 and code <= 0x9f:
		if code == 0x9c:
			if string_sequence: escape = ""; string_sequence = false
			return
		var control: String = {0x84:"D",0x85:"E",0x88:"H",0x8d:"M",0x90:"P",0x98:"X",0x9b:"[",0x9d:"]",0x9e:"^",0x9f:"_"}.get(code, "")
		if not control.is_empty(): character("\u001b"); character(control)
		return
	if code in [0x18, 0x1a]:
		escape = ""
		string_sequence = false
		return
	if not escape.is_empty():
		escape += value
		if string_sequence:
			if code == 7 or escape.ends_with("\u001b\\"):
				escape = ""
				string_sequence = false
		elif escape.begins_with("\u001b["):
			if escape.length() > 2 and code >= 64 and code <= 126:
				grid.commands.csi(escape.substr(2, escape.length() - 3), value)
				escape = ""
		elif escape.length() == 2:
			if value in ["]", "P", "X", "^", "_"]: string_sequence = true
			elif value not in ["[", "(", ")", "*", "+", "#", "%"]:
				esc(value)
				escape = ""
		elif escape.length() == 3:
			if escape[1] in ["(", ")", "*", "+"]: grid.charsets[["(", ")", "*", "+"].find(escape[1])] = value
			elif escape[1] == "#" and value == "8":
				for row in grid.cells:
					for cell in row: cell.glyph = "E"
			escape = ""
		if escape.length() > 4096:
			escape = ""
			string_sequence = false
		return
	if code == 27:
		escape = value
		return
	match value:
		"\r": grid.cursor.x = 0
		"\n", "\u000b", "\u000c": grid.linefeed()
		"\b": grid.cursor.x = maxi(0, mini(grid.cols - 1, grid.cursor.x) - 1)
		"\t": grid.commands.tab()
		"\u000e": grid.charset_index = 1
		"\u000f": grid.charset_index = 0
		_:
			if code >= 32 and code != 127: grid.write(value)

func esc(command: String) -> void:
	match command:
		"7": grid.commands.save()
		"8": grid.commands.restore()
		"D": grid.linefeed()
		"E": grid.cursor.x = 0; grid.linefeed()
		"M":
			if grid.cursor.y == grid.scroll_top: grid.scroll(-1)
			else: grid.cursor.y = maxi(0, grid.cursor.y - 1)
		"H": grid.tabs[grid.cursor.x] = true
		"c": grid.reset()
