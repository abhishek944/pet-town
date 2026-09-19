import { behaviorPackForCharacter, characterDisplayName, isSystemPet } from "./character-packs";
import { friendlyPetName, type PreferencesFile } from "./preferences-types";
import { previewAnimations } from "./settings-preview";
import { loadImageSource } from "./image-source";

/** A settled first frame, without adding a second set of pet assets. */
async function drawPortrait(image: HTMLImageElement, petId: string): Promise<void> {
  try {
    const canvas = document.createElement("canvas");
    const options = previewAnimations(behaviorPackForCharacter(petId));
    const animation = options.find((item) => item.locomotion) ?? options[0];
    if (!animation) throw new Error("No preview animation");
    const source = await loadImageSource(animation.assetUrl);
    canvas.width = source.naturalWidth;
    canvas.height = source.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not draw preview");
    context.drawImage(source, 0, 0);
    image.src = canvas.toDataURL("image/png");
    await image.decode();
    image.dataset.ready = "true";
  } catch {
    const fallback = document.createElement("span");
    fallback.className = "portrait-error";
    fallback.textContent = "Preview unavailable";
    image.replaceWith(fallback);
  }
}

export class SettingsGallery {
  private readonly cards = new Map<string, HTMLButtonElement>();
  private readonly pendingPortraits = new Map<string, HTMLImageElement>();
  private visible = false;
  private readonly collection = document.getElementById("pet-collection")!;
  private readonly count = document.getElementById("gallery-count")!;
  private ids: readonly string[] = [];
  private scrollTop = 0;
  private origin: string | undefined;

  constructor(private readonly openPet: (id: string) => void) {}

  update(ids: readonly string[], draft: PreferencesFile): void {
    if (ids.length !== this.ids.length || ids.some((id, index) => id !== this.ids[index])) {
      this.ids = [...ids];
      this.cards.clear();
      this.pendingPortraits.clear();
      this.collection.replaceChildren(...ids.map((id) => this.createCard(id)));
    }
    const includedCount = ids.filter((id) => draft.pets[id].includedInRandomCast).length;
    this.count.textContent = `${includedCount} of ${ids.length} included`;
    for (const [id, card] of this.cards) {
      const excluded = !draft.pets[id].includedInRandomCast;
      const origin = isSystemPet(id) ? "system pet" : "custom pet";
      card.classList.toggle("excluded", excluded);
      card.querySelector<HTMLElement>(".veil")!.hidden = !excluded;
      card.setAttribute(
        "aria-label",
        `${characterDisplayName(id) ?? friendlyPetName(id)}, ${origin}, ${excluded ? "excluded from" : "included in"} random cast`,
      );
    }
    if (this.visible) this.loadPortraits();
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    if (visible) this.loadPortraits();
  }

  private loadPortraits(): void {
    for (const [id, image] of this.pendingPortraits) void drawPortrait(image, id);
    this.pendingPortraits.clear();
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
