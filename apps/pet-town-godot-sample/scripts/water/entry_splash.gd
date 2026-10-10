extends CPUParticles3D
## One physical impact, synchronized with actor_audio's existing entry transition.
func _ready() -> void:
	emitting = false
	one_shot = true
	amount = 7
	lifetime = 0.65
	explosiveness = 1.0
	local_coords = false
	direction = Vector3.UP
	spread = 65
	initial_velocity_min = 1.1
	initial_velocity_max = 2.0
	gravity = Vector3(0, -6, 0)
	scale_amount_min = 0.6
	scale_amount_max = 1.0
	var sphere := SphereMesh.new()
	sphere.radius = 0.035
	sphere.height = 0.07
	var material := StandardMaterial3D.new()
	material.vertex_color_use_as_albedo = true
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material.albedo_color = Color("c5eee9")
	sphere.material = material
	mesh = sphere
	cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var fade := Gradient.new()
	fade.set_color(0, Color(1, 1, 1, 0.45))
	fade.set_color(1, Color(1, 1, 1, 0))
	color_ramp = fade

func play(at: Vector3) -> void:
	global_position = at
	restart()
	emitting = true
