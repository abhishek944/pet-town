/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */
export function queryComputeLandDistance(adapter) {
  adapter.snapshot.landDist = new Uint8Array(adapter.cellCount).fill(255);
  let int32Array3 = new Int32Array(adapter.cellCount);
  let index17 = 0;
  let index18 = 0;
  for (let index19 = 0; index19 < adapter.cellCount; index19++) {
    if (isNaN(adapter.snapshot.water[index19]) && adapter.snapshot.valid[index19]) {
      adapter.snapshot.landDist[index19] = 0;
      int32Array3[index18++] = index19;
    }
  }
  for (; index17 < index18;) {
    let result71 = int32Array3[index17++];
    let result72 = adapter.snapshot.landDist[result71];
    if (result72 >= 12) {
      continue;
    }
    let result73 = result71 % adapter.columns;
    let result74 = (result71 / adapter.columns) | 0;
    for (let [result75, result76] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      let callback6Result5 = adapter.indexAt(result73 + result75, result74 + result76);
      if (callback6Result5 >= 0 && adapter.snapshot.landDist[callback6Result5] > result72 + 1) {
        adapter.snapshot.landDist[callback6Result5] = result72 + 1;
        int32Array3[index18++] = callback6Result5;
      }
    }
  }
}
