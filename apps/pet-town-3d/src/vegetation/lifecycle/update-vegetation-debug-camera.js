/** Guarded initialization and per-frame vegetation updates including props, water bobbing, quality and wind. */
import { vegetationState } from "../state.js";
export function updateVegetationDebugCamera(frame) {
  if (vegetationState.vegetationDebugCameraPose === undefined) {
    let result13 = frame.context.params?.get?.(`vegDebugCam`);
    vegetationState.vegetationDebugCameraPose = result13 ? result13.split(`,`).map(Number) : null;
    if (
      vegetationState.vegetationDebugCameraPose &&
      vegetationState.vegetationDebugCameraPose.length < 6
    ) {
      vegetationState.vegetationDebugCameraPose = null;
    }
  }
  if (vegetationState.vegetationDebugCameraPose && frame.context.camera) {
    let vegetationDebugCameraPoseValue = vegetationState.vegetationDebugCameraPose;
    let callback2 = (positionValue) => {
      positionValue.position.set(
        vegetationDebugCameraPoseValue[0],
        vegetationDebugCameraPoseValue[1],
        vegetationDebugCameraPoseValue[2],
      );
      positionValue.lookAt(
        vegetationDebugCameraPoseValue[3],
        vegetationDebugCameraPoseValue[4],
        vegetationDebugCameraPoseValue[5],
      );
      positionValue.updateMatrixWorld();
    };
    if ((callback2(frame.context.camera), !vegetationState.vegetationRuntimeState.debugCamHooked)) {
      vegetationState.vegetationRuntimeState.debugCamHooked = true;
      let onBeforeRender2 = frame.context.scene.onBeforeRender;
      frame.context.scene.onBeforeRender = function (...value7) {
        onBeforeRender2?.apply(this, value7);
        if ((value7[2] ?? frame.context.camera) === frame.context.camera) {
          callback2(frame.context.camera);
        }
      };
    }
  }
}
