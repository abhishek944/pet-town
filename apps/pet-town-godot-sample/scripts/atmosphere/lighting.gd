extends RefCounted
static func compose(base: Dictionary, effect: Dictionary) -> Dictionary:
	var result := base.duplicate()
	var cover := float(effect.cloud_cover)
	var attenuation := float(effect.light)
	var night := float(base.stars)
	for key in ["zenith","mid","horizon","cLit","cShade"]:
		var tone := Color("687d8b").lerp(Color("202d42"), night)
		result[key] = base[key].lerp(tone, cover * (0.48 if key == "horizon" else 0.65))
	result.sunI = float(base.sunI) * attenuation + float(effect.flash) * 0.55
	result.hI = float(base.hI) * lerpf(1.0, 0.85, cover) + float(effect.flash) * 0.35
	result.hSky = base.hSky.lerp(Color("a4b4c2"), float(effect.flash) * 0.25)
	result.stars = float(base.stars) * (1.0 - cover * 0.9)
	# Preserve the astronomical night factor independently of cloud-obscured stars.
	result.night = night
	result.fogN = lerpf(float(base.fogN), 12.0, float(effect.mist))
	result.fogF = lerpf(float(base.fogF), 80.0, float(effect.mist))
	result.cloud_cover = cover
	result.cloud_wind = Vector2(effect.wind.x, effect.wind.z)
	result.sun_visibility = 1.0 - cover * 0.9
	return result
