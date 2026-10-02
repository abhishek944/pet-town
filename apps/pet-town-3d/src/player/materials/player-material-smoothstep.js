/** Player felt shading, wrapped lighting, dither fading and day-night material uniforms. */
export let playerMaterialSmoothstep = (value, value2, value3) => {
  let result = Math.min(1, Math.max(0, (value3 - value) / (value2 - value)));
  return result * result * (3 - 2 * result);
};
