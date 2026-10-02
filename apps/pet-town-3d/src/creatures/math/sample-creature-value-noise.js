/** Creature interpolation, deterministic random generation, noise and scalar springs. */
import { hashCreatureCoordinates } from "./hash-creature-coordinates.js";
import { lerpCreatureValue } from "./lerp-creature-value.js";
export function sampleCreatureValueNoise(value, value2, value3) {
  let result = Math.floor(value);
  let result2 = Math.floor(value2);
  let result3 = Math.floor(value3);
  let result4 = value - result;
  let result5 = value2 - result2;
  let result6 = value3 - result3;
  let result7 = result4 * result4 * (3 - 2 * result4);
  let result8 = result5 * result5 * (3 - 2 * result5);
  let result9 = result6 * result6 * (3 - 2 * result6);
  let callback = (value4, value5, value6) =>
    hashCreatureCoordinates(result + value4, result2 + value5, result3 + value6);
  let lerpCreatureValueResult = lerpCreatureValue(callback(0, 0, 0), callback(1, 0, 0), result7);
  let lerpCreatureValueResult2 = lerpCreatureValue(callback(0, 1, 0), callback(1, 1, 0), result7);
  let lerpCreatureValueResult3 = lerpCreatureValue(callback(0, 0, 1), callback(1, 0, 1), result7);
  let lerpCreatureValueResult4 = lerpCreatureValue(callback(0, 1, 1), callback(1, 1, 1), result7);
  return lerpCreatureValue(
    lerpCreatureValue(lerpCreatureValueResult, lerpCreatureValueResult2, result8),
    lerpCreatureValue(lerpCreatureValueResult3, lerpCreatureValueResult4, result8),
    result9,
  );
}
