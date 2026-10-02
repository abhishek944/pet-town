/** Spring-driven secondary bone motion with angle constraints. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
import { clampCreatureValue } from "../math/clamp-creature-value.js";
export let creatureJiggleBone = class {
  constructor(userDataValue) {
    let jiggle2 = userDataValue.userData.jiggle;
    this.obj = userDataValue;
    this.q0 = userDataValue.quaternion.clone();
    this.dir = new THREE.Vector3(...jiggle2.dir).normalize();
    this.len = jiggle2.len;
    this.k = jiggle2.k;
    this.d = jiggle2.d;
    this.grav = jiggle2.grav;
    this.limit = jiggle2.limit;
    this.p = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.init = false;
    this.impulse = new THREE.Vector3();
    this.wagAxis = new THREE.Vector3(0, 1, 0).applyQuaternion(this.q0.clone().invert()).normalize();
    this.name = userDataValue.name;
  }
  reset() {
    this.init = false;
  }
  update(value) {
    let obj2 = this.obj;
    obj2.quaternion.copy(this.q0);
    if (obj2.userData.animQ) {
      obj2.quaternion.multiply(obj2.userData.animQ);
    }
    obj2.updateMatrixWorld(false);
    let setFromMatrixPositionResult =
      creaturesState.creatureWorldPositionScratch.setFromMatrixPosition(obj2.matrixWorld);
    let applyMatrix4Result = creaturesState.creatureWorldTargetScratch
      .copy(this.dir)
      .multiplyScalar(this.len)
      .applyMatrix4(obj2.matrixWorld);
    let result = applyMatrix4Result.distanceTo(setFromMatrixPositionResult) || 1e-4;
    if (!this.init || value <= 0) {
      this.p.copy(applyMatrix4Result);
      this.vel.set(0, 0, 0);
      this.init = true;
      return;
    }
    let result2 = Math.max(1, Math.ceil(value * 120));
    let result3 = value / result2;
    for (let index = 0; index < result2; index++) {
      let result6 = this.k * (applyMatrix4Result.x - this.p.x) - this.d * this.vel.x;
      let result7 = this.k * (applyMatrix4Result.y - this.p.y) - this.d * this.vel.y - this.grav;
      let result8 = this.k * (applyMatrix4Result.z - this.p.z) - this.d * this.vel.z;
      this.vel.x += result6 * result3;
      this.vel.y += result7 * result3;
      this.vel.z += result8 * result3;
      this.p.addScaledVector(this.vel, result3);
    }
    this.vel.add(this.impulse);
    this.impulse.set(0, 0, 0);
    let values = this.p.clone().sub(setFromMatrixPositionResult);
    let result4 = values.length() || 1e-4;
    this.p.copy(setFromMatrixPositionResult).addScaledVector(values, result / result4);
    creaturesState.creatureWorldMatrixScratch.copy(obj2.matrixWorld).invert();
    let normalizeResult = this.p
      .clone()
      .applyMatrix4(creaturesState.creatureWorldMatrixScratch)
      .normalize();
    creaturesState.creatureJiggleRotationScratch.setFromUnitVectors(this.dir, normalizeResult);
    let result5 =
      2 * Math.acos(clampCreatureValue(creaturesState.creatureJiggleRotationScratch.w, -1, 1));
    if (result5 > this.limit) {
      creaturesState.creatureJiggleRotationScratch.slerpQuaternions(
        creaturesState.creatureJiggleIdentityScratch.identity(),
        creaturesState.creatureJiggleRotationScratch,
        this.limit / result5,
      );
    }
    obj2.quaternion.multiply(creaturesState.creatureJiggleRotationScratch);
  }
};
