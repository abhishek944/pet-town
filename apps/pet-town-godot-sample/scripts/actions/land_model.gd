extends RefCounted

static func mesh(parent: Node3D, geometry: Mesh, color: String, position := Vector3.ZERO, glow := false) -> MeshInstance3D:
	var item := MeshInstance3D.new()
	item.mesh = geometry
	item.position = position
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(color)
	material.roughness = 0.9
	if glow:
		material.emission_enabled = true
		material.emission = Color(color)
		material.emission_energy_multiplier = 0.7
	item.material_override = material
	parent.add_child(item)
	return item

static func box(parent: Node3D, size: Vector3, color: String, point: Vector3) -> MeshInstance3D:
	var geometry := BoxMesh.new()
	geometry.size = size
	return mesh(parent, geometry, color, point)

static func sphere(parent: Node3D, radius: float, color: String, point := Vector3.ZERO, glow := false) -> MeshInstance3D:
	var geometry := SphereMesh.new()
	geometry.radius = radius
	geometry.height = radius * 2
	geometry.radial_segments = 12
	geometry.rings = 6
	return mesh(parent, geometry, color, point, glow)

static func cylinder(parent: Node3D, top: float, bottom: float, height: float, color: String, point: Vector3, glow := false) -> MeshInstance3D:
	var geometry := CylinderMesh.new()
	geometry.top_radius = top
	geometry.bottom_radius = bottom
	geometry.height = height
	geometry.radial_segments = 10
	return mesh(parent, geometry, color, point, glow)

static func ring(parent: Node3D, radius: float, thickness: float, color: String, point: Vector3) -> MeshInstance3D:
	var geometry := TorusMesh.new()
	geometry.inner_radius = radius - thickness
	geometry.outer_radius = radius + thickness
	geometry.rings = 12
	geometry.ring_segments = 6
	return mesh(parent, geometry, color, point)

static func line(parent: Node3D, points: Array, color: String, radius := 0.012) -> Node3D:
	var root := Node3D.new()
	parent.add_child(root)
	for index in range(points.size() - 1):
		var start: Vector3 = points[index]
		var end: Vector3 = points[index + 1]
		var part := cylinder(root, radius, radius, start.distance_to(end), color, (start + end) * 0.5)
		part.quaternion = Quaternion(Vector3.UP, (end - start).normalized())
	return root

static func update_line(root: Node3D, points: Array) -> void:
	for index in range(points.size() - 1):
		var start: Vector3 = points[index]
		var end: Vector3 = points[index + 1]
		var part: MeshInstance3D = root.get_child(index)
		part.position = (start + end) * 0.5
		part.mesh.height = start.distance_to(end)
		part.quaternion = Quaternion(Vector3.UP, (end - start).normalized())
