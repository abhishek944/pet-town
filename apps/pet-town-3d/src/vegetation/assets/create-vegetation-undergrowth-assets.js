/** Cell registration and construction of the procedural vegetation asset and field libraries. */
import { vegetationState } from "../state.js";
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
import { createBushGeometry } from "../undergrowth-geometry/create-bush-geometry.js";
import { createFernGeometry } from "../undergrowth-geometry/create-fern-geometry.js";
import { createSaplingGeometry } from "../undergrowth-geometry/create-sapling-geometry.js";
import { createCloverGeometry } from "../undergrowth-geometry/create-clover-geometry.js";
import { createMushroomGeometry } from "../undergrowth-geometry/create-mushroom-geometry.js";
import { createReedGeometry } from "../undergrowth-geometry/create-reed-geometry.js";
import { createFallenLogGeometry } from "../undergrowth-geometry/create-fallen-log-geometry.js";
import { createLilyClusterGeometry } from "../lily-geometry/create-lily-cluster-geometry.js";
import { createVegetationGroundQuad } from "../materials/create-vegetation-ground-quad.js";
export function createVegetationUndergrowthAssets(assets) {
  assets.geometry.bush = [0, 1].map(() => createBushGeometry(assets.random));
  assets.geometry.berryRed = [0].map(() =>
    createBushGeometry(assets.random, {
      berries: foliageColorToRgb(`#ff3a4e`),
      berryCount: 5,
    }),
  );
  assets.geometry.berryBlue = [
    createBushGeometry(assets.random, {
      berries: foliageColorToRgb(`#6f82ff`),
      berryCount: 5,
    }),
  ];
  assets.geometry.blossomBush = [
    createBushGeometry(assets.random, {
      blooms: foliageColorToRgb(`#ffe0ec`),
      berryCount: 12,
    }),
  ];
  assets.geometry.fern = [
    createFernGeometry(assets.random),
    createFernGeometry(assets.random, {
      L: 0.5,
    }),
  ];
  assets.geometry.sapling = [
    createSaplingGeometry(assets.random),
    createSaplingGeometry(assets.random),
  ];
  assets.geometry.clover = [
    createCloverGeometry(assets.random),
    createCloverGeometry(assets.random, {
      flowers: true,
    }),
  ];
  assets.geometry.mushRed = [
    createMushroomGeometry(assets.random, {
      count: 3,
    }),
    createMushroomGeometry(assets.random, {
      count: 2,
    }),
  ];
  assets.geometry.mushBrown = [
    createMushroomGeometry(assets.random, {
      count: 3,
      spots: false,
      flat: true,
    }),
  ];
  assets.geometry.mushTall = [
    createMushroomGeometry(assets.random, {
      count: 2,
      spots: false,
      tall: true,
      capR: 0.13,
    }),
  ];
  assets.geometry.reeds = [0, 1].map(() => createReedGeometry(assets.random));
  assets.geometry.log = [0, 1].map(() => createFallenLogGeometry(assets.random));
  assets.geometry.lily = [
    createLilyClusterGeometry(assets.random, {
      palette: 0,
    }),
    createLilyClusterGeometry(assets.random, {
      pads: 3,
      palette: 1,
    }),
    createLilyClusterGeometry(assets.random, {
      palette: 2,
    }),
  ];
  assets.geometry.lilyExt = [0.45, 1.1, 0.45];
  assets.geometry.lilyFlower = [
    createLilyClusterGeometry(assets.random, {
      flower: true,
      palette: 0,
    }),
    createLilyClusterGeometry(assets.random, {
      flower: true,
      pads: 2,
      palette: 1,
    }),
  ];
  assets.geometry.lilyFExt = [0.45, 1.1];
  assets.geometry.blob = createVegetationGroundQuad();
  vegetationState.vegetationRuntimeState.lib = assets.geometry;
}
