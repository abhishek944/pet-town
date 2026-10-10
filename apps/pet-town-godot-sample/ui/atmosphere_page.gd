extends VBoxContainer
signal changed(field: String, value: Variant)
const S = preload("res://ui/atmosphere_style.gd")
var snapshot := preload("res://scripts/atmosphere/state.gd").DEFAULTS.duplicate()
var running: VBoxContainer
var held: VBoxContainer
var quality: OptionButton
var volume_label: Label
var volume_slider: HSlider
var saved_caption: Label
var saved_ok := true
var time_summary: Label
var weather_summary: Label
var applying := false
var bound_snapshot: Dictionary = {}
func _ready() -> void:
	size_flags_horizontal = Control.SIZE_EXPAND_FILL
	add_theme_constant_override("separation",8)
	preload("res://ui/settings_content.gd").intro(self, "Y O U R  T O W N,  Y O U R  A T M O S P H E R E", "Time & weather", "Let the day wander, or stay in a moment you love.")
	preload("res://ui/atmosphere_time_controls.gd").build(self)
	preload("res://ui/atmosphere_weather_controls.gd").build(self)
	preload("res://ui/atmosphere_effect_controls.gd").build(self)
	preload("res://ui/atmosphere_sound_controls.gd").build(self)
	visibility_changed.connect(_refresh_state)
	set_state(snapshot)
func choose(field: String, value: Variant) -> void:
	if not applying: changed.emit(field,value)
func set_state(value: Dictionary) -> void:
	snapshot = value
	_refresh_state()
func _refresh_state() -> void:
	if not is_node_ready() or not is_visible_in_tree(): return
	# The advancing clock does not change any settings control.
	var controls := snapshot.duplicate()
	controls.erase("town_seconds")
	if controls == bound_snapshot: return
	bound_snapshot = controls
	applying = true
	running.visible = snapshot.mode == "running"
	held.visible = not running.visible
	_bind(self)
	time_summary.text = snapshot.held_preset.replace("_"," ").capitalize()+" · held" if snapshot.mode == "held" else snapshot.pace.capitalize()+" · "+{"fast":"16 min","medium":"1 hour","slow":"4 hours"}[snapshot.pace]+" / day"
	weather_summary.text = preload("res://ui/atmosphere_weather_controls.gd").LABELS[snapshot.weather]
	quality.select(["auto","low","medium","high"].find(snapshot.quality))
	volume_slider.set_value_no_signal(snapshot.weather_volume)
	volume_label.text = "Weather volume · %d%%" % roundi(float(snapshot.weather_volume)*100)
	applying = false
func _bind(node: Node) -> void:
	if node.has_meta("field"):
		var field: String = node.get_meta("field")
		if node is CheckButton: node.set_pressed_no_signal(bool(snapshot[field]))
		elif node is Button: S.selected(node,snapshot[field]==node.get_meta("value"),node.get_meta("segment",false))
	for child in node.get_children(): _bind(child)

func set_saved(value: bool) -> void:
	saved_ok = value
	if not is_instance_valid(saved_caption): return
	saved_caption.text = "✓  Remembered on this device\n\nTime, weather and effects resume where you left them.\nThe sky clock rests while the app is closed." if value else "Atmosphere active · saving unavailable\n\nChanges apply now, but could not be saved on this device.\nWe will retry automatically."
