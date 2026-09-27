class_name WorkshopNavigation
extends Node

signal updated

var region: NavigationRegion3D
var editor: WorkshopEditor
var base_mesh: NavigationMesh
var base_source: NavigationMeshSourceGeometryData3D
var baking_source: NavigationMeshSourceGeometryData3D
var applied_signature := ""
var requested_signature := ""
var baking := false
var queued := false

func configure(target: NavigationRegion3D, builder: WorkshopEditor) -> void:
	region = target
	editor = builder
	base_mesh = region.navigation_mesh
	base_source = NavigationMeshSourceGeometryData3D.new()
	var vertices := base_mesh.get_vertices()
	var faces := PackedVector3Array()
	for index in base_mesh.get_polygon_count():
		var polygon := base_mesh.get_polygon(index)
		for corner in range(1, polygon.size() - 1):
			# NavigationMesh polygon winding is opposite the source-geometry face winding.
			faces.append(vertices[polygon[0]])
			faces.append(vertices[polygon[corner + 1]])
			faces.append(vertices[polygon[corner]])
	base_source.add_faces(faces, Transform3D.IDENTITY)
	editor.state_changed.connect(_on_editor_changed)
	_on_editor_changed()

func _on_editor_changed() -> void:
	if is_instance_valid(editor.preview):
		return
	var signature := _signature()
	if signature == requested_signature:
		return
	requested_signature = signature
	if not queued:
		queued = true
		call_deferred("_start_bake")

func _start_bake() -> void:
	queued = false
	if baking or requested_signature == applied_signature:
		return
	if requested_signature.is_empty():
		region.navigation_mesh = base_mesh
		applied_signature = requested_signature
		updated.emit()
		return
	baking_source = NavigationMeshSourceGeometryData3D.new()
	baking_source.merge(base_source)
	for child in editor.get_children():
		var item := child as WorkshopObject
		if is_instance_valid(item) and is_instance_valid(item.solid_body):
			_add_obstruction(baking_source, item)
	var mesh := NavigationMesh.new()
	var signature := requested_signature
	baking = true
	NavigationServer3D.bake_from_source_geometry_data_async(mesh, baking_source, _bake_finished.bind(mesh, signature))

func _bake_finished(mesh: NavigationMesh, signature: String) -> void:
	baking = false
	baking_source = null
	if signature == requested_signature and mesh.get_polygon_count() > 0:
		region.navigation_mesh = mesh
		applied_signature = signature
		updated.emit()
	elif signature == requested_signature:
		push_error("Could not create pet paths around placed objects")
		applied_signature = signature
	if requested_signature != applied_signature and not queued:
		queued = true
		call_deferred("_start_bake")

func _signature() -> String:
	var entries := PackedStringArray()
	for child in editor.get_children():
		var item := child as WorkshopObject
		if is_instance_valid(item) and is_instance_valid(item.solid_body):
			entries.append(item.object_id + ":" + str(item.transform))
	return "|".join(entries)

func _add_obstruction(source: NavigationMeshSourceGeometryData3D, item: WorkshopObject) -> void:
	var width := float(item.definition["width"]) * 0.5
	var depth := float(item.definition["depth"]) * 0.5
	var corners := PackedVector3Array()
	for point in [Vector3(-width, 0, -depth), Vector3(width, 0, -depth), Vector3(width, 0, depth), Vector3(-width, 0, depth)]:
		corners.append(item.global_transform * point)
	source.add_projected_obstruction(corners, item.global_position.y - 0.25, float(item.definition["height"]) + 0.5, false)
