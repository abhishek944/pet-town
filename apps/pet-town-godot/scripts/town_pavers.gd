extends Node3D

const USER_TREE_SCENE := preload("res://scenes/user_tree.tscn")
const CELL_SIZE := 1.5

var editor: Node3D
var stones: Array[Dictionary] = []
var cells: Dictionary = {}
var batches: Array[MultiMeshInstance3D] = []
var converted: Dictionary = {}

func configure(details: Node3D, town_editor: Node3D) -> void:
	editor = town_editor
	name = "EditablePavers"
	for candidate in details.get_children():
		var source := candidate as MeshInstance3D
		if source == null or not String(source.name).begins_with("Garden detail paver"):
			continue
		_add_batch(source)
		source.queue_free()
	_restore_saved_stones()
	_ensure_catalog_samples()

func _add_batch(source: MeshInstance3D) -> void:
	var material := source.get_active_material(0)
	var arrays := source.mesh.surface_get_arrays(0)
	var vertices: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
	# Blender exported each authored box as 24 consecutive vertices.
	assert(vertices.size() % 24 == 0, "Paver source is no longer a collection of boxes: " + source.name)
	var cube := BoxMesh.new()
	cube.size = Vector3.ONE
	cube.material = material
	var multi := MultiMesh.new()
	multi.transform_format = MultiMesh.TRANSFORM_3D
	multi.mesh = cube
	multi.instance_count = vertices.size() / 24
	var batch := MultiMeshInstance3D.new()
	batch.name = "Pavers_%03d" % batches.size()
	batch.multimesh = multi
	add_child(batch)
	batch.global_transform = Transform3D.IDENTITY
	var batch_index := batches.size()
	batches.append(batch)
	for local_index in multi.instance_count:
		var bounds := AABB()
		for offset in 24:
			var point := source.global_transform * vertices[local_index * 24 + offset]
			if offset == 0:
				bounds = AABB(point, Vector3.ZERO)
			else:
				bounds = bounds.expand(point)
		var center := bounds.get_center()
		var size := bounds.size
		multi.set_instance_transform(local_index, Transform3D(Basis().scaled(size), center))
		var id := "paver:%s:%d" % [source.name, local_index]
		var index := stones.size()
		stones.append({"id": id, "bounds": bounds, "batch": batch_index, "instance": local_index, "material": material})
		var cell := _cell(center)
		if not cells.has(cell):
			cells[cell] = []
		cells[cell].append(index)

func pick(world_position: Vector3) -> UserTree:
	var base := _cell(world_position)
	var closest := -1
	var best := INF
	for dx in range(-1, 2):
		for dz in range(-1, 2):
			for index in cells.get(base + Vector2i(dx, dz), []):
				var stone: Dictionary = stones[index]
				if converted.has(stone["id"]):
					continue
				var bounds: AABB = stone["bounds"]
				if world_position.x < bounds.position.x - 0.025 or world_position.x > bounds.end.x + 0.025:
					continue
				if world_position.z < bounds.position.z - 0.025 or world_position.z > bounds.end.z + 0.025:
					continue
				var distance := Vector2(world_position.x - bounds.get_center().x, world_position.z - bounds.get_center().z).length_squared()
				if distance < best:
					closest = index
					best = distance
	return _ensure_proxy(closest) if closest >= 0 else null

func _ensure_proxy(index: int) -> UserTree:
	var stone: Dictionary = stones[index]
	var id: String = stone["id"]
	if converted.has(id):
		return converted[id] as UserTree
	var batch := batches[int(stone["batch"])]
	batch.multimesh.set_instance_transform(int(stone["instance"]), Transform3D(Basis().scaled(Vector3.ONE * 0.00001), Vector3.ZERO))
	var bounds: AABB = stone["bounds"]
	var proxy := USER_TREE_SCENE.instantiate() as UserTree
	proxy.name = "EditablePaver_%d" % index
	proxy.tree_id = id
	proxy.is_authored = true
	for child in proxy.get_children():
		if child.name in ["SelectionMarker", "PickArea"]:
			continue
		proxy.remove_child(child)
		child.free()
	var model := Node3D.new()
	model.name = "AuthoredModel"
	proxy.add_child(model)
	var box := MeshInstance3D.new()
	box.name = "Stone"
	var mesh := BoxMesh.new()
	mesh.size = bounds.size
	mesh.material = stone["material"]
	box.mesh = mesh
	box.position.y = bounds.size.y * 0.5
	model.add_child(box)
	editor.add_child(proxy)
	proxy.global_position = bounds.position + Vector3(bounds.size.x * 0.5, 0.0, bounds.size.z * 0.5)
	proxy.fit_pick_area_to_visuals()
	converted[id] = proxy
	editor.call("register_paver_proxy", proxy)
	return proxy

func _restore_saved_stones() -> void:
	var layout_path: String = editor.call("_town_layout_path")
	if not FileAccess.file_exists(layout_path):
		return
	var file := FileAccess.open(layout_path, FileAccess.READ)
	var parsed = JSON.parse_string(file.get_as_text()) if file != null else null
	if not parsed is Dictionary:
		return
	var by_id := {}
	for index in stones.size():
		by_id[stones[index]["id"]] = index
	for record in parsed.get("trees", []):
		if record is Dictionary and by_id.has(record.get("id")):
			_ensure_proxy(int(by_id[record["id"]]))

func _ensure_catalog_samples() -> void:
	var found := {}
	for index in stones.size():
		var material := stones[index]["material"] as Material
		var kind := "light" if "light" in material.resource_name.to_lower() else "regular"
		if not found.has(kind):
			_ensure_proxy(index)
			found[kind] = true
		if found.size() == 2:
			return

func _cell(position: Vector3) -> Vector2i:
	return Vector2i(floori(position.x / CELL_SIZE), floori(position.z / CELL_SIZE))
