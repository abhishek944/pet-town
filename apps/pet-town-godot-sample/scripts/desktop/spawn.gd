extends RefCounted

static func find(world: Node3D, actors: Dictionary, seed_value: int) -> Vector3:
	var center: Vector3=world.spawn_point()
	var random: Array[int]=[seed_value]
	var query:=PhysicsShapeQueryParameters3D.new()
	var shape:=CapsuleShape3D.new()
	shape.radius=0.28
	shape.height=1.44
	query.shape=shape
	query.collision_mask=1
	for attempt in range(100):
		var angle:=_random(random)*TAU
		var radius:=2.4+_random(random)*(7 if attempt<50 else 16)
		var candidate:=center+Vector3(sin(angle)*radius,0,cos(angle)*radius)
		if not world.contains(candidate): continue
		var height: float=world.ground_at(candidate)
		if absf(height-center.y)>3 or world.water_at(candidate)>height: continue
		candidate.y=height+0.03
		var occupied:=false
		for actor in actors.values():
			if Vector2(candidate.x-actor.position.x,candidate.z-actor.position.z).length()<1.1:
				occupied=true
				break
		if occupied: continue
		query.transform.origin=candidate+Vector3.UP*0.73
		if world.get_world_3d().direct_space_state.intersect_shape(query,1).is_empty(): return candidate
	return center+Vector3.UP*0.1

static func seed(id: String) -> int:
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
