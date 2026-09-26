extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var catalog := WorkshopCatalog.new()
	var errors: Array[String] = []
	if not catalog.load_all():
		errors.append("catalog could not load")
	else:
		if catalog.items.size() < 48:
			errors.append("legacy catalog items are missing")
		for item in catalog.items:
			var item_id := String(item["id"])
			var model := catalog.instantiate_model(item_id)
			if model == null:
				errors.append("could not instantiate " + item_id)
				continue
			root.add_child(model)
			var box := _bounds(model)
			if absf(box.position.y) > 0.04:
				errors.append(item_id + " pivot is above ground")
			if absf(box.get_center().x) > 0.05 or absf(box.get_center().z) > 0.05:
				errors.append(item_id + " footprint is off center")
			if absf(box.size.x - float(item["width"])) > 0.05 or absf(box.size.z - float(item["depth"])) > 0.05:
				errors.append(item_id + " footprint differs from catalog")
			if absf(box.size.y - float(item["height"])) > 0.05:
				errors.append(item_id + " height differs from catalog")
			model.free()
	print("CATALOG_ASSETS_SMOKE assets=", catalog.items.size(), " errors=", errors)
	quit(0 if errors.is_empty() else 1)

func _bounds(model: Node3D) -> AABB:
	var result := AABB()
	var first := true
	for candidate in model.find_children("*", "MeshInstance3D", true, false):
		var mesh := candidate as MeshInstance3D
		if mesh.mesh == null:
			continue
		var piece: AABB = (model.global_transform.affine_inverse() * mesh.global_transform) * mesh.get_aabb()
		result = piece if first else result.merge(piece)
		first = false
	return result
