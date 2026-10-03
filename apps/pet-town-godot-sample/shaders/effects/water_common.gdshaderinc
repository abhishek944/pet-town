float water_hash(vec2 p) { vec3 q=fract(vec3(p.xyx)*0.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z); }
float water_noise(vec2 p) {
	vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
	return mix(mix(water_hash(i),water_hash(i+vec2(1,0)),u.x),mix(water_hash(i+vec2(0,1)),water_hash(i+vec2(1)),u.x),u.y);
}
vec3 wave(vec2 p,float t,vec2 direction,float length,float amplitude,float speed) {
	vec2 d=normalize(direction);float k=6.2831853/length,phase=dot(d,p)*k-t*speed;
	return vec3(sin(phase)*amplitude,cos(phase)*amplitude*k*d);
}
vec3 swell(vec2 p,float t) {
	return wave(p,t,vec2(0.82,0.57),11.0,0.045,0.95)
	+wave(p,t,vec2(-0.45,0.89),6.3,0.028,1.25)
	+wave(p,t,vec2(0.28,-0.96),3.9,0.014,1.6)
	+wave(p,t,vec2(-0.93,-0.36),15.0,0.035,0.7);
}
vec2 detail(vec2 p,float t) {
	float dx=water_noise(p*2.7+vec2(t*0.26,0))-water_noise(p*2.7+vec2(t*0.26+0.04,0));
	float dz=water_noise(p*2.7+vec2(0,t*0.21))-water_noise(p*2.7+vec2(0.04,t*0.21));
	return vec2(dx,dz)*0.32;
}
