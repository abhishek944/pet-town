extends Node3D
## Dynamic effects over the exported source world. No replacement world geometry.
const Daylight = preload("res://scripts/effects/daylight.gd")
const Water = preload("res://scripts/effects/water.gd")
const Campfire = preload("res://scripts/effects/campfire.gd")
const Motes = preload("res://scripts/effects/ambient_motes.gd")
var daylight: Node3D
var water: Node3D
var fires: Array[Node3D] = []
var motes: CPUParticles3D
var last_player := Vector3.INF
var wake_delay := 0.0

func setup(manifest: Dictionary) -> void:
	daylight = Daylight.new()
	add_child(daylight)
	var lighting: Dictionary = manifest.duplicate()
	if manifest.has("environment"):
		lighting.timeOfDay = manifest.environment.get("timeOfDay", 0.38)
	daylight.setup(lighting)
	water = Water.new()
	add_child(water)
	water.setup(manifest)
	water.set_lighting(daylight.sample)
	for data in manifest.get("campfires", []):
		var fire := Campfire.new()
		add_child(fire)
		fire.setup(data)
		fires.append(fire)
	motes = Motes.new()
	add_child(motes)
	var details_path := "res://assets/region-prop-details.json"
	if FileAccess.file_exists(details_path):
		var billboards := preload("res://scripts/effects/prop_billboards.gd").new()
		add_child(billboards)
		billboards.setup_smoke(JSON.parse_string(FileAccess.get_file_as_string(details_path)))

func set_time_of_day(value: float) -> void:
	if not daylight:
		return
	if not daylight.set_time_of_day(value):
		return
	water.set_lighting(daylight.sample)
	for fire in fires:
		fire.night = float(daylight.sample.get("stars", 0.0))

func set_player_position(value: Vector3) -> void:
	if not water:
		return
	motes.global_position = value + Vector3.UP * 1.8
	if wake_delay <= 0.0 and value.distance_squared_to(last_player) > 0.03 and absf(value.y - water.water_level) < 1.4:
		water.add_ripple(value, 0.65)
		wake_delay = 0.35
	last_player = value

func add_ripple(position: Vector3, strength := 1.5) -> void:
	if water:
		water.add_ripple(position, strength)

func _process(delta: float) -> void:
	wake_delay = maxf(0.0, wake_delay - delta)
