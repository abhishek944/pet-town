import { T } from "../shared/geometry.js";
import { addWindmillShedMetadata } from "./windmill-shed-metadata.js";

const roundBody = (radius, height, x = 0, z = 0, y0 = 0) => ({
  x,
  z,
  radius,
  y0,
  h: height,
  noTop: true,
});
const rectBody = (w, d, height, x = 0, z = 0, y0 = 0) => ({
  x,
  z,
  w,
  d,
  radius: Math.hypot(w, d) / 2,
  y0,
  h: height,
  noTop: true,
});
const facade = (x, y, z, rot = 0, high = false) => ({
  x,
  y,
  z,
  nx: Math.sin(rot),
  nz: Math.cos(rot),
  high,
});
const radialWindows = (angles, radius, height) =>
  angles.map((angle) => facade(Math.sin(angle) * radius, height, Math.cos(angle) * radius, angle));

/** Interiors, balconies, winding stairs and deck boards are decorative. */
function houseMetadata(radius, colliders, entry, light, windows = []) {
  const door = new T.Vector3(...entry);
  return {
    radius,
    colliders,
    door,
    walk: [],
    lights: light.map((position) => new T.Vector3(...position)),
    windows,
    clear: [{ x: door.x, z: door.z + 0.95, r: 1.1 }],
  };
}

export function bespokeMetadata(id, details) {
  if (id === "windmill-neighbour") {
    const metadata = houseMetadata(
      5.2,
      [roundBody(2.15, 7.4)],
      [0, 0.55, 2.22],
      [[-0.85, 2.6, 2.13]],
      radialWindows([-0.9, 0.9, 1.8], 1.95, 2.17),
    );
    addWindmillShedMetadata(metadata, details);
    return metadata;
  }
  if (id === "corner-bakery") {
    return houseMetadata(
      4.5,
      [rectBody(4.4, 3.5, 6.3), rectBody(2.2, 2.9, 5.1, 2.16, 0.2)],
      [2.2, 0.45, 1.95],
      [[1.2, 2.5, 1.82]],
      [
        facade(-0.65, 4.12, 1.91, 0, true),
        facade(-0.62, 1.72, 1.81),
        facade(3.29, 2.13, 0.35, Math.PI / 2),
      ],
    );
  }
  if (id === "boat-roof-home") {
    return houseMetadata(
      4.6,
      [rectBody(5.2, 3.7, 5.5, 0, 0, 0.48), roundBody(0.28, 0.62, -2.83, 1.95, 0.45)],
      [0.25, 0.98, 2.05],
      [[0.98, 2.8, 1.98]],
      [facade(-1.32, 2.2, 1.82), facade(2.58, 2.18, 0.2, Math.PI / 2)],
    );
  }
  if (id === "glass-garden-home") {
    return houseMetadata(
      4.1,
      [roundBody(2.7, 5.35), rectBody(1.9, 1.3, 3.7, 0, 2.4)],
      [0, 0.55, 3.25],
      [[0.78, 2.25, 3.13]],
    );
  }
  if (id === "woodland-library") {
    return houseMetadata(
      4.1,
      [roundBody(2.35, 6.3)],
      [-0.74, 0.12, 2.56],
      [[-1.45, 2.36, 2]],
      [facade(0, 4.35, 1.54, 0, true)],
    );
  }
  return null;
}

export function organicMetadata(index) {
  const radius = index === 0 ? 2 : 1.9;
  return houseMetadata(
    index === 0 ? 3.5 : 3.1,
    [roundBody(radius + 0.3, index === 1 ? 7.9 : 5.1), roundBody(0.32, 0.8, radius + 0.4, 0.5)],
    [0, 0.5, radius + 0.32],
    [[0.84, 2.35, radius + 0.25]],
    radialWindows([-0.75, 0.75, 1.65], radius, 2.07),
  );
}
