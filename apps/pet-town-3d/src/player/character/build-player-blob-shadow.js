/** Procedurally constructed Pip model, facial expressions and blended locomotion animation. */
import * as THREE from "three";
import { createPlayerBlobShadowTexture } from "../rig-builders/create-player-blob-shadow-texture.js";
export function buildPlayerBlobShadow() {
  let meshBasicMaterial = new THREE.MeshBasicMaterial({
    map: createPlayerBlobShadowTexture(),
    color: 1909811,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  this.shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    meshBasicMaterial,
  );
  this.shadow.renderOrder = 2;
  this.shadow.name = `playerBlobShadow`;
}
