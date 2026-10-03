extends AudioStreamPlayer
## Same four bell MIDI notes, stagger and partial ratios as source feedback-handlers.js.
func _ready() -> void:
	var rate := 24000
	var seconds := 1.5
	var pcm := PackedByteArray()
	pcm.resize(int(rate * seconds) * 2)
	var notes := [84, 88, 91, 96]
	for sample_index in int(rate * seconds):
		var time := float(sample_index) / rate
		var sample := 0.0
		for note_index in notes.size():
			var t := time - note_index * 0.075
			if t < 0:
				continue
			var frequency := 440.0 * pow(2.0, (notes[note_index] - 69.0) / 12.0)
			var decay := clampf(0.95 * pow(523.0 / frequency, 0.45), 0.28, 1.5)
			var attack := minf(t / 0.003, 1.0)
			sample += sin(TAU * frequency * t) * 0.09 * attack * exp(-t / decay)
			sample += sin(TAU * frequency * 2.0 * t) * 0.0198 * attack * exp(-t / (decay * 0.5))
			if frequency * 6.27 < 11000:
				sample += sin(TAU * frequency * 6.27 * t) * 0.009 * attack * exp(-t / 0.045)
		var glide := time - 0.02
		if glide > 0:
			var phase := 600.0 * glide + 500.0 * (glide - 0.09 * (1.0 - exp(-glide / 0.09)))
			sample += sin(TAU * phase) * 0.06 * exp(-glide / 0.06)
		pcm.encode_s16(sample_index * 2, int(clampf(sample, -1, 1) * 32767))
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = rate
	wav.data = pcm
	stream = wav
	volume_db = -6.0
