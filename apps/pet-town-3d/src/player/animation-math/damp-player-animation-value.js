/** Scalar interpolation, angle wrapping and spring integration for the player rig. */
export let dampPlayerAnimationValue = (value, value2, value3, value4) =>
  value4 > 0 ? value + (value2 - value) * (1 - Math.exp(-value3 * value4)) : value;
