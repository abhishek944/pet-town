extends RefCounted
## Bake shore distance once from the exact source mask; replaces 24 fragment probes.
static func bake(source: Image) -> Texture2D:
	return ImageTexture.create_from_image(distance_image(source))

# Image-only path is safe for the worker; rendering resources stay on the main thread.
static func distance_image(source: Image) -> Image:
	var width := source.get_width()
	var height := source.get_height()
	var distance := PackedFloat32Array()
	distance.resize(width * height)
	for z in height:
		for x in width:
			distance[z * width + x] = 8.5 if source.get_pixel(x, z).g >= 0.5 else 0.0
	for z in height:
		for x in width:
			var at := z * width + x
			if x > 0:
				distance[at] = minf(distance[at], distance[at - 1] + 1.0)
			if z > 0:
				distance[at] = minf(distance[at], distance[at - width] + 1.0)
				if x > 0:
					distance[at] = minf(distance[at], distance[at - width - 1] + 1.414214)
				if x + 1 < width:
					distance[at] = minf(distance[at], distance[at - width + 1] + 1.414214)
	for z in range(height - 1, -1, -1):
		for x in range(width - 1, -1, -1):
			var at := z * width + x
			if x + 1 < width:
				distance[at] = minf(distance[at], distance[at + 1] + 1.0)
			if z + 1 < height:
				distance[at] = minf(distance[at], distance[at + width] + 1.0)
				if x > 0:
					distance[at] = minf(distance[at], distance[at + width - 1] + 1.414214)
				if x + 1 < width:
					distance[at] = minf(distance[at], distance[at + width + 1] + 1.414214)
	var result := Image.create(width, height, false, Image.FORMAT_RF)
	for z in height:
		for x in width:
			result.set_pixel(x, z, Color(maxf(0, distance[z * width + x] - 0.5) / 8.0, 0, 0))
	return result
