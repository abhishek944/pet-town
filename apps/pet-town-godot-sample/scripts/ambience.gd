extends Node

var voices: Array[AudioStreamPlayer] = []

func _ready() -> void:
	if DisplayServer.get_name() == "headless":
		return
	for file in ["birds_dawn", "wind"]:
		var voice := AudioStreamPlayer.new()
		var stream = load("res://assets/audio/" + file + ".ogg")
		stream.loop = true
		voice.stream = stream
		voice.volume_db = -24 if file == "birds_dawn" else -30
		add_child(voice)
		voices.append(voice)
		voice.play()

func set_enabled(enabled: bool) -> void:
	for voice in voices:
		voice.stream_paused = not enabled

func _exit_tree() -> void:
	for voice in voices:
		voice.stop()
		voice.stream = null
	voices.clear()
