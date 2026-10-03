shader_type spatial;
render_mode unshaded, fog_disabled, depth_draw_never, depth_test_disabled, cull_disabled;
// Original Three.js ocean postprocessing equations, adapted to native screen/depth buffers.
uniform sampler2D scene_texture : hint_screen_texture, filter_linear;
uniform sampler2D depth_texture : hint_depth_texture, filter_nearest;
uniform float water_y = 7.62;
uniform float clock = 0.0;
uniform vec3 water_color = vec3(0.1, 0.42, 0.5);
uniform vec3 water_deep = vec3(0.03, 0.14, 0.24);
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
	uv += under * vec2(sin(uv.y * 38.0 + clock * 2.1) + sin(uv.y * 17.0 - clock * 1.3), cos(uv.x * 29.0 + clock * 1.7)) * 0.0018;
	float depth = texture(depth_texture, uv).r;
	vec4 view_point = INV_PROJECTION_MATRIX * vec4(uv * 2.0 - 1.0, depth, 1.0);
	vec3 view_pos = view_point.xyz / view_point.w;
	float z = max(0.0, -view_pos.z);
	vec3 col = texture(scene_texture, uv).rgb;
	vec3 world_pos = (INV_VIEW_MATRIX * vec4(ray * (min(z,400.0) / max(-ray.z,0.001)),1.0)).xyz;
	float below = water_y - world_pos.y;
	float caus = below > 0.0 ? caustics(world_pos.xz * 0.22, clock * 0.55) * exp(-below * 0.22) : 0.0;
	vec3 absorb = exp(-z * vec3(0.16,0.05,0.035));
	vec3 color = col * absorb * vec3(0.75,1.0,1.05);
	color += col * caus * 1.6 * absorb.g + vec3(0.6,0.9,1.0) * caus * 0.12 * absorb.g;
	float fog = 1.0 - exp(-z * 0.075);
	vec2 original_uv = vec2(uv.x,1.0-uv.y);
	vec3 fog_color = mix(water_color,water_deep,clamp(0.9-original_uv.y,0.0,1.0));
	color = mix(color,fog_color,fog);
	float rx = original_uv.x * 6.0 + (original_uv.y - 1.0) * (original_uv.x - 0.5) * 2.5;
	float rays = pow(0.5 + 0.5 * sin(rx + clock * 0.35) * sin(rx * 2.3 - clock * 0.21 + 1.3),4.0);
	color += water_color * 1.6 * rays * smoothstep(0.15,1.0,original_uv.y) * (0.35 + 0.65 * fog);
	color *= 1.0 + 0.2 * smoothstep(0.55,1.0,original_uv.y);
	ALBEDO = mix(col,color,under);
	ALPHA = 1.0;
}
