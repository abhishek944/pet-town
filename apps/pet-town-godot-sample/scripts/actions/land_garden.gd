extends Node3D
const Model = preload("land_model.gd")
const Support = preload("land_support.gd")
var sample: Node3D
var progress: RefCounted
var flowers: Node3D
var shown_stage := -1
var growth := 1.0

func setup(value: Node3D, saved: RefCounted) -> void:
	sample = value
	progress = saved
	name = "Sunmeadow planted garden"
	Model.box(self, Vector3(3, 0.12, 2), "704933", Vector3(0, 0.07, 0))
	for z in [-1, 1]: Model.box(self, Vector3(3.2, 0.2, 0.13), "c69561", Vector3(0, 0.12, z))
	for x in [-1.56, 1.56]: Model.box(self, Vector3(0.13, 0.2, 2.1), "c69561", Vector3(x, 0.12, 0))
	flowers = Node3D.new()
	add_child(flowers)
	set_stage(progress.state.garden)

func support() -> Variant:
	return Support.ground(sample.world, 80, 20, 1.65, 1.1)

func can_tend() -> bool:
	return progress.available and progress.state.garden < 3 and Support.nearby(sample, 80, 20, 6, support())

func tend() -> void:
	if can_tend() and progress.grow():
		set_stage(progress.state.garden)
		sample.hud.show_toast(["", "Six flower seeds planted.", "Your seedlings are growing.", "Coral, lavender, and golden flowers in bloom!"][progress.state.garden])

func set_stage(stage: int) -> void:
	if stage == shown_stage: return
	var restored := shown_stage < 0
	shown_stage = stage
	for child in flowers.get_children():
		flowers.remove_child(child)
		child.queue_free()
	growth = 1 if restored else 0.2
	if stage == 0: return
	for index in range(6):
		var flower := Node3D.new()
		flower.position = Vector3(-1 + index % 3, 0.14, -0.5 if index < 3 else 0.5)
		flowers.add_child(flower)
		if stage == 1:
			Model.sphere(flower, 0.09, "d3ba78", Vector3(0, 0.025, 0)).scale.y = 0.4
			continue
		var height := 0.28 if stage == 2 else 0.65 + (index % 3) * 0.1
		Model.cylinder(flower, 0.025, 0.032, height, "638952", Vector3(0, height / 2, 0))
		for side in [-1, 1]:
			var leaf := Model.sphere(flower, 0.12, "79a855", Vector3(side * 0.09, height * 0.42, 0))
			leaf.scale = Vector3(1, 0.27, 0.5)
			leaf.rotation.z = side * 0.5
		var color: String = ["f28d80", "c49ce0", "f1c869"][index % 3]
		if stage == 2:
			Model.sphere(flower, 0.075, color, Vector3(0, height, 0))
		else:
			for petal in range(5):
				var angle := petal * TAU / 5
				Model.sphere(flower, 0.12, color, Vector3(cos(angle) * 0.12, height + 0.02, sin(angle) * 0.12)).scale.y = 0.45
			Model.sphere(flower, 0.085, "ffdf8e", Vector3(0, height + 0.035, 0))

func _process(delta: float) -> void:
	if not sample: return
	var top = support()
	visible = top != null
	if top != null: position = Vector3(80, top, 20)
	set_stage(progress.state.garden)
	growth = minf(1, growth + delta * 0.8)
	flowers.scale.y = growth
	for index in flowers.get_child_count():
		flowers.get_child(index).rotation.z = sin(sample.elapsed * 1.3 + index) * 0.035 if shown_stage > 1 else 0
