extends SceneTree

# Offline build step after Godot imports world-base.glb. The game loads these
# fixed resources; terrain collision and pet navigation are never baked at play.
const MODEL := "res://assets/world/world-base.glb"
const COLLISION := "res://assets/world/ground-collision.res"
const NAVIGATION := "res://assets/world/ground-navigation.res"

func _initialize() -> void:
	call_deferred("_bake")

func _bake() -> void:
	var island := (load(MODEL) as PackedScene).instantiate() as Node3D
	root.add_child(island)
	var collision_faces := PackedVector3Array()
	var navigation := NavigationMesh.new()
	var nav_vertices := PackedVector3Array()
	var nav_polygons: Array[PackedInt32Array] = []
	var walkable_faces := 0
	for name in ["WalkableGround", "Shore", "Cliff"]:
		var part := island.find_child(name, true, false) as MeshInstance3D
		if part == null or part.mesh == null:
			push_error("Missing world mesh: " + name)
			quit(1)
			return
		for surface in part.mesh.get_surface_count():
			var arrays := part.mesh.surface_get_arrays(surface)
			var points := arrays[Mesh.ARRAY_VERTEX] as PackedVector3Array
			var indices := arrays[Mesh.ARRAY_INDEX] as PackedInt32Array
			var transformed := PackedVector3Array()
			for point in points:
				transformed.append(part.global_transform * point)
			for index in indices:
				collision_faces.append(transformed[index])
			if name in ["WalkableGround", "Shore"]:
				var offset := nav_vertices.size()
				nav_vertices.append_array(transformed)
				for i in range(0, indices.size(), 3):
					# Imported GLB triangle winding faces down in navigation coordinates.
					nav_polygons.append(PackedInt32Array([offset + indices[i + 2], offset + indices[i + 1], offset + indices[i]]))
					walkable_faces += 1
	var shape := ConcavePolygonShape3D.new()
	shape.data = collision_faces
	shape.backface_collision = true
	navigation.vertices = nav_vertices
	for polygon in nav_polygons:
		navigation.add_polygon(polygon)
	if ResourceSaver.save(shape, COLLISION) != OK or ResourceSaver.save(navigation, NAVIGATION) != OK:
		push_error("Could not save world collision/navigation resources")
		quit(1)
		return
	print("WORLD_BAKED collision_triangles=", collision_faces.size() / 3, " navigation_triangles=", walkable_faces)
	island.queue_free()
	quit()
