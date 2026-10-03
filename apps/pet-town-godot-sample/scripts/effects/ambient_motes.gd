extends CPUParticles3D
## Source pollen preset: size .08-.13, warm color, .55 alpha, slow drift.
func _ready() -> void:
	amount = 80
	lifetime = 10.0
	preprocess = 10.0
	local_coords = false
	emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	emission_box_extents = Vector3(15, 2, 15)
	direction = Vector3(1, 0.1, 0.4)
	spread = 35.0
	gravity = Vector3(0, -0.01, 0)
	initial_velocity_min = 0.1
	initial_velocity_max = 0.3
	scale_amount_min = 0.08
	scale_amount_max = 0.13
	var quad := QuadMesh.new()
	quad.size = Vector2.ONE
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	material.billboard_keep_scale = true
	material.albedo_texture = preload("res://scripts/effects/particle_texture.gd").soft_dot()
	material.albedo_color = Color(1.0, 0.88, 0.48, 0.55)
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material.vertex_color_use_as_albedo = true
	quad.material = material
	mesh = quad
	var gradient := Gradient.new()
	gradient.set_color(0, Color(1, 1, 1, 0))
	gradient.add_point(0.2, Color.WHITE)
	gradient.add_point(0.8, Color.WHITE)
	gradient.set_color(gradient.get_point_count() - 1, Color(1, 1, 1, 0))
	color_ramp = gradient
