import {
  sampleHeartSprite,
  sampleNoteSprite,
  sampleSleepSprite,
  sampleStarSprite,
  sampleSquareSprite,
} from "./symbol-samplers.js";
import {
  sampleLeafSprite,
  samplePetalSprite,
  sampleDropSprite,
  sampleSmokeSprite,
} from "./nature-samplers.js";
import {
  sampleDotSprite,
  sampleSparkleSprite,
  sampleRingSprite,
  sampleGlowSprite,
} from "./glow-samplers.js";
/** Procedural signed-distance sprite atlas for particles, emotes, glow and smoke. */
import { effectsState } from "../state.js";
export function prepareEffectsSpriteAtlas() {
  effectsState.fxSpriteKinds = {
    DOT: 0,
    SPARKLE: 1,
    HEART: 2,
    LEAF: 3,
    PETAL: 4,
    DROP: 5,
    NOTE: 6,
    SMOKE: 7,
    Z: 8,
    STAR: 9,
    RING: 10,
    GLOW: 11,
    SQUARE: 12,
  };
  effectsState.fxAtlasTileSize = 128;
  effectsState.fxAtlasOutlineWidth = 0.1;
  effectsState.fxAtlasShapeSamplers = [
    sampleDotSprite,
    sampleSparkleSprite,
    sampleHeartSprite,
    sampleLeafSprite,
    samplePetalSprite,
    sampleDropSprite,
    sampleNoteSprite,
    sampleSmokeSprite,
    sampleSleepSprite,
    sampleStarSprite,
    sampleRingSprite,
    sampleGlowSprite,
    sampleSquareSprite,
  ];
}
