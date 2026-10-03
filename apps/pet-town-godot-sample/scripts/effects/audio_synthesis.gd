extends RefCounted
## Native PCM counterpart of audio/synthesis/create-noise-buffer and oscillator envelopes.
const RATE := 22050

static func noise(kind: String, frequency: float, q: float, filter_kind := "bandpass") -> AudioStreamWAV:
	var count := RATE * 4
	var seam := int(RATE * 0.08)
	var samples := PackedFloat32Array()
	samples.resize(count + seam)
	var state := PackedFloat64Array([0, 0, 0, 0, 0, 0, 0, 0])
	for i in samples.size():
		var white := randf_range(-1, 1)
		if kind == "pink":
			state[0] = 0.99886 * state[0] + white * 0.0555179
			state[1] = 0.99332 * state[1] + white * 0.0750759
			state[2] = 0.969 * state[2] + white * 0.153852
			state[3] = 0.8665 * state[3] + white * 0.3104856
			state[4] = 0.55 * state[4] + white * 0.5329522
			state[5] = -0.7616 * state[5] - white * 0.016898
			samples[i] = (state[0] + state[1] + state[2] + state[3] + state[4] + state[5] + state[6] + white * 0.5362) * 0.11
			state[6] = white * 0.115926
		elif kind == "brown":
			state[7] = (state[7] + 0.02 * white) / 1.02
			samples[i] = state[7] * 3.2
		else:
			samples[i] = white * 0.5
	_filter(samples, frequency, q, filter_kind)
	for i in seam:
		var weight := float(i) / seam
		samples[i] = samples[i] * weight + samples[count + i] * (1 - weight)
	samples.resize(count)
	return pcm(samples, true)

static func _filter(samples: PackedFloat32Array, frequency: float, q: float, kind: String) -> void:
	var omega := TAU * frequency / RATE
	var c := cos(omega)
	var alpha := sin(omega) / (2.0 * q)
	var b0 := alpha
	var b1 := 0.0
	var b2 := -alpha
	if kind == "lowpass":
		b0 = (1 - c) * 0.5
		b1 = 1 - c
		b2 = b0
	elif kind == "highpass":
		b0 = (1 + c) * 0.5
		b1 = -(1 + c)
		b2 = b0
	var a0 := 1 + alpha
	var x1 := 0.0
	var x2 := 0.0
	var y1 := 0.0
	var y2 := 0.0
	for i in samples.size():
		var value := float(samples[i])
		var y := (b0 * value + b1 * x1 + b2 * x2 + 2 * c * y1 - (1 - alpha) * y2) / a0
		x2 = x1
		x1 = value
		y2 = y1
		y1 = y
		samples[i] = y

static func tones(parts: Array, duration := 1.0) -> AudioStreamWAV:
	var samples := PackedFloat32Array()
	samples.resize(int(duration * RATE))
	for part in parts:
		var phase := 0.0
		var start := int(float(part.get("start", 0)) * RATE)
		var life := float(part.get("life", 0.07))
		for i in mini(int(life * 2.5 * RATE), samples.size() - start):
			var t := float(i) / RATE
			var frequency := float(part.f) * pow(float(part.get("end", part.f)) / float(part.f), minf(t / life, 1.0))
			frequency += sin(t * TAU * float(part.get("vibrato", 0))) * float(part.get("depth", 0))
			phase += TAU * frequency / RATE
			var envelope := minf(t / 0.008, 1.0) * exp(-maxf(0, t - life * 0.5) / (life * 0.25))
			samples[start + i] += sin(phase) * envelope * float(part.get("gain", 0.5))
	return pcm(samples, false)

static func pcm(samples: PackedFloat32Array, looping: bool) -> AudioStreamWAV:
	var bytes := PackedByteArray()
	bytes.resize(samples.size() * 2)
	for i in samples.size():
		bytes.encode_s16(i * 2, int(clampf(samples[i], -1, 1) * 32767))
	var stream := AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = RATE
	stream.data = bytes
	if looping:
		stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
		stream.loop_end = samples.size()
	return stream
