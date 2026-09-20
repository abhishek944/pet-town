import { getVersion } from "@tauri-apps/api/app"; import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window"; import { listen } from "@tauri-apps/api/event";
import { behaviorPackForCharacter, characterDisplayName } from "./character-packs";
import { loadPetPacks } from "./settings-pack-loader";
import { clonePreferences, friendlyPetName, motionFactor, preferencesEqual, type LabelVisibility, type MotionLevel, type PreferencesFile, type PreferencesSnapshot, type SettingsAppearance, type SettingsContext } from "./preferences-types";
import { previewAnimations, selectedPreviewAnimationId, type PreviewAnimationOption } from "./settings-preview";
import { mergeAppliedDraft, settingsMessage, shouldShowApplyError } from "./settings-apply"; import { mergeLocalPreferenceEdits } from "./settings-three-way";
import { renderChoiceControls, setSettingsReadOnly } from "./settings-choice-controls";
import { SettingsStartupBuffer } from "./settings-startup"; import { SettingsNavigation } from "./settings-navigation";
import { AdapterSettings } from "./settings-adapters"; import { AssistantSettings } from "./settings-assistant"; import { PetStudio } from "./settings-studio";
import { VillageVisibilitySettings } from "./settings-village";
const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing settings control: ${id}`);
  return element as T;
}; const petSelect = byId<HTMLSelectElement>("pet-select");
const animationSelect = byId<HTMLSelectElement>("animation-select");
const previewPet = byId<HTMLImageElement>("preview-pet"); const preview = byId<HTMLElement>("preview");
const resetPet = byId<HTMLButtonElement>("reset-pet"); const resetAll = byId<HTMLButtonElement>("reset-all");
const apply = byId<HTMLButtonElement>("apply"); const dirty = byId<HTMLElement>("dirty");
const message = byId<HTMLElement>("message");
let snapshot: PreferencesSnapshot; let draft: PreferencesFile;
let selectedPetId = ""; let animationOptions: PreviewAnimationOption[] = [];
let draftMessage = ""; let applyGeneration = 0; let applying = false;
const adapterSettings = new AdapterSettings((next) => {
  draftMessage = next;
  if (typeof snapshot !== "undefined") render();
});
const selectedAnimationByPet = new Map<string, string>(); const navigation = new SettingsNavigation((id) => {
  installSelection(id, true);
}, () => selectedPetId); const assistantSettings = new AssistantSettings(() => draft, render);
const villageVisibility = new VillageVisibilitySettings((error) => { draftMessage = error; render(); });
function pet() { return draft.pets[selectedPetId]; }
function isDirty(): boolean { return !preferencesEqual(draft, snapshot.preferences); }
function setSwitch(id: string, checked: boolean): void {
  byId<HTMLButtonElement>(id).setAttribute("aria-checked", String(checked));
}
function bindSwitch(id: string, update: (checked: boolean) => void): void {
  byId<HTMLButtonElement>(id).addEventListener("click", (event) => {
    const current = (event.currentTarget as HTMLButtonElement).getAttribute("aria-checked") === "true";
    update(!current);
    render();
  });
}
function selectPreviewAnimations(preferred?: string): void {
  animationOptions = previewAnimations(behaviorPackForCharacter(selectedPetId));
  animationSelect.replaceChildren(...animationOptions.map((item) => new Option(item.label, item.id)));
  const remembered = preferred ?? selectedAnimationByPet.get(selectedPetId);
  const selected = selectedPreviewAnimationId(animationOptions, remembered);
  animationSelect.value = selected;
  animationSelect.disabled = animationOptions.length === 0;
  selectedAnimationByPet.set(selectedPetId, selected);
}
function render(): void {
  const item = pet();
  if (!item) return;
  navigation.gallery.update(snapshot.petIds, draft);
  const animation = animationOptions.find((option) => option.id === animationSelect.value);
  if (animation && previewPet.dataset.previewAsset !== animation.assetUrl) {
    previewPet.dataset.previewAsset = animation.assetUrl;
    previewPet.src = animation.assetUrl;
  }
  previewPet.hidden = !animation;
  const clipScale = animation?.scale ?? 1;
  preview.style.setProperty("--preview-size", `${Math.min(190, Math.round(148 * clipScale * item.appearance.scalePercent / 100))}px`);
  preview.style.setProperty("--preview-opacity", String(item.appearance.opacityPercent / 100));
  preview.style.setProperty("--preview-walk-duration", `${(4 / motionFactor(item.motion.level)).toFixed(2)}s`);
  preview.dataset.reducedMovement = String(item.motion.reduced);
  preview.dataset.pauseOnHover = String(item.motion.pauseOnHover);
  preview.dataset.locomotion = String(animation?.locomotion ?? false);
  byId<HTMLInputElement>("pet-size").value = String(item.appearance.scalePercent);
  byId<HTMLOutputElement>("pet-size-value").value = `${item.appearance.scalePercent}%`;
  byId<HTMLInputElement>("pet-opacity").value = String(item.appearance.opacityPercent);
  byId<HTMLOutputElement>("pet-opacity-value").value = `${item.appearance.opacityPercent}%`;
  byId<HTMLSelectElement>("label-visibility").value = item.labels.visibility;
  byId<HTMLInputElement>("label-size").value = String(item.labels.textScalePercent);
  byId<HTMLOutputElement>("label-size-value").value = `${item.labels.textScalePercent}%`;
  byId<HTMLSelectElement>("motion-level").value = item.motion.level;
  setSwitch("reduced-motion", item.motion.reduced);
  setSwitch("pause-hover", item.motion.pauseOnHover);
  renderChoiceControls(draft, snapshot, item);
  setSettingsReadOnly(snapshot.readOnly);
  setSwitch("open-with-herdr", draft.app.openWithHerdr);
  villageVisibility.render();
  assistantSettings.render();
  byId<HTMLSelectElement>("settings-appearance").value = draft.app.settingsAppearance;
  document.documentElement.dataset.theme = draft.app.settingsAppearance;
  const changed = isDirty();
  apply.disabled = applying || !changed || snapshot.readOnly; resetPet.disabled = snapshot.readOnly;
  resetAll.disabled = applying || snapshot.readOnly;
  dirty.hidden = !changed; message.textContent = settingsMessage(draftMessage, snapshot.warning);
}
function bindRange(id: string, update: (value: number) => void): void {
  byId<HTMLInputElement>(id).addEventListener("input", (event) => {
    update(Number((event.currentTarget as HTMLInputElement).value));
    render();
  });
}
function bindControls(): void {
  petSelect.addEventListener("change", () => {
    selectedPetId = petSelect.value;
    selectPreviewAnimations();
    render();
  });
  animationSelect.addEventListener("change", () => {
    selectedAnimationByPet.set(selectedPetId, animationSelect.value);
    render();
  });
  bindRange("pet-size", (value) => { pet().appearance.scalePercent = value; });
  bindRange("pet-opacity", (value) => { pet().appearance.opacityPercent = value; });
  bindRange("label-size", (value) => { pet().labels.textScalePercent = value; });
  byId<HTMLSelectElement>("label-visibility").addEventListener("change", (event) => { pet().labels.visibility = (event.currentTarget as HTMLSelectElement).value as LabelVisibility; render(); });
  byId<HTMLSelectElement>("motion-level").addEventListener("change", (event) => { pet().motion.level = (event.currentTarget as HTMLSelectElement).value as MotionLevel; render(); });
  bindSwitch("reduced-motion", (checked) => { pet().motion.reduced = checked; });
  bindSwitch("pause-hover", (checked) => { pet().motion.pauseOnHover = checked; });
  bindSwitch("include-random-cast", (checked) => { pet().includedInRandomCast = checked; });
  bindSwitch("hide-completed-pets", (checked) => { draft.app.hideCompletedPets = checked; });
  byId<HTMLSelectElement>("completed-hide-delay").addEventListener("change", (event) => { draft.app.completedHideDelayMinutes = Number((event.currentTarget as HTMLSelectElement).value); render(); });
  bindSwitch("open-with-herdr", (checked) => { draft.app.openWithHerdr = checked; });
  villageVisibility.bind();
  byId<HTMLSelectElement>("settings-appearance").addEventListener("change", (event) => { draft.app.settingsAppearance = (event.currentTarget as HTMLSelectElement).value as SettingsAppearance; render(); });
  resetPet.addEventListener("click", () => { draft.pets[selectedPetId] = clonePreferences(snapshot.defaults).pets[selectedPetId]; render(); });
  byId<HTMLButtonElement>("agents-done").addEventListener("click", () => { void getCurrentWindow().close(); });
  apply.addEventListener("click", () => { void applyDraft(); });
  resetAll.addEventListener("click", () => {
    if (confirm("Reset all Pet Town preferences?")) {
      draft = clonePreferences(snapshot.defaults);
      void applyDraft(false);
    }
  });
}
async function applyDraft(rememberSelection = true): Promise<void> {
  if (rememberSelection) draft.app.lastSelectedPetId = selectedPetId;
  const generation = ++applyGeneration; const submitted = clonePreferences(draft);
  const expectedRevision = snapshot.revision; applying = true; render();
  try {
    const applied = await invoke<PreferencesSnapshot>("apply_preferences", { draft: submitted, expectedRevision });
    if (applied.revision >= snapshot.revision) {
      const merged = mergeAppliedDraft(draft, submitted, applied);
      snapshot = applied; draft = merged.draft;
      if (generation === applyGeneration) draftMessage = merged.message;
    }
  } catch (error) {
    if (shouldShowApplyError(generation, applyGeneration, snapshot.revision, expectedRevision)) {
      draftMessage = String(error);
    }
  }
  if (generation === applyGeneration) { applying = false; render(); }
}
function installSnapshot(next: PreferencesSnapshot, selection?: string | null, preserveDraft = false): void {
  if (typeof snapshot !== "undefined" && next.revision < snapshot.revision) return;
  if (!next.petIds.length) throw new Error("No pets are available in this version.");
  const pending = preserveDraft && typeof draft !== "undefined" ? draft : null;
  const previous = pending ? snapshot.preferences : next.preferences;
  snapshot = next; applyGeneration += 1; applying = false; draftMessage = "";
  draft = pending ? mergeLocalPreferenceEdits(previous, pending, next.preferences) : clonePreferences(next.preferences);
  const preferred = selection ?? (selectedPetId || next.preferences.app.lastSelectedPetId);
  selectedPetId = next.petIds.includes(preferred) ? preferred : next.petIds[0];
  petSelect.replaceChildren(...next.petIds.map((id) => new Option(characterDisplayName(id) ?? friendlyPetName(id), id)));
  petSelect.value = selectedPetId;
  selectPreviewAnimations();
  render();
}
function installSelection(next: string | null, fromGallery = false, focus = true): void {
  if (!fromGallery) navigation.gallery.directEntry();
  if (next === null) { navigation.show("gallery", focus); return; }
  if (!snapshot.petIds.includes(next)) return;
  selectedPetId = next; petSelect.value = selectedPetId;
  selectPreviewAnimations(); render(); navigation.show("pet", focus);
}
async function start(): Promise<void> {
  const extensionWarning = await loadPetPacks(); bindControls(); const studio = new PetStudio();
  if (extensionWarning) studio.showExtensionWarning(extensionWarning);
  const startup = new SettingsStartupBuffer<PreferencesSnapshot, string | null>();
  await Promise.all([
    listen<SettingsContext>("settings-selection", (event) =>
      startup.receiveSelection(event.payload.selectedPetId, (id) => installSelection(id))),
    listen<PreferencesSnapshot>("preferences-reloaded", (event) => startup.receiveSnapshot(event.payload, installSnapshot)),
    listen<PreferencesSnapshot>("pet-studio-preferences", async (event) => {
      const warning = await loadPetPacks(); studio.refreshSources(); if (warning) studio.showExtensionWarning(warning);
      startup.receiveSnapshot(event.payload, (next) => installSnapshot(next, undefined, true));
    }),
  ]);
  const [initial, openContext, version] = await Promise.all([
    invoke<PreferencesSnapshot>("get_preferences"),
    invoke<SettingsContext>("get_settings_context"),
    getVersion(),
    villageVisibility.load(),
  ]);
  byId<HTMLElement>("app-version").textContent = version;
  startup.finish(initial, openContext.selectedPetId, (next, selection) => { installSnapshot(next, selection); if (location.hash === "#studio-orchestrator") navigation.show("studio"); else if (location.hash === "#assistant") navigation.show("assistant"); else if (location.hash === "#app" || openContext.initialTab === "app") navigation.show("app"); else installSelection(selection ?? null, false, false); });
  await adapterSettings.load();
  document.body.classList.remove("settings-loading");
  await invoke("show_settings");
}
void start().catch((error) => {
  dirty.hidden = true; document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>("input, select, button").forEach((control) => { control.disabled = true; });
  message.textContent = `Could not load preferences; Settings are disabled. ${String(error)}`; document.body.classList.remove("settings-loading"); void invoke("show_settings").catch(() => undefined);
});
