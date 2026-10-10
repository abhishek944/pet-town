extends RefCounted
var last := -1.0
static func _apply_material(material: ShaderMaterial, amount: float) -> void:
	material.set_shader_parameter("weather_wetness", amount)
func apply(world: Node3D, amount: float) -> void:
	if absf(amount - last) < 0.005: return
	last = amount
	for material in world.terrain.materials: _apply_material(material, amount)
	for material in world.prop_controller.materials.values(): _apply_material(material, amount)
