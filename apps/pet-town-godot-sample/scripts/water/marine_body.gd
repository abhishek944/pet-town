extends "res://scripts/physics/body.gd"
var habitat: RefCounted
var minimum_depth := 1.6
var habitat_radius := 0.4
var school_id := -1
var simulating := true

func set_simulating(active: bool) -> void:
	if simulating == active: return
	simulating = active
	if not active: set_contact_enabled(false)
	elif habitat.clear(global_position,minimum_depth,habitat_radius) and clear_at(global_position):
		set_contact_enabled(true)



func seek(target: Vector3, speed: float, delta: float, schooling := Vector3.ZERO, breach := false) -> void:
	if not habitat or not simulating: return
	var valid: bool = habitat.clear(global_position, minimum_depth, habitat_radius)
	if not contact_enabled:
		if habitat.clear(target, minimum_depth, habitat_radius) and clear_at(target):
			relocate(target)
			set_contact_enabled(true)
		return
	if not valid:
		set_contact_enabled(false)
		return
	begin_motion()
	medium = "water"
	var surface: float = habitat.world.water_at(target)
	var floor_y: float = habitat.world.submerged_floor_at(target)
	target.y = maxf(target.y, floor_y + body_height * 0.5 + 0.12)
	if not breach: target.y = minf(target.y, surface - body_height * 0.5 - 0.12)
	var desired := (target - global_position) * 1.6
	desired = (desired + schooling).limit_length(speed)
	var preferred := steer(desired, true)
	var next := global_position + preferred * maxf(delta, 0.25)
	if not habitat.clear(next, minimum_depth, habitat_radius): preferred.x = 0; preferred.z = 0
	velocity = velocity.lerp(preferred, 1.0 - exp(-delta * 3.0))
	# Water drag is deliberately gradual, retaining the momentum of a nudge.
	submit_motion()
	var horizontal := Vector2(linear_velocity.x, linear_velocity.z)
	if horizontal.length() > 0.08:
		set_heading(lerp_angle(rotation.y, atan2(horizontal.x, horizontal.y), 1.0 - exp(-delta * 3.0)))

func flock() -> Vector3:
	var center := Vector3.ZERO
	var alignment := Vector3.ZERO
	var count := 0
	for other in Neighbors.nearby(self, 4.0):
		if other.get("school_id") != school_id: continue
		center += other.neighbor_center
		alignment += other.neighbor_velocity
		count += 1
	if count == 0: return Vector3.ZERO
	return ((center / count - neighbor_center) * 0.12 + (alignment / count - neighbor_velocity) * 0.18).limit_length(0.6)
