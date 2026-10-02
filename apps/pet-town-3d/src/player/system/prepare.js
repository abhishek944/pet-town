/** Player spawn, context API, fixed-step orchestration, effects, render interpolation and demo controls. */
import * as THREE from "three";
import { playerState } from "../state.js";
import { initializePlayer } from "./initialize-player.js";
import { updatePlayer } from "./update-player.js";
export function preparePlayerSystem() {
  playerState.playerSystem = {
    get init() {
      return initializePlayer;
    },
    get update() {
      return updatePlayer;
    },
  };
  playerState.playerPhysicsTimeStep = 1 / 120;
  playerState.playerMaxPhysicsSteps = 12;
  playerState.playerRuntime = null;
  playerState.playerFoliageFadeTarget = new THREE.Vector3();
  playerState.playerCreatureLookTarget = new THREE.Vector3();
}
