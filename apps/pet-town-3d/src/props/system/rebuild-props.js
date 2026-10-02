/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import { initializePropRebuild } from "./initialize-prop-rebuild.js";
import { configurePropRecords } from "./configure-prop-records.js";
import { configurePropColliders } from "./configure-prop-colliders.js";
import { configurePropMetadata } from "./configure-prop-metadata.js";
import { configureSmallPropBuilder } from "./configure-small-prop-builder.js";
import { buildVillageLayoutItems } from "./build-village-layout-items.js";
import { buildVillagePathStones } from "./build-village-path-stones.js";
import { publishPropGeometry } from "./publish-prop-geometry.js";
import { clearVegetationForVillage } from "./clear-vegetation-for-village.js";
import { reportPropBuildStats } from "./report-prop-build-stats.js";
export function rebuildProps(replan) {
  const build = {
    replan,
  };
  initializePropRebuild(build);
  configurePropRecords(build);
  configurePropColliders(build);
  configurePropMetadata(build);
  configureSmallPropBuilder(build);
  buildVillageLayoutItems(build);
  buildVillagePathStones(build);
  publishPropGeometry(build);
  clearVegetationForVillage(build);
  reportPropBuildStats(build);
}
