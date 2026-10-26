extends RefCounted
## Keep source CSS-sized UI sharp; budget only the native 3D scene.
const SCENE_LIMIT := Vector2(1920,1080)
static func apply(window: Window) -> void:
	if DisplayServer.get_name()=="headless": return
	var factor := maxf(1.0,DisplayServer.screen_get_scale(window.current_screen))
	window.content_scale_factor=factor
	var update := update_scene_scale.bind(window)
	if not window.size_changed.is_connected(update): window.size_changed.connect(update)
	if not window.dpi_changed.is_connected(update): window.dpi_changed.connect(update)
	update_scene_scale(window)
	if window.mode==Window.MODE_WINDOWED:
		var available := DisplayServer.screen_get_usable_rect(window.current_screen)
		var desired := Vector2i(Vector2(1280,720)*factor)
		desired.x=mini(desired.x,available.size.x-64)
		desired.y=mini(desired.y,available.size.y-96)
		window.size=desired
		window.position=available.position+(available.size-desired)/2

static func update_scene_scale(window: Window) -> void:
	if window.size.x<=0 or window.size.y<=0: return
	var factor := maxf(1.0,DisplayServer.screen_get_scale(window.current_screen))
	var fit := minf(SCENE_LIMIT.x/window.size.x,SCENE_LIMIT.y/window.size.y)
	window.scaling_3d_scale=minf(1.0/factor,fit)
