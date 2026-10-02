/** Creature bones, jointed legs, jiggle metadata, mesh orientation and extrusion helpers. */
import { lerpCreatureRigColor } from "./lerp-creature-rig-color.js";
export let lerpCreatureRigColorRamp = (value, value2, value3, value4, value5) =>
  value5 < 0.5
    ? lerpCreatureRigColor(value, value2, value3, value5 * 2)
    : lerpCreatureRigColor(value, value3, value4, (value5 - 0.5) * 2);
