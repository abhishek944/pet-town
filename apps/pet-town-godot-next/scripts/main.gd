extends "res://scripts/workshop_input.gd"

const CATALOG_SCRIPT := preload("res://scripts/catalog.gd")
const WALLET_SCRIPT := preload("res://scripts/build_wallet.gd")
const NAVIGATION_SCRIPT := preload("res://scripts/workshop_navigation.gd")

var catalog := CATALOG_SCRIPT.new() as WorkshopCatalog
var wallet := WALLET_SCRIPT.new() as BuildWallet
var navigation := NAVIGATION_SCRIPT.new() as Node

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
	hud.agent_open_requested.connect(agents.focus_agent_in_desktop)
	agents.configure($WorldBase/NavigationRegion3D, camera)
	agents.focus_agent_requested.connect(bridge.focus_agent)
	agents.selection_changed.connect(_on_agent_selected)
	bridge.snapshot_received.connect(_on_snapshot)
	bridge.focus_result.connect(_on_focus_result)
	commands.command_requested.connect(_run_command)
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
		"objects": hud.open_settings(3)
		"settings", "help": hud.open_settings(0)

func _on_focus_entered() -> void:
	bridge.set_active(modes.current_mode == "chill")

func _on_focus_exited() -> void:
	bridge.set_active(false)
	camera.dragging = false

func _process(_delta: float) -> void:
	camera.controls_enabled = not hud.settings_overlay.visible and not commands.panel.visible and agents.controlled_id.is_empty()
	commands.hint.visible = not hud.settings_overlay.visible and not commands.panel.visible and not hud.agent_panel.visible
	var followed_id := (camera.followed as LiveCompanion).agent_id if camera.followed is LiveCompanion else ""
	if hud.followed_agent_id != followed_id:
		hud.set_followed_agent(followed_id)
