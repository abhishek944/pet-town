class_name TownSelectionFootprint
extends RefCounted

const GROUND_LAYER := 16
static var fill_material: StandardMaterial3D
static var edge_material: StandardMaterial3D

static func outline(item: UserTree) -> PackedVector2Array:
	if item.tree_id.begins_with("flower:") or item.tree_id.begins_with("surface:") or " detail " in item.tree_id.to_lower():
		return _circle(Vector2(item.selection_ring_position.x, item.selection_ring_position.z), 0.8)
	var bounds := AABB()
	var has_bounds := false
	var meshes: Array[MeshInstance3D] = []
	for candidate in item.find_children("*", "MeshInstance3D", true, false):
		var visual := candidate as MeshInstance3D
		if visual.mesh == null:
			continue
		meshes.append(visual)
		var relative := item.global_transform.affine_inverse() * visual.global_transform
		var piece := relative * visual.get_aabb()
		bounds = piece if not has_bounds else bounds.merge(piece)
		has_bounds = true
	if not has_bounds:
		return _circle(Vector2.ZERO, 0.7)
	var floor_y := bounds.position.y
	var band := maxf(0.22, bounds.size.y * 0.12)
	var points := PackedVector2Array()
	for visual in meshes:
		var relative := item.global_transform.affine_inverse() * visual.global_transform
		var piece := relative * visual.get_aabb()
		if piece.position.y > floor_y + band:
			continue
		for surface in visual.mesh.get_surface_count():
			var vertices: PackedVector3Array = visual.mesh.surface_get_arrays(surface)[Mesh.ARRAY_VERTEX]
			for vertex in vertices:
				var local := relative * vertex
				if local.y <= floor_y + band:
					points.append(Vector2(local.x, local.z))
	if points.size() < 3:
		return _circle(Vector2(bounds.get_center().x, bounds.get_center().z), 0.7)
	var hull := Geometry2D.convex_hull(points)
	if hull.size() < 3:
		return _circle(Vector2(bounds.get_center().x, bounds.get_center().z), 0.7)
	var center := _center(hull)
	if not item.tree_variant.is_empty() or item.tree_id.begins_with("tree-"):
		var radius := 0.0
		for point in hull:
			radius = maxf(radius, point.distance_to(center))
		return _circle(center, clampf(radius + 0.2, 0.65, 1.6))
	var result := PackedVector2Array()
	var margin := 0.22 if maxf(bounds.size.x, bounds.size.z) > 2.0 else 0.12
	for point in hull:
		var direction := (point - center).normalized()
		result.append(point + direction * margin)
	return result

static func marker_mesh(item: UserTree, footprint: PackedVector2Array, center: Vector3) -> ArrayMesh:
	_ensure_materials()
	var positions := PackedVector3Array()
	for point in footprint:
		var world := item.global_transform * Vector3(point.x, item.selection_ground_y, point.y)
		positions.append(_on_ground(item, world) - center)
	var mesh := ArrayMesh.new()
	if positions.size() < 3:
		return mesh
	var middle := Vector3.ZERO
	var fill := PackedVector3Array()
	var edge := PackedVector3Array()
	for index in positions.size():
		var current := positions[index]
		var next := positions[(index + 1) % positions.size()]
		fill.append_array(PackedVector3Array([middle, current, next]))
		var outward := Vector3(current.x - middle.x, 0, current.z - middle.z).normalized() * 0.055
		var outward_next := Vector3(next.x - middle.x, 0, next.z - middle.z).normalized() * 0.055
		edge.append_array(PackedVector3Array([current, next, current + outward, current + outward, next, next + outward_next]))
	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = fill
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	mesh.surface_set_material(0, fill_material)
	arrays[Mesh.ARRAY_VERTEX] = edge
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	mesh.surface_set_material(1, edge_material)
	return mesh

static func marker_center(item: UserTree, footprint: PackedVector2Array) -> Vector3:
	var local := _center(footprint)
	var world := item.global_transform * Vector3(local.x, item.selection_ground_y, local.y)
	return _on_ground(item, world)

static func _on_ground(item: UserTree, world: Vector3) -> Vector3:
	var waterfront := "boat" in item.tree_id.to_lower() or "waterfront" in item.tree_id.to_lower()
	var layer := 8 if waterfront else GROUND_LAYER
	var query := PhysicsRayQueryParameters3D.create(world + Vector3.UP * 40.0, world + Vector3.DOWN * 80.0, layer)
	query.collide_with_areas = false
	var hit := item.get_world_3d().direct_space_state.intersect_ray(query)
	if hit.is_empty() and layer == GROUND_LAYER:
		query.collision_mask = 8
		hit = item.get_world_3d().direct_space_state.intersect_ray(query)
	return Vector3(world.x, hit.position.y + 0.07 if not hit.is_empty() else world.y, world.z)

static func _center(points: PackedVector2Array) -> Vector2:
	var total := Vector2.ZERO
	for point in points:
		total += point
	return total / float(maxi(points.size(), 1))

static func _circle(center: Vector2, radius: float) -> PackedVector2Array:
	var points := PackedVector2Array()
	for index in 32:
		var angle := TAU * float(index) / 32.0
		points.append(center + Vector2(cos(angle), sin(angle)) * radius)
	return points

static func _ensure_materials() -> void:
	if fill_material != null:
		return
	fill_material = StandardMaterial3D.new()
	fill_material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	fill_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	fill_material.cull_mode = BaseMaterial3D.CULL_DISABLED
	fill_material.albedo_color = Color(1.0, 0.78, 0.24, 0.28)
	edge_material = fill_material.duplicate()
	edge_material.albedo_color = Color(1.0, 0.82, 0.3, 1.0)
