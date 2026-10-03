extends RefCounted
## Shared exact source ambient irradiance. Does not change mesh/skeleton/animation data.
const NativeMaterial = preload("res://scripts/effects/hemisphere_material.gd")
static var wrapped: Dictionary = {}

static func update(sample: Dictionary) -> void:
	var sky: Color = sample.hSky.srgb_to_linear()
	var ground: Color = sample.hGnd.srgb_to_linear()
	RenderingServer.global_shader_parameter_set("source_hemi_sky", Vector3(sky.r, sky.g, sky.b))
	RenderingServer.global_shader_parameter_set("source_hemi_ground", Vector3(ground.r, ground.g, ground.b))
	RenderingServer.global_shader_parameter_set("source_hemi_energy", float(sample.hI) / PI)

static func apply(root: Node) -> int:
	var count := 0
	if root is MeshInstance3D and root.mesh:
		if root.material_override is StandardMaterial3D:
			root.material_override = wrap_material(root.material_override)
			count += 1
		elif root.material_override == null:
			for surface in root.mesh.get_surface_count():
				var original: Material = root.get_active_material(surface)
				if original is StandardMaterial3D:
					root.set_surface_override_material(surface, wrap_material(original))
					count += 1
	for child in root.get_children():
		count += apply(child)
	return count

static func wrap_material(source: StandardMaterial3D) -> Material:
	if source.shading_mode == BaseMaterial3D.SHADING_MODE_UNSHADED:
		return source
	var key := source.get_instance_id()
	if not wrapped.has(key):
		wrapped[key] = NativeMaterial.create(source)
	return wrapped[key]
