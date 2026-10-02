import { updatePlayerCamera } from "./update-player-camera.js";
import { getPlayerCameraIntroActive } from "./get-player-camera-intro-active.js";
import { playerCameraStartIntro } from "./player-camera-start-intro.js";
import { playerCameraHoldIntro } from "./player-camera-hold-intro.js";
import { playerCameraPrepIntro } from "./player-camera-prep-intro.js";
import { playerCameraEstablishing } from "./player-camera-establishing.js";
import { playerCameraPlanIntro } from "./player-camera-plan-intro.js";
import { playerCameraPickClearYaw } from "./player-camera-pick-clear-yaw.js";
import { playerCameraFrameOcc } from "./player-camera-frame-occ.js";
import { playerCameraLos } from "./player-camera-los.js";
import { playerCameraKick } from "./player-camera-kick.js";
import { playerCameraSnap } from "./player-camera-snap.js";
import { playerCameraInput } from "./player-camera-input.js";
import { playerCameraBasis } from "./player-camera-basis.js";
import { initializePlayerCamera } from "./initialize-player-camera.js";
export let playerFollowCamera = class {
  constructor(context, world) {
    return initializePlayerCamera.call(this, context, world);
  }
  basis(forward, right) {
    return playerCameraBasis.call(this, forward, right);
  }
  input(input, deltaTime) {
    return playerCameraInput.call(this, input, deltaTime);
  }
  snap(frame) {
    return playerCameraSnap.call(this, frame);
  }
  kick(impact) {
    return playerCameraKick.call(this, impact);
  }
  _los(yaw, pitch, distance) {
    return playerCameraLos.call(this, yaw, pitch, distance);
  }
  _frameOcc(yaw, pitch, distance) {
    return playerCameraFrameOcc.call(this, yaw, pitch, distance);
  }
  pickClearYaw(baseYaw, offsets = [0.3, -0.3, 0.55, -0.55, 0, 0.8, -0.8], apply = true) {
    return playerCameraPickClearYaw.call(this, baseYaw, offsets, apply);
  }
  _planIntro(intro) {
    return playerCameraPlanIntro.call(this, intro);
  }
  _establishing() {
    return playerCameraEstablishing.call(this);
  }
  _prepIntro() {
    return playerCameraPrepIntro.call(this);
  }
  holdIntro() {
    return playerCameraHoldIntro.call(this);
  }
  startIntro(duration = 2.5, force = false, from = null) {
    return playerCameraStartIntro.call(this, duration, force, from);
  }
  get introActive() {
    return getPlayerCameraIntroActive.call(this);
  }
  update(deltaTime, frame) {
    return updatePlayerCamera.call(this, deltaTime, frame);
  }
};
