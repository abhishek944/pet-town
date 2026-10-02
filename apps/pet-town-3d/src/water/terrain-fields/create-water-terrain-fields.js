import { createRegionBaker } from "./create-region-baker.js";
import { exposeWaterFields } from "./expose-water-fields.js";
import { createWaterFieldBaker } from "./create-water-field-baker.js";
import { createFieldBlur } from "./create-field-blur.js";
import { createFieldAllocator } from "./create-field-allocator.js";
import { createTerrainBoundsQuery } from "./create-terrain-bounds-query.js";
import { createBlockModeDetector } from "./create-block-mode-detector.js";
/** Terrain-aware bed, coastal distance, openness and river current textures with incremental rebaking. */
import * as THREE from "three";
import { waterState } from "../state.js";
export function createWaterTerrainFields(context, getSurfaceY) {
  const state = {
    context,
    getSurfaceY,
  };
  state.detectBlockMode = createBlockModeDetector(state);
  state.sampleSolidBed = function (value5, value6, value7, value8) {
    if (!state.blockMode) {
      return value7;
    }
    let callbackResult3 = state.getTerrain();
    let callback7 = (value9) =>
      !state.emptyBlockIds.has(callbackResult3.blockAt(value5 + 0.5, value9 + 0.5, value6 + 0.5));
    let result29 = Math.floor(value8 - 0.001);
    if (callback7(result29)) {
      return Math.max(value7, value8 + 0.5);
    }
    for (let result30 = result29 - 1; result30 >= 0; result30--) {
      if (callback7(result30)) {
        return result30 + 1;
      }
    }
    return 0;
  };
  state.findTerrainBounds = createTerrainBoundsQuery(state);
  state.allocateFields = createFieldAllocator(state);
  state.blurField = createFieldBlur(state);
  state.bakeWindow = createWaterFieldBaker(state);
  state.bakeAll = function () {
    if (!state.heightTexture) {
      state.allocateFields();
    }
    state.heightTexture.clearUpdateRanges?.();
    state.waterTexture.clearUpdateRanges?.();
    state.bakeWindow(0, 0, state.rect.w, state.rect.h, 0, 0, state.rect.w, state.rect.h, false);
  };
  state.bakeRegion = createRegionBaker(state);
  state.getTerrain = () => state.context.terrain;
  state.bounds = null;
  state.rect = {
    x: 0,
    z: 0,
    w: 1,
    h: 1,
  };
  state.heightPixels = null;
  state.waterPixels = null;
  state.heightTexture = null;
  state.waterTexture = null;
  state.sampleTerrainTop = (value2, value3) => {
    let callbackResult = state.getTerrain();
    let result26 =
      typeof callbackResult?.topY == `function` ? callbackResult.topY : callbackResult?.heightAt;
    if (!result26) {
      return NaN;
    }
    let result26Result = result26(value2 + 0.5, value3 + 0.5);
    return Number.isFinite(result26Result) ? result26Result : NaN;
  };
  state.blockMode = false;
  state.emptyBlockIds = new Set([0]);
  state.floatLinearSupported =
    !!state.context.renderer?.extensions?.has?.(`OES_texture_float_linear`);
  state.createFieldTexture = (value10, value11, value12) => {
    let dataTexture = new THREE.DataTexture(
      value10,
      value11,
      value12,
      THREE.RGBAFormat,
      state.floatLinearSupported ? THREE.FloatType : THREE.HalfFloatType,
    );
    dataTexture.minFilter = dataTexture.magFilter = THREE.LinearFilter;
    dataTexture.wrapS = dataTexture.wrapT = THREE.ClampToEdgeWrapping;
    dataTexture.generateMipmaps = false;
    dataTexture.colorSpace = ``;
    dataTexture.flipY = false;
    return dataTexture;
  };
  state.blurScratch = null;
  state.fieldIndexAt = (value45, value46) => {
    let result93 = Math.floor(value45) - state.rect.x;
    let result94 = Math.floor(value46) - state.rect.z;
    return result93 < 0 || result94 < 0 || result93 >= state.rect.w || result94 >= state.rect.h
      ? -1
      : result94 * state.rect.w + result93;
  };
  state.bedAt = (value47, value48) => {
    let callback4Result = state.fieldIndexAt(value47, value48);
    return callback4Result < 0
      ? state.getSurfaceY() - waterState.waterFieldDeepDepth
      : state.exactBed[callback4Result];
  };
  state.sampleBilinear = (value49, value50, value51, value52) => {
    let result95 = value50 - state.rect.x - 0.5;
    let result96 = value51 - state.rect.z - 0.5;
    if (result95 < -1 || result96 < -1 || result95 > state.rect.w || result96 > state.rect.h) {
      return value52;
    }
    let result97 = Math.floor(result95);
    let result98 = Math.floor(result96);
    let result99 = result95 - result97;
    let result100 = result96 - result98;
    let callback14 = (value53, value54) =>
      value49[
        Math.min(state.rect.h - 1, Math.max(0, value54)) * state.rect.w +
          Math.min(state.rect.w - 1, Math.max(0, value53))
      ];
    return (
      (callback14(result97, result98) * (1 - result99) +
        callback14(result97 + 1, result98) * result99) *
        (1 - result100) +
      (callback14(result97, result98 + 1) * (1 - result99) +
        callback14(result97 + 1, result98 + 1) * result99) *
        result100
    );
  };
  state.allocateFields();
  state.bakeAll();
  return exposeWaterFields(state);
}
