/** Scalar interpolation, angle wrapping and spring integration for the player rig. */
export let clampPlayerAnimationValue = (value, value2, value3) =>
  value < value2 ? value2 : value > value3 ? value3 : value;
