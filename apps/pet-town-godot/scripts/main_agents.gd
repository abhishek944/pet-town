extends "res://scripts/main_camera.gd"

func _select_agent_at(screen_position: Vector2, open_details: bool) -> void:
	var origin := camera.project_ray_origin(screen_position)
	var ray := PhysicsRayQueryParameters3D.create(origin, origin + camera.project_ray_normal(screen_position) * 1000.0, 2)
	var hit := get_world_3d().direct_space_state.intersect_ray(ray)
	if hit.is_empty() or not hit.collider.is_in_group("live_agents"):
		return
	_follow_pet(hit.collider as CharacterBody3D)
	if open_details:
		_open_details()

func _follow_pet(pet: CharacterBody3D) -> void:
	if not is_instance_valid(pet):
		return
	if controlled_pet != pet:
		_release_control()
	selected_pet = pet
	selected_id = pet.agent_id
	following_pet = true
	camera_at_overview = false
	camera_distance = 25.0
	camera_target = pet.get_global_transform_interpolated().origin + FOLLOW_OFFSET

func _toggle_control() -> void:
	if is_instance_valid(controlled_pet):
		_release_control()
	elif following_pet and is_instance_valid(selected_pet) and not selected_pet.retiring:
		controlled_pet = selected_pet
		controlled_pet.set_manual_control(true)
	_refresh_details()

func _release_control() -> void:
	if is_instance_valid(controlled_pet):
		controlled_pet.set_manual_control(false)
	controlled_pet = null

func _cycle_agent() -> void:
	if stable_agent_ids.is_empty():
		return
	var index := stable_agent_ids.find(selected_id)
	var next_id := stable_agent_ids[(index + 1) % stable_agent_ids.size()]
	var pet: CharacterBody3D = pets_by_id.get(next_id)
	if is_instance_valid(pet):
		_follow_pet(pet)

func _open_details() -> void:
	if selected_id.is_empty():
		return
	details_panel.visible = true
	_refresh_details(true)
	if has_method("_refresh_command_hint"):
		call("_refresh_command_hint")

func _close_details() -> void:
	details_panel.visible = false
	avatar_dragging = false
	if has_method("_refresh_command_hint"):
		call("_refresh_command_hint")

func _refresh_details(force_avatar := false) -> void:
	if not _details_are_open():
		return
	var record: Dictionary = agents_by_id.get(selected_id, {})
	var ended := record.is_empty()
	var label: String = String(record.get("label", "")) if not ended else (selected_pet.display_name if is_instance_valid(selected_pet) else "Agent ended")
	var status := "ended" if ended else String(record.get("status", "unknown")).to_lower()
	details_name.text = label
	details_subtitle.text = "Town mayor" if selected_id == MAYOR_ID else ("Town resident" if ended else "%s resident" % _appearance_for(selected_id))
	details_status.text = "Listening" if selected_id == MAYOR_ID and mayor_listening else _display_status(status)
	details_status.modulate = _status_color(status)
	details_source.text = "—" if ended else _display_source(String(record.get("source", "")))
	details_camera.text = "Driving" if controlled_pet == selected_pet and is_instance_valid(controlled_pet) else ("Following" if following_pet else "Selected")
	details_appearance.text = _appearance_for(selected_id)
	details_action.disabled = ended or String(record.get("source", "")).to_lower() != "herdr"
	details_action.text = "Mayor voice" if selected_id == MAYOR_ID else ("Agent ended" if ended else "Open in Herdr")
	if force_avatar and not ended:
		call("_load_avatar", _model_index(selected_id))

func _show_agent_ended() -> void:
	_release_control()
	if _details_are_open():
		_refresh_details()
	following_pet = false

func _open_in_herdr() -> void:
	var record: Dictionary = agents_by_id.get(selected_id, {})
	if record.is_empty() or String(record.get("source", "")).to_lower() != "herdr":
		_refresh_details()
		return
	_send_bridge({"v": 1, "type": "focusAgent", "id": selected_id})
