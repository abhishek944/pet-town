class_name TownShadowBudget
extends RefCounted

## Tiny details cost a shadow draw without adding a useful visible silhouette.
static func disable_tiny_casters(scene_root: Node, max_extent := 1.0) -> int:
	var meshes := scene_root.find_children("*", "MeshInstance3D", true, false)
	if scene_root is MeshInstance3D:
		meshes.append(scene_root)
	var changed := 0
	for candidate in meshes:
		var mesh := candidate as MeshInstance3D
		if mesh.mesh == null or mesh.cast_shadow != GeometryInstance3D.SHADOW_CASTING_SETTING_ON:
			continue
		var bounds := mesh.global_transform * mesh.get_aabb()
		if maxf(bounds.size.x, maxf(bounds.size.y, bounds.size.z)) < max_extent:
			mesh.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			changed += 1
	return changed
