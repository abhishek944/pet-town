import { invoke } from "@tauri-apps/api/core";
import { byId } from "./settings-dom";

export function bindTownActions(): void {
  byId<HTMLButtonElement>("quit-pet-town").addEventListener("click", () => {
    void invoke("quit_pet_town");
  });
}
