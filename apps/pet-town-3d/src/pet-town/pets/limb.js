import { SphereGeometry } from "three";

// Split the existing sphere on its equator. The two halves keep the exact rest
// surface, transforms and material; only their parents differ during bending.
export function articulatePetLimb(mesh, upper, lower, model) {
  const original = mesh.clone();
  const halves = (model.userData.limbHalves ??= [
    new SphereGeometry(1, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new SphereGeometry(1, 24, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
  ]);
  const forelimb = mesh.clone();
  forelimb.geometry = halves[1];
  model.add(forelimb);
  lower.attach(forelimb);
  mesh.geometry = halves[0];
  upper.attach(mesh);
  // An enclosed joint fills the seam when bent without enlarging the rest shape.
  original.scale.y = Math.min(original.scale.x, original.scale.z);
  model.add(original);
  upper.attach(original);
}
