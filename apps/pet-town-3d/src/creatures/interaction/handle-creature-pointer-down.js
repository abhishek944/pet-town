/** Ray picking, petting reactions and pointer interaction. */
import * as THREE from "three";
import { creaturesState } from "../state.js";
import { raycastCreature } from "./raycast-creature.js";
import { petCreature } from "./pet-creature.js";
export function handleCreaturePointerDown(event) {
  if (event.button !== 0 || !creaturesState.creaturesRuntime?.spawned) {
    return;
  }
  let ctx2 = creaturesState.creaturesRuntime.ctx;
  let camera2 = ctx2.camera;
  if (!camera2) {
    return;
  }
  let result = ctx2.canvas ?? ctx2.renderer?.domElement;
  if (!result || (event.target !== result && !document.pointerLockElement)) {
    return;
  }
  let point = new THREE.Vector2();
  if (document.pointerLockElement) {
    point.set(0, 0);
  } else {
    let boundingClientRectResult = result.getBoundingClientRect();
    point.set(
      ((event.clientX - boundingClientRectResult.left) / boundingClientRectResult.width) * 2 - 1,
      -((event.clientY - boundingClientRectResult.top) / boundingClientRectResult.height) * 2 + 1,
    );
  }
  let raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(point, camera2);
  raycaster.far = 30;
  let raycastCreatureResult = raycastCreature(raycaster);
  if (!raycastCreatureResult) {
    return;
  }
  let position2 = ctx2.player?.position;
  if (
    position2?.isVector3
      ? Math.hypot(
          position2.x - raycastCreatureResult.position.x,
          position2.z - raycastCreatureResult.position.z,
        ) < 5.5
      : raycastCreatureResult.hitDistance < 16
  ) {
    petCreature(raycastCreatureResult);
    ctx2.lastCreatureClick = {
      time: ctx2.time,
      creature: raycastCreatureResult,
    };
    event.stopImmediatePropagation();
  }
}
