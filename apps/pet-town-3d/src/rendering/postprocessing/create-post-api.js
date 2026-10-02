import { renderingState } from "../state.js";
import { applyRenderingQualityTier } from "./apply-rendering-quality-tier.js";

export function createPostApi(parameters, composer) {
  const state = renderingState.postprocessingState;
  return {
    params: parameters,
    composer,
    get tier() {
      return state.tier;
    },
    get tierName() {
      return state.tier.name;
    },
    setQuality(tierName) {
      const tier = renderingState.renderingQualityTiers[tierName];
      if (tier) {
        state.locked = true;
        applyRenderingQualityTier(tier);
      }
    },
    onTier(listener, { immediate = true } = {}) {
      state.tierListeners.add(listener);
      if (immediate) {
        try {
          listener(state.tier);
        } catch (error) {
          console.warn("[post] onTier listener", error);
        }
      }
      return () => state.tierListeners.delete(listener);
    },
    autoQuality() {
      state.locked = false;
      state.maxTier = "high";
    },
    get targets() {
      return state.T;
    },
    stats: { frameMs: 16.7 },
    get state() {
      return {
        focusY: state.focusY,
        focusDist: state.focusDist,
        under: state.under,
        tier: state.tier.name,
        pr: state.pr,
        samples: state.T.scene?.samples,
        gpuMs: state.gpuT?.ema ?? null,
      };
    },
    TIERS: renderingState.renderingQualityTiers,
  };
}
