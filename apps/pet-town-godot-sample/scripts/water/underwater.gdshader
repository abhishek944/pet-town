shader_type spatial;
render_mode unshaded, fog_disabled, depth_draw_never, depth_test_disabled, cull_disabled;
// Original Three.js ocean postprocessing equations, adapted to native screen/depth buffers.
uniform sampler2D scene_texture : hint_screen_texture, filter_linear;
uniform sampler2D depth_texture : hint_depth_texture, filter_nearest;
uniform float water_y = 7.62;
uniform float light_level = 1.0;
uniform float clock = 0.0;
uniform vec3 water_color = vec3(0.141263, 0.590619, 0.955973);
uniform vec3 water_deep = vec3(0.046665, 0.423268, 0.854993);
uniform float fog_start = 28.0;
uniform float fog_end = 85.0;
float caustics(vec2 p0, float t) {
	vec2 p = mod(p0 * 6.28318, 6.28318) - 250.0;
	vec2 i = p;
	float c = 1.0;
	for (int n = 0; n < 4; n++) {
		float tt = t * (1.0 - 3.5 / float(n + 1));
		i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
		c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / 0.005), p.y / (cos(i.y + tt) / 0.005)));
	}
	c = 1.17 - pow(c / 4.0, 1.4);
	return pow(abs(c), 8.0);
}
void vertex() { POSITION = vec4(VERTEX.xy, 1.0, 1.0); }
void fragment() {
	vec2 uv = SCREEN_UV;
	vec4 near_point = INV_PROJECTION_MATRIX * vec4(uv * 2.0 - 1.0, 1.0, 1.0);
	vec3 ray = normalize(near_point.xyz / near_point.w);
	vec3 probe = (INV_VIEW_MATRIX * vec4(ray * 0.15, 1.0)).xyz;
	float surface = water_y + 0.02 * sin(probe.x * 5.0 + clock * 1.9) + 0.015 * sin(probe.z * 7.0 - clock * 1.4);
	float under = 1.0 - smoothstep(surface - 0.012, surface + 0.012, probe.y);
	float depth = texture(depth_texture, uv).r;
	vec4 view_point = INV_PROJECTION_MATRIX * vec4(uv * 2.0 - 1.0, depth, 1.0);
	vec3 view_pos = view_point.xyz / view_point.w;
	float z = max(0.0, -view_pos.z);
	vec3 col = texture(scene_texture, uv).rgb;
	vec3 world_pos = (INV_VIEW_MATRIX * vec4(ray * (min(z,400.0) / max(-ray.z,0.001)),1.0)).xyz;
	float below = water_y - world_pos.y;
	float caus = caustics(world_pos.xz * 0.22, 0.0) * smoothstep(2.0, 5.0, below);
	vec3 color = col + col * caus * 0.11;
	float fog = smoothstep(fog_start, fog_end, z);
	vec2 original_uv = vec2(uv.x,1.0-uv.y);
	vec3 fog_color = mix(water_color,water_deep,smoothstep(0.4,1.0,original_uv.y))*light_level;
	color = mix(color,fog_color,fog);
	ALBEDO = mix(col,color,under);
	ALPHA = 1.0;
}
