/** Reusable procedural creature geometry, vertex colors, ellipsoid projection and transforms. */
import { createCreatureDeformedSphereGeometry } from "./create-creature-deformed-sphere-geometry.js";
export let createCreatureEllipsoidGeometry = (value, value2, value3, value4 = 24, value5 = 16) =>
  createCreatureDeformedSphereGeometry(
    (setValue, value6, value7, value8) =>
      setValue.set(value6 * value, value7 * value2, value8 * value3),
    value4,
    value5,
  );
