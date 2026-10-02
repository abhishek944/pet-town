import { createLanternBlockPainter } from "./lantern-painter.js";
import { createFoliageBlockPainters } from "./foliage-painters.js";
import { createMasonryBlockPainters } from "./masonry-painters.js";
import { createTimberBlockPainters } from "./timber-painters.js";
import { createGroundBlockPainters } from "./ground-painters.js";
/** Seeded procedural canvas painting helpers and block-face art. */
import { buildingState } from "../state.js";
export function prepareBuildingTexturePainters() {
  buildingState.blockFacePainters = {
    ...createGroundBlockPainters(),
    ...createTimberBlockPainters(),
    ...createMasonryBlockPainters(),
    ...createFoliageBlockPainters(),
    ...createLanternBlockPainter(),
  };
}
