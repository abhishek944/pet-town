/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import { playerState } from "../state.js";
import { getPlayerCameraFrame } from "./get-player-camera-frame.js";
import { samplePlayerNightFactor } from "../materials/sample-player-night-factor.js";
import { updatePlayerMaterialLighting } from "../materials/update-player-material-lighting.js";
import { updatePlayerFoliageFade } from "./update-player-foliage-fade.js";
export function updatePlayerPresentation(
  context,
  character,
  world,
  renderPosition,
  swimming,
  body,
  camera,
  deltaTime,
) {
  {
    let playerNightFactorResult = samplePlayerNightFactor(context);
    updatePlayerMaterialLighting(playerNightFactorResult);
    character.M.blush.opacity = 0.95 - 0.5 * playerNightFactorResult;
  }
  let groundBelowResult = world.groundBelow(
    renderPosition.x,
    renderPosition.y + 0.3,
    renderPosition.z,
    24,
  );
  let enabled = false;
  let waterLevel2 = world.waterLevel;
  if (
    isFinite(waterLevel2) &&
    waterLevel2 > groundBelowResult &&
    waterLevel2 <= renderPosition.y + 0.9
  ) {
    groundBelowResult = waterLevel2;
    enabled = true;
  }
  if (swimming && isFinite(body.waterY)) {
    groundBelowResult = body.waterY;
    enabled = true;
  }
  character.placeShadow(
    renderPosition.x,
    groundBelowResult,
    renderPosition.z,
    renderPosition.y,
    enabled,
  );
  camera.update(deltaTime, getPlayerCameraFrame());
  updatePlayerFoliageFade(context, deltaTime);
  playerState.playerFadeUniform.value = camera.frozen ? 1 : camera.fade;
  character.M.blush.visible = playerState.playerFadeUniform.value > 0.5;
}
