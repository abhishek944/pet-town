const {
  BehaviorMachine,
  compileBehaviorPack,
  normalizeHerdrState,
  resolveBehaviorPack,
  advanceTrack,
  remapTrackPosition,
} = require("./flow-runtime.js");
function assert(value, message) {
  if (!value) throw new Error(message);
}
function equal(actual, expected, message) {
  if (!Object.is(actual, expected))
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
}
const manifest = {
  formatVersion: 1,
  id: "runtime-check",
  packVersion: "1",
  clips: {
    walk: { durationMs: 400, role: "stationary", mirror: true },
    doubt: { durationMs: 500, role: "stationary", mirror: true },
    sleep: { durationMs: 600, role: "stationary", mirror: true },
  },
  states: {
    idle: { action: "idle", visible: false },
    working: { animation: "walk", action: "walking" },
    blocked: { animation: "doubt", action: "idle" },
    done: { animation: "sleep", action: "idle" },
    unknown: { action: "idle", visible: false },
    listening: { animation: "doubt", action: "idle" },
  },
};
const result = compileBehaviorPack(manifest);
assert(result.pack, JSON.stringify(result.diagnostics));
equal(result.pack.stateAssignments.working.action, "walking", "walking action missing");
equal(result.pack.stateAssignments.done.animation, "sleep", "completed APNG missing");
const machine = new BehaviorMachine(result.pack, "agent", "working");
assert(machine.advance(100).distancePx > 0, "running pet did not walk");
assert(!machine.setStatus("working"), "same-state poll restarted the pet");
machine.setStatus("blocked");
equal(machine.advance(100).distancePx, 0, "blocked pet moved");
equal(machine.sample().clip.name, "doubt", "blocked APNG missing");
machine.setStatus("done");
equal(machine.advance(0).sample.clip.name, "sleep", "completed APNG missing");
machine.setStatus("listening");
equal(machine.advance(0).sample.state, "listening", "assistant listening state was lost");
machine.setStatus("unknown");
assert(!machine.advance(0).sample.visible, "unknown pet was visible");
equal(normalizeHerdrState("future"), "unknown", "unknown normalization changed");
const invalid = structuredClone(manifest);
invalid.states.blocked.animation = "missing";
assert(!compileBehaviorPack(invalid).pack, "missing APNG reference was accepted");
const fallback = resolveBehaviorPack(invalid);
assert(fallback.usedFallback, "invalid pack did not use safe fallback");
const old = structuredClone(manifest);
old.states.working = {
  completion: "restart",
  flow: {
    type: "sequence",
    steps: [
      { type: "move", clip: "walk", durationMs: 2400, speedPxPerSecond: 30 },
      { type: "play", clip: "doubt" },
    ],
  },
};
old.states.done = {
  completion: "restart",
  flow: {
    type: "sequence",
    steps: [
      { type: "play", clip: "doubt" },
      { type: "loop", flow: { type: "play", clip: "sleep" } },
    ],
  },
};
old.actions = { wave: { label: "Wave", flow: { type: "play", clip: "doubt" } } };
const migrated = compileBehaviorPack(old);
assert(migrated.pack, JSON.stringify(migrated.diagnostics));
equal(
  migrated.pack.stateAssignments.working.animation,
  "walk",
  "old running state was not migrated",
);
equal(
  migrated.pack.stateAssignments.done.animation,
  "sleep",
  "old completed state was not migrated",
);
assert(!("actions" in migrated.pack), "old menu animations remained available");
const bounce = advanceTrack(9, 1, 4, 10);
equal(bounce.x, 7, "edge overshoot was lost");
equal(bounce.direction, -1, "edge collision did not turn");
equal(remapTrackPosition(25, 100, 200), 50, "resize remapping changed position ratio");
console.log("flow runtime checks: pass");
