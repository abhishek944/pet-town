/** Creature bones, jointed legs, jiggle metadata, mesh orientation and extrusion helpers. */
import { getCreatureColor } from "../geometry/get-creature-color.js";
import { clampCreatureValue } from "../math/clamp-creature-value.js";
export let lerpCreatureRigColor = (copyValue, value, value2, value3) =>
  copyValue
    .copy(getCreatureColor(value))
    .lerp(getCreatureColor(value2), clampCreatureValue(value3, 0, 1));
