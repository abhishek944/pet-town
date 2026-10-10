extends RefCounted
## One native visibility decision per detail boundary, shared by the whole batch.

static func link(levels: Array) -> void:
	if levels.size() < 2: return
	var bounds: AABB = levels[0].get_aabb()
	for level: MultiMeshInstance3D in levels:
		bounds = bounds.merge(level.get_aabb())
	for index in levels.size():
		var level: MultiMeshInstance3D = levels[index]
		# Simplified meshes have slightly different extents. Use one distance origin.
		level.custom_aabb = bounds
		if index + 1 < levels.size():
			# Independent end/start hysteresis can hide both levels after a camera
			# jump. Let the coarser level's close-range state select this level.
			level.visibility_range_end = 0
			level.visibility_parent = level.get_path_to(levels[index + 1])
