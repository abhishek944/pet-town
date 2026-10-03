#[compute]
#version 450
layout(local_size_x=8,local_size_y=8,local_size_z=1) in;
layout(rgba16f,set=0,binding=0) uniform writeonly image2D target;
layout(set=0,binding=1) uniform sampler2D source;
layout(set=0,binding=2) uniform sampler2D depth;
layout(push_constant,std430) uniform Params { vec4 size; vec4 sun; vec4 mode; } p;
float ign(vec2 v){return fract(52.9829189*fract(dot(v,vec2(.06711056,.00583715))));}
void main(){
 ivec2 pixel=ivec2(gl_GlobalInvocationID.xy);if(any(greaterThanEqual(pixel,ivec2(p.size.xy))))return;
 vec2 uv=(vec2(pixel)+.5)/p.size.xy;vec3 acc=vec3(0);
 if(p.mode.x<.5){
  for(int i=0;i<4;i++){
   vec2 o=(vec2(float(i&1),float(i>>1))-.5)/p.size.zw;
   float d=textureLod(depth,uv+o,0).r;
   acc+=min(textureLod(source,uv+o,0).rgb,vec3(12))*step(d,.00001);
  }
  acc*=.25;vec2 dv=(uv-p.sun.xy)*vec2(p.size.z/p.size.w,1);
  acc*=smoothstep(.6,2.2,dot(acc,vec3(.2126,.7152,.0722)))*exp(-dot(dv,dv)*3.);
 }else{
  vec2 dir=(p.sun.xy-uv)*p.mode.y/24.;
  uv+=dir*ign(vec2(pixel.x,p.size.y-1.-float(pixel.y))+.5);
  float w=1.,ws=0.;
  for(int i=0;i<24;i++){acc+=textureLod(source,uv,0).rgb*w;ws+=w;uv+=dir;w*=.94;}
  acc/=ws;
 }
 imageStore(target,pixel,vec4(acc,1));
}
