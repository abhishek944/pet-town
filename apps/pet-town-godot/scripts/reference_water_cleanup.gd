extends Node3D
## The reference GLB contains hundreds of static open-water tiles. The main scene
## replaces them with one lightweight animated plane while keeping shoreline foam.

func _ready() -> void:
	var authored_details := get_node_or_null("BlenderAuthoredDetails")
	if authored_details == null:
		return
	for candidate in authored_details.find_children("*", "MeshInstance3D", true, false):
		var mesh_instance := candidate as MeshInstance3D
		var node_name := String(mesh_instance.name)
		if node_name.begins_with("Reference render Reference deep sea") or node_name.begins_with("Reference render Reference sea glint"):
			mesh_instance.visible = false
