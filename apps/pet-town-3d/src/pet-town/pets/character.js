import { initializePlayerAnimationState } from "../../player/character/initialize-player-animation-state.js";
import { playerCharacterOnJump } from "../../player/character/player-character-on-jump.js";
import { playerCharacterOnLand } from "../../player/character/player-character-on-land.js";
import { playerCharacterOnGlide } from "../../player/character/player-character-on-glide.js";
import { playerCharacterOnStepUp } from "../../player/character/player-character-on-step-up.js";
import { playerCharacterOnBonk } from "../../player/character/player-character-on-bonk.js";
import { Group } from "three";
import { fox } from "./fox.js";
import { rabbit } from "./rabbit.js";
import { cat } from "./cat.js";
import { raccoon } from "./raccoon.js";
import { frog } from "./frog.js";
import { mushroom } from "./mushroom.js";
import { turtle } from "./turtle.js";
import { deer } from "./deer.js";
import { petMaterial } from "./material.js";
import { rigPetModel } from "./rig.js";
import { createPetShadow } from "./shadow.js";
import { animatePet } from "./animation.js";
import { disposePetResources } from "./dispose.js";

const builders = {
  maple: fox,
  clover: rabbit,
  juniper: cat,
  scout: raccoon,
  puddle: frog,
  moss: mushroom,
  mossback: turtle,
  fern: deer,
};

// Keep the speaking opening in front of each muzzle; the approved smile stays unchanged.
const speakingMouth = {
  maple: [1.49, 0.48],
  clover: [1.55, 0.405],
  juniper: [1.5, 0.46],
  scout: [1.49, 0.49],
  puddle: [1.58, 0.43],
  moss: [1.47, 0.285],
  mossback: [1.54, 0.38],
  fern: [1.49, 0.43],
};

export function createPetCharacter(petId, { isMayor = false } = {}) {
  if (!Object.hasOwn(builders, petId)) throw new Error("That pet is not available.");
  const build = builders[petId];
  const model = build();
  const rig = rigPetModel(model, speakingMouth[petId]);
  model.scale.setScalar(0.64);
  const root = new Group();
  root.name = `pet-${petId}`;
  root.userData.petId = petId;
  root.userData.isMayor = isMayor;
  root.add(model);
  const shadow = createPetShadow();
  const visibility = { value: 1 };
  const M = { blush: model.userData.blush ?? petMaterial("#e79a86") };
  let index = 0;
  model.traverse((object) => {
    if (!object.material) return;
    M[`pet${index++}`] = object.material;
    object.material.userData.visibility = visibility;
  });
  let disposed = false;
  const character = {
    root,
    model,
    shadow,
    visibility,
    M,
    ...rig,
    update(dt, frame) {
      return animatePet(character, dt, frame);
    },
    placeShadow(x, groundY, z, playerY, onWater) {
      shadow.visible = Number.isFinite(groundY);
      if (!shadow.visible) return;
      const proximity = Math.max(0.25, 1 - Math.max(0, playerY - groundY) / 7);
      shadow.position.set(x, groundY + 0.015, z);
      const scale = 0.82 * (0.55 + proximity * 0.45) * (onWater ? 1.1 : 1);
      shadow.scale.set(scale, 1, scale * 0.92);
      shadow.material.opacity =
        (onWater ? 0.18 : 0.44) * (0.3 + proximity * 0.7) * visibility.value;
    },
    onJump: playerCharacterOnJump,
    onLand: playerCharacterOnLand,
    onGlide: playerCharacterOnGlide,
    onStepUp: playerCharacterOnStepUp,
    onBonk: playerCharacterOnBonk,
    dispose() {
      if (disposed) return;
      disposed = true;
      disposePetResources(root, shadow);
      if (!model.userData.blush) M.blush.dispose();
    },
  };
  initializePlayerAnimationState.call(character);
  return character;
}
