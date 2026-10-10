extends Node3D
## Original day-cycle keyframes and sun orbit, with native Godot lighting.
var environment: Environment
var sunlight: DirectionalLight3D
var sky_material: ShaderMaterial
var time_of_day := 0.38
var sample: Dictionary = {}
var base_sample: Dictionary = {}
var keys: Array = []
var last_update_msec := -1000
var cloud_tick := -1
var cloud_offset := Vector2.ZERO
var cloud_velocity := Vector2(0.24,0.1)
var weather_sky_msec := -1000
var atmosphere_controlled := false

func setup(manifest: Dictionary) -> void:
	keys = JSON.parse_string(FileAccess.get_file_as_string("res://scripts/effects/daylight_keys.json"))
	var holder := WorldEnvironment.new()
	environment = Environment.new()
	holder.environment = environment
	environment.background_mode = Environment.BG_SKY
	environment.tonemap_mode = Environment.TONE_MAPPER_LINEAR
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	# The source scene has a HemisphereLight but no environment map / IBL.
	environment.reflected_light_source = Environment.REFLECTION_SOURCE_DISABLED
	environment.ambient_light_sky_contribution = 0.0
	environment.sky = Sky.new()
	environment.sky.radiance_size = Sky.RADIANCE_SIZE_128
	environment.sky.process_mode = Sky.PROCESS_MODE_INCREMENTAL
	sky_material = ShaderMaterial.new()
	sky_material.shader = load("res://shaders/effects/sky.gdshader")
	environment.sky.sky_material = sky_material
	add_child(holder)
	sunlight = DirectionalLight3D.new()
	sunlight.shadow_enabled = true
	sunlight.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_4_SPLITS
	sunlight.directional_shadow_max_distance = 100.0
	sunlight.shadow_bias = 0.025
	sunlight.shadow_normal_bias = 0.6
	# Godot's low PCF kernel radius is 2 texels; source Three PCF radius is 2.4.
	RenderingServer.directional_soft_shadow_filter_set_quality(RenderingServer.SHADOW_QUALITY_SOFT_LOW)
	sunlight.shadow_blur = 1.2
	sunlight.light_angular_distance = 0.0
	add_child(sunlight)
	set_time_of_day(float(manifest.get("timeOfDay", 0.38)))

func set_time_of_day(value: float) -> bool:
	var now := Time.get_ticks_msec()
	if now - last_update_msec < 250 and absf(value - time_of_day) < 0.01:
		return false
	last_update_msec = now
	time_of_day = fposmod(value, 1.0)
	if keys.is_empty():
		return false
	var index := keys.size() - 1
	for i in keys.size():
		if float(keys[i].t) <= time_of_day:
			index = i
	var left: Dictionary = keys[index]
	var right: Dictionary = keys[(index + 1) % keys.size()]
	var duration := fposmod(float(right.t) - float(left.t), 1.0)
	var weight := smoothstep(0.0, 1.0, fposmod(time_of_day - float(left.t), 1.0) / duration)
	for key in ["zenith", "mid", "horizon", "sunHz", "glow", "cLit", "cShade", "sun", "hSky", "hGnd"]:
		sample[key] = _color(left[key]).lerp(_color(right[key]), weight)
	for key in ["sunI", "hI", "exp", "stars", "fogN", "fogF", "glowK"]:
		sample[key] = lerpf(float(left[key]), float(right[key]), weight)
	var elevation := deg_to_rad(64.0) * (sin(TAU * (time_of_day - 0.25)) + 0.1) / 1.1
	var angle := TAU * (time_of_day - 0.25)
	var horizontal := Vector3(1, 0, 0.3).normalized() * cos(angle) + Vector3(-0.3, 0, 1).normalized() * sin(angle)
	var direction := horizontal * cos(elevation) + Vector3.UP * sin(elevation)
	sample.sun_direction = direction
	sample.sun_elevation = direction.y
	sample.sun_elevation_radians = elevation
	sunlight.rotation = Vector3(-maxf(elevation, deg_to_rad(18)), atan2(horizontal.x, horizontal.z), 0)
	base_sample = sample.duplicate()
	if not atmosphere_controlled: apply_sample(sample)
	return true

func apply_sample(value: Dictionary) -> void:
	sample = value
	var direction: Vector3 = sample.sun_direction
	var elevation: float = sample.sun_elevation_radians
	sunlight.light_color = sample.sun
	sunlight.light_energy = float(sample.sunI)/PI
	sunlight.shadow_opacity = lerpf(0.72, 0.85, smoothstep(0.12, 0.45, elevation)) if elevation > -0.035 else 0.6
	environment.tonemap_exposure = 1.0
	environment.ambient_light_color = sample.hSky
	environment.ambient_light_energy = float(sample.hI)/PI
	preload("res://scripts/effects/hemisphere.gd").update(sample)
	cloud_velocity = sample.get("cloud_wind",Vector2(0.24,0.1))
	var now := Time.get_ticks_msec()
	if now - weather_sky_msec < 250: return
	weather_sky_msec = now
	for key in ["zenith", "mid", "horizon", "sunHz", "glow", "cLit", "cShade"]:
		sky_material.set_shader_parameter(key, sample[key])
	sky_material.set_shader_parameter("sun_direction", direction)
	sky_material.set_shader_parameter("exposure", sample.exp)
	sky_material.set_shader_parameter("stars", sample.stars)
	sky_material.set_shader_parameter("glow_strength", sample.glowK)
	var sun_color: Color = sample.sun.srgb_to_linear()
	var disc_energy := lerpf(3.2, 32.0, smoothstep(0.06, 0.5, elevation)) * smoothstep(-0.06, 0.0, elevation) / float(sample.exp)
	sky_material.set_shader_parameter("sun_disc", Vector3(sun_color.r, sun_color.g, sun_color.b) * disc_energy)
	sky_material.set_shader_parameter("sun_size", lerpf(0.036, 0.027, smoothstep(0.0, 0.35, elevation)))
	sky_material.set_shader_parameter("cloud_cover", sample.get("cloud_cover", 0.08))
	sky_material.set_shader_parameter("sun_visibility", sample.get("sun_visibility",1.0))

func _process(delta: float) -> void:
	cloud_offset += cloud_velocity * delta * 0.012
	var tick := int(Time.get_ticks_msec() / 250)
	if tick != cloud_tick and sky_material:
		cloud_tick = tick
		sky_material.set_shader_parameter("cloud_offset", cloud_offset)

func _color(value: int) -> Color:
	return Color.hex((value << 8) | 255)
