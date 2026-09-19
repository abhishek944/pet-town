import { SettingsGallery } from "./settings-gallery";

export class SettingsNavigation {
  readonly gallery: SettingsGallery;
  private readonly layout = document.querySelector<HTMLElement>(".settings-layout")!;
  private readonly galleryPage = document.getElementById("pets-gallery")!;
  private readonly inspector = document.querySelector<HTMLElement>(".inspector")!;
  private readonly footer = document.getElementById("settings-footer")!;
  private readonly message = document.getElementById("message")!;
  private readonly tabs = [...document.querySelectorAll<HTMLButtonElement>(".toolbar [data-tab]")];

  constructor(
    openPet: (id: string) => void,
    private readonly selectedPet: () => string,
  ) {
    this.gallery = new SettingsGallery(openPet);
    this.tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => {
        const name = tab.dataset.tab ?? "pet";
        this.show(name === "pet" ? "gallery" : name, true);
      });
      tab.addEventListener("keydown", (event) => {
        const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!step) return;
        event.preventDefault();
        const next = this.tabs[(index + step + this.tabs.length) % this.tabs.length];
        const name = next.dataset.tab ?? "pet";
        this.show(name === "pet" ? "gallery" : name);
        next.focus();
      });
    });
    document
      .getElementById("all-pets")!
      .addEventListener("click", () => this.show("gallery", true));
  }

  show(name: string, focus = false): void {
    const gallery = name === "gallery";
    const detail = name === "pet";
    this.layout.hidden = gallery;
    this.galleryPage.hidden = !gallery;
    this.gallery.setVisible(gallery);
    this.layout.dataset.tab = gallery ? "pet" : name;
    this.tabs.forEach((tab) => {
      const selected = tab.dataset.tab === (gallery ? "pet" : name);
      tab.classList.toggle("selected", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll<HTMLElement>("[data-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.panel !== name;
    });
    document.getElementById("preview")!.hidden = !detail;
    document.getElementById("preview-selectors")!.hidden = !detail;
    document.getElementById("reset-pet")!.hidden = !detail;
    document.getElementById("agents-done")!.hidden = name !== "agents";
    document.getElementById("gallery-hint")!.hidden = !gallery;
    this.footer.hidden = name === "about" || name === "studio";
    // One Apply/status pair always owns the same draft, regardless of view.
    const parent = gallery ? this.galleryPage : this.inspector;
    parent.append(this.message, this.footer);
    if (focus && gallery) this.gallery.restore(this.selectedPet());
    if (focus && detail) document.getElementById("all-pets")!.focus();
  }
}
