extends RefCounted
## Autonomous companions need dry support for the whole body, not just a dry goal.
const MARGIN := 0.4
const HOME_RADIUS := 18.0

static func height(world: Node3D, point: Vector3) -> Variant:
	if not world.contains(point): return null
	var center: float = world.ground_at(point)
	var low := center
	var high := center
	for z in range(floori(point.z - MARGIN), floori(point.z + MARGIN) + 1):
		for x in range(floori(point.x - MARGIN), floori(point.x + MARGIN) + 1):
			var probe := Vector3(x + 0.5, 0, z + 0.5)
			if not world.contains(probe) or world.water_at(probe) > -999: return null
			var y: float = world.ground_at(probe)
			if not is_finite(y) or y <= float(world.manifest.waterLevel) + 0.06: return null
			low = minf(low, y)
			high = maxf(high, y)
	if high - low > 1.02: return null
	return center

static func segment(world: Node3D, start: Vector3, end: Vector3) -> bool:
	var previous = height(world, start)
	if previous == null: return false
	var steps := maxi(1, ceili(Vector2(end.x - start.x, end.z - start.z).length() / 0.2))
	for i in range(1, steps + 1):
		var next = height(world, start.lerp(end, float(i) / steps))
		if next == null or absf(float(next) - float(previous)) > 1.02: return false
		previous = next
	return true
