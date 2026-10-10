extends RefCounted
const Geometry=preload("boat_geometry.gd")
var boat: StaticBody3D
var world: Node3D
var navigation: RefCounted
var actor: RigidBody3D
var pilot: RigidBody3D
var supports: Dictionary={}
var dock: Dictionary={}

func aboard(body: RigidBody3D) -> bool:
	if not body: return false
	var local:=boat.to_local(body.position)
	var motion=body.get("motion")
	return Geometry.inside(local,0.08) and local.y>=0.48 and local.y<3.7 and (not motion or not motion.swimming)

func move(body: RigidBody3D, point: Vector3) -> void:
	body.relocate(point+Vector3.UP*0.005)
	var motion=body.get("motion")
	if motion:
		motion.swimming=point.y<world.water_at(point)+0.2
		motion.diving=false
	supports[body.get_instance_id()]=boat.transform

func release_helm() -> void:
	pilot=null
	navigation.speed=0.0

func action() -> String:
	if not actor or not actor.enabled: return ""
	if pilot==actor: return "Leave helm"
	if aboard(actor):
		if Vector2(actor.position.x-boat.to_global(Geometry.HELM).x,actor.position.z-boat.to_global(Geometry.HELM).z).length()<1.6: return "Take helm"
		var point:=exit_point(actor)
		return ("Step ashore" if point.dry else "Swim off") if not point.is_empty() else ""
	var near:=boat.to_local(actor.position)
	if absf(near.x)>4.3 or absf(near.z)>4.5 or absf(near.y)>2.5: return ""
	var motion=actor.get("motion")
	return "Climb aboard" if motion and motion.swimming else "Board boat"

func interact() -> bool:
	var label:=action()
	if label.is_empty(): return false
	if label=="Leave helm": release_helm()
	elif label=="Take helm":
		var point:=boat.to_global(Geometry.HELM)
		if navigation.point_clear(point,actor):
			move(actor,point)
			pilot=actor
	elif label in ["Step ashore","Swim off"]:
		var exit:=exit_point(actor)
		if not exit.is_empty():
			move(actor,exit.point)
			supports.erase(actor.get_instance_id())
			release_helm()
	else:
		var point:=boat.to_global(Geometry.BOARD)
		if navigation.point_clear(point,actor): move(actor,point)
	return true

func before_body_step(body: RigidBody3D) -> bool:
	# Jolt supplies deck velocity through the actual floor contact. No position carry.
	if pilot != body: return false
	if not aboard(body):
		release_helm()
		return false
	var offset: Vector3 = boat.to_global(Geometry.HELM) - body.global_position
	var desired: Vector3 = body.steer(Vector3(offset.x, 0, offset.z).limit_length(1.2))
	var delta: float = body.get_physics_process_delta_time()
	body.velocity.x = move_toward(body.velocity.x, desired.x, delta * 4)
	body.velocity.z = move_toward(body.velocity.z, desired.z, delta * 4)
	body.velocity.y = -0.5 if body.is_grounded() else body.velocity.y - delta * 22
	body.submit_motion()
	if body.visual: body.visual.rotation.y = boat.rotation.y
	return true

func after_body_step(body: RigidBody3D) -> void:
	if pilot == body and not aboard(body): release_helm()

func dock_height(point: Vector3) -> float:
	var top: float=world.manifest.waterLevel+0.81
	if absf(point.x-dock.x)<=1.025 and absf(point.z-dock.z)<=3: return top
	if point.x>=dock.x and point.x<=dock.shoreX and absf(point.z-dock.z)<0.9:
		var shore: float=world.ground_at(Vector3(dock.shoreX,0,dock.z))+0.03
		return top+(point.x-dock.x)*(shore-top)/(dock.shoreX-dock.x)
	return -INF

func exit_point(body: RigidBody3D) -> Dictionary:
	var offsets: Array=[Vector3(2.7,0,2.3),Vector3(-2.7,0,2.3),Vector3(0,0,4.5),Vector3(2.8,0,0),Vector3(-2.8,0,0)]
	var candidates: Array=[]
	if Vector2(boat.position.x-dock.x,boat.position.z-dock.z).length()<7: candidates.append(Vector3(dock.x,0,dock.z))
	for offset in offsets: candidates.append(boat.to_global(offset))
	var swim: Dictionary={}
	for point in candidates:
		var surface: float=world.water_at(point)
		var floor_y:=maxf(world.ground_at(point),dock_height(point))
		var dry: bool=floor_y>world.manifest.waterLevel+0.12
		if dry:
			var supported:=true
			for dx in [-0.35,0.35]:
				for dz in [-0.35,0.35]:
					var at: Vector3=point+Vector3(dx,0,dz)
					if absf(maxf(world.ground_at(at),dock_height(at))-floor_y)>0.35: supported=false
			if not supported: continue
		else:
			if surface<-999 or surface-floor_y<1.5: continue
			floor_y=surface-0.82
		point.y=floor_y
		if not navigation.point_clear(point,body): continue
		if dry: return {"point":point,"dry":true}
		if swim.is_empty(): swim={"point":point,"dry":false}
	return swim
