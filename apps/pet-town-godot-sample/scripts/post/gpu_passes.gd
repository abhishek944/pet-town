extends RefCounted
## Rendering-thread-only resources, shared by the scene compositor passes.
const SHADERS := {
	"grade": preload("res://shaders/post/grade.glsl"),
	"downsample": preload("res://shaders/post/downsample.glsl"),
	"kawase": preload("res://shaders/post/kawase.glsl"),
	"ao": preload("res://shaders/post/ao.glsl"),
	"ao_blur": preload("res://shaders/post/ao_blur.glsl"),
	"shafts": preload("res://shaders/post/shafts.glsl"),
	"bloom": preload("res://shaders/post/bloom.glsl"),
	"composite": preload("res://shaders/post/composite.glsl"),
	"scene_fog": preload("res://shaders/post/scene_fog.glsl")
}
var rd: RenderingDevice
var shaders: Dictionary = {}
var pipelines: Dictionary = {}
var textures: Dictionary = {}
var dimensions := Vector2i.ZERO
var quality_signature := Vector2.ZERO
var sampler := RID()
var focus_buffer := RID()
var atmosphere_buffer := RID()
var nearest_sampler := RID()

func setup(device: RenderingDevice) -> bool:
	rd = device
	var state := RDSamplerState.new()
	state.min_filter = RenderingDevice.SAMPLER_FILTER_LINEAR
	state.mag_filter = RenderingDevice.SAMPLER_FILTER_LINEAR
	state.repeat_u = RenderingDevice.SAMPLER_REPEAT_MODE_CLAMP_TO_EDGE
	state.repeat_v = RenderingDevice.SAMPLER_REPEAT_MODE_CLAMP_TO_EDGE
	sampler = rd.sampler_create(state)
	state.min_filter = RenderingDevice.SAMPLER_FILTER_NEAREST
	state.mag_filter = RenderingDevice.SAMPLER_FILTER_NEAREST
	nearest_sampler = rd.sampler_create(state)
	atmosphere_buffer = rd.storage_buffer_create(192,PackedByteArray())
	focus_buffer = rd.storage_buffer_create(32,PackedByteArray())
	for key in SHADERS:
		var spirv: RDShaderSPIRV = SHADERS[key].get_spirv()
		if not spirv.compile_error_compute.is_empty():
			push_error("Cozy post %s: %s" % [key,spirv.compile_error_compute])
			return false
		shaders[key] = rd.shader_create_from_spirv(spirv)
		pipelines[key] = rd.compute_pipeline_create(shaders[key])
	return true

func resize(size: Vector2i, quality: Vector2) -> void:
	if dimensions == size and quality_signature == quality:
		return
	for texture: RID in textures.values():
		rd.free_rid(texture)
	textures.clear()
	dimensions = size
	quality_signature = quality

func target(key: String, size: Vector2i) -> RID:
	if not textures.has(key):
		var format := RDTextureFormat.new()
		format.width = size.x
		format.height = size.y
		format.format = RenderingDevice.DATA_FORMAT_R16G16B16A16_SFLOAT
		format.usage_bits = RenderingDevice.TEXTURE_USAGE_SAMPLING_BIT|RenderingDevice.TEXTURE_USAGE_STORAGE_BIT
		textures[key] = rd.texture_create(format,RDTextureView.new())
	return textures[key]

func image_uniform(binding: int, texture: RID) -> RDUniform:
	var uniform := RDUniform.new()
	uniform.uniform_type = RenderingDevice.UNIFORM_TYPE_IMAGE
	uniform.binding = binding
	uniform.add_id(texture)
	return uniform

func texture_uniform(binding: int, texture: RID, nearest := false) -> RDUniform:
	var uniform := RDUniform.new()
	uniform.uniform_type = RenderingDevice.UNIFORM_TYPE_SAMPLER_WITH_TEXTURE
	uniform.binding = binding
	uniform.add_id(nearest_sampler if nearest else sampler)
	uniform.add_id(texture)
	return uniform

func focus_uniform(binding: int) -> RDUniform:
	var uniform := RDUniform.new()
	uniform.uniform_type = RenderingDevice.UNIFORM_TYPE_STORAGE_BUFFER
	uniform.binding = binding
	uniform.add_id(focus_buffer)
	return uniform

func atmosphere_uniform(binding: int) -> RDUniform:
	var uniform := RDUniform.new()
	uniform.uniform_type = RenderingDevice.UNIFORM_TYPE_STORAGE_BUFFER
	uniform.binding = binding
	uniform.add_id(atmosphere_buffer)
	return uniform

func dispatch(key: String, uniforms: Array, constants: PackedFloat32Array, size: Vector2i) -> void:
	# Calls through RefCounted produce untyped array literals at runtime.
	var typed_uniforms: Array[RDUniform] = []
	typed_uniforms.assign(uniforms)
	var set := UniformSetCacheRD.get_cache(shaders[key],0,typed_uniforms)
	var list := rd.compute_list_begin()
	rd.compute_list_bind_compute_pipeline(list,pipelines[key])
	rd.compute_list_bind_uniform_set(list,set,0)
	var bytes := constants.to_byte_array()
	rd.compute_list_set_push_constant(list,bytes,bytes.size())
	rd.compute_list_dispatch(list,ceili(size.x/8.0),ceili(size.y/8.0),1)
	rd.compute_list_end()

func release() -> void:
	if not rd:
		return
	for texture: RID in textures.values():
		rd.free_rid(texture)
	for shader: RID in shaders.values():
		rd.free_rid(shader)
	if sampler.is_valid():
		rd.free_rid(sampler)
	if focus_buffer.is_valid():
		rd.free_rid(focus_buffer)
	if atmosphere_buffer.is_valid():
		rd.free_rid(atmosphere_buffer)
	if nearest_sampler.is_valid():
		rd.free_rid(nearest_sampler)
