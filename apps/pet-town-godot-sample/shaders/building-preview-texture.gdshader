shader_type spatial;
render_mode cull_back, depth_draw_never, diffuse_lambert;
uniform sampler2DArray atlas: source_color, filter_linear_mipmap, repeat_disable;
uniform sampler2D glass_top: source_color, filter_linear_mipmap;
uniform sampler2D glass_side: source_color, filter_linear_mipmap;
uniform sampler2D glass_bottom: source_color, filter_linear_mipmap;
uniform vec3 layers = vec3(0.0);
uniform vec2 overlays = vec2(-1.0);
uniform float opacity = 0.4;
uniform float emission_amount = 0.5;
uniform bool glass = false;
varying vec3 local_normal;

void vertex() { local_normal = NORMAL; }
void fragment() {
	bool top = local_normal.y > 0.5;
	bool bottom = local_normal.y < -0.5;
	// The original preview takes the top-left one-block tile from each 2x2 layer.
	vec2 uv = vec2(UV.x*0.5,0.5+UV.y*0.5);
	float layer = top ? layers.x : (bottom ? layers.z : layers.y);
	vec4 color = texture(atlas,vec3(uv,layer));
	float overlay = top ? overlays.x : (bottom ? -1.0 : overlays.y);
	if (overlay >= 0.0) {
		vec4 over = texture(atlas,vec3(uv,overlay));
		color.rgb = mix(color.rgb,over.rgb,over.a*(top || UV.y > 0.3 ? 1.0 : 0.0));
	}
	if (glass) {
		vec2 glass_uv = vec2(UV.x,1.0-UV.y);
		if (top) color = texture(glass_top,glass_uv);
		else if (bottom) color = texture(glass_bottom,glass_uv);
		else color = texture(glass_side,glass_uv);
	}
	ALBEDO = color.rgb;
	EMISSION = color.rgb*emission_amount;
	ROUGHNESS = glass ? 0.25 : 0.9;
	ALPHA = opacity;
}
