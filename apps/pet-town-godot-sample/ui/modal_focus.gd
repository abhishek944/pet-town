extends Node

var host: CanvasLayer

func _input(event: InputEvent) -> void:
	if not host or not host.is_menu_open or host.active_panel == "Welcome": return
	if is_instance_valid(host.modal.wildlife_detail) and host.modal.wildlife_detail.visible:
		host.modal.wildlife_detail.handle_input(event)
		return
	if not event is InputEventKey or not event.pressed or event.echo: return
	if is_instance_valid(host.modal.confirmation) and event.keycode != KEY_TAB:
		if event.keycode in [KEY_ENTER, KEY_KP_ENTER]: host.modal.confirm_reset()
		elif event.keycode == KEY_ESCAPE: host.modal.dismiss_confirmation()
		get_viewport().set_input_as_handled()
		return
	if event.keycode in [KEY_H, KEY_J, KEY_K, KEY_ESCAPE]:
		host._unhandled_key_input(event)
		return
	if event.keycode == KEY_P:
		host.close_panel()
		host.photo_requested.emit()
		get_viewport().set_input_as_handled()
		return
	if event.keycode != KEY_TAB: return
	var panel: Control = host.modal
	match host.active_panel:
		"Journal": panel = host.journal
		"Companions": panel = host.roster
		"Asset library": panel = host.library
	if is_instance_valid(host.modal.confirmation): panel = host.modal.confirmation
	var choices: Array[Control] = []
	collect(panel, choices)
	if choices.is_empty(): return
	var focused := get_viewport().gui_get_focus_owner()
	var index := choices.find(focused)
	choices[posmod(index + (-1 if event.shift_pressed else 1), choices.size())].grab_focus()
	get_viewport().set_input_as_handled()

func collect(node: Node, controls: Array[Control]) -> void:
	if node is Control and node.is_visible_in_tree() and node.focus_mode == Control.FOCUS_ALL:
		if not node is BaseButton or not node.disabled: controls.append(node)
	for child in node.get_children(): collect(child, controls)
