extends RefCounted

func create() -> ShaderMaterial:
	var shader:=Shader.new()
	shader.code="""
shader_type spatial;
render_mode cull_back, diffuse_lambert, specular_schlick_ggx;
uniform sampler2D top_map: source_color,filter_linear_mipmap,repeat_enable;
uniform sampler2D side_map: source_color,filter_linear_mipmap,repeat_enable;
uniform sampler2D bottom_map: source_color,filter_linear_mipmap,repeat_enable;
varying flat float face;
void vertex(){face=mod(CUSTOM0.w,8.0);}
void fragment(){
	vec2 uv=vec2(UV.x,1.0-UV.y);
	vec4 color;
	if(face>1.5&&face<2.5)color=texture(top_map,uv);
	else if(face>2.5&&face<3.5)color=texture(bottom_map,uv);
	else color=texture(side_map,uv);
	ALBEDO=color.rgb;
	ROUGHNESS=0.25;
	SPECULAR=0.5;
}
"""
	var material:=ShaderMaterial.new()
	material.shader=shader
	for face in ["top","side","bottom"]:
		var path:="res://assets/region-glass-%s.png"%face
		if ResourceLoader.exists(path): material.set_shader_parameter(face+"_map",load(path))
	return material
