extends RefCounted
const Model = preload("land_model.gd")

static func create(parent: Node3D, shell: Dictionary) -> Node3D:
	var root := Node3D.new()
	root.name = shell.name
	parent.add_child(root)
	var group := Node3D.new()
	group.position.y = 0.24 if shell.shape == "spiral" else 0.1
	root.add_child(group)
	var color: String = "%06x" % int(shell.color)
	if shell.shape == "fan":
		Model.sphere(group, 0.32, color).scale = Vector3(1, 0.3, 1.12)
		for rib in range(-3, 4):
			var angle := rib * 0.23
			var item := Model.cylinder(group, 0.018, 0.035, 0.55, "ffedcd", Vector3(sin(angle) * 0.1, 0.075, -0.01))
			item.rotation = Vector3(PI / 2, 0, angle)
		Model.sphere(group, 0.1, color, Vector3(0, 0, -0.28))
	elif shell.shape == "spiral":
		Model.cylinder(group, 0, 0.24, 0.62, color, Vector3(0, 0, -0.04)).rotation.x = PI / 2
		for ring in range(4):
			Model.ring(group, 0.09 + ring * 0.045, 0.025, "ffebd0", Vector3(0, 0, 0.23 - ring * 0.13)).rotation.x = PI / 2
		Model.sphere(group, 0.14, "f3d5ac", Vector3(0, 0, 0.27)).scale = Vector3(0.8, 0.35, 1)
	else:
		Model.sphere(group, 0.3, color).scale = Vector3(1, 0.3, 0.85)
		Model.ring(group, 0.23, 0.035, "fff4d5", Vector3(0, 0.065, 0)).scale.z = 0.8
		Model.sphere(group, 0.095, "fffaf0", Vector3(0, 0.12, 0))
	return root
