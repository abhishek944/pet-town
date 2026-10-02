import { playerCharacterPlaceShadow } from "./player-character-place-shadow.js";
import { updatePlayerCharacter } from "./update-player-character.js";
import { playerCharacterOnBonk } from "./player-character-on-bonk.js";
import { playerCharacterOnStepUp } from "./player-character-on-step-up.js";
import { playerCharacterOnGlide } from "./player-character-on-glide.js";
import { playerCharacterOnLand } from "./player-character-on-land.js";
import { playerCharacterOnJump } from "./player-character-on-jump.js";
import { playerCharacterReset } from "./player-character-reset.js";
import { initializePlayerCharacter } from "./initialize-player-character.js";
export let playerCharacter = class {
  constructor() {
    return initializePlayerCharacter.call(this);
  }
  reset() {
    return playerCharacterReset.call(this);
  }
  onJump() {
    return playerCharacterOnJump.call(this);
  }
  onLand(impact) {
    return playerCharacterOnLand.call(this, impact);
  }
  onGlide() {
    return playerCharacterOnGlide.call(this);
  }
  onStepUp() {
    return playerCharacterOnStepUp.call(this);
  }
  onBonk() {
    return playerCharacterOnBonk.call(this);
  }
  update(deltaTime, frame) {
    return updatePlayerCharacter.call(this, deltaTime, frame);
  }
  placeShadow(x, groundY, z, playerY, onWater) {
    return playerCharacterPlaceShadow.call(this, x, groundY, z, playerY, onWater);
  }
};
