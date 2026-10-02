import { buildCreatureEyes } from "./build-creature-eyes.js";
import { buildCreatureBlush } from "./build-creature-blush.js";
import { buildCreatureMouth } from "./build-creature-mouth.js";
/** Surface-conforming eyes, highlights, mouths, blush and expression rigs. */

import { getCreatureMaterials } from "../materials/get-creature-materials.js";
export function buildCreatureFace(parent, definition) {
  let materials = getCreatureMaterials();
  let face = {
    eyes: [],
    mouth: {},
  };
  let inkWidth;
  ({ inkWidth } = buildCreatureEyes.call(this, definition, materials, parent, face));
  buildCreatureBlush.call(this, materials, definition, parent, face);
  buildCreatureMouth.call(this, definition, inkWidth, materials, parent, face);
  return face;
}
