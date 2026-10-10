extends RefCounted
const Land = preload("roaming_land.gd")
const WORLD_RADIUS := 100.0

static func find(world: Node3D, actors: Dictionary, seed_value: int, near: Variant = null, ignored := RID(), profile: Dictionary = {}) -> Variant:
	var center: Vector3=world.spawn_point() if near == null else near
	var random: Array[int]=[seed_value]
	var query:=PhysicsShapeQueryParameters3D.new()
	if profile.is_empty(): profile = preload("res://scripts/physics/profiles.gd").pet("explorer")
	query.shape = profile.shape
	query.collision_mask=7
	if ignored.is_valid(): query.exclude = [ignored]
	for attempt in range(200):
		var angle:=_random(random)*TAU
		# Area-uniform mainland placement; recovery tries the last safe site first.
		var radius:=sqrt(_random(random))*WORLD_RADIUS if near == null else (0.0 if attempt == 0 else sqrt(_random(random))*minf(18, 2 + attempt * 0.2))
		var candidate:=center+Vector3(sin(angle)*radius,0,cos(angle)*radius)
		var height = Land.height(world, candidate)
		if height == null: continue
		candidate.y=float(height)+0.03
		var occupied:=false
		for actor in actors.values():
			if Vector2(candidate.x-actor.position.x,candidate.z-actor.position.z).length()<(8.0 if near == null and attempt < 150 else 1.1):
				occupied=true
				break
		if occupied: continue
		query.transform.origin=candidate+Vector3(profile.offset)
		if world.get_world_3d().direct_space_state.intersect_shape(query,1).is_empty(): return candidate
	# Never return an unchecked fallback into water or obstructed ground.
	return null

static func recover(body: RigidBody3D) -> bool:
	var actors: Dictionary = body.get_parent().actors.duplicate()
	actors.erase(str(body.entry.get("id", "")))
	var point = find(body.world, actors, agent_seed(str(body.entry.get("id", ""))), body.last_safe, body.get_rid(), body.body_profile)
	if point == null: point = find(body.world, actors, agent_seed(str(body.entry.get("id", ""))), null, body.get_rid(), body.body_profile)
	if point == null: return false
	body.relocate(point)
	body.spawn = point
	body.last_safe = point
	body.motion = preload("res://scripts/actor_motion.gd").new()
	body.floor_snap_length = 0.25
	body.spawn_pending = false
	body.reset_physics_interpolation()
	return true

static func agent_seed(id: String) -> int:
	var value:=2166136261
	for character in id: value=((value^character.unicode_at(0))*16777619)&0xffffffff
	return value

static func _random(state: Array[int]) -> float:
	state[0]=(state[0]+0x6d2b79f5)&0xffffffff
	var value:=_imul(state[0]^(state[0]>>15),1|state[0])
	value^=(value+_imul(value^(value>>7),61|value))&0xffffffff
	return float((value^(value>>14))&0xffffffff)/4294967296.0

static func _imul(left: int, right: int) -> int:
	var low:=(left&0xffff)*(right&0xffff)
	var high:=((left>>16)*(right&0xffff)+(left&0xffff)*(right>>16))&0xffff
	return (low+(high<<16))&0xffffffff
