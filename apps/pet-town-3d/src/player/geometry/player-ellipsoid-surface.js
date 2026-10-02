/** Procedural ellipsoids, iris highlights, tubes, straps, decals, stitched patches and surface projection. */
import * as THREE from "three";
import { playerState } from "../state.js";
export let playerEllipsoidSurface = class {
  constructor(value, value2) {
    this.c = new THREE.Vector3(...value);
    this.r = value2;
  }
  at(value, value2, value3 = 0, setValue = new THREE.Vector3()) {
    let r2 = this.r;
    let result = value - this.c.x;
    let result2 = value2 - this.c.y;
    let result3 = Math.max(0, 1 - (result / r2[0]) ** 2 - (result2 / r2[1]) ** 2);
    let result4 = this.c.z + r2[2] * Math.sqrt(result3);
    setValue.set(value, value2, result4);
    let normalResult = this.normal(setValue, playerState.playerSurfaceNormalScratch);
    return setValue.addScaledVector(normalResult, value3);
  }
  normal(position, setValue = new THREE.Vector3()) {
    let r2 = this.r;
    return setValue
      .set(
        (position.x - this.c.x) / r2[0] ** 2,
        (position.y - this.c.y) / r2[1] ** 2,
        (position.z - this.c.z) / r2[2] ** 2,
      )
      .normalize();
  }
};
