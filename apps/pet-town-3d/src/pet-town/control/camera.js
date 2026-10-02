import { Vector3 } from "three";
import { playerFollowCamera } from "../../player/camera/player-follow-camera.js";
import { playerCollisionWorld } from "../../player/collision-world/player-collision-world.js";
import { getPlayerCameraFrame } from "../../player/system/get-player-camera-frame.js";
import { createTownFoliageFade } from "./foliage.js";

function frame(record) {
  return {
    pos: record.position,
    vel: record.body.vel,
    onGround: record.body.onGround,
    swimming: record.body.swimming,
    gliding: record.body.gliding,
    lastGroundY: record.body.lastGroundY,
    runAmt: record.runAmt ?? 0,
    stepPhase: record.character.phase,
    moving: record.body.vel.lengthSq() > 0.01,
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
        camera.yaw = camera.yawT;
        camera.pitch = camera.pitchT;
        camera.focus.copy(followed.head);
        context.camera.position.copy(followed.head);
        aim.set(-Math.sin(camera.yaw), -Math.tan(camera.pitch - 0.35), -Math.cos(camera.yaw));
        context.camera.lookAt(aim.add(followed.head));
        if (context.camera.fov !== 65) {
          context.camera.fov = 65;
          context.camera.updateProjectionMatrix();
        }
      } else camera.update(deltaTime, frame(followed));
      foliage.update(camera.world, position, deltaTime);
    },
    dispose() {
      if (followed) select(null);
    },
  };
}
