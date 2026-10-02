/** Follow-camera smoothing, orbit controls, obstruction avoidance and opening dolly. */
export function stepPlayerCameraCriticalSpring(value, value2, value3, value4, value5) {
  let result = value - value3;
  let result2 = Math.exp(-value4 * value5);
  let result3 = (value2 + value4 * result) * value5;
  return [value3 + (result + result3) * result2, (value2 - value4 * result3) * result2];
}
