extends Node3D

const CATALOG_SCRIPT := preload("res://scripts/catalog.gd")
const WALLET_SCRIPT := preload("res://scripts/build_wallet.gd")

@onready var camera: WorkshopCamera = $OrbitCamera
@onready var editor: WorkshopEditor = $BuildEditor
@onready var marker: WorkshopFootprintMarker = $FootprintMarker
@onready var hud: WorkshopUI = $CanvasLayer/WorkshopUI
@onready var modes: TownModeController = $TownModes
@onready var bridge: LiveTownBridge = $LiveTownBridge
@onready var agents: LiveAgentManager = $LiveAgents
@onready var commands: TownCommandPalette = $CanvasLayer/TownCommands

var catalog := CATALOG_SCRIPT.new() as WorkshopCatalog
var wallet := WALLET_SCRIPT.new() as BuildWallet

func _ready() -> void:
	if not catalog.load_all():
		push_error("The Pet Town object catalog could not load")
		return
	wallet.load_wallet()
	editor.configure(catalog, wallet, camera, marker)
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
	hud.agent_details_requested.connect(agents.follow_agent)
	agents.configure($WorldBase/NavigationRegion3D, camera)
	agents.focus_agent_requested.connect(bridge.focus_agent)
	agents.selection_changed.connect(_on_agent_selected)
	bridge.snapshot_received.connect(_on_snapshot)
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
		records.append(agents.records[id])
	hud.set_agents(records)

func _on_agent_selected(id: String, record: Dictionary) -> void:
	if not id.is_empty():
		hud.show_agent_details(record)

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

func _input(event: InputEvent) -> void:
	if not (event is InputEventKey) or not event.pressed or event.echo or event.keycode != KEY_ESCAPE:
		return
	if commands.panel.visible:
		commands.close_palette()
	elif hud.settings_overlay.visible:
		hud.close_settings()
	elif hud.agent_panel.visible:
		hud.agent_panel.visible = false
	elif hud.inspector.visible:
		hud._close_inspector()
	elif is_instance_valid(editor.preview):
		editor.cancel_preview()
	else:
		return
	get_viewport().set_input_as_handled()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		var shortcut := event as InputEventKey
		if shortcut.alt_pressed and shortcut.keycode in [KEY_S, KEY_H]:
			if hud.settings_overlay.visible:
				hud.close_settings()
			else:
				hud.open_settings(0)
			get_viewport().set_input_as_handled()
			return
	if hud.settings_overlay.visible or commands.panel.visible:
		return
	if event is InputEventMouseMotion:
		var motion := event as InputEventMouseMotion
		if is_instance_valid(editor.preview):
			editor.hover(motion.position)
		elif camera.dragging:
			camera.drag_to(motion.position, motion.alt_pressed)
			get_viewport().set_input_as_handled()
	elif event is InputEventMouseButton:
		var button := event as InputEventMouseButton
		if button.button_index == MOUSE_BUTTON_LEFT:
			if is_instance_valid(editor.preview):
				if button.pressed:
					editor.click(button.position)
			elif button.pressed and button.double_click and not button.alt_pressed:
				camera.dragging = false
				editor.select_at(button.position)
			elif button.pressed:
				camera.begin_drag(button.position, button.alt_pressed)
			elif camera.end_drag(button.position) and modes.current_mode == "chill":
				agents.select_at(button.position)
			get_viewport().set_input_as_handled()
		elif button.button_index == MOUSE_BUTTON_MIDDLE:
			if button.pressed:
				camera.begin_drag(button.position, true)
			else:
				camera.end_drag(button.position)
			get_viewport().set_input_as_handled()
		elif button.button_index == MOUSE_BUTTON_RIGHT and button.pressed:
			camera.dragging = false
			if is_instance_valid(editor.preview):
				editor.cancel_preview()
			elif modes.current_mode == "chill":
				agents.select_at(button.position)
			get_viewport().set_input_as_handled()
		elif button.pressed and button.button_index in [MOUSE_BUTTON_WHEEL_UP, MOUSE_BUTTON_WHEEL_DOWN]:
			camera.zoom(0.88 if button.button_index == MOUSE_BUTTON_WHEEL_UP else 1.14)
			get_viewport().set_input_as_handled()
	elif event is InputEventMagnifyGesture:
		camera.zoom(1.0 / maxf((event as InputEventMagnifyGesture).factor, 0.01))
	elif event is InputEventKey and event.pressed and not event.echo:
		var key := event as InputEventKey
		if (key.meta_pressed or key.ctrl_pressed) and key.keycode == KEY_Z:
			editor.undo_last()
			get_viewport().set_input_as_handled()
			return
		match key.keycode:
			KEY_ESCAPE: editor.cancel_preview()
			KEY_DELETE, KEY_BACKSPACE: editor.delete_selected()
			KEY_Q: editor.rotate_selected(-15)
			KEY_E: editor.rotate_selected(15)
