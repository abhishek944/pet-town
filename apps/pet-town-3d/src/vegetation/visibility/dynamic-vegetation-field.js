/** Quality tiers, instance density, visibility updates and dynamic vegetation instances. */
import * as THREE from "three";
import { vegetationState } from "../state.js";
import { VegetationInstanceField } from "../instances/vegetation-instance-field.js";
export let DynamicVegetationField = class {
  constructor(value, value2, value3, value4) {
    this.name = value;
    this.o = {
      kind: `small`,
    };
    this.cap = value4;
    this.free = [];
    this.mesh = new THREE.InstancedMesh(value2, value3, value4);
    this.mesh.name = `veg:dyn_` + value;
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.receiveShadow = true;
    this.mesh.setColorAt(0, vegetationState.vegetationInstanceColor.setRGB(1, 1, 1));
  }
  add(value, value2, value3, value4, value5, value6) {
    let result = this.free.pop();
    if (result === undefined) {
      if (this.mesh.count >= this.cap) {
        return null;
      }
      result = this.mesh.count++;
    }
    let options = {
      field: this,
      x: value,
      y: value2,
      z: value3,
      ry: value4,
      rx: 0,
      rz: 0,
      sx: value5,
      sy: value5,
      sz: value5,
      mesh: this.mesh,
      mi: result,
      hidden: false,
      kind: `small`,
    };
    this.mesh.setMatrixAt(
      result,
      VegetationInstanceField.prototype.matrixOf.call(
        this,
        options,
        vegetationState.vegetationInstanceMatrix,
      ),
    );
    this.mesh.setColorAt(result, value6 || vegetationState.vegetationInstanceColor.setRGB(1, 1, 1));
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor.needsUpdate = true;
    return options;
  }
  hide(hiddenValue) {
    if (!hiddenValue.hidden) {
      hiddenValue.hidden = true;
      this.mesh.setMatrixAt(hiddenValue.mi, vegetationState.hiddenVegetationMatrix);
      this.mesh.instanceMatrix.needsUpdate = true;
      this.free.push(hiddenValue.mi);
    }
  }
  update(hiddenValue) {
    if (!hiddenValue.hidden) {
      this.mesh.setMatrixAt(
        hiddenValue.mi,
        VegetationInstanceField.prototype.matrixOf.call(
          this,
          hiddenValue,
          vegetationState.vegetationInstanceMatrix,
        ),
      );
      this.mesh.instanceMatrix.needsUpdate = true;
    }
  }
  dispose() {
    this.mesh.removeFromParent();
    this.mesh.dispose();
  }
};
