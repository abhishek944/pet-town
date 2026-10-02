/** Instanced particle presets, bursts, foliage drift, fireflies, pollen and motes. */
import * as THREE from "three";
export function resolveParticleColor(color, target = new THREE.Color()) {
  return color == null
    ? null
    : color.isColor
      ? target.copy(color)
      : Array.isArray(color)
        ? target.setRGB(color[0], color[1], color[2])
        : target.set(color);
}
