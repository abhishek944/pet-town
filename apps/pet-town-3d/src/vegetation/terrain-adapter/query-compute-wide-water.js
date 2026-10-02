/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */
export function queryComputeWideWater(adapter) {
  adapter.snapshot.wide = new Uint8Array(adapter.cellCount);
  for (let index20 = 0; index20 < adapter.cellCount; index20++) {
    if (isNaN(adapter.snapshot.water[index20])) {
      continue;
    }
    let result77 = index20 % adapter.columns;
    let result78 = (index20 / adapter.columns) | 0;
    let index21 = 0;
    for (let result79 = -2; result79 <= 2 && !index21; result79++) {
      for (let result80 = -2; result80 <= 2; result80++) {
        let callback6Result6 = adapter.indexAt(result77 + result80, result78 + result79);
        if (
          callback6Result6 >= 0 &&
          adapter.snapshot.landDist[callback6Result6] >= 3 &&
          adapter.snapshot.landDist[callback6Result6] < 255
        ) {
          index21 = 1;
          break;
        }
      }
    }
    adapter.snapshot.wide[index20] = index21;
  }
}
