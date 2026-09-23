global.__testGlob = () => ({});
const { applyActiveCast, reconcileCitizens } = require("./cast/village.js");
const { shouldHideCompleted } = require("./cast/renderer-preferences.js");
function assert(value, message) {
  if (!value) throw new Error(message);
}
const agents = [
  { id: "a", status: "working", label: "A" },
  { id: "b", status: "done", label: "B" },
];
let citizens = reconcileCitizens(new Map(), agents, ["cat", "dog"], 1_000);
assert(
  new Set([...citizens.values()].map(({ sprite }) => sprite)).size === 2,
  "selected pets repeated before the cast was exhausted",
);
assert(citizens.get("b").doneSinceMs === 1_000, "completion time was not recorded");
let retained = reconcileCitizens(
  citizens,
  [agents[1], { id: "c", status: "working", label: "C" }],
  ["cat", "dog", "fox"],
  2_000,
);
assert(
  new Set([...retained.values()].map(({ sprite }) => sprite)).size === 3,
  "new agent reused a retained missing citizen's pet",
);
retained = reconcileCitizens(
  retained,
  agents.concat({ id: "c", status: "working", label: "C" }),
  ["cat", "dog", "fox"],
  3_000,
);
assert(
  new Set([...retained.values()].map(({ sprite }) => sprite)).size === 3,
  "returning citizen preserved a duplicate pet",
);
const catAgent = [...citizens.values()].find(({ sprite }) => sprite === "cat");
const dogAgent = [...citizens.values()].find(({ sprite }) => sprite === "dog");
citizens = applyActiveCast(citizens, ["dog"]);
assert(
  [...citizens.values()].every(({ sprite }) => sprite === "dog"),
  "deselected visible pet was not replaced",
);
assert(citizens.get(dogAgent.id) === dogAgent, "allowed visible pet was unnecessarily replaced");
assert(
  citizens.get(catAgent.id).doneSinceMs === catAgent.doneSinceMs,
  "cast replacement reset citizen state",
);
const done = citizens.get("b");
const preferences = { app: { hideCompletedPets: true, completedHideDelayMinutes: 5 } };
assert(!shouldHideCompleted(done, preferences, 300_999), "completed pet hid before its delay");
assert(shouldHideCompleted(done, preferences, 301_000), "completed pet did not hide at its delay");
citizens = reconcileCitizens(
  citizens,
  [
    { id: "a", status: "working", label: "A" },
    { id: "b", status: "blocked", label: "B" },
  ],
  ["dog"],
  400_000,
);
assert(citizens.get("b").doneSinceMs === null, "non-completed state retained the completion timer");
assert(
  !shouldHideCompleted(citizens.get("b"), preferences, 999_999),
  "non-completed pet stayed hidden",
);
console.log("cast and completion visibility checks: pass");
