import { clearWalkingSegment } from "./walkability.js";
import { chooseRoamingRoute } from "./roaming-route.js";

const NEUTRAL = Object.freeze({ mx: 0, mz: 0, run: false, jumpHeld: false });

function clearRoute(motion, rest) {
  motion.route = [];
  motion.goal = null;
  motion.stuck = 0;
  motion.rest = rest;
}

export function roamingInput(record, dt) {
  const motion = record._motion;
  const position = record.body.pos;
  if (record.isMayor && record.conversationActive) {
    record.body.vel.x = record.body.vel.z = 0;
    clearRoute(motion, 0.8);
    return NEUTRAL;
  }
  if (motion.wasControlled) {
    motion.wasControlled = false;
    motion.home.copy(position);
    clearRoute(motion, 0.6);
  }
  motion.rest -= dt;
  if (motion.rest > 0) return NEUTRAL;
  if (!motion.goal) {
    motion.route = chooseRoamingRoute(record);
    motion.goal = motion.route.at(-1) ?? null;
    motion.previous.copy(position);
    motion.stuck = 0;
    if (!motion.goal) {
      motion.rest = 0.5 + motion.random();
      return NEUTRAL;
    }
  }
  // Measure displacement from a stable checkpoint, not distance travelled each
  // frame: shuffling back and forth against a rail must count as being stuck.
  if (Math.hypot(position.x - motion.previous.x, position.z - motion.previous.z) >= 0.4) {
    motion.previous.copy(position);
    motion.stuck = 0;
  } else motion.stuck += dt;
  while (
    motion.route.length &&
    Math.hypot(motion.route[0].x - position.x, motion.route[0].z - position.z) < 0.12
  )
    motion.route.shift();
  if (!motion.route.length) {
    clearRoute(motion, 0.7 + motion.random() * 2.5);
    return NEUTRAL;
  }
  const waypoint = motion.route[0];
  if (motion.stuck > 1.4 || !clearWalkingSegment(record.world, position, waypoint)) {
    clearRoute(motion, 0.15 + motion.random() * 0.2);
    return NEUTRAL;
  }
  const dx = waypoint.x - position.x;
  const dz = waypoint.z - position.z;
  const distance = Math.hypot(dx, dz);
  return { mx: (dx / distance) * 0.38, mz: (dz / distance) * 0.38, run: false, jumpHeld: false };
}

export function movementInput(record, dt) {
  if (!record.controlled) {
    record.input.jumpPressed = false;
    return roamingInput(record, dt);
  }
  record._motion.wasControlled = true;
  const mx = Number.isFinite(record.input.mx) ? record.input.mx : 0;
  const mz = Number.isFinite(record.input.mz) ? record.input.mz : 0;
  const magnitude = Math.max(1, Math.hypot(mx, mz));
  return {
    mx: mx / magnitude,
    mz: mz / magnitude,
    run: !!record.input.run,
    jumpHeld: !!record.input.jumpHeld,
  };
}
