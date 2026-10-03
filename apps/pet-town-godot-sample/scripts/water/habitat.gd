extends RefCounted
var world: Node3D

func depth(point: Vector3) -> float:
	if not world or not world.contains(point): return 0.0
	var surface: float=world.water_at(point)
	return maxf(0,surface-world.ground_at(point)) if surface>-999 else 0.0

func clear(point: Vector3, minimum:=2.0, radius:=0.0) -> bool:
	if depth(point)<minimum: return false
	for offset in [Vector3(radius,0,0),Vector3(-radius,0,0),Vector3(0,0,radius),Vector3(0,0,-radius)]:
		if depth(point+offset)<minimum: return false
	return true

func supported(record: Dictionary) -> float:
	var point: Vector3=record.node.position
	var low:=INF
	var high:=-INF
	for i in range(-1,8):
		var sample:=point
		if i>=0: sample+=Vector3(cos(i*PI/4),0,sin(i*PI/4))*float(record.radius)
		var floor_y: float=world.ground_at(sample)
		var surface: float=world.water_at(sample)
		if not is_finite(floor_y) or floor_y<=0: return -INF
		low=minf(low,floor_y)
		high=maxf(high,floor_y)
		if record.wet:
			if depth(sample)<record.clearance+0.1: return -INF
		elif floor_y<float(world.manifest.waterLevel)+0.15: return -INF
	return high+0.025 if high-low<0.1 else -INF
