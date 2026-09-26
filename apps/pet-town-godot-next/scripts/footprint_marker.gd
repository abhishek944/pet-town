class_name WorkshopFootprintMarker
extends MeshInstance3D

const LIFT := 0.055
const CIRCLE_STEPS := 32
const CIRCLE_RINGS := 3
const RECT_STEPS := 6

var fill := StandardMaterial3D.new()
var rim := StandardMaterial3D.new()
var last_item: WorkshopObject
var last_transform := Transform3D.IDENTITY

func _ready() -> void:
	cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	fill.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	fill.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	fill.cull_mode = BaseMaterial3D.CULL_DISABLED
	fill.albedo_color = Color(1.0, 0.72, 0.18, 0.27)
	rim.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	rim.cull_mode = BaseMaterial3D.CULL_DISABLED
	rim.albedo_color = Color(1.0, 0.82, 0.29, 1.0)
	visible = false

func show_for(item: WorkshopObject) -> void:
	if not is_instance_valid(item):
		visible = false
		last_item = null
		return
	if visible and last_item == item and last_transform.is_equal_approx(item.global_transform):
		return
	last_item = item
	last_transform = item.global_transform
	var half_width := float(item.definition["width"]) * item.scale.x * 0.5 + 0.14
	var half_depth := float(item.definition["depth"]) * item.scale.z * 0.5 + 0.14
	var is_circle := String(item.definition["shape"]) == "circle"
	var fill_vertices := _circle_fill(item, maxf(half_width, half_depth)) if is_circle else _rectangle_fill(item, half_width, half_depth)
	var outline := _circle_outline(maxf(half_width, half_depth)) if is_circle else PackedVector2Array([
		Vector2(-half_width, -half_depth), Vector2(half_width, -half_depth),
		Vector2(half_width, half_depth), Vector2(-half_width, half_depth),
	])
	var edge_vertices := PackedVector3Array()
	for index in outline.size():
		var a := outline[index]
		var b := outline[(index + 1) % outline.size()]
		var outer_a := a + a.normalized() * 0.055
		var outer_b := b + b.normalized() * 0.055
		edge_vertices.append_array(PackedVector3Array([
			_surface_point(item, a), _surface_point(item, b), _surface_point(item, outer_a),
			_surface_point(item, outer_a), _surface_point(item, b), _surface_point(item, outer_b),
		]))
	mesh = _make_mesh(fill_vertices, edge_vertices)
	global_position = item.global_position
	global_rotation = Vector3(0, item.global_rotation.y, 0)
	visible = true

func _circle_outline(radius: float) -> PackedVector2Array:
	var points := PackedVector2Array()
	for index in CIRCLE_STEPS:
		var angle := TAU * index / CIRCLE_STEPS
		points.append(Vector2(cos(angle), sin(angle)) * radius)
	return points

func _circle_fill(item: WorkshopObject, radius: float) -> PackedVector3Array:
	var vertices := PackedVector3Array()
	for ring in CIRCLE_RINGS:
		var inner := radius * ring / CIRCLE_RINGS
		var outer := radius * (ring + 1) / CIRCLE_RINGS
		for index in CIRCLE_STEPS:
			var angle_a := TAU * index / CIRCLE_STEPS
			var angle_b := TAU * (index + 1) / CIRCLE_STEPS
			var a := Vector2(cos(angle_a), sin(angle_a)) * inner
			var b := Vector2(cos(angle_b), sin(angle_b)) * inner
			var c := Vector2(cos(angle_a), sin(angle_a)) * outer
			var d := Vector2(cos(angle_b), sin(angle_b)) * outer
			vertices.append_array(PackedVector3Array([
				_surface_point(item, a), _surface_point(item, c), _surface_point(item, d),
				_surface_point(item, a), _surface_point(item, d), _surface_point(item, b),
			]))
	return vertices

func _rectangle_fill(item: WorkshopObject, half_width: float, half_depth: float) -> PackedVector3Array:
	var vertices := PackedVector3Array()
	for x in RECT_STEPS:
		for z in RECT_STEPS:
			var left := lerpf(-half_width, half_width, float(x) / RECT_STEPS)
			var right := lerpf(-half_width, half_width, float(x + 1) / RECT_STEPS)
			var near := lerpf(-half_depth, half_depth, float(z) / RECT_STEPS)
			var far := lerpf(-half_depth, half_depth, float(z + 1) / RECT_STEPS)
			var a := _surface_point(item, Vector2(left, near))
			var b := _surface_point(item, Vector2(right, near))
			var c := _surface_point(item, Vector2(right, far))
			var d := _surface_point(item, Vector2(left, far))
			vertices.append_array(PackedVector3Array([a, b, c, a, c, d]))
	return vertices

func _surface_point(item: WorkshopObject, point: Vector2) -> Vector3:
	var angle := item.global_rotation.y
	var rotated := Vector2(point.x * cos(angle) + point.y * sin(angle), -point.x * sin(angle) + point.y * cos(angle))
	var world := item.global_position + Vector3(rotated.x, 0, rotated.y)
	var layer := 8 if String(item.definition.get("surface", "land")) == "water" else 16
	var query := PhysicsRayQueryParameters3D.create(world + Vector3.UP * 150.0, world + Vector3.DOWN * 150.0, layer)
	var hit := get_world_3d().direct_space_state.intersect_ray(query)
	var height := float(hit.position.y) if not hit.is_empty() else item.global_position.y
	return Vector3(point.x, height - item.global_position.y + LIFT, point.y)

func _make_mesh(fill_vertices: PackedVector3Array, edge_vertices: PackedVector3Array) -> ArrayMesh:
	var result := ArrayMesh.new()
	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = fill_vertices
	result.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	result.surface_set_material(0, fill)
	arrays[Mesh.ARRAY_VERTEX] = edge_vertices
	result.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
	result.surface_set_material(1, rim)
	return result
