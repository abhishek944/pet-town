import { createBoatModelKit } from "./model-kit.js";

export const BOAT_HOME = { x: -85.7, z: 73, yaw: 0 };
export const DOCK = { x: -81.7, z: 73, width: 2.05, length: 6, shoreX: -76 };

/** A fixed authored landing west of Driftwood Camp; no terrain/save edits. */
export function createHarborDock(context) {
  const base = context.terrain.waterLevel + 0.15;
  const top = base + 0.66;
  let shore = context.terrain.topY(DOCK.shoreX, DOCK.z) + 0.03;
  const kit = createBoatModelKit("harbor-dock-solid");
  for (let z = -3; z < 3; z += 0.32) kit.box([2.05, 0.14, 0.29], 0xb59065, [0, 0.61, z]);
  const colliders = [];
  for (const x of [-0.9, 0.9]) {
    for (const z of [-2.85, 2.85]) {
      kit.pole(0.12, 1.8, 0x8b6b4c, [x, 0.15, z]);
      kit.pole(0.15, 0.12, 0xddc299, [x, 1.1, z]);
      colliders.push({
        x: DOCK.x + x,
        z: DOCK.z + z,
        radius: 0.15,
        y0: base - 0.75,
        y1: base + 1.16,
        noTop: true,
      });
    }
  }
  const run = DOCK.shoreX - DOCK.x;
  let slope = (shore - top) / run;
  const angle = Math.atan(slope);
  for (let x = 0.6; x < run; x += 0.28)
    kit.box([0.27 / Math.cos(angle), 0.12, 1.8], 0xbc9365, [x, 0.6 + x * slope, 0], [0, 0, angle]);
  const model = kit.finish();
  model.position.set(DOCK.x, base, DOCK.z);
  return {
    model,
    colliders,
    top,
    refresh() {
      const nextShore = context.terrain.topY(DOCK.shoreX, DOCK.z) + 0.03;
      if (nextShore === shore) return;
      const next = createHarborDock(context);
      model.geometry.dispose();
      model.material.dispose();
      model.geometry = next.model.geometry;
      model.material = next.model.material;
      shore = nextShore;
      slope = (shore - top) / run;
    },
    heightAt(x, z) {
      if (Math.abs(x - DOCK.x) <= 1.025 && Math.abs(z - DOCK.z) <= 3) return top;
      if (x >= DOCK.x && x <= DOCK.shoreX && Math.abs(z - DOCK.z) < 0.9)
        return top + (x - DOCK.x) * slope;
      return -Infinity;
    },
  };
}
