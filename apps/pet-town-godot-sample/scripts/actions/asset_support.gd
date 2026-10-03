extends RefCounted
const Safe = preload("safe_placement.gd")

static func update(host: Node3D) -> void:
	for index in host.placed.size():
		var object: Node3D = host.placed[index]
		if not is_instance_valid(object): continue
		var record: Dictionary = host.records[index]
		var entry: Dictionary = host.catalog[record.id]
		var fitted := Safe.ground_fit(host.sample.world, object.position, entry.hw, entry.hd, record.yaw + entry.source_angle)
		var supported: bool = not fitted.has("error") and absf(object.position.y - fitted.position.y) < 0.2
		if object.visible != supported:
			object.visible = supported
			collision(object, supported)

static func collision(node: Node, enabled: bool) -> void:
	if node is StaticBody3D: node.collision_layer = 1 if enabled else 0
	for child in node.get_children(): collision(child, enabled)
