shader_type spatial;
render_mode diffuse_lambert, specular_schlick_ggx, cull_back, blend_mix, depth_draw_never;
#define PROP_TRANSPARENT
#include "surface.gdshaderinc"
