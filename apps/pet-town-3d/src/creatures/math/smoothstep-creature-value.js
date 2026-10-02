/** Creature interpolation, deterministic random generation, noise and scalar springs. */
import { clampCreatureValue } from "./clamp-creature-value.js";
export let smoothstepCreatureValue = (value, value2, value3) => {
  let clampCreatureValueResult = clampCreatureValue((value3 - value) / (value2 - value), 0, 1);
  return clampCreatureValueResult * clampCreatureValueResult * (3 - 2 * clampCreatureValueResult);
};
