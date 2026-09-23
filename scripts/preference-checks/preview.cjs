const { previewAnimations, selectedPreviewAnimationId } = require("./settings-preview.cjs");
const clip = (name, assetUrl, role = "stationary") => ({ name, assetUrl, scale: 1, role });
const options = previewAnimations({
  clips: {
    walk: clip("walk", "walk.png", "locomotion"),
    wave: clip("wave", "wave.png"),
    duplicate: clip("duplicate", "walk.png", "locomotion"),
  },
  stateAssignments: {
    working: { animation: "walk", action: "walking", visible: true },
    blocked: { animation: "wave", action: "idle", visible: true },
  },
});
if (options.map(({ label }) => label).join(",") !== "Walk,Wave,Duplicate")
  throw new Error("preview clips were not labeled");
if (options.some(({ assetUrl }) => !assetUrl)) throw new Error("preview included an unusable clip");
if (options.find(({ label }) => label === "Walk")?.locomotion !== true)
  throw new Error("walking preview lost its locomotion role");
if (options.find(({ label }) => label === "Wave")?.locomotion !== false)
  throw new Error("stationary preview was marked as locomotion");
if (selectedPreviewAnimationId(options) !== "clip:walk")
  throw new Error("preview did not default to a locomotion clip");
if (selectedPreviewAnimationId(options, "clip:wave") !== "clip:wave")
  throw new Error("preview did not retain a selected stationary APNG");
console.log("settings animation preview checks: pass");
