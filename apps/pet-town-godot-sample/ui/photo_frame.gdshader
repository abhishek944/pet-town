shader_type canvas_item;
void fragment() {
	vec2 viewport = 1.0 / SCREEN_PIXEL_SIZE;
	vec2 pixel = UV * viewport;
	float vignette = smoothstep(0.45, 1.0, length((UV - 0.5) * 2.0));
	vec2 edge = min(pixel, viewport - pixel) - vec2(36.0);
	float corner = float(edge.x >= 0.0 && edge.y >= 0.0 && edge.x <= 46.0 && edge.y <= 46.0);
	float line = corner * (1.0 - step(5.0, min(edge.x, edge.y)));
	COLOR = mix(vec4(0.235, 0.118, 0.078, vignette * 0.42), vec4(1.0, 1.0, 1.0, 0.95), line) * COLOR;
}
