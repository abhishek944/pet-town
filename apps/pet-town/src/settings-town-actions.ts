import { invoke } from "@tauri-apps/api/core";
import { byId } from "./settings-dom";

export function bindTownActions(reportError: (error: string) => void): void {
  byId<HTMLButtonElement>("quit-pet-town").addEventListener("click", () => {
    void invoke("quit_pet_town");
  });
  byId<HTMLButtonElement>("open-3d-town").addEventListener("click", async () => {
    try {
      await invoke("open_3d_town");
    } catch (error) {
      reportError(String(error));
    }
  });
}
