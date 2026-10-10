extends RefCounted
## Keyboard X, touch and gamepad share dive; descending takes priority over rise.
static func descending() -> bool:
	return Input.is_action_pressed("dive")

static func rising() -> bool:
	var modified := Input.is_physical_key_pressed(KEY_SPACE) and (Input.is_physical_key_pressed(KEY_ALT) or Input.is_physical_key_pressed(KEY_CTRL) or Input.is_physical_key_pressed(KEY_META))
	return Input.is_action_pressed("jump") and not modified and not descending()
