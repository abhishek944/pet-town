import * as THREE from "three";
import { createMarineResources } from "./resources.js";
import { createMarineHabitat } from "./habitat.js";
import { createDolphins } from "./dolphins.js";
import { createFishSchools } from "./fish-schools.js";
import { createSeaTurtles } from "./turtles.js";

/** Marine wildlife is decorative and friendly, with no physics or global listeners. */
export function createMarineWildlife(context) {
  const group = new THREE.Group();
  group.name = "ocean-wildlife";
  const resources = createMarineResources();
  const habitat = createMarineHabitat(context);
  const systems = [
    createDolphins(context, group, resources, habitat),
    createFishSchools(context, group, resources, habitat),
    createSeaTurtles(context, group, resources, habitat),
  ];
  for (const system of systems) system.update(0, 0);
  context.scene.add(group);
  let time = 0,
    disposed = false;
  return {
    update(dt) {
      if (disposed || context.paused) return;
      const step = Math.max(0, Math.min(dt, 0.1));
      time += step;
      for (const system of systems) system.update(step, time);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      group.removeFromParent();
      for (const system of systems) system.dispose?.();
      resources.dispose();
    },
  };
}
