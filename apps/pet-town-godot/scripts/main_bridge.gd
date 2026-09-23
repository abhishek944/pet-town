extends "res://scripts/main_state.gd"

func _launch_bridge() -> void:
	var bridge_path := _bridge_path()
	if bridge_path.is_empty():
		bridge_retry_at = Time.get_ticks_msec() + 3000
		_set_notice("Live-agent connection unavailable\nRetrying…")
		return
	var pipe := OS.execute_with_pipe(bridge_path, ["--town-bridge"])
	if pipe.is_empty() or not pipe.has("pid"):
		bridge_retry_at = Time.get_ticks_msec() + 3000
		_set_notice("Live-agent connection unavailable\nRetrying…")
		return
	bridge_pid = int(pipe.pid)
	bridge_stdin = pipe.get("stdio") as FileAccess
	bridge_stdout = bridge_stdin
	if bridge_pid <= 0 or bridge_stdin == null or bridge_stdout == null:
		bridge_pid = -1
		bridge_retry_at = Time.get_ticks_msec() + 3000
		_set_notice("Live-agent connection unavailable\nRetrying…")
		return
	_send_bridge({"v": 1, "type": "activeChanged", "active": true})
	_set_notice("Connecting to live agents…")

func _bridge_path() -> String:
	var configured := OS.get_environment("PET_TOWN_BRIDGE_BIN")
	if not configured.is_empty():
		return configured
	var executable_dir := OS.get_executable_path().get_base_dir()
	var candidates := [
		executable_dir.path_join("pet-town"),
		executable_dir.path_join("Pet Town"),
		executable_dir.path_join("pet-town-bridge"),
		"pet-town",
	]
	for candidate in candidates:
		if candidate == "pet-town" or FileAccess.file_exists(candidate):
			return candidate
	return ""

func _poll_bridge() -> void:
	if bridge_pid <= 0 or bridge_stdout == null:
		return
	if not OS.is_process_running(bridge_pid):
		bridge_pid = -1
		bridge_stdin = null
		bridge_stdout = null
		bridge_retry_at = Time.get_ticks_msec() + 3000
		received_snapshot = false
		_reconcile_agents([])
		_set_notice("Live-agent connection unavailable\nRetrying…")
		return
	while bridge_stdout.get_position() < bridge_stdout.get_length():
		var line := bridge_stdout.get_line().strip_edges()
		if not line.is_empty():
			_handle_bridge_line(line)

func _is_visible_agent_status(status: String) -> bool:
	# 2D town hides idle and unknown via visible:false; keep 3D in parity.
	var normalized := status.to_lower()
	return not (normalized == "idle" or normalized == "unknown")

func _handle_bridge_line(line: String) -> void:
	var snapshot = JSON.parse_string(line)
	if not (snapshot is Dictionary) or int(snapshot.get("v", 0)) != 1 or snapshot.get("type", "") != "snapshot":
		return
	received_snapshot = true
	var mayor: Dictionary = snapshot.get("mayor", {}) if snapshot.get("mayor", {}) is Dictionary else {}
	mayor_listening = bool(mayor.get("active", false)) and bool(mayor.get("listening", false))
	var agents: Array = []
	if bool(mayor.get("active", false)):
		var mayor_name := String(mayor.get("name", "Mayor")).strip_edges()
		agents.append({"id": MAYOR_ID, "label": mayor_name if not mayor_name.is_empty() else "Mayor", "status": "working", "source": "mayor"})
	if not bool(snapshot.get("available", false)):
		_reconcile_agents(agents)
		_set_notice("Live agents are unavailable\nRetrying…")
		_focus_mayor_from_snapshot(mayor)
		return
	for candidate in snapshot.get("agents", []):
		if candidate is Dictionary and candidate.has("id") and candidate.has("label"):
			if not _is_visible_agent_status(String(candidate.get("status", "unknown"))):
				continue
			agents.append(candidate)
	_reconcile_agents(agents)
	_set_notice("No live agents right now" if agents.is_empty() else "")
	_focus_mayor_from_snapshot(mayor)

func _focus_mayor_from_snapshot(mayor: Dictionary) -> void:
	var serial := int(mayor.get("focusSerial", 0))
	if serial == mayor_focus_serial:
		return
	mayor_focus_serial = serial
	if serial > 0 and bool(mayor.get("active", false)):
		var pet: CharacterBody3D = pets_by_id.get(MAYOR_ID)
		if is_instance_valid(pet):
			call("_follow_pet", pet)

func _reconcile_agents(records: Array) -> void:
	var current := {}
	for record in records:
		var id := String(record.get("id", ""))
		if id.is_empty():
			continue
		if id != MAYOR_ID and not _is_visible_agent_status(String(record.get("status", "unknown"))):
			continue
		current[id] = record
		var pet: CharacterBody3D = pets_by_id.get(id)
		if is_instance_valid(pet):
			pet.update_live_status(String(record.get("status", "unknown")), String(record.get("label", "")))
		else:
			_spawn_pet(id, record)
	agents_by_id = current
	for id in pets_by_id.keys():
		if not current.has(id):
			var leaving: CharacterBody3D = pets_by_id[id]
			if is_instance_valid(leaving):
				if id == selected_id:
					call("_show_agent_ended")
				leaving.begin_retirement()
	stable_agent_ids = []
	for id in current.keys():
		stable_agent_ids.append(id)
	stable_agent_ids.sort()

func _spawn_pet(id: String, record: Dictionary) -> void:
	var pet := COMPANION_SCENE.instantiate() as CharacterBody3D
	var model_index := 0 if id == MAYOR_ID else _model_index(id)
	pet.configure(id, String(record.get("label", "")), String(record.get("status", "unknown")), MODEL_NAMES[model_index])
	var model := MODEL_SCENES[model_index].instantiate() as Node3D
	model.name = "Model"
	pet.get_node("Visual").add_child(model)
	pets_root.add_child(pet)
	pet.global_position = _spawn_position(0 if id == MAYOR_ID else _stable_number(id))
	pet.retirement_finished.connect(_on_pet_retired.bind(pet))
	pets_by_id[id] = pet

func _on_pet_retired(id: String, pet: CharacterBody3D) -> void:
	if pets_by_id.get(id) == pet:
		pets_by_id.erase(id)
	if id == selected_id and not agents_by_id.has(id):
		call("_release_control")
		selected_id = ""
		selected_pet = null
		following_pet = false
		if _details_are_open():
			call("_close_details")

func _send_bridge(message: Dictionary) -> void:
	if bridge_stdin == null:
		return
	bridge_stdin.store_string(JSON.stringify(message) + "\n")
	bridge_stdin.flush()

func _on_window_focus_entered() -> void:
	_send_bridge({"v": 1, "type": "activeChanged", "active": true})

func _on_window_focus_exited() -> void:
	_send_bridge({"v": 1, "type": "activeChanged", "active": false})
