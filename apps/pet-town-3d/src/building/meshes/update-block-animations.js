/** Selection and preview meshes, skinned block instances, debris and block animations. */
import { buildingState } from "../state.js";
import { easeBlockPop } from "./ease-block-pop.js";
import { applyBuildingBlockState } from "../block-edits/apply-building-block-state.js";
export function updateBlockAnimations(deltaTime) {
  for (let result = buildingState.blockAnimationInstances.length - 1; result >= 0; result--) {
    let result2 = buildingState.blockAnimationInstances[result];
    result2.t += deltaTime;
    let result3 = Math.min(1, result2.t / result2.dur);
    if (result2.kind === `pop`) {
      let result4 = Math.min(1, result2.t / 0.2);
      let easeBlockPopResult = easeBlockPop(result4);
      let result5 = Math.sin(result4 * Math.PI) * 0.12;
      result2.mesh.scale
        .set(
          0.3 + 0.7 * easeBlockPopResult + result5 * 0.5,
          0.3 + 0.7 * easeBlockPopResult - result5,
          0.3 + 0.7 * easeBlockPopResult + result5 * 0.5,
        )
        .multiplyScalar(1.004);
    } else {
      let result6 = 1 - result3 * result3;
      result2.mesh.scale.setScalar(Math.max(0.001, result6));
      result2.mesh.position.y += deltaTime * (1.6 - result3 * 3);
      result2.mesh.rotation.y += result2.spin * deltaTime * 6;
      result2.mesh.rotation.x += result2.spin * deltaTime * 3;
    }
    if (result3 >= 1) {
      buildingState.buildingEffectsGroup.remove(result2.mesh);
      buildingState.blockAnimationInstances.splice(result, 1);
    }
  }
  for (let result7 = buildingState.pendingBlockPlacements.length - 1; result7 >= 0; result7--) {
    let position2 = buildingState.pendingBlockPlacements[result7];
    position2.t -= deltaTime;
    if (position2.t <= 0) {
      buildingState.pendingBlockPlacements.splice(result7, 1);
      applyBuildingBlockState(position2.x, position2.y, position2.z, position2.state);
    }
  }
}
