extends RefCounted

static func read(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {"value": {}}
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return {"error": "Saved town progress could not be read. The file has been kept."}
	var parsed = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary:
		return {"error": "Saved town progress is unreadable. The file has been kept."}
	return {"value": parsed}

static func write(path: String, value: Dictionary) -> bool:
	var temporary := path + ".tmp"
	var file := FileAccess.open(temporary, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(value))
	file.flush()
	file.close()
	return DirAccess.rename_absolute(ProjectSettings.globalize_path(temporary), ProjectSettings.globalize_path(path)) == OK
