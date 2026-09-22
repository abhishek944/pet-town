extends SceneTree
## Renders each bundled KayKit character's shared Walking_A cycle to transparent PNG frames.

const OUTPUT_ROOT := "res://../../var/character-walk-renders"
const FRAME_COUNT := 12
const FRAME_DURATION_MS := 80
const VIEWPORT_SIZE := Vector2i(288, 320)
const MODELS := {
	"knight": "res://assets/kaykit/Knight.glb",
	"ranger": "res://assets/kaykit/Ranger.glb",
	"rogue": "res://assets/kaykit/Rogue.glb",
	"barbarian": "res://assets/kaykit/Barbarian.glb",
	"mage": "res://assets/kaykit/Mage.glb",
	"hooded-rogue": "res://assets/kaykit/Rogue_Hooded.glb",
	"skeleton-mage": "res://assets/kaykit/skeletons/Skeleton_Mage.glb",
	"skeleton-minion": "res://assets/kaykit/skeletons/Skeleton_Minion.glb",
	"skeleton-rogue": "res://assets/kaykit/skeletons/Skeleton_Rogue.glb",
	"skeleton-warrior": "res://assets/kaykit/skeletons/Skeleton_Warrior.glb",
}

func _initialize() -> void:
	call_deferred("_render_all")

func _render_all() -> void:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUTPUT_ROOT))
	var library := load("res://assets/kaykit/town_animations.res") as AnimationLibrary
	if library == null or not library.has_animation("Walking_A"):
		push_error("Shared Walking_A animation is unavailable")
		quit(1)
		return
	var animation := library.get_animation("Walking_A")
	print("Rendering Walking_A length %.3fs" % animation.length)
	for character_id in MODELS:
		await _render_character(character_id, MODELS[character_id], library, animation.length)
	print("Rendered %d characters to %s" % [MODELS.size(), ProjectSettings.globalize_path(OUTPUT_ROOT)])
	quit()

func _render_character(character_id: String, scene_path: String, library: AnimationLibrary, animation_length: float) -> void:
	var packed := load(scene_path) as PackedScene
	if packed == null:
		push_error("Could not load " + scene_path)
		quit(1)
		return
	var viewport := SubViewport.new()
	viewport.size = VIEWPORT_SIZE
	viewport.transparent_bg = true
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	viewport.msaa_3d = Viewport.MSAA_4X
	viewport.own_world_3d = true
	root.add_child(viewport)

	var environment_node := WorldEnvironment.new()
	var environment := Environment.new()
	environment.background_mode = Environment.BG_COLOR
	environment.background_color = Color(0.0, 0.0, 0.0, 0.0)
	environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	environment.ambient_light_color = Color("ffe7d5")
	environment.ambient_light_energy = 0.5
	environment.tonemap_mode = Environment.TONE_MAPPER_LINEAR
	environment.adjustment_enabled = true
	environment.adjustment_contrast = 1.06
	environment.adjustment_saturation = 1.04
	environment_node.environment = environment
	viewport.add_child(environment_node)

	var key := DirectionalLight3D.new()
	key.light_color = Color("ffe0c2")
	key.light_energy = 1.15
	key.rotation_degrees = Vector3(-42.0, -32.0, 0.0)
	key.shadow_enabled = false
	viewport.add_child(key)
	var fill := DirectionalLight3D.new()
	fill.light_color = Color("b9d9ff")
	fill.light_energy = 0.3
	fill.rotation_degrees = Vector3(-18.0, 145.0, 0.0)
	viewport.add_child(fill)

	var holder := Node3D.new()
	viewport.add_child(holder)
	var model := packed.instantiate() as Node3D
	model.name = "Model"
	model.rotation_degrees.y = 35.0
	holder.add_child(model)
	var player := AnimationPlayer.new()
	player.root_node = NodePath("../Model")
	player.add_animation_library("", library)
	holder.add_child(player)

	var camera := Camera3D.new()
	camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	camera.size = 3.2
	camera.position = Vector3(0.0, 1.2, 5.0)
	viewport.add_child(camera)
	camera.look_at(Vector3(0.0, 1.1, 0.0), Vector3.UP)
	camera.current = true

	var output_dir := OUTPUT_ROOT.path_join(character_id)
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(output_dir))
	player.play("Walking_A")
	for frame_index in FRAME_COUNT:
		var sample_time := animation_length * float(frame_index) / float(FRAME_COUNT)
		player.seek(sample_time, true)
		await process_frame
		await process_frame
		var image := viewport.get_texture().get_image()
		var output_path := output_dir.path_join("frame-%02d.png" % frame_index)
		var error := image.save_png(ProjectSettings.globalize_path(output_path))
		if error != OK:
			push_error("Could not save " + output_path)
			quit(1)
			viewport.queue_free()
			return
	print("Rendered %s from %s" % [character_id, scene_path])
	viewport.queue_free()
	await process_frame
