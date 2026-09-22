shader_type spatial;
render_mode unshaded, cull_disabled, shadows_disabled, ambient_light_disabled, fog_disabled;

uniform sampler2D wave_texture : source_color, repeat_enable, filter_linear;
uniform float tile_size = 72.0;
uniform vec2 drift_per_second = vec2(0.004, 0.0015);

varying vec2 water_uv;

void vertex() {
	vec3 world_position = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	water_uv = world_position.xz / tile_size + TIME * drift_per_second;
}

void fragment() {
	ALBEDO = texture(wave_texture, water_uv).rgb;
}
