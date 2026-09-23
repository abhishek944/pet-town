extends "res://scripts/main_tree_customization.gd"

func _handle_tree_customization_input(event: InputEvent) -> bool:
	if bool(host.call("_help_is_open")) or bool(host.call("_details_are_open")) or bool(host.call("_settings_are_open")):
		return false
	if event is InputEventKey and event.pressed and not event.echo:
		var key := event as InputEventKey
		if key.keycode == KEY_ESCAPE and (placement_active or tree_editor_open):
			if placement_active:
				_cancel_tree_placement()
			else:
				_close_tree_editor()
			get_viewport().set_input_as_handled()
			return true
		if key.keycode == KEY_T and not key.alt_pressed and not key.ctrl_pressed and not key.meta_pressed:
			_start_new_tree()
			get_viewport().set_input_as_handled()
			return true
		if key.keycode in [KEY_DELETE, KEY_BACKSPACE] and is_instance_valid(selected_user_tree) and not placement_active:
			_delete_selected_tree()
			get_viewport().set_input_as_handled()
			return true
	if event is InputEventMouseButton:
		var button := event as InputEventMouseButton
		if placement_active and button.pressed and button.button_index == MOUSE_BUTTON_RIGHT:
			_cancel_tree_placement()
			get_viewport().set_input_as_handled()
			return true
		if placement_active and button.pressed and button.button_index == MOUSE_BUTTON_LEFT:
			if placement_has_surface:
				_commit_tree_placement()
			get_viewport().set_input_as_handled()
			return true
		if not placement_active and button.pressed and button.double_click and button.button_index == MOUSE_BUTTON_LEFT:
			var picked_tree := _pick_user_tree(button.position)
			if is_instance_valid(picked_tree):
				tree_editor_open = true
				_select_user_tree(picked_tree)
				tree_status.text = "Editing this object. Changes save automatically."
				get_viewport().set_input_as_handled()
				return true
	return false
