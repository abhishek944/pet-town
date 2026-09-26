class_name WorkshopEditor
extends Node3D
const UNDO_SCRIPT := preload("res://scripts/town_undo.gd")
const CHANGES_SCRIPT := preload("res://scripts/town_editor_changes.gd")

signal state_changed

const MAX_OBJECTS := 1200

var catalog: WorkshopCatalog
var wallet: BuildWallet
var store := WorkshopStore.new()
var camera: Camera3D
var marker: WorkshopFootprintMarker
var selected: WorkshopObject
var preview: WorkshopObject
var moving := false
var move_start := Transform3D.IDENTITY
var hover_valid := false
var next_id := 1
var status := "Choose an object to place on your island."
var mode := "build"
var history := UNDO_SCRIPT.new()
var move_snapshot: Array = []
func configure(source: WorkshopCatalog, balance: BuildWallet, view: Camera3D, selection_marker: WorkshopFootprintMarker) -> void:
	catalog = source
	wallet = balance
	camera = view
	marker = selection_marker
	next_id = store.populate(self, catalog, MAX_OBJECTS)
	state_changed.emit()
func reload_mode_layout(value: String) -> bool:
	return TownLayoutSwitch.apply_mode(self, value)
func create_object(asset_id: String, object_id: String) -> WorkshopObject:
	var item := catalog.get_item(asset_id)
	var model := catalog.instantiate_model(asset_id)
	if item.is_empty() or model == null:
		return null
	var instance := WorkshopObject.new()
	instance.configure(object_id, item, model)
	add_child(instance)
	return instance
func begin_place(asset_id: String) -> bool:
	var item := catalog.get_item(asset_id)
	if get_child_count() >= MAX_OBJECTS:
		status = "This island is full. Remove an object before placing another."
		state_changed.emit()
		return false
	if item.is_empty() or (mode == "build" and (not wallet.load_wallet() or wallet.balance() < int(item["price"]))):
		status = "Earn more credits to place this object."
		state_changed.emit()
		return false
	cancel_preview()
	preview = create_object(asset_id, "pending")
	if preview == null:
		return false
	preview.set_preview(true)
	preview.visible = false
	selected = null
	status = "Move the pointer over land, then click to place."
	state_changed.emit()
	return true
func begin_move() -> bool:
	if not is_instance_valid(selected):
		return false
	move_snapshot = history.capture(self)
	preview = selected
	move_start = preview.transform
	preview.set_preview(true)
	moving = true
	hover_valid = false
	status = "Move the pointer over land, then click to set this object down."
	state_changed.emit()
	return true
func hover(screen_position: Vector2) -> void:
	if not is_instance_valid(preview):
		return
	var hit := land_hit(screen_position)
	hover_valid = not hit.is_empty()
	if hover_valid:
		preview.global_position = hit.position
		preview.visible = true
		marker.show_for(preview)
	else:
		preview.visible = false
		marker.visible = false
func click(screen_position: Vector2) -> void:
	if is_instance_valid(preview):
		hover(screen_position)
		if hover_valid:
			commit_preview()
		return
	select_at(screen_position)
func commit_preview() -> bool:
	if not is_instance_valid(preview) or not hover_valid:
		return false
	var placing := not moving
	var before := history.capture(self) if placing else move_snapshot
	var purchased_id := ""
	var purchased_price := 0
	if not moving:
		var item := catalog.get_item(preview.asset_id)
		purchased_id = preview.asset_id
		purchased_price = int(item["price"])
		if mode == "build" and (not wallet.load_wallet() or not wallet.buy(purchased_id, purchased_price)):
			status = wallet.last_error
			state_changed.emit()
			return false
		preview.object_id = "object-%06d" % next_id
		preview.name = "Object_" + preview.object_id
		next_id += 1
	var committed := preview
	preview.set_preview(false)
	selected = preview
	preview = null
	moving = false
	if not save():
		if placing:
			var refunded := true if mode == "chill" else wallet.undo_last_purchase(purchased_id, purchased_price)
			selected = null
			committed.queue_free()
			next_id -= 1
			status = "Could not save the island." if mode == "chill" else ("Could not save the island. Purchase refunded." if refunded else "Could not refund automatically. Check the wallet file.")
		else:
			committed.transform = move_start
			status = "Could not save the island. The move was cancelled."
		marker.show_for(selected)
		state_changed.emit()
		return false
	marker.show_for(selected)
	history.push(mode, before, purchased_id, purchased_price if placing and mode == "build" else 0)
	status = "%s placed. Changes save automatically." % selected.definition["name"]
	state_changed.emit()
	return true
func cancel_preview() -> void:
	if not is_instance_valid(preview):
		return
	if moving:
		preview.transform = move_start
		preview.visible = true
		preview.set_preview(false)
		selected = preview
	else:
		preview.queue_free()
	preview = null
	moving = false
	hover_valid = false
	marker.show_for(selected)
	status = "Placement cancelled."
	state_changed.emit()
func select_at(screen_position: Vector2) -> void:
	var origin := camera.project_ray_origin(screen_position)
	var end := origin + camera.project_ray_normal(screen_position) * 500.0
	var query := PhysicsRayQueryParameters3D.create(origin, end, 4)
	query.collide_with_bodies = false
	query.collide_with_areas = true
	var hit := get_world_3d().direct_space_state.intersect_ray(query)
	selected = null
	if not hit.is_empty():
		var area := hit.collider as Area3D
		selected = area.get_parent() as WorkshopObject if area != null else null
	marker.show_for(selected)
	status = String(selected.definition["name"]) + " selected." if is_instance_valid(selected) else "Choose an object or click one on the island."
	state_changed.emit()
func land_hit(screen_position: Vector2) -> Dictionary:
	var surface := String(preview.definition.get("surface", "land")) if is_instance_valid(preview) else "land"
	return WorkshopSurface.hit(camera, screen_position, surface)
func rotate_selected(amount: float) -> void:
	CHANGES_SCRIPT.rotate(self, amount)
func scale_selected(amount: float) -> void:
	CHANGES_SCRIPT.scale(self, amount)
func delete_selected() -> void:
	CHANGES_SCRIPT.delete(self)
func undo_last() -> bool:
	return history.undo(self)
func can_undo() -> bool:
	return history.can_undo(mode)
func save() -> bool:
	var records := []
	for child in get_children():
		var item := child as WorkshopObject
		if item == null or item.is_queued_for_deletion() or (item == preview and not moving):
			continue
		records.append(item.record())
	return store.save_records(records)
