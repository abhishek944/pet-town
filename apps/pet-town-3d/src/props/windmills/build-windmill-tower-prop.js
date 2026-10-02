/** Windmill tower and separately animated sail geometry. */
import { buildWindmillFoundation } from "./build-windmill-foundation.js";
import { buildWindmillWalls } from "./build-windmill-walls.js";
import { buildWindmillDoor } from "./build-windmill-door.js";
import { buildWindmillEntranceSteps } from "./build-windmill-entrance-steps.js";
import { buildWindmillWindows } from "./build-windmill-windows.js";
import { buildWindmillRoof } from "./build-windmill-roof.js";
import { finishWindmillMetadata } from "./finish-windmill-metadata.js";
export function buildWindmillTowerProp(builder, random, settings = {}) {
  const windmill = {
    builder,
    random,
    settings,
  };
  buildWindmillFoundation(windmill);
  buildWindmillWalls(windmill);
  buildWindmillDoor(windmill);
  buildWindmillEntranceSteps(windmill);
  buildWindmillWindows(windmill);
  buildWindmillRoof(windmill);
  finishWindmillMetadata(windmill);
  return windmill.metadata;
}
