class_name TownPreview
extends RefCounted

static func create(model: Node3D, dimensions := Vector2(172, 150)) -> SubViewportContainer:
	var container := SubViewportContainer.new()
	container.custom_minimum_size = dimensions
	container.stretch = true
	container.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var viewport := SubViewport.new()
	viewport.size = Vector2i(maxi(160, int(dimensions.x * 1.5)), maxi(140, int(dimensions.y * 1.5)))
	viewport.world_3d = World3D.new()
	viewport.transparent_bg = false
	viewport.render_target_update_mode = SubViewport.UPDATE_ONCE
	container.add_child(viewport)
	var environment := WorldEnvironment.new()
	var sky := Environment.new()
	sky.background_mode = Environment.BG_COLOR
	sky.background_color = Color("26392f")
	sky.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	sky.ambient_light_color = Color("cce1c3")
	sky.ambient_light_energy = 0.8
	environment.environment = sky
	viewport.add_child(environment)
	var root := Node3D.new()
	viewport.add_child(root)
	root.add_child(model)
	var bounds := _bounds(model)
	root.position = -bounds.get_center()
	var span := maxf(maxf(bounds.size.x, maxf(bounds.size.y, bounds.size.z)) * 1.5, 0.8)
	var camera := Camera3D.new()
	camera.current = true
	camera.fov = 38.0
	viewport.add_child(camera)
	camera.look_at_from_position(Vector3(span * 0.8, span * 0.54, span * 1.7), Vector3.ZERO, Vector3.UP)
	var key_light := DirectionalLight3D.new()
	key_light.rotation_degrees = Vector3(-42, -34, 0)
	key_light.light_color = Color("ffe1b2")
	key_light.light_energy = 1.65
	viewport.add_child(key_light)
	var fill := OmniLight3D.new()
	fill.position = Vector3(-span, span, span)
	fill.light_color = Color("b4d7bd")
	fill.light_energy = 1.2
	viewport.add_child(fill)
	return container

static func _bounds(model: Node3D) -> AABB:
	var result := AABB()
	var found := false
	for candidate in model.find_children("*", "MeshInstance3D", true, false):
		var mesh := candidate as MeshInstance3D
		if mesh.mesh == null:
			continue
		var relative := Transform3D.IDENTITY
		var current: Node = mesh
		while current is Node3D and current != model:
			relative = (current as Node3D).transform * relative
			current = current.get_parent()
		var piece := relative * mesh.get_aabb()
		result = piece if not found else result.merge(piece)
		found = true
	return result if found else AABB(Vector3(-1, -1, -1), Vector3(2, 2, 2))
