extends "res://scripts/physics/body.gd"
## Attack state and warnings live on the same physical body as locomotion.
const PROFILES := {
	"Minion": {"health": 40.0, "speed": 2.9, "range": 1.5, "windup": 0.6, "recovery": 0.9, "damage": 10.0},
	"Warrior": {"health": 80.0, "speed": 1.8, "range": 1.5, "windup": 1.05, "recovery": 1.25, "damage": 16.0},
	"Rogue": {"health": 26.0, "speed": 3.2, "range": 6.5, "windup": 1.1, "recovery": 1.35, "damage": 10.0},
	"Mage": {"health": 30.0, "speed": 2.0, "range": 8.5, "windup": 1.2, "recovery": 1.7, "damage": 8.0}
}
var session: Node3D
var appearance := "Minion"
var health := preload("health.gd").new()
var profile: Dictionary
var model: Node3D
var animation: AnimationPlayer
var ring: MeshInstance3D
var warning: Label3D
var lane: Node3D
var target: RigidBody3D
var route := PackedVector3Array()
var reconsider := 0.0
var phase := "Chase"
var phase_time := 0.0
var windup_time := 0.6
var attack_origin := Vector3.ZERO
var aim := Vector3.ZERO
var aim_center := Vector3.ZERO
var attack_direction := Vector3.FORWARD
var target_name := ""
var rush_length := 0.0
var dead_time := 0.0
var hit_time := 0.0
var stuck := 0.0
var previous := Vector3.ZERO

func danger_material() -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = Color("efb85f")
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	return material

func clip(name: String) -> void:
	if animation and animation.has_animation(name) and animation.current_animation != name: animation.play(name, 0.08)

func special_busy() -> bool:
	return health.value > 0 and appearance != "Minion" and phase != "Chase"

func prepare_attack() -> bool:
	if not session.arena.visible_line(position + Vector3.UP * 0.85, target.contact_center()): return false
	var wait := float(profile.windup)
	if appearance != "Minion":
		wait = session.runtime.warning_duration(self, target, target.position, wait)
		if wait < 0: return false
	attack_origin = position
	aim = target.position
	aim_center = target.contact_center()
	attack_direction = Vector3(aim.x - position.x, 0, aim.z - position.z).normalized()
	if attack_direction.length_squared() < 0.01: attack_direction = Vector3.FORWARD
	target_name = "Maple" if target == session.avatar else str(target.entry.name)
	windup_time = wait
	phase_time = 0
	phase = "Windup"
	if appearance == "Rogue":
		rush_length = minf(5, maxf(2, position.distance_to(aim) + 0.8))
		var end := attack_origin + attack_direction * rush_length
		var hit := get_world_3d().direct_space_state.intersect_ray(PhysicsRayQueryParameters3D.create(attack_origin + Vector3.UP * 0.8, end + Vector3.UP * 0.8, 1))
		if not hit.is_empty(): rush_length = maxf(0, attack_origin.distance_to(hit.position - Vector3.UP * 0.8) - body_radius)
		if rush_length < 0.75:
			phase = "Chase"
			return false
		# The envelope includes body width and bounded force-driven displacement.
		build_lane(rush_length + 1.6, 1.6)
		lane.global_position -= attack_direction * 0.8
	elif appearance == "Mage":
		build_lane(Vector2(aim.x - position.x, aim.z - position.z).length() + 0.8, 0.24)
	model.rotation.y = atan2(attack_direction.x, attack_direction.z)
	clip("Idle_A")
	refresh_warning()
	return true

func step_attack(delta: float) -> void:
	phase_time += delta
	if appearance == "Rogue" and phase in ["Windup", "Rush"]:
		var offset := position - attack_origin
		offset.y = 0
		var along := offset.dot(attack_direction)
		if (offset - attack_direction * along).length() > 0.3 or along < -0.3:
			# A body push must not move damaging travel outside the committed footprint.
			recover()
	if phase == "Windup" and appearance != "Minion" and alive(target):
		var required: float = session.runtime.warning_duration(self, target, aim, profile.windup)
		if required < 0:
			recover()
		elif required > windup_time:
			# Losing sight starts a full hidden warning, never a last-instant surprise.
			windup_time = required
			phase_time = 0
	if phase == "Rush" and not session.runtime.warning_available(warning_info()): recover()
	if phase == "Rush":
		var traveled := maxf(0, (position - attack_origin).dot(attack_direction))
		var next := position + attack_direction * maxf(0.15, 8 * delta)
		var collision := sweep(global_transform, attack_direction * maxf(0.15, 8 * delta), true)
		var blocked: bool = not session.arena.safe(next)
		if collision:
			for i in collision.get_collision_count():
				if collision.get_collision_normal(i).dot(attack_direction) < -0.2: blocked = true
		if blocked or traveled >= rush_length or phase_time >= 1.0:
			recover()
		else:
			velocity.x = attack_direction.x * 8
			velocity.z = attack_direction.z * 8
			clip("Running_A")
			for body in [session.avatar] + session.animals:
				if not alive(body) or absf(body.position.y - position.y) > 1.3: continue
				var a := Vector3(previous.x, 0, previous.z)
				var b := Vector3(position.x, 0, position.z)
				var point := Vector3(body.position.x, 0, body.position.z)
				if Geometry3D.get_closest_point_to_segment(point, a, b).distance_to(point) <= 0.46 + body.body_radius:
					body.hurt(profile.damage)
					recover()
					break
		if phase == "Rush": return
	velocity.x = move_toward(velocity.x, 0, delta * 24)
	velocity.z = move_toward(velocity.z, 0, delta * 24)
	if phase == "Windup":
		# Keep a long warning in preparation; swing/cast only just before release.
		clip("Attack_C" if appearance != "Rogue" and phase_time >= windup_time - 0.25 else "Idle_A")
		if not alive(target):
			recover()
		elif phase_time >= windup_time:
			if appearance == "Rogue":
				phase = "Rush"
				phase_time = 0
			elif appearance == "Mage":
				session.runtime.fire_shot(self)
				recover()
			else:
				if position.distance_to(target.position) < 1.85 and session.arena.visible_line(position + Vector3.UP * 0.8, target.contact_center()): target.hurt(profile.damage)
				recover()
	elif phase == "Recovery":
		if phase_time >= 0.25 or appearance == "Rogue": clip("Idle_A")
		if phase_time >= float(profile.recovery):
			phase = "Chase"
			reconsider = 0

func recover() -> void:
	phase = "Recovery"
	phase_time = 0
	refresh_warning()

func build_lane(length: float, width: float) -> void:
	for child in lane.get_children():
		lane.remove_child(child)
		child.queue_free()
	lane.global_position = attack_origin + Vector3.UP * 0.08
	lane.rotation.y = atan2(attack_direction.x, attack_direction.z)
	for rectangle in [Vector3(-width * 0.5, 0, length * 0.5), Vector3(width * 0.5, 0, length * 0.5), Vector3(0, 0, 0), Vector3(0, 0, length)]:
		var node := MeshInstance3D.new()
		var mesh := BoxMesh.new()
		mesh.size = Vector3(0.08, 0.035, length) if rectangle.x != 0 else Vector3(width + 0.08, 0.035, 0.08)
		node.mesh = mesh
		node.material_override = danger_material()
		node.position = rectangle
		lane.add_child(node)

func refresh_warning() -> void:
	var winding := health.value > 0 and phase == "Windup"
	ring.visible = winding and appearance in ["Minion", "Warrior"]
	warning.visible = winding
	lane.visible = health.value > 0 and (phase == "Windup" or phase == "Rush") and appearance in ["Rogue", "Mage"]

func warning_info() -> Dictionary:
	if appearance == "Minion" or health.value <= 0 or phase not in ["Windup", "Rush"]: return {}
	var target_alive := alive(target)
	return {"source": global_position + Vector3.UP * (1 if phase == "Rush" else 2), "aim": aim,
		"target": target if target_alive else null, "name": target_name if target_alive else "locked area", "role": appearance,
		"action": "preparing shot" if appearance == "Mage" else "preparing rush" if appearance == "Rogue" and phase == "Windup" else "rushing" if appearance == "Rogue" else "preparing strike",
		"progress": clampf(1 - phase_time / maxf(0.01, windup_time), 0, 1) if phase == "Windup" else 0.0}

func alive(body: RigidBody3D) -> bool:
	return is_instance_valid(body) and body.health.value > 0
