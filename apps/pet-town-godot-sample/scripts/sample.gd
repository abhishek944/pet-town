extends Node3D
var actor: RigidBody3D
var rig: Node3D
var builder: Node3D
var hud: CanvasLayer
var world: Node3D
var wildlife: Node3D
var ambience: Node
var actor_audio: Node
var region_actions: Node
var post: Node
var pet_visibility: Node3D
var ocean: Node3D
var desktop: Node3D
var photos: CanvasLayer
var preferences := ConfigFile.new()
var elapsed := 0.0
var day_time := 0.41435
var atmosphere: Node
var initialized := false
var battle: Node3D

signal initialization_finished
var initialization_complete := false

func _ready() -> void:
	# No gameplay callbacks run against a partially constructed town.
	process_mode = Node.PROCESS_MODE_DISABLED
	var static_collision := preload("startup/static_collision.gd").new()
	add_child(static_collision)
	await preload("res://scripts/startup/town_setup.gd").run(self)
	if initialized: process_mode = Node.PROCESS_MODE_INHERIT
	static_collision.finish()
	initialization_complete = true
	initialization_finished.emit()

func _process(delta: float) -> void:
	if not initialized or not is_instance_valid(actor): return
	elapsed+=delta
	day_time=atmosphere.tick(delta)
	pet_visibility.update(world.effects.daylight.sample, rig.camera)
	world.vegetation.set_lighting(world.effects.daylight.sample)
	world.terrain.set_lighting(world.effects.daylight.sample)
	if post: post.update(world.effects.daylight.sample.sun_direction.y,world.effects.daylight.sample.exp,delta,rig.camera,actor,rig.camera.global_position.y<world.water_at(rig.camera.global_position))
	world.effects.set_player_position(actor.position)
	ambience.set_player_position(actor.position)
	ambience.set_time_of_day(day_time)
	wildlife.night=float(world.effects.daylight.sample.get("night",world.effects.daylight.sample.stars))
	world.prop_controller.set_night_factor(wildlife.night)
	hud.set_ocean_data(ocean.compass(), ocean.action(), ocean.piloting(), actor.motion.swimming, actor)
	builder.active = not battle.active() and not desktop.is_following() and not ocean.aboard(actor)
	var info: Dictionary=wildlife.nearest_info()
	if info.is_empty() or rig.camera.is_position_behind(info.position):
		hud.clear_pet_prompt()
	else:
		hud.set_pet_prompt(info.name,rig.camera.unproject_position(info.position))

func world_click(button: int, point: Vector2) -> void:
	if battle and battle.active(): return
	if button == MOUSE_BUTTON_LEFT and claim_world(point): return
	builder.edit(button,point)

func claim_world(point: Vector2) -> bool:
	return (battle and battle.active()) or (desktop and desktop.click_at(rig.camera, point)) or wildlife.pet_at(rig.camera, point)

func pet_feedback(name: String, head: Vector3) -> void:
	hud.show_pet_response(name,"Loves the attention!",rig.camera.unproject_position(head))

func select_block(index: int) -> void:
	if battle and battle.active(): return
	builder.selected=clampi(index,0,11)
	builder.wake_preview()
	hud.set_selected(builder.selected)
	if ambience: ambience.play_effect("select",{"index":builder.selected})

func menu_changed(open: bool) -> void:
	if battle and battle.active(): return
	if not actor: return
	preload("res://scripts/town_input.gd").clear_gameplay()
	actor.enabled=not open
	rig.set_enabled(not open)
	wildlife.enabled=not open
	if open and ocean: ocean.release_controls()

func set_camera(first: bool) -> void:
	rig.first_person=first

func set_sound(enabled: bool) -> void:
	ambience.set_enabled(enabled)
	preferences.set_value("sound","enabled",enabled)
	preferences.save("user://preferences.cfg")
	wildlife.sound_enabled=enabled
	if not enabled and wildlife.sound: wildlife.sound.stop()

func set_volume(value: float) -> void:
	ambience.set_volume(value)
	preferences.set_value("sound","volume",value)
	preferences.save("user://preferences.cfg")
	if wildlife.sound:
		wildlife.sound.volume_db=-80.0 if value<=0.001 else linear_to_db(value)-6.0

func reset_world() -> void:
	builder.reset_blocks()

func take_photo() -> void:
	photos.capture()
