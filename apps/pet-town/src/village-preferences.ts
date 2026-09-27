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
  await Promise.all([
    listen("village-pause", () => {
      renderer.setPaused(true);
      pause();
    }),
    listen("village-resume", () => {
      renderer.setPaused(false);
      resume();
    }),
    listen<PreferencesSnapshot>("preferences-applied", (event) => apply(event.payload)),
  ]);
  apply(await invoke<PreferencesSnapshot>("get_preferences"));
}
