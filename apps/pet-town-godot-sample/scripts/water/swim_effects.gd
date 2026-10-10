extends Node3D
## World-anchored round bubbles and motion-only wakes; no nighttime emitter.
var world: Node3D
var actor: RigidBody3D
var bubbles: MultiMeshInstance3D
var particles: Array[Dictionary] = []
var reduced_motion := false
var previous_actor: RigidBody3D
var previous_position := Vector3.INF
var wake_in := 0.0
var bubble_in := 0.0

func setup(owner_world: Node3D) -> void:
	world = owner_world
	bubbles = MultiMeshInstance3D.new()
	var instances := MultiMesh.new()
	instances.transform_format = MultiMesh.TRANSFORM_3D
	instances.use_colors = true
	var quad := QuadMesh.new()
	quad.size = Vector2.ONE * 0.075
	var material := StandardMaterial3D.new()
	material.vertex_color_use_as_albedo = true
	material.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material.albedo_color = Color("c5eee9")
	# A soft circular rim with transparent corners, depth tested and non-emissive.
	var image := Image.create(32, 32, false, Image.FORMAT_RGBA8)
	for y in 32:
		for x in 32:
			var radius := (Vector2(x, y) - Vector2(15.5, 15.5)).length() / 15.5
			var alpha := (1.0 - smoothstep(0.78, 1.0, radius)) * lerpf(0.12, 0.7, smoothstep(0.45, 0.8, radius))
			image.set_pixel(x, y, Color(1, 1, 1, alpha))
	material.albedo_texture = ImageTexture.create_from_image(image)
	quad.material = material
	instances.mesh = quad
	instances.instance_count = 10
	instances.visible_instance_count = 0
	bubbles.multimesh = instances
	bubbles.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(bubbles)

func update(delta: float, _night: float) -> void:
	if not is_instance_valid(actor):
		particles.clear()
		bubbles.multimesh.visible_instance_count = 0
		return
	var point := actor.position
	var switched := actor != previous_actor or point.distance_to(previous_position) > 4.0
	var travel := Vector2(point.x - previous_position.x, point.z - previous_position.z).length() if not switched else 0.0
	previous_actor = actor
	previous_position = point
	if switched or reduced_motion:
		particles.clear()
		wake_in = 0.4
		bubble_in = 0.3
	wake_in = maxf(0, wake_in - delta)
	bubble_in = maxf(0, bubble_in - delta)
	var surface: float = world.water_at(point)
	var motion = actor.get("motion")
	var swimming: bool = motion != null and motion.swimming and actor.enabled
	if swimming and not reduced_motion:
		if travel > delta * 0.25 and point.y + 1.2 >= surface and wake_in <= 0:
			world.effects.add_ripple(point, 0.45)
			wake_in = 0.45
		if point.y + 1.2 < surface and bubble_in <= 0 and particles.size() < 10:
			particles.append({"at":point + Vector3(randf_range(-0.18, 0.18), 0.7, randf_range(-0.18, 0.18)), "age":0.0, "life":randf_range(1.1, 1.8)})
			bubble_in = 0.3
	for index in range(particles.size() - 1, -1, -1):
		var bubble := particles[index]
		bubble.age += delta
		bubble.at.y += delta * 0.65
		var top: float = world.water_at(bubble.at)
		if bubble.age >= bubble.life or bubble.at.y >= top - 0.12 or world.ground_at(bubble.at) >= bubble.at.y:
			particles.remove_at(index)
	bubbles.multimesh.visible_instance_count = particles.size()
	for index in particles.size():
		var bubble := particles[index]
		var alpha: float = smoothstep(0, 0.15, bubble.age) * (1.0 - smoothstep(0.55, 1.0, bubble.age / bubble.life)) * 0.5
		bubbles.multimesh.set_instance_transform(index, Transform3D(Basis.IDENTITY, bubble.at))
		bubbles.multimesh.set_instance_color(index, Color(1, 1, 1, alpha))
