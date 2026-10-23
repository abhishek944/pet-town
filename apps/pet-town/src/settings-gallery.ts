import { characterDisplayName, isSystemPet } from "./character-packs";
import { friendlyPetName, type PreferencesFile } from "./preferences-types";
import { drawPortrait } from "./settings-gallery-portrait";

export class SettingsGallery {
  private readonly cards = new Map<string, HTMLButtonElement>();
  private readonly pendingPortraits = new Map<string, HTMLImageElement>();
  private visible = false;
  private activePortraits = 0;
  private portraitGeneration = new AbortController();
  private readonly collection = document.getElementById("pet-collection")!;
  private readonly count = document.getElementById("gallery-count")!;
  private ids: readonly string[] = [];
  private scrollTop = 0;
  private origin: string | undefined;

  constructor(private readonly openPet: (id: string) => void) {}

  update(ids: readonly string[], draft: PreferencesFile): void {
    if (ids.length !== this.ids.length || ids.some((id, index) => id !== this.ids[index])) {
      this.cancelPortraits();
      this.ids = [...ids];
      this.cards.clear();
      this.pendingPortraits.clear();
      this.collection.replaceChildren(...ids.map((id) => this.createCard(id)));
    }
    const includedCount = ids.filter((id) => draft.pets[id].includedInRandomCast).length;
    this.count.textContent = `${includedCount} of ${ids.length} included`;
    for (const [id, card] of this.cards) {
      const name =
        draft.pets[id].customName?.trim() || characterDisplayName(id) || friendlyPetName(id);
      card.querySelector<HTMLElement>(".name")!.textContent = name;
      const excluded = !draft.pets[id].includedInRandomCast;
      const origin = isSystemPet(id) ? "system pet" : "custom pet";
      card.classList.toggle("excluded", excluded);
      card.querySelector<HTMLElement>(".veil")!.hidden = !excluded;
      card.setAttribute(
        "aria-label",
        `${name}, ${origin}, ${excluded ? "excluded from" : "included in"} random cast`,
      );
    }
    if (this.visible) this.loadPortraits();
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    if (visible) this.loadPortraits();
    else this.cancelPortraits();
  }

  private cancelPortraits(): void {
    this.portraitGeneration.abort();
    this.portraitGeneration = new AbortController();
  }

  private loadPortraits(): void {
    while (this.visible && this.activePortraits < 2 && this.pendingPortraits.size > 0) {
      const [id, image] = this.pendingPortraits.entries().next().value!;
      this.pendingPortraits.delete(id);
      const signal = this.portraitGeneration.signal;
      this.activePortraits += 1;
      void drawPortrait(image, id, signal)
        .catch(() => {
          if (signal.aborted && image.isConnected && this.cards.get(id)?.contains(image))
            this.pendingPortraits.set(id, image);
        })
        .finally(() => {
          this.activePortraits -= 1;
          this.loadPortraits();
        });
    }
  }

  rememberOrigin(id: string): void {
    this.origin = id;
    this.scrollTop = this.collection.scrollTop;
  }

  restore(fallback?: string): void {
    const card = this.cards.get(this.origin ?? fallback ?? "");
    this.collection.scrollTop = this.scrollTop;
    card?.focus({ preventScroll: true });
    // A direct-entry pet may be outside the previously visible portion.
    if (!this.origin && card) card.scrollIntoView({ block: "nearest" });
  }

  directEntry(): void {
    this.origin = undefined;
  }

  private createCard(id: string): HTMLButtonElement {
    const name = characterDisplayName(id) ?? friendlyPetName(id);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card";
    card.dataset.petId = id;
    card.title = `${name} — open settings`;
    if (isSystemPet(id)) {
      const origin = document.createElement("span");
      origin.className = "system-tag";
      origin.textContent = "System";
      origin.setAttribute("aria-hidden", "true");
      card.append(origin);
    }
    const portrait = document.createElement("span");
    portrait.className = "portrait";
    portrait.setAttribute("aria-hidden", "true");
    const image = document.createElement("img");
    image.alt = "";
    const veil = document.createElement("span");
    veil.className = "veil";
    const badge = document.createElement("span");
    badge.textContent = "Excluded";
    veil.append(badge);
    portrait.append(image, veil);
    const label = document.createElement("span");
    label.className = "name";
    label.textContent = name;
    card.append(portrait, label);
    card.addEventListener("click", () => {
      this.rememberOrigin(id);
      this.openPet(id);
    });
    this.cards.set(id, card);
    this.pendingPortraits.set(id, image);
    return card;
  }
}
