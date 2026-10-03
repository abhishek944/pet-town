import * as THREE from "three";
import { createSceneryModel } from "./model-kit.js";

const CORAL_COLORS = [0xf78390, 0xffb870, 0xa18de0, 0x67d5c5];

export function createCoral(index) {
  const model = createSceneryModel("Branching ocean coral");
  const color = CORAL_COLORS[index % CORAL_COLORS.length];
  model.pebble([0, 0.11, 0], [0.7, 0.2, 0.55], 0x827f83);
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI * 0.4 + index;
    const end = [Math.cos(angle) * 0.45, 0.75 + (i % 3) * 0.22, Math.sin(angle) * 0.45];
    model.branch([0, 0.1, 0], end, 0.1, color);
    for (let j = -1; j <= 1; j++) {
      const forkAngle = angle + j * 0.8;
      const tip = [
        end[0] + Math.cos(forkAngle) * 0.3,
        end[1] + 0.35,
        end[2] + Math.sin(forkAngle) * 0.3,
      ];
      model.branch(end, tip, 0.065, color, 0.035);
      model.pebble(tip, [0.07, 0.08, 0.07], 0xffd7ac);
    }
  }
  model.finish();
  return model;
}

export function createAnemone(index) {
  const model = createSceneryModel("Sea anemone garden");
  const color = index % 2 ? 0x96bedf : 0xf0a8cc;
  model.pebble([0, 0.13, 0], [0.62, 0.18, 0.62], 0x7d8895);
  model.pebble([0, 0.23, 0], [0.37, 0.17, 0.37], color);
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const end = [Math.cos(angle) * 0.38, 0.5 + (i % 3) * 0.06, Math.sin(angle) * 0.38];
    model.branch([Math.cos(angle) * 0.16, 0.18, Math.sin(angle) * 0.16], end, 0.045, color);
    model.pebble(end, [0.07, 0.09, 0.07], 0xffeccd);
  }
  model.finish();
  return model;
}

export function createKelp(index) {
  const model = createSceneryModel("Swaying kelp frond");
  const height = 2.2 + (index % 3) * 0.5;
  model.pebble([0, 0.1, 0], [0.45, 0.2, 0.4], 0x6a8580);
  for (let i = 0; i < 5; i++) {
    const y = (height * (i + 1)) / 5;
    const bend = Math.sin(i * 0.6) * 0.18;
    model.branch([bend * 0.6, y - height / 5, 0], [bend, y, 0], 0.035, 0x468e70);
    const side = i % 2 ? -1 : 1;
    model.part(
      new THREE.SphereGeometry(1, 7, 4),
      i % 2 ? 0x64af7d : 0x86c48d,
      [bend + side * 0.28, y - 0.12, 0],
      [0.47, 0.09, 0.13],
      [0, i * 0.5, side * 0.45],
    );
  }
  model.pebble([0.18, height, 0], [0.08, 0.13, 0.08], 0xb9d693);
  model.finish();
  return model;
}
