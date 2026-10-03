#[compute]
#version 450
layout(local_size_x=8,local_size_y=8,local_size_z=1) in;
layout(rgba16f,set=0,binding=0) uniform writeonly image2D target;
layout(set=0,binding=1) uniform sampler2D scene;
layout(set=0,binding=2) uniform sampler2D depth;
layout(std430,set=0,binding=3) readonly buffer Atmosphere {
 vec4 haze;vec4 atmosphere;vec4 sun;vec4 shaft;vec4 screen;vec4 lens;
 vec4 axis_x;vec4 axis_y;vec4 axis_z;vec4 quality;vec4 fog;vec4 scatter;
} a;
layout(push_constant,std430) uniform Params { vec4 size; } p;
void main(){
 ivec2 pixel=ivec2(gl_GlobalInvocationID.xy);if(any(greaterThanEqual(pixel,ivec2(p.size.xy))))return;
 vec2 uv=(vec2(pixel)+.5)/p.size.xy;
 vec4 c=textureLod(scene,uv,0);float d=textureLod(depth,uv,0).r;
 if(d>.000001){
  float z=a.lens.z*a.lens.w/(a.lens.z+d*(a.lens.w-a.lens.z));
  vec3 view=vec3((uv.x*2.-1.)*z/a.lens.x,(1.-uv.y*2.)*z/a.lens.y,-z);
  vec3 world=a.axis_x.xyz*view.x+a.axis_y.xyz*view.y+a.axis_z.xyz*view.z;
  vec3 ray=normalize(world);float height=a.axis_y.w+world.y;
  float fog=smoothstep(a.fog.w,a.scatter.w,z)*exp(-max(0.,height-9.)/28.);
  fog*=mix(1.,.35,clamp(-ray.y*2.,0.,1.));
  fog=min(fog,mix(.7,1.,smoothstep(-.08,-.01,ray.y)));
  float mu=max(dot(ray,a.sun.xyz),0.);
  vec3 color=a.fog.rgb+a.scatter.rgb*(mu*mu*mu*.55+pow(mu,10.)*.45);
  c.rgb=mix(c.rgb,color,fog);
 }
 imageStore(target,pixel,c);
}
