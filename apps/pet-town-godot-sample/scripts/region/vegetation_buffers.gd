extends RefCounted
const Buffers = preload("buffers.gd")
const Cache = preload("native_cache.gd")
static func prepare(field: Dictionary, ranks: Dictionary, budget: RefCounted) -> Dictionary:
	var ranked: bool = field.get("density") is Array
	var id := Cache.key(field.instanceFile,"vegetation",Cache.fingerprint("region-vegetation-ranks.json")+str(ranked)+str(field.name)+str(field.variant))
	var cached := Cache.read_data(id)
	if cached.has("groups"): return cached
	var source := Buffers.read_json(field.instanceFile)
	var matrices := Buffers.values(source.matrices)
	var colors := Buffers.values(source.colors)
	var groups := {}
	for i in int(source.count):
		var key := Vector2i(floori(matrices[i*16+12]/16.0),floori(matrices[i*16+14]/16.0))
		if not groups.has(key): groups[key]=[]
		groups[key].append(i)
		if budget and i%256==0: await budget.checkpoint()
	var result := {"groups":{},"missing":0}
	for key in groups:
		var items: Array = groups[key]
		var buffer := PackedFloat32Array()
		buffer.resize(items.size()*16)
		var anchors := []
		var origin := Vector3(key.x*16+8,0,key.y*16+8)
		for j in items.size():
			var i: int = items[j]
			var pose := Buffers.transform(Array(matrices.slice(i*16,i*16+16)))
			var point := pose.origin
			var rank: float = ranks.get(point,0.0) if ranked else 0.0
			if ranked and not ranks.has(point): result.missing+=1
			pose.origin-=origin
			var values := PackedFloat32Array([pose.basis.x.x,pose.basis.y.x,pose.basis.z.x,pose.origin.x,
				pose.basis.x.y,pose.basis.y.y,pose.basis.z.y,pose.origin.y,
				pose.basis.x.z,pose.basis.y.z,pose.basis.z.z,pose.origin.z,colors[i*3],colors[i*3+1],colors[i*3+2],rank])
			for k in 16: buffer[j*16+k]=values[k]
			anchors.append([Vector2i(floori(point.x),floori(point.z)),j,pose,point.y])
			if budget and j%256==0: await budget.checkpoint()
		result.groups[key]={"count":items.size(),"buffer":buffer,"anchors":anchors}
	Cache.write_data(id,result)
	return result
