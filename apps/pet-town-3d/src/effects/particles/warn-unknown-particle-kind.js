/** Instanced particle presets, bursts, foliage drift, fireflies, pollen and motes. */
import { effectsState } from "../state.js";
export function warnUnknownParticleKind(kind) {
  if (!effectsState.unknownParticleKinds.has(kind)) {
    effectsState.unknownParticleKinds.add(kind);
    console.warn(
      `[fx] unknown burst kind '${kind}', using 'sparkle'. Kinds:`,
      Object.keys(effectsState.particlePresets).join(`, `),
    );
  }
}
