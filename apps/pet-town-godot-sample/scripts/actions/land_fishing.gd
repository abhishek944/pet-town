extends Node3D
const Model = preload("land_model.gd")
const Support = preload("land_support.gd")
var sample: Node3D
var journal: Node
var progress: RefCounted
var phase := "idle"
var remaining := 0.0
var catch_name := ""
var message := "Cast from the shore. Wait for a nibble, then reel within four seconds."
var rod: Node3D
var bobber: Node3D
var ripple: Node3D
var line: Node3D
var fish: Array = []

func setup(value: Node3D, owner_journal: Node, saved: RefCounted) -> void:
	sample = value
	journal = owner_journal
	progress = saved
	name = "Willowmere fishing rod and bobber"
	rod = Node3D.new()
	add_child(rod)
	Model.cylinder(rod, 0.028, 0.065, 2.8, "a47744", Vector3(-0.4, 1.36, -0.35)).rotation.x = -0.28
	Model.cylinder(rod, 0.075, 0.075, 0.48, "6d5142", Vector3(-0.4, 0.25, 0))
	Model.ring(rod, 0.12, 0.035, "c4c0ae", Vector3(-0.4, 0.55, 0.08)).rotation.x = PI / 2
	bobber = Model.sphere(self, 0.16, "f29978", Vector3.ZERO, true)
	Model.sphere(bobber, 0.09, "fff0cb", Vector3(0, 0.12, 0))
	ripple = Model.ring(self, 0.4, 0.025, "f5db91", Vector3.ZERO)
	for color in ["a5c3b2", "c3d6dc", "f0ba67"]:
		var root := Node3D.new()
		add_child(root)
		Model.sphere(root, 0.22, color).scale = Vector3(1.8, 0.75, 0.55)
		Model.cylinder(root, 0, 0.16, 0.23, "d8ad70", Vector3(-0.4, 0, 0)).rotation.z = -PI / 2
		Model.sphere(root, 0.035, "404d45", Vector3(0.24, 0.03, 0.12))
		fish.append(root)
	get_tree().root.focus_exited.connect(cancel)

func supported() -> Dictionary:
	return Support.fishing(sample.world)

func can_fish() -> bool:
	var top := supported()
	return journal.enabled() and not top.is_empty() and Support.nearby(sample, -20, -66, 5.5, top.get("shore"))

func cancel() -> void:
	if phase != "idle":
		message = "Your fish was gently returned to the lake. Its discovery is saved." if phase == "caught" else "The cast has been put away. Open the journal at the shore to try again."
	phase = "idle"
	remaining = 0
	catch_name = ""

func perform() -> void:
	if not can_fish(): return
	match phase:
		"idle":
			phase = "waiting"
			remaining = 3.2 + (progress.state.catches % 3) * 0.4
			message = "Your bobber is afloat. Watch it gently bob…"
		"waiting":
			cancel()
			message = "A little too early! Give the fish time to nibble, then reel."
		"nibble":
			var name: String = progress.catch_fish()
			if name.is_empty(): return
			catch_name = name
			phase = "caught"
			remaining = 0
			message = "You caught a %s! Its discovery is saved. Gently release it when you are ready." % name
			sample.hud.show_toast("≈ Discovered %s · %d/3 fish" % [name, progress.state.fish.size()])
		"caught":
			cancel()
			message = "Released with a little splash. Thank you, little fish! Cast again whenever you like."
	journal.refresh()

func label() -> String:
	match phase:
		"waiting": return "Waiting for a nibble…"
		"nibble": return "Reel now! · %.1fs" % maxf(0, remaining)
		"caught": return "Gently release fish"
	return "Cast your line"

func _process(delta: float) -> void:
	if not sample: return
	if phase != "idle" and not can_fish(): cancel()
	if phase in ["waiting", "nibble"]:
		remaining -= delta
		if remaining <= 0:
			if phase == "waiting":
				phase = "nibble"
				remaining = 4
				message = "Nibble! The bobber is dipping — reel now!"
			else:
				cancel()
				message = "The fish slipped away. Cast again and reel during the next nibble."
			journal.refresh()
	update_models()

func update_models() -> void:
	var top := supported()
	visible = not top.is_empty()
	if not visible: return
	rod.position = Vector3(-20, top.shore, -66)
	var cast := phase in ["waiting", "nibble"]
	bobber.visible = cast
	ripple.visible = phase == "nibble"
	var dip := sin(sample.elapsed * 12) * 0.16 - 0.06 if phase == "nibble" else sin(sample.elapsed * 2) * 0.03
	bobber.position = Vector3(-20, top.water + 0.05 + dip, -74)
	ripple.position = Vector3(-20, top.water + 0.045, -74)
	ripple.scale = Vector3.ONE * (1 + (sin(sample.elapsed * 6) + 1) * 0.35)
	if not is_instance_valid(line): line = Model.line(self, [Vector3.ZERO, Vector3.UP, Vector3.UP * 2], "e4dcc2", 0.006)
	line.visible = cast
	if cast: Model.update_line(line, [Vector3(-20.4, top.shore + 2.7, -66.75), Vector3(-20.2, top.water + 0.35, -70), bobber.position])
	for index in fish.size():
		fish[index].visible = phase == "caught" and progress.FISH[index] == catch_name
		fish[index].position = Vector3(-19.5, top.shore + 1.25, -66.5)
		fish[index].rotation.z = sin(sample.elapsed * 3) * 0.08
