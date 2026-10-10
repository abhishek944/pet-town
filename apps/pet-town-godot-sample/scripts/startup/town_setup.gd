extends RefCounted

static func run(town: Node) -> void:
	var budget = preload("res://scripts/startup/budget.gd").new(town.get_tree())
	preload("res://ui/dpi_scale.gd").apply(town.get_window())
	var input = preload("res://scripts/town_input.gd").new()
	town.add_child(input)
	input.setup(town)
	town.preferences.load("user://preferences.cfg")
	town.hud=load("res://ui/hud.gd").new()
	town.add_child(town.hud)
	town.hud.volume=clampf(float(town.preferences.get_value("sound","volume",0.8)),0,1)
	town.hud.set_sound(bool(town.preferences.get_value("sound","enabled",true)))
	town.world=load("res://scripts/world.gd").new()
	town.world.boot_budget = budget
	town.add_child(town.world)
	if not town.world.initialization_complete: await town.world.initialization_finished
	if not town.world.initialized: return
	await budget.checkpoint(true)
	town.actor=load("res://scripts/actor.gd").new()
	town.actor.name="Explorer"
	town.actor.world=town.world
	town.actor.spawn=town.world.spawn_point()
	town.add_child(town.actor)
	town.rig=load("res://scripts/camera.gd").new()
	town.rig.actor=town.actor
	town.rig.pitch=0.68
	town.rig.distance=10.0
	town.rig.rotation.y=-0.65
	town.add_child(town.rig)
	town.actor.view=town.rig
	town.world.vegetation.player=town.actor
	town.builder=load("res://scripts/building.gd").new()
	town.builder.camera=town.rig.camera
	town.builder.actor=town.actor
	town.builder.world=town.world
	town.builder.boot_budget = budget
	town.add_child(town.builder)
	if not town.builder.initialization_complete: await town.builder.initialization_finished
	await budget.checkpoint(true)
	town.rig.clicked.connect(town.world_click)
	town.rig.touch_claim = town.claim_world
	town.rig.touch_excluded = town.hud.touch_contains_point
	town.rig.palette_scrolled.connect(func(step: int): town.select_block(posmod(town.builder.selected+step,12)))
	town.wildlife=load("res://scripts/wildlife/system.gd").new()
	town.add_child(town.wildlife)
	await town.wildlife.setup(town.actor,town.world.manifest,budget)
	await budget.checkpoint(true)
	town.wildlife.petted.connect(town.pet_feedback)
	town.ambience=load("res://scripts/effects/native_ambience.gd").new()
	town.add_child(town.ambience)
	await town.ambience.setup(town.world.manifest, budget)
	town.ambience.water_query=town.world.effects.water.is_water
	await budget.checkpoint(true)
	town.actor_audio=load("res://scripts/actor_audio.gd").new()
	town.add_child(town.actor_audio)
	town.actor_audio.setup(town.actor,town.ambience,town.world.effects)
	town.hud.block_selected.connect(town.select_block)
	town.hud.settings_toggled.connect(town.menu_changed)
	town.hud.reset_requested.connect(town.actor.respawn)
	town.hud.world_reset_requested.connect(town.reset_world)
	town.hud.photo_requested.connect(town.take_photo)
	town.hud.sound_toggled.connect(town.set_sound)
	town.hud.volume_changed.connect(town.set_volume)
	town.hud.pet_requested.connect(town.wildlife.pet_nearest)
	town.hud.camera_requested.connect(town.set_camera)
	town.builder.message.connect(town.hud.set_status)
	town.builder.selection_changed.connect(town.select_block)
	town.builder.pointer_changed.connect(town.hud.set_build_pointer)
	town.ocean = preload("res://scripts/water/exploration.gd").new()
	town.add_child(town.ocean)
	town.ocean.message.connect(town.hud.show_toast)
	town.ocean.setup(town.world, town.actor)
	town.actor.ocean = town.ocean
	await budget.checkpoint(true)
	town.hud.ocean_interact.connect(town.ocean.interact)
	town.hud.ocean_helm.connect(town.ocean.touch_helm)
	town.hud.dock_width_changed.connect(func(width: float): town.rig.dock_width = width)
	town.region_actions=load("res://scripts/region_actions.gd").new()
	town.add_child(town.region_actions)
	await town.region_actions.setup(town,budget)
	await budget.checkpoint(true)
	var build_events=preload("res://scripts/building_signals.gd").new()
	town.add_child(build_events)
	build_events.setup(town)
	await budget.checkpoint(true)
	preload("res://scripts/effects/hemisphere.gd").apply(town)
	var ui_audio=preload("res://ui/action_sounds.gd").new()
	town.add_child(ui_audio)
	ui_audio.setup(town.hud,town.ambience)
	town.hud.set_volume(town.hud.volume)
	town.set_sound(town.hud.sound_enabled)
	town.post=load("res://scripts/post/cozy_post.gd").new()
	town.add_child(town.post)
	town.post.setup(town.world.effects.daylight.get_child(0))
	town.post.update(town.world.effects.daylight.sample.sun_direction.y,town.world.effects.daylight.sample.exp,0,town.rig.camera,town.actor)
	town.pet_visibility = preload("res://scripts/effects/pet_visibility.gd").new()
	town.add_child(town.pet_visibility)
	town.desktop = preload("res://scripts/desktop/companions.gd").new()
	town.add_child(town.desktop)
	town.desktop.setup(town)
	await budget.checkpoint(true)
	town.photos = preload("res://ui/photo_keepsake.gd").new()
	town.photos.town = town
	town.add_child(town.photos)
	var care = preload("res://scripts/wildlife/care_runtime.gd").new()
	town.add_child(care)
	care.setup(town)
	await budget.checkpoint(true)
	town.hud.welcome.dismissed.connect(func():
		if town.builder.store.write_blocked: town.hud.show_toast(town.builder.store.load_error))
	town.hud.show_welcome()
	town.atmosphere = preload("res://scripts/atmosphere/driver.gd").new()
	town.add_child(town.atmosphere)
	await town.atmosphere.setup(town,budget)
	town.battle = preload("res://scripts/battle/session.gd").new()
	town.add_child(town.battle)
	town.battle.setup(town)
	await budget.checkpoint(true)
	town.initialized = true
