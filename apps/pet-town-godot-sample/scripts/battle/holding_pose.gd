extends Node
## Apply the reviewed supporting-arm pose after Maple's locomotion animation.
var arm: Node3D

func setup(model: Node3D) -> void:
	process_priority = 50
	find_arm(model)

func find_arm(node: Node) -> void:
	if node is Node3D and str(node.name).begins_with("pet-arm-0"): arm = node
	for child in node.get_children(): find_arm(child)

func _process(_delta: float) -> void:
	if is_instance_valid(arm): arm.rotation.x = -1.5
