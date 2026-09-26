class_name WorkshopSurface
extends RefCounted

static func hit(view: Camera3D, screen_position: Vector2, surface: String) -> Dictionary:
	var origin := view.project_ray_origin(screen_position)
	var end := origin + view.project_ray_normal(screen_position) * 500.0
	var space := view.get_world_3d().direct_space_state
	var land := space.intersect_ray(PhysicsRayQueryParameters3D.create(origin, end, 16))
	if surface != "water":
		return land
	var water := space.intersect_ray(PhysicsRayQueryParameters3D.create(origin, end, 8))
	if water.is_empty():
		return {}
	if not land.is_empty() and origin.distance_to(land.position) < origin.distance_to(water.position):
		return {}
	return water
