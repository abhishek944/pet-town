/** Cached prop materials and shared color palette. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { PropRandom } from "../math/prop-random.js";
import { createWoodPlankTextureMaps } from "../texture-maps/create-wood-plank-texture-maps.js";
import { createBrickTextureMaps } from "../texture-maps/create-brick-texture-maps.js";
import { createRoofShingleTextureMaps } from "../texture-maps/create-roof-shingle-texture-maps.js";
import { createStoneBlockTextureMaps } from "../texture-maps/create-stone-block-texture-maps.js";
import { createPlasterTextureMaps } from "../texture-maps/create-plaster-texture-maps.js";
import { createRockTextureMaps } from "../texture-maps/create-rock-texture-maps.js";
import { createGardenSoilTextureMaps } from "../texture-maps/create-garden-soil-texture-maps.js";
import { createStripedClothTextureMaps } from "../texture-maps/create-striped-cloth-texture-maps.js";
import { createSailclothTextureMaps } from "../texture-maps/create-sailcloth-texture-maps.js";
import { createWindowTextureMaps } from "../texture-maps/create-window-texture-maps.js";
export function getPropMaterials() {
  if (propsState.propMaterialCache) {
    return propsState.propMaterialCache;
  }
  let propRandom = new PropRandom(1234);
  let options = {
    wood: createWoodPlankTextureMaps(propRandom),
    paint: createWoodPlankTextureMaps(new PropRandom(77), true),
    brick: createBrickTextureMaps(new PropRandom(31)),
    shingle: createRoofShingleTextureMaps(propRandom),
    stone: createStoneBlockTextureMaps(propRandom),
    plaster: createPlasterTextureMaps(propRandom),
    rock: createRockTextureMaps(propRandom),
    soil: createGardenSoilTextureMaps(propRandom),
    cloth: createStripedClothTextureMaps(propRandom),
    sail: createSailclothTextureMaps(propRandom),
    glass: createWindowTextureMaps(),
  };
  let callback = (value) =>
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0,
      ...value,
    });
  let options2 = {
    wood: callback({
      map: options.wood.map,
      bumpMap: options.wood.bump,
      bumpScale: 1.6,
      roughness: 0.78,
    }),
    paint: callback({
      map: options.paint.map,
      bumpMap: options.paint.bump,
      bumpScale: 1.3,
      roughness: 0.62,
    }),
    brick: callback({
      map: options.brick.map,
      bumpMap: options.brick.bump,
      bumpScale: 2,
      roughness: 0.9,
    }),
    ember: callback({
      color: 2759186,
      emissive: 16753716,
      emissiveIntensity: 0.75,
      roughness: 0.9,
    }),
    shingle: callback({
      map: options.shingle.map,
      bumpMap: options.shingle.bump,
      bumpScale: 2.4,
      roughness: 0.72,
    }),
    stone: callback({
      map: options.stone.map,
      bumpMap: options.stone.bump,
      bumpScale: 2.2,
      roughness: 0.9,
    }),
    plaster: callback({
      map: options.plaster.map,
      bumpMap: options.plaster.bump,
      bumpScale: 0.8,
      roughness: 0.95,
    }),
    rock: callback({
      map: options.rock.map,
      bumpMap: options.rock.bump,
      bumpScale: 1.2,
      roughness: 0.88,
    }),
    soil: callback({
      map: options.soil.map,
      bumpMap: options.soil.bump,
      bumpScale: 1.5,
      roughness: 1,
    }),
    cloth: callback({
      map: options.cloth.map,
      side: 2,
      roughness: 0.92,
    }),
    sail: callback({
      map: options.sail.map,
      side: 2,
      roughness: 0.95,
    }),
    metal: callback({
      roughness: 0.42,
      metalness: 0.65,
    }),
    plain: callback({
      roughness: 0.62,
    }),
    leaf: callback({
      roughness: 0.7,
      side: 2,
    }),
    glass: callback({
      map: options.glass.map,
      emissiveMap: options.glass.emissive,
      emissive: 16777215,
      emissiveIntensity: 0,
      roughness: 0.12,
      metalness: 0.1,
    }),
    lamp: callback({
      color: 16773324,
      emissive: 16753722,
      emissiveIntensity: 0.25,
      roughness: 0.3,
    }),
  };
  options2.lamp.userData.noShadow = true;
  options2.glass.userData.noShadow = false;
  options2.collectionGlass = options2.glass.clone();
  Object.assign(options2.collectionGlass, { transparent: true, opacity: 0.32, depthWrite: false });
  options2.collectionGlass.userData.noShadow = true;
  options2.collectionWater = callback({ roughness: 0.16, metalness: 0.18 });
  options2.bounce = [
    options2.plaster,
    options2.wood,
    options2.paint,
    options2.stone,
    options2.brick,
  ];
  for (let result of options2.bounce) {
    result.emissive = new THREE.Color(4860948);
    result.emissiveIntensity = 0.15;
  }
  propsState.propMaterialCache = options2;
  return options2;
}
