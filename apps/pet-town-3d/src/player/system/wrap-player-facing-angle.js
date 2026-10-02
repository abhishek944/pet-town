/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
export let wrapPlayerFacingAngle = (value) => {
  for (; value > Math.PI;) {
    value -= 2 * Math.PI;
  }
  for (; value < -Math.PI;) {
    value += 2 * Math.PI;
  }
  return value;
};
