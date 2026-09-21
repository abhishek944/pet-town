extends Marker3D
## Place this marker beside the object in the Godot editor, facing the object.
@export var display_name := "Town stop"
@export_enum("gather", "deliver", "eat", "rest", "visit") var activity := "visit"
@export var duration := 4.0
@export var animation := "Interact"
@export var cooldown := 0.0
@export var prop_path: NodePath
var visitor: Node3D
var cooldown_left := 0.0
var completed_visits := 0
var stored_apples := 0

func _ready() -> void:
	add_to_group("interaction_spots")

func is_available() -> bool:
	return not is_instance_valid(visitor) and cooldown_left <= 0.0

func claim(actor: Node3D) -> bool:
	if not is_available(): return false
	visitor = actor
	return true

func release(actor: Node3D) -> void:
	if visitor == actor: visitor = null

func complete(actor: Node3D) -> void:
	if visitor != actor: return
	completed_visits += 1
	if activity == "deliver": stored_apples += actor.apples
	cooldown_left = cooldown
	var prop := get_node_or_null(prop_path) as Node3D
	if activity == "gather" and prop: prop.visible = false
	release(actor)

func _process(delta: float) -> void:
	if cooldown_left <= 0.0: return
	cooldown_left -= delta
	if cooldown_left <= 0.0 and activity == "gather":
		var prop := get_node_or_null(prop_path) as Node3D
		if prop: prop.visible = true
