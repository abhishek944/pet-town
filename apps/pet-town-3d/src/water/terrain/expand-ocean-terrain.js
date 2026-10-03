import { terrainState } from "../../terrain/state.js";
import { OCEAN_MIN_SIZE } from "../layout.js";
import { sampleOceanFloor } from "./sample-ocean-floor.js";
import { measureOceanArea } from "./measure-ocean-area.js";

/** Wrap the land generator; copy its entire grid without changing world coordinates. */
export function expandOceanTerrain(base) {
  const surface = terrainState.terrainWaterLevel;
  const baselineWater = measureOceanArea(base, surface);
  const dryReserve = base.size ** 2 - baselineWater + 2000;
  const size = Math.max(
    base.size,
    OCEAN_MIN_SIZE,
    Math.ceil(Math.sqrt(baselineWater * 3 + dryReserve) / 16) * 16,
  );
  const cells = size * size;
  const height = 40;
  const island = { size, blocks: new Uint8Array(cells * height), expansion: base.expansion };
  const byteFields = ["heights", "surf", "biome", "flags"];
  const floatFields = ["landMask", "smoothHeights"];
  for (const field of byteFields) island[field] = new Uint8Array(cells);
  for (const field of floatFields) island[field] = new Float32Array(cells);
  const fields = [...byteFields, ...floatFields];
  const block = terrainState.terrainBlockIds;
  const shift = (size - base.size) / 2;
  for (let gridZ = 0; gridZ < size; gridZ++) {
    for (let gridX = 0; gridX < size; gridX++) {
      const index = gridZ * size + gridX;
      const offset = index * height;
      const baseX = gridX - shift;
      const baseZ = gridZ - shift;
      if (baseX >= 0 && baseZ >= 0 && baseX < base.size && baseZ < base.size) {
        const original = baseZ * base.size + baseX;
        island.blocks.set(base.blocks.subarray(original * height, (original + 1) * height), offset);
        for (const field of fields) island[field][index] = base[field][original];
        continue;
      }
      const top = sampleOceanFloor(gridX - size / 2 + 0.5, gridZ - size / 2 + 0.5);
      const dry = top > surface;
      const material = dry && top >= 11 ? block.GRASS : block.SAND;
      for (let y = 0; y < top; y++) {
        island.blocks[offset + y] =
          y === top - 1 ? material : y < top - 3 ? block.STONE : block.SAND;
      }
      island.heights[index] = island.smoothHeights[index] = top;
      island.surf[index] = material;
      island.biome[index] = dry ? 2 : 0;
      island.landMask[index] = dry ? 1 : 0;
    }
  }
  const water = measureOceanArea(island, surface);
  island.ocean = {
    baselineSize: base.size,
    size,
    baselineWater,
    water,
    targetWater: baselineWater * 3,
    ratio: baselineWater ? water / baselineWater : 0,
  };
  return island;
}
