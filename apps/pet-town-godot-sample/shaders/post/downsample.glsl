#[compute]
#version 450
layout(local_size_x=8,local_size_y=8,local_size_z=1) in;
layout(rgba16f,set=0,binding=0) uniform restrict writeonly image2D target;
layout(set=0,binding=1) uniform sampler2D scene;
layout(set=0,binding=2) uniform sampler2D depth;
layout(set=0,binding=3) uniform sampler2D ao_texture;
layout(push_constant,std430) uniform Params { vec4 focus; vec4 camera; vec4 size; } p;
float coc(vec2 uv,float z) {
 float dy=1.-uv.y-p.focus.x;
 float tilt=dy>0.?smoothstep(.2,.56,dy)*p.focus.z*smoothstep(p.focus.y*.8,p.focus.y*1.6,z):smoothstep(.2,.488,-dy)*p.focus.w;
 float far_blur=smoothstep(max(p.focus.y*1.8,20.),max(p.focus.y*5.,80.),z)*p.camera.z;
 float near_blur=(1.-smoothstep(p.focus.y*.2,p.focus.y*.42,z))*p.camera.w;
 float c=max(max(tilt,far_blur),near_blur);
 return clamp(z>p.camera.y*.95?c*.15:c,0.,1.);
}
vec4 tap(vec2 uv) {
 vec4 src=textureLod(scene,uv,0);
 vec3 c=src.rgb;
 if(any(isnan(c))||any(isinf(c)))c=vec3(0);
 float m=max(c.r,max(c.g,c.b));
 c=m>12.?c*(12./m):max(c,0.);
 c*=mix(vec3(1),vec3(.52,.5,.68),(1.-textureLod(ao_texture,uv,0).r)*smoothstep(.7,.8,src.a));
 float d=textureLod(depth,uv,0).r;
 float z=p.camera.x*p.camera.y/(p.camera.x+d*(p.camera.y-p.camera.x));
 float w=coc(uv,z)+.002;
 return vec4(c*w,w);
}
void main() {
 ivec2 pixel=ivec2(gl_GlobalInvocationID.xy);
 if(any(greaterThanEqual(pixel,ivec2(p.size.xy))))return;
 vec2 uv=(vec2(pixel)+.5)/p.size.xy,tx=1./p.size.zw;
 imageStore(target,pixel,.25*(tap(uv+tx*vec2(-1,-1))+tap(uv+tx*vec2(1,-1))+tap(uv+tx*vec2(-1,1))+tap(uv+tx*vec2(1,1))));
}
