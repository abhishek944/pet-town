#include <common>
precision highp sampler2DArray;
uniform sampler2DArray uAtlas;
uniform float uBump[64];
uniform float uEmit[64];
uniform float uBumpScale;
uniform float uAODirect;
uniform float uSeam;
uniform float uSeamL[64];
uniform float uWaterLevel;
uniform vec3 uLightDir;
uniform float uNight;
uniform float uDetail;
uniform float uRim;
uniform float uPillow;
uniform float uWarmShadow;
uniform vec3 uFillFix;
const float L_FRINGE =
