extends RefCounted

static func build(manifest: Dictionary, source: Array, budget: RefCounted = null) -> Dictionary:
	var entries := {}
	for prop in manifest.props:
		var origin: Dictionary = prop.get("entry") if prop.get("entry") is Dictionary else {}
		var asset_id = origin.get("assetId")
		if not asset_id is String:
			continue
		var id: String = asset_id
		if id.is_empty() or entries.has(id) or not prop.get("file"):
			continue
		for definition in source:
			if definition.id != id:
				continue
			var item: Dictionary = definition.duplicate(true)
			item.path = "res://assets/" + prop.file
			item.origin = Vector3(prop.x, prop.y, prop.z)
			item.source_angle = float(origin.get("rot", 0))
			item.lights = prop.get("lights", [])
			item.footprint = "%.1f × %.1f m · Includes approach clearance" % [item.hw * 2, item.hd * 2]
			var packed = load(item.path)
			if not packed is PackedScene:
				continue
			var model = packed.instantiate()
			var box := bounds(model)
			item.height = maxf(0.3, box.size.y)
			model.free()
			entries[id] = item
			if budget: await budget.checkpoint()
	return entries

static func bounds(root: Node3D) -> AABB:
	var box := AABB()
	var found := false
	var stack: Array = [[root, root.transform]]
	while not stack.is_empty():
		var item: Array = stack.pop_back()
		var node: Node3D = item[0]
		var transform: Transform3D = item[1]
		if node is MeshInstance3D and node.mesh:
			var mesh_box: AABB = transform * node.get_aabb()
			box = box.merge(mesh_box) if found else mesh_box
			found = true
		for child in node.get_children():
			if child is Node3D:
				stack.append([child, transform * child.transform])
	return box
