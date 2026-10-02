import * as THREE from "three";

import { agentAppearance } from "./appearance-identity.js";

function addMesh(parent, geometry, material, x, y, z) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCrown(character) {
  const crown = new THREE.Group();
  crown.name = "Mayor crown";
  crown.position.set(0, 0.365, 0);
  character.head.add(crown);
  addMesh(
    crown,
    new THREE.CylinderGeometry(0.17, 0.15, 0.09, 16, 1, true),
    character.M.button,
    0,
    0,
    0,
  );
  for (let index = 0; index < 5; index++) {
    const angle = (index / 5) * Math.PI * 2;
    addMesh(
      crown,
      new THREE.ConeGeometry(0.055, 0.14, 4),
      character.M.button,
      Math.sin(angle) * 0.14,
      0.08,
      Math.cos(angle) * 0.14,
    );
  }
}

function addAccessory(character, variant, seed) {
  const head = character.head;
  const accent = character.M.scarf;
  if (variant === 0) {
    for (const side of [-1, 1]) {
      addMesh(
        head,
        new THREE.TorusGeometry(0.095, 0.009, 6, 24),
        character.M.button,
        side * 0.116,
        -0.045,
        0.447,
      );
    }
    addMesh(head, new THREE.BoxGeometry(0.047, 0.012, 0.012), character.M.button, 0, -0.04, 0.454);
  } else if (variant === 1) {
    const feather = addMesh(head, new THREE.SphereGeometry(1, 12, 8), accent, 0.16, 0.41, 0.03);
    feather.scale.set(0.04, 0.18, 0.02);
    feather.rotation.z = -0.45;
  } else if (variant === 2) {
    for (const side of [-1, 1]) {
      const bow = addMesh(
        head,
        new THREE.SphereGeometry(1, 12, 8),
        accent,
        side * 0.075,
        0.3,
        0.24,
      );
      bow.scale.set(0.08, 0.055, 0.035);
      bow.rotation.z = side * 0.4;
    }
    addMesh(head, new THREE.SphereGeometry(0.037, 10, 8), character.M.button, 0, 0.3, 0.265);
  } else if (variant === 3) {
    for (let index = 0; index < 5; index++) {
      const angle = (index / 5) * Math.PI * 2;
      const petal = addMesh(
        head,
        new THREE.SphereGeometry(1, 10, 8),
        accent,
        -0.19 + Math.sin(angle) * 0.053,
        0.24 + Math.cos(angle) * 0.053,
        0.26,
      );
      petal.scale.set(0.039, 0.039, 0.017);
    }
    addMesh(head, new THREE.SphereGeometry(0.027, 10, 8), character.M.button, -0.19, 0.24, 0.28);
  } else {
    const cap = addMesh(head, new THREE.ConeGeometry(0.17, 0.21, 12), accent, 0, 0.43, 0);
    cap.rotation.z = (seed % 2 ? 1 : -1) * 0.15;
    addMesh(head, new THREE.SphereGeometry(0.04, 10, 8), character.M.button, 0, 0.55, 0);
  }
}

export function applyAgentAppearance(character, seed, isMayor) {
  const { hue, accentHue, variant, label } = agentAppearance(seed, isMayor);
  const colors = character.M;
  for (const name of ["fur", "furLight", "hood", "piping"]) {
    colors[name].vertexColors = false;
    colors[name].color.setHSL(hue, 0.48, name === "piping" ? 0.71 : 0.42);
  }
  for (const name of ["scarf", "scarfV", "scarfTip", "bagFlap"]) {
    colors[name].vertexColors = false;
    colors[name].color.setHSL(accentHue, 0.58, 0.54);
  }
  colors.bag.color.setHSL(hue, 0.36, 0.27);
  colors.boot.color.setHSL(hue, 0.32, 0.22);
  colors.button.color.setHex(isMayor ? 0xffd36a : 0xe9d8ae);
  character.sprout.visible = false;
  if (isMayor) addCrown(character);
  else addAccessory(character, variant, seed);
  return label;
}
