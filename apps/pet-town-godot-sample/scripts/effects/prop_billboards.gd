extends Node3D
## Animated source campfire billboards and chimney-smoke particles.
var particles: Array[Dictionary] = []
var clock := 0.0
var night := 0.0

func setup_flames(data: Array, texture: Texture2D) -> void:
	if data.is_empty():
		data = [{"x": 0, "z": 0.02, "sc": 1.5, "ph": 0}, {"x": -0.14, "z": 0.07, "sc": 1.05, "ph": 1}, {"x": 0.12, "z": -0.08, "sc": 0.95, "ph": 2}]
	for value in data:
		var record: Dictionary = value.duplicate()
		record.mesh = _quad(texture, true)
		record.kind = "flame"
		particles.append(record)

func setup_smoke(manifest: Dictionary) -> void:
	var path := "res://assets/" + String(manifest.get("smokeTexture", "region-smoke.png"))
	if not ResourceLoader.exists(path):
		return
	var texture: Texture2D = load(path)
	for chimney in manifest.get("smoke", []):
		var origin: Array = chimney.origin
		for particle in chimney.particles:
			var record: Dictionary = particle.duplicate()
			record.origin = Vector3(origin[0], origin[1], origin[2])
			record.mesh = _quad(texture, false)
			record.kind = "smoke"
			particles.append(record)

func _quad(texture: Texture2D, flame: bool) -> MeshInstance3D:
	var result := MeshInstance3D.new()
	result.mesh = QuadMesh.new()
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR if flame else BaseMaterial3D.TRANSPARENCY_ALPHA
	material.alpha_scissor_threshold = 0.45
	material.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	material.cull_mode = BaseMaterial3D.CULL_DISABLED
	material.albedo_texture = texture
	result.material_override = material
	result.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(result)
	return result

func _process(delta: float) -> void:
	clock += delta
	for record in particles:
		if record.kind == "flame":
			_flame(record)
		else:
			_smoke(record, delta)

func _flame(record: Dictionary) -> void:
	var phase := float(record.ph)
	var size := float(record.sc)
	var height := size * (1.15 + sin(clock * 3.4 + phase) * 0.2 + sin(clock * 11 + phase) * 0.05)
	var width := size * 0.62 * (1.0 + sin(clock * 5.1 + phase) * 0.1)
	var mesh: MeshInstance3D = record.mesh
	mesh.position = Vector3(float(record.x) + sin(clock * 2.1 + phase) * 0.02, 0.02 + height * 0.5, float(record.z))
	mesh.mesh.size = Vector2(width, height)
	mesh.material_override.albedo_color = Color(lerpf(0.74, 0.72, night), lerpf(0.68, 0.62, night), lerpf(0.36, 0.3, night))

func _smoke(record: Dictionary, delta: float) -> void:
	record.age = fposmod(float(record.age) + delta, float(record.life))
	var age := float(record.age)
	var phase := age / float(record.life)
	var drift := 0.35 + 0.15 * sin(clock * 0.13)
	var rise := age * 0.75 - age * age * 0.035
	var sway := sin(clock * 0.9 + float(record.rot) * 10) * 0.15 * phase
	var mesh: MeshInstance3D = record.mesh
	mesh.position = record.origin + Vector3(float(record.dx) + drift * age * phase + sway, rise, float(record.dz) + 0.12 * age * phase)
	mesh.mesh.size = Vector2.ONE * lerpf(0.3, 2.4, pow(phase, 0.7))
	var opacity := smoothstep(0.0, 1.0, phase / 0.14) * pow(1.0 - phase, 1.4) * lerpf(0.6, 0.45, night)
	var shade := lerpf(0.97, 0.16, night)
	mesh.material_override.albedo_color = Color(shade, shade * 0.985, shade * 0.97, opacity)
