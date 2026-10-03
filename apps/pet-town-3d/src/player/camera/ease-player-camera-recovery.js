export function easePlayerCameraRecovery(
  camera,
  queries,
  previous,
  target,
  radius,
  deltaTime,
  release = false,
  subject = null,
) {
  if (queries.overlaps(target, radius).length || queries.sweep(previous, target, radius))
    return null;
  const dt = Math.max(0, deltaTime);
  const alpha = Math.min(
    1 - Math.exp(-4 * dt),
    (4 * dt) / Math.max(1e-6, previous.distanceTo(target)),
  );
  let position = previous.clone().lerp(target, alpha);
  // A safe endpoint must not ease through the animated head. Emergency
  // clearance takes precedence over comfort; the complete path is checked.
  if (subject && target.distanceTo(subject) >= 0.8 && position.distanceTo(subject) < 0.8)
    position = target.clone();
  const recovering = position.distanceTo(target) > 0.1;
  if (!recovering && release) camera.comfortRecovery = false;
  return { position, recovering };
}
