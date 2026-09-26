class_name UserTree
extends Node3D

const FOOTPRINT := preload("res://scripts/town_selection_footprint.gd")

@export var tree_id := ""
@export var is_authored := false
@export var is_build_item := false
@export var catalog_item_id := ""
@export var tree_variant := ""
@export var size_multiplier := 1.0
@export var authored_base_scale := Vector3.ONE
@export var bounds_baked := false
@export var selection_ground_y := 0.0
@export var selection_ring_position := Vector3.ZERO
@export var selection_ring_radius := 1.2

var pick_area: Area3D
static var shared_ring: MeshInstance3D
static var ring_owner: UserTree
static var pick_shapes := {}
var selection_outline := PackedVector2Array()
var marker_transform := Transform3D.IDENTITY

func _ready() -> void:
	pick_area = get_node_or_null("PickArea") as Area3D
	if pick_area == null:
		pick_area = Area3D.new()
		pick_area.name = "PickArea"
		pick_area.collision_layer = 4
		pick_area.collision_mask = 0
		pick_area.monitoring = false
		add_child(pick_area)
		var shape := CollisionShape3D.new()
		shape.name = "CollisionShape3D"
		pick_area.add_child(shape)
	authored_base_scale = scale
	add_to_group("editable_trees")
	set_process(false)
	if is_authored:
		for model_name in ["Trunk", "CrownLarge", "CrownSmall"]:
			var default_model := get_node_or_null(model_name)
			if default_model != null:
				remove_child(default_model)
				default_model.free()
	if not bounds_baked:
		fit_pick_area_to_visuals()
	if is_authored and tree_id.begins_with("object:"):
		var collision := pick_area.get_node_or_null("CollisionShape3D") as CollisionShape3D
		if collision != null and collision.shape is BoxShape3D:
			var size := (collision.shape as BoxShape3D).size
			if size.y > 2.5:
				selection_ring_radius = maxf(selection_ring_radius, maxf(size.x, size.z) * 0.75)

func _exit_tree() -> void:
	if ring_owner == self:
		ring_owner = null
		if is_instance_valid(shared_ring):
			shared_ring.visible = false

func _process(_delta: float) -> void:
	if ring_owner != self or not is_instance_valid(shared_ring):
		set_process(false)
		return
	shared_ring.visible = is_visible_in_tree()
	if not global_transform.is_equal_approx(marker_transform):
		_refresh_selection_marker()

func _refresh_selection_marker() -> void:
	if ring_owner != self or not is_instance_valid(shared_ring):
		return
	shared_ring.visible = is_visible_in_tree()
	selection_outline = FOOTPRINT.outline(self)
	var center: Vector3 = FOOTPRINT.marker_center(self, selection_outline)
	shared_ring.global_transform = Transform3D(Basis.IDENTITY, center)
	shared_ring.mesh = FOOTPRINT.marker_mesh(self, selection_outline, center)
	marker_transform = global_transform

func fit_pick_area_to_visuals() -> void:
	var collision := pick_area.get_node_or_null("CollisionShape3D") as CollisionShape3D
	if collision == null:
		return
	for child in pick_area.get_children():
		if child is CollisionShape3D and child != collision:
			pick_area.remove_child(child)
			child.free()
	var bounds := AABB()
	var has_bounds := false
	var visible_meshes: Array[MeshInstance3D] = []
	for candidate in find_children("*", "MeshInstance3D", true, false):
		var mesh_instance := candidate as MeshInstance3D
		if mesh_instance.mesh == null:
			continue
		visible_meshes.append(mesh_instance)
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
		var box_size := Vector3(maxf(bounds.size.x, 0.8), maxf(bounds.size.y, 0.8), maxf(bounds.size.z, 0.8))
		if not pick_shapes.has(box_size):
			var box := BoxShape3D.new()
			box.size = box_size
			pick_shapes[box_size] = box
		collision.shape = pick_shapes[box_size]
		collision.transform = Transform3D.IDENTITY
		pick_area.position.x = bounds.position.x + bounds.size.x * 0.5
		pick_area.position.y = bounds.position.y + bounds.size.y * 0.5
		pick_area.position.z = bounds.position.z + bounds.size.z * 0.5
		# Garden detail meshes often scatter tiny stones across an entire tile.
		# Their AABB selects the empty gaps and objects behind them.
		var precise_flower := tree_id.begins_with("flower:") and visible_meshes.size() <= 12
		var precise_surface := tree_id.begins_with("surface:")
		var scattered_detail := (tree_id.begins_with("reference:") or " detail " in tree_id.to_lower()) and bounds.size.x * bounds.size.z > 16.0 and visible_meshes.size() <= 8 and not tree_id.begins_with("reference:EditableTree_")
		if precise_flower or precise_surface or scattered_detail:
			for index in visible_meshes.size():
				var visual := visible_meshes[index]
				var triangle_shape := visual.mesh.create_trimesh_shape()
				var precise := collision
				if index > 0:
					precise = CollisionShape3D.new()
					precise.name = "PrecisePick_%d" % index
					pick_area.add_child(precise)
				if triangle_shape != null:
					precise.shape = triangle_shape
					precise.global_transform = visual.global_transform
				else:
					var visual_bounds := visual.get_aabb()
					var fallback := BoxShape3D.new()
					fallback.size = Vector3(maxf(visual_bounds.size.x, 0.2), maxf(visual_bounds.size.y, 0.2), maxf(visual_bounds.size.z, 0.2))
					precise.shape = fallback
					precise.global_transform = visual.global_transform * Transform3D(Basis.IDENTITY, visual_bounds.get_center())
		selection_ground_y = bounds.position.y + 0.08
		selection_ring_radius = clampf(maxf(bounds.size.x, bounds.size.z) * 0.52, 1.2, 2.0)
		selection_ring_position = Vector3(bounds.position.x + bounds.size.x * 0.5, selection_ground_y, bounds.position.z + bounds.size.z * 0.5)
		bounds_baked = true
		if ring_owner == self:
			_refresh_selection_marker()

func set_selected(selected: bool) -> void:
	_show_ring(selected)

func set_selection_hit_position(world_position: Vector3) -> void:
	if tree_id.begins_with("flower:") or tree_id.begins_with("surface:") or " detail " in tree_id.to_lower():
		var local_hit := to_local(world_position)
		selection_ring_position = Vector3(local_hit.x, selection_ground_y, local_hit.z)
		selection_ring_radius = 0.9
		_refresh_selection_marker()

func set_size_multiplier(value: float) -> void:
	size_multiplier = clampf(value, 0.5, 2.0)
	scale = authored_base_scale * size_multiplier

func set_placement_preview(preview: bool) -> void:
	_show_ring(preview)
	pick_area.collision_layer = 0 if preview else 4
	for child in find_children("*", "MeshInstance3D", true, false):
		(child as MeshInstance3D).transparency = 0.38 if preview else 0.0

func ground_y() -> float:
	return (global_transform * Vector3(0.0, selection_ground_y, 0.0)).y

func _show_ring(show: bool) -> void:
	if not show:
		if ring_owner == self:
			ring_owner = null
			shared_ring.visible = false
		set_process(false)
		return
	if is_instance_valid(ring_owner) and ring_owner != self:
		ring_owner.set_process(false)
	if not is_instance_valid(shared_ring):
		shared_ring = MeshInstance3D.new()
		shared_ring.name = "TownSelectionFootprint"
		shared_ring.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		get_tree().root.add_child(shared_ring)
	ring_owner = self
	set_process(true)
	_refresh_selection_marker()
