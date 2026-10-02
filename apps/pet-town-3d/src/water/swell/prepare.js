/** Shared CPU and GLSL swell wave parameters and height sampling. */
import { waterState } from "../state.js";
import { formatWaterGlslNumber } from "./format-water-glsl-number.js";
export function prepareWaterSwell() {
  waterState.waterSwellWaves = [
    {
      dir: [0.82, 0.57],
      len: 11,
      amp: 0.045,
      speed: 0.95,
    },
    {
      dir: [-0.45, 0.89],
      len: 6.3,
      amp: 0.028,
      speed: 1.25,
    },
    {
      dir: [0.28, -0.96],
      len: 3.9,
      amp: 0.014,
      speed: 1.6,
    },
    {
      dir: [-0.93, -0.36],
      len: 15,
      amp: 0.035,
      speed: 0.7,
    },
  ].map((dirValue) => {
    let hypotResult = Math.hypot(dirValue.dir[0], dirValue.dir[1]);
    return {
      dx: dirValue.dir[0] / hypotResult,
      dz: dirValue.dir[1] / hypotResult,
      k: (Math.PI * 2) / dirValue.len,
      amp: dirValue.amp,
      speed: dirValue.speed,
    };
  });
  waterState.waterSwellShader = `
vec3 swell(vec2 p, float t) {
  vec3 r = vec3(0.0);
  float ph; float c;
${waterState.waterSwellWaves.map(
  (
    dxValue,
  ) => `  ph = dot(vec2(${formatWaterGlslNumber(dxValue.dx)}, ${formatWaterGlslNumber(dxValue.dz)}), p) * ${formatWaterGlslNumber(dxValue.k)} - t * ${formatWaterGlslNumber(dxValue.speed)};
  c = cos(ph) * ${formatWaterGlslNumber(dxValue.amp * dxValue.k)};
  r += vec3(sin(ph) * ${formatWaterGlslNumber(dxValue.amp)}, c * ${formatWaterGlslNumber(dxValue.dx)}, c * ${formatWaterGlslNumber(dxValue.dz)});`,
).join(`
`)}
  return r;
}`;
}
