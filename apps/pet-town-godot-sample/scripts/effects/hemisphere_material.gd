extends RefCounted
## Preserve every feature present in the imported original GLBs, adding source hemisphere.
static var shaders: Dictionary = {}
const CODE = """
shader_type spatial;
render_mode diffuse_burley,specular_schlick_ggx,CULL_MODE;
#include "res://shaders/effects/hemisphere.gdshaderinc"
uniform vec4 albedo : source_color = vec4(1.0);
uniform sampler2D albedo_map : source_color,filter_linear_mipmap,repeat_enable;
uniform bool has_albedo_map=false;
uniform bool vertex_albedo=false;
uniform bool vertex_srgb=false;
uniform vec2 uv_scale=vec2(1.0);
uniform vec2 uv_offset=vec2(0.0);
uniform float surface_roughness=1.0;
uniform float surface_metallic=0.0;
uniform float surface_specular=0.5;
uniform vec4 emission_color : source_color = vec4(0.0);
uniform float emission_energy=1.0;
uniform sampler2D emission_map : source_color,filter_linear_mipmap,repeat_enable;
uniform bool has_emission_map=false;
uniform bool emission_multiply=false;
uniform float alpha_cutoff=0.5;
void fragment() {
	vec2 uv=UV*uv_scale+uv_offset;
	vec4 base=albedo;
	if(has_albedo_map) base*=texture(albedo_map,uv);
	vec4 vertex=COLOR;
	if(vertex_srgb) vertex.rgb=mix(vertex.rgb/12.92,pow((vertex.rgb+0.055)/1.055,vec3(2.4)),step(vec3(0.04045),vertex.rgb));
	if(vertex_albedo) base*=vertex;
	ALBEDO=base.rgb;
	ROUGHNESS=surface_roughness;
	METALLIC=surface_metallic;
	SPECULAR=surface_specular;
	vec3 glow=emission_color.rgb;
	if(has_emission_map) {
		vec3 sampled=texture(emission_map,uv).rgb;
		glow=emission_multiply?glow*sampled:glow+sampled;
	}
	EMISSION=glow*emission_energy;
	ALPHA_CODE
	IRRADIANCE=vec4(source_hemisphere(normalize(mat3(INV_VIEW_MATRIX)*NORMAL)),1.0);
}
"""

static func create(source: StandardMaterial3D) -> ShaderMaterial:
	var key := str(source.cull_mode) + ":" + str(source.transparency)
	if not shaders.has(key):
		var shader := Shader.new()
		var cull: String = ["cull_back", "cull_front", "cull_disabled"][source.cull_mode]
		var alpha := ""
		if source.transparency == BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR:
			alpha = "if(base.a<alpha_cutoff) discard;"
		elif source.transparency != BaseMaterial3D.TRANSPARENCY_DISABLED:
			alpha = "ALPHA=base.a;"
		shader.code = CODE.replace("CULL_MODE", cull).replace("ALPHA_CODE", alpha)
		shaders[key] = shader
	var result := ShaderMaterial.new()
	result.shader = shaders[key]
	result.render_priority = source.render_priority
	result.next_pass = source.next_pass
	result.set_meta("source_standard_material", source)
	_refresh(source, result)
	return result

static func _refresh(source: StandardMaterial3D, result: ShaderMaterial) -> void:
	result.set_shader_parameter("albedo", source.albedo_color)
	result.set_shader_parameter("has_albedo_map", source.albedo_texture != null)
	result.set_shader_parameter("albedo_map", source.albedo_texture)
	result.set_shader_parameter("vertex_albedo", source.vertex_color_use_as_albedo)
	result.set_shader_parameter("vertex_srgb", source.vertex_color_is_srgb)
	result.set_shader_parameter("uv_scale", Vector2(source.uv1_scale.x, source.uv1_scale.y))
	result.set_shader_parameter("uv_offset", Vector2(source.uv1_offset.x, source.uv1_offset.y))
	result.set_shader_parameter("surface_roughness", source.roughness)
	result.set_shader_parameter("surface_metallic", source.metallic)
	result.set_shader_parameter("surface_specular", source.metallic_specular)
	result.set_shader_parameter("emission_color", source.emission if source.emission_enabled else Color.BLACK)
	result.set_shader_parameter("emission_energy", source.emission_energy_multiplier)
	result.set_shader_parameter("emission_map", source.emission_texture)
	result.set_shader_parameter("has_emission_map", source.emission_enabled and source.emission_texture != null)
	result.set_shader_parameter("emission_multiply", source.emission_operator == BaseMaterial3D.EMISSION_OP_MULTIPLY)
	result.set_shader_parameter("alpha_cutoff", source.alpha_scissor_threshold)
