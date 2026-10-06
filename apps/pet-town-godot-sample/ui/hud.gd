extends "res://ui/hud_data.gd"
signal block_selected(index: int)
signal settings_toggled(open: bool)
signal reset_requested
signal world_reset_requested
signal sound_toggled(enabled: bool)
signal volume_changed(value: float)
signal photo_requested
signal pet_requested
signal camera_requested(first_person: bool)
signal asset_place_requested(id: String, yaw: float, distance: float)
signal asset_undo_requested
signal asset_preview_requested(id: String, yaw: float, distance: float)
signal journal_action(id: String)
signal companion_action(id: String, action: String, payload: Dictionary)
signal dock_width_changed(width: float)
const Style = preload("res://ui/hud_style.gd")
const Chrome = preload("res://ui/hud_chrome.gd")
var is_menu_open := false
var sound_enabled := true
var root: Control
var clock_label: Label
var clock_period: Label
var weather_label: Label
var dial: Control
var companions: Button
var sound_button: Button
var hotbar: Control
var modal: ColorRect
var welcome: Control
var feedback: Control
var journal: Control
var roster: Control
var library: Control
var active_panel := ""
var volume := 0.8
var live: Control
func _ready() -> void:
	layer = 10
	root = Control.new()
	root.name = "PetTownHUD"
	root.theme = Style.theme()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)
	Chrome.clock(self)
	Chrome.actions(self)
	hotbar = preload("res://ui/hotbar.gd").new()
	root.add_child(hotbar)
	hotbar.selected.connect(func(index: int) -> void:
		set_selected(index)
		block_selected.emit(index))
	feedback = preload("res://ui/pet_feedback.gd").new()
	root.add_child(feedback)
	feedback.top_toolbar_visible = _has_top_toolbar
	feedback.top_toolbar_bottom = _top_toolbar_bottom
	feedback.pet_requested.connect(func() -> void: pet_requested.emit())
	roster = preload("res://ui/companions.gd").new()
	root.add_child(roster)
	roster.closed.connect(close_panel)
	roster.action_requested.connect(func(id: String, action: String, payload: Dictionary) -> void: live.forward_action(id, action, payload))
	modal = preload("res://ui/hud_modal.gd").new()
	root.add_child(modal)
	modal.closed.connect(close_panel)
	modal.reset_requested.connect(func() -> void: world_reset_requested.emit())
	modal.sound_toggled.connect(set_sound)
	modal.volume_changed.connect(set_volume)
	modal.camera_requested.connect(func(first: bool) -> void: camera_requested.emit(first))
	modal.usage_toggled.connect(func(value: bool) -> void: live.set_usage_visible(value))
	journal = preload("res://ui/journal.gd").new()
	root.add_child(journal)
	journal.closed.connect(close_panel)
	journal.action_requested.connect(func(id: String) -> void: journal_action.emit(id))
	library = preload("res://ui/asset_library.gd").new()
	root.add_child(library)
	library.closed.connect(close_panel)
	library.place_requested.connect(func(id: String, yaw: float, distance: float) -> void: asset_place_requested.emit(id, yaw, distance))
	library.undo_requested.connect(func() -> void: asset_undo_requested.emit())
	library.replace_requested.connect(func(id: String, target: String, yaw: float) -> void: asset_replace_requested.emit(id, target, yaw))
	library.restore_requested.connect(func(target: String) -> void: asset_restore_requested.emit(target))
	library.replace_preview_requested.connect(func(id: String, target: String, yaw: float) -> void: asset_replace_preview_requested.emit(id, target, yaw))
	library.preview_requested.connect(func(id: String, yaw: float, distance: float) -> void: asset_preview_requested.emit(id, yaw, distance))
	welcome = preload("res://ui/welcome.gd").new()
	add_child(welcome)
	welcome.hide()
	welcome.dismissed.connect(close_panel)
	live = preload("res://ui/hud_live.gd").new()
	root.add_child(live)
	live.setup(self)
	root.move_child(live, roster.get_index())
	var focus_guard := preload("res://ui/modal_focus.gd").new()
	focus_guard.host = self
	add_child(focus_guard)
	live.action_requested.connect(func(id: String, action: String, payload: Dictionary) -> void: companion_action.emit(id, action, payload))
	live.dock_width_changed.connect(func(width: float) -> void: dock_width_changed.emit(width))
	modal.companion_action.connect(func(id: String, action: String, payload: Dictionary) -> void: live.forward_action(id, action, payload))
	update_clock(10 * 3600 + 32 * 60)
func set_selected(index: int) -> void:
	hotbar.set_selected(index)
func set_status(text: String) -> void:
	if not text.is_empty() and not text.begins_with("Explore") and not text.begins_with("Build mode"):
		show_toast(text)
func set_companion_count(count: int) -> void:
	companions.text = "Companions · %d     ⌥ A" % maxi(0, count)
func update_clock(seconds: float) -> void:
	var hour := int(seconds / 3600) % 24
	clock_label.text = "%d:%02d" % [12 if hour % 12 == 0 else hour % 12, int(seconds / 60) % 60]
	clock_period.text = "AM" if hour < 12 else "PM"
	var weather := "Starry" if hour < 6 or hour >= 20 else "Sunny"
	weather_label.text = "%s · Day %d" % [weather, 1 + int(seconds / 86400)]
	if is_instance_valid(dial) and dial.has_method("set_hour"):
		dial.set_hour(fmod(seconds / 3600.0, 24.0))
func set_sound(enabled: bool) -> void:
	sound_enabled = enabled
	sound_button.icon = Style.icon("sound" if enabled else "mute")
	sound_button.accessibility_name = "World sound %s" % ("on" if enabled else "off")
	sound_button.accessibility_description = "Shortcut: M"
	var hint: Label = sound_button.get_meta("shortcut_hint", null)
	if is_instance_valid(hint):
		hint.text = sound_button.accessibility_name + " · M"
		hint.position.x = (sound_button.size.x - hint.get_combined_minimum_size().x) / 2
	modal.sound_enabled = enabled
	sound_toggled.emit(enabled)
func set_volume(value: float) -> void:
	volume = clampf(value, 0, 1)
	modal.volume = volume
	volume_changed.emit(volume)
func set_pet_prompt(name: String, screen_position: Vector2) -> void:
	if is_menu_open:
		clear_pet_prompt()
	else:
		feedback.set_prompt(name, screen_position)
func clear_pet_prompt() -> void:
	feedback.clear_prompt()
func show_pet_response(name: String, text: String, screen_position: Vector2) -> void:
	feedback.show_response(name, text, screen_position)
func show_toast(text: String) -> void:
	feedback.show_toast(text)
func _has_top_toolbar() -> bool:
	if not is_instance_valid(live): return false
	for panel in [live.profile, live.mayor]:
		if is_instance_valid(panel) and panel.is_visible_in_tree() and absf(panel.position.y) < 1:
			return true
	return false
func _top_toolbar_bottom() -> float: return maxf(live.profile.size.y if is_instance_valid(live.profile) and live.profile.is_visible_in_tree() else 0, live.mayor.size.y if live.mayor.is_visible_in_tree() else 0)
func set_journal_data(places: Array, experiences: Array, collection: Array = []) -> void:
	journal.set_data(places, experiences, collection)
func toggle_settings() -> void:
	if active_panel == "Town settings":
		close_panel()
	else:
		open_panel("Town settings")
func show_welcome() -> void:
	close_panel()
	root.hide()
	welcome.show()
	is_menu_open = true
	active_panel = "Welcome"
	settings_toggled.emit(true)
	if live: live.sync_visibility()
func open_panel(title: String) -> void:
	if active_panel == title:
		close_panel()
		return
	close_panel()
	clear_pet_prompt()
	active_panel = title
	if title == "Journal":
		journal.open_panel()
	elif title == "Companions":
		roster.show()
	elif title == "Asset library":
		library.open_panel()
	else:
		modal.open_panel(title)
	is_menu_open = true
	settings_toggled.emit(true)
	if live: live.sync_visibility()
func close_panel() -> void:
	modal.dismiss_confirmation()
	modal.hide()
	journal.hide()
	library.hide()
	roster.hide()
	welcome.hide()
	root.show()
	is_menu_open = false
	active_panel = ""
	settings_toggled.emit(false)
	if live: live.sync_visibility()
func _unhandled_key_input(event: InputEvent) -> void:
	Chrome.key_input(self, event)
func set_asset_catalog(entries: Array) -> void:
	library.set_catalog(entries)
func set_asset_result(message: String) -> void:
	library.set_result(message)
func set_asset_placement_result(message: String, valid: bool) -> void:
	library.set_placement_result(message, valid)
