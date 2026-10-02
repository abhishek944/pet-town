/** Skinned mesh batching, per-vertex material properties and shadow proxy extraction. */
export function packCreatureMaterialProperties(bodyValue, value) {
  switch (value) {
    case bodyValue.body:
      return [0.82, 0, 0, 0];
    case bodyValue.glossy:
      return [0.4, 0, 0, 0];
    case bodyValue.fluff:
      return [0.95, 0, 0.55, 0];
    case bodyValue.eye:
      return [0.12, 0, 0, 0];
    case bodyValue.white:
      return [0.3, 1, 0, 0];
    case bodyValue.glow:
      return [0.5, 2, 0, 0];
    case bodyValue.crystal:
      return [0.2, 0, 0, 2.2];
    case bodyValue.bodyLum:
      return [0.82, 0, 0, 1];
    case bodyValue.fluffLum:
      return [0.95, 0, 0.45, 1.2];
    default:
      return null;
  }
}
