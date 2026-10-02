import { getPetDefinition } from "./catalog.js";
import { createPetCharacter } from "./character.js";
import { petRenderer, petStudio } from "./preview-scene.js";

const snapshots = new Map();
let renderer;
let unavailable = false;

function snapshot(id) {
  if (snapshots.has(id)) return snapshots.get(id);
  if (unavailable) return null;
  let studio;
  let pet;
  try {
    renderer ??= petRenderer(256, 192);
    studio = petStudio();
    pet = createPetCharacter(id);
    pet.root.rotation.y = 0.2;
    studio.scene.add(pet.root);
    studio.resize(256, 192);
    renderer.render(studio.scene, studio.camera);
    const source = renderer.domElement.toDataURL("image/png");
    snapshots.set(id, source);
    return source;
  } catch {
    unavailable = true;
    renderer?.dispose();
    renderer?.forceContextLoss();
    renderer = null;
    return null;
  } finally {
    pet?.dispose();
    studio?.dispose();
    renderer?.renderLists.dispose();
  }
}

export function createPetPortrait(petId) {
  const definition = getPetDefinition(petId);
  const span = document.createElement("span");
  span.className = "town-portrait";
  span.setAttribute("aria-hidden", "true");
  if (!definition) return span;
  span.style.background = `${definition.colors[0]}20`;
  const source = snapshot(petId);
  if (source) {
    const image = document.createElement("img");
    image.src = source;
    image.alt = "";
    image.draggable = false;
    image.style.cssText = "display:block;width:100%;height:100%;object-fit:contain";
    span.append(image);
  } else {
    span.textContent = definition.name.slice(0, 1);
    span.style.color = definition.colors[0];
  }
  return span;
}
