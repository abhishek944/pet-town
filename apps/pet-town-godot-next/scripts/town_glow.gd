class_name TownGlow
extends RefCounted

static var warm_material: StandardMaterial3D

static func decorate(model: Node3D, definition: Dictionary) -> void:
	if warm_material == null:
		warm_material = StandardMaterial3D.new()
		warm_material.albedo_color = Color("ffdda2")
		warm_material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		warm_material.emission_enabled = true
		warm_material.emission = Color("ffba64")
		warm_material.emission_energy_multiplier = 2.2
	for candidate in model.find_children("*", "MeshInstance3D", true, false):
		var mesh := candidate as MeshInstance3D
		var label := String(mesh.name).to_lower()
		if _is_glowing_part(label):
			mesh.material_override = warm_material
	var category := String(definition.get("category", ""))
	if category in ["Homes", "Shops", "Lights"]:
		var lamp := OmniLight3D.new()
		lamp.name = "WarmGlow"
		lamp.light_color = Color("ffcb85")
		lamp.light_energy = 1.25 if category == "Lights" else 0.48
		lamp.omni_range = 5.5 if category == "Lights" else 5.0
		lamp.shadow_enabled = false
		lamp.position.y = float(definition.get("height", 2.0)) * (0.77 if category == "Lights" else 0.42)
		model.add_child(lamp)
	if String(definition.get("id", "")) == "lighthouse":
		var beacon := preload("res://scripts/lighthouse_beacon.gd").new() as Node3D
		beacon.name = "LighthouseBeacon"
		beacon.position.y = float(definition.get("height", 10.94)) * 0.9
		model.add_child(beacon)

static func _is_glowing_part(label: String) -> bool:
	for word in ["warm pane", "display glass", "keeper window", "glazed front", "lantern glass", "lantern pane", "festoon bulb", "fire flame", "beacon glass", "windmill window"]:
		if word in label:
			return true
	return false
