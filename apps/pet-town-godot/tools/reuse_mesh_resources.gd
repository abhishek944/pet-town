class_name ReuseMeshResources
extends RefCounted

## Keep every editable node and transform, but store identical ArrayMeshes once.
static func canonicalize(scene_root: Node) -> int:
	var buckets := {}
	var reused := 0
	for candidate in scene_root.find_children("*", "MeshInstance3D", true, false):
		var node := candidate as MeshInstance3D
		var mesh := node.mesh as ArrayMesh
		if mesh == null or mesh.resource_local_to_scene or mesh.get_blend_shape_count() > 0:
			continue
		var signature := _signature(mesh)
		var key := hash(signature)
		if not buckets.has(key):
			buckets[key] = []
		var matched := false
		for entry in buckets[key]:
			if entry["signature"] == signature:
				node.mesh = entry["mesh"]
				reused += 1
				matched = true
				break
		if not matched:
			buckets[key].append({"signature": signature, "mesh": mesh})
	return reused

static func _signature(mesh: ArrayMesh) -> Array:
	var result := [mesh.get_surface_count(), mesh.custom_aabb]
	for surface in mesh.get_surface_count():
		var material := mesh.surface_get_material(surface)
		result.append(mesh.surface_get_format(surface))
		result.append(mesh.surface_get_arrays(surface))
		result.append(material.get_instance_id() if material != null else 0)
	return result
