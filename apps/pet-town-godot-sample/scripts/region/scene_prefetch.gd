extends RefCounted
## Four in-flight original scenes; instantiate and style only on the main thread.
const WINDOW := 4
var paths: Array[String]=[]
var cursor:=0
var pending: Dictionary={}
var budget: RefCounted
var closed:=false
func _init(entries: Array, loading_budget: RefCounted) -> void:
	budget=loading_budget
	if not budget: return
	for entry in entries:
		if entry.get("file") and not paths.has(str(entry.file)): paths.append(str(entry.file))
	_fill()
func _fill() -> void:
	while not closed and pending.size()<WINDOW and cursor<paths.size():
		var file: String=paths[cursor]
		cursor+=1
		pending[file]=ResourceLoader.load_threaded_request("res://assets/"+file,"PackedScene")==OK
func take(file: String) -> PackedScene:
	if closed: return null
	var path: String="res://assets/"+file
	if not budget: return load(path) as PackedScene
	var scene: PackedScene
	if pending.get(file,false):
		while ResourceLoader.load_threaded_get_status(path)==ResourceLoader.THREAD_LOAD_IN_PROGRESS:
			await budget.checkpoint(true)
			if closed: return null
		scene=ResourceLoader.load_threaded_get(path) as PackedScene
	else:
		scene=load(path) as PackedScene
	pending.erase(file)
	_fill()
	return scene
func finish() -> void:
	closed=true
	for file in pending:
		if pending[file]: ResourceLoader.load_threaded_get("res://assets/"+file)
	pending.clear()
