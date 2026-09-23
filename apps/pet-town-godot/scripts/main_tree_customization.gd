extends "res://scripts/main_tree_catalog_placement.gd"

func _update_tree_customization() -> void:
	if not is_instance_valid(tree_panel):
		return
	var controls_available := not bool(host.call("_help_is_open")) and not bool(host.call("_details_are_open")) and not bool(host.call("_settings_are_open"))
	tree_panel.visible = tree_editor_open and controls_available
	if placement_active and is_instance_valid(placement_tree):
		placement_tree.visible = controls_available
		if controls_available:
			_update_tree_placement_preview(get_viewport().get_mouse_position())

func _start_new_tree() -> void:
	if build_mode:
		_toggle_catalog()
		return
	if get_child_count() >= MAX_USER_TREES:
		if tree_editor_open:
			tree_status.text = "This town has reached the 500 custom-tree limit."
		return
	var keep_editor_open := tree_editor_open
	_cancel_tree_placement()
	_clear_tree_selection()
	placement_started_from_editor = keep_editor_open
	placement_tree = USER_TREE_SCENE.instantiate() as UserTree
	placement_tree.tree_id = "tree-%d" % next_tree_id
	next_tree_id += 1
	add_child(placement_tree)
	placement_tree.set_placement_preview(true)
	placement_active = true
	moving_existing_tree = false
	placement_has_surface = false
	tree_status.text = "Move the pointer over town, then click to place. Right-click or Escape cancels."
	_refresh_tree_controls()

func _start_moving_selected_tree() -> void:
	if not is_instance_valid(selected_user_tree):
		return
	_cancel_tree_placement()
	placement_tree = selected_user_tree
	placement_started_from_editor = tree_editor_open
	move_start_transform = placement_tree.global_transform
	placement_tree.set_selected(false)
	placement_tree.set_placement_preview(true)
	placement_active = true
	moving_existing_tree = true
	placement_has_surface = false
	tree_status.text = "Move the pointer, then click the new location. Right-click or Escape cancels."
	_refresh_tree_controls()

func _update_tree_placement_preview(screen_position: Vector2) -> void:
	if not placement_active or not is_instance_valid(placement_tree):
		return
	var origin := camera.project_ray_origin(screen_position)
	var item := _catalog_item(placement_tree.catalog_item_id)
	var surface_layer := 8 if item.get("category", "") == "Waterfront" else 1
	var query := PhysicsRayQueryParameters3D.create(origin, origin + camera.project_ray_normal(screen_position) * 2000.0, surface_layer)
	query.collide_with_areas = false
	var hit := get_world_3d().direct_space_state.intersect_ray(query)
	placement_has_surface = not hit.is_empty()
	if placement_has_surface:
		placement_tree.global_position = hit.position
		placement_tree.global_position.y += hit.position.y - placement_tree.selection_marker.global_position.y
		placement_tree.visible = true
	else:
		placement_tree.visible = false

func _commit_tree_placement() -> void:
	if not placement_active or not placement_has_surface or not is_instance_valid(placement_tree):
		return
	if build_mode and not moving_existing_tree:
		var item := _catalog_item(placement_tree.catalog_item_id)
		if item.is_empty() or not build_wallet.load_wallet() or not build_wallet.buy(placement_tree.catalog_item_id, int(item["price"])):
			tree_status.text = build_wallet.last_error if not build_wallet.last_error.is_empty() else "Could not complete this purchase."
			return
	placement_tree.visible = true
	placement_tree.set_placement_preview(false)
	var placed_tree := placement_tree
	placement_tree = null
	placement_active = false
	moving_existing_tree = false
	if placement_started_from_editor:
		_select_user_tree(placed_tree)
	else:
		placed_tree.set_selected(false)
	placement_started_from_editor = false
	tree_status.text = "Object placed. Double-click it to edit."
	_save_current_layout()

func _cancel_tree_placement() -> void:
	if not placement_active:
		return
	if is_instance_valid(placement_tree):
		if moving_existing_tree:
			placement_tree.global_transform = move_start_transform
			placement_tree.visible = true
			placement_tree.set_placement_preview(false)
			_select_user_tree(placement_tree)
		else:
			placement_tree.queue_free()
	placement_tree = null
	placement_active = false
	moving_existing_tree = false
	placement_started_from_editor = false
	placement_has_surface = false
	tree_status.text = "Placement cancelled."
	_refresh_tree_controls()

func _pick_user_tree(screen_position: Vector2) -> UserTree:
	var origin := camera.project_ray_origin(screen_position)
	var query := PhysicsRayQueryParameters3D.create(origin, origin + camera.project_ray_normal(screen_position) * 2000.0, 4)
	query.collide_with_bodies = false
	query.collide_with_areas = true
	var hit := get_world_3d().direct_space_state.intersect_ray(query)
	if hit.is_empty():
		return null
	var collider := hit.get("collider") as Area3D
	if collider == null or collider.get_parent() == null:
		return null
	return collider.get_parent() as UserTree

func _select_user_tree(tree: UserTree) -> void:
	if is_instance_valid(selected_user_tree) and selected_user_tree != tree:
		selected_user_tree.set_selected(false)
	selected_user_tree = tree
	if is_instance_valid(selected_user_tree):
		selected_user_tree.set_selected(true)
		var object_name := selected_user_tree.tree_id.get_slice(":", 1).replace("_", " ")
		if selected_user_tree.tree_id.begins_with("tree-"):
			object_name = "Custom tree"
		elif selected_user_tree.tree_id.begins_with("flower:"):
			object_name = "Flower patch"
		tree_selection_label.text = object_name.capitalize()
		tree_scale_slider.set_value_no_signal(selected_user_tree.size_multiplier)
		tree_scale_label.text = "%d%%" % roundi(selected_user_tree.size_multiplier * 100.0)
	_refresh_tree_controls()

func _close_tree_editor() -> void:
	if placement_active:
		_cancel_tree_placement()
	tree_editor_open = false
	_clear_tree_selection()
	if is_instance_valid(tree_panel):
		tree_panel.visible = false

func _clear_tree_selection() -> void:
	if is_instance_valid(selected_user_tree):
		selected_user_tree.set_selected(false)
	selected_user_tree = null
	tree_selection_label.text = "No object selected"
	tree_status.text = "Double-click an object to edit it, or browse objects."
	_refresh_tree_controls()

func _rotate_selected_tree(degrees: float) -> void:
	if not is_instance_valid(selected_user_tree) or placement_active:
		return
	var rotation := selected_user_tree.global_rotation
	rotation.y = deg_to_rad(fposmod(rad_to_deg(rotation.y) + degrees, 360.0))
	selected_user_tree.global_rotation = rotation
	tree_status.text = "Rotation: %d°" % roundi(rad_to_deg(rotation.y))
	_save_current_layout()

func _set_selected_tree_scale(value: float) -> void:
	tree_scale_label.text = "%d%%" % roundi(value * 100.0)
	if not is_instance_valid(selected_user_tree) or placement_active:
		return
	selected_user_tree.set_size_multiplier(value)
	_save_current_layout()

func _delete_selected_tree() -> void:
	if not is_instance_valid(selected_user_tree) or placement_active:
		return
	var removed_tree := selected_user_tree
	selected_user_tree = null
	if removed_tree.is_authored:
		deleted_authored_tree_ids[removed_tree.tree_id] = true
		removed_tree.visible = false
		removed_tree.pick_area.collision_layer = 0
		removed_tree.set_selected(false)
	else:
		removed_tree.queue_free()
	tree_selection_label.text = "No object selected"
	tree_status.text = "Object deleted."
	_refresh_tree_controls()
	_save_current_layout.call_deferred()
