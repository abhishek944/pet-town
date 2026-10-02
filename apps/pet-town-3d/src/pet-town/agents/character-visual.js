import { playerCharacter } from "../../player/character/player-character.js";
import { createPetCharacter } from "../pets/character.js";
import { getPetDefinition } from "../pets/catalog.js";
import { isolateCharacterMaterials, characterResourceDisposer } from "./resources.js";
import { applyAgentAppearance } from "./appearance.js";
import { agentSeed } from "./random.js";

export function createAgentVisual(metadata, petId) {
  const definition = getPetDefinition(petId);
  const character = definition
    ? createPetCharacter(petId, { isMayor: metadata.isMayor })
    : new playerCharacter();
  const visibility = character.visibility ?? isolateCharacterMaterials(character);
  const appearanceLabel = definition
    ? definition.species
    : applyAgentAppearance(character, agentSeed(metadata.id), metadata.isMayor);
  character.root.name = `Town companion: ${metadata.label}`;
  character.root.traverse((object) => {
    object.userData.townAgentId = metadata.id;
  });
  return {
    character,
    root: character.root,
    visibility,
    appearanceLabel,
    petId: definition?.id ?? null,
    _dispose: characterResourceDisposer(character),
  };
}

/** Replace only visuals; the controller/camera retain the same live record. */
export function replaceAgentVisual(context, record, visual) {
  visual.root.position.copy(record.position);
  visual.root.rotation.y = record.facing;
  visual.root.visible = record.root.visible;
  visual.character.phase = record.character.phase;
  // Both Pip and the pet cast use the same locomotion state. Preserve its
  // timing/blend when changing skins, including the last emitted foot beat.
  for (const key of ["t", "swimPhase", "runAmt", "swimSplashT"]) {
    visual.character[key] = record.character[key];
  }
  Object.assign(visual.character.w, record.character.w);
  visual.character.prevFoot = Math.floor((visual.character.phase + Math.PI / 2) / Math.PI);
  visual.character.prevFacing = record.facing;
  visual.character.prevSpeed = Math.hypot(record.body.vel.x, record.body.vel.z);
  const disposePrevious = record._dispose;
  context.scene.add(visual.root, visual.character.shadow);
  Object.assign(record, visual);
  visual.root.updateMatrixWorld(true);
  visual.character.head.getWorldPosition(record.head);
  disposePrevious();
}
