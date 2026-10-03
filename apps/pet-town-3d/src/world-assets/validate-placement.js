import { placementCollision } from "./placement-collisions.js";
import { propsState } from "../props/state.js";
import { createPropTerrainAdapter } from "../props/terrain-placement/create-prop-terrain-adapter.js";

export function assetWorldReady(context) {
  const persistence = context.building?.persistence;
  return context.ready && (!persistence?.on || persistence.loaded);
}

/** Reserve the entire asset including decoration, rather than just its post/body. */
export function validateAssetPlacement(context, asset, position, targetKey = null) {
  if (!assetWorldReady(context))
    return { valid: false, note: "Waiting for your saved world to load…" };
  const terrain = createPropTerrainAdapter(context);
  const rotated = Math.abs(Math.round(Math.sin(position.rot))) === 1;
  const hx = (rotated ? asset.hd : asset.hw) + 0.25;
  const hz = (rotated ? asset.hw : asset.hd) + 0.25;
  if (!terrain.inBounds(position.x, position.z, Math.max(hx, hz) + 1))
    return { valid: false, note: "Choose a spot farther from the edge of the world." };
  const stats = terrain.footprint(position.x, position.z, asset.hw, asset.hd, position.rot, 0.5);
  if (stats.wet || !Number.isFinite(stats.max) || stats.range > 0.6)
    return { valid: false, note: "This asset needs level, dry ground under its whole footprint." };
  const ignored = new Set();
  for (const record of propsState.propsRuntime.recs.values()) {
    if (record.entry?.placementKey === targetKey)
      for (const collider of record.cols) ignored.add(collider);
  }
  if (placementCollision(context, ignored, position.x, position.z, hx, hz, stats.max, terrain))
    return { valid: false, note: "This spot overlaps another object. Choose more open ground." };
  const layout = propsState.propsRuntime.layout;
  const corridors = [
    ...(layout?.pathSamples ?? []),
    ...(layout?.fronts ?? []).map(([x, z]) => ({ x, z })),
  ];
  if (
    corridors.some(
      (p) =>
        p.assetKey !== targetKey &&
        Math.abs(p.x - position.x) < hx + 0.8 &&
        Math.abs(p.z - position.z) < hz + 0.8,
    )
  )
    return { valid: false, note: "Keep footpaths and entrance approaches clear." };
  for (let x = position.x - hx; x <= position.x + hx; x += 0.5)
    for (let z = position.z - hz; z <= position.z + hz; z += 0.5)
      if (context.terrain.biomeAt?.(x, z) === "path")
        return { valid: false, note: "Keep this existing path clear." };
  const actors = [
    context.player.position,
    ...Array.from(context.petTown?.agents.records.values() ?? [], (a) => a.position),
  ];
  if (
    actors.some(
      (p) => Math.abs(p.x - position.x) < hx + 0.5 && Math.abs(p.z - position.z) < hz + 0.5,
    )
  )
    return {
      valid: false,
      note: "Move farther away so the asset does not cover you or a companion.",
    };
  return {
    valid: true,
    note: targetKey
      ? "Ready to replace the selected object."
      : "Ready to place on this clear patch.",
    y: stats.max,
  };
}
