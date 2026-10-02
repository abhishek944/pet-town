/** Fixed-step player locomotion, jump buffering, coyote time, stepping, swimming and gliding. */
import * as THREE from "three";
import { playerState } from "../state.js";
export function preparePlayerPhysics() {
  playerState.playerMovementSettings = {
    halfW: 0.27,
    height: 1.42,
    walk: 4.4,
    run: 7.6,
    swim: 3,
    swimRun: 4.4,
    glide: 5.6,
    gravity: 34,
    fallMult: 1.65,
    cutMult: 3,
    jumpV: 11.6,
    maxFall: 30,
    coyote: 0.12,
    buffer: 0.16,
    groundK: 18,
    stopK: 22,
    airK: 5,
    glideK: 3.2,
    swimK: 5,
    glideFall: 1.7,
    flutterV: 3.2,
    stepH: 1,
    swimFloat: 0.82,
    swimEnter: 0.95,
    swimExit: 0.6,
    swimJumpV: 10.5,
  };
  playerState.playerCollisionEpsilon = 0.001;
  new THREE.Vector3();
}
