extends RefCounted
const FG := Color("e4ebdc")
const BG := Color(0, 0, 0, 0)
const ANSI := ["2e3436","cc0000","bdebb1","eddaa0","3465a4","d6c6ed","06989a","d3d7cf","555753","ef2929","8ae234","fce94f","729fcf","ad7fa8","34e2e2","eeeeec"]

static func defaults() -> Dictionary:
	return {"fg":FG,"fg_index":-1,"bg":BG,"bold":false,"italic":false,"dim":false,"underline":0,"strike":false,"overline":false,"inverse":false,"invisible":false,"blink":false}

static func apply(parameters: String, current: Dictionary) -> Dictionary:
	var values := PackedStringArray()
	for parameter in parameters.split(";"):
		if parameter.begins_with("4:"):
			values.append(parameter)
		else:
			var parts := parameter.split(":")
			if parts.size() >= 6 and int(parts[0]) in [38,48,58] and int(parts[1]) == 2: parts.remove_at(2)
			values.append_array(parts)
	var index := 0
	while index < values.size():
		if values[index].begins_with("4:"):
			current.underline = clampi(int(values[index].substr(2)), 0, 5)
			index += 1
			continue
		var code := int(values[index])
		match code:
			0: current = defaults()
			1: current.bold = true
			2: current.dim = true
			3: current.italic = true
			4: current.underline = 1
			5, 6: current.blink = true
			7: current.inverse = true
			8: current.invisible = true
			9: current.strike = true
			21: current.underline = 2
			22: current.bold = false; current.dim = false
			23: current.italic = false
			24: current.underline = 0
			25: current.blink = false
			27: current.inverse = false
			28: current.invisible = false
			29: current.strike = false
			39: current.fg = FG; current.fg_index = -1
			49: current.bg = BG
			53: current.overline = true
			55: current.overline = false
			59: current.erase("underline_color")
			_:
				if code >= 30 and code <= 37: current.fg = Color(ANSI[code - 30]); current.fg_index = code - 30
				elif code >= 40 and code <= 47: current.bg = Color(ANSI[code - 40])
				elif code >= 90 and code <= 97: current.fg = Color(ANSI[code - 90 + 8]); current.fg_index = code - 90 + 8
				elif code >= 100 and code <= 107: current.bg = Color(ANSI[code - 100 + 8])
				elif code in [38, 48, 58] and index + 2 < values.size():
					var color := FG
					var mode := int(values[index + 1])
					if mode == 5:
						color = indexed(clampi(int(values[index + 2]), 0, 255))
						index += 2
					elif mode == 2 and index + 4 < values.size():
						var offset := 3 if values[index + 2].is_empty() and index + 5 < values.size() else 2
						color = Color8(clampi(int(values[index + offset]),0,255), clampi(int(values[index + offset + 1]),0,255), clampi(int(values[index + offset + 2]),0,255))
						index += offset + 2
					else:
						index += 1
						continue
					current["fg" if code == 38 else "bg" if code == 48 else "underline_color"] = color
					if code == 38: current.fg_index = int(values[index]) if mode == 5 else -1
		index += 1
	return current

static func indexed(index: int) -> Color:
	if index < 16: return Color(ANSI[index])
	if index >= 232:
		var gray := 8 + (index - 232) * 10
		return Color8(gray, gray, gray)
	var cube := index - 16
	var components := [0,95,135,175,215,255]
	return Color8(components[cube / 36], components[(cube / 6) % 6], components[cube % 6])
