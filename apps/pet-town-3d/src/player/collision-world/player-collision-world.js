import { playerWorldParse } from "./player-world-parse.js";
import { playerWorldGatherCamOccluders } from "./player-world-gather-cam-occluders.js";
import { playerWorldCanopyOnSegment } from "./player-world-canopy-on-segment.js";
import { playerWorldCanopySpan } from "./player-world-canopy-span.js";
import { playerWorldRaycastColliders } from "./player-world-raycast-colliders.js";
import { playerWorldPlatformHeight } from "./player-world-platform-height.js";
import { playerWorldGatherColliders } from "./player-world-gather-colliders.js";
import { playerWorldRaycast } from "./player-world-raycast.js";
import { playerWorldWaterSurface } from "./player-world-water-surface.js";
import { getPlayerWorldWaterLevel } from "./get-player-world-water-level.js";
import { playerWorldBoxFree } from "./player-world-box-free.js";
import { playerWorldSurfaceAt } from "./player-world-surface-at.js";
import { playerWorldLandingY } from "./player-world-landing-y.js";
import { playerWorldGroundBelow } from "./player-world-ground-below.js";
import { playerWorldRawTop } from "./player-world-raw-top.js";
import { playerWorldSolidCam } from "./player-world-solid-cam.js";
import { playerWorldSolid } from "./player-world-solid.js";
import { getPlayerWorldFloorY } from "./get-player-world-floor-y.js";
import { getPlayerWorldBounds } from "./get-player-world-bounds.js";
import { playerWorldSolidValue } from "./player-world-solid-value.js";
import { playerWorldBlock } from "./player-world-block.js";
import { playerWorldProbe } from "./player-world-probe.js";
import { playerWorldScanIds } from "./player-world-scan-ids.js";
import { playerWorldRefresh } from "./player-world-refresh.js";
import { getPlayerWorldT } from "./get-player-world-t.js";
import { initializePlayerWorld } from "./initialize-player-world.js";
export let playerCollisionWorld = class {
  constructor(context) {
    return initializePlayerWorld.call(this, context);
  }
  get t() {
    return getPlayerWorldT.call(this);
  }
  refresh(deltaTime) {
    return playerWorldRefresh.call(this, deltaTime);
  }
  _scanIds() {
    return playerWorldScanIds.call(this);
  }
  _probe() {
    return playerWorldProbe.call(this);
  }
  block(x, y, z) {
    return playerWorldBlock.call(this, x, y, z);
  }
  solidValue(block) {
    return playerWorldSolidValue.call(this, block);
  }
  get bounds() {
    return getPlayerWorldBounds.call(this);
  }
  get floorY() {
    return getPlayerWorldFloorY.call(this);
  }
  solid(x, y, z) {
    return playerWorldSolid.call(this, x, y, z);
  }
  solidCam(x, y, z) {
    return playerWorldSolidCam.call(this, x, y, z);
  }
  _rawTop(x, z) {
    return playerWorldRawTop.call(this, x, z);
  }
  groundBelow(x, y, z, maxDepth = 40, forCamera = false) {
    return playerWorldGroundBelow.call(this, x, y, z, maxDepth, forCamera);
  }
  landingY(x, z) {
    return playerWorldLandingY.call(this, x, z);
  }
  surfaceAt(x, z) {
    return playerWorldSurfaceAt.call(this, x, z);
  }
  boxFree(minX, minY, minZ, maxX, maxY, maxZ) {
    return playerWorldBoxFree.call(this, minX, minY, minZ, maxX, maxY, maxZ);
  }
  get waterLevel() {
    return getPlayerWorldWaterLevel.call(this);
  }
  waterSurface(x, y, z) {
    return playerWorldWaterSurface.call(this, x, y, z);
  }
  raycast(x, y, z, dx, dy, dz, maxDistance, forCamera = false) {
    return playerWorldRaycast.call(this, x, y, z, dx, dy, dz, maxDistance, forCamera);
  }
  gatherColliders(x, y, z, radius = 5) {
    return playerWorldGatherColliders.call(this, x, y, z, radius);
  }
  platformHeight(x, z, maxHeight) {
    return playerWorldPlatformHeight.call(this, x, z, maxHeight);
  }
  raycastColliders(x, y, z, dx, dy, dz, maxDistance) {
    return playerWorldRaycastColliders.call(this, x, y, z, dx, dy, dz, maxDistance);
  }
  canopySpan(x, y, z, dx, dy, dz, maxDistance) {
    return playerWorldCanopySpan.call(this, x, y, z, dx, dy, dz, maxDistance);
  }
  canopyOnSegment(start, end, padding = 0.4) {
    return playerWorldCanopyOnSegment.call(this, start, end, padding);
  }
  _gatherCamOccluders(x, z, radius) {
    return playerWorldGatherCamOccluders.call(this, x, z, radius);
  }
  _parse(collider, isTree, x, z, radius) {
    return playerWorldParse.call(this, collider, isTree, x, z, radius);
  }
};
