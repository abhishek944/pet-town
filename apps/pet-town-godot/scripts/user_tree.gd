class_name UserTree
extends Node3D

@export var tree_id := ""
@export var is_authored := false
@export var is_build_item := false
@export var catalog_item_id := ""
@export var size_multiplier := 1.0
@export var authored_base_scale := Vector3.ONE

@onready var selection_marker: MeshInstance3D = $SelectionMarker
@onready var pick_area: Area3D = $PickArea
var selection_crown_ring: MeshInstance3D

func _ready() -> void:
	authored_base_scale = scale
	add_to_group("editable_trees")
	selection_crown_ring = get_node_or_null("SelectionCrownRing") as MeshInstance3D
	if selection_crown_ring == null:
		selection_crown_ring = MeshInstance3D.new()
		selection_crown_ring.name = "SelectionCrownRing"
		add_child(selection_crown_ring)
	selection_crown_ring.visible = false
	selection_crown_ring.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var ring_material := StandardMaterial3D.new()
	ring_material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	ring_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	ring_material.no_depth_test = true
	ring_material.render_priority = 1
	ring_material.albedo_color = Color(1.0, 0.78, 0.24, 1.0)
	var ring := TorusMesh.new()
	ring.inner_radius = 0.94
	ring.outer_radius = 1.0
	ring.material = ring_material
	selection_crown_ring.mesh = ring
	fit_pick_area_to_visuals()

func fit_pick_area_to_visuals() -> void:
	var collision := pick_area.get_node_or_null("CollisionShape3D") as CollisionShape3D
	if collision == null:
		return
	var bounds := AABB()
	var has_bounds := false
	for candidate in find_children("*", "MeshInstance3D", true, false):
		var mesh_instance := candidate as MeshInstance3D
		if mesh_instance == selection_marker or mesh_instance == selection_crown_ring or mesh_instance.mesh == null:
			continue
		if tree_id.begins_with("flower:") and ("Reference leaf" in String(mesh_instance.name) or "Garden detail leaf" in String(mesh_instance.name)):
			continue
		var local_transform := mesh_instance.transform
		var cursor := mesh_instance.get_parent()
		while cursor != self:
			var parent_3d := cursor as Node3D
			if parent_3d == null:
				break
			local_transform = parent_3d.transform * local_transform
			cursor = parent_3d.get_parent()
		var mesh_bounds: AABB = local_transform * mesh_instance.get_aabb()
		bounds = mesh_bounds if not has_bounds else bounds.merge(mesh_bounds)
		has_bounds = true
	if has_bounds:
		# Cover the visible canopy, not just the trunk. Round crowns can be wider
		# than the old capped capsule, which made them impossible to select.
		var box := BoxShape3D.new()
		box.size = Vector3(maxf(bounds.size.x, 0.8), maxf(bounds.size.y, 0.8), maxf(bounds.size.z, 0.8))
		collision.shape = box
		pick_area.position.x = bounds.position.x + bounds.size.x * 0.5
		pick_area.position.y = bounds.position.y + bounds.size.y * 0.5
		pick_area.position.z = bounds.position.z + bounds.size.z * 0.5
		selection_marker.position = Vector3(bounds.position.x + bounds.size.x * 0.5, bounds.position.y + 0.08, bounds.position.z + bounds.size.z * 0.5)
		selection_marker.scale = Vector3(maxf(bounds.size.x, 2.4) / 3.1, 1.0, maxf(bounds.size.z, 2.4) / 3.1)
		var radius := clampf(maxf(bounds.size.x, bounds.size.z) * 0.52, 1.2, 2.0)
		selection_crown_ring.scale = Vector3(radius, 1.0, radius)
		selection_crown_ring.position = Vector3(bounds.position.x + bounds.size.x * 0.5, bounds.end.y + 0.18, bounds.position.z + bounds.size.z * 0.5)

func set_selected(selected: bool) -> void:
	selection_marker.visible = false
	selection_crown_ring.visible = selected

func set_size_multiplier(value: float) -> void:
	size_multiplier = clampf(value, 0.5, 2.0)
	scale = authored_base_scale * size_multiplier

func set_placement_preview(preview: bool) -> void:
	selection_marker.visible = false
	selection_crown_ring.visible = preview
	pick_area.collision_layer = 0 if preview else 4
	for child in find_children("*", "MeshInstance3D", true, false):
		if child != selection_marker and child != selection_crown_ring:
			(child as MeshInstance3D).transparency = 0.38 if preview else 0.0
