/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import { renderingState } from "../state.js";
export let blendColorGradeVector = (target, property, weights) => {
  target.set(0, 0, 0);
  for (let result of [`day`, `golden`, `night`]) {
    let result2 = renderingState.timeOfDayColorGrades[result][property];
    target.x += result2[0] * weights[result];
    target.y += result2[1] * weights[result];
    target.z += result2[2] * weights[result];
  }
  return target;
};
