extends RefCounted
## One spatial snapshot per physics tick; collision itself always belongs to Jolt.
const CELL := 4.0
static var members: Dictionary = {}
static var grid: Dictionary = {}
static var rids: Array[RID] = []
static var maximum_radius := 0.0
static var maximum_half_height := 0.0
static var maximum_speed := 0.0
static var frame := -1

static func register(body: RigidBody3D) -> void:
	members[body.get_instance_id()] = weakref(body)
	frame = -1

static func remove(body: RigidBody3D) -> void:
	members.erase(body.get_instance_id())
	frame = -1

static func cell(point: Vector3) -> Vector3i:
	return Vector3i(floori(point.x / CELL), floori(point.y / CELL), floori(point.z / CELL))

static func refresh() -> void:
	if frame == Engine.get_physics_frames(): return
	frame = Engine.get_physics_frames()
	grid.clear()
	rids.clear()
	maximum_radius = 0
	maximum_half_height = 0
	maximum_speed = 0
	for id in members.keys():
		var body = members[id].get_ref()
		if not is_instance_valid(body):
			members.erase(id)
			continue
		if not body.contact_enabled or not body.is_inside_tree(): continue
		rids.append(body.get_rid())
		body.neighbor_center = body.contact_center()
		body.neighbor_inverse = body.global_basis.inverse()
		body.neighbor_world = body.get_world_3d().space
		body.neighbor_velocity = body.linear_velocity
		body.neighbor_mass = body.mass
		maximum_radius = maxf(maximum_radius, body.body_radius)
		maximum_half_height = maxf(maximum_half_height, body.body_height * 0.5)
		maximum_speed = maxf(maximum_speed, body.neighbor_velocity.length())
		var key := cell(body.neighbor_center)
		if not grid.has(key): grid[key] = []
		grid[key].append(body)

static func nearby(body, reach := 6.0, planar := false) -> Array:
	refresh()
	var result: Array = []
	var center: Vector3 = body.neighbor_center
	var vertical: float = maximum_half_height + body.body_height * 0.5 if planar else reach
	var bounds := Vector3(reach, vertical, reach)
	var low := cell(center - bounds)
	var high := cell(center + bounds)
	for x in range(low.x, high.x + 1):
		for y in range(low.y, high.y + 1):
			for z in range(low.z, high.z + 1):
				for other in grid.get(Vector3i(x, y, z), []):
					var offset: Vector3 = center - other.neighbor_center
					if planar: offset.y = 0
					if other != body and other.neighbor_world == body.neighbor_world and offset.length_squared() < reach * reach:
						result.append(other)
	return result

static func living_rids(_body) -> Array[RID]:
	refresh()
	return rids

static func steer(body, preferred: Vector3, free := false) -> Vector3:
	if preferred.length_squared() < 0.001: return preferred
	var change := Vector3.ZERO
	var speed := preferred.length()
	var forward := preferred / speed
	refresh()
	var reach: float = body.body_radius + maximum_radius + 0.12 + (speed + maximum_speed) * 0.45
	if free: reach = maxf(body.body_radius, body.body_height * 0.5) + maxf(maximum_radius, maximum_half_height) + 0.12 + (speed + maximum_speed) * 0.45
	for other in nearby(body, reach, not free):
		var offset: Vector3 = body.neighbor_center - other.neighbor_center
		if not free:
			if absf(offset.y) > (body.body_height + other.body_height) * 0.5: continue
			offset.y = 0
		var distance := offset.length()
		var away := offset / distance if distance > 0.0001 else Vector3.RIGHT * (1 if body.get_instance_id() > other.get_instance_id() else -1)
		var clearance: float = body.extent_toward(away) + other.extent_toward(away) + 0.12
		var relative: Vector3 = preferred - other.neighbor_velocity
		var closing := maxf(0.0, -relative.dot(away))
		if distance > clearance + closing * 0.45: continue
		if closing < 0.05 and distance > clearance: continue
		var urgency := clampf((clearance + closing * 0.45 - distance) / maxf(0.1, closing * 0.45), 0, 1)
		var yield_weight := clampf(other.neighbor_mass / (body.neighbor_mass + other.neighbor_mass), 0.2, 0.8)
		change += away * urgency * speed * yield_weight
		# Stable passing side prevents symmetric head-on encounters oscillating.
		var tangent := forward.cross(Vector3.UP).normalized()
		change += tangent * urgency * minf(1, closing / speed) * speed * 0.35
	var result := preferred + change.limit_length(speed)
	if not free: result.y = preferred.y
	return result.limit_length(speed)
