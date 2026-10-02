/** Front-facing and cursor targets, ghost placement visualization and lantern light updates. */
import * as THREE from "three";
import { buildingState } from "../state.js";
import { isBuildingPointerLocked } from "../input/is-building-pointer-locked.js";
import { raycastBuildingTerrain } from "../terrain-adapter/raycast-building-terrain.js";
import { findFrontBuildingTarget } from "./find-front-building-target.js";
import { isBuildingBlockSolid } from "../terrain-adapter/is-building-block-solid.js";
import { isBlockWithinWorldBounds } from "../commands/is-block-within-world-bounds.js";
import { doesBlockOverlapPlayer } from "../commands/does-block-overlap-player.js";
export function updateBuildingTarget() {
  let camera = buildingState.buildingContext.camera;
  let playerPosition =
    buildingState.buildingContext.player?.position ??
    buildingState.buildingContext.player?.mesh?.position;
  let usingGamepad = buildingState.buildingContext.player?.input?.lastDevice === `gamepad`;
  const firstPerson = !!buildingState.buildingContext.petTown?.controller.firstPerson;
  let usingCursor =
    !firstPerson &&
    buildingState.buildingRuntime.mode === `cursor` &&
    buildingState.buildingRuntime.mouseSeen &&
    !isBuildingPointerLocked() &&
    !usingGamepad;
  let target;
  if (usingCursor || firstPerson || !playerPosition) {
    buildingState.buildingRaycaster.setFromCamera(
      usingCursor ? buildingState.buildingRuntime.mouseNDC : new THREE.Vector2(0, 0),
      camera,
    );
    buildingState.buildingRayOriginScratch.copy(buildingState.buildingRaycaster.ray.origin);
    buildingState.buildingRayDirectionScratch.copy(buildingState.buildingRaycaster.ray.direction);
    let rayLimit = 80;
    let rayStart = 0;
    if (
      (playerPosition &&
        (buildingState.buildingPlayerPositionScratch.copy(playerPosition),
        (buildingState.buildingPlayerPositionScratch.y += 1.2),
        (rayStart = Math.max(
          0,
          buildingState.buildingPlayerPositionScratch
            .clone()
            .sub(buildingState.buildingRayOriginScratch)
            .dot(buildingState.buildingRayDirectionScratch) -
            buildingState.maximumBuildingReach -
            1,
        )),
        (rayLimit = rayStart + 18 + 2)),
      buildingState.buildingRayOriginScratch.addScaledVector(
        buildingState.buildingRayDirectionScratch,
        rayStart,
      ),
      (target = raycastBuildingTerrain(
        buildingState.buildingRayOriginScratch,
        buildingState.buildingRayDirectionScratch,
        rayLimit - rayStart,
      )),
      (buildingState.buildingRuntime.creature = null),
      usingCursor && typeof buildingState.buildingContext.creatureAt == `function`)
    ) {
      try {
        buildingState.buildingRaycaster.far = target
          ? rayStart + (Number.isFinite(target.dist) ? target.dist : rayLimit) + 0.5
          : 40;
        let creature = buildingState.buildingContext.creatureAt(buildingState.buildingRaycaster);
        if (creature) {
          buildingState.buildingRuntime.creature = creature;
          target = null;
        }
      } catch {}
      buildingState.buildingRaycaster.far = 1 / 0;
    }
    if (
      target &&
      playerPosition &&
      Math.hypot(
        target.x + 0.5 - buildingState.buildingPlayerPositionScratch.x,
        target.y + 0.5 - buildingState.buildingPlayerPositionScratch.y,
        target.z + 0.5 - buildingState.buildingPlayerPositionScratch.z,
      ) > buildingState.maximumBuildingReach
    ) {
      target = null;
    }
  } else {
    target = findFrontBuildingTarget();
  }
  if (
    ((buildingState.buildingRuntime.target = target),
    (buildingState.buildingRuntime.usingCursor = usingCursor),
    target)
  ) {
    let placement = {
      x: target.x + target.nx,
      y: target.y + target.ny,
      z: target.z + target.nz,
    };
    buildingState.buildingRuntime.place = placement;
    buildingState.buildingRuntime.canPlace =
      !(
        buildingState.buildingRuntime.blockAtWorks &&
        isBuildingBlockSolid(placement.x, placement.y, placement.z)
      ) &&
      isBlockWithinWorldBounds(placement.x, placement.y, placement.z) &&
      !doesBlockOverlapPlayer(placement.x, placement.y, placement.z) &&
      buildingState.resolvedBuildingPalette[buildingState.buildingRuntime.selected].available;
    buildingState.buildingAimPositionScratch
      .set(
        target.x + 0.5 + target.nx * 0.5,
        target.y + 0.5 + target.ny * 0.5,
        target.z + 0.5 + target.nz * 0.5,
      )
      .project(camera);
    buildingState.buildingRuntime.aim.x =
      ((buildingState.buildingAimPositionScratch.x + 1) / 2) *
      (buildingState.buildingContext.viewport?.width ?? innerWidth);
    buildingState.buildingRuntime.aim.y =
      ((1 - buildingState.buildingAimPositionScratch.y) / 2) *
      (buildingState.buildingContext.viewport?.height ?? innerHeight);
    buildingState.buildingRuntime.aim.visible = buildingState.buildingAimPositionScratch.z < 1;
  } else {
    buildingState.buildingRuntime.place = null;
    buildingState.buildingRuntime.canPlace = false;
    buildingState.buildingRuntime.aim.visible = false;
  }
  let cursor = usingCursor
    ? buildingState.buildingRuntime.creature
      ? buildingState.buildingCursorStyles.pet
      : target
        ? buildingState.buildingRuntime.canPlace
          ? buildingState.buildingCursorStyles.aim
          : buildingState.buildingCursorStyles.bad
        : buildingState.buildingCursorStyles.idle
    : ``;
  if (cursor !== buildingState.buildingRuntime.cursor && buildingState.buildingRuntime.cv) {
    buildingState.buildingRuntime.cursor = cursor;
    buildingState.buildingRuntime.cv.style.cursor = cursor;
  }
}
