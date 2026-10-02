/** Postprocessing pipeline configuration, quality tiers, adaptive quality and render targets. */
export function readPostNumericParameter(query, key, fallback) {
  let result = query.get(key);
  return result == null || result === `` ? fallback : parseFloat(result);
}
