import { generateIslandTerrain } from "../terrain/island-generation/generate-island-terrain.js";
import { terrainState } from "../terrain/state.js";
import { WORLD_SIZE, WORLD_HEIGHT, EXPANSION_STAGE } from "./layout.js";
import { sampleSunmeadow } from "./shape-district.js";
import { sampleWillowmere } from "./shape-willowmere.js";
import { sampleShellhaven } from "./shape-shellhaven.js";

function topOfColumn(blocks, offset) {
  for (let y = WORLD_HEIGHT - 1; y >= 0; y--) if (blocks[offset + y]) return y + 1;
  return 0;
}

/** Embed the original island without moving it, then add fixed authored terrain. */
export function generateExpandedIslandTerrain(seed = 7, stage = EXPANSION_STAGE) {
  const base = generateIslandTerrain(seed);
  const cells = WORLD_SIZE * WORLD_SIZE;
  const half = WORLD_SIZE / 2;
  const island = {
    size: WORLD_SIZE,
    blocks: new Uint8Array(cells * WORLD_HEIGHT),
    heights: new Uint8Array(cells),
    surf: new Uint8Array(cells),
    biome: new Uint8Array(cells),
    flags: new Uint8Array(cells),
    landMask: new Float32Array(cells),
    smoothHeights: new Float32Array(cells),
  };
  const block = terrainState.terrainBlockIds;
  let baselineLand = 0;
  let land = 0;
  for (let gridZ = 0; gridZ < WORLD_SIZE; gridZ++) {
    for (let gridX = 0; gridX < WORLD_SIZE; gridX++) {
      const x = gridX - half;
      const z = gridZ - half;
      const index = gridZ * WORLD_SIZE + gridX;
      const offset = index * WORLD_HEIGHT;
      let height = 1;
      let originalLand = false;
      if (x >= -64 && x < 64 && z >= -64 && z < 64) {
        const baseIndex = (z + 64) * 128 + x + 64;
        const baseOffset = baseIndex * WORLD_HEIGHT;
        island.blocks.set(base.blocks.subarray(baseOffset, baseOffset + WORLD_HEIGHT), offset);
        for (const key of ["heights", "surf", "biome", "flags", "landMask", "smoothHeights"]) {
          island[key][index] = base[key][baseIndex];
        }
        height = topOfColumn(base.blocks, baseOffset);
        originalLand = height >= 8;
        if (originalLand) baselineLand++;
      } else {
        island.blocks[offset] = block.SAND;
        island.surf[index] = block.SAND;
      }
      let addition = stage >= 1 && !originalLand ? sampleSunmeadow(x + 0.5, z + 0.5) : null;
      if (stage >= 2 && !originalLand && !(addition?.height >= 8)) {
        const woodland = sampleWillowmere(x + 0.5, z + 0.5);
        if (woodland && (!addition || woodland.height > addition.height)) addition = woodland;
      }
      if (stage >= 3 && !originalLand && !(addition?.height >= 8)) {
        const coast = sampleShellhaven(x + 0.5, z + 0.5);
        if (coast && (!addition || coast.height > addition.height)) addition = coast;
      }
      if (addition && addition.height > height) {
        height = addition.height;
        const dry = height >= 8;
        const surface = addition.onPath
          ? block.PATH
          : addition.beach || addition.edgeDistance > -3
            ? block.SAND
            : block.GRASS;
        island.blocks.fill(0, offset, offset + WORLD_HEIGHT);
        for (let y = 0; y < height; y++) {
          island.blocks[offset + y] =
            y === height - 1 ? surface : y >= height - 3 ? block.DIRT : block.STONE;
        }
        island.surf[index] = surface;
        island.biome[index] = dry
          ? addition.onPath
            ? 8
            : addition.beach
              ? 1
              : addition.forest
                ? 3
                : 2
          : 0;
        island.flags[index] = addition.onPath ? 8 : 0;
        island.landMask[index] = dry ? 1 : 0;
        island.smoothHeights[index] = height;
      }
      island.heights[index] = height;
      if (height >= 8) land++;
    }
  }
  island.expansion = {
    stage,
    baselineLand,
    land,
    ratio: land / baselineLand,
    targetLand: baselineLand * 3,
    district: stage >= 3 ? "Shellhaven" : stage >= 2 ? "Willowmere" : "Sunmeadow",
  };
  return island;
}
