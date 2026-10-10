extends Node
## Conservative footprint columns; only changed terrain schedules support checks.
const Safe = preload("safe_placement.gd")
const Support = preload("asset_support.gd")
var host: Node3D
var entries: Array = []
var columns := {}
var dirty := {}
func setup(owner_host: Node3D) -> void:
	host = owner_host
	host.sample.world.terrain_changed.connect(invalidate)
func track(object: Node3D, record: Dictionary) -> int:
	var entry: Dictionary = host.catalog[record.id]
	var id := entries.size()
	entries.append({"node":object,"record":record,"entry":entry})
	var angle: float = record.yaw + entry.source_angle
	var hx: float = absf(cos(angle))*entry.hw + absf(sin(angle))*entry.hd
	var hz: float = absf(sin(angle))*entry.hw + absf(cos(angle))*entry.hd
	for x in range(floori(object.position.x-hx),floori(object.position.x+hx)+1):
		for z in range(floori(object.position.z-hz),floori(object.position.z+hz)+1):
			var key := Vector2i(x,z)
			if not columns.has(key): columns[key]=[]
			columns[key].append(id)
	return id
func rebuild(budget: RefCounted = null) -> void:
	entries.clear()
	columns.clear()
	dirty.clear()
	var changed := false
	for i in host.placed.size(): track(host.placed[i],host.records[i])
	for record in host.replacements.records:
		if host.replacements.valid(record) and host.replacements.models.has(record.target):
			track(host.replacements.models[record.target],record)
	for id in entries.size():
		changed = check(id) or changed
		if budget: await budget.checkpoint()
	if changed: host.sample.world.invalidate_collision()
func invalidate(changed: Array) -> void:
	for column in changed:
		for id in columns.get(column,[]): dirty[id]=true
func check(id: int) -> bool:
	var item: Dictionary = entries[id]
	var object: Node3D = item.node
	if not is_instance_valid(object): return false
	var entry: Dictionary = item.entry
	var fitted := Safe.ground_fit(host.sample.world,object.position,entry.hw,entry.hd,item.record.yaw+entry.source_angle)
	var supported: bool = not fitted.has("error") and absf(object.position.y-fitted.position.y)<0.2
	if object.visible == supported: return false
	object.visible = supported
	Support.collision(object,supported)
	return true
func _process(_delta: float) -> void:
	if dirty.is_empty(): return
	var began := Time.get_ticks_usec()
	var changed := false
	for id in dirty.keys():
		dirty.erase(id)
		changed = check(id) or changed
		if Time.get_ticks_usec()-began>=2000: break
	if changed: host.sample.world.invalidate_collision()
