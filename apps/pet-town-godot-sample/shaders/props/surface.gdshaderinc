#include "../effects/hemisphere.gdshaderinc"
uniform vec3 base_color = vec3(1.0);
uniform vec3 emission_color = vec3(0.0);
uniform float emission_energy = 0.0;
uniform float weather_wetness = 0.0;
uniform float surface_roughness = 0.85;
uniform float surface_metallic = 0.0;
uniform float surface_opacity = 1.0;
uniform float alpha_cutoff = 0.0;
uniform float bump_scale = 0.0;
uniform bool use_vertex_color = true;
uniform bool has_map = false;
uniform bool has_bump = false;
uniform bool has_emission_map = false;
uniform bool map_flip_y = true;
uniform bool bump_flip_y = true;
uniform bool emission_flip_y = true;
uniform vec4 map_transform = vec4(1.0,1.0,0.0,0.0);
uniform vec4 bump_transform = vec4(1.0,1.0,0.0,0.0);
uniform vec4 emission_transform = vec4(1.0,1.0,0.0,0.0);
uniform sampler2D map_texture : source_color, filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D bump_texture : filter_linear_mipmap_anisotropic, repeat_enable;
uniform sampler2D emission_texture : source_color, filter_linear_mipmap_anisotropic, repeat_enable;

vec2 source_uv(vec2 uv, vec4 transform, bool flip_y) {
	vec2 result = uv * transform.xy + transform.zw;
	if (flip_y) result.y = 1.0-result.y;
	return result;
}

// Three's perturbNormalArb: height derivatives measured in screen space,
// Three r186 normalizes these derivatives before applying source bumpScale.
vec3 bumped_normal(vec3 normal, vec3 view_position, vec2 uv, float face_direction) {
	vec3 sigma_x = normalize(dFdx(view_position));
	vec3 sigma_y = normalize(dFdy(view_position));
	vec3 r1 = cross(sigma_y,normal);
	vec3 r2 = cross(normal,sigma_x);
	float det = dot(sigma_x,r1)*face_direction;
	float height = texture(bump_texture,uv).r;
	vec2 delta = vec2(texture(bump_texture,uv+dFdx(uv)).r-height,
		texture(bump_texture,uv+dFdy(uv)).r-height)*bump_scale;
	vec3 gradient = sign(det)*(delta.x*r1+delta.y*r2);
	return normalize(abs(det)*normal-gradient);
}

void fragment() {
	vec3 surface_normal = normalize(NORMAL) * (FRONT_FACING ? 1.0 : -1.0);
	NORMAL = surface_normal;
	vec4 texel = vec4(1.0);
	if (has_map) texel = texture(map_texture,source_uv(UV,map_transform,map_flip_y));
	if (texel.a*surface_opacity < alpha_cutoff) discard;
	ALBEDO = base_color * texel.rgb * (use_vertex_color ? COLOR.rgb : vec3(1.0));
	ALBEDO *= 1.0 - weather_wetness * 0.1;
	ROUGHNESS = mix(surface_roughness, min(surface_roughness,0.38),weather_wetness);
	METALLIC = surface_metallic;
	vec3 emission = emission_color*emission_energy;
	if (has_emission_map) emission *= texture(emission_texture,source_uv(UV,emission_transform,emission_flip_y)).rgb;
	EMISSION = emission;
	if (has_bump) NORMAL = bumped_normal(surface_normal,VERTEX,source_uv(UV,bump_transform,bump_flip_y),FRONT_FACING ? 1.0 : -1.0);
IRRADIANCE=vec4(source_hemisphere(normalize(mat3(INV_VIEW_MATRIX)*NORMAL)),1.0);
#ifdef PROP_TRANSPARENT
	ALPHA = texel.a*surface_opacity;
#endif
}
