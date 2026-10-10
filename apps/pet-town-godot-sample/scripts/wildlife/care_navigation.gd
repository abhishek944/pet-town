extends RefCounted
## Find changes only a heading. It never changes creature intent or player control.
var system: Node3D
var species := ""
var target: Node3D

func nearest(id: String, player: Node3D) -> Node3D:
	if not is_instance_valid(player): return null
	var resting: Node3D
	var moving: Node3D
	var resting_distance := INF
	var moving_distance := INF
	for animal in system.actors:
		if not is_instance_valid(animal) or animal.is_queued_for_deletion() or animal.entry.get("species", "") != id: continue
		var distance: float = player.global_position.distance_to(animal.global_position)
		if animal.state in ["sleep", "rest"] and not animal.flying and distance < resting_distance:
			resting = animal
			resting_distance = distance
		elif distance < moving_distance:
			moving = animal
			moving_distance = distance
	return resting if is_instance_valid(resting) else moving

func start(id: String, player: Node3D) -> bool:
	var animal := nearest(id, player)
	if not is_instance_valid(animal): return false
	species = id
	target = animal
	return true

func cancel() -> void:
	species = ""
	target = null

func pet(id: String) -> void:
	if species == id: cancel()

func heading(player: Node3D, camera: Camera3D) -> Dictionary:
	if species.is_empty(): return {}
	if not is_instance_valid(target) or target.is_queued_for_deletion() or target not in system.actors:
		target = nearest(species, player)
	if not is_instance_valid(target) or not is_instance_valid(player):
		cancel()
		return {}
	var offset: Vector3 = target.global_position - player.global_position
	var right := camera.global_basis.x
	var forward := -camera.global_basis.z
	right.y = 0
	forward.y = 0
	var bearing := atan2(offset.dot(right.normalized()), offset.dot(forward.normalized()))
	var arrows := ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"]
	var index := posmod(roundi(bearing / (PI / 4)), 8)
	var name := str(target.entry.name)
	var hint := "Walk over and press F to pet any %s." % name
	if target.flying: hint = "In flight · Wait for a resting member to pet."
	return {"title": "%s  %s · %d m" % [arrows[index], name, ceili(offset.length())], "hint": hint}

func status(id: String, player: Node3D, following: bool) -> String:
	if following: return "Leave your companion first, then Find wildlife."
	var animal := nearest(id, player)
	if not is_instance_valid(animal): return "No members are in town right now."
	return "Nearest %s %s · %d m away" % ["resting" if animal.state in ["sleep", "rest"] and not animal.flying else "moving", animal.entry.name, ceili(player.global_position.distance_to(animal.global_position))]
