/** Instanced particle presets, bursts, foliage drift, fireflies, pollen and motes. */

import { effectsState } from "../state.js";
export function createAmbientParticlePresets() {
  return {
    firefly: {
      count: 1,
      sprite: [effectsState.fxSpriteKinds.GLOW],
      colors: [
        [2.3, 3, 0.65],
        [2.7, 2.7, 0.8],
      ],
      size: [0.16, 0.26],
      sizeEnd: 1,
      life: [6, 10],
      speed: [0.05, 0.25],
      up: [-0.05, 0.1],
      spread: 1,
      gravity: 0,
      drag: 0.2,
      spin: [0, 0],
      alpha: 1,
      add: 1,
      emis: 1,
      sway: 0.9,
      swayF: 0.45,
      blink: 1,
    },
    pollen: {
      count: 1,
      sprite: [effectsState.fxSpriteKinds.DOT],
      colors: [
        [1.25, 1.05, 0.55],
        [1.2, 1.1, 0.6],
      ],
      size: [0.08, 0.13],
      sizeEnd: 1,
      life: [7, 11],
      speed: [0.1, 0.3],
      up: [-0.02, 0.08],
      spread: 1,
      gravity: 0.01,
      drag: 0.15,
      spin: [0, 0],
      alpha: 0.55,
      add: 0.35,
      emis: 0.6,
      sway: 0.6,
      swayF: 0.5,
      glint: 1,
    },
  };
}
