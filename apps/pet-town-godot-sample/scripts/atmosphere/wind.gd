extends RefCounted
static func apply(world: Node3D, effect: Dictionary) -> void:
	var wind: Vector3 = effect.wind
	for material in world.vegetation.materials:
		material.set_shader_parameter("weather_wind", Vector3(wind.x, wind.z, effect.gust))
		material.set_shader_parameter("weather_wind_time", effect.wind_seconds)
		material.set_shader_parameter("weather_motion", 0.55 if effect.reduced_motion else 1.0)
