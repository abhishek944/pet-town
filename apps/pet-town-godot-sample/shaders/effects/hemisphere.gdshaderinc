// Three HemisphereLight irradiance, then Lambert's 1/PI (included in energy).
global uniform vec3 source_hemi_sky;
global uniform vec3 source_hemi_ground;
global uniform float source_hemi_energy;
vec3 source_hemisphere(vec3 world_normal) {
	return mix(source_hemi_ground,source_hemi_sky,clamp(world_normal.y*0.5+0.5,0.0,1.0))*source_hemi_energy;
}
