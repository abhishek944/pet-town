extends RefCounted

static func pick(host: Node3D, camera: Camera3D, screen: Vector2) -> String:
	var from:=camera.project_ray_origin(screen)
	var query:=PhysicsRayQueryParameters3D.create(from,from+camera.project_ray_normal(screen)*40,4)
	var excluded: Array[RID]=[]
	for actor in host.actors.values():
		if not actor.visual.is_visible_in_tree(): excluded.append(actor.get_rid())
	query.exclude=excluded
	var hit:=host.get_world_3d().direct_space_state.intersect_ray(query)
	if hit.is_empty(): return ""
	var terrain_query:=PhysicsRayQueryParameters3D.create(from,hit.position,1)
	var terrain: Dictionary=host.town.builder.terrain_hit(terrain_query)
	if not terrain.is_empty() and from.distance_to(terrain.position)<from.distance_to(hit.position)-0.05: return ""
	for id in host.actors:
		var actor: Node3D=host.actors[id]
		if hit.collider==actor and actor.visual.is_visible_in_tree(): return str(id)
	return ""
