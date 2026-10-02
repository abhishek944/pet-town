/** Generated expression textures, speech bubbles, sleeping symbols and pooled floating icons. */
import { creaturesState } from "../state.js";
export function prepareCreaturesEmotes() {
  creaturesState.creatureEmoteKinds = [
    `heart`,
    `note`,
    `exclaim`,
    `question`,
    `sparkle`,
    `sweat`,
    `leaf`,
    `zzz`,
    `music2`,
    `star`,
  ];
  creaturesState.creatureEmoteBubbleMaterials = null;
  creaturesState.creatureEmoteIconTextures = null;
  creaturesState.creatureSleepTexture = null;
  creaturesState.creatureSleepFadeStart = 9;
  creaturesState.creatureSleepFadeEnd = 12;
  creaturesState.creatureBubbleFadeStart = 14;
  creaturesState.creatureBubbleFadeEnd = 22;
}
