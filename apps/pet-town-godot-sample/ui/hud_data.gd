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

func set_ocean_data(compass: Dictionary, interaction: String = "", piloting: bool = false, swimming: bool = false) -> void:
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
