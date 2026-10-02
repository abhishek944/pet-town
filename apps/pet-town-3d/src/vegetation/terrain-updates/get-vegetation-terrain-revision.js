/** Vegetation rebuilds, terrain subscriptions, dirty-cell resampling and item removal. */
export function getVegetationTerrainRevision(value) {
  if (!value) {
    return null;
  }
  for (let result of [`version`, `revision`, `rev`, `generation`, `seed`]) {
    if (typeof value[result] == `number` || typeof value[result] == `string`) {
      return result + `:` + value[result];
    }
  }
  return null;
}
