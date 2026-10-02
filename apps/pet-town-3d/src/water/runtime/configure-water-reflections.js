import { createReflectionObjectFilter } from "./create-reflection-object-filter.js";
/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */
/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */

import { createWaterPlanarReflection } from "../planar-reflection/create-water-planar-reflection.js";
import { createWaterSceneGrabber } from "../scene-grabber/create-water-scene-grabber.js";
export function configureWaterReflections(state) {
  state.reflectionParameter = state.params.get(`waterRefl`);
  state.reflectClouds = state.params.get(`waterReflClouds`) === `1`;
  state.reflection = createWaterPlanarReflection();
  state.uniforms.uReflTex.value = state.reflection.rt.texture;
  state.camera.layers.enable(7);
  state.reflectionHiddenObjects = [];
  state.reflectionListUpdatedAt = -1;
  state.reflectionGroupPattern = /^(terrain|sky|vegetation|props)$/;
  state.reflectionVegetationPattern =
    /(_trunk|_canopy)\d*$|^veg:(bush|berryRed|berryBlue|blossomBush|reeds|log|lily)\d*$/;
  state.reflectAll = state.params.get(`waterReflAll`) === `1`;
  state.collectReflectionHiddenObjects = createReflectionObjectFilter(state);
  state.sceneGrabber = createWaterSceneGrabber(state.context.renderer);
  state.refractionParameter = state.params.get(`waterRefract`);
  state.refractionMode = null;
  state.grabFailed = false;
  state.setRefractionMode = (value3) => {
    if (value3 === state.refractionMode) {
      return;
    }
    state.refractionMode = value3;
    let result27 = value3 === `grab`;
    state.material.transmission = +!result27;
    state.material.transparent = result27;
    state.material.blending = 0;
    state.material.depthWrite = true;
    state.mesh.renderOrder = result27 ? -500 : 0;
    state.material.needsUpdate = true;
  };
}
