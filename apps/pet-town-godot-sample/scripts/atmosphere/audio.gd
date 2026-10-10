extends Node
const Synth = preload("res://scripts/effects/audio_synthesis.gd")
const Layers = preload("res://scripts/atmosphere/audio_layers.gd")
var ambience: Node
var loops := {}
var thunder_voices: Array[AudioStreamPlayer] = []
var thunder_stream: AudioStreamWAV
var options := {}
var effect := {}
var speaking := false
var duck := 1.0
var pending: Array[Dictionary] = []
func setup(owner_ambience: Node, budget: RefCounted = null) -> void:
	ambience = owner_ambience
	if DisplayServer.get_name() == "headless": return
	var rain_bake := Synth.noise.bind("pink",1500,0.7,"highpass")
	var rain = await budget.background(rain_bake) if budget else rain_bake.call()
	var hail = await budget.background(Layers.hail) if budget else Layers.hail()
	for spec in [["rain",rain],["hail",hail]]:
		var voice := AudioStreamPlayer.new()
		voice.stream = spec[1]
		voice.volume_db = -80
		add_child(voice)
		voice.play()
		loops[spec[0]] = voice
	thunder_stream = await budget.background(Layers.thunder) if budget else Layers.thunder()
	for i in 2:
		var voice := AudioStreamPlayer.new()
		voice.stream = thunder_stream
		add_child(voice)
		thunder_voices.append(voice)
func apply(snapshot: Dictionary, sample: Dictionary) -> void:
	options = snapshot
	effect = sample
	if not options.thunder_enabled or effect.weather != "thunderstorm":
		pending.clear()
		for voice in thunder_voices: voice.stop()
func set_mayor_speaking(value: bool) -> void: speaking = value
func queue_thunder(distance: float, strength: float) -> void:
	if options.is_empty() or not options.thunder_enabled or not ambience.enabled: return
	if pending.size() < 2: pending.append({"delay":distance/343.0,"strength":strength})
func _process(delta: float) -> void:
	if options.is_empty() or effect.is_empty(): return
	var master: float = ambience.volume if ambience.enabled else 0.0
	duck = lerpf(duck,0.25 if speaking and options.duck_for_mayor else 1.0,1-exp(-delta/(0.15 if speaking else 0.9)))
	var volume: float = master * options.weather_volume * duck
	# Reuse existing wind/rustle beds, rather than adding another wind loop.
	ambience.weather_wind_gain = float(options.weather_volume) * duck * (0.35 + float(effect.audio_wind)*1.8)
	ambience.weather_bird_gain = 1.0 - clampf(float(effect.audio_rain)+float(effect.audio_hail),0,1)*0.8
	for key in loops:
		var voice: AudioStreamPlayer = loops[key]
		voice.stream_paused = master <= 0
		var amount: float = effect.audio_rain if key == "rain" else effect.audio_hail
		var target: float = amount * volume * (0.3 if key == "rain" else 0.35)
		voice.volume_linear = minf(volume,lerpf(voice.volume_linear,target,1-exp(-delta/0.7)))
	if master <= 0 or options.weather_volume <= 0:
		pending.clear()
		for voice in thunder_voices: voice.stop()
		return
	for voice in thunder_voices:
		if voice.playing: voice.volume_linear = volume * float(voice.get_meta("strength",0.3)) * 0.6
	for event in pending: event.delay -= delta
	for i in range(pending.size()-1,-1,-1):
		if pending[i].delay > 0: continue
		for voice in thunder_voices:
			if voice.playing: continue
			voice.set_meta("strength",pending[i].strength)
			voice.volume_linear = volume * pending[i].strength * 0.6
			voice.play()
			break
		pending.remove_at(i)
func stop() -> void:
	pending.clear()
	for voice in loops.values()+thunder_voices: voice.stop()
func _exit_tree() -> void: stop()
