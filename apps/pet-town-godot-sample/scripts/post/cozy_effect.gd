@tool
extends CompositorEffect
const GPU = preload("res://scripts/post/gpu_passes.gd")
var gpu: RefCounted
var passes := preload("res://scripts/post/scene_passes.gd").new()
var atmosphere := PackedFloat32Array()
var frame := PackedFloat32Array()
var focus := PackedFloat32Array([.5,26,0,0,.05,500,.5,.3])
var mutex := Mutex.new()
var failed := false

func _init() -> void:
	effect_callback_type = EFFECT_CALLBACK_TYPE_POST_TRANSPARENT
	access_resolved_color = true
	access_resolved_depth = true

func set_frame(values: PackedFloat32Array, focus_values: PackedFloat32Array, atmosphere_values: PackedFloat32Array) -> void:
	mutex.lock()
	frame = values
	focus = focus_values
	atmosphere = atmosphere_values
	mutex.unlock()

func _render_callback(callback_type: int, render_data: RenderData) -> void:
	if callback_type != effect_callback_type or failed:
		return
	mutex.lock()
	var values := frame.duplicate()
	var focus_values := focus.duplicate()
	var atmosphere_values := atmosphere.duplicate()
	mutex.unlock()
	if values.size()!=32 or atmosphere_values.size()!=48:
		return
	var buffers := render_data.get_render_scene_buffers() as RenderSceneBuffersRD
	if not buffers:
		return
	var size := buffers.get_internal_size()
	if size.x==0 or size.y==0:
		return
	if not gpu:
		var device := RenderingServer.get_rendering_device()
		if not device:
			return
		gpu = GPU.new()
		if not gpu.setup(device):
			failed = true
			return
	passes.gpu = gpu
	gpu.resize(size,Vector2(atmosphere_values[36],atmosphere_values[39]))
	gpu.rd.buffer_update(gpu.atmosphere_buffer,0,192,atmosphere_values.to_byte_array())
	gpu.rd.buffer_update(gpu.focus_buffer,0,32,focus_values.to_byte_array())
	values[28] = size.x
	values[29] = size.y
	for view in buffers.get_view_count():
		var color := buffers.get_color_layer(view)
		var depth := buffers.get_depth_layer(view)
		var prepared: Dictionary = passes.prepare(color,depth,size,view,atmosphere_values)
		var half_size := Vector2i(maxi(1,ceili(size.x/2.0)),maxi(1,ceili(size.y/2.0)))
		var quarter := Vector2i(maxi(1,ceili(size.x/4.0)),maxi(1,ceili(size.y/4.0)))
		var half1: RID = gpu.target("half1_%s"%view,half_size)
		var half2: RID = gpu.target("half2_%s"%view,half_size)
		var q1: RID = gpu.target("q1_%s"%view,quarter)
		var q2: RID = gpu.target("q2_%s"%view,quarter)
		var constants := focus_values.duplicate()
		constants.append_array(PackedFloat32Array([half_size.x,half_size.y,size.x,size.y]))
		gpu.dispatch("downsample",[gpu.image_uniform(0,half1),gpu.texture_uniform(1,prepared.source),gpu.texture_uniform(2,depth,true),gpu.texture_uniform(3,prepared.ao)],constants,half_size)
		_blur(half1,half2,half_size,half_size,.5)
		_blur(half2,q1,half_size,quarter,1)
		_blur(q1,q2,quarter,quarter,1)
		_blur(q2,q1,quarter,quarter,2)
		var composite: RID = passes.composite(prepared,depth,half2,q1,size,view)
		var mips: Array[RID] = passes.bloom(composite,depth,size,view,atmosphere_values)
		var uniforms: Array[RDUniform] = [gpu.image_uniform(0,color),gpu.texture_uniform(1,composite)]
		for i in 5:
			uniforms.append(gpu.texture_uniform(i+2,mips[i]))
		uniforms.append(gpu.atmosphere_uniform(7))
		gpu.dispatch("grade",uniforms,values,size)

func _blur(source: RID, destination: RID, source_size: Vector2i, destination_size: Vector2i, offset: float) -> void:
	var constants := PackedFloat32Array([destination_size.x,destination_size.y,source_size.x,source_size.y,offset,0,0,0])
	gpu.dispatch("kawase",[gpu.image_uniform(0,destination),gpu.texture_uniform(1,source)],constants,destination_size)

func _notification(what: int) -> void:
	if what == NOTIFICATION_PREDELETE and gpu:
		gpu.release()
