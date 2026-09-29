extends RefCounted

static func frame(view: WorkshopCamera, pet: LiveCompanion) -> void:
	view.set_fpv(false)
	view.follow(pet)
	var target := pet.global_position + Vector3.UP * 0.8
	var space := pet.get_world_3d().direct_space_state
	var start_yaw := view.yaw
	for angle in [0.0, PI / 4.0, -PI / 4.0, PI / 2.0, -PI / 2.0, 3.0 * PI / 4.0, -3.0 * PI / 4.0, PI]:
		for height in [24.0, 38.0, 52.0]:
			var elevation := deg_to_rad(height)
			var distance := 10.0
			var yaw: float = start_yaw + float(angle)
			var horizontal := cos(elevation) * distance
			var candidate := target + Vector3(sin(yaw) * horizontal, sin(elevation) * distance, cos(yaw) * horizontal)
			var ray := PhysicsRayQueryParameters3D.create(target, candidate, 1, [pet.get_rid()])
			if space.intersect_ray(ray).is_empty():
				view.yaw = yaw
				view.elevation = elevation
				view.distance = distance
				view.focus = target
				return
	view.yaw = start_yaw
	view.elevation = deg_to_rad(55.0)
	view.distance = 7.0
	view.focus = target
