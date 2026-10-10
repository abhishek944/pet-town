extends Node
## Source noise colors, filter bands, proximity gains and bird-call envelopes in native audio.
const Synth = preload("res://scripts/effects/audio_synthesis.gd")
const Birds = preload("res://scripts/effects/bird_audio.gd")
var night_factor := -1.0
var weather_wind_gain := 1.0
var weather_bird_gain := 1.0
var enabled := true
var volume := 0.75
var time_of_day := 0.38
var player_position := Vector3.ZERO
var water_query: Callable
var loops: Dictionary = {}
var bird_songs: Array[AudioStreamWAV] = []
var cricket_song: AudioStreamWAV
var voices: Array[AudioStreamPlayer] = []
var clock := 0.0
var bird_timer := 1.0
var cricket_timer := 0.7
var gust := 0.5
var gust_timer := 0.0
var probe_timer := 0.0
var water_proximity := 0.0
var movement: Node
var actions: Node
var music: AudioStreamPlayer
var suppress_block_audio := false

func setup(manifest: Dictionary = {}, budget: RefCounted = null) -> void:
	time_of_day = float(manifest.get("environment", {}).get("timeOfDay", 0.38))
	if DisplayServer.get_name() == "headless":
		return
	movement = preload("res://scripts/effects/movement_audio.gd").new()
	add_child(movement)
	await movement.setup(budget)
	actions = preload("res://scripts/effects/action_audio.gd").new()
	add_child(actions)
	actions.setup()
	actions.set_volume(volume)
	actions.set_enabled(enabled)
	if budget: await budget.checkpoint()
	for spec in [["wind", "brown", 500, 0.55, "bandpass"], ["rustle", "pink", 2600, 0.5, "highpass"], ["brook", "white", 1000, 3.2, "bandpass"], ["lap", "brown", 420, 0.5, "lowpass"]]:
		var voice := AudioStreamPlayer.new()
		var bake := Synth.noise.bind(spec[1], spec[2], spec[3], spec[4])
		voice.stream = await budget.background(bake) if budget else bake.call()
		voice.volume_db = -80
		add_child(voice)
		loops[spec[0]] = voice
		voice.play()
	music = preload("res://scripts/effects/native_music.gd").new()
	add_child(music)
	await music.setup(budget)
	music.set_world_volume(volume)
	music.set_enabled(enabled)
	for kind in ["tweet", "tweet", "trill", "whistle", "chirp"]:
		var song = await budget.background(Birds.call_song.bind(kind)) if budget else Birds.call_song(kind)
		bird_songs.append(song)
	cricket_song = await budget.background(Birds.cricket) if budget else Birds.cricket()
	for i in 4:
		var voice := AudioStreamPlayer.new()
		add_child(voice)
		voices.append(voice)

func set_enabled(value: bool) -> void:
	enabled = value
	for voice in loops.values():
		voice.stream_paused = not value
	if not value:
		for voice in voices:
			voice.stop()
	if movement:
		movement.set_enabled(value)
		if not value:
			for voice in movement.voices:
				voice.stop()
	if actions:
		actions.set_enabled(value)
	if music:
		music.set_enabled(value)

func play_action(action: String, strength := 1.0) -> void:
	if enabled and movement:
		movement.play_action(action, volume, strength)

func set_volume(value: float) -> void:
	var previous := volume
	volume = clampf(value, 0, 1)
	if previous>0:
		for voice in loops.values()+voices:
			voice.volume_linear *= volume/previous
		if movement:
			for voice in movement.voices:
				voice.volume_linear *= volume/previous
	if actions:
		actions.set_volume(volume)
	if music:
		music.set_world_volume(volume)

func play_effect(kind: String, options: Dictionary = {}) -> void:
	if enabled and actions:
		actions.play_effect(kind,options)

func block_edited(cell: Vector3i, before: int, after: int, definitions: Array) -> void:
	if enabled and actions and not suppress_block_audio:
		actions.block_edited(cell,before,after,definitions)

func set_player_position(value: Vector3) -> void:
	player_position = value

func set_time_of_day(value: float) -> void:
	time_of_day = value

func _process(delta: float) -> void:
	if loops.is_empty() or not enabled:
		return
	clock += delta
	gust_timer -= delta
	if gust_timer <= 0:
		gust_timer = randf_range(0.8, 2.4)
		gust = clampf(gust + randf_range(-0.35, 0.35), 0.1, 1)
	probe_timer -= delta
	if probe_timer <= 0:
		probe_timer = 0.4
		water_proximity = _water_nearby()
	var night := night_factor if night_factor >= 0 else 1.0 - smoothstep(-0.16, -0.035, sin(TAU * (time_of_day - 0.25)))
	if music:
		music.night_amount = night
	var height := clampf((player_position.y - 10) / 22, 0, 1)
	_gain("wind", (0.05 + 0.1 * height + 0.06 * gust) * (1 + 0.3 * night) * weather_wind_gain, delta, 0.8)
	# Gust boundaries must not abruptly change the looping waveform's pitch.
	loops.wind.pitch_scale = lerpf(loops.wind.pitch_scale, (300 + 450 * gust + 350 * height) / 500, 1.0 - exp(-delta / 1.2))
	_gain("rustle", 0.012 * gust * gust * (1 - height * 0.5) * weather_wind_gain, delta, 0.6)
	_gain("brook", 0.1 * water_proximity * water_proximity, delta, 0.5)
	loops.brook.pitch_scale = 1.0 + sin(clock * 1.7) * 0.08
	_gain("lap", 0.22 * water_proximity * (0.6 + 0.4 * sin(TAU * clock * 0.13)), delta, 0.6)
	bird_timer -= delta
	var dawn := exp(-pow((time_of_day - 0.29) / 0.06, 2))
	var bird_activity := (1 - night) * (0.25 + 0.9 * dawn) * weather_bird_gain
	if bird_timer <= 0 and bird_activity > 0.02:
		bird_timer = randf_range(0.6, 2.2) / bird_activity
		_play(bird_songs.pick_random(), randf_range(0.035, 0.075) * (1 - night * 0.4))
	cricket_timer -= delta
	if cricket_timer <= 0 and night > 0.15:
		cricket_timer = randf_range(0.55, 0.95)
		_play(cricket_song, 0.012 * night)

func _gain(key: String, value: float, delta: float, smoothing: float) -> void:
	var voice: AudioStreamPlayer = loops[key]
	voice.volume_linear = lerpf(voice.volume_linear, value * volume, 1.0 - exp(-delta / smoothing))

func _play(stream: AudioStreamWAV, gain: float) -> void:
	if not enabled or volume<=0:
		return
	for voice in voices:
		if not voice.playing:
			voice.stream = stream
			voice.volume_linear = gain * volume
			voice.play()
			return

func _water_nearby() -> float:
	if not water_query.is_valid():
		return 0.0
	if water_query.call(player_position):
		return 1.0
	var weight := 0.0
	for radius in [2.5, 5.0, 9.0, 14.0]:
		for i in 8:
			var angle: float = i / 8.0 * TAU + radius
			if water_query.call(player_position + Vector3(cos(angle), 0, sin(angle)) * radius):
				weight += 1.0 / radius
	return clampf(weight / 2.2, 0, 1)

func _exit_tree() -> void:
	for voice in loops.values() + voices:
		voice.stop()
		voice.stream = null
