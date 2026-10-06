extends Node3D
## Approved night fill for pet meshes; no shadow passes or world light changes.
const PET_LIGHT_LAYER := 2
var face_fill: DirectionalLight3D
var edge_fill: DirectionalLight3D

func _ready() -> void:
	face_fill = _light("PetFaceFill", Color("d0ddf1"), Vector3(-22, 0, 0))
	edge_fill = _light("PetEdgeFill", Color("849ebf"), Vector3(-35, 165, 0))

func update(sample: Dictionary, camera: Camera3D) -> void:
	var night := 1.0 - smoothstep(-0.035, 0.15, float(sample.get("sun_elevation", 1.0)))
	if camera:
		rotation.y = atan2(camera.global_basis.z.x, camera.global_basis.z.z)
	face_fill.light_energy = 0.75 * night
	edge_fill.light_energy = 0.35 * night
	face_fill.visible = night > 0.0
	edge_fill.visible = night > 0.0

func _light(title: String, color: Color, angles: Vector3) -> DirectionalLight3D:
	var light := DirectionalLight3D.new()
	light.name = title
	light.light_color = color
	light.rotation_degrees = angles
	light.light_cull_mask = PET_LIGHT_LAYER
	light.shadow_enabled = false
	light.light_energy = 0.0
	light.visible = false
	add_child(light)
	return light

static func mark(root: Node) -> void:
	if root is MeshInstance3D:
		root.layers |= PET_LIGHT_LAYER
	for child in root.get_children():
		mark(child)
