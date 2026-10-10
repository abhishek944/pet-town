extends RefCounted
const Geometry=preload("boat_geometry.gd")
var boat: StaticBody3D
var world: Node3D
var speed:=0.0
var exclusions: Array[RID]=[]

func setup(owner_boat: StaticBody3D, owner_world: Node3D) -> void:
	boat=owner_boat
	world=owner_world
	exclusions=[boat.get_rid()]

func pose_clear(pose: Transform3D) -> bool:
	var space:=world.get_world_3d().direct_space_state
	var shape:=BoxShape3D.new()
	var query:=PhysicsShapeQueryParameters3D.new()
	query.shape=shape
	query.collision_mask=1
	query.exclude=exclusions
	for row in 29:
		var z:=-3.5+row*0.25
		var width:=Geometry.half_width(z)+0.18
		var x:=-width
		while x<=width+0.15:
			var point:=pose*Vector3(minf(x,width),-0.5,z)
			if not world.contains(point) or world.water_at(point)<-999 or world.ground_at(point)>point.y-0.08: return false
			x+=0.3
		shape.size=Vector3(width*2+0.32,3.7,0.32)
		query.transform=Transform3D(pose.basis,pose*Vector3(0,1.35,z))
		if not space.intersect_shape(query,1).is_empty(): return false
	return true

func advance(delta: float, throttle: float, steering: float) -> bool:
	var desired:=throttle*(2.3 if throttle<0 else 5.0)
	speed=lerpf(speed,desired,1-exp(-delta*(1.8 if throttle else 4)))
	var steps:=maxi(1,ceili((absf(speed*delta)+absf(steering*delta)*4)/0.12))
	var candidate:=boat.transform
	for step in steps:
		var turn:=steering*delta/steps*minf(0.8,absf(speed)*0.25)*(-1 if speed<0 else 1)
		var yaw:=candidate.basis.get_euler().y-turn
		var point:=candidate.origin+Vector3(sin(yaw),0,cos(yaw))*speed*delta/steps
		point.y=world.water_at(point)+0.15
		var pose:=Transform3D(Basis(Vector3.UP,yaw),point)
		if (throttle or absf(speed)>0.01 or turn) and not pose_clear(pose):
			speed=0
			boat.transform=candidate
			return true
		candidate=pose
	boat.transform=candidate
	return false

func point_clear(point: Vector3, body: RigidBody3D) -> bool:
	if not world.contains(point): return false
	return body.clear_at(point)
