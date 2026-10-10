extends Node3D
signal thunder_event(distance: float, strength: float)
var bolt: Node3D
var wait := 8.0
var flash := 0.0
func _ready() -> void:
	bolt = preload("res://scripts/atmosphere/lightning.gd").new()
	add_child(bolt)
func tick(delta: float, effect: Dictionary, camera: Camera3D) -> void:
	flash = move_toward(flash, 0, delta * 3.5)
	var show_visuals: bool = effect.lightning != "off" and not effect.reduced_motion
	if not show_visuals:
		flash = 0
		bolt.clear()
	if effect.weather != "thunderstorm":
		flash = 0
		bolt.clear()
		wait = maxf(wait, 5)
		return
	wait -= delta
	if wait > 0: return
	wait = randf_range(9,18)
	var distance := randf_range(70,110)
	var forward := -camera.global_basis.z
	forward.y = 0
	forward = forward.normalized().rotated(Vector3.UP, randf_range(-0.65,0.65))
	var position := camera.global_position + forward * distance + Vector3.UP * 38
	var strength: float = {"gentle":0.35,"balanced":0.65,"dramatic":0.9}[effect.intensity]
	thunder_event.emit(distance,randf_range(0.5,0.7))
	if show_visuals:
		bolt.show_event(position,strength,effect.lightning)
		flash = strength * (0.13 if effect.lightning == "soft" else 0.4)
