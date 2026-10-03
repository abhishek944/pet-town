import * as THREE from "three";
import { createOceanPlacements } from "./placements.js";
import { createPlankton } from "./plankton.js";
import { reseatOceanScenery } from "./support.js";

/** Ocean scenery owns no collision bodies: landing and wreck routes remain open. */
export function createOceanScenery(context) {
  const root = new THREE.Group();
  root.name = "ocean-scenery";
  const records = createOceanPlacements();
  for (const record of records) reseatOceanScenery(context, record);
  for (const record of records) root.add(record.model.root);
  context.scene.add(root);
  const plankton = createPlankton(context, root);
  let time = 0;
  let pollIn = 0;
  let version = -1;
  let disposed = false;
  return {
    update(dt) {
      if (disposed || !context.terrain || !context.water) return;
      time += dt;
      pollIn -= dt;
      if (pollIn <= 0 || version !== context.terrain.version) {
        for (const record of records) reseatOceanScenery(context, record);
        pollIn = 0.75;
        version = context.terrain.version;
      }
      for (const record of records) {
        if (!record.sway || !record.model.root.visible) continue;
        record.model.root.rotation.z = Math.sin(time * 0.75 + record.phase) * 0.055;
        record.model.root.rotation.x = Math.sin(time * 0.5 + record.phase) * 0.035;
      }
      plankton.update(dt);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      plankton.dispose();
      for (const record of records) record.model.dispose();
      root.removeFromParent();
    },
  };
}
