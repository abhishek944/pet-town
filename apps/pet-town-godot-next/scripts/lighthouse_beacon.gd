class_name LighthouseBeacon
extends Node3D

const TURN_SPEED := 0.65

func _ready() -> void:
	var glass := OmniLight3D.new()
	glass.name = "BeaconGlow"
	glass.light_color = Color("ffe1a5")
	glass.light_energy = 1.6
	glass.omni_range = 8.0
	glass.shadow_enabled = false
	add_child(glass)
	for index in 2:
		var arm := Node3D.new()
		arm.name = "BeaconArm%d" % index
		arm.rotation.y = float(index) * PI
		add_child(arm)
		var beam := SpotLight3D.new()
		beam.name = "BeaconBeam%d" % index
		beam.position.z = -0.9
		beam.rotation.x = -deg_to_rad(32.0)
		beam.light_color = Color("ffe8b8")
		beam.light_energy = 5.0
		beam.spot_range = 30.0
		beam.spot_angle = 21.0
		beam.shadow_enabled = false
		arm.add_child(beam)

func _process(delta: float) -> void:
	rotation.y = wrapf(rotation.y + TURN_SPEED * delta, 0.0, TAU)
