extends RefCounted
# Owns an immutable Image snapshot; creates no rendering or scene resources.
var source: Image
var result: Image

func run() -> void:
	result = preload("shore_field.gd").distance_image(source)
