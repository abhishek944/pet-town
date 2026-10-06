import type { TokenActivity } from "./village";

const BASE_TOKENS_PER_MINUTE = 1_800;
const MAX_TOKENS_PER_MINUTE = 1_000_000;
const MAX_MOTION_SCALE = 2.5;
const MAX_FUTURE_MS = 1_000;
const MAX_AGE_MS = 6_000;
const TIME_CONSTANT_MS = 500;

export interface TokenMotionState {
  activity: TokenActivity | undefined;
  scale: number;
}

export function tokenMotionTarget(activity: TokenActivity | undefined, nowMs: number): number {
  if (!activity || !Number.isFinite(nowMs)) return 1;
  const { outputTokensPerMinute, observedAtMs, measurement } = activity;
  if (
    !Number.isSafeInteger(outputTokensPerMinute) ||
    outputTokensPerMinute < 0 ||
    outputTokensPerMinute > MAX_TOKENS_PER_MINUTE ||
    !Number.isSafeInteger(observedAtMs) ||
    observedAtMs <= 0 ||
    (measurement !== "estimated" && measurement !== "reported")
  )
    return 1;

  const ageMs = nowMs - observedAtMs;
  if (ageMs < -MAX_FUTURE_MS || ageMs > MAX_AGE_MS) return 1;
  return Math.max(0, Math.min(MAX_MOTION_SCALE, outputTokensPerMinute / BASE_TOKENS_PER_MINUTE));
}

function approachTokenMotion(current: number, target: number, elapsedMs: number): number {
  const start = Number.isFinite(current) ? current : 1;
  const goal = Number.isFinite(target) ? target : 1;
  const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  if (elapsed === 0) return start;

  const next = start + (goal - start) * (1 - Math.exp(-elapsed / TIME_CONSTANT_MS));
  return Math.abs(goal - next) < 0.001 ? goal : next;
}

export function tokenMotionDistance(
  motion: TokenMotionState,
  distancePx: number,
  working: boolean,
  elapsedMs: number,
): number {
  motion.scale = approachTokenMotion(
    motion.scale,
    working ? tokenMotionTarget(motion.activity, Date.now()) : 1,
    elapsedMs,
  );
  return distancePx * (working ? motion.scale : 1);
}
