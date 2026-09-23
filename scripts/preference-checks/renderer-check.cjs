let nextFrame = null;
global.__testGlob = () => ({});
global.document = { hidden: false };
global.window = {
  innerWidth: 1000,
  innerHeight: 150,
  requestAnimationFrame: (callback) => {
    nextFrame = callback;
  },
};
const { VillageRenderer } = require("./renderer.cjs");
function assert(value, message) {
  if (!value) throw new Error(message);
}
const style = {
  setProperty() {},
  getPropertyValue() {
    return "";
  },
  transform: "",
};
const pet = {
  hidden: true,
  dataset: {},
  style,
  getBoundingClientRect: () => ({ x: 0, y: 0, width: 0, height: 0 }),
};
let hovered = false;
const element = {
  dataset: { characterId: "cat" },
  hidden: true,
  style,
  classList: { contains: () => false, toggle() {} },
  querySelector: (selector) => {
    if (selector === "img.pet" || selector === ".pet") return pet;
    if (selector === ".pet:hover") return hovered ? pet : null;
    return null;
  },
};
const root = { style: { setProperty() {} }, querySelectorAll: () => [] };
const sample = {
  visible: false,
  moving: true,
  speedPxPerSecond: 100,
  held: false,
  failed: false,
  state: "working",
  clip: null,
};
const deltas = [];
const behavior = {
  sample: () => sample,
  advance: (deltaMs) => {
    deltas.push(deltaMs);
    return { distancePx: deltaMs / 10, remainingMs: 0, sample };
  },
};
const renderer = new VillageRenderer(root);
renderer.elements.set("agent", element);
renderer.motions.set("agent", {
  x: 0,
  direction: 1,
  maximumX: 1000,
  behavior,
  packFingerprint: "test",
  fallbackAssetUrl: "",
  pendingElapsedMs: 0,
  dragging: false,
  dragOffsetX: 0,
});
const preferences = {
  app: {
    openWithHerdr: true,
    settingsAppearance: "system",
    lastSelectedPetId: "cat",
    hideCompletedPets: false,
    completedHideDelayMinutes: 5,
  },
  pets: {
    cat: {
      includedInRandomCast: true,
      appearance: { scalePercent: 100, opacityPercent: 100 },
      labels: { visibility: "always", textScalePercent: 100 },
      motion: { level: "gentle", pauseOnHover: true },
    },
  },
};
renderer.setPreferences(preferences);
nextFrame(1000);
nextFrame(1100);
assert(deltas.join(",") === "0,100", "renderer did not advance behavior with real elapsed time");
assert(renderer.motions.get("agent").x === 7, "gentle speed did not scale travel only");
hovered = true;
nextFrame(1200);
assert(
  deltas.at(-1) === 100 && renderer.motions.get("agent").x === 7,
  "hover pause stopped behavior progress or moved the pet",
);
hovered = false;
renderer.setSystemReducedMotion(true);
nextFrame(1300);
assert(
  deltas.at(-1) === 100 && renderer.motions.get("agent").x === 7,
  "system Reduce Motion stopped behavior progress or moved the pet",
);
renderer.setSystemReducedMotion(false);
preferences.pets.cat.motion.level = "standard";
nextFrame(1400);
assert(renderer.motions.get("agent").x === 17, "travel did not resume with standard distance");
pet.hidden = false;
element.hidden = false;
element.dataset.flowVisible = "true";
element.dataset.preferenceHidden = "false";
preferences.app.hideCompletedPets = true;
preferences.app.completedHideDelayMinutes = 1;
renderer.refreshPreferenceVisibility(
  new Map([["agent", { id: "agent", sprite: "cat", status: "done", doneSinceMs: 0 }]]),
);
assert(element.hidden, "paused visibility refresh did not hide an overdue completed pet");
renderer.refreshPreferenceVisibility(
  new Map([["agent", { id: "agent", sprite: "cat", status: "working", doneSinceMs: null }]]),
);
assert(!element.hidden, "paused visibility refresh did not restore an active pet");
console.log("renderer walking integration checks: pass");
