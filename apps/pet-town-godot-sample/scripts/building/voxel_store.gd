extends RefCounted
const Buffers = preload("../region/buffers.gd")
const SAVE_PATH = "user://region-voxel-edits-v1.json"
const GLASS = 19
var bounds: Dictionary
var width: int
var depth: int
var height: int
var original: PackedByteArray
var cells: PackedByteArray
var edits: Dictionary = {}
var definitions: Array
var palette := [1,2,12,4,11,13,14,GLASS,15,16,17,18]
var signature := ""
var save_path := SAVE_PATH
var spawn := {}
var migrated := false
var write_blocked := false
var load_error := ""
var preserved_path := ""

func setup(manifest: Dictionary) -> void:
	spawn = manifest.spawn
	var data := Buffers.read_json(manifest.voxels.file)
	bounds=data.bounds
	width=int(data.width)
	depth=int(data.depth)
	height=int(data.height)
	original=Marshalls.base64_to_raw(data.cells.base64)
	cells=original.duplicate()
	definitions=manifest.voxels.definitions.duplicate(true)
	definitions.append({"id":GLASS,"name":"Glass","transparent":true,"top":9,"side":9,"bottom":9})
	var hasher:=HashingContext.new()
	hasher.start(HashingContext.HASH_SHA256)
	hasher.update(original)
	signature="%s:%s:%s:%s" % [width,depth,height,hasher.finish().hex_encode()]

func contains(cell: Vector3i) -> bool:
	return cell.x>=bounds.minX and cell.x<bounds.maxX and cell.z>=bounds.minZ and cell.z<bounds.maxZ and cell.y>=0 and cell.y<height

func offset(cell: Vector3i) -> int:
	return ((cell.z-int(bounds.minZ))*width+cell.x-int(bounds.minX))*height+cell.y

func get_id(cell: Vector3i, source := false) -> int:
	if not contains(cell): return 0
	return int(original[offset(cell)] if source else cells[offset(cell)])

func set_id(cell: Vector3i, id: int) -> void:
	cells[offset(cell)]=id
	if id==get_id(cell,true): edits.erase(cell)
	else: edits[cell]=id

func top_y(x: int,z: int) -> int:
	for y in range(height-1,-1,-1):
		if get_id(Vector3i(x,y,z))>0: return y+1
	return 0

func water_ground_y(x: int,z: int,water_level: float) -> int:
	for y in range(mini(height-1,floori(water_level)),-1,-1):
		if get_id(Vector3i(x,y,z))>0: return y+1
	return 0

func palette_index(id: int) -> int:
	if id==3: return 2
	return palette.find(id)

func save() -> Error:
	if write_blocked: return ERR_FILE_CORRUPT
	if migrated:
		var backup_error: Error = preload("save_migration.gd").preserve(save_path)
		if backup_error != OK: return backup_error
	var rows: Array=[]
	for cell in edits: rows.append([cell.x,cell.y,cell.z,edits[cell]])
	var temporary:=save_path+".tmp"
	var file:=FileAccess.open(temporary,FileAccess.WRITE)
	if not file: return FileAccess.get_open_error()
	file.store_string(JSON.stringify({"version":1,"source":signature,"edits":rows}))
	file.flush()
	var error:=file.get_error()
	file.close()
	if error==OK: error=DirAccess.rename_absolute(ProjectSettings.globalize_path(temporary),ProjectSettings.globalize_path(save_path))
	if error!=OK: DirAccess.remove_absolute(ProjectSettings.globalize_path(temporary))
	return error

func load_edits() -> Array[Vector3i]:
	var changed: Array[Vector3i]=[]
	if not FileAccess.file_exists(save_path): return changed
	var file := FileAccess.open(save_path, FileAccess.READ)
	if file == null: return reject_save("Saved builds could not be read.")
	var parser := JSON.new()
	if parser.parse(file.get_as_text()) != OK: return reject_save("Saved builds are unreadable.")
	var data = parser.data
	if not data is Dictionary or data.get("version") != 1 or not data.get("source") is String or not data.get("edits") is Array:
		return reject_save("Saved builds are unreadable.")
	if data.source != signature:
		if not preload("save_migration.gd").matches(data.source, self, spawn):
			return reject_save("Saved builds belong to a different island export.")
		migrated = true
	var seen := {}
	for row in data.edits:
		if not valid_row(row): return reject_save("Saved builds contain an invalid block record.")
		var cell := Vector3i(int(row[0]), int(row[1]), int(row[2]))
		if seen.has(cell): return reject_save("Saved builds contain duplicate block records.")
		seen[cell] = true
	# Apply only after the entire record has passed validation.
	for row in data.edits:
		var cell := Vector3i(int(row[0]), int(row[1]), int(row[2]))
		set_id(cell, int(row[3]))
		changed.append(cell)
	return changed

func valid_row(row: Variant) -> bool:
	if not row is Array or row.size() != 4: return false
	for number in row:
		if not (number is int or number is float) or not is_finite(float(number)) or float(number) != floorf(float(number)) or absf(float(number)) > 1000000: return false
	var cell := Vector3i(int(row[0]), int(row[1]), int(row[2]))
	return contains(cell) and cell.y > 0 and row[3] >= 0 and row[3] < definitions.size()

func reject_save(reason: String) -> Array[Vector3i]:
	write_blocked = true
	load_error = reason + " The original file has been kept. Building is paused; Reset world will first preserve a separate backup."
	return []

func save_confirmed_reset(snapshot: RefCounted) -> Error:
	if write_blocked and FileAccess.file_exists(save_path):
		var backup := save_path + ".preserved-" + str(int(Time.get_unix_time_from_system())) + "-" + str(Time.get_ticks_usec())
		while FileAccess.file_exists(backup): backup += "-copy"
		var error := DirAccess.copy_absolute(ProjectSettings.globalize_path(save_path), ProjectSettings.globalize_path(backup))
		if error != OK: return error
		preserved_path = backup
	var error: Error = snapshot.save()
	if error == OK:
		write_blocked = false
		load_error = ""
	return error
