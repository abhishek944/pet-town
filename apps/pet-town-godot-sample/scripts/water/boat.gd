extends Node3D
signal message(text: String)
const Geometry=preload("boat_geometry.gd")
const Navigation=preload("boat_navigation.gd")
const Passengers=preload("boat_passengers.gd")
const Storage=preload("storage.gd")
var world: Node3D
var body: StaticBody3D
var navigation:=Navigation.new()
var passengers:=Passengers.new()
var storage:=Storage.new()
var data: Dictionary={}
var active:=false
var initialized:=false
var dirty:=false
var save_in:=0.0
var blocked_in:=0.0
var suppress_input:=false
var wake_in:=0.0
var touch: Dictionary={}
var dock_body: StaticBody3D
var dock_refresh:=preload("dock_refresh.gd").new()

func setup(owner_world: Node3D, source: Dictionary) -> void:
	world=owner_world
	data=source
	process_physics_priority=-100
	body=StaticBody3D.new()
	body.name="HarborLaunch"
	add_child(body)
	var model: Node3D=load("res://assets/"+data.file).instantiate()
	body.add_child(model)
	preload("res://scripts/asset_style.gd").apply(model)
	Geometry.colliders(body)
	body.position=Vector3(data.home.x,world.manifest.waterLevel+0.15,data.home.z)
	body.rotation.y=data.home.yaw
	navigation.setup(body,world)
	passengers.boat=body
	passengers.world=world
	passengers.navigation=navigation
	passengers.dock=data.dock
	storage.setup("harbor-launch.json",data.get("saved"),{"v":1,"x":data.home.x,"z":data.home.z,"yaw":data.home.yaw})
	dock_body=StaticBody3D.new()
	dock_body.name="HarborDock"
	add_child(dock_body)
	var dock_model: Node3D=load("res://assets/"+data.dockFile).instantiate()
	dock_body.add_child(dock_model)
	preload("res://scripts/asset_style.gd").apply(dock_model)
	dock_body.position=Vector3(data.dock.x,world.manifest.waterLevel+0.15,data.dock.z)
	world.add_mesh_collision(dock_model)
	dock_refresh.setup(world,dock_model,data)
	if not storage.error.is_empty(): message.emit(storage.error)

func initialize() -> void:
	initialized=true
	var saved: Dictionary=storage.state
	var pose:=Transform3D(Basis(Vector3.UP,float(saved.yaw)),Vector3(saved.x,world.manifest.waterLevel+0.15,saved.z))
	if navigation.pose_clear(pose): body.transform=pose
	else: message.emit("The saved mooring is obstructed. Your boat is back at Driftwood Camp.")
	active=navigation.pose_clear(body.transform)
	body.visible=active
	body.collision_layer=1 if active else 0
	if not active: message.emit("The harbor launch needs clear water west of Driftwood Camp. Clear the saved blocks there.")

func set_actor(actor: CharacterBody3D) -> void:
	if passengers.pilot and passengers.pilot!=actor: passengers.release_helm()
	passengers.actor=actor

func _physics_process(delta: float) -> void:
	if not world: return
	dock_refresh.update(delta)
	if not initialized: initialize()
	if not active: return
	blocked_in=maxf(0,blocked_in-delta)
	save_in=maxf(0,save_in-delta)
	wake_in=maxf(0,wake_in-delta)
	var actor: CharacterBody3D=passengers.actor
	if passengers.pilot and (not is_instance_valid(passengers.pilot) or passengers.pilot!=actor): passengers.release_helm()
	var blocked: bool=input_captured() or not get_window().has_focus()
	if blocked:
		release_controls()
		navigation.speed=0.0
	var throttle:=axis("move_forward","move_back")
	var steering:=axis("move_right","move_left")
	if suppress_input:
		if absf(throttle)<0.18 and absf(steering)<0.18: suppress_input=false
		throttle=0
		steering=0
	if not passengers.pilot or blocked:
		throttle=0
		steering=0
	var previous:=body.transform
	if navigation.advance(delta,throttle,steering) and blocked_in<=0:
		message.emit("Shallow water or an obstacle ahead. Reverse or steer toward open water.")
		blocked_in=4.0
	if not previous.is_equal_approx(body.transform): dirty=true
	if absf(navigation.speed)>0.5 and wake_in<=0 and world.effects:
		world.effects.add_ripple(body.position,0.3)
		wake_in=0.5
	if dirty and save_in<=0:
		save()
		save_in=3.0

func input_captured() -> bool:
	var actor: CharacterBody3D=passengers.actor
	var focused:=get_viewport().gui_get_focus_owner()
	if not actor or not actor.enabled or get_tree().paused or focused is LineEdit or focused is TextEdit:
		return true
	var town:=get_parent().get_parent() if get_parent() else null
	var hud=town.get("hud") if town else null
	return hud!=null and (hud.is_menu_open or not hud.visible)

func axis(positive: String, negative: String) -> float:
	return clampf(Input.get_action_strength(positive)-Input.get_action_strength(negative)+float(touch.get(positive,0))-float(touch.get(negative,0)),-1,1)

func release_controls() -> void:
	touch.clear()
	suppress_input=true
	navigation.speed=0

func action() -> String:
	return passengers.action() if active and not input_captured() else ""

func interact() -> bool:
	return passengers.interact() if active and not input_captured() else false

func before_body_step(actor: CharacterBody3D) -> bool:
	return passengers.before_body_step(actor) if active else false

func after_body_step(actor: CharacterBody3D) -> void:
	if active: passengers.after_body_step(actor)

func save() -> void:
	if not dirty: return
	if storage.save({"v":1,"x":body.position.x,"z":body.position.z,"yaw":body.rotation.y}): dirty=false
	else: message.emit(storage.error)

func _notification(what: int) -> void:
	if what==NOTIFICATION_APPLICATION_FOCUS_OUT:
		release_controls()
		if initialized: save()

func _exit_tree() -> void:
	if initialized: save()
