/** Procedurally constructed Pip model, facial expressions and blended locomotion animation. */
import * as THREE from "three";
import { addPlayerRigGroup } from "../rig-builders/add-player-rig-group.js";
import { addPlayerEllipsoidMesh } from "../rig-builders/add-player-ellipsoid-mesh.js";
import { addPlayerRigMesh } from "../rig-builders/add-player-rig-mesh.js";
import { addPlayerCapsuleMesh } from "../rig-builders/add-player-capsule-mesh.js";
export function buildPlayerLimbsAndTail(breath, materials, hips) {
  this.arms = [];
  this.elbows = [];
  for (let result63 of [-1, 1]) {
    let addPlayerRigGroupResult14 = addPlayerRigGroup(breath, result63 * 0.228, 0.28, 0.02);
    addPlayerCapsuleMesh(addPlayerRigGroupResult14, materials.fur, 0.07, 0.02, -0.05);
    let addPlayerRigGroupResult15 = addPlayerRigGroup(addPlayerRigGroupResult14, 0, -0.1, 0);
    addPlayerCapsuleMesh(addPlayerRigGroupResult15, materials.fur, 0.064, 0.03, -0.045);
    addPlayerEllipsoidMesh(addPlayerRigGroupResult15, materials.fur, 0.078, 1, 1, 1, 0, -0.118, 0);
    let addPlayerEllipsoidMeshResult8 = addPlayerEllipsoidMesh(
      addPlayerRigGroupResult15,
      materials.pad,
      0.05,
      0.4,
      0.85,
      0.85,
      -result63 * 0.058,
      -0.124,
      0.012,
      true,
    );
    addPlayerEllipsoidMeshResult8.castShadow = false;
    let addPlayerRigMeshResult12 = addPlayerRigMesh(
      addPlayerRigGroupResult15,
      new THREE.TorusGeometry(0.063, 0.014, 8, 20).rotateX(Math.PI / 2),
      materials.furLight,
      false,
    );
    addPlayerRigMeshResult12.position.y = -0.07;
    this.arms.push(addPlayerRigGroupResult14);
    this.elbows.push(addPlayerRigGroupResult15);
  }
  this.armL = this.arms[1];
  this.armR = this.arms[0];
  this.legs = [];
  this.knees = [];
  this.feet = [];
  for (let result64 of [-1, 1]) {
    let addPlayerRigGroupResult16 = addPlayerRigGroup(hips, result64 * 0.115, 0.02, 0);
    addPlayerCapsuleMesh(addPlayerRigGroupResult16, materials.fur, 0.088, 0.03, -0.065);
    let addPlayerRigGroupResult17 = addPlayerRigGroup(addPlayerRigGroupResult16, 0, -0.13, 0);
    addPlayerCapsuleMesh(addPlayerRigGroupResult17, materials.fur, 0.08, 0.04, -0.06);
    let addPlayerRigGroupResult18 = addPlayerRigGroup(addPlayerRigGroupResult17, 0, -0.142, 0.02);
    addPlayerEllipsoidMesh(
      addPlayerRigGroupResult18,
      materials.boot,
      0.105,
      0.95,
      0.72,
      1.32,
      0,
      0,
      0.02,
    );
    addPlayerEllipsoidMesh(
      addPlayerRigGroupResult18,
      materials.sole,
      0.1,
      0.96,
      0.25,
      1.3,
      0,
      -0.055,
      0.02,
      true,
    );
    this.legs.push(addPlayerRigGroupResult16);
    this.knees.push(addPlayerRigGroupResult17);
    this.feet.push(addPlayerRigGroupResult18);
  }
  this.legL = this.legs[1];
  this.legR = this.legs[0];
  this.tail = addPlayerRigGroup(hips, 0, 0.05, -0.19, `tail`);
  addPlayerEllipsoidMesh(this.tail, materials.fur, 0.1, 1, 0.95, 1, 0, 0, -0.05);
  this.tail2 = addPlayerRigGroup(this.tail, 0, 0.02, -0.1, `tail2`);
  addPlayerEllipsoidMesh(this.tail2, materials.cream, 0.075, 1, 0.95, 0.9, 0, 0.01, -0.03);
}
