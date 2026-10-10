extends Node
const Prefs = preload("res://scripts/atmosphere/preferences.gd")
var town: Node3D
var state := preload("res://scripts/atmosphere/state.gd").new()
var weather: Node3D
var audio: Node
var checkpoint := 0.0
var save_delay := -1.0
var hud_tick := 0.0
var error_shown := false
func setup(owner_town: Node3D, budget: RefCounted = null) -> void:
	town = owner_town
	state.restore(Prefs.load_state(town.preferences))
	weather = preload("res://scripts/atmosphere/weather.gd").new()
	add_child(weather)
	weather.setup(town.world,state)
	town.world.effects.daylight.atmosphere_controlled = true
	audio = preload("res://scripts/atmosphere/audio.gd").new()
	add_child(audio)
	await audio.setup(town.ambience, budget)
	weather.storm.thunder_event.connect(audio.queue_thunder)
	town.hud.atmosphere_changed.connect(request)
	town.world.collision_changed.connect(weather.precipitation.invalidate)
	town.hud.set_atmosphere(state.snapshot())
func request(field: String, value: Variant) -> void:
	if not state.request(field,value): return
	var snapshot := state.snapshot()
	weather.apply(snapshot)
	town.hud.set_atmosphere(snapshot)
	save_delay = 0.35
func tick(delta: float) -> float:
	state.advance(delta)
	var reduced: bool = bool(state.data.reduced_motion)
	town.world.effects.reduced_motion = reduced
	town.world.effects.splash.visible = not reduced
	if reduced: town.world.effects.splash.emitting = false
	town.world.effects.water.material.set_shader_parameter("reduced_motion", reduced)
	if town.ocean and town.ocean.swim_effects: town.ocean.swim_effects.reduced_motion = reduced
	var phase := state.phase()
	town.world.effects.set_time_of_day(phase)
	var effect: Dictionary = weather.tick(delta,town.rig.camera,town.actor)
	town.world.effects.apply_lighting(weather.compose_daylight(town.world.effects.daylight.base_sample))
	town.ambience.night_factor = float(town.world.effects.daylight.sample.night)
	audio.apply(state.snapshot(),effect)
	var speaking := false
	for entry in town.desktop.entries:
		if entry.get("source","") == "mayor" and entry.get("status","") == "speaking": speaking = true
	audio.set_mayor_speaking(speaking)
	hud_tick += delta
	if hud_tick >= 0.25:
		hud_tick = 0
		town.hud.update_clock(float(state.data.town_seconds))
		town.hud.set_atmosphere(state.snapshot())
	checkpoint += delta
	var due := save_delay >= 0 and save_delay <= delta
	if save_delay >= 0: save_delay -= delta
	if checkpoint >= 15 or due: flush()
	return phase
func flush() -> void:
	checkpoint = 0
	save_delay = -1
	if not is_instance_valid(town): return
	var error := Prefs.save_state(town.preferences,state.snapshot())
	town.hud.set_atmosphere_saved(error == OK)
	if error != OK and not error_shown:
		error_shown = true
		town.hud.show_toast("Your atmosphere is active, but could not be saved on this device.")
	elif error == OK: error_shown = false
func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_CLOSE_REQUEST and town: flush()
func _exit_tree() -> void:
	if town: flush()
