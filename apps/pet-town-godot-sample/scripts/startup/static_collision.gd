extends Node
## Temporarily register static collision across loading slices; scripts stay gated.
var host: Node
var tree: SceneTree
var bodies: Array=[]
func _ready() -> void:
	host=get_parent()
	tree=get_tree()
	tree.node_added.connect(_capture)
func _capture(node: Node) -> void:
	if node is StaticBody3D and host.is_ancestor_of(node) and node.disable_mode==CollisionObject3D.DISABLE_MODE_REMOVE:
		bodies.append(node)
		node.disable_mode=CollisionObject3D.DISABLE_MODE_KEEP_ACTIVE
func finish() -> void:
	if is_instance_valid(tree) and tree.node_added.is_connected(_capture): tree.node_added.disconnect(_capture)
	for body in bodies:
		if is_instance_valid(body) and body.disable_mode==CollisionObject3D.DISABLE_MODE_KEEP_ACTIVE: body.disable_mode=CollisionObject3D.DISABLE_MODE_REMOVE
	bodies.clear()
func _exit_tree() -> void:
	finish()
