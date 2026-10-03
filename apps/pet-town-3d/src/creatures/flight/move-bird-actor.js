import { sampleBirdClearance, birdRestHeight } from "./sample-bird-clearance.js";
import { birdPadding } from "./pick-bird-goal.js";
import { dampCreatureValue } from "../math/damp-creature-value.js";
import { wrapCreatureAngle } from "../math/wrap-creature-angle.js";
import { getCreatureWaterLevel } from "../world/get-creature-water-level.js";

export function moveBirdActor(deltaTime) {
  const dt = Math.min(deltaTime, 0.05);
  const position = this.position;
  const runtime = this.birdRuntime;
  const padding = birdPadding(this);
  const sample = sampleBirdClearance(position.x, position.z, padding);
  if (!sample) {
    this.goal = null;
    this.speed = 0;
    return;
  }
  let targetSpeed = 0;
  if (this.flying) {
    let desiredY = Math.max(sample.top + this.def.flight.minAltitude, this.goal?.y ?? position.y);
    if (this.goal) {
      const dx = this.goal.x - position.x;
      const dz = this.goal.z - position.z;
      const distance = Math.hypot(dx, dz);
      const angle = wrapCreatureAngle(Math.atan2(dx, dz) - this.yaw);
      const turn = (this.def.flight.pattern === "glide" ? 1.8 : 3.8) * dt;
      this.yaw = wrapCreatureAngle(this.yaw + Math.max(-turn, Math.min(turn, angle)));
      targetSpeed = this.goalSpeed * Math.max(0, 1 - Math.abs(angle) / 1.4);
      const travel = Math.min(distance, targetSpeed * dt);
      const x = position.x + (dx / (distance || 1)) * travel;
      const z = position.z + (dz / (distance || 1)) * travel;
      const next = sampleBirdClearance(x, z, padding);
      const safeY = next ? next.top + this.def.flight.minAltitude : Infinity;
      if (next && position.y >= safeY - 0.05) {
        position.x = x;
        position.z = z;
      } else {
        targetSpeed = 0;
        desiredY = Math.max(desiredY, next ? safeY : desiredY);
      }
      if (distance < 0.08) {
        targetSpeed = 0;
        if (runtime.landing) {
          const restY = birdRestHeight(position.x, position.z, padding);
          if (restY == null) {
            this.goal = null;
            runtime.landing = false;
          } else {
            desiredY = restY;
            if (position.y - restY < 0.04) {
              position.y = restY;
              this.flying = false;
              this.goal = null;
              runtime.landing = false;
              runtime.flightTime = 0;
              runtime.restTime = this.rng.range(4, 9);
              this.setState(runtime.active ? "rest" : "sleep", 999);
            }
          }
        } else this.goal = null;
      }
    }
    const climb = Math.max(-1.8 * dt, Math.min(3.8 * dt, desiredY - position.y));
    position.y += climb;
  } else {
    const restY = birdRestHeight(position.x, position.z, padding);
    if (restY != null) position.y = restY;
  }
  runtime.stalled =
    position.distanceToSquared(this.lastPos) > 1e-10 ? 0 : (runtime.stalled ?? 0) + dt;
  this.lastPos.copy(position);
  this.speed = dampCreatureValue(this.speed, targetSpeed, 5, dt);
  this.flyH = Math.max(0, position.y - sample.ground);
  this.alt = this.flyH;
  this.inWater = false;
  this.airborne = false;
  this.vy = 0;
  this.mesh.rotation.y = this.yaw;
  this.moveAmt = dampCreatureValue(this.moveAmt, Math.min(1.5, this.speed / this.def.walk), 8, dt);
  const shadowY = Math.max(sample.ground, getCreatureWaterLevel());
  this.shadow.position.set(position.x, shadowY + 0.03, position.z);
  this.shadow.scale.setScalar((this.def.radius * 2.3 * this.size) / (1 + this.flyH * 0.25));
  this.shadow.visible = true;
}
