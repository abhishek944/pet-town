extends RefCounted
## Immutable derived data. Source content hashes and a format version own invalidation.
const VERSION := "v2-"
const BAKED := "res://assets/native-prepared"
const LOCAL := "user://native-prepared"
static var baking := false
static var hashes := {}
static var used := {}
static func fingerprint(file: String) -> String:
	if not hashes.has(file): hashes[file]=FileAccess.get_sha256("res://assets/"+file)
	return hashes[file]
static func key(file: String, kind: String, extra := "") -> String:
	return VERSION+kind+"-"+(fingerprint(file)+extra).sha256_text()
static func read_data(id: String) -> Dictionary:
	used[id+".bin"]=true
	for directory in [BAKED,LOCAL]:
		var path: String = directory+"/"+id+".bin"
		if not FileAccess.file_exists(path): continue
		var file := FileAccess.open_compressed(path,FileAccess.READ,FileAccess.COMPRESSION_ZSTD)
		if not file: continue
		var value = file.get_var(false)
		if value is Dictionary:
			if baking and directory==LOCAL: write_data(id,value)
			return value
	return {}
static func write_data(id: String, value: Dictionary) -> void:
	used[id+".bin"]=true
	var directory := BAKED if baking else LOCAL
	DirAccess.make_dir_recursive_absolute(directory)
	var path := directory+"/"+id+".bin"
	var file := FileAccess.open_compressed(path+".tmp",FileAccess.WRITE,FileAccess.COMPRESSION_ZSTD)
	if not file: return
	file.store_var(value,false)
	file.flush()
	var error := file.get_error()
	file.close()
	if error == OK: DirAccess.rename_absolute(path+".tmp",path)
static func read_resource(id: String) -> Resource:
	used[id+".res"]=true
	for directory in [BAKED,LOCAL]:
		var path: String = directory+"/"+id+".res"
		if ResourceLoader.exists(path):
			var value := load(path)
			if baking and directory==LOCAL and value: write_resource(id,value)
			return value
	return null
static func write_resource(id: String, value: Resource) -> void:
	used[id+".res"]=true
	var directory := BAKED if baking else LOCAL
	DirAccess.make_dir_recursive_absolute(directory)
	ResourceSaver.save(value,directory+"/"+id+".res",ResourceSaver.FLAG_COMPRESS)
static func collision(file: String, mesh: Mesh) -> Shape3D:
	var id := key(file,"collision")
	var cached := read_resource(id)
	if cached is Shape3D: return cached
	var shape := mesh.create_trimesh_shape()
	write_resource(id,shape)
	return shape

static func prune_baked() -> void:
	for file in DirAccess.get_files_at(BAKED):
		if (file.ends_with(".bin") or file.ends_with(".res")) and not used.has(file):
			DirAccess.remove_absolute(BAKED+"/"+file)

static func validate_baked() -> bool:
	for file in used:
		if not FileAccess.file_exists(BAKED+"/"+file):
			push_error("Prepared native resource missing: "+file)
			return false
	return true
