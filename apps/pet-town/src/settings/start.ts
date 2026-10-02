import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { PreferencesSnapshot, SettingsContext } from "../preferences-types";
import type { AdapterSettings } from "../settings-adapters";
import { byId } from "../settings-dom";
import type { SettingsNavigation } from "../settings-navigation";
import { loadPetPacks } from "../settings-pack-loader";
import { SettingsStartupBuffer } from "../settings-startup";
import { PetStudio } from "../settings-studio";
import type { VillageVisibilitySettings } from "../settings-village";
import type { SettingsScenePreviews } from "./scene-previews";

interface SettingsStartup {
  scenePreviews: SettingsScenePreviews;
  bindControls: () => void;
  setStudio: (studio: PetStudio) => void;
  navigation: SettingsNavigation;
  installSelection: (id: string | null, fromGallery?: boolean, focus?: boolean) => void;
  installSnapshot: (
    next: PreferencesSnapshot,
    selection?: string | null,
    preserveDraft?: boolean,
  ) => void;
  villageVisibility: VillageVisibilitySettings;
  adapterSettings: AdapterSettings;
}

export async function startSettings({
  scenePreviews,
  bindControls,
  setStudio,
  navigation,
  installSelection,
  installSnapshot,
  villageVisibility,
  adapterSettings,
}: SettingsStartup): Promise<void> {
  scenePreviews.start();
  const extensionWarning = await loadPetPacks();
  bindControls();
  const studioInstance = new PetStudio();
  setStudio(studioInstance);
  if (extensionWarning) studioInstance.showExtensionWarning(extensionWarning);
  const startup = new SettingsStartupBuffer<PreferencesSnapshot, string | null>();
  await Promise.all([
    listen<SettingsContext>("settings-selection", (event) =>
      event.payload.initialTab === "app" || event.payload.initialTab === "assistant"
        ? navigation.show(event.payload.initialTab)
        : startup.receiveSelection(event.payload.selectedPetId, (id) => installSelection(id)),
    ),
    listen<PreferencesSnapshot>("preferences-reloaded", (event) =>
      startup.receiveSnapshot(event.payload, installSnapshot),
    ),
    listen<PreferencesSnapshot>("pet-studio-preferences", async (event) => {
      const warning = await loadPetPacks();
      studioInstance.refreshSources();
      if (warning) studioInstance.showExtensionWarning(warning);
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
  startup.finish(initial, openContext.selectedPetId, (next, selection) => {
    installSnapshot(next, selection);
    if (openContext.initialTab === "assistant" || location.hash === "#assistant")
      navigation.show("assistant");
    else if (location.hash === "#studio-orchestrator") navigation.show("studio");
    else if (location.hash === "#app" || openContext.initialTab === "app") navigation.show("app");
    else installSelection(selection ?? null, false, false);
  });
  await adapterSettings.load();
  document.body.classList.remove("settings-loading");
  await invoke("show_settings");
}
export function showSettingsLoadError(error: unknown): void {
  byId<HTMLElement>("dirty").hidden = true;
  document
    .querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>(
      "input, select, button",
    )
    .forEach((control) => {
      control.disabled = true;
    });
  byId<HTMLElement>("message").textContent =
    `Could not load preferences; Settings are disabled. ${String(error)}`;
  document.body.classList.remove("settings-loading");
  void invoke("show_settings").catch(() => undefined);
}
