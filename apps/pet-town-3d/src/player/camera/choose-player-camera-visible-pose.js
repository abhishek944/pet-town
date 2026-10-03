import { easePlayerCameraRecovery as easeComfort } from "./ease-player-camera-recovery.js";
import { Vector3 } from "three";

function visible(queries, position, subject) {
  const hit = queries.raycast(position, subject, "opaque");
  return !hit || hit.distance >= position.distanceTo(subject) - 0.04;
}

function clearMotion(queries, start, end, radius) {
  return !queries.overlaps(end, radius).length && !queries.sweep(start, end, radius);
}

/** A safe slide must not silently leave the subject across an opaque wall. */
export function choosePlayerCameraVisiblePose(
  queries,
  anchor,
  subject,
  desired,
  slid,
  previous,
  radius,
  deltaTime,
) {
  const comfortable = Math.min(this.dist, 3);
  const tooClose = slid.distanceTo(anchor) < comfortable * 0.85;
  const critical = slid.distanceTo(subject) < 0.8;
  const subjectVisible = visible(queries, slid, subject);
  // A close, visible pose is preferable to fighting an explicit orbit with
  // automatic yaw/lift searches. Collision validation still owns every move.
  if (this.manualOrbit && subjectVisible && !critical) {
    this.visibilityWaypoint = null;
    this.comfortRecovery = false;
    return { position: slid, recovering: false };
  }
  this.occlusionTime = subjectVisible ? 0 : (this.occlusionTime ?? 0) + Math.max(0, deltaTime);
  if (this.visibilityWaypoint) {
    queries.prepare(
      anchor,
      Math.max(this.dist, anchor.distanceTo(this.visibilityWaypoint)),
      previous,
    );
    if (
      previous.distanceTo(this.visibilityWaypoint) > 0.1 &&
      this.visibilityWaypoint.distanceTo(subject) >= 0.8 &&
      visible(queries, this.visibilityWaypoint, subject) &&
      clearMotion(queries, previous, this.visibilityWaypoint, radius)
    ) {
      this.comfortRecovery = true;
      return easeComfort(
        this,
        queries,
        previous,
        this.visibilityWaypoint,
        radius,
        deltaTime,
        false,
        subject,
      );
    }
    this.visibilityWaypoint = null;
  }
  if (subjectVisible && !tooClose && !critical && clearMotion(queries, previous, slid, radius)) {
    this.visibilityWaypoint = null;
    if (this.comfortRecovery)
      return easeComfort(this, queries, previous, slid, radius, deltaTime, true, subject);
    return { position: slid, recovering: false };
  }
  // Brief head occlusion does not justify swinging the whole view. Eye and
  // travel collision checks still apply, and critical proximity never waits.
  if (
    !subjectVisible &&
    !tooClose &&
    !critical &&
    this.occlusionTime < 0.12 &&
    clearMotion(queries, previous, slid, radius)
  ) {
    if (this.comfortRecovery) {
      if (previous.distanceTo(subject) >= 0.8 && visible(queries, previous, subject))
        return { position: previous.clone(), recovering: true };
      return easeComfort(this, queries, previous, slid, radius, deltaTime, false, subject);
    }
    return { position: slid, recovering: true };
  }
  const offset = desired.clone().sub(anchor);
  const distance = Math.max(0.6, offset.length(), tooClose ? this.dist : 0);
  queries.prepare(anchor, distance + 12, previous);
  const yaw = Math.atan2(offset.x, offset.z);
  const pitch = Math.asin(Math.max(-1, Math.min(1, offset.y / Math.max(0.6, offset.length()))));
  let best = null;
  let bestScore = Infinity;
  const turns = critical ? [0, -0.4, 0.4, -1.2, 1.2, Math.PI] : [0, -0.2, 0.2, -0.4, 0.4];
  for (const turn of turns) {
    for (const lift of critical ? [0, 2, 4] : [0, 0.8, 2]) {
      const direction = new Vector3(
        Math.sin(yaw + turn) * Math.cos(pitch),
        Math.sin(pitch),
        Math.cos(yaw + turn) * Math.cos(pitch),
      );
      const candidate = anchor.clone().addScaledVector(direction, distance);
      candidate.y += lift;
      const boom = queries.sweep(anchor, candidate, radius);
      if (boom) {
        direction.copy(candidate).sub(anchor).normalize();
        candidate.copy(anchor).addScaledVector(direction, Math.max(0, boom.distance - 0.03));
      }
      if (
        (tooClose && candidate.distanceTo(anchor) < comfortable) ||
        candidate.distanceTo(subject) < 0.8 ||
        !visible(queries, candidate, subject) ||
        !clearMotion(queries, previous, candidate, radius)
      )
        continue;
      const score =
        candidate.distanceTo(desired) +
        candidate.distanceTo(previous) * 0.2 +
        Math.abs(candidate.y - previous.y) * 0.6;
      if (score < bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
  }
  if (best) {
    // Finish a critical escape instead of abandoning the route as soon as
    // one small step lifts the head-distance threshold.
    this.visibilityWaypoint = critical ? best.clone() : null;
    // Visibility changes also need recovery, even when the old eye was not
    // unusually close. A clear endpoint must not cause a one-frame pullback.
    this.comfortRecovery = true;
    return easeComfort(this, queries, previous, best, radius, deltaTime, false, subject);
  }
  if (
    !critical &&
    visible(queries, slid, subject) &&
    clearMotion(queries, previous, slid, radius)
  ) {
    if (this.comfortRecovery)
      return easeComfort(this, queries, previous, slid, radius, deltaTime, false, subject);
    return { position: slid, recovering: false };
  }
  if (
    critical &&
    previous.distanceTo(subject) >= comfortable &&
    visible(queries, previous, subject)
  ) {
    return { position: previous.clone(), recovering: true };
  }
  // When a wall separates the two feasible endpoints, move through a checked
  // waypoint. Do not teleport through the wall or keep calling the view clear.
  if (
    !this.visibilityWaypoint ||
    previous.distanceTo(this.visibilityWaypoint) < 0.1 ||
    !clearMotion(queries, previous, this.visibilityWaypoint, radius)
  ) {
    this.visibilityWaypoint = null;
    for (const lift of [1.2, 2.4, 4.8, 9.6]) {
      const candidate = previous.clone().add(new Vector3(0, lift, 0));
      if (
        visible(queries, candidate, subject) &&
        clearMotion(queries, previous, candidate, radius)
      ) {
        this.visibilityWaypoint = candidate;
        break;
      }
    }
  }
  if (this.visibilityWaypoint) {
    const length = previous.distanceTo(this.visibilityWaypoint);
    const step = previous
      .clone()
      .lerp(
        this.visibilityWaypoint,
        Math.min(1, (Math.max(0, deltaTime) * 8) / Math.max(length, 1e-6)),
      );
    if (clearMotion(queries, previous, step, radius)) {
      this.comfortRecovery = true;
      return { position: step, recovering: true };
    }
  }
  if (this.comfortRecovery && clearMotion(queries, previous, slid, radius))
    return easeComfort(this, queries, previous, slid, radius, deltaTime, false, subject);
  return { position: slid, recovering: true };
}
