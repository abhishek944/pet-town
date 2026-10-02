import { createCreatureMouthVolumeTools } from "./create-creature-mouth-volume-tools.js";
import { createCreatureMouthSurfaceTools } from "./create-creature-mouth-surface-tools.js";
import { buildCreatureRestingMouth } from "./build-creature-resting-mouth.js";
import { buildCreatureHappyMouth } from "./build-creature-happy-mouth.js";
/** Surface-conforming eyes, highlights, mouths, blush and expression rigs. */

import { sampleCreatureFaceSurface } from "./sample-creature-face-surface.js";
export function buildCreatureMouth(definition, inkWidth, materials, parent, face) {
  let mouth = definition.mouth;
  if (!(mouth && mouth.style !== `none`)) {
    return;
  }
  let mouthSurface = mouth.surface ?? definition.surface;
  let anchor = sampleCreatureFaceSurface(mouthSurface, mouth.yaw ?? 0, mouth.pitch);
  let width = mouth.w;
  let strokeWidth = mouth.ink ?? inkWidth * 0.85;
  let createOpenMouth, createTongue;
  ({ createOpenMouth, createTongue } = createCreatureMouthVolumeTools.call(this));
  let placeMouth, flattenMouth, createSmile;
  ({ placeMouth, flattenMouth, createSmile } = createCreatureMouthSurfaceTools.call(
    this,
    mouthSurface,
    mouth,
    strokeWidth,
    anchor,
  ));
  buildCreatureRestingMouth.call(
    this,
    mouth,
    placeMouth,
    createOpenMouth,
    width,
    materials,
    flattenMouth,
    mouthSurface,
    anchor,
    strokeWidth,
    createSmile,
    parent,
    face,
  );
  buildCreatureHappyMouth.call(
    this,
    definition,
    createOpenMouth,
    width,
    createTongue,
    placeMouth,
    materials,
    createSmile,
    strokeWidth,
    parent,
    face,
  );
}
