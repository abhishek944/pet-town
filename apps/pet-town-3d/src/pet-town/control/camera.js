import { Vector3 } from "three";
import { playerFollowCamera } from "../../player/camera/player-follow-camera.js";
import { playerCollisionWorld } from "../../player/collision-world/player-collision-world.js";
import { getPlayerCameraFrame } from "../../player/system/get-player-camera-frame.js";
import { createTownFoliageFade } from "./foliage.js";
import { validatePlayerCameraPose } from "../../player/camera/validate-player-camera-pose.js";
import { publishPlayerCameraDiagnostics } from "../../player/camera/publish-player-camera-diagnostics.js";

function frame(record) {
  return {
    pos: record.position,
    head: record.head,
    vel: record.body.vel,
    onGround: record.body.onGround,
    swimming: record.body.swimming,
    diving: record.body.diving,
    gliding: record.body.gliding,
    lastGroundY: record.body.lastGroundY,
    runAmt: record.runAmt ?? 0,
    stepPhase: record.character.phase,
    moving: record.body.vel.lengthSq() > 0.01,
    height: Math.max(0.6, (record.head.y - record.position.y) / 0.82),
  };
}

export function createTownCamera(context, originalPlayer) {
  const world = new playerCollisionWorld(context);
  world.refresh(0);
  const camera = new playerFollowCamera(context, world);
  const forward = new Vector3();
  const right = new Vector3();
  const aim = new Vector3();
  let followed = null;
  let firstPerson = false;
  let previousFrozen = false;
  const foliage = createTownFoliageFade(context);
  function select(record) {
    if (!followed && !record) return;
    foliage.reset();
    if (followed) followed.root.visible = true;
    if (!followed && record) previousFrozen = originalPlayer.camera.frozen;
    followed = record;
    firstPerson = false;
    if (!record) {
      originalPlayer.camera.frozen = previousFrozen;
      if (!previousFrozen) originalPlayer.camera.snap(getPlayerCameraFrame());
      return;
    }
    originalPlayer.camera.frozen = true;
    camera.world = record.world ?? world;
    camera.world.gatherColliders(record.position.x, record.position.y, record.position.z, 28);
    camera.yawT = record.facing + Math.PI + 0.3;
    camera.pitchT = 0.5;
    camera.snap(frame(record));
    camera.pickClearYaw(camera.yawT);
    camera.snap(frame(record));
  }
  return {
    camera,
    get firstPerson() {
      return firstPerson;
    },
    get foliageFading() {
      return foliage.active;
    },
    select,
    toggleFirstPerson() {
      if (!followed) return;
      firstPerson = !firstPerson;
      camera.safePosition = null;
      camera.visibilityWaypoint = null;
      camera.comfortRecovery = false;
      followed.root.visible = !firstPerson;
      if (!firstPerson) camera.snap(frame(followed));
    },
    movement(sample, deltaTime) {
      if (!followed) return { mx: 0, mz: 0 };
      camera.input({ orbitX: 0, orbitY: 0, zoom: 0, rotate: 0, ...sample }, deltaTime);
      camera.basis(forward, right);
      return {
        mx: forward.x * (sample.y ?? 0) + right.x * (sample.x ?? 0),
        mz: forward.z * (sample.y ?? 0) + right.z * (sample.x ?? 0),
      };
    },
    update(deltaTime) {
      if (!followed) return;
      const { position } = followed;
      camera.world.refresh(deltaTime);
      camera.world.gatherColliders(position.x, position.y, position.z, camera.distT + 2);
      if (firstPerson) {
        camera.solveStartedAt = performance.now();
        camera.queryPrepareStart = context.cameraQueries.stats.prepareTotalMs;
        camera.yaw = camera.yawT;
        camera.pitch = camera.pitchT;
        camera.focus.copy(followed.head);
        if (context.camera.fov !== 65) {
          context.camera.fov = 65;
          context.camera.updateProjectionMatrix();
        }
        context.cameraQueries.beginSolve();
        try {
          validatePlayerCameraPose.call(camera, followed.head, followed.head);
        } finally {
          context.cameraQueries.endSolve();
        }
        aim.set(-Math.sin(camera.yaw), -Math.tan(camera.pitch - 0.35), -Math.cos(camera.yaw));
        context.camera.lookAt(aim.add(context.camera.position));
        publishPlayerCameraDiagnostics.call(camera, frame(followed));
      } else camera.update(deltaTime, frame(followed));
      foliage.update(camera.world, position, deltaTime, !firstPerson);
    },
    dispose() {
      if (followed) select(null);
    },
  };
}
