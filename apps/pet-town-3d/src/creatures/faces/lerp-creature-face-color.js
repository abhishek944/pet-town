/** Surface-conforming eyes, highlights, mouths, blush and expression rigs. */
import { getCreatureColor } from "../geometry/get-creature-color.js";
export let lerpCreatureFaceColor = (copyValue, value, value2, value3) =>
  copyValue
    .copy(getCreatureColor(value))
    .lerp(getCreatureColor(value2), Math.min(1, Math.max(0, value3)));
