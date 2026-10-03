// Count every original one-unit dry-land cell, including the expanded island.
// Preserve the whole authored source grid, including its connected ocean.
export function selectRegion(ctx) {
  const terrain = ctx.terrain;
  const spawn = terrain.spawn;
  const sourceBounds = terrain.bounds;
  const dry = [];
  for (let z = sourceBounds.minZ; z < sourceBounds.maxZ; z++)
    for (let x = sourceBounds.minX; x < sourceBounds.maxX; x++)
      if (!terrain.isWater(x + 0.5, z + 0.5)) dry.push([x + 0.5, z + 0.5]);
  if (!dry.length) throw new Error("Original terrain contains no measurable dry land");
  const bounds = { ...sourceBounds };
  const included = dry.length;
  const ground = [];
  for (let z = bounds.minZ; z < bounds.maxZ; z++)
    for (let x = bounds.minX; x < bounds.maxX; x++)
      ground.push([
        x + 0.5,
        terrain.topY(x + 0.5, z + 0.5),
        z + 0.5,
        Number(terrain.isWater(x + 0.5, z + 0.5)),
      ]);
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    bounds,
    sourceBounds,
    source: "Current original Three.js generated world; no new placements",
    coordinates: "Y-up, original world units; matrix arrays column-major",
    coverage: {
      method: "All original one-unit cell centers whose terrain.isWater is false",
      cellArea: 1,
      totalDryLandCells: dry.length,
      includedDryLandCells: included,
      fraction: included / dry.length,
      percent: (included / dry.length) * 100,
    },
    spawn: { ...spawn },
    landmarks: terrain.landmarks,
    waterLevel: terrain.waterLevel,
    groundFile: "region-ground.json",
    ground,
  };
}
