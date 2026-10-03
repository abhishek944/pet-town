extends Node3D
const Model = preload("land_model.gd")
const Support = preload("land_support.gd")
var sample: Node3D
var progress: RefCounted
var posts: Array = []
var lanterns: Array = []
var rope: Node3D
var glow: OmniLight3D
var last_heights: Array = []

func setup(value: Node3D, saved: RefCounted) -> void:
	sample = value
	progress = saved
	name = "Willowmere wish lanterns"
	for x in [-50, -46]:
		posts.append(Model.cylinder(self, 0.08, 0.12, 3.3, "876342", Vector3(x, 1.65, -67)))
	for index in range(8):
		var root := Node3D.new()
		add_child(root)
		var variants: Array = []
		for color in ["ffd58a", "f3b88d", "ffebbc"]:
			variants.append(Model.cylinder(root, 0.16, 0.13, 0.34, color, Vector3.ZERO, true))
		for y in [-0.18, 0.18]: Model.ring(root, 0.145, 0.02, "95714c", Vector3(0, y, 0))
		Model.ring(root, 0.055, 0.014, "997955", Vector3(0, 0.25, 0)).rotation.x = PI / 2
		lanterns.append({"root": root, "variants": variants})
	glow = OmniLight3D.new()
	glow.light_color = Color("ffc780")
	glow.omni_range = 8
	add_child(glow)

func heights() -> Array:
	var left = Support.ground(sample.world, -50, -67)
	var right = Support.ground(sample.world, -46, -67)
	return [] if left == null or right == null else [left, right]

func can_hang() -> bool:
	var supported := heights()
	return progress.available and progress.state.lanterns.size() < 8 and not supported.is_empty() and Support.nearby(sample, -48, -67, 6, (float(supported[0]) + float(supported[1])) / 2)

func hang(wish: String) -> void:
	if can_hang() and progress.hang(wish):
		sample.hud.show_toast("✧ A wish for %s is glowing in the grove." % wish.to_lower())

func _process(_delta: float) -> void:
	if not sample: return
	var supported := heights()
	visible = not supported.is_empty()
	if not visible: return
	for index in range(2): posts[index].position.y = supported[index] + 1.65
	if supported != last_heights:
		if is_instance_valid(rope):
			remove_child(rope)
			rope.queue_free()
		rope = Model.line(self, [Vector3(-50, supported[0] + 3.2, -67), Vector3(-48, (supported[0] + supported[1]) / 2 + 2.8, -67), Vector3(-46, supported[1] + 3.2, -67)], "ae8c61")
		last_heights = supported
	for index in lanterns.size():
		var item: Dictionary = lanterns[index]
		item.root.visible = index < progress.state.lanterns.size()
		if not item.root.visible: continue
		var t := (index + 0.5) / 8
		var y: float = supported[0] * (1 - t) + supported[1] * t + 3.2 - sin(t * PI) * 0.4
		item.root.position = Vector3(-50 + t * 4, y - 0.26, -67)
		item.root.rotation.z = sin(sample.elapsed * 0.8 + index) * 0.05
		for choice in range(3): item.variants[choice].visible = progress.WISHES[choice] == progress.state.lanterns[index]
	glow.position = Vector3(-48, (supported[0] + supported[1]) / 2 + 2, -67)
	glow.visible = not progress.state.lanterns.is_empty()
	glow.light_energy = 1.3 * float(sample.world.effects.daylight.sample.get("stars", 0))
