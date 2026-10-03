extends RefCounted

static func try_play(actor) -> bool:
	var buddy
	var distance := 7.0
	for other in actor.system.actors:
		if other == actor or other.definition.has("flight") or other.state not in ["idle", "wander", "look", "graze"]:
			continue
		var gap: float = actor.global_position.distance_to(other.global_position)
		if gap < distance:
			distance = gap
			buddy = other
	if buddy == null:
		return false
	actor.set_state("play", actor.random.randf_range(5.0, 8.0))
	buddy.set_state("play", actor.duration)
	actor.buddy = buddy
	buddy.buddy = actor
	var chasing: bool = actor.random.randf() < 0.5
	actor.role = "lead" if chasing else "bounce"
	buddy.role = "follow" if chasing else "bounce"
	actor.system.hearts.emit_icons(actor.head_position(), "note", 1)
	return true

static func tick(actor, delta: float) -> void:
	var buddy = actor.buddy
	if not is_instance_valid(buddy) or buddy.state != "play" or actor.age > actor.duration:
		actor.set_state("idle", 2.0)
		return
	if actor.role == "lead":
		if not actor.has_goal:
			var angle: float = actor.random.randf() * TAU
			actor.goal = actor.global_position + Vector3(sin(angle), 0, cos(angle)) * actor.random.randf_range(1.5, 3.5)
			actor.has_goal = true
	else:
		var gap: float = buddy.global_position.distance_to(actor.global_position)
		actor.has_goal = gap > (0.9 if actor.role == "follow" else 1.6)
		actor.goal = buddy.global_position
	if actor.random.randf() < delta * 0.35:
		actor.system.hearts.emit_icons(actor.head_position(), "note", 1)
