extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var world := (load("res://scenes/world/WorldBase.tscn") as PackedScene).instantiate() as Node3D
	root.add_child(world)
	await physics_frame
	await physics_frame
	await physics_frame
	await physics_frame
	await create_timer(0.2).timeout
	var errors: Array[String] = []
	var ground := world.get_node("GroundBody") as StaticBody3D
	var water_body := world.get_node("WaterPlacement") as StaticBody3D
	var region := world.get_node("NavigationRegion3D") as NavigationRegion3D
	var island := world.get_node("Island") as Node3D
	var sea := world.get_node("Sea") as MeshInstance3D
	var sea_mesh := sea.mesh as PlaneMesh
	if sea_mesh == null or sea_mesh.size.x < 12000.0 or not sea_mesh.material is ShaderMaterial:
		errors.append("ocean horizon does not use the original extended water surface")
	if world.get_node_or_null("SettingSun") != null:
		errors.append("temporary setting sun mesh is still visible")
	if ground.collision_layer != 16 or ground.get_child_count() != 1:
		errors.append("world needs a single ground body on layer 16")
	if water_body.collision_layer != 8:
		errors.append("boat placement water needs collision layer 8")
	if region.navigation_mesh == null or region.navigation_mesh.get_polygon_count() < 500:
		errors.append("walkable terrain navigation is missing")
	if island.find_child("WalkableGround", true, false) == null:
		errors.append("shared uneven terrain is missing")
	for candidate in island.find_children("*", "MeshInstance3D", true, false):
		if String(candidate.name) not in ["WalkableGround", "Shore", "Cliff"]:
			errors.append("base world contains a decoration: " + String(candidate.name))
	var center := _ground_hit(Vector3(0, 15, 0))
	var west_hill := _ground_hit(Vector3(-23, 15, -14))
	var east_hill := _ground_hit(Vector3(17, 15, 11))
	var water := _ground_hit(Vector3(55, 15, 0))
	if center.is_empty() or west_hill.is_empty() or east_hill.is_empty():
		errors.append("terrain raycasts did not hit all interior locations")
	else:
		if center["collider"] != ground or west_hill["collider"] != ground:
			errors.append("terrain does not hit GroundBody")
		if absf(west_hill["position"].y - center["position"].y) < 0.25:
			errors.append("west knoll is too flat")
		if absf(east_hill["position"].y - center["position"].y) < 0.35:
			errors.append("east knoll is too flat")
	if not water.is_empty():
		errors.append("ground collision extends beyond the island")
	var island_click := _surface_hit(Vector3(0, 15, 0))
	var sea_click := _surface_hit(Vector3(55, 15, 0))
	if island_click.get("collider") != ground or sea_click.get("collider") != water_body:
		errors.append("land and water placement raycasts choose the wrong surface")
	if region.navigation_mesh != null:
		NavigationServer3D.map_force_update(region.get_navigation_map())
		var route := NavigationServer3D.map_get_path(region.get_navigation_map(), Vector3(-15, 1, 0), Vector3(17, 1, 9), true)
		if route.size() < 2:
			errors.append("pets cannot route across the shared island")
	print("WORLD_SMOKE navigation_faces=", region.navigation_mesh.get_polygon_count(), " center=", center.get("position", Vector3.ZERO), " west=", west_hill.get("position", Vector3.ZERO), " east=", east_hill.get("position", Vector3.ZERO), " errors=", errors)
	world.free()
	quit(0 if errors.is_empty() else 1)

func _ground_hit(origin: Vector3) -> Dictionary:
	var ray := PhysicsRayQueryParameters3D.create(origin, origin + Vector3.DOWN * 40)
	ray.collision_mask = 16
	return root.get_world_3d().direct_space_state.intersect_ray(ray)

func _surface_hit(origin: Vector3) -> Dictionary:
	var ray := PhysicsRayQueryParameters3D.create(origin, origin + Vector3.DOWN * 40)
	ray.collision_mask = 8 | 16
	return root.get_world_3d().direct_space_state.intersect_ray(ray)
