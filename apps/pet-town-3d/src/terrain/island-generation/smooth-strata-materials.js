/** Distance-along-polyline sampling and deterministic voxel island generation. */

export function smoothStrataMaterials(island) {
  for (let index28 = 0; index28 < 2; index28++) {
    let byteBuffer5 = new Uint8Array(16);
    for (let index29 = 0; index29 < 40; index29++) {
      for (let index30 = 0; index30 < 128; index30++) {
        for (let index31 = 0; index31 < 128; index31++) {
          let result93 = island.blocks[island.voxelIndex(index31, index29, index30)];
          if (!island.isStrataMaterial(result93)) {
            continue;
          }
          byteBuffer5.fill(0);
          for (let result95 = -1; result95 <= 1; result95++) {
            for (let result96 = -1; result96 <= 1; result96++) {
              let result97 = index31 + result96;
              let result98 = index30 + result95;
              if (result97 < 0 || result98 < 0 || result97 >= 128 || result98 >= 128) {
                continue;
              }
              let result99 = island.blocks[island.voxelIndex(result97, index29, result98)];
              if (island.isStrataMaterial(result99)) {
                byteBuffer5[result99]++;
              }
            }
          }
          let result93Value = result93;
          let result94 = byteBuffer5[result93];
          for (let result100 of island.strataMaterials) {
            if (byteBuffer5[result100] > result94) {
              result94 = byteBuffer5[result100];
              result93Value = result100;
            }
          }
          island.blocks[island.voxelIndex(index31, index29, index30)] = result93Value;
        }
      }
    }
  }
}
