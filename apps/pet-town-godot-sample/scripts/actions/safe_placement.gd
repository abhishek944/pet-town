extends RefCounted

static func ground_fit(world: Node3D, point: Vector3, hw: float, hd: float, angle: float) -> Dictionary:
	var ground: float = world.ground_at(point)
	var basis := Basis(Vector3.UP, angle)
	var nx := maxi(2, ceili(hw * 4))
	var nz := maxi(2, ceili(hd * 4))
	for ix in range(nx + 1):
		for iz in range(nz + 1):
			var offset := Vector3(lerpf(-hw, hw, float(ix) / nx), 0, lerpf(-hd, hd, float(iz) / nz))
			var probe: Vector3 = point + basis * offset
			if not world.contains(probe):
				return {"error": "This asset would extend beyond the island bounds. Choose a spot farther inland."}
			var height: float = world.ground_at(probe)
			if world.water_at(probe) > -999 or height < float(world.manifest.waterLevel) + 0.4:
				return {"error": "Choose a dry patch of ground for the whole asset."}
			if absf(height - ground) > 0.18:
				return {"error": "This spot slopes or crosses a ledge. Choose a level clearing."}
	return {"position": Vector3(point.x, ground + 0.02, point.z)}

static func clear_box(world: Node3D, point: Vector3, hw: float, hd: float, height: float, angle: float, include_actor := true) -> bool:
	var shape := BoxShape3D.new()
	shape.size = Vector3(hw * 2, maxf(0.3, height), hd * 2)
	var query := PhysicsShapeQueryParameters3D.new()
	query.shape = shape
	query.collision_mask = 7 if include_actor else 1
	query.transform = Transform3D(Basis(Vector3.UP, angle), point + Vector3.UP * (shape.size.y * 0.5 + 0.12))
	return world.get_world_3d().direct_space_state.intersect_shape(query, 1).is_empty()

static func approach_clear(world: Node3D, point: Vector3, hw: float, hd: float, angle: float, target := "") -> bool:
	var reserved: Dictionary = world.manifest.get("placementReservations", {})
	# Source assets use cardinal rotations and a quarter-unit footprint margin.
	var rotated := absi(roundi(sin(angle))) == 1
	var hx := (hd if rotated else hw) + 0.25
	var hz := (hw if rotated else hd) + 0.25
	for approach in reserved.get("corridors", []):
		if not target.is_empty() and approach.get("assetKey", "") == target: continue
		if absf(float(approach.x) - point.x) < hx + 0.8 and absf(float(approach.z) - point.z) < hz + 0.8:
			return false
	var paths: Dictionary = reserved.get("pathCells", {})
	# biomeAt is constant inside each original one-unit grid cell.
	for x in range(floori(point.x - hx), floori(point.x + hx) + 1):
		for z in range(floori(point.z - hz), floori(point.z + hz) + 1):
			if paths.has("%d,%d" % [x,z]): return false
	return true

static func travel_point(world: Node3D, point: Vector3, actor: RigidBody3D) -> Variant:
	for offset in [Vector2(0.5, 0.5), Vector2(-1.5, 0.5), Vector2(0.5, -1.5), Vector2(2.5, 0.5), Vector2(0.5, 2.5), Vector2(-2.5, -1.5), Vector2(3.5, -1.5)]:
		var candidate := Vector3(point.x + offset.x, 0, point.z + offset.y)
		var fitted := ground_fit(world, candidate, actor.body_radius + 0.05, actor.body_radius + 0.05, 0)
		if fitted.has("error"):
			continue
		candidate = fitted.position
		if actor.clear_at(candidate):
			return candidate
	return null
