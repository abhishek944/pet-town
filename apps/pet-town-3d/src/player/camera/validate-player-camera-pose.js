import { Vector3 } from "three";
import { getPlayerCameraRadius } from "./get-player-camera-radius.js";
import { recoverPlayerCameraOverlap } from "./recover-player-camera-overlap.js";
import { choosePlayerCameraVisiblePose } from "./choose-player-camera-visible-pose.js";
import { resolvePlayerCameraWater } from "./resolve-player-camera-water.js";
import { smoothPlayerCameraJump } from "./smooth-player-camera-jump.js";
import { resolvePlayerCameraOrbit } from "./resolve-player-camera-orbit.js";

function stopBeforeHit(queries, start, end, radius) {
  const hit = queries.sweep(start, end, radius);
  if (!hit) return { position: end.clone(), hit: null };
  const distance = start.distanceTo(end);
  const position = start
    .clone()
    .lerp(end, Math.max(0, hit.distance - 0.03) / Math.max(1e-6, distance));
  return { position, hit };
}

/** Validate the complete pose and its motion after intro/ground/water/bob. */
export function validatePlayerCameraPose(focus, desired, frame = null, deltaTime = 0) {
  const queries = this.ctx.cameraQueries;
  const radius = getPlayerCameraRadius(this.cam);
  queries.prepare(focus, Math.max(this.distT, focus.distanceTo(desired)), this.safePosition);
  const anchor = recoverPlayerCameraOverlap(queries, focus, radius, this.safePosition);
  queries.prepare(
    focus,
    Math.max(this.distT, focus.distanceTo(desired), anchor ? focus.distanceTo(anchor) : 0),
    this.safePosition,
  );
  let position = desired.clone();
  let hit = null;
  if (anchor) ({ position, hit } = stopBeforeHit(queries, anchor, position, radius));
  position = recoverPlayerCameraOverlap(queries, position, radius, this.safePosition);
  const previous = this.safePosition;
  const previousValid = previous && !queries.overlaps(previous, radius).length;
  const boomHit = frame ? this.boomHit : null;
  let state =
    hit || boomHit ? "constrained" : this.obstructionReleaseTime > 0 ? "recovering" : "clear";
  if (position && previousValid) {
    const motion = stopBeforeHit(queries, previous, position, radius);
    if (motion.hit) {
      hit = motion.hit;
      state = "constrained";
      // Slide along contact instead of cutting through a wall during orbit.
      const remainder = position.clone().sub(motion.position);
      const normal = new Vector3().copy(hit.normal ?? { x: 0, y: 0, z: 0 });
      remainder.addScaledVector(normal, -Math.min(0, remainder.dot(normal)));
      position = stopBeforeHit(
        queries,
        motion.position,
        motion.position.clone().add(remainder),
        radius,
      ).position;
      if (anchor && frame && this.idleInput < 0.3) {
        const subject = frame.head ?? frame.pos.clone().setY(frame.pos.y + 1.4);
        position =
          resolvePlayerCameraOrbit(
            queries,
            anchor,
            previous,
            desired,
            subject,
            radius,
            deltaTime,
          ) ?? position;
      }
    }
  } else if (!previousValid && previous) state = "overlap-recovery";
  if (position && previousValid && anchor && frame) {
    const subject =
      frame.head?.clone() ??
      new Vector3(frame.pos.x, frame.pos.y + (frame.height ?? 1.7) * 0.78, frame.pos.z);
    const result = choosePlayerCameraVisiblePose.call(
      this,
      queries,
      anchor,
      subject,
      desired,
      position,
      previous,
      radius,
      deltaTime,
    );
    position = result.position;
    if (result.recovering) state = "visibility-recovery";
  }
  if (!position || queries.overlaps(position, radius).length) {
    position = previousValid ? previous.clone() : null;
    state = "overlap-recovery";
  }
  // Enclosing edits may remove every local escape. Reset above the finite
  // world rather than commit a camera inside solid geometry.
  if (!position) {
    const escape = focus.clone().setY(Math.max(48, focus.y + 12));
    queries.prepare(focus, focus.distanceTo(escape), previous);
    position = recoverPlayerCameraOverlap(queries, escape, radius);
    state = "reset";
  }
  if (!position) return false;
  queries.prepare(focus, Math.max(this.distT, focus.distanceTo(position)), previous);
  if (previousValid && state !== "reset") {
    const smoothed = smoothPlayerCameraJump.call(
      this,
      queries,
      focus,
      anchor,
      position,
      previous,
      radius,
      frame,
      deltaTime,
    );
    if (smoothed.distanceTo(position) > 0.02) state = "recovering";
    position = smoothed;
  } else this.jumpRecovery = false;
  if (previousValid && state !== "reset") {
    const finalMotion = stopBeforeHit(queries, previous, position, radius);
    if (finalMotion.hit) {
      position = finalMotion.position;
      hit = finalMotion.hit;
      state = "constrained";
    }
  }
  queries.prepare(focus, Math.max(this.distT, focus.distanceTo(position)), previous);
  position = resolvePlayerCameraWater(
    queries,
    focus,
    position,
    previousValid ? previous : null,
    radius,
    this.world.waterLevel,
  );
  if (!position) {
    const escape = focus.clone().setY(Math.max(48, focus.y + 12));
    queries.prepare(focus, focus.distanceTo(escape), previous);
    position = recoverPlayerCameraOverlap(queries, escape, radius);
    state = "reset";
  }
  if (!position) return false;
  queries.prepare(focus, Math.max(this.distT, focus.distanceTo(position)), previous);
  if (queries.overlaps(position, radius).length) return false;
  if (frame) {
    const subject =
      frame.head?.clone() ??
      new Vector3(frame.pos.x, frame.pos.y + (frame.height ?? 1.7) * 0.78, frame.pos.z);
    const opaqueHit = queries.raycast(position, subject, "opaque");
    if (opaqueHit && opaqueHit.distance < position.distanceTo(subject) - 0.04)
      state = "visibility-recovery";
  }
  this.cam.position.copy(position);
  this.safePosition ??= new Vector3();
  this.safePosition.copy(position);
  this.safeFocus ??= new Vector3();
  this.safeFocus.copy(focus);
  this.cameraState = state;
  this.cameraHit = hit ?? boomHit;
  return true;
}
