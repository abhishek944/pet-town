extends SceneTree
## Offline static batching only. Preserves authored world-space triangles and materials.
## Original nodes remain available for authoring and navigation; runtime only draws saved batches.
func _initialize() -> void:
	call_deferred("build")

func build() -> void:
	var island = load("res://scenes/warm_island.tscn").instantiate()
	root.add_child(island)
	var result = Node3D.new()
	result.name = "IslandRenderSections"
	root.add_child(result)
	var harvest = Node3D.new()
	harvest.name = "HarvestApples"
	result.add_child(harvest)
	harvest.owner = result
	DirAccess.make_dir_recursive_absolute("res://assets/cozy-island/render_sections")
	var tiles := {}
	var triangles := 0
	var source_count := 0
	for node in island.find_children("*", "MeshInstance3D", true, false):
		if str(node.name).begins_with("Sparse orchard apples"):
			var apple = MeshInstance3D.new()
			apple.name = node.name
			var path = "res://assets/cozy-island/render_sections/" + str(node.name).validate_filename() + ".res"
			ResourceSaver.save(node.mesh, path)
			apple.mesh = load(path)
			apple.transform = node.global_transform
			harvest.add_child(apple)
			apple.owner = result
			continue
		source_count += 1
		var normal_basis: Basis = node.global_basis.inverse().transposed() if absf(node.global_basis.determinant()) > 0.000000000001 else Basis.IDENTITY
		for surface in node.mesh.get_surface_count():
			var arrays = node.mesh.surface_get_arrays(surface)
			var vertices: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
			var normals: PackedVector3Array = arrays[Mesh.ARRAY_NORMAL]
			var indices: PackedInt32Array = arrays[Mesh.ARRAY_INDEX]
			var uv: PackedVector2Array = arrays[Mesh.ARRAY_TEX_UV] if arrays[Mesh.ARRAY_TEX_UV] != null else PackedVector2Array()
			var uv2: PackedVector2Array = arrays[Mesh.ARRAY_TEX_UV2] if arrays[Mesh.ARRAY_TEX_UV2] != null else PackedVector2Array()
			var colors: PackedColorArray = arrays[Mesh.ARRAY_COLOR] if arrays[Mesh.ARRAY_COLOR] != null else PackedColorArray()
			var tangents: PackedFloat32Array = arrays[Mesh.ARRAY_TANGENT] if arrays[Mesh.ARRAY_TANGENT] != null else PackedFloat32Array()
			var material: Material = node.get_active_material(surface)
			if indices.is_empty():
				for i in vertices.size(): indices.append(i)
			for i in range(0, indices.size(), 3):
				var center: Vector3 = (node.global_transform * vertices[indices[i]] + node.global_transform * vertices[indices[i+1]] + node.global_transform * vertices[indices[i+2]]) / 3.0
				var key = Vector2i(floori(center.x / 12.0), floori(center.z / 12.0))
				if not tiles.has(key): tiles[key] = {}
				if not tiles[key].has(material):
					var tool = SurfaceTool.new()
					tool.begin(Mesh.PRIMITIVE_TRIANGLES)
					tool.set_material(material)
					tiles[key][material] = tool
				var tool: SurfaceTool = tiles[key][material]
				for j in 3:
					var index: int = indices[i+j]
					tool.set_normal((normal_basis * normals[index]).normalized() if normals.size() > index else Vector3.UP)
					tool.set_uv(uv[index] if uv.size() > index else Vector2.ZERO)
					tool.set_uv2(uv2[index] if uv2.size() > index else Vector2.ZERO)
					tool.set_color(colors[index] if colors.size() > index else Color.WHITE)
					tool.set_tangent(Plane(Vector3.RIGHT, 1.0))
					if tangents.size() > index * 4 + 3:
						var t: Vector3 = (node.global_basis * Vector3(tangents[index*4], tangents[index*4+1], tangents[index*4+2])).normalized()
						tool.set_tangent(Plane(t, tangents[index*4+3]))
					tool.add_vertex(node.global_transform * vertices[index])
				triangles += 1
	var count := 0
	var output_triangles := 0
	# One draw surface per material and tile. Separate resources also avoid the
	# engine's maximum-surface limit for mesh resources.
	for key in tiles:
		for material in tiles[key]:
			var tool: SurfaceTool = tiles[key][material]
			tool.index()
			var mesh = tool.commit()
			output_triangles += mesh.get_faces().size() / 3
			var path = "res://assets/cozy-island/render_sections/section_%04d.res" % count
			ResourceSaver.save(mesh, path)
			var part = MeshInstance3D.new()
			part.name = "Section_%04d" % count
			part.mesh = load(path)
			result.add_child(part)
			part.owner = result
			count += 1
	assert(output_triangles == triangles, "Static batching lost triangles")
	var packed = PackedScene.new()
	packed.pack(result)
	ResourceSaver.save(packed, "res://scenes/island_render_sections.tscn")
	print("BATCHED ", source_count, " original meshes into ", count, " surfaces; preserved ", triangles, " triangles and ", harvest.get_child_count(), " individual harvest props")
	quit()
