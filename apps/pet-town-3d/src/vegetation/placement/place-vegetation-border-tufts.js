/** Vegetation clearings, flower palettes and biome-aware world population. */

import { vegetationState } from "../state.js";
import { vegetationHash2d } from "../random/vegetation-hash2d.js";
export function placeVegetationBorderTufts(world) {
  world.scatterBorderTufts = (value33, value34, value35, value36, value37, value38, value39) => {
    for (let index25 = 0; index25 < value37; index25++) {
      let result134 = vegetationHash2d(value38, index25 * 3 + 1, world.seed) * Math.PI * 2;
      let result135 =
        value35 + (value36 - value35) * vegetationHash2d(value38, index25 * 3 + 2, world.seed);
      let result136 = value33 + Math.cos(result134) * result135;
      let result137 = value34 + Math.sin(result134) * result135;
      let cellOfResult7 = world.ground.cellOf(result136, result137);
      if (
        cellOfResult7 < 0 ||
        !world.isLand(cellOfResult7) ||
        !world.isGrass(cellOfResult7) ||
        world.isCleared(result136, result137, `small`) ||
        world.occupied[cellOfResult7] & 6
      ) {
        continue;
      }
      let result138 = vegetationHash2d(value38, index25 * 3 + 3, world.seed) < value39;
      let result139 = result138
        ? world.fields[`tall` + (index25 % vegetationState.vegetationRuntimeState.lib.tall.length)]
        : world.fields[`grass` + (index25 % world.grassVariants)];
      world.groundTint(cellOfResult7, index25 + 40, world.tint);
      world.register(
        result139.add(
          result136,
          world.ground.h[cellOfResult7] - 0.02,
          result137,
          result134,
          result138
            ? 0.7 + 0.2 * vegetationHash2d(value38, index25, world.seed + 1)
            : 0.85 + 0.25 * vegetationHash2d(value38, index25, world.seed + 2),
          null,
          null,
          world.tint,
          {
            rank: vegetationHash2d(value38, index25, world.seed + 3) * 0.3,
          },
        ),
        result136,
        result137,
      );
      if (result138) {
        world.tallGrassCount++;
      } else {
        world.grassCount++;
      }
    }
  };
  for (let position4 of vegetationState.vegetationRuntimeState.trees) {
    if (position4.type !== `palm`) {
      world.scatterBorderTufts(
        position4.x,
        position4.z,
        position4.radius + 0.12,
        position4.radius + 0.6,
        5 + Math.floor(vegetationHash2d(position4.cell, 77, world.seed) * 4),
        position4.cell,
        0.3,
      );
    }
  }
  world.propClearings = vegetationState.vegetationRuntimeState.ctx.props?.clearings;
  if (Array.isArray(world.propClearings)) {
    world.propClearings.forEach((position5, value40) => {
      if (!(
        !position5 ||
        !Number.isFinite(position5.x) ||
        !Number.isFinite(position5.small) ||
        position5.small > 0.8
      )) {
        world.scatterBorderTufts(
          position5.x,
          position5.z,
          position5.small + 0.08,
          position5.small + 0.5,
          7,
          9e4 + value40,
          0.2,
        );
      }
    });
  }
}
