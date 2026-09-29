class_name AmbientSound
extends Node

signal enabled_changed(value: bool)
signal footsteps_changed(value: bool)

const FILE_NAME := "ambient-sound.json"
const VERSION := 1
const LAYERS := [
	["surf_far", -24.0],
	["wind", -30.0],
	["palms", -30.0],
	["birds_dawn", -32.0],
]

var enabled := true
var footsteps_enabled := true
var players: Array[AudioStreamPlayer] = []
var step_streams: Array[AudioStream] = []
var step_player: AudioStreamPlayer
var last_step_index := -1
var step_distance := 0.0

func _ready() -> void:
	var preferences := _load_preferences()
	enabled = bool(preferences.get("enabled", true))
	footsteps_enabled = bool(preferences.get("footsteps_enabled", true))
	for layer in LAYERS:
		var stream := load("res://assets/audio/%s.ogg" % layer[0]) as AudioStreamOggVorbis
		if stream == null:
			push_error("Could not load island sound: %s" % layer[0])
			continue
		stream.loop = true
		var player := AudioStreamPlayer.new()
		player.name = String(layer[0])
		player.stream = stream
		player.volume_db = float(layer[1])
		add_child(player)
		players.append(player)
	if enabled:
		_start()
	for index in 5:
		var step := load("res://assets/audio/footsteps/grass_%d.ogg" % (index + 1)) as AudioStreamOggVorbis
		if step != null:
			step_streams.append(step)
	step_player = AudioStreamPlayer.new()
	step_player.name = "Footsteps"
	# Tidewater mixes these same grass takes around 30 dB below the surf.
	step_player.volume_db = -35.0
	add_child(step_player)

func set_enabled(value: bool) -> void:
	if enabled == value:
		return
	enabled = value
	if enabled:
		_start()
	else:
		for player in players:
			player.stop()
	_save_preferences()
	enabled_changed.emit(enabled)

func set_footsteps_enabled(value: bool) -> void:
	if footsteps_enabled == value:
		return
	footsteps_enabled = value
	if not value:
		step_player.stop()
	_save_preferences()
	footsteps_changed.emit(value)

func update_walking(pet: LiveCompanion, delta: float) -> void:
	if not footsteps_enabled or not is_instance_valid(pet) or not pet.manually_controlled or not pet.is_on_floor():
		step_distance = 0.0
		return
	var speed := Vector2(pet.get_real_velocity().x, pet.get_real_velocity().z).length()
	if speed < 0.2:
		step_distance = 0.0
		return
	step_distance += speed * delta
	if step_distance >= 0.75 and not step_streams.is_empty():
		step_distance -= 0.75
		var count := step_streams.size()
		var index := randi_range(0, count - 1) if last_step_index < 0 or count == 1 else (last_step_index + randi_range(1, count - 1)) % count
		last_step_index = index
		step_player.stream = step_streams[index]
		step_player.volume_db = -35.0 + randf_range(-1.5, 1.5)
		step_player.pitch_scale = randf_range(0.94, 1.06)
		step_player.play()

func _start() -> void:
	for player in players:
		if not player.playing:
			player.play()

func _path() -> String:
	var test_dir := OS.get_environment("PET_TOWN_TEST_DATA_DIR")
	return test_dir.path_join(FILE_NAME) if not test_dir.is_empty() else "user://" + FILE_NAME

func _load_preferences() -> Dictionary:
	var file := FileAccess.open(_path(), FileAccess.READ)
	if file == null:
		return {}
	var parsed = JSON.parse_string(file.get_as_text())
	if parsed is Dictionary and int(parsed.get("version", 0)) == VERSION:
		return parsed
	return {}

func _save_preferences() -> void:
	var location := ProjectSettings.globalize_path(_path())
	if DirAccess.make_dir_recursive_absolute(location.get_base_dir()) != OK:
		push_warning("Could not save island sound setting")
		return
	var temporary := location + ".tmp"
	var file := FileAccess.open(temporary, FileAccess.WRITE)
	if file == null:
		push_warning("Could not save island sound setting")
		return
	file.store_string(JSON.stringify({"version": VERSION, "enabled": enabled, "footsteps_enabled": footsteps_enabled}) + "\n")
	file.flush()
	file.close()
	if DirAccess.rename_absolute(temporary, location) != OK:
		push_warning("Could not save island sound setting")
