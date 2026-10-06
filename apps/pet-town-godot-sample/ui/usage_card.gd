extends PanelContainer

const Format = preload("res://ui/usage_format.gd")
const View = preload("res://ui/usage_card_view.gd")
var view := View.new()
var expanded := false
var overlay_visible_by_intent := false
var visibility_allowed := true
var has_snapshot := false

func _ready() -> void:
	view.build(self, Callable(self, "toggle_details"))
	_sync_visibility()

func render_combined(snapshot: Dictionary, selected_reading: Dictionary, selected_label: String, selected_model := "") -> void:
	var available: bool = snapshot.get("available", false)
	var town: Dictionary = snapshot.get("totals", {}) if available else {}
	var primary := _view_data(town, true, "" if available else "Usage collector unavailable")
	primary.coverage = _coverage(snapshot, town)
	var following := _view_data(selected_reading, false)
	if not selected_model.is_empty(): following.model = selected_model
	has_snapshot = not snapshot.is_empty() or not selected_reading.is_empty() or not selected_label.is_empty()
	view.render_combined(primary, following, selected_label, expanded)
	_sync_visibility()

func render(reading: Dictionary, name: String, model: String, fallback: String, is_followed := false) -> void:
	var primary := _view_data(reading, not is_followed, fallback if not is_followed else "")
	primary.model = model if is_followed else ""
	var summary := model if not model.is_empty() else fallback
	if is_followed:
		summary = primary.status + (" · " + model if not model.is_empty() else "")
	elif reading.get("status", "") == "partial" and not summary.contains("Partial"):
		summary += " · Partial"
	elif reading.get("status", "") == "measured" and not summary.contains("Measured"):
		summary += " · Measured"
	elif not primary.available and not summary.contains(primary.status):
		summary += " · " + primary.status
	primary.coverage = summary
	has_snapshot = not reading.is_empty() or not fallback.is_empty()
	view.render_single(primary, name, expanded)
	_sync_visibility()

func _view_data(reading: Dictionary, is_town: bool, fallback := "") -> Dictionary:
	return {"reading": reading, "available": _available(reading), "status": _status(reading, fallback), "note": _note(reading, is_town, fallback), "model": str(reading.get("model", "")), "is_town": is_town}

func _coverage(snapshot: Dictionary, reading: Dictionary) -> String:
	var measured := Format.count(snapshot.get("measuredSessions"))
	var tracked := Format.count(snapshot.get("trackedSessions"))
	var status := str(reading.get("status", ""))
	var state := "Unavailable" if not snapshot.get("available", false) or status in ["unavailable", "unsupported"] else "Partial" if status == "partial" else "Measured" if status == "measured" else "Waiting"
	return "Codex · %s/%s tracked sessions · %s" % [measured, tracked, state]

func _available(reading: Dictionary) -> bool:
	return reading.get("status", "") in ["measured", "partial"]

func _status(reading: Dictionary, fallback := "") -> String:
	match str(reading.get("status", "")):
		"measured": return "Measured"
		"partial": return "Partial · some usage is unavailable"
		"unsupported": return "Unavailable · unsupported"
		"unavailable": return "Unavailable"
		_: return fallback if not fallback.is_empty() else "Usage unavailable"

func _note(reading: Dictionary, is_town: bool, fallback := "") -> String:
	var note := "Partial reading · some usage is unavailable." if reading.get("status", "") == "partial" else "Recorded usage." if reading.get("status", "") == "measured" else fallback if not fallback.is_empty() else "Usage is unavailable; no zero is assumed."
	if is_town: note += " Town covers locally tracked Codex sessions, not all providers or account-wide use."
	return note + " Cached input is included in input and must not be added twice. Standard credits are estimates, not billed cost or account allowance."

func set_overlay_visible(value: bool) -> void:
	overlay_visible_by_intent = value
	_sync_visibility()

func toggle_overlay_visible() -> bool:
	set_overlay_visible(not overlay_visible_by_intent)
	return overlay_visible_by_intent

func set_visibility_allowed(value: bool) -> void:
	visibility_allowed = value
	_sync_visibility()

func toggle_details() -> void:
	expanded = not expanded
	view.set_expanded(expanded)

func _sync_visibility() -> void:
	visible = overlay_visible_by_intent and visibility_allowed and has_snapshot
