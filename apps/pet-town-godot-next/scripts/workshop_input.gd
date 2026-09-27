extends Node3D

@onready var camera: WorkshopCamera = $OrbitCamera
@onready var editor: WorkshopEditor = $BuildEditor
@onready var marker: WorkshopFootprintMarker = $FootprintMarker
@onready var hud: WorkshopUI = $CanvasLayer/WorkshopUI
@onready var modes: TownModeController = $TownModes
@onready var bridge: LiveTownBridge = $LiveTownBridge
@onready var agents: LiveAgentManager = $LiveAgents
@onready var commands: TownCommandPalette = $CanvasLayer/TownCommands

var last_clicked_agent_id := ""
var last_click_position := Vector2.ZERO
var last_click_at_ms := 0

func _display_record(id: String) -> Dictionary:
	var record: Dictionary = agents.records.get(id, {}).duplicate()
	var pet := agents.agents.get(id) as LiveCompanion
	if is_instance_valid(pet):
		record["appearance_index"] = pet.model_index
	return record

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
		if (key.meta_pressed or key.ctrl_pressed) and key.keycode == KEY_Z:
			editor.undo_last()
			get_viewport().set_input_as_handled()
			return
		match key.keycode:
			KEY_ESCAPE: editor.cancel_preview()
			KEY_DELETE, KEY_BACKSPACE: editor.delete_selected()
			KEY_Q: editor.rotate_selected(-15)
			KEY_E: editor.rotate_selected(15)
