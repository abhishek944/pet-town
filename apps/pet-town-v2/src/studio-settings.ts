import { invoke } from "@tauri-apps/api/core";
import { CAPABILITIES, type CapabilityId } from "@pet-town/core";
import { fallbackPetId, installCapabilityMapping, PETS, type CapabilityMapping } from "./pets";
import { runStudioInteractionPreview, startSpritePreview } from "./studio-preview";

export class StudioSettings {
  #selected: CapabilityId = "walk";
  #pet: string | null = null;
  #testRun = 0;
  #viewGeneration = 0;

  constructor(readonly rerender: () => void) {}

  #petId(): string {
    if (!this.#pet || !PETS[this.#pet]) this.#pet = fallbackPetId();
    return this.#pet;
  }

  markup(): string {
    const petId = this.#petId();
    const petName = PETS[petId]?.name ?? "Pet";
    const options = Object.values(PETS)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map(
        (pet) =>
          `<option value="${pet.id}"${pet.id === petId ? " selected" : ""}>${pet.name}</option>`,
      )
      .join("");
    const capabilities: CapabilityId[] = ["walk", "wave"];
    return `<header><h1>Capabilities</h1><p>Map reviewed sprite sheets to trusted engine behaviors.</p></header><div class="studio-layout"><section class="studio-preview"><div class="studio-sprite" role="img" aria-label="${petName} ${CAPABILITIES[this.#selected].label} animation preview"></div><small>Preview: ${petName} · ${CAPABILITIES[this.#selected].label}</small></section><section class="capabilities">${capabilities
      .map((id) => {
        const ready = Boolean(PETS[petId]?.assets[id]);
        return `<button type="button" class="capability ${id === this.#selected ? "selected" : ""}" data-capability="${id}"><i aria-hidden="true">${id === "walk" ? "🚶" : id === "throw" ? "🎾" : id === "catch" ? "🤲" : id === "wave" ? "👋" : "💤"}</i><span><b>${CAPABILITIES[id].label}</b><small>${ready ? `${id}-sheet · reviewed` : "Sprite sheet required"}</small></span><em class="${ready ? "ready" : "needs"}">${ready ? "Ready" : "Map…"}</em></button>`;
      })
      .join(
        "",
      )}<label class="field"><span>Pet</span><select id="studio-pet">${options}</select></label><label class="field"><span>Sheet frames</span><select id="studio-frames"><option value="4">4 frames</option><option value="6" selected>6 frames</option><option value="8">8 frames</option></select></label><button id="test-capability" class="button primary wide" type="button">Test selected interaction</button><button id="import-capability" class="button secondary wide" type="button">Import selected sprite sheet…</button><input id="capability-file" class="sr-only" type="file" accept="image/png,.png"><p id="studio-message" class="studio-message" role="status" aria-live="polite"></p></section></div><aside class="callout"><b>Safe by design</b><span>Pet Studio validates PNG geometry and stores asset metadata only. It never accepts executable code or custom behavior graphs.</span></aside>`;
  }

  deactivate(): void {
    this.#viewGeneration += 1;
  }

  bind(content: HTMLElement): void {
    const viewGeneration = ++this.#viewGeneration;
    this.#configurePreview(content);
    content.querySelector<HTMLSelectElement>("#studio-pet")?.addEventListener("change", (event) => {
      this.#pet = (event.target as HTMLSelectElement).value;
      this.rerender();
      document.querySelector<HTMLSelectElement>("#studio-pet")?.focus();
    });
    const native = "__TAURI_INTERNALS__" in window;
    content.querySelectorAll<HTMLButtonElement>("[data-capability]").forEach((button) => {
      button.addEventListener("click", () => {
        this.#selected = button.dataset.capability as CapabilityId;
        const needsMapping = !PETS[this.#petId()]?.assets[this.#selected];
        this.rerender();
        if (needsMapping && native) this.#required<HTMLInputElement>("#capability-file").click();
        else if (needsMapping) this.#message("Sprite-sheet import is available in the native app.");
      });
    });
    const fileInput = content.querySelector<HTMLInputElement>("#capability-file");
    const importButton = content.querySelector<HTMLButtonElement>("#import-capability");
    if (!native) {
      if (fileInput) fileInput.disabled = true;
      if (importButton) {
        importButton.disabled = true;
        importButton.textContent = "Import sprite sheet in native app";
        importButton.title = "Sprite-sheet import is available in the native app";
      }
    }
    importButton?.addEventListener("click", () => {
      if (native) fileInput?.click();
      else this.#message("Sprite-sheet import is available in the native app.");
    });
    content.querySelector("#test-capability")?.addEventListener("click", () => {
      void this.#testPreview(content);
    });
    fileInput?.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      const frames = Number(content.querySelector<HTMLSelectElement>("#studio-frames")?.value ?? 6);
      const capability = this.#selected;
      const petId = this.#petId();
      if (file)
        void this.#import(file, frames, capability, petId, viewGeneration).catch(
          (error: unknown) => {
            if (viewGeneration === this.#viewGeneration)
              this.#message(
                error instanceof Error ? error.message : "Could not map the sprite sheet.",
              );
          },
        );
    });
  }

  async #testPreview(content: HTMLElement): Promise<void> {
    const capability = this.#selected;
    const asset = PETS[this.#petId()]?.assets[capability];
    const preview = content.querySelector<HTMLElement>(".studio-sprite");
    const container = content.querySelector<HTMLElement>(".studio-preview");
    if (!asset || !preview || !container) {
      this.#message(
        `Map a reviewed ${CAPABILITIES[capability].label} sprite sheet before testing.`,
      );
      return;
    }
    const run = ++this.#testRun;
    this.#message(`Testing ${CAPABILITIES[capability].label} with the selected sprite sheet…`);
    await runStudioInteractionPreview(
      container,
      preview,
      asset,
      capability,
      document.documentElement.classList.contains("reduced-motion"),
    );
    if (run === this.#testRun && preview.isConnected)
      this.#message(`${CAPABILITIES[capability].label} interaction preview completed.`);
  }

  async #import(
    file: File,
    frames: number,
    capability: CapabilityId,
    petId: string,
    viewGeneration: number,
  ): Promise<void> {
    if (file.type !== "image/png" || file.size > 20 * 1024 * 1024)
      throw new Error("Choose a PNG sprite sheet under 20 MB.");
    const bitmap = await createImageBitmap(file);
    if (bitmap.width % frames !== 0 || bitmap.width > 8192 || bitmap.height > 4096) {
      bitmap.close();
      throw new Error(`The sheet width must divide evenly into ${frames} frames.`);
    }
    bitmap.close();
    this.#message("Validating and saving sprite sheet…");
    const bytes = [...new Uint8Array(await file.arrayBuffer())];
    if (!("__TAURI_INTERNALS__" in window))
      throw new Error("Sprite-sheet import is available in the native app.");
    if (viewGeneration !== this.#viewGeneration || petId !== this.#petId()) return;
    const mapping = await invoke<CapabilityMapping>("save_capability_mapping", {
      petId,
      capability,
      bytes,
      frames,
    });
    if (!installCapabilityMapping(mapping))
      throw new Error(`${CAPABILITIES[capability].label} is not enabled for this pet.`);
    if (viewGeneration !== this.#viewGeneration) return;
    this.rerender();
    this.#message(`${CAPABILITIES[capability].label} is mapped and ready to test.`);
  }

  #configurePreview(content: HTMLElement): void {
    const preview = content.querySelector<HTMLElement>(".studio-sprite");
    const asset = PETS[this.#petId()]?.assets[this.#selected];
    if (!preview || !asset) return;
    preview.style.backgroundImage = `url(${JSON.stringify(asset.path)})`;
    preview.style.backgroundSize = `${asset.frames * 100}% 100%`;
    startSpritePreview(
      preview,
      asset,
      document.documentElement.classList.contains("reduced-motion"),
    );
  }

  #message(value: string): void {
    const message = document.querySelector<HTMLElement>("#studio-message");
    if (message) message.textContent = value;
  }

  #required<T extends Element>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) throw new Error(`Required Studio control is missing: ${selector}`);
    return element;
  }
}
