extends Node

var model: Node3D
var player: AnimationPlayer
var joints := {}
var rest := {}
var speed := 0.0
var grounded := true
var vertical := 0.0
var phase := 0.0
var amount := 0.0
var gliding := false
var swimming := false
var diving := false

func configure(root: Node3D) -> void:
	model = root
	_collect(root)
	if player:
		for clip in ["idle", "walk", "run", "glide", "swim"]:
			if player.has_animation(clip):
				player.get_animation(clip).loop_mode = Animation.LOOP_LINEAR

func _collect(node: Node) -> void:
	if node is AnimationPlayer:
		player = node
	if node is Node3D:
		joints[str(node.name)] = node
		rest[str(node.name)] = node.transform
	for child in node.get_children():
		_collect(child)

func set_motion(value: float, on_ground: bool, y_speed: float) -> void:
	speed = value
	grounded = on_ground
	vertical = y_speed

func set_state(is_gliding: bool, is_swimming: bool, is_diving: bool = false) -> void:
	gliding = is_gliding
	swimming = is_swimming
	diving = is_diving

func _process(delta: float) -> void:
	if not model:
		return
	if player and player.has_animation("walk"):
		var clip := "run" if speed > 4.5 else "walk" if speed > 0.2 else "idle"
		if (swimming or diving) and player.has_animation("swim"):
			clip = "swim"
		elif gliding and player.has_animation("glide"):
			clip = "glide"
		elif not grounded and player.has_animation("jump"):
			clip = "jump"
		if player.current_animation != clip and player.has_animation(clip):
			player.play(clip, 0.15)
		player.speed_scale = clampf(speed / 2.2, 0.6, 1.8) if clip == "walk" else 1.0
		if clip == "run":
			player.speed_scale = clampf(speed / 5.2, 0.6, 1.8)
		elif clip == "swim":
			player.speed_scale = (3.2 + speed * 1.6) / (3.2 + 2.2 * 1.6)
		return
	amount = move_toward(amount, clampf(speed / 4.2, 0, 1.4) if grounded else 0.0, delta * 6)
	phase += delta * (5 + speed * 1.6)
	for part in ["legL", "legR", "armL", "armR"]:
		if not joints.has(part):
			continue
		var joint: Node3D = joints[part]
		joint.transform = rest[part]
		var sign_value := -1.0 if part in ["legL", "armR"] else 1.0
		joint.rotate_x(sin(phase) * sign_value * amount * 0.55)
	if joints.has("hips"):
		var hips: Node3D = joints.hips
		hips.transform = rest.hips
		hips.position.y += absf(sin(phase)) * amount * 0.035
