extends RigidBody3D
const Neighbors = preload("neighbors.gd")
const Support = preload("support.gd")
var velocity := Vector3.ZERO
var floor_snap_length := 0.25
var floor_max_angle := deg_to_rad(55)
var body_radius := 0.28
var body_height := 1.42
var body_shape: CollisionShape3D
var body_profile: Dictionary = {}
var contact_enabled := true
var support_velocity := Vector3.ZERO
var support_normal := Vector3.UP
var support_body: PhysicsBody3D
var grounded := false
var support_contact := false
var medium := "land"
var motor_acceleration := 22.0
var vertical_acceleration := 120.0
var _sampled := Vector3.ZERO
var _change := Vector3.ZERO
var _command_frame := -10
var _relocation: Dictionary = {}
var _support_invalidated := false
var _jump := NAN
var _heading := NAN
var _body_layer := 4
var neighbor_center := Vector3.ZERO
var neighbor_inverse := Basis.IDENTITY
var neighbor_world: RID
var neighbor_velocity := Vector3.ZERO
var neighbor_mass := 1.0

func _enter_tree() -> void:
	physics_interpolation_mode = Node.PHYSICS_INTERPOLATION_MODE_ON
	gravity_scale = 0
	lock_rotation = true
	continuous_cd = true
	contact_monitor = true
	max_contacts_reported = 16
	linear_damp_mode = RigidBody3D.DAMP_MODE_REPLACE
	linear_damp = 0
	var material := PhysicsMaterial.new()
	material.friction = 0.15
	material.bounce = 0
	physics_material_override = material
	collision_mask = 7
	add_to_group("living_body")
	Neighbors.register(self)

func _exit_tree() -> void:
	Neighbors.remove(self)

func configure_body(profile: Dictionary, layer := 4) -> void:
	body_profile = profile
	mass = maxf(0.1, float(profile.mass))
	body_radius = float(profile.radius)
	body_height = float(profile.height)
	collision_layer = layer
	_body_layer = layer
	collision_mask = 7
	if not body_shape:
		body_shape = CollisionShape3D.new()
		add_child(body_shape)
	body_shape.shape = profile.shape
	body_shape.position = profile.offset

func contact_center() -> Vector3:
	return global_transform * body_shape.position if body_shape else global_position

func extent_toward(direction: Vector3) -> float:
	if body_profile.has("extents"): return ((neighbor_inverse * direction) * Vector3(body_profile.extents)).length()
	return body_radius + maxf(0, body_height * 0.5 - body_radius) * absf(direction.y)

func begin_motion() -> void:
	velocity = linear_velocity - support_velocity
	_sampled = velocity
	_change = Vector3.ZERO

func submit_motion() -> void:
	_change = velocity - _sampled
	_command_frame = Engine.get_physics_frames()
	if _change.length_squared() > 0.00001: sleeping = false

func steer(preferred: Vector3, free := false) -> Vector3:
	return Neighbors.steer(self, preferred, free)

func is_grounded() -> bool:
	return grounded

func queue_jump(speed: float) -> void:
	_jump = speed
	velocity.y = speed
	_sampled.y = speed
	sleeping = false

func set_heading(yaw: float) -> void:
	_heading = yaw

func sweep(origin: Transform3D, travel: Vector3, world_only := false) -> PhysicsTestMotionResult3D:
	var parameters := PhysicsTestMotionParameters3D.new()
	parameters.from = origin
	parameters.motion = travel
	parameters.margin = 0.001
	parameters.max_collisions = 4
	if world_only: parameters.exclude_bodies = Neighbors.living_rids(self)
	var result := PhysicsTestMotionResult3D.new()
	return result if PhysicsServer3D.body_test_motion(get_rid(), parameters, result) else null

func clear_at(point: Vector3, mask := 7) -> bool:
	if not body_shape: return false
	var query := PhysicsShapeQueryParameters3D.new()
	query.shape = body_shape.shape
	query.collision_mask = mask
	query.exclude = [get_rid()]
	query.transform = Transform3D(global_basis, point) * body_shape.transform
	return get_world_3d().direct_space_state.intersect_shape(query, 1).is_empty()

func relocate(point: Vector3, momentum := Vector3.ZERO) -> void:
	_relocation = {"point": point, "velocity": momentum}
	_support_invalidated = true
	if freeze:
		global_position = point
		linear_velocity = momentum
		_relocation.clear()
		reset_physics_interpolation()
	velocity = momentum
	_change = Vector3.ZERO
	grounded = false
	support_contact = false
	support_body = null
	support_velocity = Vector3.ZERO
	sleeping = false

func set_contact_enabled(active: bool) -> void:
	if contact_enabled == active: return
	contact_enabled = active
	collision_layer = _body_layer if active else 0
	collision_mask = 7 if active else 0
	freeze = not active
	visible = active
	Neighbors.frame = -1

func _integrate_forces(state: PhysicsDirectBodyState3D) -> void:
	if not _relocation.is_empty():
		var pose := state.transform
		pose.origin = _relocation.point
		state.transform = pose
		state.linear_velocity = _relocation.velocity
		_relocation.clear()
		reset_physics_interpolation()
	if is_finite(_heading):
		var pose := state.transform
		pose.basis = Basis(Vector3.UP, _heading)
		state.transform = pose
		_heading = NAN
	var animal_normals := Support.update(self, state, not _support_invalidated)
	_support_invalidated = false
	var jumping := is_finite(_jump)
	if jumping:
		state.apply_central_impulse(Vector3.UP * mass * (_jump + support_velocity.y - state.linear_velocity.y))
		_jump = NAN
	if Engine.get_physics_frames() - _command_frame > 2: return
	var delta := maxf(state.step, 0.0001)
	var acceleration := _change / delta
	var horizontal := Vector3(acceleration.x, 0, acceleration.z).limit_length(motor_acceleration)
	var relative_velocity := state.linear_velocity - support_velocity
	if medium == "land" and support_contact and not jumping and relative_velocity.dot(support_normal) <= 0.5:
		# Air gravity must not pin a supported body against a slope or tiny edge.
		acceleration = Support.ground_acceleration(self, horizontal)
	else:
		acceleration = horizontal + Vector3.UP * clampf(acceleration.y, -vertical_acceleration, vertical_acceleration)
	for normal in animal_normals:
		# Contact can push the animal; its motor must not fight into another body.
		if acceleration.dot(normal) < 0: acceleration -= normal * acceleration.dot(normal) * 0.85
	state.apply_central_force(acceleration * mass)
