/** Vegetation clearings, flower palettes and biome-aware world population. */

import { vegetationHash2d } from "../random/vegetation-hash2d.js";
export function placeVegetationDuneTuft(world, cell, x, z) {
  let duneProbability = world.isNearOcean(cell, 3)
    ? 0.16
    : world.ground.shore[cell] >= 2
      ? 0.07
      : 0;
  if (vegetationHash2d(cell, 41, world.seed) < duneProbability) {
    let [jitterX, jitterZ] = world.cellJitter(cell + 3, 0.5);
    if (!world.isCleared(x + jitterX, z + jitterZ, `small`)) {
      world.register(
        world.fields[`dune` + (vegetationHash2d(cell, 49, world.seed) < 0.5 ? 0 : 1)].add(
          x + jitterX,
          world.ground.h[cell] - 0.03,
          z + jitterZ,
          vegetationHash2d(cell, 42, world.seed) * 6.28,
          0.8 + vegetationHash2d(cell, 43, world.seed) * 0.5,
          null,
          null,
          null,
        ),
        x + jitterX,
        z + jitterZ,
      );
      world.duneGrassCount++;
    }
  }
}
