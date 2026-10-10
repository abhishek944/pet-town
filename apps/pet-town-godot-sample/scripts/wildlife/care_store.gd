extends RefCounted
## Care owns its file; unreadable or newer records are never overwritten.
const PATH := "user://wildlife-care.json"
var writable := true
var error := ""

func read() -> Dictionary:
	if not FileAccess.file_exists(PATH): return {}
	var file := FileAccess.open(PATH, FileAccess.READ)
	if file == null: return fail("Wildlife happiness could not be read. The saved file has been kept.")
	var parsed = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary or parsed.get("version") != 1 or not parsed.get("species") is Dictionary:
		return fail("Wildlife happiness could not be read. The saved file has been kept.")
	if not number(parsed.get("reminderCooldown", 0)):
		return fail("Wildlife reminder progress could not be read. The saved file has been kept.")
	for record in parsed.species.values():
		if not record is Dictionary or not number(record.get("happiness", 80)) or not number(record.get("seconds", 0)) or not record.get("reminded", false) is bool:
			return fail("Wildlife happiness could not be read. The saved file has been kept.")
	return parsed

func fail(message: String) -> Dictionary:
	writable = false
	error = message
	return {}

static func number(value: Variant) -> bool:
	return (value is float or value is int) and is_finite(float(value))

func write(records: Dictionary, cooldown: float) -> bool:
	if not writable: return false
	var temporary := PATH + ".tmp"
	var file := FileAccess.open(temporary, FileAccess.WRITE)
	if file == null: return false
	file.store_string(JSON.stringify({"version": 1, "species": records, "reminderCooldown": cooldown}))
	file.flush()
	var success := file.get_error() == OK
	file.close()
	if not success: return false
	return DirAccess.rename_absolute(ProjectSettings.globalize_path(temporary), ProjectSettings.globalize_path(PATH)) == OK
