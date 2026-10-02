/** Editable terrain lifecycle, chunks, water masks, raycasting, custom blocks, block icons and lighting updates. */
import * as THREE from "three";
import { terrainState } from "../state.js";
export function createTerrainRaycaster(state) {
  return function (origin, direction, maxDistance = 64) {
    let directionLength = Math.hypot(direction.x, direction.y, direction.z) || 1;
    let directionX = direction.x / directionLength;
    let directionY = direction.y / directionLength;
    let directionZ = direction.z / directionLength;
    let originGridX = origin.x + 64;
    let originY = origin.y;
    let originGridZ = origin.z + 64;
    let cellX = Math.floor(originGridX);
    let cellY = Math.floor(originY);
    let cellZ = Math.floor(originGridZ);
    let stepX = directionX > 0 ? 1 : -1;
    let stepY = directionY > 0 ? 1 : -1;
    let stepZ = directionZ > 0 ? 1 : -1;
    let deltaX = Math.abs(1 / directionX);
    let deltaY = Math.abs(1 / directionY);
    let deltaZ = Math.abs(1 / directionZ);
    let nextX =
      directionX === 0
        ? 1 / 0
        : (stepX > 0 ? cellX + 1 - originGridX : originGridX - cellX) * deltaX;
    let nextY =
      directionY === 0 ? 1 / 0 : (stepY > 0 ? cellY + 1 - originY : originY - cellY) * deltaY;
    let nextZ =
      directionZ === 0
        ? 1 / 0
        : (stepZ > 0 ? cellZ + 1 - originGridZ : originGridZ - cellZ) * deltaZ;
    let distance = 0;
    let normalX = 0;
    let normalY = 0;
    let normalZ = 0;
    for (let steps = 0; steps < 1024 && distance <= maxDistance; steps++) {
      let blockId =
        cellY < 0 ? terrainState.terrainBlockIds.DARKSTONE : state.gridBlockAt(cellX, cellY, cellZ);
      if (blockId) {
        return {
          point: new THREE.Vector3(
            origin.x + directionX * distance,
            origin.y + directionY * distance,
            origin.z + directionZ * distance,
          ),
          normal: new THREE.Vector3(normalX, normalY, normalZ),
          block: {
            x: cellX - 64,
            y: cellY,
            z: cellZ - 64,
            id: blockId,
          },
          place: {
            x: cellX - 64 + normalX,
            y: cellY + normalY,
            z: cellZ - 64 + normalZ,
          },
          distance: distance,
        };
      }
      if (
        (nextX < nextY && nextX < nextZ
          ? ((cellX += stepX),
            (distance = nextX),
            (nextX += deltaX),
            (normalX = -stepX),
            (normalY = 0),
            (normalZ = 0))
          : nextY < nextZ
            ? ((cellY += stepY),
              (distance = nextY),
              (nextY += deltaY),
              (normalX = 0),
              (normalY = -stepY),
              (normalZ = 0))
            : ((cellZ += stepZ),
              (distance = nextZ),
              (nextZ += deltaZ),
              (normalX = 0),
              (normalY = 0),
              (normalZ = -stepZ)),
        cellY >= 40 && directionY > 0)
      ) {
        break;
      }
    }
    return null;
  };
}
