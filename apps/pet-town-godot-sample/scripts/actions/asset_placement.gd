extends Node3D

const Safe = preload("safe_placement.gd")
const Save = preload("save_file.gd")
const PATH := "user://region-assets.json"
var sample: Node3D
var catalog := {}
var placed: Array = []
var records: Array = []
var save_blocked := false
var lighting_delay := 0.0
var replacements: Node3D
var ghost := preload("asset_ghost.gd").new()

func setup(value: Node3D, source: Array) -> void:
	sample = value
	catalog = preload("asset_catalog.gd").build(sample.world.manifest, source)
	replacements = preload("asset_replacements.gd").new()
	add_child(replacements)
	replacements.setup(self)
	ghost.host = self
	add_child(ghost)
	sample.hud.set_asset_catalog(catalog.values())
	restore.call_deferred()

func preview(id: String, yaw: float, distance: float) -> void:
	var check := candidate(id, yaw, distance)
	if check.has("error"):
		ghost.clear()
		sample.hud.set_asset_placement_result(check.error, false)
	else:
		ghost.present(catalog[id], check.position, yaw)
		var p: Vector3 = check.position
		sample.hud.set_asset_placement_result("Clear, level ground · %.1f, %.1f · Ready to place" % [p.x, p.z], true)

func candidate(id: String, yaw: float, distance: float) -> Dictionary:
	if not catalog.has(id) or save_blocked:
		return {"error": "The saved asset file needs attention before adding another asset."}
	var entry: Dictionary = catalog[id]
	var forward: Vector3 = -sample.rig.global_basis.z
	forward.y = 0
	var aim: Vector3 = sample.actor.global_position + forward.normalized() * clampf(distance, 5, 24)
	var fitted := Safe.ground_fit(sample.world, aim, entry.hw, entry.hd, yaw + entry.source_angle)
	if fitted.has("error"):
		return fitted
	if not Safe.approach_clear(sample.world, fitted.position, entry.hw, entry.hd, yaw + entry.source_angle):
		return {"error": "Keep footpaths and entrance approaches clear. Choose a more open patch."}
	if not clearance(entry, fitted.position, yaw):
		return {"error": "This spot overlaps your explorer, a tree, a build, or another asset. Choose a clear patch."}
	return fitted

func place(id: String, yaw: float, distance: float) -> void:
	var fitted := candidate(id, yaw, distance)
	if fitted.has("error"):
		result(fitted.error)
		return
	var entry: Dictionary = catalog[id]
	var point: Vector3 = fitted.position
	var record := {"id": id, "position": [point.x, point.y, point.z], "yaw": yaw}
	if records.size() + replacements.records.size() >= 128:
		result("Your asset library can hold 128 placed or replaced objects.")
		return
	var next: Array = records.duplicate(true)
	next.append(record)
	if not Save.write(PATH, {"version": 1, "assets": next, "replacements": replacements.records}):
		result("The asset could not be saved. Check storage and try again.")
		return
	replacements.remember()
	records = next
	ghost.clear()
	placed.append(create_asset(entry, point, yaw))
	sample.hud.set_asset_placement_result(entry.name + " added. Walk over and make yourself at home.", false)

func clearance(entry: Dictionary, point: Vector3, yaw: float, include_actor := true) -> bool:
	if not Safe.clear_box(sample.world, point, entry.hw, entry.hd, entry.height, yaw + entry.source_angle, include_actor):
		return false
	# Also cover placements created this frame, before physics registers them.
	var radius: float = Vector2(entry.hw, entry.hd).length()
	for object in placed:
		if not is_instance_valid(object) or not object.visible:
			continue
		var delta: Vector3 = object.position - point
		if absf(delta.y) < entry.height + object.get_meta("height") and Vector2(delta.x, delta.z).length() < radius + float(object.get_meta("radius")):
			return false
	return true

func create_asset(entry: Dictionary, point: Vector3, yaw: float) -> Node3D:
	var wrapper := Node3D.new()
	wrapper.name = str(entry.name).validate_node_name()
	wrapper.position = point
	wrapper.rotation.y = yaw
	wrapper.set_meta("radius", Vector2(entry.hw, entry.hd).length())
	wrapper.set_meta("height", entry.height)
	add_child(wrapper)
	var model: Node3D = load(entry.path).instantiate()
	model.position = -entry.origin
	wrapper.add_child(model)
	sample.world.prop_controller.apply_materials(model)
	sample.world.add_mesh_collision(wrapper)
	for light_point in entry.lights:
		var light := OmniLight3D.new()
		light.position = Vector3(light_point.x, light_point.y, light_point.z) - entry.origin
		light.light_color = Color("ffd494")
		light.light_energy = 0.5
		light.omni_range = 4.5
		wrapper.add_child(light)
	return wrapper

func undo() -> void:
	replacements.undo()

func restore() -> void:
	await get_tree().physics_frame
	await get_tree().physics_frame
	var saved := Save.read(PATH)
	if saved.has("error"):
		save_blocked = true
		sample.hud.show_toast(saved.error)
		return
	var data: Dictionary = saved.value
	if data.is_empty():
		return
	if data.get("version") != 1 or not data.get("assets") is Array:
		save_blocked = true
		sample.hud.show_toast("Saved assets could not be restored. The file has been kept.")
		return
	if data.has("replacements") and not data.replacements is Array:
		save_blocked = true
		result("Saved asset replacements could not be restored. The file has been kept.")
		return
	replacements.records = data.get("replacements", [])
	for record in data.assets:
		if not record is Dictionary or not catalog.has(record.get("id", "")) or not valid_record(record):
			save_blocked = true
			continue
		var point := Vector3(record.position[0], record.position[1], record.position[2])
		var entry: Dictionary = catalog[record.id]
		var fitted := Safe.ground_fit(sample.world, point, entry.hw, entry.hd, record.yaw + entry.source_angle)
		var supported: bool = not fitted.has("error") and absf(point.y - fitted.position.y) < 0.2
		records.append(record)
		var restored := create_asset(entry, point, record.yaw)
		placed.append(restored)
		if not supported:
			restored.hide()
			preload("asset_support.gd").collision(restored, false)
	replacements.rebuild()
	if not placed.is_empty():
		await get_tree().physics_frame
		sample.actor.respawn()
	if save_blocked:
		sample.hud.show_toast("Some saved assets could not fit safely. The save is preserved; reset to start fresh.")

func valid_record(record: Dictionary) -> bool:
	if not record.get("position") is Array or record.position.size() != 3 or not (record.get("yaw") is float or record.get("yaw") is int):
		return false
	for coordinate in record.position:
		if not (coordinate is int or coordinate is float) or not is_finite(float(coordinate)):
			return false
	return is_finite(record.yaw) and absf(record.yaw) <= TAU + 0.01

func reset() -> void:
	if not Save.write(PATH, {"version": 1, "assets": []}):
		result("The asset reset could not be saved. Your assets have been kept.")
		return
	ghost.clear()
	for object in placed:
		remove_child(object)
		object.queue_free()
	placed.clear()
	records.clear()
	replacements.records.clear()
	replacements.history.clear()
	replacements.rebuild()
	save_blocked = false

func result(message: String) -> void:
	sample.hud.set_asset_result(message)

func _process(delta: float) -> void:
	ghost.sync_visibility()
	lighting_delay -= delta
	if not sample or lighting_delay > 0:
		return
	lighting_delay = 0.5
	preload("asset_support.gd").update(self)
	replacements.update_support()
	if sample.hud.has_method("set_asset_targets") and sample.hud.active_panel == "Asset library": sample.hud.set_asset_targets(replacements.targets())
	var night := float(sample.world.effects.daylight.sample.get("stars", 0.0))
	for object in placed:
		for child in object.get_children():
			if child is OmniLight3D:
				child.light_energy = 0.5 * night
