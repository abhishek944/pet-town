shader_type canvas_item;
uniform float radius = 15.0;
void fragment() {
	vec2 half_size = 0.5 / TEXTURE_PIXEL_SIZE;
	float corner = min(radius, min(half_size.x, half_size.y));
	vec2 edge = abs((UV - 0.5) / TEXTURE_PIXEL_SIZE) - half_size + corner;
	float distance = length(max(edge, vec2(0.0))) + min(max(edge.x, edge.y), 0.0) - corner;
	COLOR.a *= 1.0 - smoothstep(-1.0, 0.0, distance);
}
