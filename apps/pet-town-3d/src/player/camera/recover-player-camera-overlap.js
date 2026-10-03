import { Vector3 } from "three";

/** A zero-length hit is never accepted as a safe camera pose. */
export function recoverPlayerCameraOverlap(queries, position, radius, previous = null) {
  const result = position.clone();
  if (!queries.overlaps(result, radius).length) return result;
  // Six contact steps can move up to 24 units. Register that entire envelope
  // before accepting an escape, even when the requested zoom is very short.
  queries.prepare(position, 24, previous);
  const directions = [new Vector3(0, 1, 0)];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    directions.push(new Vector3(Math.cos(angle), 0.35, Math.sin(angle)).normalize());
  }
  for (let step = 0; step < 6; step++) {
    const contacts = queries.overlaps(result, radius);
    if (!contacts.length) return result;
    const contact = contacts.find((hit) => hit.normal && hit.depth > 0);
    if (!contact) break;
    const normal = new Vector3().copy(contact.normal);
    if (normal.lengthSq() < 1e-8) break;
    result.addScaledVector(normal.normalize(), Math.min(4, contact.depth + 0.04));
  }
  // At corners contact gradients can conflict. Search a bounded local escape.
  for (const distance of [0.3, 0.6, 1.2, 2.4, 4.8, 9.6]) {
    for (const direction of directions) {
      result.copy(position).addScaledVector(direction, distance);
      if (!queries.overlaps(result, radius).length) return result.clone();
    }
  }
  return null;
}
