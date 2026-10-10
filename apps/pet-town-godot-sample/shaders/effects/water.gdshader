shader_type spatial;
// Refraction uses the transparent pass; postprocessing still needs surface depth.
render_mode unshaded, cull_disabled, depth_draw_always;
#include "water_common.gdshaderinc"
uniform sampler2D water_fields : filter_linear, repeat_disable;
uniform sampler2D shore_field : filter_linear, repeat_disable;
uniform sampler2D scene_texture : hint_screen_texture, filter_linear_mipmap;
uniform vec4 field_rect = vec4(-50.0,-50.0,100.0,100.0);
uniform vec2 field_pixels = vec2(100.0);
uniform float depth_scale = 16.0;
uniform vec4 shallow_color : source_color = vec4(0.267,0.847,0.878,1.0);
uniform vec4 mid_color : source_color = vec4(0.090,0.698,0.831,1.0);
uniform vec4 deep_color : source_color = vec4(0.082,0.361,0.518,1.0);
uniform vec4 foam_color : source_color = vec4(0.918,0.992,0.980,1.0);
uniform vec4 sky_horizon : source_color = vec4(0.682,0.831,0.949,1.0);
uniform vec4 sky_zenith : source_color = vec4(0.227,0.561,0.902,1.0);
uniform vec3 sun_direction = vec3(0.4,0.8,0.3);
uniform float night = 0.0;
uniform vec4 ripples[32];
uniform float clock = 0.0;
uniform bool reduced_motion = false;
varying vec3 world_position;
#include "ocean.gdshaderinc"
void vertex() {
	world_position=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;
	vec2 uv=(world_position.xz-field_rect.xy)/field_rect.zw;
	float dep=ocean_fields(uv).r*depth_scale;
	float modulate=0.45+0.75*water_noise(world_position.xz*0.035+vec2(clock*0.011,-clock*0.008));
	VERTEX.y+=swell(world_position.xz,clock).x*smoothstep(0.15,1.6,dep)*modulate;
	POSITION=ocean_clip(VERTEX,world_position,PROJECTION_MATRIX,MODELVIEW_MATRIX,VIEW_MATRIX,CAMERA_POSITION_WORLD);
}
void fragment() {
	vec2 p=world_position.xz,uv=(p-field_rect.xy)/field_rect.zw;
	vec4 fields=ocean_fields(uv);
	if(fields.g<0.5) discard;
	float depth=fields.r*depth_scale;
	// Undo the baked field's clamped land-cell half-width at the interpolated mask edge.
	float shoreline=max(texture(shore_field,uv).r*8.0-0.5*(1.0-fields.g),0.0);
	if(any(lessThan(uv,vec2(0.0))) || any(greaterThan(uv,vec2(1.0)))) shoreline=8.0;
	vec2 g=swell(p,clock).yz*smoothstep(0.15,1.6,depth)+detail(p,clock);
	float ring_foam=0.0;
	for(int i=0;i<32;i++) {
		vec4 r=ripples[i];float age=clock-r.z;
		float duration=mix(2.4,1.8,smoothstep(0.6,1.0,r.w));
		if(reduced_motion||r.w<=0.0||age<0.0||age>duration) continue;
		vec2 d=p-r.xy;float dist=length(d)+0.0001;
		float front=age*2.2*(0.75+0.25*min(r.w,2.0)),x=dist-front;
		float life=1.0-age/duration,env=min(r.w,2.0)*life*life/(1.0+dist*0.35),sig=5.0/(1.0+age*1.5);
		float impact=smoothstep(0.6,1.0,r.w),gauss=exp(-x*x*sig);
		g+=(d/dist)*mix(0.012,0.025,impact)*env*(8.5*cos(8.5*x)-2.0*sig*x*sin(8.5*x))*gauss;
		ring_foam+=impact*env*exp(-x*x*90.0/(1.0+age*0.9))*smoothstep(0.0,0.15,age);
	}
	vec3 normal=normalize(vec3(-g.x,1.0,-g.y));
	vec3 view=normalize(CAMERA_POSITION_WORLD-world_position);
	float dd=1.0-exp(-depth*0.65);
	vec3 body=mix(shallow_color.rgb,mid_color.rgb,smoothstep(0.0,0.55,dd));
	body=mix(body,deep_color.rgb,smoothstep(0.5,0.98,dd));
	vec2 refract_uv=clamp(SCREEN_UV+g*0.016*smoothstep(0.02,0.6,shoreline),vec2(0.001),vec2(0.999));
	vec3 refracted=textureLod(scene_texture,refract_uv,clamp(depth*0.35,0.0,2.0)).rgb;
	vec3 transmission=exp(-min(depth,8.0)*vec3(0.4,0.08,0.04));
	float caustic=pow(max(0.0,1.0-abs(sin(p.x*3.1+clock*0.55)+sin(p.y*3.7-clock*0.43))),8.0);
	refracted*=1.0+caustic*0.6*exp(-depth*0.25);
	vec3 color=mix(refracted*transmission,body,1.0-exp(-depth*0.7));
	vec3 reflect_dir=reflect(-view,normal);
	vec3 reflection=mix(sky_horizon.rgb,sky_zenith.rgb,pow(max(reflect_dir.y,0.0),0.6));
	float fresnel=0.03+0.97*pow(1.0-max(dot(normal,view),0.0),5.0);
	color=mix(color,reflection,clamp(fresnel,0.0,0.7));
	// Source surface-foam-highlights pond branch (openW=0): narrow lacy edge + one faint lap.
	vec2 lace_position=p*5.2+vec2(clock*0.21,-clock*0.16);
	float fb1=water_noise(p*0.85+vec2(clock*0.05,-clock*0.04));
	float fb2=water_noise(p*2.1-vec2(clock*0.09,clock*0.07));
	float fbm=fb1*0.65+fb2*0.35;
	float lace=water_noise(lace_position)*0.65+water_noise(lace_position*2.3+vec2(5.1))*0.35;
	float edge_width=0.05+0.2*fbm+0.03*sin(clock*1.1+fbm*6.0);
	float sd_aa=max(fwidth(shoreline),0.002);
	float edge=1.0-smoothstep(edge_width*0.35,edge_width+0.03+sd_aa,shoreline);
	float solid=1.0-smoothstep(0.0,0.05,shoreline);
	edge*=mix(0.5+0.5*smoothstep(0.25,0.75,lace),1.0,solid);
	float glow=(1.0-smoothstep(0.0,edge_width+0.35,shoreline))*0.06;
	float phase=fract(clock*0.12+fbm*0.2);
	float lap_distance=shoreline-(0.2+phase*0.9)-(fbm-0.5)*0.25;
	float lap_aa=max(fwidth(lap_distance),0.0001);
	float lap=1.0-smoothstep(0.06,0.1+lap_aa*1.5,abs(lap_distance));
	float alive=smoothstep(0.0,0.15,phase)*(1.0-phase)*(1.0-phase)*(1.0-smoothstep(0.15,0.4,lap_aa));
	float breaks=smoothstep(0.35,0.65,water_noise(p*1.3+vec2(clock*0.05)));
	lap*=alive*breaks*0.35;
	float foam=max(max(edge*0.45,glow),lap);
	foam=max(foam,min(ring_foam,1.0)*0.22);
	color=mix(color,foam_color.rgb,min(foam,0.78));
	vec3 halfway=normalize(sun_direction+view);
	float highlight=pow(max(dot(normal,halfway),0.0),900.0)*0.3;
	color+=vec3(highlight)*mix(1.0,0.18,night);
	float distance_to_camera=length(p-CAMERA_POSITION_WORLD.xz);
	float haze=smoothstep(120.0,1800.0,distance_to_camera)*0.62;
	ALBEDO=mix(color*mix(1.0,0.28,night),sky_horizon.rgb,haze);
}
