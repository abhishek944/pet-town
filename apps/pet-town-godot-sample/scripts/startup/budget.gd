extends RefCounted

# Yield only when useful: no minimum splash duration or per-item frame delay.
const SLICE_USEC := 8000
var tree: SceneTree
var last_yield := Time.get_ticks_usec()
var yields := 0

# Workers receive pure PCM builders, never scene-tree nodes or shared streams.
class BackgroundWork extends RefCounted:
	var result: Variant
	var work: Callable
	func run() -> void:
		result = work.call()

func _init(scene_tree: SceneTree) -> void:
	tree = scene_tree

func checkpoint(force := false) -> void:
	if not force and Time.get_ticks_usec() - last_yield < SLICE_USEC: return
	await tree.process_frame
	last_yield = Time.get_ticks_usec()
	yields += 1

func background(work: Callable) -> Variant:
	var job := BackgroundWork.new()
	job.work = work
	var task := WorkerThreadPool.add_task(job.run)
	while not WorkerThreadPool.is_task_completed(task):
		await checkpoint(true)
	WorkerThreadPool.wait_for_task_completion(task)
	return job.result
