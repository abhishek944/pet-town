#[compute]
#version 450
// CozyOutputShader port; neutral curve and sRGB transfers from Three.js (MIT).
layout(local_size_x=8,local_size_y=8,local_size_z=1) in;
layout(rgba16f,set=0,binding=0) uniform restrict writeonly image2D scene;
layout(set=0,binding=1) uniform sampler2D composite;
layout(set=0,binding=2) uniform sampler2D bloom1;
layout(set=0,binding=3) uniform sampler2D bloom2;
layout(set=0,binding=4) uniform sampler2D bloom3;
layout(set=0,binding=5) uniform sampler2D bloom4;
layout(set=0,binding=6) uniform sampler2D bloom5;
layout(std430,set=0,binding=7) readonly buffer Atmosphere {
 vec4 haze;vec4 atmosphere;vec4 sun;vec4 shaft;vec4 screen;vec4 lens;
 vec4 axis_x;vec4 axis_y;vec4 axis_z;vec4 quality;vec4 fog;vec4 scatter;
} a;
layout(push_constant,std430) uniform Params {
 vec4 wb; vec4 lift; vec4 gamma; vec4 gain;
 vec4 shadow; vec4 high; vec4 vignette; vec4 frame;
} p;
float luma(vec3 c) { return dot(c,vec3(.2126,.7152,.0722)); }
float ign(vec2 v) { return fract(52.9829189*fract(dot(v,vec2(.06711056,.00583715)))); }
vec3 neutral(vec3 c) {
 c*=p.wb.w;
 float x=min(c.r,min(c.g,c.b));
 c-=x<.08?x-6.25*x*x:.04;
 float peak=max(c.r,max(c.g,c.b));
 if(peak<.76)return c;
 float next=1.-.24*.24/(peak+.24-.76);
 c*=next/peak;
 return mix(c,vec3(next),1.-1./(.15*(peak-next)+1.));
}
vec3 to_srgb(vec3 c) { return mix(pow(c,vec3(.41666))*1.055-.055,c*12.92,lessThanEqual(c,vec3(.0031308))); }
vec3 to_linear(vec3 c) { return mix(pow(c*.9478672986+.0521327014,vec3(2.4)),c*.0773993808,lessThanEqual(c,vec3(.04045))); }
vec3 rgb2hsv(vec3 c) {
 vec4 K=vec4(0,-1./3.,2./3.,-1);
 vec4 a=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));
 vec4 q=mix(vec4(a.xyw,c.r),vec4(c.r,a.yzx),step(a.x,c.r));
 float d=q.x-min(q.w,q.y),e=1.e-10;
 return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)),d/(q.x+e),q.x);
}
vec3 hsv2rgb(vec3 c) {
 vec3 a=abs(fract(c.xxx+vec3(1,2./3.,1./3.))*6.-3.);
 return c.z*mix(vec3(1),clamp(a-1.,0.,1.),c.y);
}
float bloom_factor(float factor){return mix(factor,1.2-factor,a.screen.w);}
void main() {
 ivec2 pixel=ivec2(gl_GlobalInvocationID.xy);
 if(any(greaterThanEqual(pixel,ivec2(p.frame.xy))))return;
 vec2 uv=(vec2(pixel)+.5)/p.frame.xy;
 vec4 src=textureLod(composite,uv,0);
 vec3 bloom=bloom_factor(1.)*textureLod(bloom1,uv,0).rgb;
 bloom+=bloom_factor(.8)*vec3(1,.975,.94)*textureLod(bloom2,uv,0).rgb;
 bloom+=bloom_factor(.6)*vec3(1,.95,.88)*textureLod(bloom3,uv,0).rgb;
 bloom+=bloom_factor(.4)*vec3(1,.925,.82)*textureLod(bloom4,uv,0).rgb;
 bloom+=bloom_factor(.2)*vec3(1,.9,.76)*textureLod(bloom5,uv,0).rgb;
 vec3 col=src.rgb+3.*a.screen.z*bloom;
 vec3 c=clamp(to_srgb(max(neutral(col*mix(vec3(1),p.wb.rgb,p.frame.w)),0.)),0.,1.);
 vec3 g=c;
 float L=luma(g);
 float sky_keep=1.-clamp((g.b-g.r)*4.,0.,1.);
 g+=p.shadow.rgb*(1.-smoothstep(0.,.55,L))+p.high.rgb*smoothstep(.45,1.,L)*sky_keep;
 g=g*p.gain.rgb+p.lift.rgb*(1.-g);
 g=pow(max(g,0.),1./p.gamma.rgb);
 g=mix(g,g*g*(3.-2.*g),p.gain.w);
 L=luma(g);
 float chroma=max(g.r,max(g.g,g.b))-min(g.r,min(g.g,g.b));
 g=mix(vec3(L),g,p.lift.w*(1.+p.gamma.w*(1.-chroma)));
 vec3 hsv=rgb2hsv(max(g,0.));
 float gw=smoothstep(55./360.,75./360.,hsv.x)*(1.-smoothstep(125./360.,145./360.,hsv.x))*p.vignette.w;
 hsv.x+=gw*(3./360.);hsv.y*=1.-.1*gw;
 float mw=smoothstep(270./360.,290./360.,hsv.x)*(1.-smoothstep(340./360.,355./360.,hsv.x));
 hsv.y*=1.-p.high.w*mw;
 g=hsv2rgb(hsv);
 L=luma(g);
 chroma=max(g.r,max(g.g,g.b))-min(g.r,min(g.g,g.b));
 if(chroma>.3)g=mix(vec3(L),g,(.3+(chroma-.3)*.4)/chroma);
 float gm=max(g.r,max(g.g,g.b));
 if(gm>.88)g*=(.88+.12*(1.-exp(-1.6*(gm-.88)/.12)))/gm;
 c=mix(c,g,p.frame.w);
 vec2 q=(uv-.5)*vec2(p.frame.x/p.frame.y,1);
 float r=length(q)/length(vec2(p.frame.x/p.frame.y,1)*.5);
 float v=smoothstep(.42,1.05,r);
 c*=mix(vec3(1),p.vignette.rgb,v*v*p.shadow.w);
 // Source WebGL framebuffer coordinates have their origin at the lower left.
 c+=(ign(vec2(pixel.x,p.frame.y-1.-float(pixel.y))+.5)-.5)/255.;
 imageStore(scene,pixel,vec4(to_linear(clamp(c,0.,1.)),src.a));
}
