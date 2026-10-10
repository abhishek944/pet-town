extends SceneTree
## Package immutable native meshes, collision, transforms, edit metadata and music.
func _initialize() -> void:
	call_deferred("prepare")
func prepare() -> void:
	preload("res://scripts/region/native_cache.gd").baking = true
	var budget := preload("res://scripts/startup/budget.gd").new(self)
	var world := preload("res://scripts/world.gd").new()
	world.boot_budget = budget
	root.add_child(world)
	if not world.initialization_complete: await world.initialization_finished
	if not world.initialized:
		quit(1)
		return
	var store := preload("res://scripts/building/voxel_store.gd").new()
	store.setup(world.manifest)
	var editor := preload("res://scripts/building/terrain_edit.gd").new()
	root.add_child(editor)
	await editor.setup(world,store,budget)
	await preload("res://scripts/effects/music_cache.gd").prepare(preload("res://scripts/effects/native_music.gd").bake_stream,budget)
	preload("res://scripts/region/prop_collision.gd").finish_bake()
	if not preload("res://scripts/region/native_cache.gd").validate_baked():
		quit(1)
		return
	preload("res://scripts/region/native_cache.gd").prune_baked()
	print("Native immutable data prepared.")
	await process_frame
	world.free()
	editor.free()
	quit()
