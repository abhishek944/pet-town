extends RefCounted
# Cover, rain, hail, wind strength, mist, light attenuation.
const VALUES := {"clear":[0.08,0.0,0.0,0.24,0.0,1.0], "cloudy":[0.78,0.0,0.0,0.35,0.1,0.7],
	"light_rain":[0.74,0.3,0.0,0.42,0.15,0.66], "heavy_rain":[0.92,0.9,0.0,0.65,0.3,0.5],
	"thunderstorm":[0.98,1.0,0.0,0.9,0.34,0.38], "hailstorm":[0.9,0.18,0.85,0.72,0.25,0.48],
	"windy":[0.4,0.0,0.0,1.15,0.06,0.86], "mist":[0.62,0.0,0.0,0.12,0.85,0.74]}
static func sample(kind: String) -> Dictionary:
	var v: Array = VALUES[kind]
	return {"cloud_cover":v[0], "rain_amount":v[1], "hail_amount":v[2], "wind_strength":v[3], "mist":v[4], "light":v[5]}
