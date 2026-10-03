shader_type spatial;
render_mode cull_back, diffuse_burley, specular_schlick_ggx;
#include "res://shaders/effects/hemisphere.gdshaderinc"
// Source crp roughness/emission fields travel through glTF TEXCOORD_1.
uniform float rim = 0.35;
uniform float lift = 0.08;
uniform vec4 rim_color : source_color = vec4(0.957, 0.972, 1.0, 1.0);
varying float unlit;
void fragment() {
	vec3 paint = COLOR.rgb;
	ROUGHNESS = clamp(UV2.x, 0.08, 1.0);
	unlit = step(0.5, UV2.y);
	ALBEDO = paint * (1.0 - unlit);
	float edge = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), 2.4);
	float up = 0.45 + 0.55 * clamp(NORMAL.y * 0.5 + 0.5, 0.0, 1.0);
	EMISSION = paint * lift + rim_color.rgb * mix(vec3(1.0), paint, 0.75) * edge * rim * up * step(0.3, UV2.x);
	EMISSION = mix(EMISSION, paint * (UV2.y > 1.5 ? 1.0 : 1.45), unlit);
	IRRADIANCE=vec4(source_hemisphere(normalize(mat3(INV_VIEW_MATRIX)*NORMAL)),1.0);
}
void light() {
	float wrapped = clamp((dot(NORMAL, LIGHT) + 0.6) / 1.6, 0.0, 1.0);
	DIFFUSE_LIGHT += wrapped * ATTENUATION * LIGHT_COLOR / PI;
	vec3 halfway = normalize(LIGHT + VIEW);
	float exponent = mix(128.0, 3.0, ROUGHNESS);
	SPECULAR_LIGHT += pow(max(dot(NORMAL, halfway), 0.0), exponent) * (1.0 - ROUGHNESS) * LIGHT_COLOR * ATTENUATION * 0.18 * (1.0 - unlit);
}
