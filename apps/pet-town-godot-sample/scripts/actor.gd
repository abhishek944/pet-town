extends CharacterBody3D

var world: Node3D
var ocean: Node3D
var motion = preload("res://scripts/actor_motion.gd").new()
var view: Node3D
var visual: Node3D
var enabled := true
var animator: Node
var spawn_pending := true
var spawn := Vector3(0, 0.1, 5)

func _ready() -> void:
	collision_layer = 2
	collision_mask = 1
	floor_snap_length = 0.25
	floor_max_angle = deg_to_rad(55)
	var shape := CapsuleShape3D.new()
	shape.radius = 0.27
	shape.height = 1.42
	var collider := CollisionShape3D.new()
	collider.shape = shape
	collider.position.y = 0.71
	add_child(collider)
	visual = Node3D.new()
	visual.name = "Visual"
	add_child(visual)
	var model_path := "res://assets/explorer.glb"
	if ResourceLoader.exists(model_path):
		var model = load(model_path).instantiate()
		visual.add_child(model)
		preload("res://scripts/asset_style.gd").apply(model)
		preload("res://scripts/effects/pet_visibility.gd").mark(model)
		animator = load("res://scripts/actor_animation.gd").new()
		visual.add_child(animator)
		animator.configure(model)
	position = spawn

func _physics_process(delta: float) -> void:
	if spawn_pending:
		respawn()
		spawn_pending = false
	if ocean and ocean.before_body_step(self, delta):
		if animator:
			animator.set_state(false, false)
			animator.set_motion(0, true, 0)
		return
	motion.step(self,delta)
	move_and_slide()
	if ocean: ocean.after_body_step(self)
	if animator:
		animator.set_state(motion.gliding,motion.swimming,motion.diving)
		animator.set_motion(Vector2(velocity.x, velocity.z).length(), is_on_floor(), velocity.y)
	if position.y < -10:
		respawn()

func respawn() -> void:
	var query := PhysicsShapeQueryParameters3D.new()
	var shape := CapsuleShape3D.new()
	shape.radius = 0.271
	shape.height = 1.422
	query.shape = shape
	query.collision_mask = 1
	for height in range(15):
		var candidate := spawn + Vector3.UP * height
		query.transform.origin = candidate + Vector3.UP * 0.73
		if get_world_3d().direct_space_state.intersect_shape(query, 1).is_empty():
			position = candidate
			break
	velocity = Vector3.ZERO
	reset_physics_interpolation()
