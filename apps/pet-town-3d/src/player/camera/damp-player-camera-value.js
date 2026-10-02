/** Follow-camera smoothing, orbit controls, obstruction avoidance and opening dolly. */
export let dampPlayerCameraValue = (value, value2, value3, value4) =>
  value4 > 0 ? value + (value2 - value) * (1 - Math.exp(-value3 * value4)) : value;
