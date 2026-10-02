/** Follow-camera smoothing, orbit controls, obstruction avoidance and opening dolly. */
export let wrapPlayerCameraAngle = (value) => {
  for (; value > Math.PI;) {
    value -= 2 * Math.PI;
  }
  for (; value < -Math.PI;) {
    value += 2 * Math.PI;
  }
  return value;
};
