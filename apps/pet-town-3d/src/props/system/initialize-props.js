/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import * as THREE from "three";
import { propsState } from "../state.js";
import { getPropMaterials } from "../materials/get-prop-materials.js";
import { PropLightPool } from "../effects/prop-light-pool.js";
import { createPropEffectBatches } from "../effects/create-prop-effect-batches.js";
import { samplePropWalkHeight } from "./sample-prop-walk-height.js";
import { rebuildProps } from "./rebuild-props.js";
import { invalidatePropsAfterTerrainEdit } from "./invalidate-props-after-terrain-edit.js";
import { installPropsDebugCamera } from "./install-props-debug-camera.js";
export function initializeProps(context) {
  propsState.propsRuntime.ctx = context;
  propsState.propsRuntime.group = new THREE.Group();
  propsState.propsRuntime.group.name = `props`;
  context.scene.add(propsState.propsRuntime.group);
  propsState.propsRuntime.mats = getPropMaterials();
  propsState.propsRuntime.pool = new PropLightPool(propsState.propsRuntime.group, 6);
  propsState.propsRuntime.fireLight = new THREE.PointLight(16747064, 0, 8, 1.2);
  propsState.propsRuntime.fireLight.name = `props_fire_light`;
  propsState.propsRuntime.group.add(propsState.propsRuntime.fireLight);
  propsState.propsRuntime.batches = createPropEffectBatches(propsState.propsRuntime.group);
  context.props = propsState.propsApi;
  if (!Array.isArray(context.walkSurfaces)) {
    context.walkSurfaces = [];
  }
  context.walkSurfaces.push(samplePropWalkHeight);
  try {
    rebuildProps(true);
  } catch (result) {
    console.error(`[props] build failed`, result);
  }
  try {
    if (typeof context.terrain?.onChange == `function`) {
      context.terrain.onChange((value) => invalidatePropsAfterTerrainEdit(value));
    }
  } catch {}
  installPropsDebugCamera(context);
}
