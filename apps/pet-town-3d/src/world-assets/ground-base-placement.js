/** Keep authored coordinates and identities, while refreshing current terrain support. */
export function groundBasePlacement(terrain, item, { keepUnsupported = false } = {}) {
  const unsupported = () =>
    keepUnsupported ? { ...item, terrainSupport: true, supportValid: false } : null;
  if (item.type === "bridge") {
    const yA = terrain.h(item.ax, item.az),
      yB = terrain.h(item.bx, item.bz);
    if (
      terrain.isWater(item.ax, item.az) ||
      terrain.isWater(item.bx, item.bz) ||
      Math.abs(yA - yB) > 2.2
    )
      return unsupported();
    return { ...item, yA, yB, water: terrain.wl(), terrainSupport: true, supportValid: true };
  }
  const dimensions = { cottage: [4.1, 4.5], garden: [3.8, 2.9], stall: [2.4, 1.6] };
  const [hw, hd] = dimensions[item.type] ?? [item.r ?? 0.5, item.r ?? 0.5];
  const stats = terrain.footprint(
    item.x,
    item.z,
    item.opts?.hw ?? hw,
    item.opts?.hd ?? hd,
    item.rot ?? 0,
    0.5,
  );
  if (
    stats.wet > (item.opts?.wetOk ?? 0) ||
    !Number.isFinite(stats.max) ||
    (item.opts?.maxRange != null && stats.range > item.opts.maxRange)
  )
    return unsupported();
  const y = item.opts?.base === "center" ? terrain.h(item.x, item.z) : stats.max;
  return {
    ...item,
    stats,
    y,
    found: Math.max(0.3, y - stats.min + 0.35),
    terrainSupport: true,
    supportValid: true,
  };
}
