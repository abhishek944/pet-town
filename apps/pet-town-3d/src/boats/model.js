import * as THREE from "three";
import { createBoatModelKit } from "./model-kit.js";
import { addHarborLaunchDetails } from "./model-details.js";

export const BOAT_LENGTH = 7;
export const BOAT_WIDTH = 3.8;
export const DECK_Y = 0.66;
export const HELM = [0, DECK_Y, 1.15];
export const BOARD = [0.7, DECK_Y, 2.3];

export function hullHalfWidth(z) {
  if (Math.abs(z) >= BOAT_LENGTH / 2) return 0;
  return (BOAT_WIDTH / 2) * Math.pow(Math.cos((z / BOAT_LENGTH) * Math.PI), 0.4);
}

/** Authored Harbor launch selected in the boat UI/UX interview. */
export function createHarborLaunch() {
  const kit = createBoatModelKit("harbor-launch-solid");
  const { box, rope, add } = kit;
  const vertices = [],
    indices = [],
    n = 28;
  for (let j = 0; j <= n; j++) {
    const z = (j / n - 0.5) * BOAT_LENGTH;
    const breadth = Math.pow(Math.sin((j / n) * Math.PI), 0.4);
    for (let k = 0; k < 3; k++) {
      for (const side of [-1, 1])
        vertices.push(
          ((side * BOAT_WIDTH) / 2) * breadth * [0.24, 0.74, 1][k],
          [-0.48, -0.18, 0.62][k],
          z,
        );
    }
  }
  for (let j = 0; j < n; j++) {
    for (let k = 0; k < 2; k++) {
      const a = j * 6 + k * 2;
      indices.push(a, a + 6, a + 2, a + 2, a + 6, a + 8, a + 1, a + 3, a + 7, a + 3, a + 9, a + 7);
    }
    const a = j * 6;
    indices.push(a, a + 1, a + 6, a + 1, a + 7, a + 6);
  }
  const hull = new THREE.BufferGeometry();
  hull.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  hull.setIndex(indices);
  hull.computeVertexNormals();
  add(hull, 0x477f7d);
  for (const side of [-1, 1]) {
    const points = [];
    for (let j = 0; j <= n; j++)
      points.push([
        ((side * BOAT_WIDTH) / 2) * Math.pow(Math.sin((j / n) * Math.PI), 0.4),
        0.63,
        (j / n - 0.5) * BOAT_LENGTH,
      ]);
    rope(points, 0xe5cc9d, 0.085);
  }
  for (let j = 1; j < n; j++) {
    const z = (j / n - 0.5) * BOAT_LENGTH;
    box([hullHalfWidth(z) * 2 - 0.16, 0.1, BOAT_LENGTH / n - 0.012], j % 3 ? 0xc99661 : 0xbd8758, [
      0,
      0.61,
      z,
    ]);
  }
  box([2.15, 1.35, 2.2], 0xf2e5c5, [0, 1.33, -1.45]);
  box([2.45, 0.22, 2.6], 0x547d76, [0, 2.1, -1.45]);
  box([1.6, 0.66, 0.035], 0x91c5ce, [0, 1.48, -0.33]);
  for (const side of [-1, 1]) box([0.035, 0.64, 1.3], 0x91c5ce, [side * 1.095, 1.48, -1.45]);
  box([0.11, 0.78, 0.07], 0xb08b5d, [0, 1.48, -0.29]);
  addHarborLaunchDetails(kit);
  const root = new THREE.Group();
  root.name = "harbor-launch";
  root.add(kit.finish());
  return root;
}
