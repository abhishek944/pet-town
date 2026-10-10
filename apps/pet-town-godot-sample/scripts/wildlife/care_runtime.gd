extends Node
## One owner joins gameplay time, species care, settings, guidance and reminders.
var town: Node3D
var state := preload("care_state.gd").new()
var navigation := preload("care_navigation.gd").new()
var controls: Control
var was_active := false
var refresh_seconds := 0.0
var save_notice := ""

func setup(host: Node3D) -> void:
	town = host
	add_child(state)
	state.save_failed.connect(func(message: String) -> void:
		save_notice = message
		push_warning(message))
	state.setup()
	navigation.system = town.wildlife
	controls = preload("res://ui/wildlife_hud.gd").new()
	controls.host = town.hud
	town.hud.root.add_child(controls)
	# Care HUD stays below every modal and remains independent of companions.
	town.hud.root.move_child(controls, town.hud.modal.get_index())
	controls.view_requested.connect(open_wildlife)
	controls.cancel_requested.connect(navigation.cancel)
	town.hud.modal.wildlife_find_requested.connect(find)
	town.wildlife.species_petted.connect(_petted)
	state.changed.connect(refresh)
	get_window().focus_exited.connect(_pause)
	get_window().close_requested.connect(state.flush)
	town.hud.settings_toggled.connect(func(open: bool) -> void:
		if open: _pause())
	refresh()

func active() -> bool:
	if not town.initialized or not get_window().has_focus() or get_window().mode == Window.MODE_MINIMIZED: return false
	if town.hud.is_menu_open or not town.hud.visible or not town.hud.root.visible: return false
	if is_instance_valid(town.photos) and town.photos.busy: return false
	if is_instance_valid(town.desktop) and town.desktop.updater.frozen: return false
	var focus := get_viewport().gui_get_focus_owner()
	return not (focus is TextEdit or focus is LineEdit)

func _process(delta: float) -> void:
	if not is_instance_valid(town): return
	var playing := active()
	var continuous := playing and was_active
	if was_active and not playing: state.flush()
	was_active = playing
	controls.allowed = playing
	if playing:
		# A resumed frame may include time spent minimized or suspended.
		if continuous: state.advance(delta)
		if not save_notice.is_empty():
			town.hud.show_toast(save_notice)
			save_notice = ""
		var eligible := state.eligible()
		if not eligible.is_empty():
			var offered := state.snapshot(town.wildlife.actors).filter(func(entry): return entry.id in eligible and entry.count > 0)
			if controls.offer(offered): state.reminded(controls.reminder_ids)
	refresh_seconds += delta
	if refresh_seconds >= 0.3:
		refresh_seconds = 0
		if town.hud.modal.visible and town.hud.modal.selected_tab == "Wildlife": refresh()
	if town.desktop.is_following(): navigation.cancel()
	controls.set_heading(navigation.heading(town.actor, town.rig.camera))

func _pause() -> void:
	was_active = false
	state.flush()
	if controls: controls.allowed = false

func refresh() -> void:
	var entries := state.snapshot(town.wildlife.actors)
	for entry in entries:
		entry.following = town.desktop.is_following()
		entry.findStatus = navigation.status(entry.id, town.actor, entry.following)
	town.hud.modal.set_wildlife_data(entries)

func open_wildlife() -> void:
	town.hud.open_panel("Town settings")
	town.hud.modal.select_tab("Wildlife")
	refresh()
	for tab in town.hud.modal.tabs:
		if tab.text == "Wildlife": tab.grab_focus()

func find(id: String) -> void:
	if town.desktop.is_following():
		refresh()
		return
	if not navigation.start(id, town.actor):
		refresh()
		return
	town.hud.close_panel()

func _petted(id: String) -> void:
	state.pet(id)
	navigation.pet(id)
	controls.remove_petted(id, state.snapshot(town.wildlife.actors))

func _notification(what: int) -> void:
	if what in [NOTIFICATION_APPLICATION_FOCUS_OUT, NOTIFICATION_WM_CLOSE_REQUEST]: state.flush()
