extends RefCounted
## Keep full physical interaction near the player/view; use distance hysteresis.
const WAKE_DISTANCE := 72.0
const SLEEP_DISTANCE := 88.0
var foci: Array[Vector3] = []
func update(ocean: Node3D) -> void:
	foci.assign([ocean.actor.global_position])
	var camera := ocean.get_viewport().get_camera_3d()
	if camera: foci.append(camera.global_position)
	if ocean.aboard() and ocean.boat.body: foci.append(ocean.boat.body.global_position)
func near(point: Vector3, active: bool, margin := 0.0) -> bool:
	var radius := (SLEEP_DISTANCE if active else WAKE_DISTANCE)+margin
	for focus in foci:
		if Vector2(point.x-focus.x,point.z-focus.z).length_squared()<=radius*radius: return true
	return false
