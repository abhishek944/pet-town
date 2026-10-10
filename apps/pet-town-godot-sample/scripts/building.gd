extends Node3D
signal message(text: String)
signal selection_changed(index: int)
signal edited(cell: Vector3i,before: int,after: int)
signal history_applied(redo: bool)
signal reset_applied
signal transaction_finished(kind: String,success: bool)
signal pointer_changed(screen: Vector2,state: String,material: String)
var committing_history:=false
var persist_edits:=true
var transactions: RefCounted
var world: Node3D
var camera: Camera3D
var actor: RigidBody3D
var active:=true
var selected:=0
var blocks: Dictionary={}
var undo_stack: Array=[]
var redo_stack: Array=[]
var store: RefCounted
var terrain_editor: Node3D
var foliage_editor: RefCounted
var ghost: MeshInstance3D
var preview: Node3D
var names: Array[String]=["Grass","Soil","Cobblestone","Sand","Wood Planks","Log","Brick","Glass","Roof Tile","Leafy Block","Flower Bed","Lantern"]

signal initialization_finished
var initialization_complete := false
var boot_budget: RefCounted

func _ready() -> void:
	await initialize()
	initialization_complete = true
	initialization_finished.emit()

func initialize() -> void:
	if not world or world.manifest.is_empty(): return
	transactions=preload("building/transactions.gd").new()
	transactions.host=self
	store=preload("building/voxel_store.gd").new()
	if boot_budget: await boot_budget.background(store.setup.bind(world.manifest))
	else: store.setup(world.manifest)
	world.set("voxels",store)
	blocks=store.edits
	terrain_editor=preload("building/terrain_edit.gd").new()
	add_child(terrain_editor)
	await terrain_editor.setup(world,store,boot_budget)
	foliage_editor=preload("building/foliage_edit.gd").new()
	await foliage_editor.setup(world.vegetation,store,boot_budget)
	preview=preload("building/preview.gd").new()
	add_child(preview)
	preview.setup(self)
	ghost=preview.ghost
	var restored: Array=store.load_edits()
	if not restored.is_empty():
		await terrain_editor.refresh(restored,boot_budget)
		for cell in restored:
			update_column(cell)
			if boot_budget: await boot_budget.checkpoint()

func _process(delta: float) -> void:
	if transactions: transactions.tick()
	if not preview: return
	var screen:=aim_screen(get_viewport().get_mouse_position())
	var enabled: bool=active and actor.enabled and preview.is_awake() and get_viewport().gui_get_hovered_control()==null
	var hit: Dictionary=target(screen) if enabled else {}
	preview.update(delta,hit,enabled)
	var state:="idle" if hit.is_empty() else ("aim" if can_place(hit.place) else "bad")
	pointer_changed.emit(screen,state,names[selected])

func wake_preview() -> void:
	if preview and active and actor.enabled: preview.wake()

func aim_screen(screen: Vector2) -> Vector2:
	if actor and actor.view and (actor.view.first_person or Input.mouse_mode==Input.MOUSE_MODE_CAPTURED):
		return get_viewport().get_visible_rect().size*0.5
	return screen

func target(screen: Vector2) -> Dictionary:
	if not camera or not store: return {}
	screen=aim_screen(screen)
	var start:=camera.project_ray_origin(screen)
	var query:=PhysicsRayQueryParameters3D.create(start,start+camera.project_ray_normal(screen)*32.0,1)
	var hit:=terrain_hit(query)
	if hit.is_empty(): return {}
	var normal: Vector3=hit.normal
	var axis:=normal.abs().max_axis_index()
	var direction:=Vector3i.ZERO
	direction[axis]=1 if normal[axis]>0 else -1
	var cell:=Vector3i((hit.position-Vector3(direction)*0.14).floor())
	if (Vector3(cell)+Vector3.ONE*0.5).distance_to(actor.global_position+Vector3.UP*1.2)>9.0: return {}
	hit.cell=cell
	hit.place=cell+direction
	hit.direction=direction
	return hit

func terrain_hit(query: PhysicsRayQueryParameters3D) -> Dictionary:
	# The original terrain ray ignores authored props and wildlife colliders.
	var excluded: Array[RID]=[]
	for attempt in 32:
		var hit:=get_world_3d().direct_space_state.intersect_ray(query)
		if hit.is_empty(): return {}
		var owner_node: Node=hit.collider
		while owner_node:
			if owner_node==world.terrain or owner_node==terrain_editor: return hit
			owner_node=owner_node.get_parent()
		excluded.append(hit.rid)
		query.exclude=excluded
	return {}

func can_place(cell: Vector3i) -> bool:
	if not store.contains(cell) or cell.y<=0 or store.get_id(cell)!=0: return false
	var volume:=AABB(Vector3(cell),Vector3.ONE).grow(0.32)
	if volume.has_point(actor.global_position+Vector3.UP*0.4) or volume.has_point(actor.global_position+Vector3.UP*1.1): return false
	return cell_clear(cell)

func cell_clear(cell: Vector3i, mask := 7) -> bool:
	var query:=PhysicsShapeQueryParameters3D.new()
	var shape:=BoxShape3D.new()
	shape.size=Vector3.ONE*0.9
	query.shape=shape
	query.transform.origin=Vector3(cell)+Vector3.ONE*0.5
	query.collision_mask=mask
	return get_world_3d().direct_space_state.intersect_shape(query,1).is_empty()

func edit(button: int,screen: Vector2) -> void:
	if not active or not actor.enabled or not store: return
	var hit:=target(screen)
	if hit.is_empty(): return
	wake_preview()
	var cell: Vector3i=hit.cell
	if button==MOUSE_BUTTON_RIGHT:
		cell=hit.place
		if not can_place(cell):
			preview.denied()
			message.emit("There isn't room for a block here")
			return
		commit(cell,store.palette[selected])
		preview.placed()
	elif button==MOUSE_BUTTON_LEFT:
		if cell.y<=0 or not store.contains(cell) or store.get_id(cell)==0: return
		commit(cell,0)
	elif button==MOUSE_BUTTON_MIDDLE:
		var index: int=store.palette_index(store.get_id(cell))
		if index>=0:
			selected=index
			selection_changed.emit(index)
			message.emit(names[index]+" selected")

func commit(cell: Vector3i,value: int) -> void:
	if transactions: transactions.enqueue("edit",cell,value)

func is_edit_pending() -> bool:
	return transactions!=null and transactions.pending()

func apply(cell: Vector3i,value: int) -> void:
	# Internal synchronous path; user operations enqueue pending transactions.
	if transactions: transactions.invalidate()
	if not store.contains(cell) or value<0 or value>=store.definitions.size(): return
	var previous: int=store.get_id(cell)
	store.set_id(cell,value)
	terrain_editor.refresh([cell])
	update_column(cell)
	world.invalidate_collision([Vector2i(cell.x,cell.z)],true)
	edited.emit(cell,previous,value)

func update_column(cell: Vector3i) -> void:
	var top: int=store.top_y(cell.x,cell.z)
	var water_ground: int=store.water_ground_y(cell.x,cell.z,float(world.manifest.waterLevel))
	world.submerged_floors[Vector2i(cell.x,cell.z)]=water_ground
	world.ground[Vector2i(cell.x,cell.z)]=Vector2(top,1 if water_ground<float(world.manifest.waterLevel) else 0)
	if world.effects.water.has_method("set_terrain_column"):
		world.effects.water.set_terrain_column(cell.x,cell.z,float(water_ground))
	foliage_editor.refresh(cell)

func undo(redo:=false) -> void:
	if transactions: transactions.enqueue("redo" if redo else "undo")

func reset_blocks() -> void:
	if transactions: transactions.enqueue("reset")

func _exit_tree() -> void:
	if transactions: transactions.shutdown()
