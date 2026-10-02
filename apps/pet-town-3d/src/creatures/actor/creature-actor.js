import { creatureActorSecondary } from "./creature-actor-secondary.js";
import { creatureActorAnimate } from "./creature-actor-animate.js";
import { creatureActorMove } from "./creature-actor-move.js";
import { creatureActorPosed } from "./creature-actor-posed.js";
import { creatureActorPlayTick } from "./creature-actor-play-tick.js";
import { creatureActorTryPlay } from "./creature-actor-try-play.js";
import { creatureActorChooseNext } from "./creature-actor-choose-next.js";
import { creatureActorFindShore } from "./creature-actor-find-shore.js";
import { creatureActorStartFlee } from "./creature-actor-start-flee.js";
import { creatureActorRandomLook } from "./creature-actor-random-look.js";
import { creatureActorArrived } from "./creature-actor-arrived.js";
import { creatureActorThink } from "./creature-actor-think.js";
import { creatureActorPickTarget } from "./creature-actor-pick-target.js";
import { creatureActorPushOutOfWalls } from "./creature-actor-push-out-of-walls.js";
import { creatureActorCanSlideTo } from "./creature-actor-can-slide-to.js";
import { creatureActorCanStandAt } from "./creature-actor-can-stand-at.js";
import { creatureActorEmote } from "./creature-actor-emote.js";
import { creatureActorSetState } from "./creature-actor-set-state.js";
import { getCreatureActorSwimmer } from "./get-creature-actor-swimmer.js";
import { getCreatureActorFlyer } from "./get-creature-actor-flyer.js";
import { getCreatureActorHeadWorld } from "./get-creature-actor-head-world.js";
import { creatureActorPet } from "./creature-actor-pet.js";
import { initializeCreatureActor } from "./initialize-creature-actor.js";
export let creatureActor = class {
  constructor(species, variantIndex, x, z, random) {
    return initializeCreatureActor.call(this, species, variantIndex, x, z, random);
  }
  pet(options) {
    return creatureActorPet.call(this, options);
  }
  get headWorld() {
    return getCreatureActorHeadWorld.call(this);
  }
  get flyer() {
    return getCreatureActorFlyer.call(this);
  }
  get swimmer() {
    return getCreatureActorSwimmer.call(this);
  }
  setState(state, duration = 3) {
    return creatureActorSetState.call(this, state, duration);
  }
  emote(kind, duration = 1.6, force = false) {
    return creatureActorEmote.call(this, kind, duration, force);
  }
  canStandAt(x, z, previousHeight) {
    return creatureActorCanStandAt.call(this, x, z, previousHeight);
  }
  canSlideTo(x, z, previousHeight) {
    return creatureActorCanSlideTo.call(this, x, z, previousHeight);
  }
  pushOutOfWalls() {
    return creatureActorPushOutOfWalls.call(this);
  }
  pickTarget(radius, origin = this.home, options = {}) {
    return creatureActorPickTarget.call(this, radius, origin, options);
  }
  think(deltaTime, frame) {
    return creatureActorThink.call(this, deltaTime, frame);
  }
  arrived(radius) {
    return creatureActorArrived.call(this, radius);
  }
  randomLook() {
    return creatureActorRandomLook.call(this);
  }
  startFlee(threat) {
    return creatureActorStartFlee.call(this, threat);
  }
  findShore() {
    return creatureActorFindShore.call(this);
  }
  chooseNext(frame) {
    return creatureActorChooseNext.call(this, frame);
  }
  tryPlay(frame) {
    return creatureActorTryPlay.call(this, frame);
  }
  playTick(deltaTime, frame) {
    return creatureActorPlayTick.call(this, deltaTime, frame);
  }
  posed(deltaTime, frame) {
    return creatureActorPosed.call(this, deltaTime, frame);
  }
  move(deltaTime, frame) {
    return creatureActorMove.call(this, deltaTime, frame);
  }
  animate(deltaTime, frame) {
    return creatureActorAnimate.call(this, deltaTime, frame);
  }
  secondary(deltaTime) {
    return creatureActorSecondary.call(this, deltaTime);
  }
};
