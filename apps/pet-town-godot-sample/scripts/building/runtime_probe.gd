extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func ray(world: Node3D,from: Vector3,to: Vector3) -> Dictionary:
	return world.get_world_3d().direct_space_state.intersect_ray(PhysicsRayQueryParameters3D.create(from,to,1))

func run() -> void:
	for action in ["jump","run","dive"]:
		if not InputMap.has_action(action): InputMap.add_action(action)
	var world: Node3D=load("res://scripts/world.gd").new()
	root.add_child(world)
	var actor: RigidBody3D=load("res://scripts/actor.gd").new()
	actor.world=world
	actor.spawn=Vector3(2.5,9.1,3.5)
	root.add_child(actor)
	actor.enabled=false
	actor.set_physics_process(false)
	var camera:=Camera3D.new()
	root.add_child(camera)
	var builder: Node3D=load("res://scripts/building.gd").new()
	builder.world=world
	builder.actor=actor
	builder.camera=camera
	root.add_child(builder)
	await physics_frame
	await physics_frame
	var cell:=Vector3i(4,builder.store.top_y(4,6)-1,6)
	var id: int=builder.store.get_id(cell)
	var from:=Vector3(4.5,20,6.5)
	var to:=Vector3(4.5,0,6.5)
	var before:=ray(world,from,to)
	var started:=Time.get_ticks_usec()
	builder.apply(cell,0)
	var removal_ms:=(Time.get_ticks_usec()-started)/1000.0
	await physics_frame
	await physics_frame
	var removed:=ray(world,from,to)
	var neighbor:=ray(world,Vector3(cell)+Vector3(0.5,0.5,0.5),Vector3(cell)+Vector3(1.5,0.5,0.5))
	var clear: bool=builder.can_place(cell)
	builder.apply(cell,id)
	await physics_frame
	await physics_frame
	var restored:=ray(world,from,to)
	var placed:=cell+Vector3i.UP
	builder.apply(placed,1)
	await physics_frame
	await physics_frame
	var new_top:=ray(world,from,to)
	actor.relocate(Vector3(placed)+Vector3(0.5,2.5,0.5))
	actor.spawn_pending=false
	actor.set_physics_process(true)
	for frame in 50: await physics_frame
	var landed:=actor.position
	var on_floor: bool=actor.is_grounded()
	actor.set_physics_process(false)
	builder.apply(placed,0)
	await physics_frame
	await physics_frame
	var bridge:=Vector3i(-11,10,9)
	var bridge_before: int=builder.store.get_id(bridge)
	var water_before: bool=world.effects.water.is_water(Vector3(-10.5,7.62,9.5))
	builder.apply(bridge,11)
	var water_after: bool=world.effects.water.is_water(Vector3(-10.5,7.62,9.5))
	var water_ground: int=builder.store.water_ground_y(-11,9,world.manifest.waterLevel)
	builder.apply(bridge,bridge_before)
	print("BRIDGE_WATER ",JSON.stringify({"before":water_before,"after":water_after,"ground":water_ground,"removal_ms":removal_ms}))
	print("NATIVE_LANDING ",JSON.stringify({"placed_top":str(new_top.get("position")),"landed":str(landed),"on_floor":on_floor}))
	print("VOXEL_RUNTIME ",JSON.stringify({"cell":[cell.x,cell.y,cell.z],"id":id,"before":str(before.get("position")),"removed":str(removed.get("position")),"neighbor":str(neighbor.get("position")),"can_restore":clear,"restored":str(restored.get("position")),"pending_edits":builder.store.edits.size()}))
	quit(0 if not removed.is_empty() and removed.position.y<before.position.y-0.5 and clear and absf(restored.position.y-before.position.y)<0.01 and not neighbor.is_empty() and water_before and water_after and on_floor and absf(landed.y-float(placed.y+1))<0.02 else 1)
