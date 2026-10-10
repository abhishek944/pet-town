extends Node3D
## Native ocean experience over the original authored Three.js export.
signal message(text: String)
signal heading_changed(id: String)
signal discovered(id: String)
const Storage=preload("storage.gd")
const Habitat=preload("habitat.gd")
const Journal=preload("journal.gd")
var world: Node3D
var actor: RigidBody3D
var source: Dictionary={}
var progress:=Storage.new()
var habitat:=Habitat.new()
var activity:=preload("activity.gd").new()
var journal:=Journal.new()
var scenery: Node3D
var dolphins: Node3D
var fish: Node3D
var turtles: Node3D
var swim_effects: Node3D
var boat: Node3D
var underwater: Node3D
var heading_id: String=""
var time:=0.0
var discovery_in:=0.0
var available: bool:
	get: return progress.available
var error: String:
	get: return progress.error

func setup(owner_world: Node3D, owner_actor: RigidBody3D) -> void:
	world=owner_world
	source=preload("res://scripts/region/buffers.gd").read_json(world.manifest.get("oceanFile","ocean-manifest.json"))
	if source.is_empty():
		message.emit("Original ocean export is missing; export the complete source world.")
		return
	habitat.world=world
	journal.ocean=self
	progress.setup("ocean-discoveries.json",source.get("progress"),{"v":1,"stamps":[]})
	var valid_stamps: Array=[]
	for place in source.places:
		if progress.state.stamps.has(place.id): valid_stamps.append(place.id)
	progress.state.stamps=valid_stamps
	scenery=preload("scenery.gd").new()
	scenery.physics_interpolation_mode=Node.PHYSICS_INTERPOLATION_MODE_OFF
	add_child(scenery)
	scenery.setup(world,source)
	dolphins=preload("dolphins.gd").new()
	dolphins.physics_interpolation_mode=Node.PHYSICS_INTERPOLATION_MODE_OFF
	add_child(dolphins)
	dolphins.setup(habitat,source)
	fish=preload("fish_schools.gd").new()
	fish.physics_interpolation_mode=Node.PHYSICS_INTERPOLATION_MODE_OFF
	add_child(fish)
	fish.setup(habitat,source)
	turtles=preload("turtles.gd").new()
	turtles.physics_interpolation_mode=Node.PHYSICS_INTERPOLATION_MODE_OFF
	add_child(turtles)
	turtles.setup(habitat,source)
	swim_effects=preload("swim_effects.gd").new()
	swim_effects.physics_interpolation_mode=Node.PHYSICS_INTERPOLATION_MODE_OFF
	add_child(swim_effects)
	swim_effects.setup(world)
	boat=preload("boat.gd").new()
	add_child(boat)
	boat.message.connect(func(text: String): message.emit(text))
	boat.setup(world,source.boat)
	underwater=preload("underwater.gd").new()
	underwater.physics_interpolation_mode=Node.PHYSICS_INTERPOLATION_MODE_OFF
	add_child(underwater)
	underwater.setup(world)
	set_actor(owner_actor)
	if not progress.error.is_empty(): message.emit(progress.error)

func set_actor(body: RigidBody3D) -> void:
	actor=body
	if dolphins: dolphins.actor=body
	if swim_effects: swim_effects.actor=body
	if boat: boat.set_actor(body)

func _physics_process(delta: float) -> void:
	if source.is_empty() or not actor or get_tree().paused: return
	time += delta
	activity.update(self)
	dolphins.update(delta,time,activity)
	fish.step(delta,time,activity)
	turtles.update(delta,time,activity)

func _process(delta: float) -> void:
	if source.is_empty() or not actor or get_tree().paused: return
	var step:=clampf(delta,0,0.1)
	scenery.update(step)
	fish.update(step,time)
	var night:=0.0
	if world.effects and world.effects.daylight:
		night=1.0-smoothstep(-0.16,-0.035,float(world.effects.daylight.sample.get("sun_elevation_radians",1.0)))
	swim_effects.update(step,night)
	underwater.update(time)
	discovery_in-=delta
	if discovery_in<=0 and actor.enabled and available:
		discovery_in=1.0
		check_discoveries()

func check_discoveries() -> void:
	var motion=actor.get("motion")
	if not motion: return
	for place in source.places:
		if discoveries().has(place.id): continue
		if Vector2(place.x-actor.position.x,place.z-actor.position.z).length()>place.radius: continue
		var surface: float=world.water_at(actor.position)
		var found: bool=actor.is_grounded() and world.ground_at(actor.position)>float(world.manifest.waterLevel) if place.id=="island" else motion.swimming and surface>-999 and (place.id=="lagoon" or actor.position.y+1.1<surface-0.2)
		if not found: continue
		var next: Array=discoveries().duplicate()
		next.append(place.id)
		if progress.save({"v":1,"stamps":next}):
			discovered.emit(place.id)
			message.emit("Discovered "+place.name+" · "+str(next.size())+"/5")
		else: message.emit(progress.error)

func places() -> Array:
	var result: Array=source.get("places",[]).duplicate(true)
	if boat and boat.body:
		result.append({"id":"harbor-launch","name":"Harbor launch","radius":5,"transport":true,
			"x":boat.body.position.x,"z":boat.body.position.z,"art":"ship",
			"note":"Board the wooden launch west of Driftwood Camp. F climbs aboard or takes the helm; WASD steers."})
	return result

func discoveries() -> Array:
	return progress.state.get("stamps",[])

func find_place(id: String) -> Dictionary:
	for place in places():
		if place.id==id: return place
	return {}

func set_heading(id: String) -> bool:
	if find_place(id).is_empty(): return false
	heading_id=id
	heading_changed.emit(id)
	return true

func compass() -> Dictionary:
	if heading_id.is_empty() or not actor: return {}
	var place:=find_place(heading_id)
	if place.is_empty(): return {}
	var offset:=Vector2(place.x-actor.position.x,place.z-actor.position.z)
	var depth:=maxf(0,world.water_at(actor.position)-actor.position.y-1.1)
	return {"title":place.name+" · "+Journal.cardinal(offset)+" · "+str(roundi(offset.length()))+" m",
		"hint":"F to board or take the helm · WASD to steer" if place.get("transport",false) else ("%.1f m underwater · Space to rise"%depth if depth>0.3 else "X to dive · J for destinations")}

func journal_data() -> Dictionary:
	return journal.data() if not source.is_empty() else {"places":[],"experiences":[],"collection":[]}

func perform(id: String) -> bool:
	if id.begins_with("ocean-heading:"): return set_heading(id.trim_prefix("ocean-heading:"))
	if id=="ocean-interact": return interact()
	return false

func action() -> String:
	return boat.action() if boat else ""

func interact() -> bool:
	return boat.interact() if boat else false

func aboard(body: RigidBody3D=null) -> bool:
	return boat and boat.active and boat.passengers.aboard(body if body else actor)

func piloting() -> bool:
	return boat and boat.passengers.pilot==actor and actor!=null

func before_body_step(body: RigidBody3D, _delta: float=0.0) -> bool:
	return boat.before_body_step(body) if boat else false

func after_body_step(body: RigidBody3D) -> void:
	if boat: boat.after_body_step(body)

func release_controls() -> void:
	if boat: boat.release_controls()

func touch_helm(action_name: String, held: bool) -> void:
	if boat: boat.touch[action_name]=1.0 if held else 0.0
