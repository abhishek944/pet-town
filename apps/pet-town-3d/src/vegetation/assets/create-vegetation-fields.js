/** Cell registration and construction of the procedural vegetation asset and field libraries. */
import { vegetationState } from "../state.js";
import { VegetationInstanceField } from "../instances/vegetation-instance-field.js";
import { VegetationLodField } from "../instances/vegetation-lod-field.js";
export function createVegetationFields() {
  let lib2 = vegetationState.vegetationRuntimeState.lib;
  let materials2 = vegetationState.vegetationRuntimeState.materials;
  let options = {};
  let callback = (value, value2, matValue, value3) => options[value] = new VegetationInstanceField(value, value2, matValue.mat, matValue.depth, value3);
  let callback2 = value4 => ({
    chunk: 16,
    receive: true,
    pad: 1,
    reflect: `never`,
    ...value4
  });
  options.grass = new VegetationLodField(`grass`, lib2.grass, materials2.grass.mat, {
    chunk: 32,
    maxDist: 98,
    lodD: [9, 22],
    thin: [22, 92, .2]
  });
  options.tall = new VegetationLodField(`tall`, lib2.tall, materials2.tall.mat, {
    chunk: 32,
    maxDist: 115,
    lodD: [12, 32],
    thin: [40, 110, .55]
  });
  options.fl = new VegetationLodField(`fl_`, vegetationState.vegetationFlowerTypes.map(value5 => lib2.flower[value5]), materials2.flower.mat, {
    chunk: 32,
    maxDist: 44,
    lodD: [13, 13],
    thin: [20, 44, .5]
  });
  let callback3 = (addValue, value6) => ({
    add: (...value7) => addValue.add(value6, ...value7),
    build() {},
    dispose() {},
    items: []
  });
  lib2.grass.forEach((value8, value9) => options[`grass` + value9] = callback3(options.grass, value9));
  lib2.tall.forEach((value10, value11) => options[`tall` + value11] = callback3(options.tall, value11));
  vegetationState.vegetationFlowerTypes.forEach((value12, value13) => options[`fl_${value12}0`] = callback3(options.fl, value13));
  lib2.dune.forEach((value14, value15) => callback(`dune` + value15, value14, materials2.tall, callback2({
    chunk: 32,
    maxDist: 90
  })));
  for (let result of [`oak`, `oakDeep`, `fruit`, `blossom`, `autumn`, `pine`, `snowPine`, `palm`]) {
    lib2[result].forEach((trunkValue, value16) => {
      let result2 = result === `blossom` || result === `autumn`;
      let result3 = result === `pine` || result === `snowPine`;
      let result4 = result === `palm` ? materials2.frond : result3 ? materials2.pine : result === `autumn` ? materials2.autumn : result2 ? materials2.blossom : materials2.foliage;
      let options2 = {
        chunk: 48,
        cast: false,
        kind: `tree`,
        pad: 6,
        reflect: `never`
      };
      callback(`${result}${value16}_trunk`, trunkValue.trunk, materials2.trunk, options2);
      callback(`${result}${value16}_canopy`, trunkValue.canopy, result4, {
        ...options2,
        lods: trunkValue.canopyLod ? [{
          d: 12,
          geo: trunkValue.canopyLod
        }, {
          d: 34,
          geo: trunkValue.canopyLod2
        }] : null
      });
      if (trunkValue.fringe) {
        callback(`${result}${value16}_fringe`, trunkValue.fringe, result3 ? materials2.fringePine : result === `autumn` ? materials2.fringeAutumn : result2 ? materials2.fringeBlossom : materials2.fringe, {
          chunk: 48,
          cast: false,
          kind: `tree`,
          pad: 6,
          maxDist: 60,
          reflect: `never`
        });
      }
    });
  }
  for (let result5 of [`bush`, `berryRed`, `berryBlue`, `blossomBush`]) {
    lib2[result5].forEach((geoValue, value17) => {
      callback(`${result5}${value17}`, geoValue.geo, materials2.bush, {
        chunk: 32,
        cast: false,
        kind: `bush`,
        pad: 2,
        maxDist: 150,
        reflect: `never`,
        lods: [{
          d: 14,
          geo: geoValue.lod
        }]
      });
      if (geoValue.fringe) {
        callback(`${result5}${value17}_fringe`, geoValue.fringe, materials2.fringeBush, {
          chunk: 32,
          cast: false,
          kind: `bush`,
          pad: 2,
          maxDist: 45,
          reflect: `never`
        });
      }
    });
  }
  lib2.fern.forEach((value18, value19) => callback(`fern` + value19, value18, materials2.under, callback2({
    chunk: 32,
    maxDist: 30
  })));
  lib2.clover.forEach((value20, value21) => callback(`clover` + value21, value20, materials2.under, callback2({
    chunk: 32,
    maxDist: 38
  })));
  lib2.sapling.forEach((value22, value23) => callback(`sapling` + value23, value22, materials2.sapling, {
    chunk: 32,
    pad: 2,
    maxDist: 60,
    reflect: `never`
  }));
  for (let result6 of [`mushRed`, `mushBrown`, `mushTall`]) {
    lib2[result6].forEach((value24, value25) => callback(`${result6}${value25}`, value24, materials2.mush, callback2({
      chunk: 32,
      maxDist: 50
    })));
  }
  lib2.reeds.forEach((value26, value27) => callback(`reeds` + value27, value26, materials2.reed, callback2({
    chunk: 32,
    maxDist: 90,
    refract: true,
    reflect: `always`
  })));
  lib2.log.forEach((geoValue2, value28) => callback(`log` + value28, geoValue2.geo, materials2.log, {
    chunk: 32,
    cast: false,
    kind: `log`,
    pad: 2,
    maxDist: 90,
    reflect: `never`
  }));
  lib2.lily.forEach((value29, value30) => callback(`lily` + value30, value29, materials2.lily, {
    chunk: 32,
    receive: true,
    kind: `lily`,
    pad: 1,
    maxDist: 100,
    reflect: `always`
  }));
  lib2.lilyFlower.forEach((value31, value32) => callback(`lilyF` + value32, value31, materials2.lily, {
    chunk: 32,
    receive: true,
    kind: `lily`,
    pad: 1,
    maxDist: 100,
    reflect: `always`
  }));
  options.blob = new VegetationInstanceField(`blob`, lib2.blob, materials2.blob, null, {
    chunk: 32,
    receive: false,
    renderOrder: 1,
    kind: `blob`,
    pad: 3,
    maxDist: 70,
    reflect: `never`
  });
  return options;
}
