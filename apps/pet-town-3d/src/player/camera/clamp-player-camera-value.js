/** Follow-camera smoothing, orbit controls, obstruction avoidance and opening dolly. */
export let clampPlayerCameraValue = (value, value2, value3) =>
  value < value2 ? value2 : value > value3 ? value3 : value;
