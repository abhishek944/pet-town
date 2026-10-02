/** Lineup framing, individual creature inspection and follow-camera debug controls. */
import { creaturesState } from "../state.js";
import { clampCreatureValue } from "../math/clamp-creature-value.js";
import { sampleCreatureTerrainHeight } from "../world/sample-creature-terrain-height.js";
export function updateCreatureDebugCamera(paramsValue) {
  let params2 = paramsValue.params;
  let camera2 = paramsValue.camera;
  if (!camera2 || !params2) {
    return;
  }
  let result = params2.get(`creatureDebugCam`);
  let result2 = params2.get(`creatureFollow`);
  if (result) {
    let values = result.split(`,`).map(Number);
    if (values.length >= 6 && values.every(Number.isFinite)) {
      let lineup2 = creaturesState.creaturesRuntime.lineup;
      let result3 =
        params2.get(`lineupRel`) && lineup2 ? [lineup2.x, lineup2.y, lineup2.z] : [0, 0, 0];
      camera2.position.set(values[0] + result3[0], values[1] + result3[1], values[2] + result3[2]);
      camera2.lookAt(values[3] + result3[0], values[4] + result3[1], values[5] + result3[2]);
    }
  } else if (params2.get(`lineupFocus`) != null && creaturesState.creaturesRuntime.list.length) {
    let result4 =
      creaturesState.creaturesRuntime.list[
        clampCreatureValue(
          Number(params2.get(`lineupFocus`)) | 0,
          0,
          creaturesState.creaturesRuntime.list.length - 1,
        )
      ];
    let result5 =
      Number(params2.get(`focusDist`) ?? 1) *
      Math.max(1.25, result4.def.height * 1.8) *
      result4.size;
    let numberResult = Number(params2.get(`focusAngle`) ?? 0.35);
    let result6 = result4.position.y + result4.def.height * 0.5 * result4.size;
    camera2.position.set(
      result4.position.x + Math.sin(numberResult) * result5,
      result6 + result5 * 0.25,
      result4.position.z + Math.cos(numberResult) * result5,
    );
    camera2.lookAt(result4.position.x, result6, result4.position.z);
  } else if (result2 != null && creaturesState.creaturesRuntime.list.length) {
    let result7 =
      creaturesState.creaturesRuntime.list[
        clampCreatureValue(Number(result2) | 0, 0, creaturesState.creaturesRuntime.list.length - 1)
      ];
    let numberResult2 = Number(params2.get(`followDist`) ?? 3.2);
    let result8 = Number(params2.get(`followAngle`) ?? 0.6) + result7.yaw;
    creaturesState.creatureDebugCameraTarget.set(
      result7.position.x,
      result7.position.y + result7.def.height * 0.5,
      result7.position.z,
    );
    creaturesState.creatureDebugCameraPosition.set(
      result7.position.x + Math.sin(result8) * numberResult2,
      result7.position.y + numberResult2 * 0.45,
      result7.position.z + Math.cos(result8) * numberResult2,
    );
    let creatureTerrainHeightResult = sampleCreatureTerrainHeight(
      creaturesState.creatureDebugCameraPosition.x,
      creaturesState.creatureDebugCameraPosition.z,
    );
    if (
      creatureTerrainHeightResult != null &&
      creaturesState.creatureDebugCameraPosition.y < creatureTerrainHeightResult + 0.8
    ) {
      creaturesState.creatureDebugCameraPosition.y = creatureTerrainHeightResult + 0.8;
    }
    camera2.position.copy(creaturesState.creatureDebugCameraPosition);
    camera2.lookAt(creaturesState.creatureDebugCameraTarget);
  } else if (creaturesState.creaturesRuntime.lineup) {
    let lineup3 = creaturesState.creaturesRuntime.lineup;
    let result9 = (lineup3.perRow - 1) * lineup3.spacing + 1.4;
    let numberResult3 = Number(params2.get(`lineupDist`) ?? Math.max(3.2, result9 * 0.62));
    camera2.position.set(
      lineup3.x,
      lineup3.y + numberResult3 * 0.28 + 0.4,
      lineup3.z + numberResult3,
    );
    camera2.lookAt(
      lineup3.x,
      lineup3.y + 0.42 - (lineup3.rows, 0),
      lineup3.z - (lineup3.rows > 1 ? 0.7 : 0),
    );
  }
}
