extends RefCounted
## Imported source records seed native storage once; unreadable records stay intact.
var error := ""
var available := true
var path := ""
var state: Dictionary = {}

func setup(filename: String, initial: Variant, fallback: Dictionary) -> void:
	path="user://"+filename
	state=fallback.duplicate(true)
	var record: Variant=initial
	if FileAccess.file_exists(path):
		var parser:=JSON.new()
		var parsed: Error=parser.parse(FileAccess.get_file_as_string(path))
		record=parser.data if parsed==OK else null
		if parsed!=OK:
			available=false
			error="The saved ocean record could not be read and has been kept."
			return
	if record==null: return
	if not record is Dictionary or record.get("v",0)!=1:
		available=false
		error="The saved ocean record could not be read and has been kept."
		return
	if fallback.has("stamps"):
		if not record.get("stamps") is Array:
			available=false
		else: state={"v":1,"stamps":record.stamps.duplicate()}
	else:
		for key in ["x","z","yaw"]:
			if not record.get(key) is float and not record.get(key) is int:
				available=false
			elif not is_finite(float(record[key])): available=false
		if available: state=record.duplicate(true)
	if not available: error="The saved ocean record could not be read and has been kept."

func save(next: Dictionary) -> bool:
	if not available: return false
	var file:=FileAccess.open(path+".pending",FileAccess.WRITE)
	if not file:
		error="Ocean progress could not be saved. Check storage; you can still explore freely."
		return false
	file.store_string(JSON.stringify(next))
	file.flush()
	if file.get_error()!=OK:
		file.close()
		error="Ocean progress could not be saved. Check storage; you can still explore freely."
		return false
	file.close()
	if DirAccess.rename_absolute(path+".pending",path)!=OK:
		error="Ocean progress could not be saved. Check storage; you can still explore freely."
		return false
	state=next.duplicate(true)
	error=""
	return true
