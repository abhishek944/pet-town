import { invoke } from "@tauri-apps/api/core";

const byId = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
type KeySource = "keychain" | "environment" | "missing";

export class AssistantKeySettings {
  constructor() {
    byId<HTMLButtonElement>("assistant-save-key").addEventListener("click", () => void this.save());
    byId<HTMLButtonElement>("assistant-import-key").addEventListener(
      "click",
      () => void this.importFromShell(),
    );
    void this.refresh();
  }

  private async refresh(): Promise<void> {
    try {
      const source = await invoke<KeySource>("openai_key_source");
      byId("assistant-key-source").textContent =
        source === "keychain"
          ? "Saved in macOS Keychain. Ready when Pet Town opens from the desktop."
          : source === "environment"
            ? "Available for this launch. Save it in Keychain for future desktop launches."
            : "No key saved. Add one here or import the key from ~/.zshrc.";
    } catch {
      byId("assistant-key-source").textContent = "Could not check the saved key.";
    }
  }

  private async save(): Promise<void> {
    const input = byId<HTMLInputElement>("assistant-api-key");
    const key = input.value.trim();
    if (!key) {
      this.feedback("Enter an API key first.");
      return;
    }
    await this.run(async () => {
      await invoke("save_openai_key", { key });
      input.value = "";
      this.feedback("Saved securely in macOS Keychain.");
    });
  }

  private async importFromShell(): Promise<void> {
    await this.run(async () => {
      await invoke("import_openai_key_from_shell");
      this.feedback("Imported from ~/.zshrc and saved in macOS Keychain.");
    });
  }

  private async run(action: () => Promise<void>): Promise<void> {
    const save = byId<HTMLButtonElement>("assistant-save-key");
    const importButton = byId<HTMLButtonElement>("assistant-import-key");
    save.disabled = true;
    importButton.disabled = true;
    this.feedback("Saving key…");
    try {
      await action();
      await this.refresh();
    } catch (error) {
      this.feedback(String(error ?? "Could not save the key."));
    } finally {
      save.disabled = false;
      importButton.disabled = false;
    }
  }

  private feedback(message: string): void {
    byId("assistant-key-feedback").textContent = message;
  }
}
