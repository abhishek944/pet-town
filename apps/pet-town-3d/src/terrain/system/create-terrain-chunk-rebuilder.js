/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */
import * as THREE from "three";
export function createTerrainChunkRebuilder(state) {
  return function (value25, value26) {
    let result44 = value26 * state.chunksPerAxis + value25;
    let Result = state.mesher.build(value25 * 16, value26 * 16, 16);
    let result45 = state.chunkMeshes[result44];
    if (result45) {
      state.stats.verts -= result45.userData.verts;
      state.stats.tris -= result45.userData.tris;
      result45.geometry.dispose();
    }
    let callback4Result = state.createChunkGeometry(Result);
    let result46 = state.lipMeshes[result44];
    if ((result46 && result46.geometry.dispose(), Result.lip)) {
      let callback4Result2 = state.createChunkGeometry(Result.lip);
      if (result46) {
        result46.geometry = callback4Result2;
      } else {
        result46 = new THREE.Mesh(callback4Result2, state.lipMaterial);
        result46.castShadow = false;
        result46.receiveShadow = true;
        result46.name = `lip_${value25}_${value26}`;
        result46.matrixAutoUpdate = false;
        result46.updateMatrix();
        state.lipMeshes[result44] = result46;
        state.group.add(result46);
      }
      result46.visible = true;
    } else {
      if (result46) {
        result46.visible = false;
        result46.geometry = new THREE.BufferGeometry();
      }
    }
    if (result45) {
      result45.geometry = callback4Result;
    } else {
      result45 = new THREE.Mesh(callback4Result, state.material);
      result45.castShadow = true;
      result45.receiveShadow = true;
      result45.name = `chunk_${value25}_${value26}`;
      result45.matrixAutoUpdate = false;
      result45.updateMatrix();
      state.chunkMeshes[result44] = result45;
      state.group.add(result45);
    }
    result45.userData.verts = Result.vertCount;
    result45.userData.tris = Result.idx.length / 3;
    state.stats.verts += Result.vertCount;
    state.stats.tris += Result.idx.length / 3;
  };
}
