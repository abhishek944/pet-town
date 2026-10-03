import { propsState } from "../../pet-town-3d/src/props/state.js";

/** Exact source paths and door connectors reserved by the asset-library rules. */
export function exportPlacementReservations(ctx, manifest) {
  const layout = propsState.propsRuntime.layout;
  const corridors = [
    ...(layout?.pathSamples ?? []).map(({ x, z, assetKey }) => ({ x, z, assetKey })),
    ...(layout?.fronts ?? []).map(([x, z]) => ({ x, z })),
  ];
  const pathCells = {};
  const bounds = manifest.bounds;
  for (let z = bounds.minZ; z < bounds.maxZ; z++)
    for (let x = bounds.minX; x < bounds.maxX; x++)
      if (ctx.terrain.biomeAt?.(x + 0.5, z + 0.5) === "path") pathCells[`${x},${z}`] = true;
  manifest.placementReservations = { corridors, pathCells };
  return manifest.placementReservations;
}
