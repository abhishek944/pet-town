extends Node
## UI event sounds share the world's persisted master volume and mute state.
var hud: CanvasLayer
var ambience: Node
var previous_panel := ""
var was_audible := true

func setup(interface: CanvasLayer, audio: Node) -> void:
	hud=interface
	ambience=audio
	was_audible=hud.sound_enabled
	hud.settings_toggled.connect(panel_changed)
	hud.sound_toggled.connect(sound_changed)

func panel_changed(open: bool) -> void:
	if open:
		if hud.active_panel!="Welcome": ambience.play_effect("open")
	elif not previous_panel.is_empty():
		ambience.play_effect("start" if previous_panel=="Welcome" else "close")
	previous_panel=hud.active_panel if open else ""

func sound_changed(enabled: bool) -> void:
	if enabled and not was_audible: ambience.play_effect("click")
	was_audible=enabled
