extends StaticBody3D
## Collision at navigation edges contains contact momentum without moving the island.
func setup(arena: Node3D) -> void:
	collision_layer = 8
	collision_mask = 0
	var material := StandardMaterial3D.new()
	material.albedo_color = Color("ead7a6")
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	var transforms: Array[Transform3D] = []
	for cell in arena.cells:
		var id: int = arena.cells[cell]
		if not arena.graph.has_point(id): continue
		for direction in [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1)]:
			var other: int = arena.cells.get(cell + direction, -1)
			if other >= 0 and arena.graph.has_point(other) and arena.graph.are_points_connected(id, other): continue
			var p: Vector3 = arena.graph.get_point_position(id)
			p += Vector3(direction.x, 0, direction.y) * arena.CELL * 0.5
			var shape := BoxShape3D.new()
			shape.size = Vector3(0.12, 4, arena.CELL + 0.12) if direction.x else Vector3(arena.CELL + 0.12, 4, 0.12)
			var collider := CollisionShape3D.new()
			collider.shape = shape
			collider.position = p + Vector3.UP * 2
			add_child(collider)
			# Scenery already explains internal obstacles; mark only the arena's rim.
			if Vector2(p.x - arena.CENTER.x, p.z - arena.CENTER.z).length() > arena.RADIUS - 3:
				transforms.append(Transform3D(Basis.IDENTITY.scaled(Vector3(shape.size.x, 0.025, shape.size.z)), p + Vector3.UP * 0.025))
	var lines := MultiMeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = Vector3.ONE
	mesh.material = material
	lines.multimesh = MultiMesh.new()
	lines.multimesh.transform_format = MultiMesh.TRANSFORM_3D
	lines.multimesh.mesh = mesh
	lines.multimesh.instance_count = transforms.size()
	for i in transforms.size(): lines.multimesh.set_instance_transform(i, transforms[i])
	add_child(lines)
