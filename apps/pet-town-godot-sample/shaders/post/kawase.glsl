#[compute]
#version 450
layout(local_size_x=8,local_size_y=8,local_size_z=1) in;
layout(rgba16f,set=0,binding=0) uniform restrict writeonly image2D target;
layout(set=0,binding=1) uniform sampler2D source;
layout(push_constant,std430) uniform Params { vec4 size; vec4 offset; } p;
void main() {
 ivec2 pixel=ivec2(gl_GlobalInvocationID.xy);
 if(any(greaterThanEqual(pixel,ivec2(p.size.xy))))return;
 vec2 uv=(vec2(pixel)+.5)/p.size.xy,o=(p.offset.x+.5)/p.size.zw;
 imageStore(target,pixel,.25*(textureLod(source,uv+vec2(-o.x,-o.y),0)+textureLod(source,uv+vec2(o.x,-o.y),0)+textureLod(source,uv+vec2(-o.x,o.y),0)+textureLod(source,uv+vec2(o.x,o.y),0)));
}
