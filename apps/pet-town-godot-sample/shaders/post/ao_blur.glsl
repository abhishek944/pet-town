#[compute]
#version 450
layout(local_size_x=8,local_size_y=8,local_size_z=1) in;
layout(rgba16f,set=0,binding=0) uniform writeonly image2D target;
layout(set=0,binding=1) uniform sampler2D source;
layout(push_constant,std430) uniform Params { vec4 size; vec4 direction; } p;
void main(){
 ivec2 pixel=ivec2(gl_GlobalInvocationID.xy);if(any(greaterThanEqual(pixel,ivec2(p.size.xy))))return;
 vec2 uv=(vec2(pixel)+.5)/p.size.xy;
 vec4 c=textureLod(source,uv,0);float z=c.g,tol=1./(z*.04+.03),sum=c.r,ws=1.;
 for(int i=1;i<=4;i++)for(int s=-1;s<=1;s+=2){
  vec4 t=textureLod(source,uv+p.direction.xy/p.size.xy*float(i*s),0);
  float w=exp(-float(i*i)/9.)*max(0.,1.-abs(t.g-z)*tol);sum+=t.r*w;ws+=w;
 }
 imageStore(target,pixel,vec4(sum/ws,z,0,1));
}
