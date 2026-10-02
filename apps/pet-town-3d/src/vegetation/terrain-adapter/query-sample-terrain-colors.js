/** Terrain and block classification, height snapshots, shoreline distances, ocean detection, and ground color sampling. */
import * as THREE from "three";
export function querySampleTerrainColors(adapter) {
  let options2 = {
    cell: null,
    fallback: adapter.fallbackGrassColor(),
  };
  try {
    let result21Result2 = adapter.sampleAtlasColors();
    if (!result21Result2 || !adapter.terrain.group) {
      return options2;
    }
    let floatBuffer = new Float32Array(adapter.cellCount * 4);
    let vector = new THREE.Vector3();
    let vector2 = new THREE.Vector3();
    let vector3 = new THREE.Vector3();
    adapter.terrain.group.updateMatrixWorld(true);
    adapter.terrain.group.traverse((isMeshValue) => {
      if (!isMeshValue.isMesh || !isMeshValue.geometry) {
        return;
      }
      let geometry2 = isMeshValue.geometry;
      let position2 = geometry2.attributes.position;
      let normal2 = geometry2.attributes.normal;
      let aTint2 = geometry2.attributes.aTint;
      let aData2 = geometry2.attributes.aData;
      if (!position2 || !normal2 || !aTint2 || !aData2) {
        return;
      }
      let values3 = geometry2.index ? geometry2.index.array : null;
      let result86 = values3 ? values3.length / 3 : position2.count / 3;
      let matrixWorld2 = isMeshValue.matrixWorld;
      for (let index33 = 0; index33 < result86; index33++) {
        let result87 = values3 ? values3[index33 * 3] : index33 * 3;
        let result88 = values3 ? values3[index33 * 3 + 1] : index33 * 3 + 1;
        let result89 = values3 ? values3[index33 * 3 + 2] : index33 * 3 + 2;
        if (
          normal2.getY(result87) < 0.9 ||
          normal2.getY(result88) < 0.9 ||
          normal2.getY(result89) < 0.9
        ) {
          continue;
        }
        vector.fromBufferAttribute(position2, result87).applyMatrix4(matrixWorld2);
        vector2.fromBufferAttribute(position2, result88).applyMatrix4(matrixWorld2);
        vector3.fromBufferAttribute(position2, result89).applyMatrix4(matrixWorld2);
        let result90 = (vector.x + vector2.x + vector3.x) / 3;
        let result91 = (vector.y + vector2.y + vector3.y) / 3;
        let result92 = (vector.z + vector2.z + vector3.z) / 3;
        let callback7Result2 = adapter.cellAt(result90, result92);
        if (
          callback7Result2 < 0 ||
          Math.abs(result91 - adapter.snapshot.h[callback7Result2]) > 0.35
        ) {
          continue;
        }
        let result93 = result21Result2[Math.round(aData2.getX(result87))];
        if (result93) {
          for (let result94 of [result87, result88, result89]) {
            let result95 = 0.55 + 0.45 * (aData2.getZ(result94) / 255);
            floatBuffer[callback7Result2 * 4] += result93[0] * aTint2.getX(result94) * 2 * result95;
            floatBuffer[callback7Result2 * 4 + 1] +=
              result93[1] * aTint2.getY(result94) * 2 * result95;
            floatBuffer[callback7Result2 * 4 + 2] +=
              result93[2] * aTint2.getZ(result94) * 2 * result95;
            floatBuffer[callback7Result2 * 4 + 3] += 1;
          }
        }
      }
    });
    let floatBuffer2 = new Float32Array(adapter.cellCount * 3);
    let index32 = 0;
    for (let index34 = 0; index34 < adapter.cellCount; index34++) {
      let result96 = floatBuffer[index34 * 4 + 3];
      if (result96 > 0) {
        floatBuffer2[index34 * 3] = floatBuffer[index34 * 4] / result96;
        floatBuffer2[index34 * 3 + 1] = floatBuffer[index34 * 4 + 1] / result96;
        floatBuffer2[index34 * 3 + 2] = floatBuffer[index34 * 4 + 2] / result96;
        index32++;
      } else {
        floatBuffer2[index34 * 3] = -1;
      }
    }
    if (index32 > 16) {
      options2.cell = floatBuffer2;
    }
  } catch (result97) {
    console.warn(`[vegetation] terrain colour sampling failed`, result97);
  }
  return options2;
}
