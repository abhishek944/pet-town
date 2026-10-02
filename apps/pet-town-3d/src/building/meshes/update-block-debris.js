/** Selection and preview meshes, skinned block instances, debris and block animations. */
import { buildingState } from "../state.js";
import { isBuildingBlockSolid } from "../terrain-adapter/is-building-block-solid.js";
export function updateBlockDebris(deltaTime) {
  for (let result = buildingState.blockDebrisParticles.length - 1; result >= 0; result--) {
    let result2 = buildingState.blockDebrisParticles[result];
    if (((result2.life += deltaTime), result2.life > result2.max)) {
      buildingState.blockDebrisParticles.splice(result, 1);
      continue;
    }
    result2.v.y -= 22 * deltaTime;
    result2.p.addScaledVector(result2.v, deltaTime);
    result2.r.addScaledVector(result2.w, deltaTime);
    let result3 = Math.floor(result2.p.y - result2.s / 2);
    if (
      result2.v.y < 0 &&
      result2.p.y - result2.s / 2 - result3 < 0.3 &&
      isBuildingBlockSolid(Math.floor(result2.p.x), result3, Math.floor(result2.p.z))
    ) {
      result2.p.y = result3 + 1 + result2.s / 2;
      result2.v.y *= -0.35;
      result2.v.x *= 0.6;
      result2.v.z *= 0.6;
      result2.w.multiplyScalar(0.5);
    }
  }
  let index = 0;
  for (let result4 of buildingState.blockDebrisParticles) {
    let result5 = 1 - Math.max(0, (result4.life - result4.max * 0.55) / (result4.max * 0.45));
    buildingState.buildingScaleScratch.setScalar(result4.s * result5 * result5);
    buildingState.buildingTransformScratch.compose(
      result4.p,
      buildingState.buildingQuaternionScratch.setFromEuler(
        buildingState.buildingEulerScratch.set(result4.r.x, result4.r.y, result4.r.z),
      ),
      buildingState.buildingScaleScratch,
    );
    buildingState.blockDebrisMesh.setMatrixAt(index, buildingState.buildingTransformScratch);
    buildingState.blockDebrisMesh.setColorAt(index, result4.c);
    index++;
  }
  buildingState.blockDebrisMesh.count = index;
  buildingState.blockDebrisMesh.instanceMatrix.needsUpdate = true;
  if (buildingState.blockDebrisMesh.instanceColor) {
    buildingState.blockDebrisMesh.instanceColor.needsUpdate = true;
  }
}
