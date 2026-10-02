/** Cell registration and construction of the procedural vegetation asset and field libraries. */
import { vegetationState } from "../state.js";
import { createVegetationRandom } from "../random/create-vegetation-random.js";
import { createGrassTuftLods } from "../grass-geometry/create-grass-tuft-lods.js";
import { createDuneGrassGeometry } from "../grass-geometry/create-dune-grass-geometry.js";
import { createFlowerGeometry } from "../flower-geometry/create-flower-geometry.js";
export function createVegetationGroundCoverAssets(assets) {
  assets.random = createVegetationRandom(vegetationState.vegetationRuntimeState.seed ^ 2654435769);
  assets.geometry = {};
  assets.geometry.grass = [
    {
      blades: 14,
      hMin: 0.2,
      hMax: 0.36,
      spread: 0.14,
      lean: 0.45,
    },
    {
      blades: 16,
      hMin: 0.24,
      hMax: 0.42,
      spread: 0.17,
      lean: 0.55,
    },
    {
      blades: 15,
      hMin: 0.2,
      hMax: 0.38,
      spread: 0.17,
      lean: 0.75,
      splay: 1.4,
      wMin: 0.05,
      wMax: 0.08,
    },
  ].map((value2) => createGrassTuftLods(assets.random, value2));
  assets.geometry.tall = [
    {
      blades: 18,
      hMin: 0.55,
      hMax: 0.95,
      wMin: 0.035,
      wMax: 0.06,
      spread: 0.24,
      lean: 0.45,
      segs: 3,
      tipMul: [1.22, 1.2, 0.85],
    },
    {
      blades: 16,
      hMin: 0.6,
      hMax: 1.05,
      wMin: 0.035,
      wMax: 0.06,
      spread: 0.26,
      lean: 0.62,
      segs: 3,
      tipMul: [1.22, 1.2, 0.85],
    },
  ].map((value3) => createGrassTuftLods(assets.random, value3));
  assets.geometry.dune = [
    createDuneGrassGeometry(assets.random),
    createDuneGrassGeometry(assets.random),
  ];
  assets.geometry.flower = {};
  for (let result2 of vegetationState.vegetationFlowerTypes) {
    let result3 = Math.floor(assets.random() * 1e9);
    assets.geometry.flower[result2] = [
      createFlowerGeometry(createVegetationRandom(result3), result2, {
        lod: 0,
      }),
      createFlowerGeometry(createVegetationRandom(result3), result2, {
        lod: 1,
      }),
    ];
  }
}
