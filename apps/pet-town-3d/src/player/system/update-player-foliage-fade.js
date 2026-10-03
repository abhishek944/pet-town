/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import { playerState } from "../state.js";
import { isCameraVegetationOccluded } from "../camera-visibility/is-camera-vegetation-occluded.js";
export function updatePlayerFoliageFade(vegetationValue, value) {
  let vegetation2 = vegetationValue.vegetation;
  let cam2 = playerState.playerRuntime.cam;
  let result = vegetation2?.setCameraFade ?? vegetation2?.fadeCanopies;
  if (typeof result != `function` || cam2.frozen) {
    return;
  }
  playerState.playerFoliageFadeTarget.copy(playerState.playerRuntime.renderPos);
  playerState.playerFoliageFadeTarget.y += 0.9;
  let vegetationOccluded = isCameraVegetationOccluded(
    vegetationValue,
    playerState.playerRuntime.world,
    vegetationValue.camera.position,
    playerState.playerFoliageFadeTarget,
  );
  try {
    if (vegetationOccluded) {
      result.call(
        vegetation2,
        vegetationValue.camera.position,
        playerState.playerFoliageFadeTarget,
        1.6,
      );
      playerState.playerRuntime.fadeOn = true;
      playerState.playerRuntime.fadeHold = 0.5;
    } else {
      if (playerState.playerRuntime.fadeOn) {
        playerState.playerRuntime.fadeHold -= value;
        if (playerState.playerRuntime.fadeHold <= 0) {
          result.call(vegetation2, null, null, 0);
          playerState.playerRuntime.fadeOn = false;
        } else {
          result.call(
            vegetation2,
            vegetationValue.camera.position,
            playerState.playerFoliageFadeTarget,
            1.6,
          );
        }
      }
    }
  } catch {}
}
