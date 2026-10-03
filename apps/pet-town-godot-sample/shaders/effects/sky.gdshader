shader_type sky;
render_mode use_half_res_pass;
uniform vec4 zenith;
uniform vec4 mid;
uniform vec4 horizon;
uniform vec4 sunHz;
uniform vec4 glow;
uniform vec4 cLit;
uniform vec4 cShade;
uniform vec3 sun_direction = vec3(0.4, 0.8, 0.3);
uniform float exposure = 1.06;
uniform float glow_strength = 0.6;
uniform float stars = 0.0;
uniform vec3 sun_disc = vec3(30.0);
uniform float sun_size = 0.027;
uniform float cloud_clock = 0.0;
float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float noise(vec2 p) {
	vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
	return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);
}
float cloud(vec2 p) {
	return noise(p)*0.56+noise(p*2.07+7.3)*0.28+noise(p*4.13+19.0)*0.16;
}
// Source sky displayToLinear Neutral branch; authored gradients interpolate in sRGB.
vec3 srgb_to_linear(vec3 color) {
	vec3 c=max(color,vec3(0.0));
	return mix(c/12.92,pow((c+0.055)/1.055,vec3(2.4)),step(vec3(0.04045),c));
}
vec3 display_to_linear(vec3 color) {
	vec3 c=clamp(srgb_to_linear(color),vec3(0.0),vec3(0.93));
	float peak=max(c.r,max(c.g,c.b));
	if(peak>0.76) c*=(0.0576/(1.0-peak)-0.24+0.76)/peak;
	float minimum=min(c.r,min(c.g,c.b));
	float offset=(minimum>=0.04?minimum+0.04:sqrt(max(minimum,0.0)/6.25))-minimum;
	return (c+vec3(offset))/max(exposure,0.001);
}
vec3 sky_color(vec3 direction) {
	float h=max(direction.y,0.0);
	vec3 color=mix(horizon.rgb,mid.rgb,smoothstep(0.0,0.35,h));
	color=mix(color,zenith.rgb,smoothstep(0.2,0.95,h));
	float sun_dot=max(dot(direction,sun_direction),0.0);
	color=mix(color,sunHz.rgb,pow(sun_dot,5.0)*exp(-h*4.0)*0.45);
	vec2 cp=direction.xz/max(direction.y+0.12,0.07)*2.1+vec2(cloud_clock*0.0025,cloud_clock*0.0014);
	float density=cloud(cp), cover=smoothstep(0.55,0.72,density)*smoothstep(0.0,0.12,h);
	vec3 clouds=mix(cShade.rgb,cLit.rgb,smoothstep(0.48,0.76,density));
	color=mix(color,clouds,cover*0.92);
	float star=step(0.9985,hash(floor(direction.xz/max(h,0.1)*500.0)))*stars*h;
	vec3 scene=display_to_linear(color)+vec3(star);
	vec3 glow_linear=srgb_to_linear(glow.rgb)*glow_strength*1.6/max(exposure,0.001);
	float glow_max=max(glow_linear.r,max(glow_linear.g,glow_linear.b));
	vec3 glow_warm=mix(glow_linear,glow_max*vec3(1.0,0.94,0.8),0.55);
	float inner=pow(sun_dot,2400.0)*5.0+pow(sun_dot,260.0)*0.7+pow(sun_dot,60.0)*0.16;
	float outer=pow(sun_dot,14.0)*0.1+pow(sun_dot,5.0)*0.05;
	float cut=smoothstep(-0.012,0.004,direction.y);
	scene+=(glow_warm*inner+glow_linear*outer)*mix(0.45,1.0,cut);
	scene+=sun_disc*smoothstep(cos(sun_size)-0.0015,cos(sun_size)+0.0004,dot(direction,sun_direction))*cut;
	return scene;
}

void sky() {
	if (AT_HALF_RES_PASS || AT_CUBEMAP_PASS) {
		COLOR=sky_color(EYEDIR);
	} else {
		COLOR=HALF_RES_COLOR.rgb;
	}
}
