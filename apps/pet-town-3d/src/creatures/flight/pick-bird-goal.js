import * as THREE from "three";
import { sampleBirdClearance, birdRestHeight } from "./sample-bird-clearance.js";

export function birdPadding(actor) {
  return Math.max(0.8, actor.size * 1.3);
}

function routeHeight(actor, x, z, altitude) {
  const start = actor.position;
  const steps = Math.ceil(Math.hypot(x - start.x, z - start.z) / 0.75);
  let height = -Infinity;
  for (let i = 0; i <= steps; i++) {
    const t = steps ? i / steps : 0;
    const sample = sampleBirdClearance(
      start.x + (x - start.x) * t,
      start.z + (z - start.z) * t,
      birdPadding(actor),
    );
    if (!sample) return null;
    height = Math.max(height, sample.top + altitude);
  }
  return height;
}

export function pickBirdGoal(actor, landing = false) {
  const profile = actor.def.flight;
  const runtime = actor.birdRuntime;
  for (let attempt = 0; attempt < 40; attempt++) {
    const angle =
      profile.pattern === "glide" && !landing
        ? runtime.orbit + 0.65 + attempt * 0.3
        : actor.rng() * Math.PI * 2;
    const radius = actor.rng.range(landing ? 0 : profile.radius * 0.4, profile.radius);
    const x = actor.home.x + Math.sin(angle) * radius;
    const z = actor.home.z + Math.cos(angle) * radius * (profile.pattern === "glide" ? 0.7 : 1);
    const restY = landing ? birdRestHeight(x, z, birdPadding(actor)) : null;
    if (landing && restY == null) continue;
    const altitude = actor.rng.range(profile.minAltitude, profile.maxAltitude);
    const y = routeHeight(actor, x, z, altitude);
    if (y == null) continue;
    runtime.orbit = angle;
    runtime.restY = restY;
    runtime.landing = landing;
    runtime.stalled = 0;
    actor.flying = true;
    actor.setState(landing ? "land" : "fly", 30);
    actor.goal = new THREE.Vector3(x, y, z);
    actor.goalSpeed = profile.cruiseSpeed * actor.rng.range(0.85, 1.1);
    return true;
  }
  return false;
}
