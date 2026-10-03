import { sampleBirdTerrainEnvelope } from "./sample-bird-terrain-envelope.js";
import { creaturesState } from "../state.js";
import { sampleCreatureTerrainHeight } from "../world/sample-creature-terrain-height.js";
import { getCreatureWaterLevel } from "../world/get-creature-water-level.js";
import { isCreatureInsideWorld } from "../world/is-creature-inside-world.js";

function overlaps(collider, x, z, padding) {
  if (collider.kind === "segment") {
    const dx = collider.x2 - collider.x1;
    const dz = collider.z2 - collider.z1;
    const t = Math.max(
      0,
      Math.min(1, ((x - collider.x1) * dx + (z - collider.z1) * dz) / (dx * dx + dz * dz || 1)),
    );
    return (
      Math.hypot(x - collider.x1 - dx * t, z - collider.z1 - dz * t) < (collider.r ?? 0.1) + padding
    );
  }
  if (collider.w != null && collider.d != null) {
    const cosine = Math.cos(collider.rot ?? 0);
    const sine = Math.sin(collider.rot ?? 0);
    const dx = x - collider.x;
    const dz = z - collider.z;
    return (
      Math.abs(dx * cosine - dz * sine) < collider.w / 2 + padding &&
      Math.abs(dx * sine + dz * cosine) < collider.d / 2 + padding
    );
  }
  return (
    Math.hypot(x - collider.x, z - collider.z) < (collider.radius ?? collider.r ?? 0.3) + padding
  );
}

// Conservative vertical envelopes include the full wingspan, canopies and roofs.
export function sampleBirdClearance(x, z, padding = 1) {
  if (
    !isCreatureInsideWorld(x - padding, z - padding) ||
    !isCreatureInsideWorld(x + padding, z + padding)
  )
    return null;
  const ground = sampleCreatureTerrainHeight(x, z);
  const envelope = sampleBirdTerrainEnvelope(x, z, padding);
  if (ground == null || !envelope) return null;
  const { terrainTop, terrainBottom } = envelope;
  const ctx = creaturesState.creaturesRuntime.ctx;
  let top = Math.max(terrainTop, getCreatureWaterLevel());
  let obstruction = -Infinity;
  for (const collider of ctx.props?.colliders ?? []) {
    if (overlaps(collider, x, z, padding)) {
      obstruction = Math.max(obstruction, (collider.y0 ?? ground) + (collider.h ?? 2));
    }
  }
  for (const tree of ctx.vegetation?.trees ?? []) {
    if (Math.hypot(x - tree.x, z - tree.z) > (tree.canopyRadius ?? 3) + padding) continue;
    // Envelope also covers trunks and cone-shaped skirts with no sphere entry.
    obstruction = Math.max(obstruction, (tree.y ?? tree.position.y) + (tree.height ?? tree.h));
    for (const canopy of tree.canopies ?? []) {
      if (Math.hypot(x - canopy.x, z - canopy.z) < canopy.r + padding) {
        obstruction = Math.max(obstruction, canopy.y + canopy.r);
      }
    }
  }
  top = Math.max(top, obstruction);
  return { ground, terrainTop, terrainBottom, obstruction, top };
}

export function birdRestHeight(x, z, padding = 1) {
  const sample = sampleBirdClearance(x, z, padding);
  if (
    !sample ||
    sample.terrainBottom <= getCreatureWaterLevel() + 0.3 ||
    sample.terrainTop - sample.terrainBottom > 0.3 ||
    sample.obstruction > sample.ground + 0.05
  )
    return null;
  return sample.ground;
}
