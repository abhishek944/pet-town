/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import { propsState } from "../state.js";
export function installPropsDebugCamera(context) {
  let params2 = context.params;
  if (typeof window < `u`) {
    window.__propsDebug = {
      list: propsState.propEntries,
      colliders: propsState.propColliders,
      layout: () => propsState.propsRuntime.layout,
      recs: () => propsState.propsRuntime.recs,
    };
  }
  let result = params2?.get?.(`propsDebugCam`);
  let result2 = params2?.get?.(`propsDebugView`);
  let result3 = null;
  if (result) {
    let values = result.split(`,`).map(Number);
    if (values.length >= 6 && values.every(Number.isFinite)) {
      result3 = () => {
        context.camera.position.set(values[0], values[1], values[2]);
        context.camera.lookAt(values[3], values[4], values[5]);
      };
    }
  } else if (result2) {
    let [
      splitResult,
      splitResult2 = `12`,
      splitResult3 = `6`,
      splitResult4 = `25`,
      splitResult5 = `1.5`,
    ] = result2.split(`,`);
    let [splitResult6, splitResult7 = `0`] = splitResult.split(`:`);
    result3 = () => {
      let filterResult = propsState.propEntries.filter(
        (typeValue) => typeValue.type === splitResult6 || typeValue.name === splitResult6,
      );
      let position2 = filterResult[+splitResult7] ??
        filterResult[0] ?? {
          x: propsState.propsApi.plaza?.x ?? 0,
          y: propsState.propsApi.plaza?.y ?? 8,
          z: propsState.propsApi.plaza?.z ?? 0,
          rot: 0,
        };
      let result4 = (position2.rot || 0) + (splitResult4 * Math.PI) / 180;
      context.camera.position.set(
        position2.x + Math.sin(result4) * +splitResult2,
        position2.y + +splitResult3,
        position2.z + Math.cos(result4) * +splitResult2,
      );
      context.camera.lookAt(position2.x, position2.y + +splitResult5, position2.z);
    };
  }
  if (!result3) {
    return;
  }
  let callback = () => {
    result3();
    context.camera.updateMatrixWorld();
  };
  let onBeforeRender2 = context.scene.onBeforeRender;
  context.scene.onBeforeRender = function (...value) {
    onBeforeRender2?.apply(this, value);
    if ((value[2] ?? context.camera) === context.camera) {
      callback();
    }
  };
  propsState.propsRuntime.debug = callback;
}
