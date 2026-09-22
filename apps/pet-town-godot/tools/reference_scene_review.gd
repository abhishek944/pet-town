extends SceneTree
func _initialize() -> void:
 call_deferred("review")
func review() -> void:
 var town = load("res://main.tscn").instantiate()
 root.add_child(town)
 town.set_process(false)
 town.camera_at_overview = false
 await process_frame
 await process_frame
 DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
 DisplayServer.window_set_size(Vector2i(1200,612))
 town.camera_target = Vector3(0,1.5,5)
 town.camera_yaw = deg_to_rad(90)
 town.camera_pitch = deg_to_rad(43)
 town.camera_distance = 202
 town._update_camera()
 town.get_node("TownUI").hide()
 print("Review scene ready")
 await create_timer(3).timeout
 root.get_texture().get_image().save_png("/Users/abhishektatikella/Documents/pet-town/generated/reference-town-godot-review.png")
 print("REVIEW captured; FPS ",Engine.get_frames_per_second())
 quit()
