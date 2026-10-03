extends Node3D
## Native sprites using the original source-drawn icon textures and motion constants.
var particles: Array[Dictionary] = []
var textures: Dictionary = {}

func emit_icons(origin: Vector3, kind: String, count: int) -> void:
	if not textures.has(kind):
		var path := "res://assets/wildlife-%s.png" % kind
		if not ResourceLoader.exists(path):
			return
		textures[kind] = load(path)
	for i in count:
		if particles.size() >= 48:
			particles.pop_front().sprite.queue_free()
		var sprite := Sprite3D.new()
		sprite.texture = textures[kind]
		sprite.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		sprite.no_depth_test = false
		sprite.pixel_size = 0.001 / 64.0
		add_child(sprite)
		sprite.global_position = origin + Vector3(randf_range(-0.175, 0.175), randf() * 0.15, randf_range(-0.175, 0.175))
		particles.append({"sprite": sprite, "life": 0.0, "max": randf_range(1.1, 1.8),
			"velocity": Vector3(randf_range(-0.45, 0.45), randf_range(1, 1.8), randf_range(-0.45, 0.45)),
			"phase": randf() * 6, "size": randf_range(0.16, 0.28), "delay": i * 0.05})

func _process(delta: float) -> void:
	for i in range(particles.size() - 1, -1, -1):
		var item := particles[i]
		if item.delay > 0:
			item.delay -= delta
			continue
		item.life += delta
		if item.life > item.max:
			item.sprite.queue_free()
			particles.remove_at(i)
			continue
		var progress: float = item.life / item.max
		item.velocity *= maxf(0, 1 - delta * 1.6)
		item.velocity.y += delta * 0.4
		item.sprite.position += item.velocity * delta
		item.sprite.position.x += sin(item.life * 5 + item.phase) * delta * 0.25
		var pop := minf(1, item.life * 7)
		item.sprite.pixel_size = item.size * (pop * 1.25 if pop < 1 else 1) * (1 - progress * 0.3) / 64.0
		item.sprite.modulate.a = 1 - (progress - 0.7) / 0.3 if progress > 0.7 else 1.0
