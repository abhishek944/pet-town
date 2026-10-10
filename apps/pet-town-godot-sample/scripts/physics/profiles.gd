extends RefCounted
## Core dimensions checked against native GLB bounds; appendages stay animated.
const PETS := {
	"explorer": [0.28, 1.42, 28.0], "mayor": [0.34, 1.46, 30.0],
	"maple": [0.32, 1.40, 14.0], "clover": [0.30, 1.45, 9.0],
	"juniper": [0.30, 1.40, 12.0], "scout": [0.33, 1.38, 18.0],
	"puddle": [0.29, 1.35, 8.0], "moss": [0.36, 1.46, 16.0],
	"mossback": [0.34, 1.25, 24.0], "fern": [0.30, 1.43, 20.0],
	"knight": [0.30, 1.43, 24.0], "mage": [0.29, 1.42, 16.0],
	"barbarian": [0.34, 1.46, 28.0], "rogue": [0.29, 1.40, 16.0],
	"ranger": [0.29, 1.42, 18.0]}
const WILDLIFE_MASS := {"nimbaa": 18.0, "fiddlekit": 5.0, "pondle": 3.0,
	"lumble": 22.0, "pebbug": 4.0, "jellop": 2.0, "tuftlet": 6.0,
	"skim": 1.0, "drift": 2.0, "hush": 2.5}

static func pet(id: String) -> Dictionary:
	var data: Array = PETS.get(id, PETS.explorer)
	return capsule(float(data[0]), float(data[1]), float(data[2]))

static func wildlife(definition: Dictionary, size: float) -> Dictionary:
	var r := float(definition.radius) * size * 0.85
	var height := maxf(r * 2, float(definition.height) * size)
	return capsule(r, height, float(WILDLIFE_MASS.get(definition.id, 8.0)) * pow(size, 3))

static func capsule(radius: float, height: float, weight: float) -> Dictionary:
	var shape := CapsuleShape3D.new()
	shape.radius = radius
	shape.height = maxf(height, radius * 2)
	return {"shape": shape, "offset": Vector3.UP * shape.height * 0.5,
		"radius": radius, "height": shape.height, "mass": weight}

static func marine(kind: String, size := 1.0, variant := 0) -> Dictionary:
	var dimensions := Vector3(1.05, 0.84, 2.9)
	var weight := 65.0
	var offset := Vector3(0, 0, -0.2)
	if kind == "turtle":
		dimensions = Vector3(1.75, 0.64, 1.95)
		weight = 38.0
		offset = Vector3(0, 0, -0.1)
	elif kind == "fish":
		dimensions = [Vector3(0.43, 0.8, 1.16), Vector3(0.46, 1.1, 1.08), Vector3(0.30, 0.4, 1.5)][variant % 3]
		weight = [1.2, 1.8, 0.8][variant % 3]
		offset = Vector3(0, 0.04, -0.12)
	dimensions *= size
	var points := PackedVector3Array()
	for ring in range(9):
		var latitude := PI * ring / 8.0
		for segment in range(12):
			var angle := TAU * segment / 12.0
			points.append(Vector3(sin(latitude) * cos(angle), cos(latitude), sin(latitude) * sin(angle)) * dimensions * 0.5)
	var shape := ConvexPolygonShape3D.new()
	shape.points = points
	return {"shape": shape, "offset": offset * size, "extents": dimensions * 0.5, "radius": maxf(dimensions.x, dimensions.z) * 0.5,
		"height": dimensions.y, "mass": weight * pow(size, 3)}
