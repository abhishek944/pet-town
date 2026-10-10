extends Node3D
const Store = preload("store.gd")
var town: Node3D
var arena := preload("arena.gd").new()
var context := preload("context.gd").new()
var store := Store.new()
var ui: CanvasLayer
var runtime: Node3D
var avatar: RigidBody3D
var animals: Array = []
var enemies: Array = []
var sources: Array = []
var feedback: Node3D
var state := "Town"
var previous := "Playing"
var countdown := 3.0
var elapsed := 0.0
var kills := 0
var result := {}
var saved := false
var arena_ready := false
var match_id := ""
var preparation := preload("preparation.gd").new()

func setup(host: Node3D) -> void:
	town = host
	process_physics_priority = -50
	add_child(arena)
	add_child(preparation)
	preparation.session = self
	store.read()
	ui = preload("res://ui/battle/view.gd").new()
	ui.session = self
	add_child(ui)
	get_window().focus_exited.connect(func(): pause(true))

func active() -> bool: return state != "Town"

func enter() -> void:
	preparation.enter()

func start() -> void:
	preparation.start()

func _physics_process(delta: float) -> void:
	if state == "Countdown":
		countdown = maxf(0, countdown - minf(delta, 0.1))
		if countdown <= 0:
			state = "Playing"
			runtime.set_frozen(false)
	elif state == "Playing":
		var step := minf(minf(delta, 0.1), 300 - elapsed)
		runtime.step(step)
		elapsed += step
		if avatar.health.value <= 0: finish("Defeated")
		elif elapsed >= 300: finish("Completed")

func pause(automatic := false) -> void:
	if state not in ["Playing", "Countdown"]: return
	previous = state
	state = "Paused"
	runtime.set_frozen(true)
	town.rig.set_enabled(false)
	preload("res://scripts/town_input.gd").clear_gameplay()
	ui.pause_card(automatic)

func resume() -> void:
	if state != "Paused": return
	state = previous
	runtime.set_frozen(state != "Playing")
	town.rig.set_enabled(true)
	ui.playing()
	var focus := get_viewport().gui_get_focus_owner()
	if focus: focus.release_focus()

func finish(outcome: String) -> void:
	if state != "Playing": return
	state = "Result"
	runtime.set_frozen(true)
	town.rig.set_enabled(false)
	preload("res://scripts/town_input.gd").clear_gameplay()
	var wildlife: float = runtime.wildlife_health()
	result = {"id": match_id, "timestamp": Time.get_datetime_string_from_system(true), "starter": "Maple",
		"arena": arena.VERSION, "rules": Store.RULES, "outcome": outcome, "elapsed": elapsed,
		"kills": kills, "pet": avatar.health.value, "wildlife": wildlife,
		"score": Store.score(outcome, kills, avatar.health.value, wildlife)}
	saved = store.save(result)
	ui.results()

func abandon() -> void:
	if state != "Paused": return
	var record := {"id": match_id, "timestamp": Time.get_datetime_string_from_system(true), "starter": "Maple",
		"arena": arena.VERSION, "rules": Store.RULES, "outcome": "Abandoned", "elapsed": elapsed,
		"kills": kills, "pet": avatar.health.value, "wildlife": runtime.wildlife_health(), "score": null}
	var recorded := store.save(record)
	return_town()
	if not recorded: town.hud.show_toast("Battle ended without a score. Its history entry could not be saved.")

func return_town() -> void:
	if not active(): return
	state = "Town"
	preparation.cancel()
	context.restore()
	clear_runtime()
	ui.town_view()

func clear_runtime() -> void:
	if is_instance_valid(runtime):
		remove_child(runtime)
		runtime.queue_free()
	runtime = null
	avatar = null
	animals.clear()
	enemies.clear()

func command(action: String) -> void:
	match action:
		"enter": enter()
		"start":
			if arena_ready: start()
		"pause": pause()
		"resume": resume()
		"leave":
			if state == "Paused": ui.confirm_leave()
		"return": return_town()
		"abandon": abandon()
		"retry": start()
		"save":
			if state == "Result":
				saved = store.save(result)
				ui.results()
		"history": ui.history()
		"back": ui.results() if state == "Result" else ui.entry()

func _input(event: InputEvent) -> void:
	if not active(): return
	if event is InputEventKey and event.pressed and not event.echo:
		if event.physical_keycode == KEY_ESCAPE:
			if state in ["Playing", "Countdown"]: pause()
			elif state == "Paused": ui.pause_card(false)
			elif state == "Preparing": return_town()
			get_viewport().set_input_as_handled()
		elif event.physical_keycode in [KEY_H, KEY_J, KEY_K, KEY_R, KEY_V, KEY_F, KEY_C, KEY_Z, KEY_P] or event.alt_pressed:
			get_viewport().set_input_as_handled()
	if event is InputEventJoypadButton and event.button_index == JOY_BUTTON_START and event.pressed:
		pause()
		get_viewport().set_input_as_handled()

func _unhandled_key_input(event: InputEvent) -> void:
	if active() or not town.hud.root.visible: return
	if not event is InputEventKey or not event.pressed or event.echo: return
	if event.physical_keycode != KEY_B and event.keycode != KEY_B: return
	if not event.alt_pressed or event.ctrl_pressed or event.meta_pressed or event.shift_pressed: return
	enter()
	get_viewport().set_input_as_handled()

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT: pause(true)
