/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */
export function queryComputeOceanDistance(adapter) {
  adapter.snapshot.ocean = new Uint8Array(adapter.cellCount);
  adapter.snapshot.oceanShore = new Uint8Array(adapter.cellCount).fill(255);
  let int32Array2 = new Int32Array(adapter.cellCount);
  let index12 = 0;
  let index13 = 0;
  let enabled2 = false;
  for (let index14 = 0; index14 < adapter.cellCount; index14++) {
    if (adapter.snapshot.waterTag[index14] === 1) {
      enabled2 = true;
      break;
    }
  }
  for (let index15 = 0; index15 < adapter.cellCount; index15++) {
    let result58 = index15 % adapter.columns;
    let result59 = (index15 / adapter.columns) | 0;
    if (!isNaN(adapter.snapshot.water[index15])) {
      if (
        enabled2
          ? adapter.snapshot.waterTag[index15] === 1
          : result58 === 0 ||
            result59 === 0 ||
            result58 === adapter.columns - 1 ||
            result59 === adapter.rows - 1
      ) {
        adapter.snapshot.ocean[index15] = 1;
        int32Array2[index13++] = index15;
      }
    }
  }
  for (; index12 < index13;) {
    let result60 = int32Array2[index12++];
    let result61 = result60 % adapter.columns;
    let result62 = (result60 / adapter.columns) | 0;
    for (let [result63, result64] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      let callback6Result3 = adapter.indexAt(result61 + result63, result62 + result64);
      if (
        callback6Result3 >= 0 &&
        !adapter.snapshot.ocean[callback6Result3] &&
        !isNaN(adapter.snapshot.water[callback6Result3]) &&
        adapter.snapshot.waterTag[callback6Result3] < 2
      ) {
        adapter.snapshot.ocean[callback6Result3] = 1;
        int32Array2[index13++] = callback6Result3;
      }
    }
  }
  adapter.snapshot.hasOcean = index13 > 0;
  index12 = 0;
  index13 = 0;
  for (let index16 = 0; index16 < adapter.cellCount; index16++) {
    if (adapter.snapshot.ocean[index16]) {
      adapter.snapshot.oceanShore[index16] = 0;
      int32Array2[index13++] = index16;
    }
  }
  for (; index12 < index13;) {
    let result65 = int32Array2[index12++];
    let result66 = adapter.snapshot.oceanShore[result65];
    if (result66 >= 16) {
      continue;
    }
    let result67 = result65 % adapter.columns;
    let result68 = (result65 / adapter.columns) | 0;
    for (let [result69, result70] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      let callback6Result4 = adapter.indexAt(result67 + result69, result68 + result70);
      if (callback6Result4 >= 0 && adapter.snapshot.oceanShore[callback6Result4] > result66 + 1) {
        adapter.snapshot.oceanShore[callback6Result4] = result66 + 1;
        int32Array2[index13++] = callback6Result4;
      }
    }
  }
}
