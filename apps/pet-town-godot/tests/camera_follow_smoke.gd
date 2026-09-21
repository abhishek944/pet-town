extends SceneTree
## Run without --fixed-fps: this exercises render frames between physics ticks.
class LinearMotion extends Node:
	var actor: Node3D
	func _physics_process(delta: float) -> void:
		actor.position.x += 2.0 * delta

class RenderProbe extends Node:
	var sample: Callable
	func _process(delta: float) -> void:
		sample.call(delta)

var world: Node3D
var driver: LinearMotion
var elapsed := 0.0
var previous_x := 0.0
var speeds: Array[float] = []
var raw_speeds: Array[float] = []
var raw_target_x := 0.0
var ready_to_sample := false

func _initialize() -> void:
	Engine.physics_ticks_per_second = 10 # Exaggerate tick/render mismatch.
	Engine.max_fps = 120
	call_deferred("start")

func start() -> void:
	world = load("res://main.tscn").instantiate()
	root.add_child(world)
	current_scene = world
	await create_timer(0.5).timeout
	for actor in get_nodes_in_group("companions"):
		actor.set_physics_process(false)
		actor.agent.avoidance_enabled = false
		actor.player.stop()
	var actor = get_nodes_in_group("companions")[0]
	driver = LinearMotion.new()
	driver.actor = actor
	root.add_child(driver)
	world._follow_companion(actor)
	assert(actor.is_physics_interpolated_and_enabled())
	assert(not world.camera.is_physics_interpolated_and_enabled())
	previous_x = world.camera_target.x
	raw_target_x = previous_x
	var probe := RenderProbe.new()
	probe.process_priority = 100
	probe.sample = sample
	root.add_child(probe)
	ready_to_sample = true

func sample(delta: float) -> bool:
	if not ready_to_sample: return false
	elapsed += delta
	var speed: float = (world.camera_target.x - previous_x) / delta
	previous_x = world.camera_target.x
	var old_raw_x := raw_target_x
	raw_target_x = lerpf(raw_target_x, driver.actor.global_position.x, minf(delta * 5.0, 1.0))
	if elapsed > 2.0 and delta < 0.04:
		speeds.append(speed)
		raw_speeds.append((raw_target_x - old_raw_x) / delta)
	if elapsed >= 6.0:
		ready_to_sample = false
		var mean := 0.0
		for v in speeds: mean += v
		mean /= speeds.size()
		var variance := 0.0
		for v in speeds: variance += pow(v - mean, 2)
		var variation := sqrt(variance / speeds.size()) / absf(mean)
		var raw_variance := 0.0
		for v in raw_speeds: raw_variance += pow(v - 2.0, 2)
		print("Previous raw-target approach variation=", sqrt(raw_variance / raw_speeds.size()) / 2.0)
		print("CAMERA constant-speed follow: samples=", speeds.size(), " mean_speed=", mean, " relative_speed_variation=", variation)
		if speeds.size() <= 100 or absf(mean - 2.0) >= 0.1 or variation >= 0.12:
			printerr("FAIL: camera follow timing")
			quit(1)
			return false
		world._reset_camera()
		assert(not world.following_companion and world.camera_at_overview)
		world._cycle_companion()
		assert(world.following_companion)
		world._pan_camera(Vector2(20, 0))
		assert(not world.following_companion)
		print("PASS: interpolated follow, overview reset, companion switching, and pan release")
		quit()
	return false
