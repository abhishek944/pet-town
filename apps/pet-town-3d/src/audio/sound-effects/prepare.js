import { createFeedbackSoundHandlers } from "./feedback-handlers.js";
import { createEditingSoundHandlers } from "./editing-handlers.js";
import { createBuildingSoundHandlers } from "./building-handlers.js";
import { createMovementSoundHandlers } from "./movement-handlers.js";
/** Material-aware footsteps and gameplay/UI sound effect handlers. */
import { audioState } from "../state.js";
export function prepareAudioSoundEffects() {
  audioState.surfaceSoundFrequencies = {
    grass: 3e3,
    leaves: 3200,
    dirt: 900,
    sand: 4200,
    stone: 2300,
    gravel: 2800,
    wood: 1e3,
    glass: 5200,
    water: 1500,
    snow: 1800,
  };
  audioState.soundEffectHandlers = {
    ...createMovementSoundHandlers(),
    ...createBuildingSoundHandlers(),
    ...createEditingSoundHandlers(),
    ...createFeedbackSoundHandlers(),
  };
}
