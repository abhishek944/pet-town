import { createTerrainTintSampler } from "./create-terrain-tint-sampler.js";
/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */
/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */
import * as THREE from "three";
import { createSimplexNoise } from "../../math/simplex-noise/create-simplex-noise.js";
import { clampTerrainTint } from "./clamp-terrain-tint.js";
import { terrainState } from "../state.js";
import { createTerrainTextureAtlas } from "../textures/atlas/create-terrain-texture-atlas.js";
import { createTerrainMaterial } from "../material/create-terrain-material.js";
import { createBeveledTerrainMesher } from "../mesher/create-beveled-terrain-mesher.js";
export function initializeTerrainMeshes(state) {
  state.tintNoise = createSimplexNoise(99);
  state.sampleTerrainTint = createTerrainTintSampler(state);
  state.atlas = createTerrainTextureAtlas(state.context.renderer);
  state.material = createTerrainMaterial(state.atlas, {
    waterLevel: terrainState.terrainWaterLevel,
  });
  state.lipMaterial = createTerrainMaterial(state.atlas, {
    waterLevel: terrainState.terrainWaterLevel,
    lip: true,
    shared: state.material,
  });
  state.mesher = createBeveledTerrainMesher(state.world, {
    tint: state.sampleTerrainTint,
    moss: (value20, value21, value22, value23, value24) => {
      let result42 = value24 - value23;
      if (result42 < 2.5) {
        return 0;
      }
      let clampTerrainTintResult6 = clampTerrainTint((value21 - (value24 - 3.2)) / 2.2);
      let clampTerrainTintResult7 = clampTerrainTint(
        (state.tintNoise.fbm2(value20 * 0.085 + 13, value22 * 0.085 - 4, 2) + 0.08) * 2.6,
      );
      let result43 =
        0.75 + 0.25 * state.tintNoise.noise2((value20 + value22) * 0.6, value21 * 0.25);
      return (
        clampTerrainTintResult6 *
        clampTerrainTintResult7 *
        result43 *
        clampTerrainTint((result42 - 2.5) / 2)
      );
    },
    waterY: terrainState.terrainWaterLevel,
    flatBelow: Math.floor(terrainState.terrainWaterLevel - 1.2),
  });
  state.group = new THREE.Group();
  state.group.name = `terrain`;
  state.chunkMeshes = Array(64).fill(null);
  state.lipMeshes = Array(64).fill(null);
  state.createChunkGeometry = (posValue) => {
    let geometry2 = new THREE.BufferGeometry();
    geometry2.setAttribute(`position`, new THREE.BufferAttribute(posValue.pos, 3));
    geometry2.setAttribute(`normal`, new THREE.BufferAttribute(posValue.nor, 3, true));
    geometry2.setAttribute(`aUv`, new THREE.BufferAttribute(posValue.uv, 2, true));
    geometry2.setAttribute(`aData`, new THREE.BufferAttribute(posValue.dat, 4, false));
    geometry2.setAttribute(`aTint`, new THREE.BufferAttribute(posValue.tin, 4, true));
    geometry2.setAttribute(`aGrass`, new THREE.BufferAttribute(posValue.gt, 4, false));
    geometry2.setIndex(new THREE.BufferAttribute(posValue.idx, 1));
    geometry2.computeBoundingBox();
    geometry2.computeBoundingSphere();
    return geometry2;
  };
  state.stats = {
    verts: 0,
    tris: 0,
  };
  for (let index10 = 0; index10 < 8; index10++) {
    for (let index11 = 0; index11 < 8; index11++) {
      state.rebuildChunk(index11, index10);
    }
  }
  state.context.scene.add(state.group);
}
