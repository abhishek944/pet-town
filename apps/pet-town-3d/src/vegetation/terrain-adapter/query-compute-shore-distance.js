/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */
export function queryComputeShoreDistance(adapter) {
  let int32Array = new Int32Array(adapter.cellCount);
  let index9 = 0;
  let index10 = 0;
  adapter.snapshot.shore.fill(255);
  for (let index11 = 0; index11 < adapter.cellCount; index11++) {
    if (!isNaN(adapter.snapshot.water[index11])) {
      adapter.snapshot.shore[index11] = 0;
      int32Array[index10++] = index11;
    }
  }
  for (; index9 < index10;) {
    let result52 = int32Array[index9++];
    let result53 = adapter.snapshot.shore[result52];
    if (result53 >= 12) {
      continue;
    }
    let result54 = result52 % adapter.columns;
    let result55 = (result52 / adapter.columns) | 0;
    for (let [result56, result57] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      let callback6Result2 = adapter.indexAt(result54 + result56, result55 + result57);
      if (callback6Result2 >= 0 && adapter.snapshot.shore[callback6Result2] > result53 + 1) {
        adapter.snapshot.shore[callback6Result2] = result53 + 1;
        int32Array[index10++] = callback6Result2;
      }
    }
  }
}
