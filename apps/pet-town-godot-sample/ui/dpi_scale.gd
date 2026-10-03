extends RefCounted
## Match source CSS-sized UI and its current low-tier one-pixel scene resolution.
static func apply(window: Window) -> void:
	if DisplayServer.get_name()=="headless": return
	var factor := maxf(1.0,DisplayServer.screen_get_scale(window.current_screen))
	window.content_scale_factor=factor
	window.scaling_3d_scale=1.0/factor
	if window.mode==Window.MODE_WINDOWED:
		var available := DisplayServer.screen_get_usable_rect(window.current_screen)
		var desired := Vector2i(Vector2(1280,720)*factor)
		desired.x=mini(desired.x,available.size.x-64)
		desired.y=mini(desired.y,available.size.y-96)
		window.size=desired
		window.position=available.position+(available.size-desired)/2
