/** Vegetation state, fixed and level-of-detail instance fields, and water-pass suppression. */
import { getVegetationRenderPass } from "./get-vegetation-render-pass.js";
export function hideVegetationForWaterPass(value) {
  let userData2 = this.userData;
  let vegetationRenderPassResult = getVegetationRenderPass(value);
  if (
    (vegetationRenderPassResult === 1 && !userData2.refract) ||
    (vegetationRenderPassResult === 2 &&
      (userData2.reflect === `never` ||
        (userData2.reflect === `nearWater` && !userData2.nearWater)))
  ) {
    userData2.savedCount = this.count;
    this.count = 0;
  }
}
