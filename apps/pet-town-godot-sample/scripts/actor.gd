extends "res://scripts/physics/body.gd"

var world: Node3D
var ocean: Node3D
var motion = preload("res://scripts/actor_motion.gd").new()
var view: Node3D
var visual: Node3D
var enabled := true
var animator: Node
var spawn_pending := true
var model_path := "res://assets/explorer.glb"
var pet_light := true
var spawn := Vector3(0, 0.1, 5)

func _ready() -> void:
	configure_body(preload("res://scripts/physics/profiles.gd").pet("explorer"), 2)
	visual = Node3D.new()
	visual.name = "Visual"
	add_child(visual)
	if ResourceLoader.exists(model_path):
		var model = load(model_path).instantiate()
		visual.add_child(model)
		preload("res://scripts/asset_style.gd").apply(model)
		if pet_light: preload("res://scripts/effects/pet_visibility.gd").mark(model)
		animator = load("res://scripts/actor_animation.gd").new()
		visual.add_child(animator)
		animator.configure(model)
	position = spawn

func _physics_process(delta: float) -> void:
	begin_motion()
	if spawn_pending:
		respawn()
		spawn_pending = false
		return
	if ocean and ocean.before_body_step(self, delta):
		if animator:
			animator.set_state(false, false)
			animator.set_motion(0, true, 0)
		return
	motion.step(self,delta)
	submit_motion()
	if ocean: ocean.after_body_step(self)
	if animator:
		animator.set_state(motion.gliding,motion.swimming,motion.diving)
		animator.set_motion(Vector2(linear_velocity.x - support_velocity.x, linear_velocity.z - support_velocity.z).length(), is_grounded(), linear_velocity.y)
	if position.y < -10:
		respawn()

func respawn() -> void:
	for height in range(15):
		var candidate := spawn + Vector3.UP * height
		if clear_at(candidate):
			relocate(candidate)
			motion = preload("res://scripts/actor_motion.gd").new()
			return
