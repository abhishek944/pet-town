extends Node
## Cancellable preparation owns yields; temporary bodies stay frozen until countdown.
var session: Node3D
var serial := 0
var busy := false
func cancel() -> void:
	serial += 1
	busy = false
func current(token: int) -> bool:
	return serial == token and session.state == "Preparing"
func enter() -> void:
	var town: Node3D = session.town
	if session.active() or town.hud.is_menu_open or town.photos.busy or town.desktop.updater.frozen: return
	# Let an already-submitted terrain transaction publish before capturing controls.
	if town.builder.is_edit_pending():
		town.hud.show_toast("Finish the queued terrain changes before entering Battle Mode.")
		return
	session.state = "Preparing"
	session.sources.clear()
	for species in session.arena.ANIMALS:
		for animal in town.wildlife.actors:
			if animal.entry.species == species:
				session.sources.append(animal)
				break
	session.context.capture(town,session.sources)
	session.arena_ready = false
	session.arena.error = "Preparing the clearing…"
	session.ui.entry()
	busy = true
	serial += 1
	var token := serial
	var budget := preload("res://scripts/startup/budget.gd").new(get_tree())
	await budget.checkpoint(true)
	if not current(token): return
	var ready: bool = await session.arena.prepare(town.world,budget,current.bind(token))
	if not current(token): return
	session.arena_ready = ready and session.sources.size()==session.arena.ANIMALS.size()
	if session.sources.size()!=session.arena.ANIMALS.size(): session.arena.error="The clearing's starting wildlife is unavailable. Return to town and try again."
	busy = false
	session.ui.entry()
func start() -> void:
	if busy or session.state not in ["Preparing","Result"]: return
	busy = true
	session.state = "Preparing"
	serial += 1
	var token := serial
	if is_instance_valid(session.runtime):
		session.context.target(session.context.actor if is_instance_valid(session.context.actor) else session.town.desktop.explorer)
		session.clear_runtime()
	session.arena_ready = false
	session.arena.error = "Preparing Maple and the wildlife…"
	session.ui.entry()
	var budget := preload("res://scripts/startup/budget.gd").new(get_tree())
	await budget.checkpoint(true)
	if not current(token): return
	var ready: bool = await session.arena.prepare(session.town.world,budget,current.bind(token))
	if not current(token): return
	if not ready or session.sources.size()!=session.arena.ANIMALS.size():
		busy = false
		session.ui.entry()
		return
	session.match_id = Crypto.new().generate_random_bytes(16).hex_encode()
	session.elapsed = 0
	session.kills = 0
	session.countdown = 3
	session.result = {}
	session.saved = false
	var combat := preload("combat.gd").new()
	session.runtime = combat
	session.add_child(combat)
	combat.setup_avatar(session)
	await budget.checkpoint(true)
	if not current(token): return
	for i in session.sources.size():
		combat.add_animal(session.sources[i],i)
		await budget.checkpoint(true)
		if not current(token): return
	combat.setup_effects()
	busy = false
	session.arena_ready = true
	session.state = "Countdown"
	session.town.rig.set_enabled(true)
	session.ui.playing()
	if not session.get_window().has_focus(): session.pause(true)
