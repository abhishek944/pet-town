#[compute]
#version 450
layout(local_size_x=8,local_size_y=8,local_size_z=1) in;
layout(rgba16f,set=0,binding=0) uniform writeonly image2D target;
layout(set=0,binding=1) uniform sampler2D depth;
layout(push_constant,std430) uniform Params { vec4 size; vec4 lens; vec4 quality; } p;
vec3 vpos(vec2 uv) {
 uv=(floor(uv*p.size.zw)+.5)/p.size.zw;
 float d=textureLod(depth,uv,0).r,z=p.lens.z*p.lens.w/(p.lens.z+d*(p.lens.w-p.lens.z));
 return vec3((uv.x*2.-1.)*z/p.lens.x,(1.-uv.y*2.)*z/p.lens.y,-z);
}
float ign(vec2 v) { return fract(52.9829189*fract(dot(v,vec2(.06711056,.00583715)))); }
void main() {
 ivec2 pixel=ivec2(gl_GlobalInvocationID.xy);
 if(any(greaterThanEqual(pixel,ivec2(p.size.xy))))return;
 vec2 uv=(vec2(pixel)+.5)/p.size.xy;
 float d=textureLod(depth,uv,0).r;
 if(d<.000001){imageStore(target,pixel,vec4(1,60000,0,1));return;}
 vec3 P=vpos(uv);vec2 tx=1./p.size.zw;
 vec3 pr=vpos(uv+vec2(tx.x,0)),pl=vpos(uv-vec2(tx.x,0));
 vec3 pu=vpos(uv-vec2(0,tx.y)),pd=vpos(uv+vec2(0,tx.y));
 vec3 dx=abs(pr.z-P.z)<abs(P.z-pl.z)?pr-P:P-pl;
 vec3 dy=abs(pu.z-P.z)<abs(P.z-pd.z)?pu-P:P-pd;
 vec3 N=normalize(cross(dx,dy));
 float radius=min(2.2*p.lens.y*.5*p.size.w/-P.z,90.),occ=0.;
 if(radius>1.){
  vec2 screen=vec2(pixel.x,p.size.y-1.-float(pixel.y))+.5;
  float rot=ign(screen)*6.2831853,jit=fract(ign(screen.yx+17.)+.5);
  for(int i=0;i<int(p.quality.x);i++){
   float t=(float(i)+jit)/p.quality.x,angle=rot+float(i)*2.39996323;
   vec2 off=vec2(cos(angle),-sin(angle))*(mix(t,sqrt(t),.5)*radius+1.);
   vec3 v=vpos(uv+off*tx)-P;
   float vv=dot(v,v),vn=dot(v,N)*inversesqrt(vv+1.e-5);
   occ+=max(vn-.08,0.)*clamp(1.-vv/(2.2*2.2),0.,1.);
  }
  occ/=p.quality.x;
 }
 imageStore(target,pixel,vec4(pow(clamp(1.-occ*2.7,0.,1.),1.5),-P.z,0,1));
}
