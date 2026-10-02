/** Prop lifecycle, collision and interaction API, terrain reseating, static batches and animated prop effects. */
import { propsState } from "../state.js";
import { samplePropsNightFactor } from "./sample-props-night-factor.js";
import { appendLampGlows } from "../effects/append-lamp-glows.js";
import { reseatDirtyProps } from "./reseat-dirty-props.js";
import { rebuildProps } from "./rebuild-props.js";
import { pollPropsTerrainHeights } from "./poll-props-terrain-heights.js";
import { propsClearVegetationAroundProps } from "./props-clear-vegetation-around-props.js";
export function updateProps(value, cameraValue) {
  propsState.propsRuntime.t += value;
  let propsNightFactorResult = samplePropsNightFactor(cameraValue);
  if (
    ((propsState.propsRuntime.night = propsState.propsApi.night = propsNightFactorResult),
    propsState.propsRuntime.mats)
  ) {
    propsState.propsRuntime.mats.glass.emissiveIntensity = propsNightFactorResult * 1.35;
    propsState.propsRuntime.mats.lamp.emissiveIntensity = 0.1 + propsNightFactorResult * 2.4;
    for (let result of propsState.propsRuntime.mats.bounce ?? []) {
      result.emissiveIntensity = 0.15 * (1 - 0.85 * propsNightFactorResult);
    }
  }
  for (let result2 of propsState.propsRuntime.blades) {
    result2.rotation.z -= value * 0.42;
  }
  let batches2 = propsState.propsRuntime.batches;
  if (batches2) {
    for (let result3 of [`smoke`, `flame`, `glow`]) {
      batches2[result3].begin();
    }
    for (let result4 of propsState.propsRuntime.smokes) {
      result4.update(value, propsState.propsRuntime.t, propsNightFactorResult, batches2);
    }
    for (let result5 of propsState.propsRuntime.fires) {
      result5.update(value, propsState.propsRuntime.t, propsNightFactorResult, batches2);
    }
    appendLampGlows(
      batches2,
      propsState.propsRuntime.halos,
      propsNightFactorResult,
      propsState.propsRuntime.t,
    );
    for (let result6 of [`smoke`, `flame`, `glow`]) {
      batches2[result6].commit();
    }
    batches2.pools.amp = propsNightFactorResult;
  }
  if (
    (propsState.propsRuntime.pool?.update(
      value,
      cameraValue.camera?.position ?? propsState.propsFallbackCameraPosition,
      propsNightFactorResult,
    ),
    propsState.propsRuntime.dirtyIn >= 0 &&
      ((propsState.propsRuntime.dirtyIn -= value), propsState.propsRuntime.dirtyIn < 0))
  ) {
    try {
      reseatDirtyProps();
    } catch (result7) {
      console.error(`[props] reseat failed`, result7);
    }
  }
  if (
    propsState.propsRuntime.rebuildIn >= 0 &&
    ((propsState.propsRuntime.rebuildIn -= value), propsState.propsRuntime.rebuildIn < 0)
  ) {
    try {
      rebuildProps(true);
    } catch (result8) {
      console.error(`[props] rebuild failed`, result8);
    }
  }
  if (((propsState.propsRuntime.pollT -= value), propsState.propsRuntime.pollT <= 0)) {
    propsState.propsRuntime.pollT = 2;
    pollPropsTerrainHeights();
    let length2 = cameraValue.vegetation?.trees?.length;
    if (
      length2 != null &&
      propsState.propsRuntime.vegCount != null &&
      length2 > propsState.propsRuntime.vegCount
    ) {
      propsClearVegetationAroundProps();
    }
  }
  if (propsState.propsRuntime.debug) {
    propsState.propsRuntime.debug();
  }
}
