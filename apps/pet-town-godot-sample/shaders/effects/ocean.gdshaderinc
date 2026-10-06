// Render-only water beyond the finite terrain field. Never expands navigation.
uniform vec2 ocean_extent = vec2(4304.0);
vec4 ocean_fields(vec2 uv) {
	float border = min(min(uv.x, 1.0 - uv.x) * field_rect.z, min(uv.y, 1.0 - uv.y) * field_rect.w);
	if (border < 0.0) return vec4(1.0, 1.0, 0.0, 1.0);
	vec4 fields = texture(water_fields, uv);
	// Deepen open water smoothly at the edge; preserve the exact edited wet mask.
	if (fields.g >= 0.5) fields.r = mix(1.0, fields.r, smoothstep(0.0, 24.0, border));
	return fields;
}
vec4 ocean_clip(vec3 vertex, vec3 world, mat4 projection, mat4 model_view, mat4 view, vec3 camera) {
	vec4 clip = projection * model_view * vec4(vertex, 1.0);
	if (abs(vertex.x) >= ocean_extent.x - 0.01 || abs(vertex.z) >= ocean_extent.y - 0.01) {
		vec3 direction = world - camera;
		direction.y = 0.0;
		clip = projection * view * vec4(direction, 0.0);
	}
	// Reverse-Z: retain distant water at the far depth without extending the
	// camera's culling distance for terrain, vegetation and other town objects.
	// Stay above postprocessing's 0.000001 sky cutoff so ocean fog is continuous.
	if (clip.w > 0.0) clip.z = max(clip.z, clip.w * 0.000002);
	return clip;
}
