extends Node3D
const Catalog = preload("pet_catalog.gd")
const PETS := Catalog.IDS
const MAYOR_ID := "pet-town-mayor"
var town: Node3D
var explorer: RigidBody3D
var transport: Node
var actions := preload("actions.gd").new()
var actors: Dictionary = {}
var entries: Array = []
var selected_id := ""
var controlled := false
var usage: Dictionary = {}
var choices := ConfigFile.new()
var focus_serial: Variant = null
var updater := preload("updates.gd").new()
var roaming := preload("roaming.gd").new()

func setup(owner_node: Node3D) -> void:
	town=owner_node
	explorer=town.actor
	choices.load("user://companion-pets.cfg")
	actions.host=self
	updater.host=self
	add_child(roaming)
	transport=preload("transport.gd").new()
	add_child(transport)
	transport.snapshot_received.connect(_snapshot)
	transport.response_received.connect(actions.response)
	transport.disconnected.connect(_disconnected)
	town.hud.companion_action.connect(actions.dispatch)
	town.hud.settings_toggled.connect(_menu)
	town.hud.settings_toggled.connect(actions.release_hidden_ui)
	town.hud.visibility_changed.connect(actions.release_hidden_ui)
	town.hud.root.visibility_changed.connect(actions.release_hidden_ui)
	get_window().focus_exited.connect(_focus_lost)
	var labels=preload("labels.gd").new()
	labels.host=self
	add_child(labels)
	town.hud.set_pet_catalog(Catalog.entries())
	_disconnected()

func _snapshot(data: Dictionary) -> void:
	entries=[]
	if data.get("available",false): entries=data.get("agents",[]).duplicate(true)
	var mayor: Dictionary=data.get("mayor",{})
	mayor.mode=data.get("mode","firstmate")
	if mayor.get("active",false):
		entries.push_front({"id":MAYOR_ID,"label":mayor.get("name","Mayor"),"source":"mayor","isMayor":true,"conversationActive":mayor.get("conversationActive",false) or mayor.get("speaking",false) or mayor.get("listening",false) or mayor.get("working",false),"status":"speaking" if mayor.get("speaking",false) else "listening" if mayor.get("listening",false) else "working" if mayor.get("working",false) else "idle"})
	var current: Dictionary={}
	for entry in entries:
		var id:=str(entry.get("id",""))
		if id.is_empty(): continue
		current[id]=true
		if not actors.has(id): _spawn(entry)
		if not actors.has(id): continue
		actors[id].set_entry(entry)
		entry.petId=actors[id].pet_id
		entry.controlled=controlled and id==selected_id
		entry.firstPerson=town.rig.first_person
	for id in actors.keys():
		if current.has(id): continue
		if id==selected_id: leave()
		actors[id].queue_free()
		actors.erase(id)
	usage=data.get("usage",{})
	town.hud.set_companions(entries,selected_id)
	town.hud.set_usage(usage,usage.get("byAgent",{}).get(selected_id,{}))
	town.hud.set_mayor(mayor)
	actions.events(data.get("terminalEvents",[]))
	var next_serial:=int(mayor.get("focusSerial",0))
	if focus_serial==null: focus_serial=next_serial
	elif next_serial!=focus_serial:
		focus_serial=next_serial
		if actors.has(MAYOR_ID): follow(MAYOR_ID)
	updater.apply(data)
func _spawn(entry: Dictionary) -> void:
	var id:=str(entry.id)
	# Keep seeded appearances stable for existing agents without a saved choice.
	var default_pet: String = "mayor" if id==MAYOR_ID else Catalog.ORIGINAL_IDS[preload("spawn.gd").agent_seed(id)%Catalog.ORIGINAL_IDS.size()]
	var pet_id := str(choices.get_value("pets",id,default_pet))
	if pet_id not in PETS+["mayor"]: pet_id=default_pet
	var profile := preload("res://scripts/physics/profiles.gd").pet(pet_id)
	var point = preload("spawn.gd").find(town.world,actors,preload("spawn.gd").agent_seed(id),null,RID(),profile)
	if point == null: return
	var body=preload("companion.gd").new()
	body.entry=entry
	body.world=town.world
	body.view=town.rig
	body.pet_id=pet_id
	body.spawn=point
	add_child(body)
	actors[id]=body
func follow(id: String, keep_panel:=false) -> void:
	if not actors.has(id):
		town.hud.show_toast("This companion is waiting for safe dry ground. Placement will retry.")
		return
	if id==selected_id:
		if not keep_panel: town.hud.close_panel()
		_menu(town.hud.is_menu_open)
		_refresh_selection()
		return
	if id!=selected_id: actions.close_terminal()
	if not selected_id.is_empty() and actors.has(selected_id): actors[selected_id].controlled=false
	selected_id=id
	controlled=false
	_set_target(actors[id])
	if not keep_panel: town.hud.close_panel()
	_menu(town.hud.is_menu_open)
	_refresh_selection()
func leave() -> void:
	actions.close_terminal()
	if actors.has(selected_id): actors[selected_id].controlled=false
	selected_id=""
	controlled=false
	_set_target(explorer)
	_menu(town.hud.is_menu_open)
	_refresh_selection()

func _set_target(body: RigidBody3D) -> void:
	if is_instance_valid(town.actor.visual): town.actor.visual.visible=true
	town.actor=body
	if town.ocean:
		body.ocean=town.ocean
		town.ocean.set_actor(body)
	town.rig.actor=body
	town.world.vegetation.player=body
	town.wildlife.player=body
	if town.actor_audio:
		town.actor_audio.actor=body
		town.actor_audio.initialized=false
		town.actor_audio.step_distance=0
		town.actor_audio.paddle_timer=0
	town.builder.active=selected_id.is_empty() and not updater.frozen
	if town.region_actions.has_method("set_following"): town.region_actions.set_following(not selected_id.is_empty())

func set_control(active: bool) -> void:
	if not actors.has(selected_id): return
	controlled=active
	actors[selected_id].controlled=active
	_menu(town.hud.is_menu_open)
	_refresh_selection()
func _focus_lost() -> void:
	actions.suspend_terminal()
func _menu(open: bool) -> void:
	open=open or updater.frozen
	if updater.frozen: town.rig.set_enabled(false)
	explorer.enabled=selected_id.is_empty() and not open
	for id in actors:
		actors[id].enabled=id==selected_id and controlled and not open
		actors[id].paused=open

func change_pet(id: String, pet: String) -> void:
	if id==MAYOR_ID or id!=selected_id or not actors.has(id) or pet not in PETS: return
	choices.set_value("pets",id,pet)
	if choices.save("user://companion-pets.cfg")!=OK:
		choices.load("user://companion-pets.cfg")
		town.hud.show_toast("Couldn't save this pet. Please try again.")
		return
	actors[id].set_pet(pet)
	_refresh_selection()
func _refresh_selection() -> void:
	for entry in entries:
		entry.controlled=controlled and entry.id==selected_id
		entry.firstPerson=town.rig.first_person
		entry.petId=actors[entry.id].pet_id if actors.has(entry.id) else ""
	town.hud.set_companions(entries,selected_id)
	town.hud.set_usage(usage,usage.get("byAgent",{}).get(selected_id,{}))

func is_following() -> bool: return not selected_id.is_empty()
func click_at(camera: Camera3D, screen: Vector2) -> bool:
	var id:=preload("picking.gd").pick(self,camera,screen)
	if id.is_empty(): return false
	follow(id)
	return true
func _unhandled_key_input(event: InputEvent) -> void:
	if not event is InputEventKey or not event.pressed or event.echo: return
	var available := entries.filter(func(entry): return actors.has(str(entry.get("id", ""))))
	if event.keycode==KEY_A and event.alt_pressed and not available.is_empty():
		var index:=-1
		for i in range(available.size()):
			if available[i].id==selected_id: index=i
		follow(str(available[(index+1)%available.size()].id))
		get_viewport().set_input_as_handled()
	elif event.keycode==KEY_C and is_following():
		set_control(not controlled)
	elif event.keycode==KEY_ESCAPE and is_following() and not town.hud.is_menu_open: leave()
func _disconnected() -> void:
	leave()
	entries=[]
	for body in actors.values(): body.queue_free()
	actors.clear()
	usage={"available":false}
	town.hud.set_companions([],"")
	town.hud.set_usage(usage,{})
	town.hud.set_mayor({"active":false})
