extends AudioStreamPlayer
## Source-inspired 80 BPM bell/mallet melody and soft chords, timed in PCM.
const Synth = preload("res://scripts/effects/audio_synthesis.gd")
const BEAT := 0.75
const LENGTH := BEAT * 32
const CHORDS := [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]]
const MELODY := [0, 4, 7, 9, 7, 4, 2, 4, 9, 12, 9, 7, 4, 2, 4, 0]
var world_volume := 0.75
var night_amount := 0.0

func setup() -> void:
	var samples := PackedFloat32Array()
	samples.resize(int(LENGTH * Synth.RATE))
	for bar in CHORDS.size():
		var start := bar * BEAT * 8
		for degree in CHORDS[bar]:
			_note(samples, start, 60 + degree, BEAT * 9, 0.018, "pad")
		_note(samples, start, 48 + CHORDS[bar][0], 2.0, 0.09, "mallet")
		_note(samples, start + BEAT * 4, 48 + CHORDS[bar][2], 2.0, 0.06, "mallet")
	for index in MELODY.size():
		_note(samples, index * BEAT * 2 + BEAT * 0.5, 72 + MELODY[index], 2.5, 0.07, "bell")
	stream = Synth.pcm(samples, true)
	volume_linear = 0.0
	play()

func set_world_volume(value: float) -> void:
	world_volume = clampf(value, 0.0, 1.0)
	if world_volume == 0.0:
		volume_linear = 0.0

func set_enabled(value: bool) -> void:
	stream_paused = not value

func _process(delta: float) -> void:
	if stream_paused:
		return
	var target := world_volume * lerpf(0.8, 0.55, night_amount)
	volume_linear = lerpf(volume_linear, target, 1.0 - exp(-delta / 0.6))

static func _note(samples: PackedFloat32Array, start: float, midi: int, duration: float, gain: float, instrument: String) -> void:
	var frequency := 440.0 * pow(2.0, (midi - 69.0) / 12.0)
	var offset := int(start * Synth.RATE)
	var count := int(duration * Synth.RATE)
	for i in count:
		var t := float(i) / Synth.RATE
		var release := minf(float(count - 1 - i) / (Synth.RATE * 0.03), 1.0)
		var phase := TAU * frequency * t
		var value := sin(phase)
		var envelope := 0.0
		match instrument:
			"pad":
				envelope = pow(sin(PI * float(i) / (count - 1)), 2.0)
				value += sin(phase * 2.0) * 0.12
			"mallet":
				envelope = minf(t / 0.008, 1.0) * exp(-t / 0.35) * release
				value += sin(phase * 3.93) * 0.28 * exp(-t / 0.056)
			"bell":
				envelope = minf(t / 0.008, 1.0) * exp(-t / 0.7) * release
				value += sin(phase * 2.0) * 0.22 * exp(-t / 0.35)
		# Wrap note tails into the beginning, keeping the loop boundary continuous.
		samples[(offset + i) % samples.size()] += value * envelope * gain

func _exit_tree() -> void:
	stop()
	stream = null
