shader_type spatial;
render_mode unshaded, cull_disabled;
uniform sampler2D flame_texture : source_color, filter_linear;
uniform bool has_texture = false;
uniform float phase = 0.0;
uniform bool vertex_phase = false;
void vertex() {
	float height=1.0-UV.y;
	float ph=vertex_phase?COLOR.r*10.0:phase;
	VERTEX.y*=1.0+0.18*sin(TIME*7.3+ph)+0.1*sin(TIME*13.1+ph*2.3);
	VERTEX.x+=sin(TIME*2.6+ph+height*3.0)*0.06*height*height;
	VERTEX.z+=cos(TIME*2.2+ph*1.7+height*2.5)*0.06*height*height;
}
void fragment() {
	vec4 fire=texture(flame_texture,UV);
	if(!has_texture) {
		float y=1.0-UV.y,width=sin(pow(y,0.6)*3.14159)*0.46;
		float d=abs(UV.x-0.5)/max(width,0.001);
		fire=vec4(mix(vec3(1.0,0.98,0.82),vec3(1.0,0.43,0.09),smoothstep(0.1,0.9,d)),step(d,1.0));
	}
	if(fire.a<0.45) discard;
	ALBEDO=fire.rgb*vec3(0.74,0.68,0.36);
}
