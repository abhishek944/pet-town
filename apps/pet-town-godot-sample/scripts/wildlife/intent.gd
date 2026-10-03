extends RefCounted
const Birds = preload("res://scripts/wildlife/bird_intent.gd")
const Social = preload("res://scripts/wildlife/social.gd")
## Source social radii, timing, gait speeds and weighted idle/wander decisions.
func tick(actor, delta: float) -> void:
	if actor.definition.has("flight"):
		Birds.tick(actor, delta)
		return
	var player: Vector3 = actor.system.player.global_position
	var offset: Vector3 = player - actor.global_position
	offset.y = 0
	var distance := offset.length()
	var traits: Dictionary = actor.definition.traits
	if actor.state == "play":
		Social.tick(actor, delta)
		return
	if actor.state == "happy":
		if actor.age > actor.duration:
			actor.set_state("greet", 3.0)
		return
	if actor.system.night > 0.55 and not traits.get("nightOwl", false) and not actor.in_water:
		if actor.state != "sleep":
			actor.set_state("sleep", 999.0)
		return
	if actor.state == "sleep":
		actor.set_state("idle", 1.5)
	if actor.player_cd <= 0 and actor.state not in ["approach", "greet", "flee"]:
		if distance < 3.2 and actor.random.randf() < float(traits.get("shy", 0)):
			actor.set_state("flee", 4.0)
			actor.goal = actor.global_position - offset.normalized() * 6.0
			actor.has_goal = true
		elif distance < 6.5 and distance > 2.2 and actor.random.randf() < float(traits.get("curious", 0.5)) * 0.5:
			actor.set_state("approach", 7.0)
			actor.system.hearts.emit_icons(actor.head_position(), "question", 1)
			actor.player_cd = 12.0
		else:
			actor.player_cd = actor.random.randf_range(2.0, 4.0)
	if actor.state == "approach":
		var stopping := 1.3 + float(actor.definition.radius)
		if distance > 11.0 or actor.age > actor.duration:
			actor.set_state("idle", 2.0)
		elif distance > stopping:
			actor.goal = player - offset.normalized() * stopping
			actor.has_goal = true
		else:
			actor.set_state("greet", actor.random.randf_range(3.0, 6.0))
			actor.system.hearts.emit_icons(actor.head_position(), "heart", 1)
		return
	if actor.state == "greet":
		if distance > 3.5 + float(actor.definition.radius) and actor.age > 1.0:
			actor.set_state("approach", 5.0)
		elif actor.age > actor.duration:
			actor.set_state("idle", 2.0)
			actor.player_cd = 8.0
		return
	if actor.state in ["wander", "swim", "fly", "flee"]:
		if actor.age > actor.duration or not actor.has_goal:
			if actor.state == "fly":
				actor.flying = false
			actor.set_state("idle", actor.random.randf_range(1.5, 4.0))
		return
	if actor.age < actor.duration:
		return
	var choices := [
		["wander", 3.0 + 3.0 * float(traits.get("energy", 0.5))], ["idle", 2.0], ["look", 1.2],
		["graze", float(traits.get("grazer", 0)) * 3 + float(traits.get("sniffer", 0)) * 2 + float(traits.get("pecker", 0)) * 3],
		["play", float(traits.get("playful", 0)) * 2.2], ["swim", 3.0 if actor.swimmer else 0.0],
		["rest", float(traits.get("lazy", 0.3)) if not actor.in_water else 0.0]]
	var total := 0.0
	for item in choices:
		total += item[1]
	var roll: float = actor.random.randf() * total
	var state := "wander"
	for item in choices:
		roll -= item[1]
		if roll <= 0:
			state = item[0]
			break
	if state == "play":
		if Social.try_play(actor):
			return
		state = "wander"
	if state in ["idle", "look", "graze", "rest"]:
		actor.set_state(state, actor.random.randf_range(3.0, 6.0) if state != "rest" else actor.random.randf_range(6.0, 12.0))
		return
	var origin: Vector3 = actor.home
	var range_radius := 5.0
	if state == "swim":
		var pond: Dictionary = actor.system.world_data.get("pond", {})
		if not pond.is_empty():
			origin = Vector3(float(pond.x), actor.position.y, float(pond.z))
			range_radius = float(pond.get("r", 3.0)) * 0.8
	if actor.definition.has("flight"):
		state = "fly"
		actor.flying = true
		range_radius = 9.0
	for attempt in range(16):
		var angle: float = actor.random.randf() * TAU
		var radius: float = actor.random.randf_range(0.6, range_radius)
		var target := origin + Vector3(cos(angle), 0, sin(angle)) * radius
		target.y = actor.position.y
		var ground: float = actor.system.support(target, 4.0, 12.0)
		if not actor.system.inside(target) or not is_finite(ground):
			continue
		if not actor.swimmer and not actor.flying and ground < actor.system.water_level - 0.05:
			continue
		if state == "swim" and ground >= actor.system.water_level - 0.05:
			continue
		actor.set_state(state, actor.random.randf_range(6.0, 12.0))
		actor.goal = target
		actor.has_goal = true
		return
	actor.set_state("idle", 1.5)
