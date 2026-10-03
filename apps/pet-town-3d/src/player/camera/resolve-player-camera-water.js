import { Vector3 } from "three";

function clear(queries, start, end, radius) {
  return !queries.overlaps(end, radius).length && !queries.sweep(start, end, radius);
}

/** A clipped upward correction must still reach the water clearance. */
export function resolvePlayerCameraWater(queries, focus, position, previous, radius, water) {
  const minimum = water + radius + 0.05;
  if (!Number.isFinite(water) || focus.y <= water || position.y >= minimum) return position;
  queries.prepare(position, 5, previous);
  const raised = position.clone().setY(minimum);
  if (
    clear(queries, position, raised, radius) &&
    (!previous || clear(queries, previous, raised, radius))
  )
    return raised;
  if (previous && previous.y >= minimum && !queries.overlaps(previous, radius).length) {
    return previous.clone();
  }
  // An initial pose under a bridge may need to move sideways before rising.
  for (const distance of [0.6, 1.2, 2.4, 4.8]) {
    for (let index = 0; index < 8; index++) {
      const angle = (index * Math.PI) / 4;
      const side = position
        .clone()
        .add(new Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(distance));
      const candidate = side.clone().setY(minimum);
      if (
        clear(queries, position, side, radius) &&
        clear(queries, side, candidate, radius) &&
        (!previous || clear(queries, previous, candidate, radius))
      ) {
        // Both segments were swept; the initial recovery may commit their endpoint.
        return candidate;
      }
    }
  }
  return null;
}
