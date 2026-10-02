import * as THREE from "three";
import { walkableHeight } from "./walkability.js";

export function findAgentSpawn(context, world, random, records) {
  const center = context.player?.position ?? context.terrain?.spawn ?? { x: 0.5, y: 0, z: 0.5 };
  for (let attempt = 0; attempt < 100; attempt++) {
    const angle = random() * Math.PI * 2;
    const radius = 2.4 + random() * (attempt < 50 ? 7 : 16);
    const x = center.x + Math.sin(angle) * radius;
    const z = center.z + Math.cos(angle) * radius;
    world.gatherColliders(x, center.y, z, 5);
    const y = walkableHeight(world, x, z);
    if (y === null || Math.abs(y - center.y) > 3) continue;
    const occupied = [...records.values()].some(
      (record) => Math.hypot(record.position.x - x, record.position.z - z) < 1.1,
    );
    if (!occupied) return new THREE.Vector3(x, y + 0.002, z);
  }
  // The original player's current feet are the last known traversable fallback.
  return new THREE.Vector3(center.x, center.y + 0.05, center.z);
}
