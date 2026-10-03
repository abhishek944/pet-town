extends SceneTree

func _initialize() -> void:
	call_deferred("render")

func render() -> void:
	root.size = Vector2i(1280, 720)
	root.position = Vector2i(-3000, -3000)
	var welcome = load("res://ui/welcome.gd").new()
	root.add_child(welcome)
	welcome.set_loading(true)
	await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://ui/icons/boot-welcome.png")
	quit()
