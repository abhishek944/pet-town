const { applyCitizenPreferences, travelDistanceFor } = require("./renderer-preferences.cjs");
function assert(value, message) {
  if (!value) throw new Error(message);
}
const values = new Map();
const element = {
  dataset: { characterId: "cat" },
  style: { setProperty: (key, value) => values.set(key, value) },
  querySelector: () => null,
};
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
      appearance: { scalePercent: 135, opacityPercent: 90 },
      labels: { visibility: "hover", textScalePercent: 120 },
      motion: { level: "gentle", pauseOnHover: true },
    },
  },
};
applyCitizenPreferences(element, 77, preferences);
assert(values.get("--citizen-size") === "59.4px", "pet scale was not applied");
assert(values.get("--citizen-opacity") === "0.9", "pet opacity was not applied");
assert(element.dataset.labelVisibility === "hover", "label visibility was not applied");
applyCitizenPreferences(element, 30, preferences);
assert(values.get("--citizen-size") === "30px", "crowd cap did not override preferred size");
assert(travelDistanceFor(element, 100, preferences) === 70, "gentle walking factor is wrong");
element.querySelector = () => ({});
assert(
  travelDistanceFor(element, 100, preferences) === 0,
  "enabled hover pause still translated the pet",
);
element.querySelector = () => null;
assert(
  travelDistanceFor(element, 100, preferences, true) === 0,
  "system Reduce Motion still translated the pet",
);
console.log("preference renderer checks: pass");
