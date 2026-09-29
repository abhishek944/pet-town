extends "res://scripts/workshop_input.gd"

const CATALOG_SCRIPT := preload("res://scripts/catalog.gd")
const WALLET_SCRIPT := preload("res://scripts/build_wallet.gd")
const NAVIGATION_SCRIPT := preload("res://scripts/workshop_navigation.gd")
const MAYOR_DIALOGUE_SCRIPT := preload("res://scripts/mayor_dialogue.gd")
const AMBIENT_SOUND_SCRIPT := preload("res://scripts/ambient_sound.gd")

var catalog := CATALOG_SCRIPT.new() as WorkshopCatalog
var wallet := WALLET_SCRIPT.new() as BuildWallet
var navigation := NAVIGATION_SCRIPT.new() as Node
var mayor_dialogue: PanelContainer
var ambience: AmbientSound

func _ready() -> void:
	get_window().mode = Window.MODE_FULLSCREEN
	if not catalog.load_all():
		push_error("The Pet Town object catalog could not load")
		return
	wallet.load_wallet()
	editor.configure(catalog, wallet, camera, marker)
	add_child(navigation)
	navigation.configure($WorldBase/NavigationRegion3D, editor)
	hud.configure(catalog, wallet, editor)
	ambience = AMBIENT_SOUND_SCRIPT.new() as AmbientSound
	add_child(ambience)
	hud.ambience = ambience
	hud.place_requested.connect(editor.begin_place)
	hud.move_requested.connect(editor.begin_move)
	hud.rotate_requested.connect(editor.rotate_selected)
	hud.scale_requested.connect(editor.scale_selected)
	hud.delete_requested.connect(editor.delete_selected)
	hud.cancel_requested.connect(editor.cancel_preview)
	hud.undo_requested.connect(editor.undo_last)
	editor.state_changed.connect(_refresh_undo)
	hud.mode_requested.connect(_change_mode)
	hud.agent_follow_requested.connect(agents.toggle_follow)
	hud.agent_view_requested.connect(_toggle_agent_view)
	hud.agent_open_requested.connect(agents.focus_agent_in_desktop)
	agents.configure($WorldBase/NavigationRegion3D, camera)
	agents.focus_agent_requested.connect(bridge.focus_agent)
	agents.selection_changed.connect(_on_agent_selected)
	bridge.snapshot_received.connect(_on_snapshot)
	mayor_dialogue = MAYOR_DIALOGUE_SCRIPT.new() as PanelContainer
	hud.get_parent().add_child(mayor_dialogue)
	bridge.focus_result.connect(_on_focus_result)
	commands.command_requested.connect(_run_command)
	commands.mayor_talk_requested.connect(_set_mayor_ui_talk)
	commands.mayor_retry_requested.connect(bridge.retry_mayor_voice)
	modes.configure(editor, catalog, wallet)
	modes.mode_changed.connect(_on_mode_changed)
	get_window().focus_entered.connect(_on_focus_entered)
	get_window().focus_exited.connect(_on_focus_exited)
	await get_tree().physics_frame
	_change_mode(modes.load_initial_mode())
	_refresh_undo()
	bridge.start()

func _exit_tree() -> void:
	if is_instance_valid(bridge):
		bridge.stop()

func _change_mode(value: String) -> void:
	if not modes.set_mode(value):
		push_warning("Could not switch to %s mode" % value)

func _on_mode_changed(value: String) -> void:
	hud.set_mode(value)
	_refresh_undo()
	agents.set_mode(value)
	commands.set_mode(value)
	bridge.set_active(value == "chill" and get_window().has_focus())
	if value == "build":
		hud.set_agents([])
	elif not agents.records.is_empty():
		_refresh_agent_list()

func _refresh_undo() -> void:
	hud.set_undo_available(editor.can_undo())

func _on_snapshot(snapshot: Dictionary) -> void:
	var mayor: Dictionary = snapshot.get("mayor", {}) if snapshot.get("mayor", {}) is Dictionary else {}
	var focus_serial := int(mayor.get("focusSerial", 0))
	if bool(mayor.get("active", false)) and focus_serial > 0 and focus_serial != agents.mayor_focus_serial:
		if hud.settings_overlay.visible: hud.close_settings()
		if hud.agent_panel.visible: hud.agent_panel.visible = false
		if hud.inspector.visible: hud._close_inspector()
		if commands.panel.visible: commands.close_palette()
		if modes.current_mode != "chill": _change_mode("chill")
	agents.apply_snapshot(snapshot)
	if modes.current_mode == "chill":
		_refresh_agent_list()

func _refresh_agent_list() -> void:
	var records: Array = []
	for id in agents.records:
		records.append(_display_record(String(id)))
	hud.set_agents(records)
	if hud.agent_panel.visible:
		if agents.records.has(hud.agent_record_id):
			hud.update_agent_status(_display_record(hud.agent_record_id))
		else:
			hud.agent_panel.visible = false

func _on_agent_selected(id: String, _record: Dictionary) -> void:
	if hud.agent_panel.visible and not id.is_empty() and hud.agent_record_id != id:
		hud.agent_panel.visible = false
	hud.set_followed_agent(id)

func _on_focus_result(id: String, ok: bool, message: String) -> void:
	hud.show_focus_result(id, ok, message)

func _run_command(command: String) -> void:
	match command:
		"chill", "build": _change_mode(command)
		"objects": hud.open_settings(4)
		"settings", "help": hud.open_settings(0)

func _on_focus_entered() -> void:
	bridge.set_active(modes.current_mode == "chill")

func _on_focus_exited() -> void:
	bridge.set_active(false)
	camera.dragging = false

func _process(_delta: float) -> void:
	_sync_mayor_talk()
	if is_instance_valid(ambience):
		ambience.update_walking(agents.agents.get(agents.controlled_id) as LiveCompanion, _delta)
	if is_instance_valid(mayor_dialogue):
		var mayor := agents.agents.get(LiveAgentManager.MAYOR_ID) as LiveCompanion
		var blocked := hud.settings_overlay.visible or hud.agent_panel.visible or hud.inspector.visible or modes.current_mode != "chill"
		mayor_dialogue.call("update_for", mayor, camera, String(agents.mayor_state.get("speech", "")), blocked)
	camera.controls_enabled = not hud.settings_overlay.visible and not commands.panel.visible and (agents.controlled_id.is_empty() or camera.fpv_enabled)
	commands.hint.visible = not hud.settings_overlay.visible and not commands.panel.visible and not hud.agent_panel.visible
	commands.set_camera_state(camera.fpv_enabled, not agents.controlled_id.is_empty())
	var mayor_voice_status := String(agents.mayor_state.get("voiceStatus", ""))
	if mayor_talk_held and mayor_voice_status in ["", "Ready · hold to talk"]:
		mayor_voice_status = "Starting microphone…"
	var keyboard_talking := (mayor_ctrl_down and mayor_alt_down) or (Input.is_key_pressed(KEY_CTRL) and Input.is_key_pressed(KEY_ALT))
	var mayor_phase := "speaking" if bool(agents.mayor_state.get("speaking", false)) else "listening" if bool(agents.mayor_state.get("listening", false)) else "working" if bool(agents.mayor_state.get("working", false)) else "ready"
	commands.show_mayor_status(bool(agents.mayor_state.get("active", false)) and bool(agents.mayor_state.get("firstmateMode", false)) and not hud.settings_overlay.visible, mayor_voice_status, keyboard_talking, mayor_phase)
	var followed_id := (camera.followed as LiveCompanion).agent_id if camera.followed is LiveCompanion else ""
	var driving_visible := modes.current_mode == "chill" and not agents.controlled_id.is_empty() and agents.controlled_id == followed_id and agents.agents.has(followed_id)
	commands.show_driving_status(driving_visible and not hud.settings_overlay.visible and not commands.panel.visible and not hud.agent_panel.visible and not hud.inspector.visible)
	if hud.first_person_view != camera.fpv_enabled:
		hud.set_camera_view(camera.fpv_enabled)
	if hud.followed_agent_id != followed_id:
		hud.set_followed_agent(followed_id)
