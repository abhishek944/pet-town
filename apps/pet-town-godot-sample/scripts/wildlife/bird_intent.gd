extends RefCounted
## Source bird activity hysteresis, flight/rest periods and safe landing lifecycle.
static func tick(actor, delta: float) -> void:
	var profile: Dictionary = actor.definition.flight
	if not actor.has_meta("bird_runtime"):
		actor.set_meta("bird_runtime", {"active": actor.system.night > 0.35 if profile.activity == "night" else actor.system.night < 0.5,
			"flight_time": 0.0, "rest_time": actor.random.randf_range(1.0, 4.0), "retry": 0.0,
			"altitude": float(profile.minAltitude), "rest_y": 0.0})
	var runtime: Dictionary = actor.get_meta("bird_runtime")
	if actor.system.night > 0.55:
		runtime.active = profile.activity == "night"
	elif actor.system.night < 0.25:
		runtime.active = profile.activity == "day"
	runtime.flight_time += delta if actor.flying else 0.0
	runtime.rest_time -= delta
	runtime.retry -= delta
	if actor.state == "happy" and actor.age < actor.duration:
		return
	var supported: bool = actor.is_on_floor() and is_finite(actor.ground_height) and absf(actor.position.y - actor.ground_height) < 0.2 and actor.ground_height >= actor.system.water_level - 0.05
	if actor.state == "land" and not actor.has_goal and supported:
		actor.flying = false
		runtime.flight_time = 0.0
		runtime.rest_time = actor.random.randf_range(4.0, 9.0)
		actor.set_state("rest" if runtime.active else "sleep", 999.0)
	if not actor.flying:
		if supported and (not runtime.active or runtime.rest_time > 0.0):
			var resting := "rest" if runtime.active else "sleep"
			if actor.state != resting:
				actor.set_state(resting, 999.0)
			return
		# A wake/takeoff or removed perch always leaves the sleeping pose first.
		actor.flying = true
		actor.set_state("fly", 30.0)
	var should_rest: bool = not runtime.active or runtime.flight_time > (24.0 if profile.pattern == "dart" else 42.0)
	if actor.state == "land":
		if not should_rest:
			actor.set_state("fly", 30.0)
		elif actor.age < 30.0:
			# Native move_and_slide confirms floor contact before sleep is allowed.
			return
	if actor.state != "land" and should_rest:
		actor.has_goal = false
	if actor.has_goal and actor.age < 30.0:
		return
	if runtime.retry > 0.0:
		return
	if not pick_goal(actor, should_rest):
		# Keep flying if the region has no clear dry landing point.
		if should_rest:
			pick_goal(actor, false)
		runtime.retry = 2.0

static func pick_goal(actor, landing: bool) -> bool:
	var profile: Dictionary = actor.definition.flight
	var runtime: Dictionary = actor.get_meta("bird_runtime")
	for attempt in range(16):
		var angle: float = actor.random.randf() * TAU
		var reach: float = actor.random.randf_range(0.0 if landing else float(profile.radius) * 0.4, float(profile.radius))
		var target: Vector3 = actor.home + Vector3(sin(angle), 0, cos(angle)) * reach
		target.y = actor.position.y
		if not actor.system.inside(target):
			continue
		var height: float = actor.system.support(target, 8.0, 40.0)
		if not is_finite(height) or (landing and height < actor.system.water_level - 0.05):
			continue
		if landing:
			var padding := maxf(0.4, actor.radius)
			var safe := true
			for direction in [Vector3.RIGHT, Vector3.LEFT, Vector3.FORWARD, Vector3.BACK]:
				var edge: float = actor.system.support(Vector3(target.x, height, target.z) + direction * padding, 0.3, 1.0)
				if not is_finite(edge) or absf(edge - height) > 0.25:
					safe = false
					break
			if not safe:
				continue
		runtime.altitude = actor.random.randf_range(float(profile.minAltitude), float(profile.maxAltitude))
		runtime.rest_y = height
		actor.flying = true
		actor.set_state("land" if landing else "fly", 30.0)
		actor.goal = Vector3(target.x, height, target.z)
		actor.has_goal = true
		return true
	return false
