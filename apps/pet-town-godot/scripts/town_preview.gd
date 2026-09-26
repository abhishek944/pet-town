class_name TownPreview
extends SubViewportContainer

var preview_viewport: SubViewport
var snapshot: Texture2D
var model_source: Node3D
var scene_source: PackedScene
var cache_key := ""
var worker := false
static var pending: Array[TownPreview] = []
static var draining := false
static var runner: TownPreview
static var snapshots := {}

static func discard_snapshot(key: String) -> void:
	snapshots.erase(key)

static func create_model(source: Node3D, key: String, dimensions := Vector2(172, 150)) -> TownPreview:
	var container := TownPreview.new()
	container.custom_minimum_size = dimensions
	container.stretch = true
	container.mouse_filter = Control.MOUSE_FILTER_IGNORE
	container.model_source = source
	container.cache_key = key
	return container

static func create_scene(source: PackedScene, key: String, dimensions := Vector2(172, 150)) -> TownPreview:
	var container := TownPreview.new()
	container.custom_minimum_size = dimensions
	container.stretch = true
	container.mouse_filter = Control.MOUSE_FILTER_IGNORE
	container.scene_source = source
	container.cache_key = key
	return container

func _ready() -> void:
	if worker:
		return
	if snapshots.has(cache_key):
		snapshot = snapshots[cache_key]
		return
	if DisplayServer.get_name() == "headless":
		return
	pending.append(self)
	if not is_instance_valid(runner):
		runner = TownPreview.new()
		runner.worker = true
		get_tree().root.add_child(runner)
	if not draining:
		draining = true
		runner.call_deferred("_drain_pending")

func _exit_tree() -> void:
	if not worker:
		pending.erase(self)

func _drain_pending() -> void:
	while not pending.is_empty():
		var batch: Array[TownPreview] = []
		for index in mini(3, pending.size()):
			var card: TownPreview = pending.pop_front() as TownPreview
			if is_instance_valid(card) and card.is_inside_tree() and not card.is_queued_for_deletion():
				card._build_viewport()
				batch.append(card)
		await RenderingServer.frame_post_draw
		for card in batch:
			if is_instance_valid(card) and card.is_inside_tree() and not card.is_queued_for_deletion():
				card._capture_once()
		await get_tree().process_frame
	draining = false

func _build_viewport() -> void:
	var model := scene_source.instantiate() as Node3D if scene_source != null else model_source.duplicate() as Node3D
	if model == null:
		return
	var viewport := SubViewport.new()
	viewport.size = Vector2i(maxi(160, int(custom_minimum_size.x * 1.5)), maxi(140, int(custom_minimum_size.y * 1.5)))
	viewport.world_3d = World3D.new()
	viewport.transparent_bg = false
	viewport.render_target_update_mode = SubViewport.UPDATE_ONCE
	add_child(viewport)
	preview_viewport = viewport
	var environment := WorldEnvironment.new()
	var sky := Environment.new()
	sky.background_mode = Environment.BG_COLOR
	sky.background_color = Color("26392f")
	sky.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	sky.ambient_light_color = Color("cce1c3")
	sky.ambient_light_energy = 0.8
	environment.environment = sky
	viewport.add_child(environment)
	var root := Node3D.new()
	viewport.add_child(root)
	root.add_child(model)
	var bounds := _bounds(model)
	root.position = -bounds.get_center()
	var framing := 1.0 if cache_key == "selected-object" else 1.5
	var span := maxf(maxf(bounds.size.x, maxf(bounds.size.y, bounds.size.z)) * framing, 0.8)
	var camera := Camera3D.new()
	camera.current = true
	camera.fov = 38.0
	viewport.add_child(camera)
	camera.look_at_from_position(Vector3(span * 0.8, span * 0.54, span * 1.7), Vector3.ZERO, Vector3.UP)
	var key_light := DirectionalLight3D.new()
	key_light.rotation_degrees = Vector3(-42, -34, 0)
	key_light.light_color = Color("ffe1b2")
	key_light.light_energy = 1.65
	viewport.add_child(key_light)
	var fill := OmniLight3D.new()
	fill.position = Vector3(-span, span, span)
	fill.light_color = Color("b4d7bd")
	fill.light_energy = 1.2
	viewport.add_child(fill)
func _capture_once() -> void:
	if not is_instance_valid(preview_viewport):
		return
	var image := preview_viewport.get_texture().get_image()
	if image.is_empty():
		return
	snapshot = ImageTexture.create_from_image(image)
	snapshots[cache_key] = snapshot
	preview_viewport.queue_free()
	preview_viewport = null
	queue_redraw()

func _draw() -> void:
	if snapshot != null:
		draw_texture_rect(snapshot, Rect2(Vector2.ZERO, size), false)

static func _bounds(model: Node3D) -> AABB:
	var result := AABB()
	var found := false
	for candidate in model.find_children("*", "MeshInstance3D", true, false):
		var mesh := candidate as MeshInstance3D
		if mesh.mesh == null:
			continue
		var relative := Transform3D.IDENTITY
		var current: Node = mesh
		while current is Node3D and current != model:
			relative = (current as Node3D).transform * relative
			current = current.get_parent()
		var piece := relative * mesh.get_aabb()
		result = piece if not found else result.merge(piece)
		found = true
	return result if found else AABB(Vector3(-1, -1, -1), Vector3(2, 2, 2))
