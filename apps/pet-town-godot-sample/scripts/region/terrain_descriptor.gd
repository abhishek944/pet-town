extends RefCounted
## Prepared transforms avoid parsing chunk vertex payloads during every opening.
const Cache = preload("native_cache.gd")
static func transform(file: String) -> Transform3D:
	var id := Cache.key(file,"terrain-transform-v1")
	var cached := Cache.read_data(id)
	if cached.get("transform") is Transform3D: return cached.transform
	var result := preload("buffers.gd").transform(preload("buffers.gd").read_json(file).matrix)
	Cache.write_data(id,{"transform":result})
	return result
