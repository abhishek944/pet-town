import { characterDisplayName } from "./character-packs";
import { clonePreferences, friendlyPetName, type PreferencesSnapshot } from "./preferences-types";
import { AdapterSettings } from "./settings-adapters";
import { AssistantSettings } from "./settings-assistant";
import { byId, setSwitch } from "./settings-dom";
import { SettingsNavigation } from "./settings-navigation";
import type { PetStudio } from "./settings-studio";
import { VillageVisibilitySettings } from "./settings-village";
import { bindAppControls } from "./settings/app-controls";
import { SettingsDraft } from "./settings/draft";
import { bindPetControls } from "./settings/pet-controls";
import { SettingsPetPreview } from "./settings/pet-preview";
import { renderPetControls } from "./settings/pet-view";
import { SettingsScenePreviews } from "./settings/scene-previews";
import { showSettingsLoadError, startSettings } from "./settings/start";

const petSelect = byId<HTMLSelectElement>("pet-select");
const state = new SettingsDraft(render, selectPreviewAnimations);
const scenePreviews = new SettingsScenePreviews(() => state.preferences, render);
let selectedPetId = "";
let studio: PetStudio | undefined;
const adapterSettings = new AdapterSettings((next, tone = "error") => {
  state.message = next;
  state.messageTone = tone;
  if (state.snapshot) render();
});
const navigation = new SettingsNavigation(
  (id) => installSelection(id, true),
  () => selectedPetId,
);
const assistantSettings = new AssistantSettings(
  () => state.preferences,
  render,
  () => state.snapshot?.preferences.app.orchestrator ?? null,
);
const villageVisibility = new VillageVisibilitySettings((error) => {
  state.message = error;
  render();
});
const petPreview = new SettingsPetPreview(
  () => state.preferences,
  () => selectedPetId,
  render,
  (petId, petState, file) => {
    navigation.show("studio");
    studio?.importApngForState(petId, petState, file);
  },
);

function selectPreviewAnimations(): void {
  petPreview.selectAnimations();
}

function render(): void {
  const draft = state.preferences;
  const snapshot = state.snapshot;
  const item = draft.pets[selectedPetId];
  if (!item) return;
  navigation.gallery.update(snapshot.petIds, draft);
  petPreview.renderPet(item);
  renderPetControls(draft, snapshot, selectedPetId);
  setSwitch("open-with-herdr", draft.app.openWithHerdr);
  villageVisibility.render();
  assistantSettings.render();
  scenePreviews.render(draft, snapshot.readOnly);
  state.renderActions();
}

function bindControls(): void {
  bindPetControls(
    () => state.preferences.pets[selectedPetId],
    (id) => {
      selectedPetId = id;
    },
    selectPreviewAnimations,
    render,
  );
  bindAppControls(
    () => state.preferences,
    selectPreviewAnimations,
    render,
    () => villageVisibility.bind(),
    (error) => {
      state.message = error;
      state.messageTone = "error";
      render();
    },
  );
  byId<HTMLButtonElement>("reset-pet").addEventListener("click", () => {
    state.preferences.pets[selectedPetId] = clonePreferences(state.snapshot.defaults).pets[
      selectedPetId
    ];
    selectPreviewAnimations();
    render();
  });
  byId<HTMLButtonElement>("apply").addEventListener("click", () => {
    void state.apply(selectedPetId);
  });
  byId<HTMLButtonElement>("reset-all").addEventListener("click", () => {
    if (confirm("Reset all Pet Town preferences?")) {
      state.preferences = clonePreferences(state.snapshot.defaults);
      selectPreviewAnimations();
      void state.apply(selectedPetId, false);
    }
  });
}

function installSnapshot(
  next: PreferencesSnapshot,
  selection?: string | null,
  preserveDraft = false,
): void {
  if (!state.installSnapshot(next, preserveDraft)) return;
  const preferred = selection ?? (selectedPetId || next.preferences.app.lastSelectedPetId);
  selectedPetId = next.petIds.includes(preferred) ? preferred : next.petIds[0];
  petSelect.replaceChildren(
    ...next.petIds.map(
      (id) =>
        new Option(
          state.preferences.pets[id]?.customName?.trim() ||
            characterDisplayName(id) ||
            friendlyPetName(id),
          id,
        ),
    ),
  );
  petSelect.value = selectedPetId;
  selectPreviewAnimations();
  render();
}

function installSelection(next: string | null, fromGallery = false, focus = true): void {
  if (!fromGallery) navigation.gallery.directEntry();
  if (next === null) {
    navigation.show("gallery", focus);
    return;
  }
  if (!state.snapshot.petIds.includes(next)) return;
  selectedPetId = next;
  petSelect.value = selectedPetId;
  selectPreviewAnimations();
  render();
  navigation.show("pet", focus);
}

void startSettings({
  scenePreviews,
  bindControls,
  setStudio: (instance) => {
    studio = instance;
  },
  navigation,
  installSelection,
  installSnapshot,
  villageVisibility,
  adapterSettings,
}).catch(showSettingsLoadError);
