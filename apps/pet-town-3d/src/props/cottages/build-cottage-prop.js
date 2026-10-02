/** Cottage variants, porch and stair layout, cottage geometry and hanging baskets. */
import { configureCottageModel } from "./configure-cottage-model.js";
import { buildCottageFoundation } from "./build-cottage-foundation.js";
import { buildCottageWallFraming } from "./build-cottage-wall-framing.js";
import { buildCottageMainRoof } from "./build-cottage-main-roof.js";
import { buildCottageDormer } from "./build-cottage-dormer.js";
import { buildCottageChimney } from "./build-cottage-chimney.js";
import { buildCottageEntrance } from "./build-cottage-entrance.js";
import { buildCottagePorchDeck } from "./build-cottage-porch-deck.js";
import { buildCottagePorchRoof } from "./build-cottage-porch-roof.js";
import { buildCottageWindows } from "./build-cottage-windows.js";
import { buildCottageBackDoor } from "./build-cottage-back-door.js";
import { buildCottageWoodpile } from "./build-cottage-woodpile.js";
import { buildCottageGardenDetails } from "./build-cottage-garden-details.js";
import { finishCottageMetadata } from "./finish-cottage-metadata.js";
export function buildCottageProp(builder, random, settings = {}) {
  const cottage = {
    builder,
    random,
    settings,
  };
  configureCottageModel(cottage);
  buildCottageFoundation(cottage);
  buildCottageWallFraming(cottage);
  buildCottageMainRoof(cottage);
  buildCottageDormer(cottage);
  buildCottageChimney(cottage);
  buildCottageEntrance(cottage);
  buildCottagePorchDeck(cottage);
  buildCottagePorchRoof(cottage);
  buildCottageWindows(cottage);
  buildCottageBackDoor(cottage);
  buildCottageWoodpile(cottage);
  buildCottageGardenDetails(cottage);
  finishCottageMetadata(cottage);
  return cottage.metadata;
}
