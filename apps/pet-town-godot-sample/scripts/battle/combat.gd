extends Node3D
var session: Node3D
var weapon: Node3D
var spawn_wait := 0.0
var frozen := false
var momentum := {}
var shots: Array = []
var introduced := 0
const ROLES := ["Minion", "Warrior", "Rogue", "Mage"]

func setup(host: Node3D, sources: Array) -> void:
	setup_avatar(host)
	for i in sources.size(): add_animal(sources[i],i)
	setup_effects()

func setup_avatar(host: Node3D) -> void:
	session = host
	session.avatar = preload("avatar.gd").new()
	session.avatar.session = session
	session.avatar.world = session.town.world
	session.avatar.view = session.town.rig
	session.avatar.spawn = Vector3(session.arena.START.x, session.town.world.ground_at(session.arena.START) + 0.06, session.arena.START.z)
	add_child(session.avatar)
	session.avatar.freeze = true
	session.context.target(session.avatar)

func add_animal(source: Node3D, index: int) -> void:
	var animal := preload("wildlife.gd").new()
	var data: Dictionary = source.entry.duplicate(true)
	var home: Vector3 = session.arena.HOMES[index]
	home.y = session.town.world.ground_at(home) + 0.06
	data.position = [home.x, home.y, home.z]
	data.home = data.position.duplicate()
	animal.session = session
	animal.setup(data, session.town.wildlife)
	add_child(animal)
	animal.collision_mask = 15
	animal.freeze = true
	session.animals.append(animal)

func setup_effects() -> void:
	session.feedback = preload("feedback.gd").new()
	add_child(session.feedback)
	weapon = preload("weapon.gd").new()
	add_child(weapon)
	weapon.setup(session)
	set_frozen(true)

func step(delta: float) -> void:
	session.enemies = session.enemies.filter(func(body): return is_instance_valid(body) and not body.is_queued_for_deletion())
	session.avatar.step(delta)
	for animal in session.animals: animal.step(delta)
	for enemy in session.enemies:
		if session.avatar.health.value <= 0: break
		enemy.step(delta)
	if session.avatar.health.value <= 0: return
	shots = shots.filter(func(shot): return is_instance_valid(shot) and not shot.is_queued_for_deletion() and not shot.expired)
	for shot in shots: shot.step(delta)
	if session.avatar.health.value <= 0: return
	weapon.step(delta)
	if session.duration - session.elapsed < 2: return
	spawn_wait -= delta
	if spawn_wait <= 0:
		# Reach sustained pressure early, rather than an extreme final acceleration.
		spawn_wait = lerpf(3, 1.6, clampf(session.elapsed / maxf(1, session.duration * 0.45), 0, 1))
		var living: int = session.enemies.filter(func(body): return body.health.value > 0).size()
		if living < 16:
			var p = session.arena.spawn_point(session.avatar, session.animals, session.enemies, session.avatar)
			if p == null:
				for animal in session.animals:
					if animal.health.value <= 0: continue
					p = session.arena.spawn_point(animal, session.animals, session.enemies, session.avatar)
					if p != null: break
			if p != null:
				var enemy := preload("enemy.gd").new()
				enemy.session = session
				enemy.appearance = next_role()
				enemy.position = p
				add_child(enemy)
				session.enemies.append(enemy)

func next_role() -> String:
	var spacing := clampf(session.duration * 0.05, 5, 12)
	if introduced < ROLES.size() and session.elapsed >= introduced * spacing:
		var role: String = ROLES[introduced]
		introduced += 1
		return role
	if introduced < ROLES.size(): return "Minion"
	var choices := ["Minion", "Minion", "Minion", "Minion", "Minion", "Minion"]
	for role in ["Warrior", "Rogue", "Mage"]:
		var living := 0
		for enemy in session.enemies:
			if enemy.health.value > 0 and enemy.appearance == role: living += 1
		if living < (3 if role == "Rogue" else 2): choices.append(role)
	return choices.pick_random()

func warning_duration(source: Node3D, victim: Node3D, aim: Vector3, ordinary: float) -> float:
	# A single active special/shot is sufficient competition; no permit pool/state.
	for enemy in session.enemies:
		if enemy != source and enemy.special_busy(): return -1
	for shot in shots:
		if is_instance_valid(shot) and not shot.expired: return -1
	if not is_instance_valid(session.ui) or not is_instance_valid(session.ui.combat): return -1
	var mode: String = session.ui.combat.warning_mode(source, victim, aim)
	if mode == "unavailable": return -1
	# A longer fixed hidden windup leaves rescue time without a travel estimator.
	return maxf(3.5, ordinary) if mode == "notice" else ordinary

func warning_available(info: Dictionary) -> bool:
	return is_instance_valid(session.ui) and is_instance_valid(session.ui.combat) and session.ui.combat.warning_available(info)

func fire_shot(source: Node3D) -> void:
	var shot := preload("enemy_shot.gd").new()
	shot.session = session
	shot.origin = source.attack_origin + Vector3.UP * 0.85
	shot.aim = source.aim_center
	shot.victim = source.target
	shot.victim_name = source.target_name
	shot.damage = source.profile.damage
	add_child(shot)
	shots.append(shot)

func warning_info() -> Dictionary:
	for shot in shots:
		if is_instance_valid(shot) and not shot.expired: return shot.warning_info()
	for enemy in session.enemies:
		if not is_instance_valid(enemy): continue
		var info: Dictionary = enemy.warning_info()
		if not info.is_empty(): return info
	return {}

func set_frozen(value: bool) -> void:
	if frozen == value: return
	frozen = value
	process_mode = Node.PROCESS_MODE_DISABLED if value else Node.PROCESS_MODE_INHERIT
	for body in [session.avatar] + session.animals + session.enemies:
		if not is_instance_valid(body): continue
		if value:
			momentum[body.get_instance_id()] = body.linear_velocity
			body.freeze = true
			body.linear_velocity = Vector3.ZERO
		else:
			body.freeze = body.health.value <= 0
			if not body.freeze: body.linear_velocity = momentum.get(body.get_instance_id(), Vector3.ZERO)
	if not value: momentum.clear()

func wildlife_health() -> float:
	var total := 0.0
	for animal in session.animals: total += animal.health.value
	return total / maxf(1, session.animals.size())
