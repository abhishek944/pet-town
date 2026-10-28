extends RefCounted
## Source pass order; every target is cached per view and viewport size.
var gpu: RefCounted

func prepare(color: RID, depth: RID, size: Vector2i, view: int, atmosphere: PackedFloat32Array) -> Dictionary:
	var source: RID = gpu.target("fog_%s"%view,size)
	gpu.dispatch("scene_fog",[gpu.image_uniform(0,source),gpu.texture_uniform(1,color),gpu.texture_uniform(2,depth,true),gpu.atmosphere_uniform(3)],PackedFloat32Array([size.x,size.y,0,0]),size)
	return {"source":source,"shafts":_shafts(source,depth,size,view,atmosphere)}

func _shafts(source: RID, depth: RID, size: Vector2i, view: int, atmosphere: PackedFloat32Array) -> RID:
	var small := Vector2i(maxi(1,ceili(size.x/4.0)),maxi(1,ceili(size.y/4.0)))
	var first: RID = gpu.target("shaft_a_%s"%view,small)
	if atmosphere[11]<=.002:
		return first
	var second: RID = gpu.target("shaft_b_%s"%view,small)
	var values := PackedFloat32Array([small.x,small.y,size.x,size.y,atmosphere[16],atmosphere[17],0,0,0,0,0,0])
	gpu.dispatch("shafts",[gpu.image_uniform(0,first),gpu.texture_uniform(1,source),gpu.texture_uniform(2,depth,true)],values,small)
	values[8] = 1
	values[9] = .55
	gpu.dispatch("shafts",[gpu.image_uniform(0,second),gpu.texture_uniform(1,first),gpu.texture_uniform(2,depth,true)],values,small)
	values[9] = .25
	gpu.dispatch("shafts",[gpu.image_uniform(0,first),gpu.texture_uniform(1,second),gpu.texture_uniform(2,depth,true)],values,small)
	return first

func composite(prepared: Dictionary, depth: RID, half_blur: RID, heavy_blur: RID, size: Vector2i, view: int) -> RID:
	var target: RID = gpu.target("composite_%s"%view,size)
	gpu.dispatch("composite",[gpu.image_uniform(0,target),gpu.texture_uniform(1,prepared.source),gpu.texture_uniform(2,depth,true),gpu.texture_uniform(4,half_blur),gpu.texture_uniform(5,heavy_blur),gpu.texture_uniform(6,prepared.shafts),gpu.focus_uniform(7),gpu.atmosphere_uniform(8)],PackedFloat32Array([size.x,size.y,0,0]),size)
	return target

func bloom(source: RID, depth: RID, size: Vector2i, view: int, atmosphere: PackedFloat32Array) -> Array[RID]:
	var bloom_size := Vector2i(maxi(1,roundi(size.x*atmosphere[39]/2)),maxi(1,roundi(size.y*atmosphere[39]/2)))
	var bright: RID = gpu.target("bright_%s"%view,bloom_size)
	var values := PackedFloat32Array([bloom_size.x,bloom_size.y,size.x,size.y,0,atmosphere[15],0,0,0,0,0,0])
	gpu.dispatch("bloom",[gpu.image_uniform(0,bright),gpu.texture_uniform(1,source),gpu.texture_uniform(2,depth,true)],values,bloom_size)
	var mips: Array[RID] = []
	var current := bright
	for level in 5:
		var horizontal: RID = gpu.target("bloom_h%s_%s"%[level,view],bloom_size)
		var vertical: RID = gpu.target("bloom_v%s_%s"%[level,view],bloom_size)
		# Source UnrealBloom sets invSize to this mip's dimensions on both axes.
		values = PackedFloat32Array([bloom_size.x,bloom_size.y,bloom_size.x,bloom_size.y,1,0,6+level*4,0,1,0,0,0])
		gpu.dispatch("bloom",[gpu.image_uniform(0,horizontal),gpu.texture_uniform(1,current),gpu.texture_uniform(2,depth,true)],values,bloom_size)
		values[8] = 0
		values[9] = 1
		gpu.dispatch("bloom",[gpu.image_uniform(0,vertical),gpu.texture_uniform(1,horizontal),gpu.texture_uniform(2,depth,true)],values,bloom_size)
		mips.append(vertical)
		current = vertical
		bloom_size = Vector2i(maxi(1,roundi(bloom_size.x/2.0)),maxi(1,roundi(bloom_size.y/2.0)))
	return mips
