extends SceneTree

const SOURCE := "res://scenes/island_render_sections.tscn"
const OUTPUT := "res://scenes/island_render_sections.scn"

func _initialize() -> void:
	var scene := load(SOURCE) as PackedScene
	if scene == null:
		push_error("Could not load the authored island render scene")
		quit(1)
		return
	var result := ResourceSaver.save(scene, OUTPUT)
	if result != OK:
		push_error("Could not compile the island render scene: %s" % result)
		quit(1)
		return
	print("Compiled island render scene")
	quit()
