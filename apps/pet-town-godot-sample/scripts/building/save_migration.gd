extends RefCounted
## Verify the previous preview's immutable source cells before widening its save.

static func matches(signature: String, store: RefCounted, spawn: Dictionary) -> bool:
	var parts := signature.split(":")
	if parts.size() != 4 or not parts[0].is_valid_int() or not parts[1].is_valid_int():
		return false
	var width := int(parts[0])
	var depth := int(parts[1])
	if width <= 0 or depth <= 0 or width >= store.width or depth >= store.depth or int(parts[2]) != store.height:
		return false
	var center := Vector2i(floori(float(spawn.x) / 16) * 16, floori(float(spawn.z) / 16) * 16)
	var start := center - Vector2i(width / 2, depth / 2)
	if not store.contains(Vector3i(start.x, 0, start.y)) or not store.contains(Vector3i(start.x + width - 1, 0, start.y + depth - 1)):
		return false
	var bytes := PackedByteArray()
	bytes.resize(width * depth * store.height)
	for z in depth:
		for x in width:
			var source: int = store.offset(Vector3i(start.x + x, 0, start.y + z))
			var destination: int = (z * width + x) * store.height
			for y in store.height:
				bytes[destination + y] = store.original[source + y]
	var hash := HashingContext.new()
	hash.start(HashingContext.HASH_SHA256)
	hash.update(bytes)
	return hash.finish().hex_encode() == parts[3]

static func preserve(path: String) -> Error:
	var backup := path + ".region-backup"
	if FileAccess.file_exists(backup):
		return OK
	return DirAccess.copy_absolute(ProjectSettings.globalize_path(path), ProjectSettings.globalize_path(backup))
