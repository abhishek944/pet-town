import markup from "./pet-gallery.html?raw";
import styles from "./pet-gallery.css?raw";
import { installGameStyles } from "../../core/install-game-styles.js";
import { PET_CATALOG, getPetDefinition } from "../../pet-town/pets/catalog.js";
import { createPetPreview, createPetPortrait } from "../../pet-town/pets/preview.js";

/** Keep a gallery draft separate from the companion the controller follows. */
export function bindPetGallery(root, context) {
  installGameStyles("town-pet-gallery-css", styles);
  installGameStyles(
    "town-pet-colors-css",
    PET_CATALOG.flatMap((pet) =>
      pet.colors.map(
        (color, index) =>
          `#hud .town-settings [data-pet-color="${pet.id}-${index}"] { background: ${color}; }`,
      ),
    ).join("\n"),
  );
  const profile = root.querySelector("[data-companion-profile]");
  const gallery = root.querySelector("[data-pet-gallery]");
  const change = root.querySelector('[data-control="change-pet"]');
  const body = root.querySelector(".settings-body");
  let visible = false,
    target = null,
    draft = PET_CATALOG[0]?.id;
  let preview = null,
    initialized = false,
    previewError = "",
    message = "";
  const town = () => context.petTown;
  const field = (name) => gallery.querySelector(`[data-pet="${name}"]`);
  const cards = new Map();
  function initialize() {
    if (initialized) return;
    initialized = true;
    gallery.innerHTML = markup;
    gallery.querySelector(".pet-pill").textContent = `${PET_CATALOG.length} pets`;
    for (const pet of PET_CATALOG) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "pet-card";
      card.setAttribute("aria-label", `${pet.name}, ${pet.species}`);
      card.innerHTML =
        '<span class="pet-check" aria-hidden="true">✓</span>' +
        '<span class="pet-thumb" aria-hidden="true"></span><strong></strong><small></small>';
      card.querySelector(".pet-thumb").append(createPetPortrait(pet.id));
      card.querySelector("strong").textContent = pet.name;
      card.querySelector("small").textContent = pet.species;
      card.onclick = () => {
        selectPet(pet.id);
        body.scrollTop = 0;
      };
      gallery.querySelector(".pet-gallery").append(card);
      cards.set(pet.id, card);
    }
    field("back").onclick = () => {
      gallery.hidden = true;
      profile.hidden = false;
      root.classList.remove("pet-gallery-open");
      preview?.setActive(false);
      body.scrollTop = 0;
      change.focus({ preventScroll: true });
    };
    field("turn").onclick = () => preview?.turn();
    field("use").onclick = apply;
  }
  function selectPet(id) {
    const pet = getPetDefinition(id);
    if (!pet) return;
    draft = id;
    message = "";
    gallery
      .querySelector(".pet-stage")
      .setAttribute("aria-label", `3D preview of ${pet.name}, ${pet.species}`);
    for (const name of ["name", "species", "description", "trait"])
      field(name).textContent = pet[name];
    field("colors").replaceChildren(
      ...pet.colors.map((color, index) => {
        const dot = document.createElement("span");
        dot.dataset.petColor = `${id}-${index}`;
        return dot;
      }),
    );
    for (const [petId, card] of cards) card.setAttribute("aria-pressed", String(petId === id));
    if (preview) preview.setPet(id);
    render();
  }
  function validTarget() {
    return (
      target &&
      town()?.controller.selected === target &&
      town()?.agents.records.get(target.id) === target
    );
  }
  function apply() {
    if (!validTarget()) {
      message = "Your companion changed or left. Go back and choose a companion again.";
      render();
      return;
    }
    try {
      town().agents.setPet(target.id, draft);
      message = `Pet saved for ${target.label}. Its name and work status stay the same.`;
    } catch (error) {
      message = String(error.message ?? error);
    }
    render();
  }
  function render() {
    if (!initialized || gallery.hidden) return;
    const valid = validTarget();
    const applied = valid && target.petId === draft;
    field("use").disabled = !valid || applied;
    field("use").textContent = applied
      ? "Current pet"
      : `Use ${getPetDefinition(draft)?.name ?? "pet"}`;
    const notice = !target
      ? "Choose a companion in Companion controls to use a pet. Check the town connection if none appear."
      : !valid
        ? "Your companion changed or left. Go back and choose a companion again."
        : message ||
          previewError ||
          `For ${target.label} · ${applied ? "your current pet" : "preview only"}`;
    if (field("notice").textContent !== notice) field("notice").textContent = notice;
    preview?.setActive(visible && !root.hidden && !gallery.hidden);
  }
  change.onclick = () => {
    initialize();
    target = town()?.controller.selected ?? null;
    message = "";
    profile.hidden = true;
    gallery.hidden = false;
    root.classList.add("pet-gallery-open");
    draft = getPetDefinition(target?.petId)?.id ?? PET_CATALOG[0]?.id;
    selectPet(draft);
    if (!preview) {
      try {
        preview = createPetPreview(gallery.querySelector(".pet-model"), draft);
      } catch (error) {
        previewError = "3D preview unavailable. You can still choose a pet from the cards.";
        field("turn").disabled = true;
      }
    }
    render();
    body.scrollTop = 0;
    field("back").focus({ preventScroll: true });
  };
  return {
    render,
    setVisible(value) {
      visible = value;
      preview?.setActive(visible && !root.hidden && !gallery.hidden);
    },
  };
}
