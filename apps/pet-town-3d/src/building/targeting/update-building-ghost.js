/** Front-facing and cursor targets, ghost placement visualization and lantern light updates. */
import { buildingState } from "../state.js";
import { isBuildingInputBlocked } from "../input/is-building-input-blocked.js";
import { doesBlockOverlapPlayer } from "../commands/does-block-overlap-player.js";
import { getBuildingNightAmount } from "./get-building-night-amount.js";
export function updateBuildingGhost(deltaTime) {
  let target2 = buildingState.buildingRuntime.target;
  let result =
    buildingState.buildingContext.hud?.photoMode || buildingState.buildingContext.hud?.hidden;
  let result2 = performance.now();
  let result3 =
    !!target2 &&
    !result &&
    !isBuildingInputBlocked() &&
    !buildingState.buildingRuntime.quiet &&
    result2 < buildingState.buildingRuntime.activeUntil &&
    !buildingState.buildingContext.hud?.bannerActive;
  let result4 =
    result3 &&
    !!buildingState.buildingRuntime.place &&
    buildingState.resolvedBuildingPalette[buildingState.buildingRuntime.selected].available &&
    !doesBlockOverlapPlayer(
      buildingState.buildingRuntime.place.x,
      buildingState.buildingRuntime.place.y,
      buildingState.buildingRuntime.place.z,
      0.12,
    );
  if (result) {
    buildingState.buildingRuntime.fade = buildingState.buildingRuntime.ghostFade = 0;
  }
  buildingState.buildingRuntime.fade +=
    (+!!result3 - buildingState.buildingRuntime.fade) *
    (1 - Math.exp(-deltaTime * (result3 ? 12 : 6)));
  buildingState.buildingRuntime.ghostFade +=
    (+!!result4 - buildingState.buildingRuntime.ghostFade) *
    (1 - Math.exp(-deltaTime * (result4 ? 12 : 8)));
  let result5 = buildingState.buildingContext.time ?? result2 / 1e3;
  if (
    ((buildingState.targetOutlineMesh.material.uniforms.uTime.value =
      buildingState.placementOutlineMesh.material.uniforms.uTime.value =
        result5),
    (buildingState.targetOutlineMesh.visible = buildingState.buildingRuntime.fade > 0.01),
    (buildingState.placementGhostMesh.visible = buildingState.placementOutlineMesh.visible =
      buildingState.buildingRuntime.ghostFade > 0.01),
    !buildingState.targetOutlineMesh.visible && !buildingState.placementGhostMesh.visible)
  ) {
    buildingState.smoothedPlacementPosition = null;
    return;
  }
  let buildingNightAmountResult = getBuildingNightAmount();
  if (
    (target2 &&
      (buildingState.targetOutlineMesh.position.set(
        target2.x + 0.5,
        target2.y + 0.5,
        target2.z + 0.5,
      ),
      buildingState.targetOutlineMesh.material.uniforms.uFace.value.set(
        target2.nx,
        target2.ny,
        target2.nz,
      )),
    (buildingState.targetOutlineMesh.material.uniforms.uOpacity.value =
      (1 - 0.45 * buildingNightAmountResult) * buildingState.buildingRuntime.fade),
    buildingState.buildingRuntime.place && result4)
  ) {
    let result6 = buildingState.buildingAimPositionScratch.set(
      buildingState.buildingRuntime.place.x + 0.5,
      buildingState.buildingRuntime.place.y + 0.5,
      buildingState.buildingRuntime.place.z + 0.5,
    );
    if (
      !buildingState.smoothedPlacementPosition ||
      buildingState.smoothedPlacementPosition.distanceTo(result6) > 3
    ) {
      buildingState.smoothedPlacementPosition = result6.clone();
    } else {
      buildingState.smoothedPlacementPosition.lerp(result6, 1 - Math.exp(-deltaTime * 26));
    }
  }
  if (buildingState.placementGhostMesh.visible && buildingState.smoothedPlacementPosition) {
    buildingState.placementGhostScale +=
      (1 - buildingState.placementGhostScale) * (1 - Math.exp(-deltaTime * 12));
    buildingState.placementDeniedShake = Math.max(
      0,
      buildingState.placementDeniedShake - deltaTime * 3,
    );
    let result7 =
      (0.93 + 0.02 * Math.sin(result5 * 4)) *
      buildingState.placementGhostScale *
      (0.9 + 0.1 * buildingState.buildingRuntime.ghostFade);
    buildingState.placementGhostMesh.position.copy(buildingState.smoothedPlacementPosition);
    buildingState.placementGhostMesh.position.x +=
      Math.sin(buildingState.placementDeniedShake * 40) * buildingState.placementDeniedShake * 0.08;
    buildingState.placementOutlineMesh.position.copy(buildingState.placementGhostMesh.position);
    buildingState.placementGhostMesh.scale.setScalar(result7);
    buildingState.placementOutlineMesh.scale.setScalar(result7 + 0.004);
    let canPlace2 = buildingState.buildingRuntime.canPlace;
    buildingState.placementOutlineMesh.material.uniforms.uColor.value.set(
      canPlace2 ? `#fff3c4` : `#ff8a7a`,
    );
    for (let result8 of buildingState.placementGhostMesh.material) {
      result8.opacity =
        (canPlace2 ? 0.4 + 0.04 * Math.sin(result5 * 4) : 0.14) *
        buildingState.buildingRuntime.ghostFade;
    }
    buildingState.placementOutlineMesh.material.uniforms.uOpacity.value =
      (canPlace2 ? 0.9 : 0.75) *
      (1 - 0.35 * buildingNightAmountResult) *
      buildingState.buildingRuntime.ghostFade;
  }
}
