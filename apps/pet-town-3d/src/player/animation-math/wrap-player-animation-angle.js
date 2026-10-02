/** Scalar interpolation, angle wrapping and spring integration for the player rig. */
export let wrapPlayerAnimationAngle = (value) => {
  for (; value > Math.PI;) {
    value -= 2 * Math.PI;
  }
  for (; value < -Math.PI;) {
    value += 2 * Math.PI;
  }
  return value;
};
