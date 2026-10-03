extends RefCounted
const Synth = preload("res://scripts/effects/audio_synthesis.gd")

static func call_song(kind: String) -> AudioStreamWAV:
	var f := randf_range(2600, 4300)
	var parts := []
	match kind:
		"tweet":
			for i in randi_range(2, 4):
				parts.append({"start": i * randf_range(0.1, 0.14), "f": f, "end": f * randf_range(1.2, 1.45), "life": 0.07, "gain": 0.55})
		"chirp":
			for i in 3:
				parts.append({"start": i * 0.07, "f": f * 1.5, "end": f * 0.95, "life": 0.045, "gain": 0.5})
		"whistle":
			parts = [{"f": f * 0.8, "end": f * 0.82, "life": 0.24, "gain": 0.4}, {"start": 0.3, "f": f * 0.66, "end": f * 0.64, "life": 0.26, "gain": 0.38}]
		_:
			parts = [{"f": f, "life": 0.35, "gain": 0.4, "vibrato": randf_range(22, 32), "depth": f * 0.09}]
	return Synth.tones(parts, 1.0)

static func cricket() -> AudioStreamWAV:
	var parts := []
	var f := randf_range(4100, 5200)
	for i in randi_range(3, 4):
		parts.append({"start": i * 0.042, "f": f, "life": 0.018, "gain": 1.0})
	return Synth.tones(parts, 0.25)
