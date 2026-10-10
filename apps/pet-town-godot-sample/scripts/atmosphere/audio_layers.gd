extends RefCounted
const Synth = preload("res://scripts/effects/audio_synthesis.gd")
static func hail() -> AudioStreamWAV:
	var samples := PackedFloat32Array()
	samples.resize(Synth.RATE * 4)
	for i in 160:
		var start := randi_range(0,samples.size()-900)
		var frequency := randf_range(700,1900)
		for j in 850:
			var t := float(j) / Synth.RATE
			samples[start+j] += sin(t * TAU * frequency) * exp(-t*160) * 0.15 * minf(t*3000,1)
	return Synth.pcm(samples,true)
static func thunder() -> AudioStreamWAV:
	var samples := PackedFloat32Array()
	samples.resize(Synth.RATE * 6)
	var brown := 0.0
	for i in samples.size():
		var t := float(i) / Synth.RATE
		brown = (brown + randf_range(-1,1)*0.04)/1.04
		var envelope := smoothstep(0,0.22,t)*exp(-t/1.7)*(0.7+sin(t*7)*0.18)
		samples[i] = (brown*2.5 + sin(t*TAU*49)*0.12)*envelope
	return Synth.pcm(samples,false)
