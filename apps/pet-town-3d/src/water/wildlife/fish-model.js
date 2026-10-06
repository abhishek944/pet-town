import * as THREE from "three";
import { bodyDetails, pectoralGeometry, tailGeometry } from "./fish-geometry.js";

export const FISH_SCHOOLS = [
  { id: "clementine", place: "reef", count: 18, radius: 6, speed: 0.23, depth: 2 },
  { id: "sailfin", place: "reef", count: 18, radius: 9, speed: -0.16, depth: 3.4 },
  { id: "reef-dart", place: "kelp", count: 18, radius: 7, speed: 0.19, depth: 2.8 },
];

const species = {
  clementine: {
    id: "clementine",
    length: 0.54,
    height: 0.31,
    width: 0.21,
    base: 0xf48643,
    cream: 0xfff0d1,
    ink: 0x95513c,
    fin: 0xe16d3c,
    ray: 0xffc27f,
    eye: 0.075,
    tailHeight: 0.24,
    tailLength: 0.31,
  },
  sailfin: {
    id: "sailfin",
    length: 0.49,
    height: 0.42,
    width: 0.23,
    base: 0x70b8d7,
    cream: 0xffefca,
    ink: 0x397ba1,
    fin: 0x3d83a8,
    ray: 0x9bd2e0,
    eye: 0.074,
    tailHeight: 0.25,
    tailLength: 0.31,
  },
  "reef-dart": {
    id: "reef-dart",
    length: 0.72,
    height: 0.17,
    width: 0.15,
    base: 0x6ec3af,
    cream: 0xf6edc6,
    ink: 0x286d77,
    fin: 0x327e83,
    ray: 0x9de1c6,
    eye: 0.052,
    tailHeight: 0.14,
    tailLength: 0.36,
  },
};
for (const fish of Object.values(species)) {
  fish.baseColor = new THREE.Color(fish.base);
  fish.creamColor = new THREE.Color(fish.cream);
  fish.inkColor = new THREE.Color(fish.ink);
}

export function createReefFishMaterial() {
  return new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.66,
    side: THREE.DoubleSide,
  });
}

export function createReefFishModel(id, material) {
  const fish = species[id];
  if (!fish) throw new RangeError(`Unknown reef fish: ${id}`);
  const model = new THREE.Group();
  model.name = id;
  const axis = new THREE.Matrix4().makeRotationY(-Math.PI / 2);
  for (const [name, geometry] of [
    ["Body", bodyDetails(fish)],
    ["PectoralFins", pectoralGeometry(fish)],
    ["Tail", tailGeometry(fish)],
  ]) {
    geometry.applyMatrix4(axis);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    if (name === "Tail") mesh.position.z = -fish.length * 0.86;
    model.add(mesh);
  }
  return model;
}
