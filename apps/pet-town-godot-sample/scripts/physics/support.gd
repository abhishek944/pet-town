extends RefCounted
## Support comes from scenery and decks. Other animals remain contact partners.
const GROUND_ADHESION := 6.0
static func update(body, state: PhysicsDirectBodyState3D, contacts_valid := true) -> Array[Vector3]:
	var was_grounded: bool = body.grounded
	body.grounded = false
	body.support_contact = false
	body.support_body = null
	body.support_velocity = Vector3.ZERO
	var animals: Array[Vector3] = []
	# Relocation changes the pose before the solver refreshes its contacts.
	if not contacts_valid: return animals
	for i in state.get_contact_count():
		var other = state.get_contact_collider_object(i)
		var normal := state.transform.basis * state.get_contact_local_normal(i)
		if other and other.is_in_group("living_body"):
			animals.append(normal)
		elif normal.y > cos(body.floor_max_angle):
			body.grounded = true
			body.support_contact = true
			body.support_body = other as PhysicsBody3D
			body.support_normal = normal
			body.support_velocity = state.get_contact_collider_velocity_at_position(i)
	# Keep support across descending slopes and tiny seams while gravity closes
	# the gap. Never snap positions or treat an animal as a floor.
	if not body.grounded and was_grounded and body.medium == "land" and state.linear_velocity.y <= 0 and body.floor_snap_length > 0:
		var hit: PhysicsTestMotionResult3D = body.sweep(state.transform, Vector3.DOWN * body.floor_snap_length, true)
		if hit and hit.get_collision_normal().y > cos(body.floor_max_angle):
			body.grounded = true
			body.support_body = hit.get_collider() as PhysicsBody3D
			body.support_normal = hit.get_collision_normal()
			body.support_velocity = hit.get_collider_velocity()
	return animals

static func ground_acceleration(body, horizontal: Vector3) -> Vector3:
	var normal: Vector3 = body.support_normal
	# Follow the surface without pressing the walking motor into it. Bound the
	# full tangent force so steep ground cannot amplify mass-aware nudging.
	var tangent := horizontal - Vector3.UP * horizontal.dot(normal) / normal.y
	return tangent.limit_length(body.motor_acceleration) - normal * GROUND_ADHESION
