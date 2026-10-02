/** Quality tiers, instance density, visibility updates and dynamic vegetation instances. */
import { vegetationState } from "../state.js";
import { vegetationSmoothstep } from "../random/vegetation-smoothstep.js";
export function updateVegetationVisibility(cameraValue) {
  let camera2 = cameraValue.camera;
  if (!camera2) {
    return;
  }
  let stringResult = String(cameraValue.post?.tier?.name ?? cameraValue.post?.tierName ?? `high`);
  let result =
    vegetationState.vegetationQualityTiers[stringResult] ||
    vegetationState.vegetationQualityTiers.high;
  vegetationState.vegetationRuntimeState.tierName = stringResult;
  let x2 = camera2.position.x;
  let y2 = camera2.position.y;
  let z2 = camera2.position.z;
  let values = [];
  for (let result3 of vegetationState.vegetationRuntimeState.lodChunks) {
    let result4 = Math.max(0, Math.hypot(result3.cx - x2, result3.cz - z2) - result3.r);
    if (!(result4 < result3.field.o.maxDist * result.dist)) {
      if (result3.shown !== false) {
        for (let result6 of result3.meshes) {
          for (let result7 of result6) {
            if (result7) {
              result7.visible = false;
            }
          }
        }
        result3.shown = false;
        result3.dirty = true;
      }
      continue;
    }
    let result5 = result4 < 20 ? 1.5 : result4 < 50 ? 4 : 10;
    let hypotResult = Math.hypot(result3.camX - x2, (result3.camY - y2) * 0.5, result3.camZ - z2);
    if (
      result3.dirty ||
      result3.shown === false ||
      hypotResult > result5 ||
      result3.tier !== stringResult
    ) {
      values.push([result4, result3]);
    }
  }
  values.sort((value, value2) => value[0] - value2[0]);
  let result2 = vegetationState.vegetationRuntimeState.lodBudget ?? 12e3;
  for (let [, result8] of values) {
    if (result2 <= 0) {
      break;
    }
    result8.field.rebucket(result8, x2, y2, z2, result);
    result8.shown = true;
    result2 -= result8.items.length;
  }
  for (let result9 of vegetationState.vegetationRuntimeState.chunkMeshes) {
    let userData2 = result9.userData;
    let result10 = Math.max(
      0,
      Math.hypot(userData2.cx - x2, (userData2.cy - y2) * 0.6, userData2.cz - z2) - userData2.r,
    );
    let result11 = userData2.maxDist == null || result10 < userData2.maxDist * result.dist;
    if (((result9.visible = result11), result11)) {
      if (
        (userData2.shadowDist != null &&
          (result9.castShadow = result10 < userData2.shadowDist * result.dist),
        userData2.lods)
      ) {
        let geo02 = userData2.geo0;
        for (let result12 of userData2.lods) {
          if (result10 >= result12.d * result.dist) {
            geo02 = result12.geo;
          }
        }
        if (result9.geometry !== geo02) {
          result9.geometry = geo02;
        }
      }
      if (userData2.dens) {
        let result13 = result.dens * (1 - 0.45 * vegetationSmoothstep(30, 90, result10));
        result9.count = Math.max(1, Math.ceil(userData2.baseCount * result13));
      }
    }
  }
}
