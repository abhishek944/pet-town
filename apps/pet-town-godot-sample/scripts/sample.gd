extends Node3D
var actor: CharacterBody3D
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
var initialized := false

func _ready() -> void:
	preload("res://ui/dpi_scale.gd").apply(get_window())
	var input = preload("res://scripts/town_input.gd").new()
	add_child(input)
	input.setup(self)
	preferences.load("user://preferences.cfg")
	hud=load("res://ui/hud.gd").new()
	add_child(hud)
	hud.volume=clampf(float(preferences.get_value("sound","volume",0.8)),0,1)
	hud.set_sound(bool(preferences.get_value("sound","enabled",true)))
	world=load("res://scripts/world.gd").new()
	add_child(world)
	if world.manifest.is_empty(): return
	actor=load("res://scripts/actor.gd").new()
	actor.name="Explorer"
	actor.world=world
	actor.spawn=world.spawn_point()
	add_child(actor)
	rig=load("res://scripts/camera.gd").new()
	rig.actor=actor
	rig.pitch=0.68
	rig.distance=10.0
	rig.rotation.y=-0.65
	add_child(rig)
	actor.view=rig
	world.vegetation.player=actor
	builder=load("res://scripts/building.gd").new()
	builder.camera=rig.camera
	builder.actor=actor
	builder.world=world
	add_child(builder)
	rig.clicked.connect(world_click)
	rig.touch_claim = claim_world
	rig.touch_excluded = hud.touch_contains_point
	rig.palette_scrolled.connect(func(step: int): select_block(posmod(builder.selected+step,12)))
	wildlife=load("res://scripts/wildlife/system.gd").new()
	add_child(wildlife)
	wildlife.setup(actor,world.manifest)
	wildlife.petted.connect(pet_feedback)
	ambience=load("res://scripts/effects/native_ambience.gd").new()
	add_child(ambience)
	ambience.setup(world.manifest)
	ambience.water_query=world.effects.water.is_water
	actor_audio=load("res://scripts/actor_audio.gd").new()
	add_child(actor_audio)
	actor_audio.setup(actor,ambience,world.effects)
	hud.block_selected.connect(select_block)
	hud.settings_toggled.connect(menu_changed)
	hud.reset_requested.connect(actor.respawn)
	hud.world_reset_requested.connect(reset_world)
	hud.photo_requested.connect(take_photo)
	hud.sound_toggled.connect(set_sound)
	hud.volume_changed.connect(set_volume)
	hud.pet_requested.connect(wildlife.pet_nearest)
	hud.camera_requested.connect(set_camera)
	builder.message.connect(hud.set_status)
	builder.selection_changed.connect(select_block)
	builder.pointer_changed.connect(hud.set_build_pointer)
	ocean = preload("res://scripts/water/exploration.gd").new()
	add_child(ocean)
	ocean.message.connect(hud.show_toast)
	ocean.setup(world, actor)
	actor.ocean = ocean
	hud.ocean_interact.connect(ocean.interact)
	hud.ocean_helm.connect(ocean.touch_helm)
	hud.dock_width_changed.connect(func(width: float): rig.dock_width = width)
	region_actions=load("res://scripts/region_actions.gd").new()
	add_child(region_actions)
	region_actions.setup(self)
	var build_events=preload("res://scripts/building_signals.gd").new()
	add_child(build_events)
	build_events.setup(self)
	preload("res://scripts/effects/hemisphere.gd").apply(self)
	var ui_audio=preload("res://ui/action_sounds.gd").new()
	add_child(ui_audio)
	ui_audio.setup(hud,ambience)
	hud.set_volume(hud.volume)
	set_sound(hud.sound_enabled)
	post=load("res://scripts/post/cozy_post.gd").new()
	add_child(post)
	post.setup(world.effects.daylight.get_child(0))
	post.update(world.effects.daylight.sample.sun_direction.y,world.effects.daylight.sample.exp,0,rig.camera,actor)
	pet_visibility = preload("res://scripts/effects/pet_visibility.gd").new()
	add_child(pet_visibility)
	desktop = preload("res://scripts/desktop/companions.gd").new()
	add_child(desktop)
	desktop.setup(self)
	photos = preload("res://ui/photo_keepsake.gd").new()
	photos.town = self
	add_child(photos)
	hud.welcome.dismissed.connect(func():
		if builder.store.write_blocked: hud.show_toast(builder.store.load_error))
	hud.show_welcome()
	initialized = true

func _process(delta: float) -> void:
	if not initialized or not is_instance_valid(actor): return
	elapsed+=delta
	day_time=fposmod(0.41435+elapsed/960.0,1.0)
	hud.update_clock((0.41435+elapsed/960.0)*86400)
	world.effects.set_time_of_day(day_time)
	pet_visibility.update(world.effects.daylight.sample, rig.camera)
	world.vegetation.set_lighting(world.effects.daylight.sample)
	world.terrain.set_lighting(world.effects.daylight.sample)
	if post: post.update(world.effects.daylight.sample.sun_direction.y,world.effects.daylight.sample.exp,delta,rig.camera,actor,rig.camera.global_position.y<world.water_at(rig.camera.global_position))
	world.effects.set_player_position(actor.position)
	ambience.set_player_position(actor.position)
	ambience.set_time_of_day(day_time)
	wildlife.night=float(world.effects.daylight.sample.stars)
	world.prop_controller.set_night_factor(wildlife.night)
	hud.set_ocean_data(ocean.compass(), ocean.action(), ocean.piloting(), actor.motion.swimming)
	builder.active = not desktop.is_following() and not ocean.aboard(actor)
	var info: Dictionary=wildlife.nearest_info()
	if info.is_empty() or rig.camera.is_position_behind(info.position):
		hud.clear_pet_prompt()
	else:
		hud.set_pet_prompt(info.name,rig.camera.unproject_position(info.position))

func world_click(button: int, point: Vector2) -> void:
	if button == MOUSE_BUTTON_LEFT and claim_world(point): return
	builder.edit(button,point)

func claim_world(point: Vector2) -> bool:
	return (desktop and desktop.click_at(rig.camera, point)) or wildlife.pet_at(rig.camera, point)

func pet_feedback(name: String, head: Vector3) -> void:
	hud.show_pet_response(name,"Loves the attention!",rig.camera.unproject_position(head))

func select_block(index: int) -> void:
	builder.selected=clampi(index,0,11)
	builder.wake_preview()
	hud.set_selected(builder.selected)
	if ambience: ambience.play_effect("select",{"index":builder.selected})

func menu_changed(open: bool) -> void:
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
