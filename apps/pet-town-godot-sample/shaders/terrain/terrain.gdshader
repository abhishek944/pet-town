shader_type spatial;
#include "../effects/hemisphere.gdshaderinc"
render_mode diffuse_burley, specular_schlick_ggx;
uniform sampler2DArray uAtlas : source_color, filter_linear_mipmap, repeat_enable;
uniform float uBump[64];
uniform float uEmit[64];
uniform float uSeamL[64];
uniform float uBumpScale = 1.0;
uniform float uSeam = 0.12;
uniform float uAODirect = 0.35;
uniform float uDetail = 0.06;
uniform float uRim = 0.12;
uniform float uNight = 0.0;
uniform float uWaterLevel = 7.62;
uniform float uPillow = 1.0;
uniform vec3 uLightDir = vec3(0.5,0.8,0.3);
uniform float L_FRINGE;
uniform float L_PATH_EDGE;
uniform float L_MOSS;
uniform bool is_lip = false;
varying vec3 vGTint;
varying flat float vEdge;
varying vec2 vTUv;
varying vec2 vLUv;
varying flat float vTile;
varying flat float vOver;
varying flat float vDir;
varying float vAO;
varying float vBevel;
varying vec3 vTint;
varying vec3 vWPos;
varying vec3 vWNrm;
#include "atlas.gdshaderinc"
void vertex() {
	float dw = CUSTOM0.w;
	vDir = mod(dw, 8.0);
	vec2 par = vec2(mod(floor(dw/8.0),2.0), floor(dw/16.0));
	vLUv = UV; vTUv = (par + UV)*0.5;
	vTile = CUSTOM0.x; vOver = CUSTOM0.y; vAO = CUSTOM0.z/255.0;
	vTint = COLOR.rgb*2.0; vBevel = COLOR.a;
	vGTint = CUSTOM1.rgb/127.5; vEdge = CUSTOM1.a;
	vWPos = (MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;
	vWNrm = normalize(mat3(MODEL_MATRIX)*NORMAL);
}
void fragment() {
#include "surface.gdshaderinc"
	if (is_lip) {
		vec4 tL = textureGrad(uAtlas,vec3(vTUv,vTile),gDX,gDY);
		if (tL.a*smoothstep(0.3,0.42,vLUv.y)<0.72) { discard; }
		ALBEDO = tL.rgb*vTint;
	}
	ROUGHNESS = 0.93; SPECULAR = 0.5;
	AO = vAO; AO_LIGHT_AFFECT = uAODirect;
	EMISSION = ALBEDO*uEmit[int(vTile+0.5)];
	float bs = uBump[int(vTile+0.5)]*uBumpScale*(1.0-overA);
	if (!is_lip && bs>0.0) {
		float hx=sampleLayer(vTUv+gDX,vTile,gDX,gDY,gTopMix).a-hgt;
		float hy=sampleLayer(vTUv+gDY,vTile,gDX,gDY,gTopMix).a-hgt;
		NORMAL=terrainPerturb(NORMAL,vec2(hx,hy)*bs*0.9,FRONT_FACING?1.0:-1.0,gSX,gSY);
	}
	IRRADIANCE=vec4(source_hemisphere(normalize(mat3(INV_VIEW_MATRIX)*NORMAL)),1.0);
}
