/** Scalar interpolation, angle wrapping and spring integration for the player rig. */
export let lerpPlayerAnimationValue = (value, value2, value3) => value + (value2 - value) * value3;
