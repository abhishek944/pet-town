extends "res://scripts/companion_state.gd"

func configure(id: String, label: String, status: String, appearance: String) -> void:
	agent_id = id
	display_name = label
	live_status = _normalized_status(status)
	appearance_label = appearance
	if is_node_ready():
		_apply_live_status()

func update_live_status(status: String, label: String) -> void:
	var was_retiring := retiring
	if retiring:
		_cancel_retirement()
	var next_status := _normalized_status(status)
	var status_changed := next_status != live_status
	display_name = label
	live_status = next_status
	if is_node_ready():
		caption.text = display_name
		if status_changed or was_retiring:
			_apply_live_status()

func begin_retirement() -> void:
	if retiring:
		return
	manually_controlled = false
	manual_direction = Vector3.ZERO
	retiring = true
	navigation_agent.velocity = Vector3.ZERO
	velocity = Vector3.ZERO
	activity_text = "Agent ended"
	_animate("Idle_A")
	retirement_tween = create_tween()
	retirement_tween.tween_interval(0.35)
	retirement_tween.tween_property(self, "scale", Vector3(0.02, 0.02, 0.02), 0.65)
	retirement_tween.tween_callback(_finish_retirement)

func set_manual_control(enabled: bool) -> void:
	if retiring or manually_controlled == enabled:
		return
	manually_controlled = enabled
	manual_direction = Vector3.ZERO
	navigation_agent.velocity = Vector3.ZERO
	velocity = Vector3.ZERO
	if enabled:
		_set_seated(false)
		pause_left = 0.0
		path_settling_frames = 0
		navigation_agent.avoidance_enabled = false
		navigation_agent.target_position = global_position
		activity_text = "Exploring town"
		_animate("Idle_A")
	else:
		navigation_agent.avoidance_enabled = true
		if live_status == "idle":
			# Idle status ordinarily teleports to a bench; never teleport on release.
			activity_text = "Taking a town break"
			_choose_next_destination()
		else:
			_apply_live_status()

func _ready() -> void:
	add_to_group("live_agents")
	navigation_agent.velocity_computed.connect(_move_with_avoidance)
	caption.text = display_name
	_animate("Idle_A")
	reset_physics_interpolation()
	await get_tree().physics_frame
	await get_tree().physics_frame
	while NavigationServer3D.map_get_iteration_id(navigation_agent.get_navigation_map()) == 0:
		await get_tree().physics_frame
	ready_to_walk = true
	_apply_live_status()

func _physics_process(delta: float) -> void:
	caption.text = display_name
	if retiring or not ready_to_walk:
		return
	if manually_controlled:
		_walk_manually(delta)
		return
	if seated and live_status in ["idle", "done"]:
		navigation_agent.velocity = Vector3.ZERO
		velocity = Vector3.ZERO
		return
	if pause_left > 0.0:
		pause_left -= delta
		navigation_agent.velocity = Vector3.ZERO
		if pause_left <= 0.0:
			_choose_next_destination()
		return
	if path_settling_frames > 0:
		path_settling_frames -= 1
		navigation_agent.velocity = Vector3.ZERO
		return
	var offset := destination - global_position
	offset.y = 0.0
	var arrival_distance := 1.4 if live_status == "idle" else 0.7
	if offset.length() < arrival_distance:
		_arrive()
		return
	var next_point := navigation_agent.get_next_path_position()
	var direction := next_point - global_position
	direction.y = 0.0
	if direction.length_squared() < 0.001:
		navigation_agent.velocity = Vector3.ZERO
		return
	direction = direction.normalized()
	navigation_agent.velocity = direction * walk_speed
	visual.rotation.y = lerp_angle(visual.rotation.y, atan2(direction.x, direction.z), minf(delta * 8.0, 1.0))

func _walk_manually(delta: float) -> void:
	var direction := manual_direction
	var horizontal := direction * walk_speed
	if direction.length_squared() > 0.001:
		var candidate := global_position + horizontal * delta
		var closest := NavigationServer3D.map_get_closest_point(navigation_agent.get_navigation_map(), candidate)
		if candidate.distance_to(closest) > 0.65:
			horizontal = Vector3.ZERO
		else:
			visual.rotation.y = lerp_angle(visual.rotation.y, atan2(direction.x, direction.z), minf(delta * 8.0, 1.0))
	velocity.x = horizontal.x
	velocity.z = horizontal.z
	velocity.y = 0.0 if is_on_floor() else velocity.y - 18.0 * delta
	move_and_slide()
	_animate("Walking_A" if horizontal.length_squared() > 0.001 else "Idle_A")

func _move_with_avoidance(safe_velocity: Vector3) -> void:
	if manually_controlled or not ready_to_walk or retiring or seated or pause_left > 0.0:
		velocity = Vector3.ZERO
		return
	velocity.x = safe_velocity.x
	velocity.z = safe_velocity.z
	velocity.y = 0.0 if is_on_floor() else velocity.y - 18.0 * get_physics_process_delta_time()
	move_and_slide()

func _set_seated(value: bool) -> void:
	if seated == value:
		return
	seated = value
	navigation_agent.avoidance_enabled = not seated
	navigation_agent.velocity = Vector3.ZERO
	velocity = Vector3.ZERO
	if seated:
		path_settling_frames = 0
	visual.position.y = -0.28 if seated else 0.0
	visual.rotation.x = deg_to_rad(-3.0) if seated else 0.0
	if seated:
		_apply_seated_pose()

func _apply_seated_pose() -> void:
	player.seek(0.2, true)
	player.pause()
	var skeleton := visual.find_child("Skeleton3D", true, false) as Skeleton3D
	if not is_instance_valid(skeleton):
		return
	var upper_leg := Quaternion.from_euler(Vector3(deg_to_rad(-72.0), 0.0, 0.0))
	var lower_leg := Quaternion.from_euler(Vector3(deg_to_rad(102.0), 0.0, 0.0))
	var foot := Quaternion.from_euler(Vector3(deg_to_rad(-28.0), 0.0, 0.0))
	for side in ["l", "r"]:
		_set_bone_pose(skeleton, "upperleg.%s" % side, upper_leg)
		_set_bone_pose(skeleton, "lowerleg.%s" % side, lower_leg)
		_set_bone_pose(skeleton, "foot.%s" % side, foot)

func _set_bone_pose(skeleton: Skeleton3D, bone_name: String, rotation: Quaternion) -> void:
	var bone := skeleton.find_bone(bone_name)
	if bone >= 0:
		skeleton.set_bone_pose_rotation(bone, rotation)

func _cancel_retirement() -> void:
	retiring = false
	if retirement_tween:
		retirement_tween.kill()
	scale = Vector3.ONE

func _finish_retirement() -> void:
	retirement_finished.emit(agent_id)
	queue_free()

func _animate(clip: String) -> void:
	if player.has_animation(clip) and player.current_animation != clip:
		player.play(clip, 0.2)
