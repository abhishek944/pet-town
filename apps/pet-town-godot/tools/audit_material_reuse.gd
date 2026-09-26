extends SceneTree

const SCENES := [
	"res://scenes/island_render_sections.scn",
	"res://scenes/reference_gardens_trimmed.scn",
	"res://scenes/town_decorations.tscn",
]

func _initialize() -> void:
	call_deferred("_audit")

func _audit() -> void:
	for path in SCENES:
		var scene := (load(path) as PackedScene).instantiate()
		root.add_child(scene)
		var signatures := {}
		var materials := {}
		var meshes := scene.find_children("*", "MeshInstance3D", true, false)
		for candidate in meshes:
			var mesh := candidate as MeshInstance3D
			if mesh.mesh == null:
				continue
			for surface in mesh.mesh.get_surface_count():
				var material := mesh.get_active_material(surface)
				if material == null:
					continue
				materials[material.get_instance_id()] = true
				var signature := _signature(material)
				if not signatures.has(signature):
					signatures[signature] = {"count": 0, "names": [], "resource_ids": {}}
				var group: Dictionary = signatures[signature]
				group["count"] += 1
				group["resource_ids"][material.get_instance_id()] = true
				if group["names"].size() < 3:
					group["names"].append(String(material.resource_name))
		var repeated := 0
		var biggest: Array[Dictionary] = []
		for group in signatures.values():
			if group["count"] > 1:
				repeated += group["count"] - 1
			biggest.append({"assignments": group["count"], "resources": group["resource_ids"].size(), "name": group["names"][0]})
		biggest.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return a["assignments"] > b["assignments"])
		var repeated_resources := 0
		for group in signatures.values():
			repeated_resources += maxi(0, group["resource_ids"].size() - 1)
		print("MATERIAL_REUSE path=%s mesh_nodes=%d resources=%d signatures=%d repeated_resources=%d repeated_assignments=%d largest=%s" % [path, meshes.size(), materials.size(), signatures.size(), repeated_resources, repeated, biggest.slice(0, mini(3, biggest.size()))])
		scene.free()
	quit()

func _signature(material: Material) -> String:
	var parts: Array[String] = [material.get_class()]
	for info in material.get_property_list():
		if int(info["usage"]) & PROPERTY_USAGE_STORAGE == 0:
			continue
		var name := String(info["name"])
		if name in ["resource_path", "resource_local_to_scene"]:
			continue
		parts.append(name + "=" + var_to_str(material.get(name)))
	return "|".join(parts)
