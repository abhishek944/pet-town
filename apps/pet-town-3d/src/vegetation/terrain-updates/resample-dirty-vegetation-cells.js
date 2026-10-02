/** Vegetation rebuilds, terrain subscriptions, dirty-cell resampling and item removal. */
import { vegetationState } from "../state.js";
import { removeVegetationTree } from "./remove-vegetation-tree.js";
import { hideVegetationItem } from "./hide-vegetation-item.js";
import { createVegetationClearingPredicate } from "../placement/create-vegetation-clearing-predicate.js";
import { collectVegetationClearings } from "../placement/collect-vegetation-clearings.js";
import { vegetationHash2d } from "../random/vegetation-hash2d.js";
import { registerVegetationItemCell } from "../assets/register-vegetation-item-cell.js";
export function resampleDirtyVegetationCells() {
  if (
    !vegetationState.vegetationRuntimeState.dirty.size ||
    !vegetationState.vegetationRuntimeState.built
  ) {
    return;
  }
  let ground2 = vegetationState.vegetationRuntimeState.ground;
  let result = Number.isFinite(ground2.waterLevel) ? ground2.waterLevel : -1 / 0;
  for (let result2 of vegetationState.vegetationRuntimeState.dirty) {
    let result3 = ground2.h[result2];
    let result4 = ground2.water[result2];
    let result5 = ground2.top[result2];
    if (
      (ground2.resample(result2),
      !(
        Math.abs(ground2.h[result2] - result3) > 0.01 ||
        Number.isNaN(result4) !== Number.isNaN(ground2.water[result2]) ||
        ground2.top[result2] !== result5
      ))
    ) {
      continue;
    }
    let result6 = vegetationState.vegetationRuntimeState.registry.get(result2);
    if (result6) {
      for (let result7 of result6) {
        if (!result7.hidden) {
          if (result7.owner) {
            if (result7.owner.cell === result2) {
              removeVegetationTree(result7.owner, true);
            } else {
              if (result7.field.name === `blob`) {
                result7.field.hide(result7);
              }
            }
          } else {
            hideVegetationItem(result7);
          }
        }
      }
    }
    if (
      vegetationState.vegetationRuntimeState.dyn &&
      ground2.valid[result2] &&
      Number.isNaN(ground2.water[result2]) &&
      ground2.h[result2] > result + 0.12 &&
      ground2.top[result2] === vegetationState.vegetationSurfaceIds.GRASS
    ) {
      vegetationState.vegetationRuntimeState.sprouts =
        (vegetationState.vegetationRuntimeState.sprouts || 0) + 1;
      if (!vegetationState.vegetationRuntimeState.blockedTest) {
        vegetationState.vegetationRuntimeState.blockedTest = createVegetationClearingPredicate(
          collectVegetationClearings(),
        );
      }
      let result8 =
        2 +
        Math.floor(
          vegetationHash2d(
            result2,
            vegetationState.vegetationRuntimeState.sprouts,
            vegetationState.vegetationRuntimeState.seed + 7,
          ) * 2.5,
        );
      let groundColorResult = ground2.groundColor(
        ground2.cellOf(
          ground2.minX + (result2 % ground2.nx) + 0.5,
          ground2.minZ + ((result2 / ground2.nx) | 0) + 0.5,
        ),
      );
      for (let index = 0; index < result8; index++) {
        let result9 =
          0.14 +
          vegetationHash2d(
            result2,
            900 + index + vegetationState.vegetationRuntimeState.sprouts * 13,
            vegetationState.vegetationRuntimeState.seed,
          ) *
            0.72;
        let result10 =
          0.14 +
          vegetationHash2d(
            result2,
            950 + index + vegetationState.vegetationRuntimeState.sprouts * 17,
            vegetationState.vegetationRuntimeState.seed,
          ) *
            0.72;
        let result11 = ground2.minX + (result2 % ground2.nx) + result9;
        let result12 = ground2.minZ + ((result2 / ground2.nx) | 0) + result10;
        if (vegetationState.vegetationRuntimeState.blockedTest(result11, result12, `small`)) {
          continue;
        }
        let result13 =
          0.95 +
          vegetationHash2d(result2, 990 + index, vegetationState.vegetationRuntimeState.seed) * 0.1;
        let result14 = vegetationState.vegetationRuntimeState.dyn.add(
          result11,
          ground2.h[result2] - 0.02,
          result12,
          vegetationHash2d(result2, 991 + index, vegetationState.vegetationRuntimeState.seed) *
            6.28,
          0.6 +
            vegetationHash2d(result2, 992 + index, vegetationState.vegetationRuntimeState.seed) *
              0.4,
          vegetationState.vegetationInstanceColor.setRGB(
            groundColorResult[0] * result13,
            groundColorResult[1] * result13,
            groundColorResult[2] * result13,
          ),
        );
        if (result14) {
          registerVegetationItemCell(result14, result11, result12);
        }
      }
    }
  }
  vegetationState.vegetationRuntimeState.dirty.clear();
  vegetationState.vegetationRuntimeState.blockedTest = null;
}
