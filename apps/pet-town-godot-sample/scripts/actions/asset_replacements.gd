extends Node3D
const Safe = preload("safe_placement.gd")
const Save = preload("save_file.gd")
var host: Node3D
var records: Array = []
var originals := {}
var models := {}
var history: Array = []

func setup(value: Node3D) -> void:
	host = value
	for file in host.sample.world.prop_controller.entries:
		var prop: Dictionary = host.sample.world.prop_controller.entries[file]
		var entry: Dictionary = prop.get("entry") if prop.get("entry") is Dictionary else {}
		if str(entry.get("type", prop.get("kind", ""))) not in ["cottage", "bench", "lamp", "mailbox", "asset"]: continue
		var key: String = entry.get("placementKey", "original:" + file)
		originals[key] = {"node": host.sample.world.props[file], "point": Vector3(prop.x, prop.y, prop.z), "name": prop.name}

func targets() -> Array:
	var result: Array = []
	for key in originals:
		var entry: Dictionary = originals[key]
		var distance: float = host.sample.actor.global_position.distance_to(entry.point)
		if distance > 25: continue
		result.append({"id": key, "name": entry.name, "distance": roundi(distance), "position": "(%d, %d)" % [roundi(entry.point.x), roundi(entry.point.z)], "replaced": models.has(key)})
	for index in host.records.size():
		var record: Dictionary = host.records[index]
		var point := Vector3(record.position[0], record.position[1], record.position[2])
		var distance: float = host.sample.actor.global_position.distance_to(point)
		if distance <= 25: result.append({"id": "added:%d" % index, "name": host.catalog[record.id].name, "distance": roundi(distance), "position": "(%d, %d)" % [roundi(point.x), roundi(point.z)], "replaced": false})
	return result

func checked(id: String, target: String, yaw: float) -> Dictionary:
	if not host.catalog.has(id) or host.save_blocked: return {"error": "The saved asset file needs attention before replacing an asset."}
	var point: Vector3
	var previous: Node3D
	if target.begins_with("added:"):
		var index := target.trim_prefix("added:").to_int()
		if index < 0 or index >= host.records.size(): return {"error": "Choose a nearby asset first."}
		point = host.placed[index].position
		previous = host.placed[index]
	elif originals.has(target):
		point = originals[target].point
		previous = models.get(target, originals[target].node)
	else: return {"error": "Choose a nearby asset first."}
	if point.distance_to(host.sample.actor.global_position) > 25: return {"error": "Walk within 25 metres of this asset to replace it."}
	var entry: Dictionary = host.catalog[id]
	var fitted := Safe.ground_fit(host.sample.world, point, entry.hw, entry.hd, yaw + entry.source_angle)
	if fitted.has("error"): return fitted
	if not Safe.approach_clear(host.sample.world, fitted.position, entry.hw, entry.hd, yaw + entry.source_angle, target):
		return {"error": "Keep footpaths and other entrance approaches clear. Choose a smaller replacement."}
	var layers: Array = []
	disable(previous, layers)
	var clear: bool = Safe.clear_box(host.sample.world, fitted.position, entry.hw, entry.hd, entry.height, yaw + entry.source_angle)
	for item in layers: item.node.collision_layer = item.layer
	if not clear: return {"error": "The replacement overlaps your explorer, scenery or a build. Choose a smaller asset or clear its footprint."}
	return fitted

func disable(node: Node, layers: Array) -> void:
	if node is StaticBody3D:
		layers.append({"node": node, "layer": node.collision_layer})
		node.collision_layer = 0
	for child in node.get_children(): disable(child, layers)

func replace(id: String, target: String, yaw: float) -> void:
	var fitted := checked(id, target, yaw)
	if fitted.has("error"):
		host.result(fitted.error)
		return
	var assets: Array = host.records.duplicate(true)
	var next: Array = records.duplicate(true)
	var p: Vector3 = fitted.position
	var record := {"id": id, "position": [p.x, p.y, p.z], "yaw": yaw}
	if target.begins_with("added:"): assets[target.trim_prefix("added:").to_int()] = record
	else:
		next = next.filter(func(item: Dictionary) -> bool: return item.target != target)
		record.target = target
		next.append(record)
	if not save(assets, next): return
	rebuild()
	host.result(host.catalog[id].name + " replaced. Its original can be restored.")

func restore_original(target: String) -> void:
	if not models.has(target): return
	var next := records.filter(func(item: Dictionary) -> bool: return item.target != target)
	if save(host.records, next):
		rebuild()
		host.result("Original asset restored.")

func save(assets: Array, replacements: Array) -> bool:
	if assets.size() + replacements.size() > 128:
		host.result("Your asset library can hold 128 placed or replaced objects.")
		return false
	if host.save_blocked or not Save.write(host.PATH, {"version": 1, "assets": assets, "replacements": replacements}):
		host.result("The asset change could not be saved. Your scenery has been kept.")
		return false
	remember()
	host.records = assets.duplicate(true)
	records = replacements.duplicate(true)
	return true

func remember() -> void:
	history.append({"assets": host.records.duplicate(true), "replacements": records.duplicate(true)})
	if history.size() > 30: history.pop_front()

func undo() -> void:
	if history.is_empty():
		host.result("There is no placed or replaced asset change to undo.")
		return
	var previous: Dictionary = history.back()
	if host.save_blocked or not Save.write(host.PATH, {"version": 1, "assets": previous.assets, "replacements": previous.replacements}):
		host.result("The undo could not be saved. Your scenery has been kept.")
		return
	history.pop_back()
	host.records = previous.assets
	records = previous.replacements
	rebuild()
	host.result("Latest asset change undone.")

func rebuild() -> void:
	host.ghost.clear()
	for key in models:
		models[key].get_parent().remove_child(models[key])
		models[key].queue_free()
	for key in originals:
		originals[key].node.show()
		preload("asset_support.gd").collision(originals[key].node, true)
	models.clear()
	for object in host.placed:
		host.remove_child(object)
		object.queue_free()
	host.placed.clear()
	for record in host.records:
		host.placed.append(host.create_asset(host.catalog[record.id], Vector3(record.position[0], record.position[1], record.position[2]), record.yaw))
	for record in records:
		if not valid(record):
			host.save_blocked = true
			continue
		originals[record.target].node.hide()
		preload("asset_support.gd").collision(originals[record.target].node, false)
		var model: Node3D = host.create_asset(host.catalog[record.id], Vector3(record.position[0], record.position[1], record.position[2]), record.yaw)
		models[record.target] = model
	preload("asset_support.gd").update(host)

func valid(record: Variant) -> bool:
	return record is Dictionary and originals.has(record.get("target", "")) and host.catalog.has(record.get("id", "")) and host.valid_record(record)

func update_support() -> void:
	for record in records:
		if not valid(record) or not models.has(record.target): continue
		var object: Node3D = models[record.target]
		var entry: Dictionary = host.catalog[record.id]
		var fitted := Safe.ground_fit(host.sample.world, object.position, entry.hw, entry.hd, record.yaw + entry.source_angle)
		object.visible = not fitted.has("error") and absf(object.position.y - fitted.position.y) < 0.2
		preload("asset_support.gd").collision(object, object.visible)

func preview(id: String, target: String, yaw: float) -> void:
	var check := checked(id, target, yaw)
	if check.has("error"):
		host.ghost.clear()
		host.result(check.error)
	else:
		host.ghost.present(host.catalog[id], check.position, yaw)
		host.result("Replacement fits the selected spot · %.1f, %.1f · Ready to replace" % [check.position.x, check.position.z])
