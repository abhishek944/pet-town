/** Obstacle-aware opening camera orbit and transition back to gameplay. */
import { hudState } from "../state.js";
export function collectSplashCameraObstacles(position) {
  let values = [];
  let callback = (value, value2, value3) =>
    Math.hypot(value - position.x, value2 - position.z) < value3;
  let options = {
    cottage: 16,
    windmill: 15,
    stall: 5,
    garden: 2.5,
    bridge: 3,
  };
  for (let position2 of hudState.hudContext.props?.list ?? []) {
    if (callback(position2.x, position2.z, 48)) {
      values.push({
        x: position2.x,
        z: position2.z,
        r: (position2.radius ?? 1) + 0.6,
        top: (position2.y ?? position.y) + (options[position2.type] ?? 2.5),
        big: (options[position2.type] ?? 0) >= 15,
      });
    }
  }
  for (let position3 of hudState.hudContext.vegetation?.trees ?? []) {
    if (callback(position3.x, position3.z, 40)) {
      values.push({
        x: position3.x,
        z: position3.z,
        r: (position3.canopyRadius ?? 2) + 0.5,
        top: (position3.y ?? position.y) + (position3.height ?? 6) + 0.5,
      });
    }
  }
  return values;
}
