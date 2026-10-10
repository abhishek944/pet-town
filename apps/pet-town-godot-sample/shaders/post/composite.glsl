#[compute]
#version 450
layout(local_size_x=8,local_size_y=8,local_size_z=1) in;
layout(rgba16f,set=0,binding=0) uniform writeonly image2D target;
layout(set=0,binding=1) uniform sampler2D scene;
layout(set=0,binding=2) uniform sampler2D depth;
layout(set=0,binding=3) uniform sampler2D ao_texture;
layout(set=0,binding=4) uniform sampler2D blur1;
layout(set=0,binding=5) uniform sampler2D blur2;
layout(set=0,binding=6) uniform sampler2D shafts;
layout(std430,set=0,binding=7) readonly buffer Focus {vec4 focus;vec4 camera;} f;
layout(std430,set=0,binding=8) readonly buffer Atmosphere {
 vec4 haze;vec4 atmosphere;vec4 sun;vec4 shaft;vec4 screen;vec4 lens;
 vec4 axis_x;vec4 axis_y;vec4 axis_z;vec4 quality;vec4 fog;vec4 scatter;
} a;
layout(push_constant,std430) uniform Params {vec4 size;} p;
float luma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
vec3 sanitize(vec3 c){
 if(any(isnan(c))||any(isinf(c)))return vec3(0);
 float m=max(c.r,max(c.g,c.b));return m>12.?c*(12./m):max(c,0.);
}
float coc(vec2 uv,float z,float depth_value){
 float dy=1.-uv.y-f.focus.x;
 float tilt=dy>0.?smoothstep(.2,.56,dy)*f.focus.z*smoothstep(f.focus.y*.8,f.focus.y*1.6,z):smoothstep(.2,.488,-dy)*f.focus.w;
 float far_blur=smoothstep(max(f.focus.y*1.8,20.),max(f.focus.y*5.,80.),z)*f.camera.z;
 float near_blur=(1.-smoothstep(f.focus.y*.2,f.focus.y*.42,z))*f.camera.w;
 // Only empty depth is sky. Extended ocean writes a real, near-far depth.
 float c=max(max(tilt,far_blur),near_blur);return clamp(depth_value<=.000001?c*.15:c,0.,1.);
}
float up_ao(vec2 uv,float z){
 vec2 res=vec2(textureSize(ao_texture,0));vec2 pixel=uv*res-.5,fracture=fract(pixel),t=1./res,b=(floor(pixel)+.5)*t;
 vec4 aa=textureLod(ao_texture,b,0),bb=textureLod(ao_texture,b+vec2(t.x,0),0),cc=textureLod(ao_texture,b+vec2(0,t.y),0),dd=textureLod(ao_texture,b+t,0);
 vec4 w=vec4((1.-fracture.x)*(1.-fracture.y),fracture.x*(1.-fracture.y),(1.-fracture.x)*fracture.y,fracture.x*fracture.y);
 w*=1./(1.+16.*abs(vec4(aa.g,bb.g,cc.g,dd.g)-z)/(z*.04+.03))+1.e-4;
 return dot(w,vec4(aa.r,bb.r,cc.r,dd.r))/dot(w,vec4(1));
}
void main(){
 ivec2 pixel=ivec2(gl_GlobalInvocationID.xy);if(any(greaterThanEqual(pixel,ivec2(p.size.xy))))return;
 vec2 uv=(vec2(pixel)+.5)/p.size.xy,tx=1./p.size.xy;
 float d=textureLod(depth,uv,0).r,z=f.camera.x*f.camera.y/(f.camera.x+d*(f.camera.y-f.camera.x));
 vec4 scene4=textureLod(scene,uv,0);vec3 col=sanitize(scene4.rgb);float blur=coc(uv,z,d);
 vec3 n=sanitize(textureLod(scene,uv+vec2(tx.x,0),0).rgb),s=sanitize(textureLod(scene,uv-vec2(tx.x,0),0).rgb);
 vec3 e=sanitize(textureLod(scene,uv+vec2(0,tx.y),0).rgb),w=sanitize(textureLod(scene,uv-vec2(0,tx.y),0).rgb);
 vec3 mn=min(min(n,s),min(e,w)),mx=max(max(n,s),max(e,w));
 float lc=luma(min(scene4.rgb,vec3(65000)));vec4 L=vec4(luma(n),luma(s),luma(e),luma(w));
 vec2 lo=min(L.xy,L.zw),hi=max(L.xy,L.zw);float lo2=min(max(lo.x,lo.y),min(hi.x,hi.y));
 if(lc>6.&&lc>4.*lo2){vec3 dark=L.x<=lo2?n:(L.y<=lo2?s:(L.z<=lo2?e:w));col=.5*(mn+min(dark,mx));}
 else if(luma(col)>1.&&luma(col)>2.5*luma(mx))col=mx*1.25;
 vec3 sh=col+(col-.25*(n+s+e+w))*a.quality.y*(1.-blur);
 col=clamp(sh,min(col,mn),max(col,mx));
 float ao=mix(1.,up_ao(uv,z),smoothstep(.7,.8,scene4.a));
 col*=mix(vec3(1),vec3(.52,.5,.68),1.-ao);
 vec4 b1=textureLod(blur1,uv,0),b2=textureLod(blur2,uv,0);
 vec3 heavy=b2.rgb/max(b2.a,1.e-5);
 col=mix(col,b1.rgb/max(b1.a,1.e-5),smoothstep(0.,.45,blur));
 col=mix(col,heavy,smoothstep(.4,1.,blur));
 vec3 lit=max(col,min(heavy,col*1.6));float dw=.45+.55*smoothstep(f.focus.y*.7,f.focus.y*2.5,z);
 col=mix(col,lit,a.atmosphere.w*dw);
 if(a.sun.w>.002)col+=textureLod(shafts,uv,0).rgb*a.shaft.rgb;
 float hz=smoothstep(a.atmosphere.x,a.atmosphere.y,z)*a.haze.w;
 if(hz>.001){
  vec3 ray=vec3((uv.x*2.-1.)/a.lens.x,(1.-uv.y*2.)/a.lens.y,-1);
  vec3 rd=a.axis_x.xyz*ray.x+a.axis_y.xyz*ray.y+a.axis_z.xyz*ray.z;
  float align=dot(normalize(rd.xz+1.e-5),normalize(a.sun.xz+1.e-5));
  float anti=(1.-smoothstep(-.6,.3,align))*a.atmosphere.z;
  vec3 hc=mix(a.haze.rgb,vec3(luma(a.haze.rgb))*vec3(.84,.9,1.1),anti);
  // Keep ocean haze continuous through the camera far range; exclude only sky.
  col=mix(col,hc,d>.000001?hz:0.);
 }
 imageStore(target,pixel,vec4(col,scene4.a));
}
