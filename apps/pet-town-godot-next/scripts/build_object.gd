class_name WorkshopObject
extends Node3D

const GLOW := preload("res://scripts/town_glow.gd")

var object_id := ""
var asset_id := ""
var definition: Dictionary = {}
var model: Node3D
var pick_area: Area3D
var solid_body: StaticBody3D
var path_body: StaticBody3D

func configure(id: String, item: Dictionary, visual: Node3D) -> void:
	object_id = id
	asset_id = String(item["id"])
	definition = item
	name = "Object_" + id
	model = visual
	model.name = "Model"
	add_child(model)
	GLOW.decorate(model, item)
	if String(item.get("surface", "land")) == "land":
		var is_path := String(item.get("category", "")) == "Paths"
		var body := StaticBody3D.new()
		body.name = "PathBody" if is_path else "SolidBody"
		body.collision_layer = 1
		body.collision_mask = 0
		add_child(body)
		if is_path:
			path_body = body
		else:
			solid_body = body
		var solid_shape := CollisionShape3D.new()
		var footprint := BoxShape3D.new()
		footprint.size = Vector3(float(item["width"]), float(item["height"]), float(item["depth"]))
		solid_shape.shape = footprint
		solid_shape.position.y = float(item["height"]) * 0.5
		body.add_child(solid_shape)
	pick_area = Area3D.new()
	pick_area.name = "PickArea"
	pick_area.collision_layer = 4
	pick_area.collision_mask = 0
	pick_area.monitorable = true
	pick_area.monitoring = false
	add_child(pick_area)
	var collider := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(float(item["width"]), float(item["height"]), float(item["depth"]))
	collider.shape = box
	collider.position.y = float(item["height"]) * 0.5
	pick_area.add_child(collider)

func set_preview(active: bool) -> void:
	pick_area.collision_layer = 0 if active else 4
	if is_instance_valid(solid_body):
		solid_body.collision_layer = 0 if active else 1
	if is_instance_valid(path_body):
		path_body.collision_layer = 0 if active else 1
	for candidate in model.find_children("*", "MeshInstance3D", true, false):
		(candidate as MeshInstance3D).transparency = 0.3 if active else 0.0

func record() -> Dictionary:
	return {
		"id": object_id,
		"asset_id": asset_id,
		"position": [position.x, position.y, position.z],
		"rotation_y": rotation.y,
		"scale": scale.x,
	}
