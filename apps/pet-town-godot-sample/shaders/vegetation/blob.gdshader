shader_type spatial;
render_mode unshaded, blend_mix, cull_back, depth_draw_never;
uniform vec3 base_color=vec3(0.0);
uniform float source_opacity=0.32;
uniform sampler2D shadow_mask: filter_linear_mipmap,repeat_enable;
void fragment() {
	ALBEDO=base_color;
	// Three alphaMap samples green, independently of the texture's alpha channel.
	ALPHA=texture(shadow_mask,UV).g*source_opacity;
}
