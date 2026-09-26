class_name LiveTownBridge
extends Node
## JSONL protocol v1 client. The desktop helper remains the source of live agents.

signal snapshot_received(snapshot: Dictionary)
signal focus_result(id: String, ok: bool, message: String)

var bridge_pid := -1
var bridge_pipe: FileAccess
var retry_at := 0
var active := false

func _process(_delta: float) -> void:
	if bridge_pid <= 0:
		if Time.get_ticks_msec() >= retry_at:
			start()
		return
	if not OS.is_process_running(bridge_pid):
		_disconnect()
		return
	if bridge_pipe == null:
		return
	while bridge_pipe.get_position() < bridge_pipe.get_length():
		accept_line(bridge_pipe.get_line())

func start() -> void:
	if bridge_pid > 0:
		return
	var path := _bridge_path()
	if path.is_empty():
		retry_at = Time.get_ticks_msec() + 3000
		return
	var result := OS.execute_with_pipe(path, ["--town-bridge"])
	if result.is_empty() or not result.has("pid"):
		retry_at = Time.get_ticks_msec() + 3000
		return
	bridge_pid = int(result.pid)
	bridge_pipe = result.get("stdio") as FileAccess
	if bridge_pid <= 0 or bridge_pipe == null:
		_disconnect()
		return
	_send({"type": "activeChanged", "active": active})

func set_active(value: bool) -> void:
	if active == value:
		return
	active = value
	_send({"type": "activeChanged", "active": active})

func focus_agent(id: String) -> void:
	if not id.strip_edges().is_empty():
		_send({"type": "focusAgent", "id": id})

func stop() -> void:
	if bridge_pid > 0:
		_send({"type": "activeChanged", "active": false})
		_send({"type": "shutdown"})
	bridge_pid = -1
	bridge_pipe = null
	set_process(false)

func accept_line(line: String) -> void:
	var parser := JSON.new()
	if parser.parse(line) != OK:
		return
	var value: Variant = parser.data
	if not (value is Dictionary) or int(value.get("v", 0)) != 1:
		return
	match String(value.get("type", "")):
		"snapshot":
			snapshot_received.emit(value)
		"focusResult":
			focus_result.emit(String(value.get("id", "")), bool(value.get("ok", false)), String(value.get("message", "")))

func _send(message: Dictionary) -> void:
	if bridge_pipe == null:
		return
	message["v"] = 1
	bridge_pipe.store_string(JSON.stringify(message) + "\n")
	bridge_pipe.flush()

func _disconnect() -> void:
	bridge_pid = -1
	bridge_pipe = null
	retry_at = Time.get_ticks_msec() + 3000
	snapshot_received.emit({"v": 1, "type": "snapshot", "available": false, "agents": [], "mayor": {"active": false}})

func _bridge_path() -> String:
	var configured := OS.get_environment("PET_TOWN_BRIDGE_BIN")
	if not configured.is_empty():
		return configured
	var directory := OS.get_executable_path().get_base_dir()
	for candidate in [directory.path_join("pet-town"), directory.path_join("Pet Town"), directory.path_join("pet-town-bridge")]:
		if FileAccess.file_exists(candidate):
			return candidate
	return "pet-town"
