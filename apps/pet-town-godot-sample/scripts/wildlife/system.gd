extends Node3D
## Original exported actors; native navigation, proximity, animation and petting.
signal prompt_changed(text: String)
signal petted(creature_name: String,head_position: Vector3)
signal species_petted(species: String)
const Actor = preload("res://scripts/wildlife/creature.gd")
const Hearts = preload("res://scripts/wildlife/hearts.gd")
const PetSound = preload("res://scripts/wildlife/pet_sound.gd")
var player: Node3D
var actors: Array[Node3D] = []
var world_data: Dictionary = {}
var nearest: Node3D
var hearts: Node3D
var sound: AudioStreamPlayer
var night := 0.0
var water_level := -1000.0
var enabled := true
var sound_enabled := true
var prompt := ""

func setup(target: Node3D, data: Dictionary = {}, budget: RefCounted = null) -> void:
	player = target
	world_data = data
	var path := "res://assets/wildlife-manifest.json"
	if not FileAccess.file_exists(path):
		push_warning("Export original wildlife before starting the world.")
		return
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(path))
	if not parsed is Dictionary:
		return
	water_level = float(parsed.get("waterLevel", data.get("water_level", -1000)))
	if not world_data.has("pond"):
		world_data["pond"] = parsed.get("pond", {})
	hearts = Hearts.new()
	add_child(hearts)
	sound = PetSound.new()
	add_child(sound)
	for entry in parsed.get("actors", []):
		var creature := Actor.new()
		creature.setup(entry, self)
		add_child(creature)
		actors.append(creature)
		if budget: await budget.checkpoint()

func _process(_delta: float) -> void:
	nearest = null
	if not is_instance_valid(player) or not enabled:
		return
	var distance := 3.2
	for creature in actors:
		var offset: Vector3 = creature.global_position - player.global_position
		offset.y *= 0.5
		if offset.length() < distance:
			nearest = creature
			distance = offset.length()
	var next_prompt := "" if nearest == null else str(nearest.entry.name)
	if next_prompt != prompt:
		prompt = next_prompt
		prompt_changed.emit(prompt)

func nearest_info() -> Dictionary:
	if nearest == null:
		return {}
	return {"name": nearest.entry.name, "position": nearest.head_position(), "actor": nearest}

func pet_nearest() -> bool:
	return _pet(nearest)

func pet_at(camera: Camera3D, screen_position: Vector2) -> bool:
	var origin := camera.project_ray_origin(screen_position)
	var direction := camera.project_ray_normal(screen_position)
	var selected: Node3D
	var depth := 40.0
	for creature in actors:
		var center: Vector3 = creature.head_position()
		var along := (center - origin).dot(direction)
		if along < 0.0 or along > depth:
			continue
		if (origin + direction * along).distance_to(center) < creature.radius + 0.35:
			selected = creature
			depth = along
	if selected == null or player.global_position.distance_to(selected.global_position) > 3.2:
		return false
	var ray := PhysicsRayQueryParameters3D.create(origin, selected.head_position(), 1)
	var hit := get_world_3d().direct_space_state.intersect_ray(ray)
	if not hit.is_empty() and origin.distance_to(hit.position) < depth - selected.radius:
		return false
	return _pet(selected)

func _pet(creature: Node3D) -> bool:
	if creature == null or not enabled:
		return false
	creature.pet()
	species_petted.emit(str(creature.entry.get("species", "")))
	hearts.emit_icons(creature.head_position(), "heart", 7)
	if creature.entry.get("rare", false):
		hearts.emit_icons(creature.head_position(), "sparkle", 4)
	if sound_enabled: sound.play()
	petted.emit(str(creature.entry.name),creature.head_position())
	return true

func support(point: Vector3, above := 0.7, below := 3.0) -> float:
	var query := PhysicsRayQueryParameters3D.create(point + Vector3.UP * above, point - Vector3.UP * below, 1)
	var hit := get_world_3d().direct_space_state.intersect_ray(query)
	return float(hit.position.y) if not hit.is_empty() else -INF

func inside(point: Vector3) -> bool:
	var bounds: Dictionary = world_data.get("bounds", {})
	if bounds.is_empty():
		return true
	return point.x > bounds.minX + 1 and point.x < bounds.maxX - 1 and point.z > bounds.minZ + 1 and point.z < bounds.maxZ - 1
