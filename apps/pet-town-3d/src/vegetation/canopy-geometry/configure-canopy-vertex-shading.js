/** Canopy surface intersections, rounded clumps and silhouette fringe cards. */

import { sampleFoliageColorRamp } from "../geometry-helpers/sample-foliage-color-ramp.js";
import { foliageSmoothstep } from "../geometry-helpers/foliage-smoothstep.js";
import { multiplyFoliageRgb } from "../geometry-helpers/multiply-foliage-rgb.js";
import { clampFoliageUnit } from "../geometry-helpers/clamp-foliage-unit.js";
export function configureCanopyVertexShading(canopy) {
  canopy.shadeVertex = (yValue2, cloneValue2, value10) => {
    canopy.radialNormal.copy(yValue2).sub(canopy.normalOrigin);
    let lengthResult = canopy.radialNormal.length();
    canopy.radialNormal.normalize();
    let normalizeResult = cloneValue2
      .clone()
      .lerp(canopy.radialNormal, canopy.sphereBlend)
      .normalize();
    let result16 = (yValue2.y - canopy.bottomY) / (canopy.topY - canopy.bottomY);
    let foliageColorRampResult = sampleFoliageColorRamp(canopy.colorStops, result16);
    let foliageSmoothstepResult = foliageSmoothstep(0.25, 1.05, lengthResult / canopy.radius);
    let result17 = canopy.aoMin + (1 - canopy.aoMin) * foliageSmoothstepResult;
    result17 *= 0.8 + 0.2 * foliageSmoothstep(-0.7, 0.5, normalizeResult.y);
    result17 *= 1 - 0.16 * value10;
    foliageColorRampResult = multiplyFoliageRgb(foliageColorRampResult, result17);
    let foliageSmoothstepResult2 = foliageSmoothstep(0, 1, result16);
    foliageColorRampResult = [
      foliageColorRampResult[0] *
        (0.74 + 0.38 * foliageSmoothstepResult2) *
        (1 + 0.05 * foliageSmoothstepResult2),
      foliageColorRampResult[1] * (0.76 + 0.34 * foliageSmoothstepResult2),
      foliageColorRampResult[2] *
        (0.84 + 0.2 * foliageSmoothstepResult2) *
        (1 - 0.06 * foliageSmoothstepResult2),
    ];
    let result18 =
      canopy.swayBase *
      (0.55 + 0.45 * clampFoliageUnit(result16)) *
      (1 + (0.15 * lengthResult) / canopy.radius);
    return {
      c: foliageColorRampResult,
      s: result18,
      t: 1,
      n: normalizeResult,
    };
  };
}
