import { playerPhysicsStep } from "./player-physics-step.js";
import { playerPhysicsLand } from "./player-physics-land.js";
import { playerPhysicsCollideProps } from "./player-physics-collide-props.js";
import { playerPhysicsUnstuck } from "./player-physics-unstuck.js";
import { playerPhysicsTryStep } from "./player-physics-try-step.js";
import { playerPhysicsSweep } from "./player-physics-sweep.js";
import { playerPhysicsFree } from "./player-physics-free.js";
import { playerPhysicsTeleport } from "./player-physics-teleport.js";
import { initializePlayerPhysics } from "./initialize-player-physics.js";
import { playerState } from "../state.js";
export let playerPhysicsBody = class {
  constructor(world) {
    return initializePlayerPhysics.call(this, world);
  }
  teleport(x, y, z) {
    return playerPhysicsTeleport.call(this, x, y, z);
  }
  _free(x, y, z) {
    return playerPhysicsFree.call(this, x, y, z);
  }
  _sweep(axis, distance) {
    return playerPhysicsSweep.call(this, axis, distance);
  }
  _tryStep(axis, distance, stepHeight = playerState.playerMovementSettings.stepH) {
    return playerPhysicsTryStep.call(this, axis, distance, stepHeight);
  }
  _unstuck() {
    return playerPhysicsUnstuck.call(this);
  }
  _collideProps() {
    return playerPhysicsCollideProps.call(this);
  }
  _land() {
    return playerPhysicsLand.call(this);
  }
  step(deltaTime, input) {
    return playerPhysicsStep.call(this, deltaTime, input);
  }
};
