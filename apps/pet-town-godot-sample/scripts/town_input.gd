extends Node
var town: Node3D

static func clear_gameplay() -> void:
	for action in ["move_forward","move_back","move_left","move_right","run","jump","dive","orbit_left","orbit_right","interact"]:
		Input.action_release(action)

func setup(value: Node3D) -> void:
	town = value
	var actions := {"move_forward":KEY_W,"move_back":KEY_S,"move_left":KEY_A,"move_right":KEY_D,"run":KEY_SHIFT,"jump":KEY_SPACE,"orbit_left":KEY_Q,"orbit_right":KEY_E,"view":KEY_V,"dive":KEY_CTRL}
	for action in actions:
		if not InputMap.has_action(action): InputMap.add_action(action)
		var key := InputEventKey.new()
		key.physical_keycode = actions[action]
		InputMap.action_add_event(action, key)
	for pair in [["move_forward",KEY_UP],["move_back",KEY_DOWN],["move_left",KEY_LEFT],["move_right",KEY_RIGHT]]:
		var key := InputEventKey.new()
		key.physical_keycode = pair[1]
		InputMap.action_add_event(pair[0],key)
	for pair in [["move_left",JOY_AXIS_LEFT_X,-1.0],["move_right",JOY_AXIS_LEFT_X,1.0],["move_forward",JOY_AXIS_LEFT_Y,-1.0],["move_back",JOY_AXIS_LEFT_Y,1.0]]:
		var axis := InputEventJoypadMotion.new()
		axis.axis = pair[1]
		axis.axis_value = pair[2]
		InputMap.action_set_deadzone(pair[0],0.18)
		InputMap.action_add_event(pair[0],axis)
	for pair in [["jump",JOY_BUTTON_A],["dive",JOY_BUTTON_X],["run",JOY_BUTTON_B],["run",JOY_BUTTON_LEFT_STICK],["orbit_left",JOY_BUTTON_LEFT_SHOULDER],["orbit_right",JOY_BUTTON_RIGHT_SHOULDER],["interact",JOY_BUTTON_Y]]:
		if not InputMap.has_action(pair[0]): InputMap.add_action(pair[0])
		var button := InputEventJoypadButton.new()
		button.button_index = pair[1]
		InputMap.action_add_event(pair[0],button)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventJoypadButton and event.is_action_pressed("interact") and town.actor and town.actor.enabled:
		if not town.ocean or not town.ocean.interact(): town.wildlife.pet_nearest()
		return
	if not event is InputEventKey or not event.pressed or event.echo or not town.actor or not town.actor.enabled: return
	match event.keycode:
		KEY_P: town.take_photo()
		KEY_M: town.hud.set_sound(not town.hud.sound_enabled)
		KEY_R: town.actor.respawn()
		KEY_F:
			if not event.ctrl_pressed and not event.alt_pressed and not event.meta_pressed:
				if not town.ocean or not town.ocean.interact(): town.wildlife.pet_nearest()
		KEY_BRACKETLEFT: town.hud.set_volume(town.hud.volume - 0.1)
		KEY_BRACKETRIGHT: town.hud.set_volume(town.hud.volume + 0.1)
		KEY_Z:
			if event.ctrl_pressed: town.builder.undo(event.shift_pressed)
		_:
			var keys: Array = [KEY_1,KEY_2,KEY_3,KEY_4,KEY_5,KEY_6,KEY_7,KEY_8,KEY_9,KEY_0,KEY_MINUS,KEY_EQUAL]
			if event.keycode in keys: town.select_block(keys.find(event.keycode))

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT and town and town.ocean:
		town.ocean.release_controls()
