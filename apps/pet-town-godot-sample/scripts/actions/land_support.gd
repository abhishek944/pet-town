extends RefCounted

static func ground(world: Node3D, x: float, z: float, hw := 0.25, hd := 0.25) -> Variant:
	var center := Vector3(x, 0, z)
	if not world.contains(center): return null
	var height: float = world.ground_at(center)
	if height <= float(world.manifest.waterLevel) + 0.2: return null
	for cell_z in range(floori(z - hd), floori(z + hd) + 1):
		for cell_x in range(floori(x - hw), floori(x + hw) + 1):
			var point := Vector3(cell_x + 0.5, 0, cell_z + 0.5)
			if not world.contains(point) or world.water_at(point) > -999: return null
			if absf(world.ground_at(point) - height) > 0.1: return null
	return height

static func fishing(world: Node3D) -> Dictionary:
	var shore = ground(world, -20, -66, 0.65, 0.65)
	if shore == null: return {}
	var water: float = world.manifest.waterLevel
	for dx in [-0.5, 0, 0.5]:
		for dz in [-0.5, 0, 0.5]:
			var point := Vector3(-20 + dx, water, -74 + dz)
			if world.water_at(point) < -999 or world.ground_at(point) >= water - 0.15: return {}
	return {"shore": shore, "water": water}

static func nearby(sample: Node3D, x: float, z: float, distance: float, height: Variant, vertical := 2.5) -> bool:
	if height == null: return false
	var point: Vector3 = sample.actor.global_position
	return Vector2(point.x - x, point.z - z).length() <= distance and absf(point.y - float(height)) < vertical
