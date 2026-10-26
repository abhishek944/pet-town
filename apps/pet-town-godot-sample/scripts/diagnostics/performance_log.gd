extends RefCounted
## Technical-only flight-recorder sink. Two files, at most 2 MiB each.
const CURRENT := "user://diagnostics/native-performance.jsonl"
const PREVIOUS := "user://diagnostics/native-performance.previous.jsonl"
const MAX_BYTES := 2 * 1024 * 1024
var file: FileAccess
var failed := false
var session_id := "%s-%s" % [Time.get_unix_time_from_system(), OS.get_process_id()]

func open() -> bool:
	var error := DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(CURRENT.get_base_dir()))
	if error != OK: return fail(error)
	return rotate()

func rotate() -> bool:
	if file:
		file.close()
		file = null
	if FileAccess.file_exists(PREVIOUS):
		var error := DirAccess.remove_absolute(ProjectSettings.globalize_path(PREVIOUS))
		if error != OK: return fail(error)
	if FileAccess.file_exists(CURRENT):
		var error := DirAccess.rename_absolute(ProjectSettings.globalize_path(CURRENT), ProjectSettings.globalize_path(PREVIOUS))
		if error != OK: return fail(error)
	file = FileAccess.open(CURRENT, FileAccess.WRITE)
	if not file: return fail(FileAccess.get_open_error())
	return true

func write(event: String, level: String, fields: Dictionary) -> bool:
	if failed or not file: return false
	var row := fields.duplicate()
	row.merge({"schema_version": 1, "timestamp": Time.get_datetime_string_from_system(true) + "Z", "session_id": session_id, "event": event, "level": level})
	var line := JSON.stringify(row) + "\n"
	var bytes := line.to_utf8_buffer()
	if file.get_position() + bytes.size() > MAX_BYTES and not rotate(): return false
	file.store_buffer(bytes)
	# One low-frequency flush, never a per-frame write or GPU readback.
	file.flush()
	if file.get_error() != OK: return fail(file.get_error())
	return true

func close() -> void:
	if file:
		file.close()
		file = null

func fail(error: int) -> bool:
	if not failed:
		push_warning("Native performance recording disabled after log I/O error (%s)." % error)
	failed = true
	close()
	return false
