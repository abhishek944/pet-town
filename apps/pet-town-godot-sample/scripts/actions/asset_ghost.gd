extends Node3D
## Noncolliding, nonpersistent preview of an already validated library candidate.
var host: Node3D
var model: Node3D
var asset_id := ""

func present(entry: Dictionary, point: Vector3, yaw: float) -> void:
	if not _allowed():
		clear()
		return
	var id := str(entry.get("id", ""))
	if id != asset_id or not is_instance_valid(model):
		clear()
		var path := str(entry.get("path", ""))
		if path.is_empty() or not ResourceLoader.exists(path): return
		var scene = load(path)
		if not scene is PackedScene: return
		var instance = scene.instantiate()
		if not instance is Node3D or not _drawable(instance):
			instance.queue_free()
			return
		model = instance
		model.process_mode = Node.PROCESS_MODE_DISABLED
		# Prop styling writes ArrayMesh material slots. Isolate those slots first.
		isolate_meshes(model)
		add_child(model)
		host.sample.world.prop_controller.apply_materials(model)
		make_passive(model)
		model.position = -entry.get("origin", Vector3.ZERO)
		asset_id = id
	position = point
	rotation.y = yaw
	show()

func sync_visibility() -> void:
	if not _allowed(): clear()

func _allowed() -> bool:
	return is_instance_valid(host) and is_instance_valid(host.sample) and is_instance_valid(host.sample.hud) and host.sample.hud.active_panel == "Asset library" and host.sample.hud.root.is_visible_in_tree() and not host.save_blocked

func clear() -> void:
	hide()
	asset_id = ""
	if is_instance_valid(model):
		remove_child(model)
		model.queue_free()
	model = null

func isolate_meshes(node: Node) -> void:
	if node is MeshInstance3D and node.mesh: node.mesh = node.mesh.duplicate()
	for child in node.get_children(): isolate_meshes(child)

func make_passive(node: Node) -> void:
	if node is GeometryInstance3D:
		node.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	if node is MeshInstance3D and node.mesh:
		for surface in node.mesh.get_surface_count():
			var material: Material = node.get_active_material(surface)
			if material is ShaderMaterial:
				var faded := material.duplicate() as ShaderMaterial
				faded.shader = preload("res://shaders/props/transparent.gdshader")
				faded.set_shader_parameter("surface_opacity", 0.4)
				node.set_surface_override_material(surface, faded)
			elif material is StandardMaterial3D:
				var faded := material.duplicate() as StandardMaterial3D
				faded.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
				faded.albedo_color.a *= 0.4
				node.set_surface_override_material(surface, faded)
	if node is CollisionObject3D:
		node.collision_layer = 0
		node.collision_mask = 0
	if node is Light3D: node.hide()
	for child in node.get_children(): make_passive(child)

func _drawable(node: Node) -> bool:
	if node is MeshInstance3D and node.mesh and node.mesh.get_surface_count() > 0: return true
	for child in node.get_children():
		if _drawable(child): return true
	return false
