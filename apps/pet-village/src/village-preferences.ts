import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { PreferencesFile, PreferencesSnapshot } from "./preferences-types";
import type { VillageRenderer } from "./renderer";

export async function installVillagePreferences(
  renderer: VillageRenderer,
  pause: () => void,
  resume: () => void,
  onPreferences: (preferences: PreferencesFile) => void = () => {},
): Promise<void> {
  let latestRevision = -1;
  const apply = (snapshot: PreferencesSnapshot): void => {
    if (snapshot.revision < latestRevision) return;
    latestRevision = snapshot.revision;
    renderer.setPreferences(snapshot.preferences);
    onPreferences(snapshot.preferences);
  };
  let pauseEvents = 0;
  await Promise.all([
    listen("village-pause", () => {
      pauseEvents += 1;
      renderer.setPaused(true);
      pause();
    }),
    listen("village-resume", () => {
      pauseEvents += 1;
      renderer.setPaused(false);
      resume();
    }),
    listen<PreferencesSnapshot>("preferences-applied", (event) => apply(event.payload)),
  ]);
  const pauseCountBeforeSnapshot = pauseEvents;
  const [initial, settingsOpen] = await Promise.all([
    invoke<PreferencesSnapshot>("get_preferences"),
    invoke<boolean>("is_settings_open"),
  ]);
  apply(initial);
  if (pauseEvents === pauseCountBeforeSnapshot && settingsOpen) {
    renderer.setPaused(true);
    pause();
  }
}
