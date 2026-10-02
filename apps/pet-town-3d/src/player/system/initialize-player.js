import { createPlayerContextApi } from "./create-player-context-api.js";
/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import * as THREE from "three";
import { playerCollisionWorld } from "../collision-world/player-collision-world.js";
import { playerPhysicsBody } from "../physics/player-physics-body.js";
import { playerCharacter } from "../character/player-character.js";
import { playerInputController } from "../input/player-input-controller.js";
import { playerFollowCamera } from "../camera/player-follow-camera.js";
import { parsePlayerNumberList } from "./parse-player-number-list.js";
import { findPlayerDrySpawn } from "./find-player-dry-spawn.js";
import { configurePlayerFixedCamera } from "./configure-player-fixed-camera.js";
import { findPlayerVillageLookTarget } from "./find-player-village-look-target.js";
import { playerState } from "../state.js";
import { getPlayerCameraFrame } from "./get-player-camera-frame.js";
import { configurePlayerAnimationDemo } from "./configure-player-animation-demo.js";
import { choosePlayerSpawnWithClearCamera } from "./choose-player-spawn-with-clear-camera.js";
import { interpolatePlayerRenderTransform } from "./interpolate-player-render-transform.js";
export function initializePlayer(context) {
  let params = context.params ?? new URLSearchParams(location.search);
  let world = new playerCollisionWorld(context);
  world.refresh(0);
  let body = new playerPhysicsBody(world);
  let character = new playerCharacter();
  context.scene.add(character.root, character.shadow);
  let input = new playerInputController(context);
  let camera = new playerFollowCamera(context, world);
  let spawnX;
  let spawnZ;
  let spawnOverride = parsePlayerNumberList(params.get(`player`));
  let terrainSpawn = context.terrain?.spawn;
  if (spawnOverride && spawnOverride.length >= 2) {
    spawnX = spawnOverride[0];
    spawnZ = spawnOverride[1];
  } else {
    if (
      terrainSpawn &&
      isFinite(terrainSpawn.x) &&
      isFinite(terrainSpawn.z) &&
      Math.hypot(terrainSpawn.x, terrainSpawn.z) < 12
    ) {
      [spawnX, spawnZ] = findPlayerDrySpawn(world, terrainSpawn.x, terrainSpawn.z);
    } else {
      [spawnX, spawnZ] = findPlayerDrySpawn(world, 0.5, 0.5);
    }
  }
  let groundY = world.landingY(spawnX, spawnZ);
  body.spawn.set(spawnX, groundY, spawnZ);
  body.teleport(spawnX, groundY + 0.002, spawnZ);
  let demoAnimation = (params.get(`anim`) || ``).toLowerCase();
  let faceOverride = params.get(`face`);
  let facing = faceOverride == null ? 0 : THREE.MathUtils.degToRad(+faceOverride);
  let fixedCamera = parsePlayerNumberList(params.get(`cam`));
  let relativeCamera = parsePlayerNumberList(params.get(`camrel`));
  if (
    (fixedCamera && fixedCamera.length >= 6
      ? configurePlayerFixedCamera(context, camera, fixedCamera, null)
      : relativeCamera && relativeCamera.length >= 6
        ? configurePlayerFixedCamera(context, camera, relativeCamera, body.pos)
        : params.has(`nocam`) && (camera.frozen = true),
    !camera.frozen && faceOverride == null)
  ) {
    let playerVillageLookTargetResult = findPlayerVillageLookTarget(context, body.pos);
    if (playerVillageLookTargetResult) {
      facing = Math.atan2(
        playerVillageLookTargetResult.x - body.pos.x,
        playerVillageLookTargetResult.z - body.pos.z,
      );
    }
  }
  if (camera.frozen && faceOverride == null) {
    let position2 = context.camera.position;
    facing =
      Math.atan2(position2.x - body.pos.x, position2.z - body.pos.z) +
      (demoAnimation === `walk` || demoAnimation === `run` ? 0.75 : 0.35);
  }
  camera.yawT = camera.yaw = facing + Math.PI + 0.3;
  let listeners, api;
  ({ listeners, api } = createPlayerContextApi.call(
    this,
    body,
    character,
    facing,
    camera,
    input,
    world,
    demoAnimation,
    context,
  ));
  playerState.playerRuntime = {
    introMode:
      fixedCamera?.length >= 6 ||
      relativeCamera?.length >= 6 ||
      params.has(`nointro`) ||
      params.has(`nocam`) ||
      demoAnimation
        ? `off`
        : `auto`,
    introWatch: false,
    firstFrame: true,
    ctx: context,
    world: world,
    body: body,
    char: character,
    input: input,
    cam: camera,
    api: api,
    events: listeners,
    anim: demoAnimation,
    acc: 0,
    facing: facing,
    targetFacing: facing,
    renderPos: body.pos.clone(),
    moveVec: new THREE.Vector3(),
    demoT: 0,
    forcedSwim: false,
    fwd: new THREE.Vector3(),
    right: new THREE.Vector3(),
    runAmt: 0,
  };
  configurePlayerAnimationDemo(playerState.playerRuntime);
  if (relativeCamera && relativeCamera.length >= 6 && !(fixedCamera && fixedCamera.length >= 6)) {
    configurePlayerFixedCamera(context, camera, relativeCamera, body.pos);
  }
  if (!camera.frozen) {
    camera.snap(getPlayerCameraFrame());
    if (faceOverride == null && !(spawnOverride && spawnOverride.length >= 2) && !demoAnimation) {
      playerState.playerRuntime.facing =
        playerState.playerRuntime.targetFacing =
        api.facing =
          choosePlayerSpawnWithClearCamera(playerState.playerRuntime) ??
          playerState.playerRuntime.facing;
    } else {
      faceOverride ??
        (world.gatherColliders(body.pos.x, body.pos.y, body.pos.z, 14),
        camera.pickClearYaw(playerState.playerRuntime.facing + Math.PI));
    }
    camera.snap(getPlayerCameraFrame());
  }
  interpolatePlayerRenderTransform(0);
}
