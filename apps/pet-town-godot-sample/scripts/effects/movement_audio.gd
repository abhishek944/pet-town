extends Node
## Short native versions of source movement-handler frequencies and decay envelopes.
const Synth = preload("res://scripts/effects/audio_synthesis.gd")
var clips: Dictionary = {}
var voices: Array[AudioStreamPlayer] = []

func setup(budget: RefCounted = null) -> void:
	if DisplayServer.get_name() == "headless":
		return
	for i in 6:
		var voice := AudioStreamPlayer.new()
		add_child(voice)
		voices.append(voice)
	clips = await budget.background(bake_clips) if budget else bake_clips()

static func bake_clips() -> Dictionary:
	var result := {}
	result.jump = _clip(300, 640, 0.11, 0.08, 0.06, "pink", 700, 0.07, 0.05)
	result.land = _clip(110, 42, 0.14, 0.22, 0.06, "brown", 900, 0.2, 0.04)
	result.grass = _clip(120, 70, 0.05, 0.1, 0.03, "pink", 2600, 0.16, 0.04)
	result.dirt = _clip(95, 55, 0.06, 0.16, 0.035, "brown", 900, 0.35, 0.04)
	result.wood = _clip(190, 140, 0.07, 0.2, 0.055, "white", 1800, 0.08, 0.012)
	result.stone = _clip(230, 180, 0.08, 0.06, 0.025, "white", 2700, 0.13, 0.018)
	result.water = _clip(600, 1100, 0.05, 0.04, 0.03, "white", 700, 0.14, 0.05)
	result.splash = _clip(700, 1500, 0.04, 0.035, 0.025, "white", 1600, 0.22, 0.09)

	return result

func play_action(action: String, volume := 0.75, strength := 1.0) -> void:
	if not clips.has(action):
		action = "grass"
	for voice in voices:
		if not voice.playing:
			voice.stream = clips[action]
			voice.volume_linear = volume * strength * 1.125
			voice.pitch_scale = randf_range(0.94, 1.06)
			voice.play()
			return

static func _clip(start: float, finish: float, glide: float, peak: float, decay: float, kind: String, frequency: float, noise_peak: float, noise_decay: float) -> AudioStreamWAV:
	var noise := Synth.noise(kind, frequency, 0.8).data
	var samples := PackedFloat32Array()
	samples.resize(int(Synth.RATE * 0.5))
	var phase := 0.0
	for i in samples.size():
		var t := float(i) / Synth.RATE
		phase += TAU * start * pow(finish / start, minf(t / glide, 1.0)) / Synth.RATE
		var attack := minf(t / 0.003, 1.0)
		samples[i] = sin(phase) * attack * peak * exp(-t / decay)
		samples[i] += float(noise.decode_s16(i * 2)) / 32767.0 * minf(t / 0.006, 1.0) * noise_peak * exp(-t / noise_decay)
	return Synth.pcm(samples, false)

func set_enabled(value: bool) -> void:
	for voice in voices:
		voice.stream_paused = not value

func _exit_tree() -> void:
	for voice in voices:
		voice.stop()
		voice.stream = null
