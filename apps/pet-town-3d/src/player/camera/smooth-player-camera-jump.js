/** Smooth jump corrections relative to the moving focus, after collision solving. */
export function smoothPlayerCameraJump(
  queries,
  focus,
  anchor,
  position,
  previous,
  radius,
  frame,
  dt,
) {
  const jumping = frame && !frame.onGround && !frame.swimming && !frame.gliding;
  if (
    !frame ||
    frame.swimming ||
    frame.gliding ||
    !previous ||
    !this.safeFocus ||
    dt <= 0 ||
    this.intro
  ) {
    this.jumpRecovery = false;
    return position;
  }
  if (jumping) this.jumpRecovery = true;
  // Orbit already has input damping and swept collision protection. A second
  // slow spring makes the camera feel locked during jumps.
  if (this.manualOrbit) return position;
  if (!this.jumpRecovery || !anchor) return position;
  const oldOffset = previous.clone().sub(this.safeFocus);
  const newOffset = position.clone().sub(focus);
  const alpha = 1 - Math.exp(-6 * dt);
  const distance = oldOffset.length() + (newOffset.length() - oldOffset.length()) * alpha;
  const offset = oldOffset.clone().lerp(newOffset, alpha);
  if (offset.lengthSq() < 1e-12) return position;
  const candidate = focus.clone().add(offset.setLength(distance));
  const subject =
    frame.head ??
    focus
      .clone()
      .copy(frame.pos)
      .setY(frame.pos.y + 1.4);
  const clear = (eye) => {
    const sight = queries.raycast(eye, subject, "opaque");
    return (
      (!sight || sight.distance >= eye.distanceTo(subject) - 0.04) &&
      eye.distanceTo(subject) >= 0.8 &&
      !queries.overlaps(eye, radius).length &&
      !queries.sweep(anchor, eye, radius) &&
      !queries.sweep(previous, eye, radius)
    );
  };
  // A newly blocked path needs an immediate safe correction. Never smooth
  // through solid geometry just to preserve the previous camera distance.
  if (!clear(candidate)) return position;
  if (
    !jumping &&
    candidate.distanceTo(position) < 0.02 &&
    Math.abs(this.focus.y - frame.pos.y - 1.05) < 0.05
  ) {
    this.jumpRecovery = false;
  }
  return candidate;
}
