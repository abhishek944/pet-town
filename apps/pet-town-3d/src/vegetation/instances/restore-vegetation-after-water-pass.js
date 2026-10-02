/** Vegetation state, fixed and level-of-detail instance fields, and water-pass suppression. */
export function restoreVegetationAfterWaterPass() {
  let userData2 = this.userData;
  if (userData2.savedCount !== undefined) {
    this.count = userData2.savedCount;
    userData2.savedCount = undefined;
  }
}
