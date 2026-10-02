/** Material-aware footsteps and gameplay/UI sound effect handlers. */
import { audioState } from "../state.js";
export function getFootstepSurface(position) {
  if (!position) {
    return `grass`;
  }
  if (audioState.audioGameContext.player?.inWater || audioState.audioGameContext.player?.swimming) {
    return `water`;
  }
  let building2 = audioState.audioGameContext.building;
  let terrain2 = audioState.audioGameContext.terrain;
  for (let result of [-0.05, -0.6]) {
    let x2 = position.x;
    let result2 = position.y + result;
    let z2 = position.z;
    let result3 = building2?.surfaceAt?.(x2, result2, z2);
    if (result3) {
      return result3;
    }
    let result4 = terrain2?.blockAt?.(x2, result2, z2);
    if (result4) {
      let toLowerCaseResult = String(terrain2.blocks?.[result4]?.name ?? ``).toLowerCase();
      return /grass|moss/.test(toLowerCaseResult)
        ? `grass`
        : /sand/.test(toLowerCaseResult) && !/stone/.test(toLowerCaseResult)
          ? `sand`
          : /dirt|clay|path/.test(toLowerCaseResult)
            ? `dirt`
            : /gravel/.test(toLowerCaseResult)
              ? `gravel`
              : /plank|log|wood/.test(toLowerCaseResult)
                ? `wood`
                : `stone`;
    }
  }
  return `grass`;
}
