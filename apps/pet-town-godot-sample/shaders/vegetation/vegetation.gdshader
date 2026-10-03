shader_type spatial;
#include "../effects/hemisphere.gdshaderinc"
render_mode cull_disabled, diffuse_lambert, specular_disabled;
uniform sampler2D map_texture : source_color, filter_linear_mipmap, repeat_enable;
uniform bool has_map=false;
uniform bool world_map=false;
uniform bool bump=false;
uniform bool toon=false;
uniform bool billboard=false;
uniform bool fade=false;
uniform bool source_double_sided=false;
uniform vec3 base_color=vec3(1.0);
uniform float alpha_test=0.0;
uniform vec3 uWind=vec3(1.0,0.35,1.0);
uniform vec4 uPushers[6];
uniform float uSwayAmp=0.1;
uniform float uSwayFreq=1.7;
uniform float uRustle=0.0;
uniform float uPushAmt=0.0;
uniform vec2 uFade=vec2(100000.0,200000.0);
uniform vec2 uNearFade=vec2(0.0);
uniform float uBob=0.0;
uniform float uPatch=0.0;
uniform float uNormalUp=0.0;
uniform float uTriScale=0.5;
uniform float uRim=0.0;
uniform float uTrans=0.0;
uniform float uSoft=0.0;
uniform float uTipGlow=0.0;
uniform float uBumpAmt=0.1;
uniform float uBumpFreq=2.2;
uniform float uTierTint=1.0;
uniform vec3 uTierScale=vec3(1.0);
uniform float density_tier=1.0;
uniform vec3 density_rule=vec3(100000.0,200000.0,1.0);
uniform vec3 uToonWarm=vec3(1.08,1.05,0.92);
uniform vec3 uToonCool=vec3(0.8,0.88,1.0);
uniform vec3 sun_dir=vec3(0.5,0.8,0.3);
uniform vec3 sun_color=vec3(1.0);
uniform vec3 player_position=vec3(0.0);
varying vec3 world_position;
varying vec3 world_normal;
varying float tint_weight;
varying float sway_weight;
#include "wind.gdshaderinc"
#include "clumps.gdshaderinc"
void vertex() {
	vec3 origin=MODEL_MATRIX[3].xyz;
	world_position=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;
	world_normal=normalize(mat3(MODEL_MATRIX)*NORMAL);
	tint_weight=UV2.y; sway_weight=UV2.x;
	float cam_d=distance(origin,CAMERA_POSITION_WORLD);
	float fade_k=1.0-smoothstep(uFade.x,uFade.y,cam_d);
	if(uNearFade.y>0.0) fade_k*=smoothstep(uNearFade.x,uNearFade.y,cam_d);
	float density_distance=length((origin-CAMERA_POSITION_WORLD)*vec3(1.0,0.6,1.0));
	float density=density_tier*(1.0-(1.0-density_rule.z)*smoothstep(density_rule.x,density_rule.y,density_distance));
	if(INSTANCE_CUSTOM.a>density) fade_k=0.0;
	vec3 disp=vegDisplace(origin,VERTEX,sway_weight);
	VERTEX=(VERTEX*uTierScale+inverse(mat3(MODEL_MATRIX))*disp)*fade_k;
	NORMAL=normalize(mix(NORMAL,vec3(0.0,1.0,0.0),uNormalUp));
	if(billboard) {
		vec3 mv=(MODELVIEW_MATRIX*vec4(VERTEX,1.0)).xyz;
		float facing=abs(dot(normalize(mat3(MODELVIEW_MATRIX)*NORMAL),normalize(-mv)));
		float rim_k=1.0-smoothstep(0.22,0.55,facing);
		vec2 offset=CUSTOM0.xy*CUSTOM0.z*length(MODEL_MATRIX[0].xyz)*fade_k*rim_k;
		VERTEX+=inverse(mat3(MODELVIEW_MATRIX))*vec3(offset,0.0);
	}
	COLOR.rgb*=mix(vec3(1.0),INSTANCE_CUSTOM.rgb,tint_weight)*base_color;
	if(uPatch>0.0) {
		float n1=vegNoise(origin.xz*0.045+3.1),n2=vegNoise(origin.xz*0.17-7.3);
		vec3 pc=mix(vec3(0.88,0.98,0.96),vec3(1.08,1.04,0.84),smoothstep(0.2,0.8,n1))*(0.94+0.12*n2);
		COLOR.rgb*=mix(vec3(1.0),pc,uPatch*tint_weight);
	}
}
void fragment() {
	// Three's vegetation patch cancels its default DoubleSide face-normal flip.
	// Godot also flips cull_disabled backfaces before fragment(); cancel it here.
	if(source_double_sided && !FRONT_FACING) NORMAL=-NORMAL;
	vec3 color=COLOR.rgb;
	if(fade) {
		vec3 ab=player_position-CAMERA_POSITION_WORLD;
		float l=length(ab),along=dot(world_position-CAMERA_POSITION_WORLD,ab)/max(l,0.0001);
		float t=clamp(along/max(l,0.0001),0.0,1.0);
		float d=length(world_position-(CAMERA_POSITION_WORLD+ab*t));
		float k=(1.0-smoothstep(0.45,0.85,d))*(1.0-smoothstep(l+0.15,l+0.45,along));
		vec2 pp=floor(mod(FRAGCOORD.xy,4.0));
		float bayer=(mod(pp.x+2.0*pp.y,4.0)*4.0+mod(pp.x*3.0+pp.y,4.0))/16.0;
		if(k*0.92>bayer+0.03) discard;
	}
	float clump=0.5;
	if(bump) {
		vec3 bp=world_position*uBumpFreq;
		clump=vegCells(bp)*0.78+vegCells(bp*2.6+17.0)*0.22;
	}
	if(has_map) {
		vec4 sampled;
		if(world_map) {
			vec3 bw=pow(abs(normalize(world_normal)),vec3(4.0));bw/=(bw.x+bw.y+bw.z);
			vec3 tp=world_position*uTriScale;
			sampled=texture(map_texture,tp.zy)*bw.x+texture(map_texture,tp.xz+0.37)*bw.y+texture(map_texture,tp.xy+0.71)*bw.z;
		} else { sampled=texture(map_texture,UV); }
		color*=mix(vec3(1.0),sampled.rgb,tint_weight);
		if(sampled.a<alpha_test) discard;
	}
	color*=uTierTint;
	if(bump) {
		color*=mix(vec3(1.0),mix(vec3(0.84,0.88,0.94),vec3(1.06,1.05,0.97),smoothstep(0.1,0.75,clump)),tint_weight);
		float h=clump*uBumpAmt*(1.0-smoothstep(60.0,120.0,length(VERTEX)))/max(uBumpFreq,0.5);
		NORMAL=vegPerturb(VERTEX,NORMAL,vec2(dFdx(h),dFdy(h)),FRONT_FACING?1.0:-1.0);
	}
	vec3 light_view=normalize(mat3(VIEW_MATRIX)*sun_dir);
	if(toon) {
		float band=smoothstep(-0.02,0.22,dot(NORMAL,light_view)+(clump-0.45)*0.35);
		color*=mix(vec3(1.0),mix(uToonCool,uToonWarm,band),tint_weight);
	}
	ALBEDO=color; ROUGHNESS=1.0;
	float ndv=clamp(dot(NORMAL,VIEW),0.0,1.0);
	float rim=pow(1.0-ndv,2.5)*uRim;
	float tip=mix(1.0,clamp(sway_weight*2.4,0.0,1.0),uTipGlow);
	float back=pow(clamp(dot(-VIEW,light_view),0.0,1.0),2.0)*(1.0-0.6*ndv)*uTrans*tip;
	float lit=0.55+0.45*clamp(dot(NORMAL,light_view)*0.5+0.5,0.0,1.0);
	EMISSION=color*sun_color*(rim*lit*tint_weight*tip+back*(0.3+0.7*tint_weight)+uSoft*tint_weight);
	IRRADIANCE=vec4(source_hemisphere(normalize(mat3(INV_VIEW_MATRIX)*NORMAL)),1.0);
}
