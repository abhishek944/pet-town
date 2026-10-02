/** Generated expression textures, speech bubbles, sleeping symbols and pooled floating icons. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
import { createCreatureEmoteBubbleTexture } from "./create-creature-emote-bubble-texture.js";
import { createCreatureEmoteIconTexture } from "./create-creature-emote-icon-texture.js";
import { createCreatureSleepTexture } from "./create-creature-sleep-texture.js";
export function initializeCreatureEmoteMaterials() {
  if (!creaturesState.creatureEmoteBubbleMaterials) {
    creaturesState.creatureEmoteBubbleMaterials = {};
    creaturesState.creatureEmoteIconTextures = {};
    for (let result of creaturesState.creatureEmoteKinds) {
      creaturesState.creatureEmoteBubbleMaterials[result] = new THREE.SpriteMaterial({
        map: createCreatureEmoteBubbleTexture(result),
        depthWrite: false,
        transparent: true,
        toneMapped: false,
      });
      creaturesState.creatureEmoteIconTextures[result] = createCreatureEmoteIconTexture(result);
    }
    creaturesState.creatureSleepTexture = createCreatureSleepTexture();
  }
}
