extends Node
## Source WebAudio envelopes baked once to PCM, mixed by a reusable native voice pool.
const DIRECTORY := "res://scripts/effects/action_audio/"
const SURFACES := ["grass","leaves","dirt","sand","stone","gravel","wood","glass","water","snow"]
const SURFACE_KEYS := {"grass":"grass","leaves":"leaves","flower":"grass","dirt":"dirt","clay":"dirt","path":"dirt","sand":"sand","gravel":"gravel","planks":"wood","log":"wood","lantern":"wood","glass":"glass","water":"water","snow":"snow"}
var clips: Dictionary = {}
var voices: Array[AudioStreamPlayer] = []
var volume := .75
var enabled := true
var place_run := 0
var last_place_msec := -10000
var next_voice := 0

func setup() -> void:
	var names: Array[String] = ["glass","lantern","click","deny","undo","redo","shutter","toast","open","close","pet","banner","start"]
	for surface in SURFACES:
		names.append("place_"+surface)
		for variant in 3:
			names.append("break_%s_%s"%[surface,variant])
	for index in 12:
		names.append("select_%s"%index)
	for index in 10:
		names.append("place_note_%s"%index)
	for name in names:
		var path := DIRECTORY+name+".wav"
		# Raw WAV works before editor import; exported builds use the imported resource.
		if FileAccess.file_exists(path):
			var bytes := FileAccess.get_file_as_bytes(path)
			if bytes.size()<44:
				continue
			var stream := AudioStreamWAV.new()
			stream.format = AudioStreamWAV.FORMAT_16_BITS
			stream.stereo = true
			stream.mix_rate = 22050
			stream.data = bytes.slice(44)
			clips[name] = stream
		else:
			clips[name] = load(path)
	for i in 24:
		var voice := AudioStreamPlayer.new()
		add_child(voice)
		voices.append(voice)

func play_effect(kind: String, options: Dictionary = {}) -> void:
	if not enabled or volume<=0:
		return
	var surface: String = options.get("surface","stone")
	if surface not in SURFACES:
		surface = "stone"
	if kind=="place":
		var now := Time.get_ticks_msec()
		place_run = mini(place_run+1,9) if now-last_place_msec<1300 else 0
		last_place_msec = now
		_play("place_"+surface,1.125)
		_play("place_note_%s"%place_run,1.125)
		if options.get("key","") in ["glass","lantern"]:
			_play(str(options.key),1.125)
	elif kind=="break":
		_play("break_%s_%s"%[surface,randi_range(0,2)],1.125)
	elif kind=="select":
		_play("select_%s"%posmod(int(options.get("index",0)),12),.875)
	else:
		_play(kind,.875)

func block_edited(_cell: Vector3i, before: int, after: int, definitions: Array) -> void:
	if before==after:
		return
	var id := after if after>0 else before
	if id<0 or id>=definitions.size():
		return
	var definition: Dictionary = definitions[id]
	var key := str(definition.get("key",definition.get("name","stone"))).to_lower().replace(" ","")
	play_effect("place" if after>0 else "break",{"key":key,"surface":SURFACE_KEYS.get(key,"stone")})

func _play(name: String, gain: float) -> void:
	if not clips.has(name) or not clips[name] or voices.is_empty():
		return
	var voice: AudioStreamPlayer = voices[next_voice]
	for candidate in voices:
		if not candidate.playing:
			voice = candidate
			break
	next_voice = (next_voice+1)%voices.size()
	voice.stop()
	voice.stream = clips[name]
	voice.set_meta("gain",gain)
	voice.volume_linear = volume*gain
	voice.play()

func set_enabled(value: bool) -> void:
	enabled = value
	if not value:
		for voice in voices:
			voice.stop()

func set_volume(value: float) -> void:
	volume = clampf(value,0,1)
	for voice in voices:
		voice.volume_linear = volume*float(voice.get_meta("gain",1.0))

func _exit_tree() -> void:
	for voice in voices:
		voice.stop()
		voice.stream = null
