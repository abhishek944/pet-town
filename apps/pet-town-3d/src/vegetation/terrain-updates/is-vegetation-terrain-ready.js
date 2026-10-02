/** Vegetation rebuilds, terrain subscriptions, dirty-cell resampling and item removal. */
export function isVegetationTerrainReady(terrainValue) {
  let terrain2 = terrainValue.terrain;
  return !(
    !terrain2 ||
    terrain2.ready === false ||
    (typeof terrain2.heightAt != `function` &&
      typeof terrain2.topY != `function` &&
      typeof terrain2.surfaceAt != `function`)
  );
}
