/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import * as THREE from "three";
import { playerState } from "../state.js";
import { updatePlayer } from "./update-player.js";
import { getPlayerCameraFrame } from "./get-player-camera-frame.js";
export function createPlayerContextApi(
  body,
  character,
  facing,
  camera,
  input,
  world,
  demoAnimation,
  context,
) {
  let listeners = new Map();
  let api = {
    position: body.pos.clone(),
    velocity: body.vel,
    onGround: false,
    inWater: false,
    swimming: false,
    gliding: false,
    mesh: character.root,
    facing: facing,
    forward: new THREE.Vector3(Math.sin(facing), 0, Math.cos(facing)),
    head: new THREE.Vector3(),
    cameraTarget: camera.focus,
    lookTarget: null,
    get cameraDistance() {
      return camera.curDist;
    },
    get cameraRestDistance() {
      return camera.distT;
    },
    get foliageFade() {
      return !!playerState.playerRuntime.fadeOn;
    },
    body: body,
    character: character,
    camera: camera,
    input: input,
    world: world,
    params: playerState.playerMovementSettings,
    anim: demoAnimation,
    __update: (value, value2) => updatePlayer(value, value2 ?? context),
    teleport(value3, value4, value5) {
      let result6 = value4 ?? world.landingY(value3, value5);
      body.teleport(value3, result6 + 0.002, value5);
      playerState.playerRuntime.renderPos.copy(body.pos);
      if (!camera.frozen) {
        camera.snap(getPlayerCameraFrame());
      }
    },
    setInputEnabled(value6) {
      input.enabled = !!value6;
    },
    introDolly(value7) {
      if (playerState.playerRuntime.introMode === `off`) {
        return false;
      }
      let result7 =
        typeof value7 == `number`
          ? {
              dur: value7,
            }
          : value7 && typeof value7 == `object`
            ? value7
            : {};
      playerState.playerRuntime.introWatch = false;
      return camera.startIntro(result7.dur ?? 2.5, false, result7.from ?? null);
    },
    on(value8, value9) {
      if (!listeners.has(value8)) {
        listeners.set(value8, new Set());
      }
      listeners.get(value8).add(value9);
      return () => api.off(value8, value9);
    },
    off(value10, value11) {
      listeners.get(value10)?.delete(value11);
    },
  };
  context.player = api;
  return {
    listeners,
    api,
  };
}
