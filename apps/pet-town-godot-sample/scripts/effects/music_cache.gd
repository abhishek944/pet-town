extends RefCounted
## PCM is deterministic. Source hashes invalidate development; the pack owns its index.
const Cache = preload("res://scripts/region/native_cache.gd")
const INDEX := "music-index-v1"
const SOURCES := ["res://scripts/effects/native_music.gd","res://scripts/effects/audio_synthesis.gd"]
static var source_id := ""
static func id() -> String:
	if not source_id.is_empty(): return source_id
	# Exported scripts are bytecode. Their build-time source hashes travel in the pack.
	if not OS.has_feature("editor") or not FileAccess.file_exists(SOURCES[0]):
		source_id = str(Cache.read_data(INDEX).get("id",""))
		return source_id
	var signature := ""
	for file in SOURCES: signature += FileAccess.get_sha256(file)
	source_id = Cache.VERSION+"music-v1-"+signature.sha256_text()
	return source_id

static func prepare(bake: Callable, budget: RefCounted = null) -> AudioStreamWAV:
	var key := id()
	if Cache.baking: Cache.write_data(INDEX,{"id":key})
	if not key.is_empty():
		var cached := Cache.read_resource(key)
		if cached is AudioStreamWAV: return cached
	var result: AudioStreamWAV = await budget.background(bake) if budget else bake.call()
	if not key.is_empty(): Cache.write_resource(key,result)
	return result
