extends SceneTree
var world: Node
var frames := 0
var starts := {}
var max_distances := {}
var saw_walking := {}
var progress_positions := {}
var stationary_seconds := {}
var longest_stationary := {}
var errors: Array[String] = []
func _initialize() -> void: call_deferred("start")
func start() -> void:
	world = load("res://main.tscn").instantiate()
	root.add_child(world)
	current_scene = world
	for actor in get_nodes_in_group("companions"):
		starts[actor.name] = actor.global_position
		max_distances[actor.name] = 0.0
		saw_walking[actor.name] = false
		progress_positions[actor.name] = actor.global_position
		stationary_seconds[actor.name] = 0
		longest_stationary[actor.name] = 0
	assert(starts.size() == 6)
func _physics_process(_delta: float) -> bool:
	if not is_instance_valid(world): return false
	frames += 1
	for actor in get_nodes_in_group("companions"):
		max_distances[actor.name] = maxf(max_distances[actor.name], actor.global_position.distance_to(starts[actor.name]))
		saw_walking[actor.name] = saw_walking[actor.name] or actor.player.current_animation == "Walking_A"
		if actor.global_position.y < -2.0 and not str(actor.name) in errors: errors.append(str(actor.name))
	if frames % 60 == 0:
		for actor in get_nodes_in_group("companions"):
			if actor.global_position.distance_to(progress_positions[actor.name]) < 0.12:
				stationary_seconds[actor.name] += 1
			else:
				stationary_seconds[actor.name] = 0
			longest_stationary[actor.name] = maxi(longest_stationary[actor.name], stationary_seconds[actor.name])
			progress_positions[actor.name] = actor.global_position
	if frames % 1800 == 0:
		for actor in get_nodes_in_group("companions"):
			print(frames/60, "s ", actor.name, " ", actor.state," ",actor.activity_text, " visits=",actor.completed_activities," deliveries=",actor.deliveries," failed=",actor.failed_routes," at=",actor.global_position)
	if frames >= 14400:
		var visits := 0
		var deliveries := 0
		for actor in get_nodes_in_group("companions"):
			if max_distances[actor.name] < 3.0: errors.append(str(actor.name) + " did not roam")
			if not saw_walking[actor.name]: errors.append(str(actor.name) + " did not animate")
			if actor.completed_activities == 0: errors.append(str(actor.name) + " no interactions")
			if longest_stationary[actor.name] > 15: errors.append(str(actor.name) + " stalled for over 15 seconds")
			if actor.failed_routes > 8: errors.append(str(actor.name) + " excessive route failures")
			visits += actor.completed_activities
			deliveries += actor.deliveries
		if deliveries == 0: errors.append("No apples delivered")
		print("RESULT visits=",visits," delivered=",deliveries," longest_stationary_seconds=",longest_stationary," errors=",errors)
		quit(0 if errors.is_empty() else 1)
	return false
