extends Node3D
## One committed, non-homing enemy shot. Combat owns its game-step clock/lifetime.
var session: Node3D
var origin := Vector3.ZERO
var aim := Vector3.ZERO
var direction := Vector3.FORWARD
var victim: RigidBody3D
var victim_name := ""
var speed := 7.0
var damage: float
var distance := 0.0
var reach := 14.0
var expired := false
var shape := SphereShape3D.new()

func _ready() -> void:
	global_position = origin
	shape.radius = 0.12
	direction = origin.direction_to(aim)
	reach = minf(14, origin.distance_to(aim) + 0.8)
	var node := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radius = 0.12
	mesh.height = 0.24
	node.mesh = mesh
	var material := StandardMaterial3D.new()
	material.albedo_color = Color("efb85f")
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	node.material_override = material
	add_child(node)

func step(delta: float) -> void:
	if expired: return
	if not session.runtime.warning_available(warning_info()):
		# Cancel an uncommunicable hidden threat rather than delivering unseen damage.
		expired = true
		hide()
		queue_free()
		return
	var a := global_position
	var travel := minf(speed * delta, reach - distance)
	var b := a + direction * travel
	var query := PhysicsShapeQueryParameters3D.new()
	query.shape = shape
	query.transform = Transform3D(Basis.IDENTITY, a)
	query.collision_mask = 1
	var space := get_world_3d().direct_space_state
	var overlapping := not space.intersect_shape(query, 1).is_empty()
	query.motion = b - a
	var fraction := space.cast_motion(query)[0]
	var cover := overlapping or fraction < 1
	var closest := 0.0 if overlapping else travel * fraction if cover else travel + 0.001
	var struck: RigidBody3D
	for body in [session.avatar] + session.animals:
		if not is_instance_valid(body) or body.health.value <= 0: continue
		var center: Vector3 = body.contact_center()
		var half_axis := maxf(0, body.body_height * 0.5 - body.body_radius)
		var points := Geometry3D.get_closest_points_between_segments(a, b, center - Vector3.UP * half_axis, center + Vector3.UP * half_axis)
		var along := a.distance_to(points[0])
		if along < closest and points[0].distance_to(points[1]) <= body.body_radius + 0.12:
			closest = along
			struck = body
	if struck: struck.hurt(damage)
	distance += travel
	if struck or cover or distance >= reach or travel <= 0:
		expired = true
		hide()
		queue_free()
	else:
		global_position = b

func warning_info() -> Dictionary:
	if expired: return {}
	var target_alive: bool = is_instance_valid(victim) and victim.health.value > 0
	return {"source": global_position, "aim": aim, "target": victim if target_alive else null,
		"name": victim_name if target_alive else "locked area", "role": "Mage",
		"action": "shot travelling", "progress": 0.0}
