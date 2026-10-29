extends Node3D
## Enemy and wildlife paths over existing dry terrain, rebuilt from current collision.
const CENTER := Vector3(8, 9, 12)
const VERSION := "open-town-v2"
const START := Vector3(5, 9, 6)
const ANIMALS := ["nimbaa", "fiddlekit", "tuftlet"]
const HOMES := [Vector3(7, 9, 8), Vector3(12, 9, 17), Vector3(0.5, 9, 18)]
const CELL := 1.5
var revision := -1
var world: Node3D
var graph := AStar3D.new()
var cells := {}
var points: Array[Vector3] = []
var error := ""
var shape := CapsuleShape3D.new()

func prepare(host: Node3D, budget: RefCounted = null, valid := Callable()) -> bool:
	world = host
	if revision == world.collision_revision and not points.is_empty():
		if not safe(START): return unavailable()
		for home in HOMES:
			if not safe(home): return unavailable()
		return true
	revision = -1
	graph.clear()
	cells.clear()
	points.clear()
	error = ""
	shape.radius = 0.55
	shape.height = 1.8
	var bounds: Dictionary = world.manifest.bounds
	for x in range(floori((bounds.minX - CENTER.x) / CELL), ceili((bounds.maxX - CENTER.x) / CELL)):
		if valid.is_valid() and not valid.call(): return false
		if budget: await budget.checkpoint()
		for z in range(floori((bounds.minZ - CENTER.z) / CELL), ceili((bounds.maxZ - CENTER.z) / CELL)):
			var p := CENTER + Vector3(x * CELL, 0, z * CELL)
			if not dry(p): continue
			p.y = world.ground_at(p) + 0.06
			if not clear(p): continue
			var id := graph.get_available_point_id()
			graph.add_point(id, p)
			cells[Vector2i(x, z)] = id
	for cell in cells:
		if valid.is_valid() and not valid.call(): return false
		if budget: await budget.checkpoint()
		for offset in [Vector2i(1, 0), Vector2i(0, 1)]:
			if not cells.has(cell + offset): continue
			var a: int = cells[cell]
			var b: int = cells[cell + offset]
			if segment(graph.get_point_position(a), graph.get_point_position(b)):
				graph.connect_points(a, b)
	# Keep all dry-ground components: Maple can jump or swim between them.
	for id in graph.get_point_ids():
		points.append(graph.get_point_position(id))
	if points.size() < 100 or not safe(START): return unavailable()
	for home in HOMES:
		if not safe(home): return unavailable()
	revision = world.collision_revision
	return true

func unavailable() -> bool:
	error = "The battle clearing needs connected, clear dry ground. Restore your world edits there and try again."
	return false

func dry(p: Vector3) -> bool:
	return world.contains(p) and world.water_at(p) < -100

func clear(p: Vector3, mask := 1) -> bool:
	var q := PhysicsShapeQueryParameters3D.new()
	q.shape = shape
	q.transform = Transform3D(Basis.IDENTITY, p + Vector3.UP * 0.94)
	q.collision_mask = mask
	return get_world_3d().direct_space_state.intersect_shape(q, 1).is_empty()

func segment(a: Vector3, b: Vector3) -> bool:
	if absf(a.y - b.y) > 0.55: return false
	for fraction in [0.25, 0.5, 0.75]:
		var p := a.lerp(b, fraction)
		if not dry(p) or absf(world.ground_at(p) - p.y) > 0.6 or not clear(p): return false
	return visible_line(a + Vector3.UP * 0.8, b + Vector3.UP * 0.8)

func visible_line(a: Vector3, b: Vector3) -> bool:
	var q := PhysicsRayQueryParameters3D.create(a, b, 1)
	return get_world_3d().direct_space_state.intersect_ray(q).is_empty()

func nearest(p: Vector3) -> int:
	if graph.get_point_count() == 0: return -1
	var ground := Vector3(p.x, world.ground_at(p) + 0.06, p.z)
	var cell := Vector2i(roundi((p.x - CENTER.x) / CELL), roundi((p.z - CENTER.z) / CELL))
	var nearest_id := -1
	var distance := 2.0
	for x in range(-1, 2):
		for z in range(-1, 2):
			var other: int = cells.get(cell + Vector2i(x, z), -1)
			if other < 0: continue
			var candidate := ground.distance_to(graph.get_point_position(other))
			if candidate < distance and connects(ground, other):
				nearest_id = other
				distance = candidate
	return nearest_id

func connects(p: Vector3, id: int) -> bool:
	var node := graph.get_point_position(id)
	return p.distance_to(node) < 2 and segment(p, node)

func safe(p: Vector3) -> bool:
	return dry(p) and nearest(p) >= 0 and clear(Vector3(p.x, world.ground_at(p) + 0.06, p.z))

func path(a: Vector3, b: Vector3) -> PackedVector3Array:
	var first := nearest(a)
	var last := nearest(b)
	if first < 0 or last < 0: return PackedVector3Array()
	return graph.get_point_path(first, last)

func spawn_point(anchor: Node3D, animals: Array, enemies: Array, player: Node3D) -> Variant:
	# Sample locally so a larger world does not make nearby spawn attempts rare.
	for attempt in range(28):
		var angle := randf() * TAU
		var distance_from_target := randf_range(9, 22)
		var sample := anchor.position + Vector3(cos(angle), 0, sin(angle)) * distance_from_target
		var cell := Vector2i(roundi((sample.x - CENTER.x) / CELL), roundi((sample.z - CENTER.z) / CELL))
		var id: int = cells.get(cell, -1)
		if id < 0: continue
		var p := graph.get_point_position(id)
		var distance := p.distance_to(anchor.position)
		if distance < 8 or distance > 24 or p.distance_to(player.position) < 8: continue
		var occupied := false
		for body in animals + enemies:
			if is_instance_valid(body) and p.distance_to(body.position) < 3: occupied = true
		if occupied or not clear(p, 7) or path(p, anchor.position).is_empty(): continue
		return p
	return null
