extends RefCounted
const Clock = preload("res://scripts/atmosphere/clock.gd")
const DEFAULTS := {"version":1, "mode":"running", "pace":"medium", "town_seconds":32400.0,
	"held_preset":"morning", "weather":"clear", "intensity":"balanced", "lightning":"soft",
	"reduced_motion":false, "quality":"auto", "weather_volume":0.6,
	"thunder_enabled":true, "duck_for_mayor":true}
const OPTIONS := {"mode":["running","held"], "pace":["fast","medium","slow"],
	"held_preset":["early_morning","morning","noon","afternoon","evening","dusk","night"],
	"weather":["clear","cloudy","light_rain","heavy_rain","thunderstorm","hailstorm","windy","mist"],
	"intensity":["gentle","balanced","dramatic"], "lightning":["off","soft","full"],
	"quality":["auto","low","medium","high"]}
var data := DEFAULTS.duplicate()
func restore(saved: Dictionary) -> void:
	data = DEFAULTS.duplicate()
	if saved.get("version", 1) != 1: return
	for field in DEFAULTS:
		if field == "version" or not saved.has(field): continue
		if _valid(field, saved[field]): data[field] = saved[field]
	if data.mode == "held": data.town_seconds = Clock.hold(float(data.town_seconds), data.held_preset)
func _valid(field: String, value: Variant) -> bool:
	if OPTIONS.has(field): return value is String and value in OPTIONS[field]
	if field in ["town_seconds", "weather_volume"]:
		if not (value is int or value is float) or not is_finite(float(value)): return false
		return float(value) >= 0 and float(value) <= (1.0 if field == "weather_volume" else 864000000000.0)
	return DEFAULTS.has(field) and DEFAULTS[field] is bool and value is bool
func request(field: String, value: Variant) -> bool:
	if not _valid(field, value): return false
	if data[field] == value and field != "held_preset": return false
	data[field] = value
	if field == "held_preset" or (field == "mode" and value == "held"):
		data.mode = "held"
		data.town_seconds = Clock.hold(float(data.town_seconds), str(data.held_preset))
	return true
func advance(delta: float) -> void:
	if data.mode == "running" and is_finite(delta):
		data.town_seconds = Clock.advance(float(data.town_seconds), delta, data.pace)
func phase() -> float:
	return fposmod(float(data.town_seconds) / Clock.DAY, 1.0)
func snapshot() -> Dictionary:
	return data.duplicate()
