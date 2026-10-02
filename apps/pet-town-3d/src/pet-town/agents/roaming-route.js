import * as THREE from "three";
import { clearWalkingSegment, walkableHeight } from "./walkability.js";

const SPACING = 0.75;
const REACH = 7;
const DIRECTIONS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

// Search the local walkable area before choosing a destination. An endpoint on
// dry ground alone does not mean a bridge rail, pond or wall can be crossed.
export function chooseRoamingRoute(record) {
  const origin = record.body.pos;
  const { home, random } = record._motion;
  const start = { x: 0, z: 0, point: origin.clone(), parent: null };
  const queue = [start];
  const reached = new Set(["0,0"]);
  const points = new Map();
  const candidates = [];
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    for (const [dx, dz] of DIRECTIONS) {
      const x = current.x + dx;
      const z = current.z + dz;
      const key = `${x},${z}`;
      if (reached.has(key) || Math.hypot(x, z) * SPACING > REACH) continue;
      if (!points.has(key)) {
        const px = origin.x + x * SPACING;
        const pz = origin.z + z * SPACING;
        const y = walkableHeight(record.world, px, pz);
        points.set(key, y === null ? null : new THREE.Vector3(px, y, pz));
      }
      const point = points.get(key);
      if (!point || !clearWalkingSegment(record.world, current.point, point)) continue;
      reached.add(key);
      const next = { x, z, point, parent: current };
      queue.push(next);
      if (Math.hypot(x, z) * SPACING >= 2 && Math.hypot(point.x - home.x, point.z - home.z) <= 18)
        candidates.push(next);
    }
  }
  if (!candidates.length) return [];
  let destination = candidates[Math.floor(random() * candidates.length)];
  const route = [];
  while (destination.parent) {
    route.push(destination.point);
    destination = destination.parent;
  }
  return route.reverse();
}
