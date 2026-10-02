import { Box3, Group, Vector3 } from "three";
import { ball } from "./mesh.js";
import { articulatePetLimb } from "./limb.js";

function pivot(parent, name, x = 0, y = 0, z = 0) {
  const group = new Group();
  group.name = `pet-${name}`;
  group.position.set(x, y, z);
  parent.add(group);
  return group;
}

export function rigPetModel(model, speakingMouth) {
  const mouth = speakingMouth ?? model.userData.mouth ?? [1.58, 0.43];
  const mouthO = ball(model, "#684a3c", 0, mouth[0], mouth[1], 0.035, 0.05, 0.018);
  const pieces = [...model.children];
  const squash = pivot(model, "squash");
  // Pip's common pose application owns hips Y=.34 and leg Y=.02. This neutral
  // offset fits those coordinates to the approved pets' .5-high hip sockets.
  const base = pivot(squash, "base", 0, 0.14);
  const hips = pivot(base, "hips", 0, 0.34);
  const torso = pivot(hips, "torso");
  const breath = pivot(torso, "breath");
  const neck = pivot(breath, "neck", 0, 0.91);
  const head = pivot(neck, "head", 0, 0.31);
  const arms = [-1, 1].map((side, i) => pivot(breath, `arm-${i}`, side * 0.39, 0.6));
  const elbows = arms.map((arm, i) => pivot(arm, `elbow-${i}`, 0, -0.2));
  const legs = [-1, 1].map((side, i) => pivot(hips, `leg-${i}`, side * 0.22, 0.02));
  const knees = legs.map((leg, i) => pivot(leg, `knee-${i}`, 0, -0.16, 0.015));
  const feet = knees.map((knee, i) => pivot(knee, `foot-${i}`, 0, -0.16, 0.065));
  const bounds = new Box3();
  const center = new Vector3();
  model.updateMatrixWorld(true);
  for (const mesh of pieces) {
    const limb = mesh.userData.limb;
    if (limb) {
      const index = limb.side > 0 ? 1 : 0;
      if (limb.kind === "arm") articulatePetLimb(mesh, arms[index], elbows[index], model);
      else if (limb.kind === "leg") articulatePetLimb(mesh, legs[index], knees[index], model);
      else if (limb.kind === "foot") feet[index].attach(mesh);
      else if (limb.kind === "held") elbows[index].attach(mesh);
      continue;
    }
    bounds.setFromObject(mesh).getCenter(center);
    if (center.y >= 1.42) head.attach(mesh);
    else breath.attach(mesh);
  }
  model.name = "pet-body";
  const smile = model.userData.smile;
  mouthO.visible = false;
  return {
    head,
    squash,
    hips,
    torso,
    breath,
    neck,
    arms,
    elbows,
    legs,
    knees,
    feet,
    armL: arms[1],
    armR: arms[0],
    legL: legs[1],
    legR: legs[0],
    smile,
    mouthO,
  };
}
