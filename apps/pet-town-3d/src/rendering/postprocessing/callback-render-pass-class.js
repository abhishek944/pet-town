/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
import { Pass } from "three/addons/postprocessing/Pass.js";
export let callbackRenderPassClass = class extends Pass {
  constructor(value, value2 = false, value3 = null) {
    super();
    this.fn = value;
    this.needsSwap = value2;
    this.onSize = value3;
  }
  render(value, value2, value3) {
    this.fn(value, value2, value3, this);
  }
  setSize(value, value2) {
    this.onSize?.(value, value2);
  }
};
