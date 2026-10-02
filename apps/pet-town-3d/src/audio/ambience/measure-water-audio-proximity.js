/** Wind, foliage, water, rain and bird/cricket/owl ambient audio. */
import { audioState } from "../state.js";
import { clampAudioValue } from "../state/clamp-audio-value.js";
export function measureWaterAudioProximity() {
  let water2 = audioState.audioGameContext.water;
  let terrain2 = audioState.audioGameContext.terrain;
  let position2 =
    audioState.audioGameContext.player?.position ?? audioState.audioGameContext.camera?.position;
  if (!position2) {
    return 0;
  }
  let result = water2?.isWater
    ? (value, value2) => water2.isWater(value, value2)
    : terrain2?.isWater
      ? (value3, value4) => terrain2.isWater(value3, value4)
      : null;
  if (!result) {
    return 0;
  }
  if (audioState.audioGameContext.player?.inWater) {
    return 1;
  }
  let index = 0;
  for (let result2 of [2.5, 5, 9, 14]) {
    for (let index2 = 0; index2 < 8; index2++) {
      let result3 = (index2 / 8) * Math.PI * 2 + result2;
      try {
        if (
          result(
            position2.x + Math.cos(result3) * result2,
            position2.z + Math.sin(result3) * result2,
          )
        ) {
          index += 1 / result2;
        }
      } catch {}
    }
  }
  return clampAudioValue(index / 2.2, 0, 1);
}
