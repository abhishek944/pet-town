extends Node3D

@onready var camera: WorkshopCamera = $OrbitCamera
@onready var editor: WorkshopEditor = $BuildEditor
@onready var marker: WorkshopFootprintMarker = $FootprintMarker
@onready var hud: WorkshopUI = $CanvasLayer/WorkshopUI
@onready var modes: TownModeController = $TownModes
@onready var bridge: LiveTownBridge = $LiveTownBridge
@onready var agents: LiveAgentManager = $LiveAgents
@onready var commands: TownCommandPalette = $CanvasLayer/TownCommands

var mayor_talk_held := false
var mayor_ui_talk_active := false
var mayor_ctrl_down := false
var mayor_alt_down := false
var last_clicked_agent_id := ""
var last_click_position := Vector2.ZERO
var last_click_at_ms := 0

func _display_record(id: String) -> Dictionary:
	var record: Dictionary = agents.records.get(id, {}).duplicate()
	var pet := agents.agents.get(id) as LiveCompanion
	if is_instance_valid(pet):
		record["appearance_index"] = pet.model_index
	return record

func _toggle_agent_view(id: String) -> void:
	var already_following := agents.selected_id == id and is_instance_valid(camera.followed)
	if not already_following:
		if not agents.follow_agent(id):
			return
	if not is_instance_valid(camera.followed):
		return
	if already_following:
		camera.toggle_fpv()
	else:
		camera.set_fpv(true)
	hud.set_camera_view(camera.fpv_enabled)
	if camera.fpv_enabled:
		hud.agent_panel.visible = false

func _input(event: InputEvent) -> void:
	if event is InputEventKey:
		var shortcut := event as InputEventKey
		if shortcut.keycode == KEY_CTRL or shortcut.physical_keycode == KEY_CTRL:
			mayor_ctrl_down = shortcut.pressed
			_sync_mayor_talk()
			return
		if shortcut.keycode == KEY_ALT or shortcut.physical_keycode == KEY_ALT:
			mayor_alt_down = shortcut.pressed
			_sync_mayor_talk()
			return
		if shortcut.pressed and not shortcut.echo and shortcut.alt_pressed and not shortcut.ctrl_pressed and shortcut.keycode == KEY_M:
			bridge.invoke_mayor()
			get_viewport().set_input_as_handled()
			return
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

func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_WINDOW_FOCUS_OUT:
		mayor_ctrl_down = false
		mayor_alt_down = false
		mayor_ui_talk_active = false
		if is_instance_valid(commands):
			commands.reset_mayor_talk()
		if mayor_talk_held:
			mayor_talk_held = false
			bridge.mayor_talk(false)

func _set_mayor_ui_talk(active: bool) -> void:
	mayor_ui_talk_active = active
	_sync_mayor_talk()

func _sync_mayor_talk() -> void:
	var held := mayor_ui_talk_active or (mayor_ctrl_down and mayor_alt_down) or (Input.is_key_pressed(KEY_CTRL) and Input.is_key_pressed(KEY_ALT))
	if held == mayor_talk_held:
		return
	mayor_talk_held = held
	bridge.mayor_talk(held)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		var shortcut := event as InputEventKey
		if shortcut.alt_pressed and not shortcut.ctrl_pressed and shortcut.keycode in [KEY_S, KEY_H]:
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
		elif camera.fpv_enabled:
			camera.look_by(motion.relative)
			get_viewport().set_input_as_handled()
		elif camera.dragging:
			camera.drag_to(motion.position, motion.alt_pressed)
			get_viewport().set_input_as_handled()
	elif event is InputEventPanGesture and camera.fpv_enabled:
		camera.look_by((event as InputEventPanGesture).delta * 6.0)
		get_viewport().set_input_as_handled()
	elif event is InputEventMouseButton:
		var button := event as InputEventMouseButton
		if button.button_index == MOUSE_BUTTON_LEFT:
			if is_instance_valid(editor.preview):
				if button.pressed:
					editor.click(button.position)
			elif button.pressed and button.double_click and not button.alt_pressed:
				camera.dragging = false
				var recent_pet := not last_clicked_agent_id.is_empty() and agents.records.has(last_clicked_agent_id) and Time.get_ticks_msec() - last_click_at_ms < 600 and button.position.distance_to(last_click_position) < 18.0
				if modes.current_mode == "chill" and ((recent_pet and agents.follow_agent(last_clicked_agent_id)) or agents.select_at(button.position)):
					hud.show_agent_details(_display_record(agents.selected_id))
				else:
					editor.select_at(button.position)
				last_clicked_agent_id = ""
			elif button.pressed:
				camera.begin_drag(button.position, button.alt_pressed)
			elif camera.end_drag(button.position) and modes.current_mode == "chill":
				if agents.select_at(button.position):
					last_clicked_agent_id = agents.selected_id
					last_click_position = button.position
					last_click_at_ms = Time.get_ticks_msec()
				else:
					last_clicked_agent_id = ""
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
		if key.keycode == KEY_SPACE and not agents.controlled_id.is_empty() and not key.alt_pressed and not key.ctrl_pressed and not key.meta_pressed:
			var controlled := agents.agents.get(agents.controlled_id) as LiveCompanion
			if is_instance_valid(controlled):
				controlled.request_jump()
				get_viewport().set_input_as_handled()
			return
		if key.keycode == KEY_V and not key.alt_pressed and not key.ctrl_pressed and not key.meta_pressed and not agents.selected_id.is_empty():
			_toggle_agent_view(agents.selected_id)
			get_viewport().set_input_as_handled()
			return
		if (key.meta_pressed or key.ctrl_pressed) and key.keycode == KEY_Z:
			editor.undo_last()
			get_viewport().set_input_as_handled()
			return
		match key.keycode:
			KEY_ESCAPE: editor.cancel_preview()
			KEY_DELETE, KEY_BACKSPACE: editor.delete_selected()
			KEY_Q: editor.rotate_selected(-15)
			KEY_E: editor.rotate_selected(15)
