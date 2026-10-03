import { creaturesState } from "../state.js";
import { getCreatureTerrain } from "../world/get-creature-terrain.js";
import { getCreatureWorldExtent } from "../world/get-creature-world-extent.js";
import { isCreatureWaterNearby } from "./is-creature-water-nearby.js";
import { birdRestHeight, sampleBirdClearance } from "../flight/sample-bird-clearance.js";
import { spawnCreature } from "./spawn-creature.js";

export function spawnBirdPopulation() {
  const runtime = creaturesState.creaturesRuntime;
  const rng = runtime.rng;
  const origin = getCreatureTerrain()?.spawn ?? { x: 0, z: 0 };
  const extent = getCreatureWorldExtent();
  const trees = runtime.ctx.vegetation?.trees ?? [];
  for (const species of creaturesState.creatureSpeciesDefinitions.filter((def) => def.flight)) {
    let spawned = 0;
    for (let attempt = 0; attempt < 1200 && spawned < species.count; attempt++) {
      const angle = rng() * Math.PI * 2;
      const radius = rng.range(6, Math.min(extent * 0.8, 18 + attempt * 0.05));
      const x = origin.x + Math.sin(angle) * radius;
      const z = origin.z + Math.cos(angle) * radius;
      // Habitat preference can relax, but dry support/clearance never does.
      if (attempt < 600 && species.flight.pattern === "glide" && !isCreatureWaterNearby(x, z, 10))
        continue;
      if (
        attempt < 600 &&
        species.flight.activity === "night" &&
        !trees.some((tree) => Math.hypot(tree.x - x, tree.z - z) < 12)
      )
        continue;
      const padding = Math.max(0.8, (species.scale ?? 1) * 1.08 * 1.3);
      if (
        birdRestHeight(x, z, padding) == null ||
        runtime.list.some((actor) => Math.hypot(actor.position.x - x, actor.position.z - z) < 2)
      )
        continue;
      const variants = species.variants.map((variant, index) => ({ ...variant, index }));
      const common = variants.filter((variant) => !variant.rare);
      const rare = variants.filter((variant) => variant.rare);
      const variant = rare.length && rng() < 0.2 ? rng.pick(rare) : rng.pick(common);
      const actor = spawnCreature(species, variant.index, x, z);
      const clearance = sampleBirdClearance(x, z, padding);
      actor.flying = true;
      actor.flyH = species.flight.minAltitude;
      actor.alt = actor.flyH;
      actor.position.y = clearance.top + actor.flyH;
      actor.lastPos.copy(actor.position);
      spawned++;
    }
  }
}
