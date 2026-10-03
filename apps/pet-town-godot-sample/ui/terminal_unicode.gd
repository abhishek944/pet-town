extends RefCounted
## Match the original xterm.js Unicode6 provider, including its combining rules.
var data: Dictionary = JSON.parse_string(FileAccess.get_file_as_string("res://ui/terminal-unicode-data.json"))

func width(code: int) -> int:
	if code < 32 or (code >= 127 and code < 160): return 0
	if code < 127: return 1
	if contains(data.combining, code): return 0
	if code == 0x303f: return 1
	return 2 if contains(data.wide, code) else 1

func contains(ranges: Array, code: int) -> bool:
	var low := 0
	var high := ranges.size() - 1
	while low <= high:
		var mid := (low + high) / 2
		if code < int(ranges[mid][0]): high = mid - 1
		elif code > int(ranges[mid][1]): low = mid + 1
		else: return true
	return false
