/** Player felt shading, wrapped lighting, dither fading and day-night material uniforms. */
import { playerState } from "../state.js";
export function updatePlayerMaterialLighting(value2) {
  playerState.playerTintUniform.value.setRGB(1, 1, 1).lerp(playerState.playerNightTint, value2);
  for (let result of playerState.playerStylizedMaterials) {
    let userData2 = result.userData;
    userData2.rim.value = userData2.rimBase * (1 - 0.55 * value2);
    userData2.lift.value = userData2.liftBase * (1 - 0.7 * value2);
    userData2.rimColor.value
      .copy(playerState.playerDayRimColor)
      .lerp(playerState.playerNightRimColor, value2);
    userData2.warm.value = userData2.warmBase * value2;
  }
}
