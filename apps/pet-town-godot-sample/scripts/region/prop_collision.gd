extends RefCounted
## Cache only immutable local geometry; props retain their live materials/controllers.
const Cache = preload("native_cache.gd")
const INDEX := "prop-collision-index-v1"
static var packed_ids: Dictionary = {}
static var index_loaded := false
static var bake_ids: Dictionary = {}
static func key(file: String) -> String:
	if FileAccess.file_exists("res://assets/"+file): return Cache.key(file,"prop-collision-v1")
	# Imported GLB sources are stripped from packs; retain their build-time keys.
	if not index_loaded:
		packed_ids = Cache.read_data(INDEX)
		index_loaded = true
	return str(packed_ids.get(file,""))

static func finish_bake() -> void:
	Cache.write_data(INDEX,bake_ids)

static func shape(file: String, root: Node3D) -> ConcavePolygonShape3D:
	# Bump the derivation version when local-face extraction or backface policy changes.
	var id := key(file)
	if Cache.baking and not id.is_empty(): bake_ids[file] = id
	var cached := Cache.read_resource(id) if not id.is_empty() else null
	if cached is ConcavePolygonShape3D: return cached
	var faces := collect_faces(root,root.global_transform.affine_inverse())
	if faces.is_empty(): return null
	var result := ConcavePolygonShape3D.new()
	result.set_faces(faces)
	result.backface_collision = true
	if not id.is_empty(): Cache.write_resource(id,result)
	return result

static func collect_faces(node: Node, to_root: Transform3D) -> PackedVector3Array:
	var faces := PackedVector3Array()
	if node is MeshInstance3D and node.mesh:
		faces.append_array((to_root*node.global_transform)*node.mesh.get_faces())
	for child in node.get_children(): faces.append_array(collect_faces(child,to_root))
	return faces
