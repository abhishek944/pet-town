/** Unlimited diving shares the existing collision sweeps and buoyancy integration. */
export function integrateWaterSwimming(body, input, dt, waterY, position, velocity, settings) {
  const surfaceTarget = waterY - settings.swimFloat;
  const descending = !!input.diveHeld;
  const ascending = !!input.jumpHeld && !descending;
  if (descending && body.diveTarget === null) body.diveTarget = position.y;
  if (body.diveTarget !== null) {
    const direction = descending ? -1 : ascending ? 1 : 0;
    // Keep the target near the body when stopped by terrain or a ceiling.
    body.diveTarget = Math.max(position.y - 0.35, Math.min(position.y + 0.35, body.diveTarget));
    body.diveTarget += direction * (input.run ? 4 : 2.8) * dt;
    body.diveTarget = Math.min(surfaceTarget, body.diveTarget);
    body.jumpBuf = 0;
    if (ascending && position.y >= surfaceTarget - 0.08) body.diveTarget = null;
  }
  body.diving = body.diveTarget !== null || position.y < surfaceTarget - 0.4;
  const target = body.diveTarget ?? surfaceTarget + Math.sin(body.time * 2.2) * 0.035;
  velocity.y += ((target - position.y) * 55 - velocity.y * 9) * dt;
  body.gliding = false;
}
