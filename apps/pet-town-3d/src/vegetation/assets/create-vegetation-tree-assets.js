/** Cell registration and construction of the procedural vegetation asset and field libraries. */
import { vegetationState } from "../state.js";
import { createVegetationRandom } from "../random/create-vegetation-random.js";
import { createBroadleafTreeGeometry } from "../tree-geometry/create-broadleaf-tree-geometry.js";
import { foliageColorToRgb } from "../geometry-helpers/foliage-color-to-rgb.js";
import { createPineTreeGeometry } from "../tree-geometry/create-pine-tree-geometry.js";
import { createPalmTreeGeometry } from "../tree-geometry/create-palm-tree-geometry.js";
export function createVegetationTreeAssets(assets) {
  assets.geometry.oak = [0, 1, 2, 3].map(() => createBroadleafTreeGeometry(assets.random));
  assets.geometry.oakDeep = [0, 1].map(() =>
    createBroadleafTreeGeometry(assets.random, {
      stops: vegetationState.foliageColorRamps.oakDeep,
    }),
  );
  assets.geometry.fruit = [0].map(() =>
    createBroadleafTreeGeometry(assets.random, {
      fruit: true,
      fruitCount: 8,
    }),
  );
  assets.geometry.blossom = [0, 1].map(() =>
    createBroadleafTreeGeometry(assets.random, {
      stops: vegetationState.foliageColorRamps.blossom,
      bark: foliageColorToRgb(`#6e4a3a`),
      sphereBlend: 0.55,
      round: 0.5,
    }),
  );
  assets.geometry.autumn = [0].map(() =>
    createBroadleafTreeGeometry(assets.random, {
      stops: vegetationState.foliageColorRamps.autumn,
      sphereBlend: 0.55,
      round: 0.5,
    }),
  );
  assets.createPineLods = (value4) => {
    let result4 = Math.floor(assets.random() * 1e9);
    let pineTreeGeometryResult = createPineTreeGeometry(createVegetationRandom(result4), value4);
    pineTreeGeometryResult.canopyLod = createPineTreeGeometry(createVegetationRandom(result4), {
      ...value4,
      lodSegs: 12,
    }).canopy;
    pineTreeGeometryResult.canopyLod2 = createPineTreeGeometry(createVegetationRandom(result4), {
      ...value4,
      lodSegs: 8,
    }).canopy;
    return pineTreeGeometryResult;
  };
  assets.geometry.pine = [
    vegetationState.foliageColorRamps.pine,
    vegetationState.foliageColorRamps.pineWarm,
    vegetationState.foliageColorRamps.pine,
    vegetationState.foliageColorRamps.pineCool,
  ].map((value5) =>
    assets.createPineLods({
      stops: value5,
    }),
  );
  assets.geometry.snowPine = [0].map(() =>
    assets.createPineLods({
      snow: true,
    }),
  );
  assets.geometry.palm = [0, 1].map(() => {
    let result5 = Math.floor(assets.random() * 1e9);
    let palmTreeGeometryResult = createPalmTreeGeometry(createVegetationRandom(result5));
    let palmTreeGeometryResult2 = createPalmTreeGeometry(createVegetationRandom(result5), {
      leaflets: 6,
    });
    palmTreeGeometryResult.canopyLod = palmTreeGeometryResult.canopy;
    palmTreeGeometryResult.canopyLod2 = palmTreeGeometryResult2.canopy;
    return palmTreeGeometryResult;
  });
}
