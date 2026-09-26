extends "res://scripts/main_tree_catalog_placement.gd"

func _pick_paver(screen_position: Vector2) -> UserTree:
	if not is_instance_valid(paver_registry) or build_mode:
		return null
	var origin := camera.project_ray_origin(screen_position)
	var query := PhysicsRayQueryParameters3D.create(origin, origin + camera.project_ray_normal(screen_position) * 2000.0, 16)
	query.collide_with_areas = false
	var hit := get_world_3d().direct_space_state.intersect_ray(query)
	return paver_registry.call("pick", hit.position) as UserTree if not hit.is_empty() else null
