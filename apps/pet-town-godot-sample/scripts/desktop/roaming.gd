extends Node
## Share destination checks fairly, even when physics catches up multiple ticks.
const CANDIDATES_PER_FRAME := 2
const SEARCH_BUDGET_US := 2000
var pending: Array[Dictionary] = []
var queued: Dictionary = {}
var last_frame := -1

func request(body: RigidBody3D) -> void:
	var id := body.get_instance_id()
	if queued.has(id): return
	queued[id] = true
	pending.append({"id":id,"body":weakref(body)})

func _physics_process(_delta: float) -> void:
	var frame := Engine.get_process_frames()
	if frame == last_frame: return
	last_frame = frame
	var started := Time.get_ticks_usec()
	# Snapshot the queue size so one companion gets at most one turn this frame.
	var turns := mini(CANDIDATES_PER_FRAME, pending.size())
	for turn in turns:
		var request_data: Dictionary = pending.pop_front()
		queued.erase(request_data.id)
		var body = request_data.body.get_ref()
		if not is_instance_valid(body) or not body.roam_search_pending: continue
		if not body._choose_target(): request(body)
		if Time.get_ticks_usec() - started >= SEARCH_BUDGET_US: break
