extends RefCounted
const DECK_Y:=0.66
const HELM:=Vector3(0,DECK_Y,1.15)
const BOARD:=Vector3(0.7,DECK_Y,2.3)

static func half_width(z: float) -> float:
	return 0.0 if absf(z)>=3.5 else 1.9*pow(cos(z/7*PI),0.4)

static func inside(point: Vector3, padding:=0.0) -> bool:
	return absf(point.z)<3.5-padding and absf(point.x)+padding<half_width(point.z)

static func deck_height(point: Vector3) -> float:
	if not inside(point,0.12): return -INF
	if absf(point.x)<1.225 and point.z>-2.75 and point.z<-0.15: return 2.21
	if absf(point.x)>1.05 and absf(point.x)<1.75 and point.z>-0.5 and point.z<1.5: return 1.04
	return DECK_Y

static func box(body: CollisionObject3D, at: Vector3, size: Vector3, yaw:=0.0) -> void:
	var collision:=CollisionShape3D.new()
	var shape:=BoxShape3D.new()
	shape.size=size
	collision.shape=shape
	collision.position=at
	collision.rotation.y=yaw
	body.add_child(collision)

static func edge(body: CollisionObject3D, a: Vector2, b: Vector2, radius: float, bottom: float, top: float) -> void:
	var center:=(a+b)*0.5
	var offset:=b-a
	box(body,Vector3(center.x,(bottom+top)/2,center.y),Vector3(radius*2,top-bottom,offset.length()+radius*2),atan2(offset.x,offset.y))

static func colliders(body: StaticBody3D) -> void:
	for i in 28:
		var z:=-3.5+(i+0.5)*0.25
		box(body,Vector3(0,0.09,z),Vector3(half_width(z)*2-0.12,1.14,0.25))
	box(body,Vector3(0,1.435,-1.45),Vector3(2.15,1.55,2.2))
	for side in [-1,1]:
		box(body,Vector3(side*1.4,0.85,0.5),Vector3(0.7,0.38,2))
		for i in 20:
			var z:=-3.5+i*0.35
			edge(body,Vector2(side*half_width(z),z),Vector2(side*half_width(z+0.35),z+0.35),0.075,-0.48,0.65)
		edge(body,Vector2(side*1.25,2),Vector2(side*1.55,0.4),0.045,0.65,1.32)
		edge(body,Vector2(side*1.55,0.4),Vector2(side*1.6,-1.8),0.045,0.65,1.32)
