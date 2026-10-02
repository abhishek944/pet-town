/** Selection and preview meshes, skinned block instances, debris and block animations. */
import * as THREE from "three";
import { buildingState } from "../state.js";
export function emitBlockDebris(x, y, z, colors, count = 14, speedScale = 1) {
  for (let index = 0; index < count; index++) {
    if (buildingState.blockDebrisParticles.length >= 160) {
      buildingState.blockDebrisParticles.shift();
    }
    let result = Math.random() * Math.PI * 2;
    let result2 = (1.5 + Math.random() * 2.5) * speedScale;
    buildingState.blockDebrisParticles.push({
      p: new THREE.Vector3(
        x + 0.5 + (Math.random() - 0.5) * 0.7,
        y + 0.5 + (Math.random() - 0.5) * 0.7,
        z + 0.5 + (Math.random() - 0.5) * 0.7,
      ),
      v: new THREE.Vector3(
        Math.cos(result) * result2,
        3 + Math.random() * 3.5 * speedScale,
        Math.sin(result) * result2,
      ),
      r: new THREE.Vector3(Math.random() * 6, Math.random() * 6, 0),
      w: new THREE.Vector3((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, 0),
      s: 0.1 + Math.random() * 0.12,
      life: 0,
      max: 0.7 + Math.random() * 0.5,
      c: new THREE.Color(colors[index % colors.length]),
    });
  }
}
