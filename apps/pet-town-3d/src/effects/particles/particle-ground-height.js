/** Instanced particle presets, bursts, foliage drift, fireflies, pollen and motes. */
export function particleGroundHeight(context, x, z) {
  let terrain2 = context.terrain;
  let result = terrain2?.topY?.(x, z) ?? terrain2?.heightAt?.(x, z);
  return Number.isFinite(result) ? result : 0;
}
