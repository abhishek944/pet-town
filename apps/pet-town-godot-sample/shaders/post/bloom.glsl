#[compute]
#version 450
// Source customized UnrealBloomPass: highpass followed by paired Gaussian taps.
layout(local_size_x=8,local_size_y=8,local_size_z=1) in;
layout(rgba16f,set=0,binding=0) uniform writeonly image2D target;
layout(set=0,binding=1) uniform sampler2D source;
layout(set=0,binding=2) uniform sampler2D depth;
layout(push_constant,std430) uniform Params { vec4 size; vec4 settings; vec4 direction; } p;
float coefficient(float i,float sigma){return .39894*exp(-.5*i*i/(sigma*sigma))/sigma;}
void main(){
 ivec2 pixel=ivec2(gl_GlobalInvocationID.xy);if(any(greaterThanEqual(pixel,ivec2(p.size.xy))))return;
 vec2 uv=(vec2(pixel)+.5)/p.size.xy;vec3 color=vec3(0);
 if(p.settings.x<.5){
  float ws=0.;
  for(int i=0;i<4;i++){
   vec2 o=(vec2(float(i&1),float(i>>1))-.5)/p.size.zw;
   vec3 c=textureLod(source,uv+o,0).rgb;
   c*=mix(1.,.4,step(textureLod(depth,uv+o,0).r,.00001));
   float w=1./(1.+dot(c,vec3(.2126,.7152,.0722)));color+=c*w;ws+=w;
  }
  color/=ws;color*=smoothstep(p.settings.y,p.settings.y+.9,dot(color,vec3(.2126,.7152,.0722)));
 }else{
  float radius=p.settings.z,sigma=radius/3.;
  color=textureLod(source,uv,0).rgb*coefficient(0.,sigma);
  for(int i=1;i<int(radius);i+=2){
   float wa=coefficient(float(i),sigma),wb=i+1<int(radius)?coefficient(float(i+1),sigma):0.;
   float w=wa+wb,offset=(float(i)*wa+float(i+1)*wb)/w;
   vec2 o=p.direction.xy/p.size.zw*offset;
   color+=(textureLod(source,uv+o,0).rgb+textureLod(source,uv-o,0).rgb)*w;
  }
 }
 imageStore(target,pixel,vec4(color,1));
}
