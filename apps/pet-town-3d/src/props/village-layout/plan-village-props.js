/** Deterministic settlement layout, buildings, connecting footpaths, lamps, props and bridge site selection. */
import { chooseVillagePlaza } from "./choose-village-plaza.js";
import { configureVillageBuildingSearch } from "./configure-village-building-search.js";
import { configureVillageCottageSearch } from "./configure-village-cottage-search.js";
import { placeVillageBuildings } from "./place-village-buildings.js";
import { placeVillageSeatingAndBridge } from "./place-village-seating-and-bridge.js";
import { connectVillageEntrances } from "./connect-village-entrances.js";
import { sampleVillageFootpaths } from "./sample-village-footpaths.js";
import { placeVillageFootpathStones } from "./place-village-footpath-stones.js";
import { placeVillageLamps } from "./place-village-lamps.js";
import { configureVillageDecorationSearch } from "./configure-village-decoration-search.js";
import { placeVillageSignsAndMailboxes } from "./place-village-signs-and-mailboxes.js";
import { decorateVillageWindmill } from "./decorate-village-windmill.js";
import { decorateVillageCabin } from "./decorate-village-cabin.js";
import { placeVillageRocks } from "./place-village-rocks.js";
import { appendSunmeadowScenery } from "../../world-expansion/scenery.js";
import { appendWillowmereScenery } from "../../world-expansion/scenery-willowmere.js";
import { appendShellhavenScenery } from "../../world-expansion/scenery-shellhaven.js";
import { applyWorldAssetEdits } from "../../world-assets/apply-edits.js";
export function planVillageProps(context, terrain, seed = 20240) {
  const village = {
    context,
    terrain,
    seed,
  };
  chooseVillagePlaza(village);
  configureVillageBuildingSearch(village);
  configureVillageCottageSearch(village);
  placeVillageBuildings(village);
  placeVillageSeatingAndBridge(village);
  connectVillageEntrances(village);
  sampleVillageFootpaths(village);
  placeVillageFootpathStones(village);
  placeVillageLamps(village);
  configureVillageDecorationSearch(village);
  placeVillageSignsAndMailboxes(village);
  decorateVillageWindmill(village);
  decorateVillageCabin(village);
  placeVillageRocks(village);
  appendSunmeadowScenery(village);
  appendWillowmereScenery(village);
  appendShellhavenScenery(village);
  applyWorldAssetEdits(village);
  return {
    P: village.plaza,
    items: village.items,
    stones: village.stones,
    occ: village.occupied,
    bridge: village.bridge,
    fronts: village.entrances,
    pathSamples: village.pathSamples.flat(),
  };
}
