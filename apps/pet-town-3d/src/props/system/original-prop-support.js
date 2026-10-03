/** The same footprint sampled by groundBasePlacement, including bridge endpoints. */
export function originalPropTouchesColumn(record, x, z) {
  const item = record.it;
  if (item.type === "bridge") {
    return [
      [item.ax, item.az],
      [item.bx, item.bz],
    ].some(([px, pz]) => Math.abs(px - x) <= 0.75 && Math.abs(pz - z) <= 0.75);
  }
  const dimensions = { cottage: [4.1, 4.5], garden: [3.8, 2.9], stall: [2.4, 1.6] };
  const [hw, hd] = dimensions[item.type] ?? [item.r ?? 0.5, item.r ?? 0.5];
  const angle = item.rot ?? 0;
  const dx = x - item.x,
    dz = z - item.z;
  const localX = dx * Math.cos(angle) - dz * Math.sin(angle);
  const localZ = dx * Math.sin(angle) + dz * Math.cos(angle);
  return (
    Math.abs(localX) <= (item.opts?.hw ?? hw) + 0.75 &&
    Math.abs(localZ) <= (item.opts?.hd ?? hd) + 0.75
  );
}
