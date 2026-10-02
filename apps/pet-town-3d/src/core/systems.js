import { terrainState } from "../terrain/state.js";
import { skyState } from "../sky/state.js";
import { waterState } from "../water/state.js";
import { vegetationState } from "../vegetation/state.js";
import { propsState } from "../props/state.js";
import { playerState } from "../player/state.js";
import { creaturesState } from "../creatures/state.js";
import { effectsState } from "../effects/state.js";
import { buildingState } from "../building/state.js";
import { hudState } from "../hud/state.js";
import { audioState } from "../audio/state.js";
import { renderingState } from "../rendering/state.js";

/** Terrain must exist before scenery, actors, editing tools and rendering. */
export function createGameSystems() {
  return [
    ["terrain", terrainState.terrainSystem],
    ["sky", skyState.skySystem],
    ["water", waterState.waterSystem],
    ["vegetation", vegetationState.vegetationSystem],
    ["props", propsState.propsSystem],
    ["player", playerState.playerSystem],
    ["creatures", creaturesState.creaturesSystem],
    ["effects", effectsState.particleEffectsModule],
    ["building", buildingState.buildingModule],
    ["hud", hudState.hudModule],
    ["audio", audioState.audioModule],
    ["postprocessing", renderingState.postprocessingModule],
  ].map(([id, system]) => ({ id, ...system }));
}
