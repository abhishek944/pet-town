/** Coordinate identity survives unrelated layout insertions and batched rebuilds. */
export function placementKey(placement) {
  return (
    placement.assetKey ??
    JSON.stringify([placement.type, placement.x, placement.z, placement.rot || 0])
  );
}
