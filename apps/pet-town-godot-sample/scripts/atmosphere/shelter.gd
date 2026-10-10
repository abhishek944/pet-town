extends RefCounted
## Bounded, short-lived world collision columns. Real roofs override terrain/water.
var world: Node3D
var cache := {}
var queries := 0
var stamp := 0.0
func refresh(_center: Vector3) -> void:
	queries = 0
	stamp = Time.get_ticks_msec() / 1000.0
	if cache.size() > 1600: cache.clear()
func invalidate() -> void: cache.clear()
func surface(point: Vector3) -> Dictionary:
	var key := Vector2i(floori(point.x / 1.5), floori(point.z / 1.5))
	var old: Dictionary = cache.get(key, {})
	if not old.is_empty() and stamp - float(old.time) < 1.5: return old
	if queries >= 24: return {}
	queries += 1
	var p := Vector3((key.x + 0.5) * 1.5, 200, (key.y + 0.5) * 1.5)
	var ray := PhysicsRayQueryParameters3D.create(p, p + Vector3.DOWN * 350, 1)
	var hit := world.get_world_3d().direct_space_state.intersect_ray(ray)
	var height: float = world.ground_at(p)
	var normal := Vector3.UP
	if not hit.is_empty():
		height = hit.position.y
		normal = hit.normal
	var water: float = world.water_at(p)
	var on_water := water > height
	if on_water: height = water
	var result := {"height":height, "normal":normal, "water":on_water, "time":stamp}
	cache[key] = result
	return result
func exposed(point: Vector3) -> bool:
	var ray := PhysicsRayQueryParameters3D.create(point + Vector3.UP * 0.05, point + Vector3.UP * 150, 1)
	return world.get_world_3d().direct_space_state.intersect_ray(ray).is_empty()
