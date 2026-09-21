extends SceneTree
## Editor/offline bake only. Reads the static island; never changes its placement.
## Run with Godot --headless --path apps/pet-town-godot --script res://tools/bake_town_navigation.gd
func _initialize() -> void:
	call_deferred("bake")

func bake() -> void:
	var island = load("res://assets/cozy-island/grand-moonhaven.glb").instantiate()
	root.add_child(island)
	var source = NavigationMeshSourceGeometryData3D.new()
	var collision_faces = PackedVector3Array()
	var surface_count = 0
	var obstacle_count = 0
	for node in island.find_children("*", "MeshInstance3D", true, false):
		var mesh_node = node as MeshInstance3D
		var label = str(node.name).to_lower()
		var ground = "tenfold broad terraced island" in label
		var road = false
		for i in mesh_node.mesh.get_surface_count():
			var mat = mesh_node.get_active_material(i)
			if mat and ("warm gravel" in mat.resource_name or "muted cobblestone" in mat.resource_name):
				road = true
		var obstacle = matches(label, ["foundation", "plaster", "faceted trunk", "tree trunk", "orchard trunk", "village bench", "bread display table", "coastal rock", "shore boulder", "campfire ring stone", "campfire log seat", "canvas camping tent", "raised bed", "garden bed", "table top", "tabletop", "crate", "lighthouse tower", "windmill tower"])
		if ground or road or "earthen clearing" in label:
			source.add_mesh(mesh_node.mesh, mesh_node.global_transform)
			surface_count += 1
		if ground or road or obstacle:
			var faces = mesh_node.mesh.get_faces()
			for v in faces: collision_faces.append(mesh_node.global_transform * v)
		if obstacle:
			var b: AABB = mesh_node.global_transform * mesh_node.get_aabb()
			var outline = PackedVector3Array([Vector3(b.position.x,0,b.position.z), Vector3(b.end.x,0,b.position.z), Vector3(b.end.x,0,b.end.z), Vector3(b.position.x,0,b.end.z)])
			source.add_projected_obstruction(outline, b.position.y - 0.15, maxf(b.size.y + 0.3, 1.5), false)
			obstacle_count += 1
	# Static furnishing footprints are authored in Godot, never placed at runtime.
	if ResourceLoader.exists("res://scenes/town_decorations.tscn"):
		var decorations = load("res://scenes/town_decorations.tscn").instantiate()
		root.add_child(decorations)
		for collision in decorations.find_children("*", "CollisionShape3D", true, false):
			if not collision.get_meta("navigation_obstacle", false): continue
			var b: AABB = collision.global_transform * collision.shape.get_debug_mesh().get_aabb()
			var outline = PackedVector3Array([Vector3(b.position.x,0,b.position.z), Vector3(b.end.x,0,b.position.z), Vector3(b.end.x,0,b.end.z), Vector3(b.position.x,0,b.end.z)])
			source.add_projected_obstruction(outline, b.position.y - 0.15, maxf(b.size.y + 0.3, 1.5), false)
		decorations.queue_free()
	var nav = NavigationMesh.new()
	nav.cell_size = 0.3
	nav.cell_height = 0.15
	nav.agent_radius = 0.6
	nav.agent_height = 1.5
	nav.agent_max_climb = 0.3
	nav.agent_max_slope = 48.0
	nav.region_min_size = 2.0
	nav.region_merge_size = 12.0
	nav.edge_max_error = 0.8
	nav.detail_sample_distance = 6.0
	nav.detail_sample_max_error = 0.5
	NavigationServer3D.bake_from_source_geometry_data(nav, source)
	assert(nav.get_polygon_count() > 0)
	clean_overlapping_polygons(nav)
	ResourceSaver.save(nav, "res://navigation/town_walkable.res")
	var shape = ConcavePolygonShape3D.new()
	shape.set_faces(collision_faces)
	ResourceSaver.save(shape, "res://navigation/town_collision.res")
	print("BAKED: ", surface_count, " ground/path meshes; ", obstacle_count, " obstacles; ", nav.get_polygon_count(), " polygons; ", collision_faces.size()/3, " collision triangles")
	bake_animations()
	island.queue_free()
	quit()

func matches(label: String, words: Array) -> bool:
	for word in words:
		if word in label: return true
	return false

func bake_animations() -> void:
	var library = AnimationLibrary.new()
	for filename in ["Rig_Medium_General.glb", "Rig_Medium_MovementBasic.glb"]:
		var source = load("res://assets/kaykit/" + filename).instantiate()
		var player: AnimationPlayer = source.find_child("AnimationPlayer", true, false)
		for clip in ["Idle_A", "Idle_B", "Interact", "PickUp", "Use_Item", "Walking_A", "Running_A"]:
			if not player.has_animation(clip): continue
			var animation: Animation = player.get_animation(clip).duplicate(true)
			animation.loop_mode = Animation.LOOP_LINEAR
			library.add_animation(clip, animation)
		source.free()
	ResourceSaver.save(library, "res://assets/kaykit/town_animations.res")

func clean_overlapping_polygons(nav: NavigationMesh) -> void:
	# Recast may emit an overlapping triangle where authored roads cross.
	# Remove only polygons contributing to multiple non-manifold edges.
	var vertices := nav.vertices
	var edges := {}
	for i in nav.get_polygon_count():
		var polygon := nav.get_polygon(i)
		for j in polygon.size():
			var a := str(vertices[polygon[j]])
			var b := str(vertices[polygon[(j + 1) % polygon.size()]])
			var key := a + ":" + b if a < b else b + ":" + a
			if not edges.has(key): edges[key] = []
			edges[key].append(i)
	var conflicts := {}
	for edge in edges.values():
		if edge.size() > 2:
			for index in edge: conflicts[index] = conflicts.get(index, 0) + 1
	var kept: Array[PackedInt32Array] = []
	for i in nav.get_polygon_count():
		if conflicts.get(i, 0) < 2: kept.append(nav.get_polygon(i))
	nav.clear_polygons()
	for polygon in kept: nav.add_polygon(polygon)
