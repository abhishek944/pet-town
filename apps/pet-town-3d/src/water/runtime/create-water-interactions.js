/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */
/** Water lifecycle, terrain rebaking, dynamic reflections/refraction, ripples, splashes, and public water API. */

import { insetWaterSurfaceAtBlockBoundary } from "./inset-water-surface-at-block-boundary.js";
import { sampleWaterSwellHeight } from "../swell/sample-water-swell-height.js";
export function createWaterInteractions(state) {
  state.ripple = function (x, z, strength = 1) {
    if (!Number.isFinite(x) || !Number.isFinite(z) || !(strength > 0)) {
      return;
    }
    let slot = 0;
    let oldestTime = 1 / 0;
    for (let candidate = 0; candidate < 32; candidate++) {
      let age = state.time - state.ripples[candidate].z;
      if (state.ripples[candidate].w <= 0 || age > 2.8) {
        slot = candidate;
        break;
      }
      if (state.ripples[candidate].z < oldestTime) {
        oldestTime = state.ripples[candidate].z;
        slot = candidate;
      }
    }
    state.ripples[slot].set(x, z, state.time, strength);
  };
  state.splash = function (position, strength = 1, options = {}) {
    let x = position?.x ?? position?.[0];
    let z = position?.z ?? position?.[2];
    if (!Number.isFinite(x) || !Number.isFinite(z)) {
      return;
    }
    let surfaceY = state.sample(x, z);
    if (options.droplets !== false) {
      state.splashes.spawn(x, surfaceY, z, strength);
    }
    state.ripple(x, z, 1.3 * strength);
    state.pendingRipples.push(
      {
        at: state.time + 0.22,
        x: x,
        z: z,
        s: 0.8 * strength,
      },
      {
        at: state.time + 0.5,
        x: x,
        z: z,
        s: 0.45 * strength,
      },
    );
  };
  state.sampleWaveAmplitude = function (x, z) {
    let depth = Math.max(state.surfaceY - state.heightfield.smoothBedAt(x, z), 0);
    let depthFactor = Math.min(Math.max((depth - 0.15) / 1.45, 0), 1);
    return (
      depthFactor *
      depthFactor *
      (3 - 2 * depthFactor) *
      (1 - 0.6 * state.heightfield.landNearAt(x, z))
    );
  };
  state.sample = function (x, z) {
    return (
      state.surfaceY + sampleWaterSwellHeight(x, z, state.time) * state.sampleWaveAmplitude(x, z)
    );
  };
  state.setLevel = function (level) {
    if (Number.isFinite(level) && level !== state.level) {
      state.level = level;
      state.surfaceY = insetWaterSurfaceAtBlockBoundary(state.level);
      state.api.level = state.level;
      state.api.surfaceY = state.surfaceY;
      state.heightfield.bake();
      state.syncHeightUniforms();
    }
  };
}
