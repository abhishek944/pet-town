import * as THREE from "three";
import { createSceneryModel } from "./model-kit.js";

export function createPalm(index) {
  const model = createSceneryModel("Pearlrest island palm");
  const height = 3.8 + index * 0.25;
  for (let i = 0; i < 5; i++) {
    model.branch(
      [i * 0.09, (i * height) / 5, 0],
      [(i + 1) * 0.09, ((i + 1) * height) / 5, 0],
      0.18 - i * 0.012,
      i % 2 ? 0x92775a : 0xac8c64,
    );
  }
  for (let i = 0; i < 7; i++) {
    const angle = (i * Math.PI * 2) / 7;
    const leaf = new THREE.SphereGeometry(1, 8, 4);
    model.part(
      leaf,
      i % 2 ? 0x4a956b : 0x77b779,
      [0.45 + Math.cos(angle) * 0.85, height - 0.12, Math.sin(angle) * 0.85],
      [1.3, 0.12, 0.33],
      [0, -angle, -0.17],
    );
  }
  for (let i = 0; i < 3; i++)
    model.pebble([0.3 + i * 0.19, height - 0.4, 0.17], [0.15, 0.19, 0.15], 0xa78258);
  model.finish();
  return model;
}

export function createPicnic() {
  const model = createSceneryModel("Island picnic rest spot");
  model.box([0, 0.04, 0], [2.3, 0.06, 1.8], 0xe8dcae);
  for (let i = 0; i < 4; i++) model.box([-0.9 + i * 0.6, 0.08, 0], [0.16, 0.035, 1.8], 0xdb847a);
  model.box([0.45, 0.26, -0.32], [0.48, 0.42, 0.38], 0xc6a76d);
  model.branch([0.25, 0.44, -0.32], [0.3, 0.69, -0.32], 0.035, 0x9b7e51);
  model.branch([0.3, 0.69, -0.32], [0.65, 0.69, -0.32], 0.035, 0x9b7e51);
  model.branch([0.65, 0.69, -0.32], [0.65, 0.44, -0.32], 0.035, 0x9b7e51);
  model.part(new THREE.CylinderGeometry(0.17, 0.17, 0.035, 12), 0xf5efe0, [-0.43, 0.1, 0.16]);
  model.pebble([-0.44, 0.16, 0.16], [0.08, 0.09, 0.08], 0xedac73);
  model.finish();
  return model;
}

export function createRock(index) {
  const model = createSceneryModel("Island shoreline stone");
  model.pebble([0, 0.36, 0], [0.74, 0.54, 0.61], index % 2 ? 0x929c9b : 0xb1b5aa);
  model.pebble([0.45, 0.17, 0.27], [0.32, 0.29, 0.29], 0xc5c4b0);
  model.finish();
  return model;
}

export function createShell(index) {
  const model = createSceneryModel("Island beach shell");
  const color = index % 2 ? 0xf4cab3 : 0xeedcbd;
  model.part(new THREE.SphereGeometry(1, 8, 5), color, [0, 0.1, 0], [0.23, 0.1, 0.2]);
  for (let i = 0; i < 5; i++)
    model.branch([0, 0.11, -0.14], [(i - 2) * 0.08, 0.13, 0.13], 0.013, 0xe4b49a);
  model.finish();
  return model;
}
