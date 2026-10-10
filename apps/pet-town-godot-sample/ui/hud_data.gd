extends CanvasLayer

signal ocean_helm(action: String, held: bool)
signal ocean_interact
signal asset_replace_requested(id: String, target: String, yaw: float)
signal asset_restore_requested(target: String)
signal asset_replace_preview_requested(id: String, target: String, yaw: float)

func set_companions(entries: Array, selected_id: String = "") -> void:
	get("live").set_companions(entries, selected_id)
func set_usage(town: Dictionary, selected: Dictionary = {}) -> void:
	get("live").set_usage(town, selected)
func set_mayor(state: Dictionary) -> void:
	get("live").set_mayor(state)
func set_terminal(state: Dictionary, defer_view := false) -> void:
	get("live").set_terminal(state, defer_view)
func refresh_terminal() -> void:
	get("live").refresh_terminal()
func set_pet_catalog(entries: Array) -> void:
	get("live").pet_catalog = entries
	get("modal").pet_catalog = entries
func set_build_pointer(point: Vector2, state: String, material := "") -> void:
	get("live").set_build_pointer(point, state, material)
func set_journal_reminder(entry: Dictionary) -> void:
	get("journal").set_reminder(entry)

func set_ocean_data(compass: Dictionary, interaction: String = "", piloting: bool = false, swimming: bool = false, body: RigidBody3D = null) -> void:
	get("live").ocean.swim.set_actor(body)
	get("live").ocean.set_data(compass, interaction, piloting, swimming)

func set_asset_targets(entries: Array) -> void:
	get("library").targets.set_data(entries)

func set_app_update(state: Dictionary) -> void:
	get("modal").set_app_update(state)

func touch_contains_point(point: Vector2) -> bool:
	return get("live").touch.contains_point(point)

func set_companion_labels(records: Array, camera: Camera3D, selected_id: String = "", viewport_size := Vector2.ZERO) -> void:
	get("live").labels.set_data(records, camera, selected_id, viewport_size)
	get("live").update_reply_anchor()

# Atmosphere adapter shared by the HUD clock and the cached native settings page.
signal atmosphere_changed(field: String, value: Variant)
var clock_entry: Button
func open_atmosphere() -> void:
	if get("active_panel") == "Time & weather":
		call("close_panel")
		return
	call("open_panel","Time & weather")
	get("modal").close_button.call_deferred("grab_focus")
func set_atmosphere(snapshot: Dictionary) -> void:
	get("modal").atmosphere_snapshot = snapshot
	if is_instance_valid(get("modal").atmosphere_page): get("modal").atmosphere_page.set_state(snapshot)
	var seconds: float = snapshot.town_seconds
	var night := fposmod(seconds,86400) < 21600 or fposmod(seconds,86400) >= 72000
	var weather: String = preload("res://ui/atmosphere_weather_controls.gd").LABELS[snapshot.weather]
	if snapshot.weather == "clear": weather = "Clear night" if night else "Sunny"
	get("weather_label").text = "%s%s · Day %d" % [weather," · held" if snapshot.mode == "held" else "",1+int(seconds/86400)]

func set_atmosphere_saved(value: bool) -> void:
	get("modal").atmosphere_saved = value
	if is_instance_valid(get("modal").atmosphere_page): get("modal").atmosphere_page.set_saved(value)
