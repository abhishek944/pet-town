extends Node3D
const Model = preload("land_model.gd")
const ShellModel = preload("land_shell_model.gd")
const Support = preload("land_support.gd")
var sample: Node3D
var progress: RefCounted
var definitions: Array = []
var shore: Array = []
var display: Array = []
var shelf: Node3D
var body: StaticBody3D
var sparkle: Node3D
var hinted: Array = []

func setup(value: Node3D, saved: RefCounted, shells: Array) -> void:
	sample = value
	progress = saved
	definitions = shells
	name = "Shellhaven shell hunt and display"
	for shell in shells:
		var root := ShellModel.create(self, shell)
		var glint := Model.sphere(root, 0.065, "ffe9ad", Vector3(0, 0.8, 0), true)
		shore.append({"root": root, "sparkle": glint, "shell": shell})
	shelf = Node3D.new()
	add_child(shelf)
	Model.box(shelf, Vector3(3.2, 0.12, 1.1), "c59c71", Vector3(0, 1.03, 0))
	for x in [-1.4, 1.4]:
		for z in [-0.4, 0.4]: Model.box(shelf, Vector3(0.12, 1, 0.12), "9a7657", Vector3(x, 0.5, z))
	for z in [-0.54, 0.54]: Model.box(shelf, Vector3(3.2, 0.1, 0.08), "b18961", Vector3(0, 1.1, z))
	for index in shells.size():
		var shell: Dictionary = shells[index]
		var root := ShellModel.create(shelf, shell)
		root.scale = Vector3.ONE * 0.65
		root.position = Vector3(-1.25 + index * 0.5, 1.09, 0)
		display.append(root)
		Model.box(shelf, Vector3(0.34, 0.01, 0.13), "%06x" % int(shell.color), Vector3(root.position.x, 1.1, 0.33))
	sparkle = Model.sphere(shelf, 0.07, "ffe4a0", Vector3.ZERO, true)
	body = StaticBody3D.new()
	shelf.add_child(body)
	var collider := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(3.2, 1.16, 1.18)
	collider.shape = shape
	collider.position.y = 0.58
	body.add_child(collider)

func shelf_support() -> Variant:
	return Support.ground(sample.world, -16, 82, 1.65, 0.65)

func at_display() -> bool:
	return Support.nearby(sample, -16, 82, 5, shelf_support(), 2.2)

func nearby() -> Dictionary:
	var found := {}
	var nearest := INF
	for shell in definitions:
		if shell.id in progress.state.shells: continue
		var height = Support.ground(sample.world, shell.x, shell.z, 0.55, 0.55)
		if not Support.nearby(sample, shell.x, shell.z, 2.7, height, 2.2): continue
		var point: Vector3 = sample.actor.global_position
		var distance := Vector2(point.x - shell.x, point.z - shell.z).length()
		if distance < nearest:
			found = shell
			nearest = distance
	return found

func collect(id: String) -> void:
	var shell := nearby()
	if not shell.is_empty() and shell.id == id and progress.collect(id):
		sample.hud.show_toast("❋ Collected %s · %d/6. Find it on your Shell Cove shelf." % [shell.name, progress.state.shells.size()])

func feature(id: String) -> void:
	if at_display() and progress.feature(id): sample.hud.show_toast("Your favorite shell is sparkling on the cove display.")

func _process(_delta: float) -> void:
	if not sample: return
	for index in shore.size():
		var entry: Dictionary = shore[index]
		var shell: Dictionary = entry.shell
		var height = Support.ground(sample.world, shell.x, shell.z, 0.55, 0.55)
		entry.root.visible = height != null and shell.id not in progress.state.shells
		if height != null: entry.root.position = Vector3(shell.x, height, shell.z)
		entry.sparkle.position.y = 0.8 + sin(sample.elapsed * 1.7 + index) * 0.12
		entry.sparkle.rotation.y = sample.elapsed * 0.65
	var support = shelf_support()
	shelf.visible = support != null
	body.collision_layer = 1 if shelf.visible else 0
	if support != null: shelf.position = Vector3(-16, support, 82)
	sparkle.visible = false
	for index in display.size():
		display[index].visible = definitions[index].id in progress.state.shells
		if display[index].visible and definitions[index].id == progress.state.favorite:
			sparkle.visible = true
			sparkle.position = Vector3(display[index].position.x, 1.65, 0)
			display[index].rotation.y = sin(sample.elapsed * 0.7) * 0.08
	if not sample.hud.is_menu_open and progress.available and not sample.region_actions.journal.following:
		var shell := nearby()
		if not shell.is_empty() and shell.id not in hinted:
			hinted.append(shell.id)
			sample.hud.show_toast("A %s is sparkling nearby. Open J to collect it." % shell.name)
