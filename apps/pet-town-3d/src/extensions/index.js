import { createBoatsExtension } from "../boats/extension.js";
/**
 * Import optional features here and add them to this array.
 * Each feature has an id and optional init(context), update(dt, context),
 * and dispose(context) hooks. See ARCHITECTURE.md for a complete example.
 */
import { createPetTownExtension } from "../pet-town/index.js";
import { createWorldExpansionExtension } from "../world-expansion/extension.js";
import { createWaterExploration } from "../water/exploration.js";
import { createWorldAssetsExtension } from "../world-assets/extension.js";

export const gameExtensions = [
  createPetTownExtension(),
  createWorldExpansionExtension(),
  createWaterExploration(),
  createBoatsExtension(),
  createWorldAssetsExtension(),
];
