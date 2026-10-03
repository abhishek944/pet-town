extends RefCounted
# Serial pending intents; authoritative voxels and collision stay unchanged until publish.
const Worker=preload("mesh_worker.gd")
var host: Node3D
var queue: Array=[]
var active: Dictionary={}
var task: int=-1
var generation:=0
var worker: RefCounted
var last_submit_us:=0
var last_publish_us:=0

func enqueue(kind: String,cell:=Vector3i.ZERO,value:=0) -> void:
	if host.store.write_blocked and kind != "reset":
		host.message.emit(host.store.load_error)
		host.transaction_finished.emit(kind, false)
		return
	if kind=="reset":
		generation+=1
		queue.clear()
	if queue.size()>=24:
		host.message.emit("Finishing the queued changes")
		return
	var intent:={"kind":kind,"cell":cell,"value":value}
	if kind=="edit" and not queue.is_empty() and queue.back()==intent: return
	queue.append(intent)

func pending() -> bool:
	return task>=0 or not queue.is_empty()

func tick() -> void:
	if task>=0:
		if not WorkerThreadPool.is_task_completed(task): return
		WorkerThreadPool.wait_for_task_completion(task)
		task=-1
		if active.generation==generation: finish()
		else: host.transaction_finished.emit(active.kind,false)
		active={}
		worker=null
	if task<0 and not queue.is_empty(): start(queue.pop_front())

func start(intent: Dictionary) -> void:
	var began:=Time.get_ticks_usec()
	var kind: String=intent.kind
	var changes: Array=[]
	var record: Dictionary={}
	if kind in ["undo","redo"]:
		var source: Array=host.redo_stack if kind=="redo" else host.undo_stack
		if source.is_empty():
			host.transaction_finished.emit(kind,false)
			return
		record=source.back()
		intent.cell=record.cell
		intent.value=record.after if kind=="redo" else record.before
	if kind=="reset":
		for cell in host.store.edits:
			changes.append({"cell":cell,"before":host.store.get_id(cell),"after":host.store.get_id(cell,true)})
	else:
		if not host.store.contains(intent.cell) or intent.value<0 or intent.value>=host.store.definitions.size():
			host.transaction_finished.emit(kind,false)
			return
		var before: int=host.store.get_id(intent.cell)
		if before==intent.value or (intent.value>0 and not host.can_place(intent.cell)):
			host.transaction_finished.emit(kind,false)
			return
		changes.append({"cell":intent.cell,"before":before,"after":intent.value})
	var snapshot:=Worker.copy_store(host.store)
	var changed: Array=[]
	for change in changes:
		snapshot.set_id(change.cell,change.after)
		changed.append(change.cell)
	active={"kind":kind,"changes":changes,"record":record,"generation":generation}
	worker=host.terrain_editor.prepare(snapshot,changed)
	task=WorkerThreadPool.add_task(worker.run,false,"Build exact terrain edit")
	last_submit_us=Time.get_ticks_usec()-began

func finish() -> void:
	var began:=Time.get_ticks_usec()
	var kind: String=active.kind
	if worker.result.is_empty():
		host.message.emit("The terrain change could not be completed")
		host.transaction_finished.emit(kind,false)
		return
	# Recheck after worker latency: a walking pet must never be enclosed by placement.
	for change in active.changes:
		if host.store.get_id(change.cell)!=change.before or (kind!="reset" and change.after>0 and not host.can_place(change.cell)):
			host.message.emit("That space is occupied now. Try another spot")
			host.transaction_finished.emit(kind,false)
			return
	if host.persist_edits:
		var error: int=host.store.save_confirmed_reset(worker.snapshot) if kind == "reset" else worker.snapshot.save()
		if error!=OK:
			host.message.emit("The change could not be saved. Your world has been kept")
			host.transaction_finished.emit(kind,false)
			return
	for change in active.changes: host.store.set_id(change.cell,change.after)
	host.terrain_editor.publish(worker.result)
	for change in active.changes: host.update_column(change.cell)
	if kind=="edit":
		host.undo_stack.append(active.changes[0])
		if host.undo_stack.size()>128: host.undo_stack.pop_front()
		host.redo_stack.clear()
	elif kind in ["undo","redo"]:
		var source: Array=host.redo_stack if kind=="redo" else host.undo_stack
		var destination: Array=host.undo_stack if kind=="redo" else host.redo_stack
		destination.append(source.pop_back())
	else:
		host.undo_stack.clear()
		host.redo_stack.clear()
	host.committing_history=kind in ["undo","redo"]
	if kind!="reset":
		for change in active.changes: host.edited.emit(change.cell,change.before,change.after)
	if host.committing_history: host.history_applied.emit(kind=="redo")
	if kind=="reset": host.reset_applied.emit()
	host.committing_history=false
	last_publish_us=Time.get_ticks_usec()-began
	host.transaction_finished.emit(kind,true)

func invalidate() -> void:
	generation+=1
	queue.clear()

func shutdown() -> void:
	invalidate()
	if task>=0: WorkerThreadPool.wait_for_task_completion(task)
	task=-1
	active={}
	worker=null
	host=null
