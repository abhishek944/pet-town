#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TMP=$(mktemp -d "${TMPDIR:-/tmp}/pet-village-preferences.XXXXXX")
trap 'rm -rf "$TMP"' EXIT INT TERM
cd "$ROOT/apps/pet-village"

pnpm exec esbuild src/renderer-preferences.ts --bundle --platform=node --format=cjs \
  --log-level=error --outfile="$TMP/renderer-preferences.cjs"
cat >"$TMP/check.cjs" <<'CHECK'
const { applyCitizenPreferences, travelDistanceFor } = require("./renderer-preferences.cjs");
function assert(value, message) { if (!value) throw new Error(message); }
const values = new Map();
const element = {
  dataset: { characterId: "cat" },
  style: { setProperty: (key, value) => values.set(key, value) },
  querySelector: () => null,
};
const preferences = { app: {
  openWithHerdr: true, settingsAppearance: "system", lastSelectedPetId: "cat",
  hideCompletedPets: false, completedHideDelayMinutes: 5,
}, pets: { cat: {
  includedInRandomCast: true,
  appearance: { scalePercent: 135, opacityPercent: 90 },
  labels: { visibility: "hover", textScalePercent: 120 },
  motion: { level: "gentle", reduced: false, pauseOnHover: true },
} } };
applyCitizenPreferences(element, 77, preferences);
assert(values.get("--citizen-size") === "59.4px", "pet scale was not applied");
assert(values.get("--citizen-opacity") === "0.9", "pet opacity was not applied");
assert(element.dataset.labelVisibility === "hover", "label visibility was not applied");
applyCitizenPreferences(element, 30, preferences);
assert(values.get("--citizen-size") === "30px", "crowd cap did not override preferred size");
assert(travelDistanceFor(element, 100, preferences) === 70, "gentle walking factor is wrong");
element.querySelector = () => ({});
assert(travelDistanceFor(element, 100, preferences) === 0, "enabled hover pause still translated the pet");
element.querySelector = () => null;
preferences.pets.cat.motion.reduced = true;
assert(travelDistanceFor(element, 100, preferences) === 0, "reduced movement still translated the pet");
preferences.pets.cat.motion.reduced = false;
assert(travelDistanceFor(element, 100, preferences, true) === 0, "system Reduce Motion still translated the pet");
console.log("preference renderer checks: pass");
CHECK
node "$TMP/check.cjs"

pnpm exec esbuild src/village.ts src/renderer-preferences.ts --bundle --platform=node --format=cjs \
  --loader:.png=dataurl --define:import.meta.glob=globalThis.__testGlob \
  --log-level=error --outdir="$TMP/cast"
cat >"$TMP/cast-check.cjs" <<'CHECK'
global.__testGlob = () => ({});
const { applyActiveCast, reconcileCitizens } = require("./cast/village.js");
const { shouldHideCompleted } = require("./cast/renderer-preferences.js");
function assert(value, message) { if (!value) throw new Error(message); }
const agents = [
  { id: "a", status: "working", label: "A" },
  { id: "b", status: "done", label: "B" },
];
let citizens = reconcileCitizens(new Map(), agents, ["cat", "dog"], 1_000);
assert(new Set([...citizens.values()].map(({ sprite }) => sprite)).size === 2, "selected pets repeated before the cast was exhausted");
assert(citizens.get("b").doneSinceMs === 1_000, "completion time was not recorded");
let retained = reconcileCitizens(citizens, [agents[1], { id: "c", status: "working", label: "C" }], ["cat", "dog", "fox"], 2_000);
assert(new Set([...retained.values()].map(({ sprite }) => sprite)).size === 3, "new agent reused a retained missing citizen's pet");
retained = reconcileCitizens(retained, agents.concat({ id: "c", status: "working", label: "C" }), ["cat", "dog", "fox"], 3_000);
assert(new Set([...retained.values()].map(({ sprite }) => sprite)).size === 3, "returning citizen preserved a duplicate pet");
const catAgent = [...citizens.values()].find(({ sprite }) => sprite === "cat");
const dogAgent = [...citizens.values()].find(({ sprite }) => sprite === "dog");
citizens = applyActiveCast(citizens, ["dog"]);
assert([...citizens.values()].every(({ sprite }) => sprite === "dog"), "deselected visible pet was not replaced");
assert(citizens.get(dogAgent.id) === dogAgent, "allowed visible pet was unnecessarily replaced");
assert(citizens.get(catAgent.id).doneSinceMs === catAgent.doneSinceMs, "cast replacement reset citizen state");
const done = citizens.get("b");
const preferences = { app: { hideCompletedPets: true, completedHideDelayMinutes: 5 } };
assert(!shouldHideCompleted(done, preferences, 300_999), "completed pet hid before its delay");
assert(shouldHideCompleted(done, preferences, 301_000), "completed pet did not hide at its delay");
citizens = reconcileCitizens(citizens, [
  { id: "a", status: "working", label: "A" },
  { id: "b", status: "blocked", label: "B" },
], ["dog"], 400_000);
assert(citizens.get("b").doneSinceMs === null, "non-completed state retained the completion timer");
assert(!shouldHideCompleted(citizens.get("b"), preferences, 999_999), "non-completed pet stayed hidden");
console.log("cast and completion visibility checks: pass");
CHECK
node "$TMP/cast-check.cjs"

pnpm exec esbuild src/renderer.ts --bundle --platform=node --format=cjs --loader:.png=dataurl \
  --define:import.meta.glob=globalThis.__testGlob --log-level=error --outfile="$TMP/renderer.cjs"
cat >"$TMP/renderer-check.cjs" <<'CHECK'
let nextFrame = null;
global.__testGlob = () => ({});
global.document = { hidden: false };
global.window = {
  innerWidth: 1000,
  innerHeight: 150,
  requestAnimationFrame: (callback) => { nextFrame = callback; },
};
const { VillageRenderer } = require("./renderer.cjs");
function assert(value, message) { if (!value) throw new Error(message); }
const style = { setProperty() {}, getPropertyValue() { return ""; }, transform: "" };
const pet = { hidden: true, dataset: {}, style, getBoundingClientRect: () => ({ x: 0, y: 0, width: 0, height: 0 }) };
let hovered = false;
const element = {
  dataset: { characterId: "cat" }, hidden: true, style,
  classList: { contains: () => false, toggle() {} },
  querySelector: (selector) => {
    if (selector === "img.pet" || selector === ".pet") return pet;
    if (selector === ".pet:hover") return hovered ? pet : null;
    return null;
  },
};
const root = { style: { setProperty() {} }, querySelectorAll: () => [] };
const sample = { visible: false, moving: true, speedPxPerSecond: 100, held: false, failed: false, state: "working", clip: null };
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
  x: 0, direction: 1, maximumX: 1000, behavior,
  packFingerprint: "test", fallbackAssetUrl: "", pendingElapsedMs: 0,
  dragging: false, dragOffsetX: 0,
});
const preferences = { app: {
  openWithHerdr: true, settingsAppearance: "system", lastSelectedPetId: "cat",
  hideCompletedPets: false, completedHideDelayMinutes: 5,
}, pets: { cat: {
  includedInRandomCast: true,
  appearance: { scalePercent: 100, opacityPercent: 100 },
  labels: { visibility: "always", textScalePercent: 100 },
  motion: { level: "gentle", reduced: false, pauseOnHover: true },
} } };
renderer.setPreferences(preferences);
nextFrame(1000);
nextFrame(1100);
assert(deltas.join(",") === "0,100", "renderer did not advance behavior with real elapsed time");
assert(renderer.motions.get("agent").x === 7, "gentle speed did not scale travel only");
preferences.pets.cat.motion.reduced = true;
nextFrame(1200);
assert(deltas.at(-1) === 100 && renderer.motions.get("agent").x === 7, "reduced movement stopped behavior progress or moved the pet");
preferences.pets.cat.motion.reduced = false;
hovered = true;
nextFrame(1300);
assert(deltas.at(-1) === 100 && renderer.motions.get("agent").x === 7, "hover pause stopped behavior progress or moved the pet");
hovered = false;
renderer.setSystemReducedMotion(true);
nextFrame(1400);
assert(deltas.at(-1) === 100 && renderer.motions.get("agent").x === 7, "system Reduce Motion stopped behavior progress or moved the pet");
renderer.setSystemReducedMotion(false);
preferences.pets.cat.motion.level = "standard";
nextFrame(1500);
assert(renderer.motions.get("agent").x === 17, "travel did not resume with standard distance");
pet.hidden = false; element.hidden = false;
element.dataset.flowVisible = "true"; element.dataset.preferenceHidden = "false";
preferences.app.hideCompletedPets = true; preferences.app.completedHideDelayMinutes = 1;
renderer.refreshPreferenceVisibility(new Map([["agent", { id: "agent", sprite: "cat", status: "done", doneSinceMs: 0 }]]));
assert(element.hidden, "paused visibility refresh did not hide an overdue completed pet");
renderer.refreshPreferenceVisibility(new Map([["agent", { id: "agent", sprite: "cat", status: "working", doneSinceMs: null }]]));
assert(!element.hidden, "paused visibility refresh did not restore an active pet");
console.log("renderer walking integration checks: pass");
CHECK
node "$TMP/renderer-check.cjs"

pnpm exec esbuild src/settings-preview.ts --bundle --platform=node --format=cjs \
  --log-level=error --outfile="$TMP/settings-preview.cjs"
cat >"$TMP/preview.cjs" <<'CHECK'
const { previewAnimations, selectedPreviewAnimationId } = require("./settings-preview.cjs");
const clip = (name, assetUrl, role = "stationary") => ({ name, assetUrl, scale: 1, role });
const options = previewAnimations({
  clips: { walk: clip("walk", "walk.png", "locomotion"), wave: clip("wave", "wave.png"), duplicate: clip("duplicate", "walk.png", "locomotion") },
  actions: { wave: { label: "Wave", flow: { type: "play", clip: "wave" } } },
});
if (options.map(({ label }) => label).join(",") !== "Wave,Walk") throw new Error("preview actions and clips were not labeled or deduplicated");
if (options.some(({ assetUrl }) => !assetUrl)) throw new Error("preview included an unusable clip");
if (options.find(({ label }) => label === "Walk")?.locomotion !== true) throw new Error("walking preview lost its locomotion role");
if (options.find(({ label }) => label === "Wave")?.locomotion !== false) throw new Error("stationary preview was marked as locomotion");
if (selectedPreviewAnimationId(options) !== "clip:walk") throw new Error("preview did not default to a locomotion clip");
if (selectedPreviewAnimationId(options, "action:wave") !== "action:wave") throw new Error("preview did not retain a selected stationary action");
console.log("settings animation preview checks: pass");
CHECK
node "$TMP/preview.cjs"

pnpm exec esbuild src/pet-freeze.ts --bundle --platform=node --format=cjs \
  --log-level=error --outfile="$TMP/pet-freeze.cjs"
cat >"$TMP/freeze.cjs" <<'CHECK'
let canvas = null;
const image = {
  hidden: false, complete: true, naturalWidth: 320, naturalHeight: 320,
  className: "pet clip-source-right", dataset: { assetKey: "sleep:1", assetReadyKey: "sleep:1" },
  style: { opacity: "", getPropertyValue: () => "1" },
  insertAdjacentElement: (_where, value) => { canvas = value; },
};
const element = { querySelector: (selector) => selector.startsWith("img") ? image : canvas };
global.document = { createElement: () => ({
  className: "", dataset: {}, style: { setProperty() {} },
  setAttribute() {}, getContext: () => ({ drawImage() {} }), remove() { canvas = null; },
}) };
const { freezePetFrame, unfreezePetFrame } = require("./pet-freeze.cjs");
freezePetFrame(element);
if (!canvas || image.style.opacity !== "0" || canvas.width !== 320) throw new Error("pet frame did not freeze without preserving the image hit target");
const sleepingCanvas = canvas;
image.dataset.assetKey = "wave:2";
freezePetFrame(element);
if (canvas !== sleepingCanvas) throw new Error("pending replacement discarded the last ready frozen frame");
image.dataset.assetReadyKey = "wave:2";
freezePetFrame(element);
if (canvas === sleepingCanvas || canvas.dataset.freezeKey !== "wave:2:pet clip-source-right") throw new Error("decoded replacement did not refresh the paused frozen frame");
unfreezePetFrame(element);
if (canvas || image.style.opacity !== "") throw new Error("pet frame did not resume");
console.log("preference freeze checks: pass");
CHECK
node "$TMP/freeze.cjs"

pnpm exec esbuild src/village-preferences.ts --bundle --platform=node --format=cjs \
  --external:@tauri-apps/api/core --external:@tauri-apps/api/event \
  --log-level=error --outfile="$TMP/village-preferences.cjs"
cat >"$TMP/village-preferences-check.cjs" <<'CHECK'
const Module = require("node:module");
const listeners = {};
let resolvePreferences;
let resolveSettingsOpen;
const initial = { revision: 2, preferences: { marker: "initial" } };
const applied = { revision: 1, preferences: { marker: "applied" } };
const stale = { revision: 0, preferences: { marker: "stale" } };
const later = { revision: 3, preferences: { marker: "later" } };
const originalLoad = Module._load;
Module._load = (request, parent, main) => {
  if (request === "@tauri-apps/api/event") return { listen: async (name, callback) => { listeners[name] = callback; return () => {}; } };
  if (request === "@tauri-apps/api/core") return { invoke: (command) => new Promise((resolve) => {
    if (command === "get_preferences") resolvePreferences = resolve;
    else if (command === "is_settings_open") resolveSettingsOpen = resolve;
  }) };
  return originalLoad(request, parent, main);
};
const { installVillagePreferences } = require("./village-preferences.cjs");
function assert(value, message) { if (!value) throw new Error(message); }
(async () => {
  const seenPreferences = [];
  let paused = false;
  const renderer = { setPreferences: (value) => seenPreferences.push(value.marker), setPaused: (value) => { paused = value; } };
  const installing = installVillagePreferences(renderer, () => { paused = true; }, () => { paused = false; });
  await new Promise(setImmediate);
  assert(listeners["village-pause"] && listeners["preferences-applied"], "listeners were not installed before the initial snapshot");
  listeners["village-pause"]();
  listeners["preferences-applied"]({ payload: applied });
  listeners["preferences-applied"]({ payload: stale });
  resolvePreferences(initial);
  resolveSettingsOpen(false);
  await installing;
  listeners["preferences-applied"]({ payload: later });
  assert(paused, "startup snapshot overrode a newer pause event");
  assert(seenPreferences.join(",") === "applied,initial,later", "village did not select preference snapshots by revision");
  console.log("preference event ordering checks: pass");
})().catch((error) => { console.error(error); process.exitCode = 1; });
CHECK
node "$TMP/village-preferences-check.cjs"

pnpm exec esbuild src/settings-apply.ts --bundle --platform=node --format=cjs \
  --log-level=error --outfile="$TMP/settings-apply.cjs"
node - "$TMP/settings-apply.cjs" <<'CHECK'
const { mergeAppliedDraft, settingsMessage, shouldShowApplyError } = require(process.argv[2]);
const submitted = { app: { value: 1 }, pets: {} };
const applied = { preferences: { app: { value: 1 }, pets: {} } };
const newer = { app: { value: 2 }, pets: {} };
if (mergeAppliedDraft(newer, submitted, applied).draft !== newer) throw new Error("Apply discarded newer draft edits");
if (mergeAppliedDraft(submitted, submitted, applied).draft === submitted) throw new Error("Apply did not install its saved draft");
if (settingsMessage("new failure", "old warning") !== "new failure old warning") throw new Error("Apply status messages were not combined");
if (shouldShowApplyError(2, 2, 1, 0)) throw new Error("superseded baseline exposed a stale Apply conflict");
if (!shouldShowApplyError(2, 2, 0, 0)) throw new Error("current Apply failure was hidden");
console.log("settings Apply merge checks: pass");
CHECK

pnpm exec esbuild src/settings-startup.ts --bundle --platform=node --format=cjs \
  --log-level=error --outfile="$TMP/settings-startup.cjs"
node - "$TMP/settings-startup.cjs" <<'CHECK'
const { SettingsStartupBuffer } = require(process.argv[2]);
const buffer = new SettingsStartupBuffer();
const seen = [];
buffer.receiveSnapshot({ revision: 2, value: "reloaded" }, (item) => seen.push(`snapshot:${item.value}`));
buffer.receiveSnapshot({ revision: 1, value: "stale" }, (item) => seen.push(`snapshot:${item.value}`));
buffer.receiveSelection("new-pet", (value) => seen.push(`selection:${value}`));
buffer.finish({ revision: 0, value: "initial" }, "old-pet", (item, selection) => seen.push(`finish:${item.value}:${selection}`));
buffer.receiveSnapshot({ revision: 3, value: "later" }, (item) => seen.push(`snapshot:${item.value}`));
buffer.receiveSelection("later-pet", (value) => seen.push(`selection:${value}`));
if (seen.join(",") !== "finish:reloaded:new-pet,snapshot:later,selection:later-pet") throw new Error("Settings startup event buffering lost, regressed, or reordered state");
const reverse = new SettingsStartupBuffer();
let newest;
reverse.receiveSnapshot({ revision: 1, value: "event" }, () => {});
reverse.finish({ revision: 2, value: "command" }, "pet", (item) => { newest = item.value; });
if (newest !== "command") throw new Error("Settings startup preferred an older event snapshot");
console.log("settings startup event checks: pass");
CHECK

pref_line=$(grep -n 'await installVillagePreferences' src/main.ts | cut -d: -f1)
show_line=$(grep -n 'show_village' src/main.ts | cut -d: -f1)
poll_line=$(grep -n 'void poll' src/main.ts | cut -d: -f1)
[ "$pref_line" -lt "$show_line" ] && [ "$pref_line" -lt "$poll_line" ]

grep -q 'id = "preferences"' "$ROOT/herdr-plugin.toml"
grep -q 'id = "reload-preferences"' "$ROOT/herdr-plugin.toml"
grep -q 'command = \["sh", "scripts/supervisor.sh", "startup"\]' "$ROOT/herdr-plugin.toml"
grep -q 'Preferences…' src/pet-interactions.ts
grep -q 'Unapplied changes' settings.html
grep -q '>Pet</span>' settings.html
[ "$(grep -o '<button[^>]*data-tab=' settings.html | wc -l | tr -d ' ')" = 6 ]
[ "$(grep -o 'class="toolbar-glyph"' settings.html | wc -l | tr -d ' ')" = 6 ]
grep -q '<svg viewBox="0 0 24 24" focusable="false">' settings.html
grep -q 'id="animation-select"' settings.html
grep -q 'getElementById("preview")!.hidden = !detail' src/settings-navigation.ts
grep -q 'getElementById("preview-selectors")!.hidden = !detail' src/settings-navigation.ts
grep -q 'preview.dataset.reducedMovement' src/settings.ts
if grep -q 'freezePetFrame' src/settings.ts; then
  echo "system Reduce Motion still freezes the preview sprite" >&2
  exit 1
fi
grep -q 'preview.dataset.pauseOnHover' src/settings.ts
[ "$(grep -o 'class="switch"[^>]*role="switch"' settings.html | wc -l | tr -d ' ')" = 5 ]
grep -q 'bindSwitch("reduced-motion"' src/settings.ts
grep -q 'bindSwitch("pause-hover"' src/settings.ts
grep -q 'bindSwitch("include-random-cast"' src/settings.ts
grep -q 'bindSwitch("hide-completed-pets"' src/settings.ts
grep -q 'completed-hide-delay' src/settings.ts
grep -q 'invoke<boolean>("is_settings_open")' src/village-preferences.ts
grep -q 'SettingsStartupBuffer' src/settings.ts
grep -q 'next.revision < snapshot.revision' src/settings.ts
grep -q 'draft: submitted, expectedRevision' src/settings.ts
grep -q 'mergeAppliedDraft' src/settings.ts
grep -q 'generation === applyGeneration' src/settings.ts
grep -q 'applying || !changed' src/settings.ts
grep -q 'resetAll.disabled = applying' src/settings.ts
grep -q 'village.dispatchEvent(new Event("village-pause"))' src/main.ts
grep -q 'settingsMessage' src/settings.ts
grep -q 'hide-completed-pets.*disabled = snapshot.readOnly' src/settings-choice-controls.ts
grep -q 'setSettingsReadOnly' src/settings-choice-controls.ts
grep -q 'class="settings-loading"' settings.html
grep -q 'classList.remove("settings-loading")' src/settings.ts
grep -q 'await invoke("show_settings")' src/settings.ts
grep -q 'settings_window::show_settings' src-tauri/src/lib.rs
grep -A14 'WebviewWindowBuilder::new' src-tauri/src/settings_window.rs | grep -q '\.visible(false)'
if grep -q '\.on_page_load' src-tauri/src/lib.rs; then
  echo "native window still shows before initialization" >&2
  exit 1
fi
if grep -A30 'pub(crate) fn configure_window' src-tauri/src/window.rs | grep -Eq 'orderFrontRegardless|window\.show'; then
  echo "village configure still shows before initialization" >&2
  exit 1
fi
grep -q 'session.ready' src-tauri/src/settings_window.rs
[ ! -e src-tauri/src/preferences_migration.rs ]
grep -q 'pub const SCHEMA_VERSION: u32 = 3' src-tauri/src/preferences_model.rs
grep -q 'state.read_only = protect_source' src-tauri/src/preferences.rs
if grep -A20 'window.emit("settings-selection"' src-tauri/src/settings_window.rs | head -20 | grep -q 'to_string())?'; then
  echo "Settings event error bypasses cleanup" >&2
  exit 1
fi
grep -q '<option value="60">60 minutes</option>' settings.html
grep -q 'arm_readiness_timeout' src-tauri/src/settings_window.rs
grep -q 'window.hide().is_ok()' src-tauri/src/settings_window_lifecycle.rs
grep -q 'settings_window::is_settings_open' src-tauri/src/lib.rs
grep -A3 -q '^:root\[data-theme="light"\] \.row small {' src/settings.css
grep -A3 '^:root\[data-theme="light"\] \.row small {' src/settings.css | grep -q 'color: #50535a;'
grep -A4 '^:root\[data-theme="light"\] code {' src/settings.css | grep -q 'background: #0000000a;'
grep -A4 '^:root\[data-theme="light"\] code {' src/settings.css | grep -q 'color: #35373d;'
grep -q ':root:not(\[data-theme="dark"\]) \.secondary' src/settings.css
grep -q 'bindSwitch("open-with-herdr"' src/settings.ts
[ "$(grep -o 'type="checkbox"' settings.html | wc -l | tr -d ' ')" = 1 ]
grep -q 'id="studio-assign-orchestrator" type="checkbox"' settings.html
grep -q 'selectedPreviewAnimationId(animationOptions, remembered)' src/settings.ts
grep -q 'id="studio-sheet-loading".*Generating and checking one sprite sheet' settings.html
grep -q 'id="studio-animation-loading".*Creating the APNG loop' settings.html
grep -q 'id="studio-operation-status".*aria-live="polite"' settings.html
grep -q 'grid-template-rows: auto 240px auto' src/settings-studio.css
grep -q 'grid-template-rows: repeat(2, minmax(0, 1fr))' src/settings-studio.css
grep -Fq 'role: $<HTMLSelectElement>("studio-role").value' src/settings-studio.ts
grep -q 'generatedRoles.set(asset.animationId, asset.role)' src/settings-studio.ts
grep -Fq '!this.candidates.has(this.pendingAnimationId)' src/settings-studio.ts
grep -q 'candidate_role = Some(request.role.clone())' src-tauri/src/pet_studio/animation_generation.rs
grep -q 'animation kind changed after frame generation' src-tauri/src/pet_studio/generation_commands.rs
grep -q 'SPRITE_PROMPT_VERSION' src-tauri/src/pet_studio/animation_generation.rs
grep -q 'runSpritePipeline' scripts/pet-studio-image-worker.mjs
grep -q 'repeat nearly the same pose' src-tauri/src/pet_studio/generated_frame_validation.rs
grep -q 'setBusy(true, "generate-sheet")' src/settings-studio.ts
grep -q 'setBusy(true, "create-animation")' src/settings-studio.ts
grep -Fq 'disabled = this.busy || !nextReady' src/settings-studio.ts
grep -Fq 'this.approved.size > 0' src/settings-studio.ts
grep -Fq 'if (!this.draftId && !(await this.startDraft("generate-reference"))) return' src/settings-studio.ts
grep -q 'id="studio-reference-loading".*Generating character reference' settings.html
grep -q 'operation: "generate-reference"' src/settings-studio-progress.ts
grep -q 'operation: "import-animation"' src/settings-studio-progress.ts
grep -q 'setBusy(true, "import-animation")' src/settings-studio.ts
grep -Fq 'dataset.ready !== "true"' src/settings-studio.ts
grep -q 'await this.show("studio-reference-preview"' src/settings-studio.ts
grep -q 'await renderFrameGrid("studio-frame-preview"' src/settings-studio.ts
grep -q '^inherit_openai_key() {' "$ROOT/scripts/supervisor.sh"
grep -Fq '/bin/launchctl getenv OPENAI_API_KEY' "$ROOT/scripts/supervisor.sh"
grep -q 'generation_worker::sprite' src-tauri/src/pet_studio/animation_generation.rs
grep -q 'generateImage' scripts/pet-studio-image-worker.mjs
grep -q 'runSpritePipeline' scripts/pet-studio-image-worker.mjs
[ ! -e src-tauri/src/pet_studio/openai.rs ]
[ ! -e src-tauri/src/pet_studio/frame_generation.rs ]
[ ! -e src-tauri/src/pet_studio/sheet_layout.rs ]
grep -q 'const FRAME_COUNT: usize = 6' src-tauri/src/pet_studio/animation_generation.rs
grep -q 'data-locomotion="true"' src/settings.css
grep -q 'calc(-50% - 24px)' src/settings.css
grep -q 'data-reduced-movement="true"' src/settings.css
grep -q 'data-pause-on-hover="true"' src/settings.css
grep -A5 '^@media (prefers-reduced-motion: reduce) {' src/settings.css | grep -q 'data-locomotion="true"'
grep -A5 '^@media (prefers-reduced-motion: reduce) {' src/settings.css | grep -q 'animation: none;'
grep -q 'motion.behavior.advance(elapsedMs + motion.pendingElapsedMs' src/renderer.ts
grep -q 'render(true)' src/main.ts
grep -q 'const distance = travelDistanceFor(' src/renderer.ts
grep -q 'renderer.setSystemReducedMotion(systemReducedMotion.matches)' src/main.ts
if grep -q 'behavior.advance(effectiveElapsed' src/renderer.ts; then
  echo "walking preferences still alter behavior timing" >&2
  exit 1
fi
grep -q 'settings-layout:not(\[data-tab="pet"\])' src/settings.css
grep -q 'Also start with Herdr' settings.html
grep -q 'Optional when you use Herdr alongside the standalone app.' settings.html
if grep -qE '>Editing<|Village paused|data-tab="motion"|>Open with Herdr<|<h1>Pet</h1>' settings.html; then
  echo "obsolete Settings chrome or copy remains" >&2
  exit 1
fi
grep -A2 '^\.pet-freeze {' src/styles.css | grep -q 'pointer-events: none;'
grep -A5 '^\.pet-stack > \.pet-freeze {' src/styles.css | grep -q 'position: absolute;'
grep -A5 '^\.pet-stack > \.pet-freeze {' src/styles.css | grep -q 'bottom: 0;'
grep -A5 '^\.pet-stack > \.pet-freeze {' src/styles.css | grep -q 'translate: -50% 0;'

cargo build --quiet --manifest-path src-tauri/Cargo.toml
BINARY=src-tauri/target/debug/pet-village
HOME="$TMP/missing-home" "$BINARY" --startup-enabled
[ ! -e "$TMP/missing-home/.pet-village" ]
mkdir -p "$TMP/disabled-home/.pet-village"
python3 - "$TMP/disabled-home/.pet-village/preferences.json" <<'PY'
import json, pathlib, sys
ids=sorted(p.parent.name for p in pathlib.Path("src/pets").glob("*/flow.json"))
pet={"includedInRandomCast":True,"appearance":{"scalePercent":100,"opacityPercent":100},"labels":{"visibility":"always","textScalePercent":100},"motion":{"level":"standard","reduced":False,"pauseOnHover":True}}
orchestrator={"enabled":False,"displayName":"Mochi","model":"gpt-5.6-luna","thinking":"medium","wakeEnabled":True,"petId":None}
data={"schemaVersion":3,"app":{"openWithHerdr":False,"settingsAppearance":"system","lastSelectedPetId":ids[0],"hideCompletedPets":False,"completedHideDelayMinutes":5,"orchestrator":orchestrator},"pets":{i:pet for i in ids}}
pathlib.Path(sys.argv[1]).write_text(json.dumps(data))
PY
if HOME="$TMP/disabled-home" "$BINARY" --startup-enabled; then
  echo "disabled startup preference was ignored" >&2
  exit 1
fi
echo "preference storage and startup checks: pass"
