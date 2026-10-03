shader_type canvas_item;
render_mode unshaded;
uniform sampler2D screen_texture : hint_screen_texture, filter_linear_mipmap;
uniform vec4 tint : source_color = vec4(0.09, 0.15, 0.11, 0.33);
uniform float blur_lod = 1.5;
void fragment() {
	vec3 scene = textureLod(screen_texture, SCREEN_UV, blur_lod).rgb;
	COLOR = vec4(mix(scene, tint.rgb, tint.a), 1.0);
}
